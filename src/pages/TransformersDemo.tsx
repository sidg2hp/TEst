import { useState } from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { ApiKeyGuide } from '@/components/ApiKeyGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TransformerModel, TransformerAnalysisResult } from '@/types';
import { huggingFaceService, sentimentAnalysisService } from '@/services';
import { PLACEHOLDERS } from '@/config';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';

export function TransformersDemo() {
  const [selectedModel, setSelectedModel] = useState<TransformerModel | null>(null);
  const [customModelId, setCustomModelId] = useState('');
  const [analysisText, setAnalysisText] = useState(
    'I love this new product! It works exactly as expected and the customer service was amazing. Highly recommend to everyone!'
  );
  const [result, setResult] = useState<TransformerAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchTexts, setBatchTexts] = useState('');
  const [batchResults, setBatchResults] = useState<TransformerAnalysisResult[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedModel || !analysisText.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysisResult = await huggingFaceService.analyzeSentiment(
        analysisText,
        selectedModel.modelId
      );
      setResult(analysisResult);
    } catch (error) {
      setResult({
        predictions: [],
        modelUsed: selectedModel.modelId,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchAnalyze = async () => {
    if (!selectedModel || !batchTexts.trim()) return;

    const texts = batchTexts.split('\n').filter(t => t.trim());
    if (texts.length === 0) return;

    setIsBatchAnalyzing(true);
    setBatchResults([]);

    try {
      const results: TransformerAnalysisResult[] = [];
      
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i].trim();
        if (text) {
          const result = await huggingFaceService.analyzeSentiment(text, selectedModel.modelId);
          results.push(result);
          setBatchResults([...results]); // Update UI progressively
          
          // Small delay to avoid rate limiting
          if (i < texts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
    } catch (error) {
      console.error('Batch analysis failed:', error);
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getRecommendedTexts = () => [
    'I love this new product! It works exactly as expected.',
    'The service was terrible and I want my money back.',
    'The product is okay, nothing special but does the job.',
    'Amazing experience! Will definitely buy again.',
    'Complete waste of money, very disappointed.',
    'Average quality for the price point.',
  ];

  const loadSampleTexts = () => {
    setBatchTexts(getRecommendedTexts().join('\n'));
  };

  const overallStats = batchResults.length > 0 ? sentimentAnalysisService.calculateStatistics(
    batchResults.map((r, i) => ({
      requestId: i,
      sentiment: huggingFaceService.convertToSentiment(r.predictions).sentiment,
      confidence: huggingFaceService.convertToSentiment(r.predictions).confidence,
      timestamp: Date.now(),
    }))
  ) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transformers Demo</h1>
        <p className="text-muted-foreground">
          Test Hugging Face Transformers models for sentiment analysis
        </p>
      </div>

      {/* API Key Guide */}
      <ApiKeyGuide />

      {/* Model Selection */}
      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        customModelId={customModelId}
        onCustomModelChange={setCustomModelId}
        showApiKeyInput={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Single Text Analysis
            </CardTitle>
            <CardDescription>
              Analyze a single piece of text for sentiment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="analysisText">Text to Analyze</Label>
              <Textarea
                id="analysisText"
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                placeholder={PLACEHOLDERS.TEXT_ANALYSIS}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Characters: {analysisText.length}</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setAnalysisText(getRecommendedTexts()[0])}
                  className="p-0 h-auto"
                >
                  Use sample text
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!selectedModel || !analysisText.trim() || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Sentiment
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Analysis Results
                </h4>
                
                {result.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {result.predictions.map((pred, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" 
                               style={{ opacity: pred.score }} />
                          <span className="capitalize font-medium">{pred.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pred.score * 100} className="w-20" />
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            {(pred.score * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.processingTime}ms
                      </div>
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        {result.modelUsed.split('/').pop()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Batch Analysis
            </CardTitle>
            <CardDescription>
              Analyze multiple texts at once (one per line)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchTexts">Texts to Analyze</Label>
              <Textarea
                id="batchTexts"
                value={batchTexts}
                onChange={(e) => setBatchTexts(e.target.value)}
                placeholder="Enter multiple texts, one per line..."
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Lines: {batchTexts.split('\n').filter(t => t.trim()).length}</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={loadSampleTexts}
                  className="p-0 h-auto"
                >
                  Load sample texts
                </Button>
              </div>
            </div>

            <Button
              onClick={handleBatchAnalyze}
              disabled={!selectedModel || !batchTexts.trim() || isBatchAnalyzing}
              className="w-full"
            >
              {isBatchAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing {batchResults.length}/{batchTexts.split('\n').filter(t => t.trim()).length}...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze All
                </>
              )}
            </Button>

            {batchResults.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <Separator />
                <h4 className="font-medium">Batch Results ({batchResults.length})</h4>
                
                {batchResults.map((result, index) => {
                  const sentiment = huggingFaceService.convertToSentiment(result.predictions);
                  const SentimentIcon = getSentimentIcon(sentiment.sentiment);
                  
                  return (
                    <div key={index} className="p-2 border rounded">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <SentimentIcon className="w-4 h-4" />
                          <span className="text-sm font-medium capitalize">
                            {sentiment.sentiment}
                          </span>
                        </div>
                        <Badge className={getSentimentColor(sentiment.sentiment)}>
                          {sentiment.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {batchTexts.split('\n')[index]?.trim()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {overallStats && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Analysis Statistics</CardTitle>
            <CardDescription>
              Overall sentiment distribution from batch analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{overallStats.positive}</div>
                <div className="text-sm text-muted-foreground">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{overallStats.neutral}</div>
                <div className="text-sm text-muted-foreground">Neutral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{overallStats.negative}</div>
                <div className="text-sm text-muted-foreground">Negative</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallStats.averageConfidence}%</div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
