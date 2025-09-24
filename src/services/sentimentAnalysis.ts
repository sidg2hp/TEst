import { huggingFaceService } from './huggingface';
import { Agent, TransformerAnalysisResult, SentimentResult } from '@/types';
import { TRANSFORMERS_CONFIG } from '@/config';

/**
 * Service for performing sentiment analysis using various AI models
 */
export class SentimentAnalysisService {
  /**
   * Analyze sentiment using an agent's configured model
   */
  async analyzeWithAgent(
    agent: Agent, 
    text: string, 
    requestId: number
  ): Promise<SentimentResult> {
    try {
      // Determine which model to use
      let modelId: string;
      
      if (agent.transformerModel) {
        modelId = agent.transformerModel.modelId;
      } else if (agent.customModelId) {
        modelId = agent.customModelId;
      } else {
        // Fallback to a default model if none specified
        modelId = TRANSFORMERS_CONFIG.DEFAULT_MODELS[0].modelId;
      }

      // Perform the analysis
      const result = await huggingFaceService.analyzeSentiment(text, modelId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Convert to standard sentiment format
      const sentiment = huggingFaceService.convertToSentiment(result.predictions);

      return {
        requestId,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        timestamp: Date.now(),
      };

    } catch (error) {
      // Return a neutral result with low confidence if analysis fails
      console.error('Sentiment analysis failed:', error);
      return {
        requestId,
        sentiment: 'neutral',
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Test an agent's model configuration
   */
  async testAgentModel(agent: Agent, testText?: string): Promise<TransformerAnalysisResult> {
    const text = testText || 'This is a test message for sentiment analysis.';
    
    let modelId: string;
    
    if (agent.transformerModel) {
      modelId = agent.transformerModel.modelId;
    } else if (agent.customModelId) {
      modelId = agent.customModelId;
    } else {
      throw new Error('No model configured for this agent');
    }

    return await huggingFaceService.analyzeSentiment(text, modelId);
  }

  /**
   * Batch analyze multiple texts with the same agent
   */
  async batchAnalyze(
    agent: Agent, 
    texts: string[], 
    startingRequestId: number
  ): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const result = await this.analyzeWithAgent(
        agent, 
        texts[i], 
        startingRequestId + i
      );
      results.push(result);
      
      // Add a small delay to avoid rate limiting
      if (i < texts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get supported models for sentiment analysis
   */
  getSupportedModels() {
    return huggingFaceService.getDefaultModels();
  }

  /**
   * Validate if a model is suitable for sentiment analysis
   */
  async validateModel(modelId: string) {
    return await huggingFaceService.validateModel(modelId);
  }

  /**
   * Get model recommendations based on use case
   */
  getModelRecommendations(useCase?: string) {
    const models = this.getSupportedModels();
    
    if (!useCase) {
      return models;
    }

    // Filter models based on use case
    switch (useCase.toLowerCase()) {
      case 'financial':
      case 'finance':
      case 'trading':
        return models.filter(m => m.id.includes('financial'));
      
      case 'social':
      case 'twitter':
      case 'social media':
        return models.filter(m => m.description.toLowerCase().includes('twitter') || 
                                  m.description.toLowerCase().includes('social'));
      
      case 'reviews':
      case 'product':
      case 'ecommerce':
        return models.filter(m => m.description.toLowerCase().includes('review'));
      
      case 'emotions':
      case 'emotion':
        return models.filter(m => m.id.includes('emotion'));
      
      default:
        return models.filter(m => m.id.includes('general'));
    }
  }

  /**
   * Calculate sentiment statistics from multiple results
   */
  calculateStatistics(results: SentimentResult[]) {
    if (results.length === 0) {
      return {
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        averageConfidence: 0,
        distribution: { positive: 0, neutral: 0, negative: 0 }
      };
    }

    const counts = {
      positive: results.filter(r => r.sentiment === 'positive').length,
      neutral: results.filter(r => r.sentiment === 'neutral').length,
      negative: results.filter(r => r.sentiment === 'negative').length,
    };

    const total = results.length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;

    return {
      total,
      ...counts,
      averageConfidence: Math.round(averageConfidence),
      distribution: {
        positive: Math.round((counts.positive / total) * 100),
        neutral: Math.round((counts.neutral / total) * 100),
        negative: Math.round((counts.negative / total) * 100),
      }
    };
  }

  /**
   * Format analysis results for display
   */
  formatResult(result: SentimentResult) {
    const emoji = {
      positive: '😊',
      neutral: '😐',
      negative: '😞'
    };

    const color = {
      positive: 'text-green-600',
      neutral: 'text-yellow-600',
      negative: 'text-red-600'
    };

    return {
      ...result,
      emoji: emoji[result.sentiment],
      colorClass: color[result.sentiment],
      confidenceText: `${result.confidence}%`,
      formattedTime: new Date(result.timestamp).toLocaleString(),
    };
  }
}

// Export singleton instance
export const sentimentAnalysisService = new SentimentAnalysisService();
