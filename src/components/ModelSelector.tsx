import { useState, useEffect } from 'react';
import { TransformerModel, ModelValidationResult } from '@/types';
import { huggingFaceService } from '@/services/huggingface';
import { TRANSFORMERS_CONFIG } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Brain, Zap } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: TransformerModel | null;
  onModelChange: (model: TransformerModel | null) => void;
  customModelId?: string;
  onCustomModelChange?: (modelId: string) => void;
  showApiKeyInput?: boolean;
}

export function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  customModelId = '',
  onCustomModelChange,
  showApiKeyInput = false
}: ModelSelectorProps) {
  const [mode, setMode] = useState<'default' | 'custom'>('default');
  const [customModel, setCustomModel] = useState(customModelId);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [validationResult, setValidationResult] = useState<ModelValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [testText, setTestText] = useState('I love this product, it works great!');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyHelper, setShowApiKeyHelper] = useState(false);

  const defaultModels = huggingFaceService.getDefaultModels();

  // Validate custom model when it changes
  useEffect(() => {
    if (mode === 'custom' && customModel.trim()) {
      validateCustomModel(customModel.trim());
    } else {
      setValidationResult(null);
    }
  }, [customModel, mode]);

  const validateCustomModel = async (modelId: string) => {
    setIsValidating(true);
    try {
      const result = await huggingFaceService.validateModel(modelId);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleModeChange = (newMode: 'default' | 'custom') => {
    setMode(newMode);
    if (newMode === 'default') {
      setValidationResult(null);
      onModelChange(null);
    } else {
      onModelChange(null);
    }
  };

  const handleDefaultModelSelect = (modelId: string) => {
    const model = defaultModels.find(m => m.id === modelId);
    if (model) {
      onModelChange(model);
    }
  };

  const handleCustomModelSubmit = () => {
    if (validationResult?.isValid && customModel.trim()) {
      const model = huggingFaceService.createCustomModel(
        customModel.trim(),
        customName.trim() || undefined,
        customDescription.trim() || undefined
      );
      onModelChange(model);
      onCustomModelChange?.(customModel.trim());
    }
  };

  const testModel = async () => {
    if (!selectedModel || !testText.trim()) return;

    setIsTesting(true);
    try {
      // Set API key if provided
      if (apiKey.trim()) {
        huggingFaceService.setApiKey(apiKey.trim());
      }
      
      const result = await huggingFaceService.analyzeSentiment(
        testText,
        selectedModel.modelId
      );
      setTestResult(result);
      setShowApiKeyHelper(false); // Hide helper if test succeeds
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      setTestResult({
        error: errorMessage,
        predictions: [],
        modelUsed: selectedModel.modelId,
        processingTime: 0,
      });
      
      // Show API key helper if it's an auth error
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('API key')) {
        setShowApiKeyHelper(true);
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Select Transformer Model
          </CardTitle>
          <CardDescription>
            Choose a pre-configured model or specify your own Hugging Face model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Input */}
          {(showApiKeyInput || showApiKeyHelper) && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">Hugging Face API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="hf_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your free API key from{' '}
                <a 
                  href="https://huggingface.co/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Hugging Face Settings
                </a>
                {' '}for faster inference and higher rate limits.
              </p>
              {showApiKeyHelper && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This model requires authentication. Please provide your Hugging Face API key above or try a different model.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'default' ? 'default' : 'outline'}
              onClick={() => handleModeChange('default')}
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Pre-configured Models
            </Button>
            <Button
              variant={mode === 'custom' ? 'default' : 'outline'}
              onClick={() => handleModeChange('custom')}
              size="sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              Custom Model
            </Button>
          </div>

          {/* Default Models */}
          {mode === 'default' && (
            <div className="space-y-3">
              <Label>Choose a pre-configured model:</Label>
              <Select
                value={selectedModel?.id || ''}
                onValueChange={handleDefaultModelSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  {defaultModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.modelId}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedModel && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{selectedModel.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedModel.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedModel.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Model */}
          {mode === 'custom' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customModel">Hugging Face Model ID</Label>
                <Input
                  id="customModel"
                  placeholder="e.g., cardiffnlp/twitter-roberta-base-sentiment-latest"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
                {isValidating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating model...
                  </div>
                )}
                {validationResult && (
                  <Alert variant={validationResult.isValid ? 'default' : 'destructive'}>
                    {validationResult.isValid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {validationResult.isValid
                        ? `Model validated successfully! Task: ${validationResult.modelInfo?.task}`
                        : validationResult.error
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {validationResult?.isValid && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="customName">Display Name (Optional)</Label>
                    <Input
                      id="customName"
                      placeholder="Custom model name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customDescription">Description (Optional)</Label>
                    <Textarea
                      id="customDescription"
                      placeholder="Describe what this model is optimized for..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleCustomModelSubmit}
                    disabled={!validationResult.isValid}
                    className="w-full"
                  >
                    Use This Model
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Testing */}
      {selectedModel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Test Model
            </CardTitle>
            <CardDescription>
              Test your selected model with sample text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testText">Test Text</Label>
              <Textarea
                id="testText"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to analyze..."
                rows={3}
              />
            </div>

            <Button
              onClick={testModel}
              disabled={!testText.trim() || isTesting}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Test Analysis'
              )}
            </Button>

            {testResult && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Results:</h4>
                {testResult.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{testResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {testResult.predictions.map((pred: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="capitalize">{pred.label}</span>
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          {(pred.score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground mt-2">
                      Processing time: {testResult.processingTime}ms
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
