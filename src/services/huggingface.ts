import { 
  TransformerAnalysisResult, 
  HuggingFaceResponse, 
  ModelValidationResult,
  TransformerModel 
} from '@/types';
import { TRANSFORMERS_CONFIG } from '@/config';

/**
 * Service for interacting with Hugging Face Inference API
 */
export class HuggingFaceService {
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_HUGGINGFACE_API_KEY || null;
    this.baseUrl = TRANSFORMERS_CONFIG.API_BASE_URL;
  }

  /**
   * Set the API key for authenticated requests
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Validate if a model exists and is accessible
   */
  async validateModel(modelId: string): Promise<ModelValidationResult> {
    try {
      const response = await fetch(`https://huggingface.co/api/models/${modelId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: `Model not found or not accessible: ${modelId}`,
        };
      }

      const modelInfo = await response.json();
      
      // Check if it's a text-classification model
      const isTextClassification = 
        modelInfo.pipeline_tag === 'text-classification' ||
        modelInfo.tags?.includes('text-classification') ||
        modelInfo.tags?.includes('sentiment-analysis');

      if (!isTextClassification) {
        return {
          isValid: false,
          error: 'Model is not suitable for text classification/sentiment analysis',
        };
      }

      return {
        isValid: true,
        modelInfo: {
          id: modelInfo.id,
          task: modelInfo.pipeline_tag || 'text-classification',
          library_name: modelInfo.library_name,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to validate model',
      };
    }
  }

  /**
   * Perform sentiment analysis using a Hugging Face model
   */
  async analyzeSentiment(
    text: string, 
    modelId: string
  ): Promise<TransformerAnalysisResult> {
    const startTime = Date.now();

    try {
      // Validate text length
      if (text.length > TRANSFORMERS_CONFIG.MAX_TEXT_LENGTH) {
        throw new Error(`Text too long. Maximum ${TRANSFORMERS_CONFIG.MAX_TEXT_LENGTH} characters allowed.`);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if available for faster inference and higher rate limits
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/${modelId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: text,
          parameters: {
            return_all_scores: true, // Get scores for all labels
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific HTTP status codes
        if (response.status === 401) {
          throw new Error(
            'Unauthorized: Hugging Face API key required. Please set VITE_HUGGINGFACE_API_KEY in your environment variables or use the API key setting in the demo.'
          );
        } else if (response.status === 429) {
          throw new Error(
            'Rate limit exceeded. Please wait a moment before trying again or add a Hugging Face API key for higher limits.'
          );
        } else if (response.status === 503) {
          throw new Error(
            'Model is currently loading. Please wait a few seconds and try again.'
          );
        }
        
        throw new Error(
          errorData.error || 
          errorData.message || 
          `API request failed with status ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // Handle different response formats
      let predictions: HuggingFaceResponse[];
      
      if (Array.isArray(result) && result.length > 0) {
        // Multiple predictions format (common)
        predictions = Array.isArray(result[0]) ? result[0] : result;
      } else if (result.label && result.score !== undefined) {
        // Single prediction format
        predictions = [result];
      } else {
        throw new Error('Unexpected response format from Hugging Face API');
      }

      // Ensure predictions are properly formatted
      predictions = predictions.map(pred => ({
        label: String(pred.label).toLowerCase(),
        score: Number(pred.score),
      }));

      // Sort by confidence score
      predictions.sort((a, b) => b.score - a.score);

      return {
        predictions,
        modelUsed: modelId,
        processingTime,
      };

    } catch (error) {
      return {
        predictions: [],
        modelUsed: modelId,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  /**
   * Get default transformer models
   */
  getDefaultModels(): TransformerModel[] {
    return TRANSFORMERS_CONFIG.DEFAULT_MODELS;
  }

  /**
   * Find a default model by ID
   */
  findDefaultModel(id: string): TransformerModel | undefined {
    return TRANSFORMERS_CONFIG.DEFAULT_MODELS.find(model => model.id === id);
  }

  /**
   * Create a custom transformer model configuration
   */
  createCustomModel(
    modelId: string, 
    name?: string, 
    description?: string
  ): TransformerModel {
    return {
      id: `custom-${Date.now()}`,
      name: name || modelId,
      modelId,
      description: description || `Custom model: ${modelId}`,
      task: 'text-classification',
      labels: ['negative', 'neutral', 'positive'], // Default labels
    };
  }

  /**
   * Convert transformer predictions to standard sentiment format
   */
  convertToSentiment(predictions: HuggingFaceResponse[]): {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
  } {
    if (predictions.length === 0) {
      return { sentiment: 'neutral', confidence: 0 };
    }

    const topPrediction = predictions[0];
    let sentiment: 'positive' | 'neutral' | 'negative';

    // Map various label formats to standard sentiment
    const label = topPrediction.label.toLowerCase();
    
    if (label.includes('positive') || label.includes('pos') || 
        label === 'joy' || label === 'love' || label === 'optimism' ||
        label.includes('5 stars') || label.includes('4 stars')) {
      sentiment = 'positive';
    } else if (label.includes('negative') || label.includes('neg') || 
               label === 'anger' || label === 'sadness' || label === 'pessimism' ||
               label.includes('1 star') || label.includes('2 stars')) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return {
      sentiment,
      confidence: Math.round(topPrediction.score * 100), // Convert to percentage
    };
  }

  /**
   * Test if the API is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use a simple, fast model for testing
      const result = await this.analyzeSentiment(
        'Hello world', 
        'cardiffnlp/twitter-roberta-base-sentiment-latest'
      );
      return !result.error;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const huggingFaceService = new HuggingFaceService();
