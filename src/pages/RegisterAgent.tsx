import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { WalletGuard } from '@/components/WalletGuard';
import { ModelSelector } from '@/components/ModelSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import { TransformerModel } from '@/types';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  PLACEHOLDERS, 
  UI_CONFIG,
  isValidUrl,
  isValidPrice 
} from '@/config';

export function RegisterAgent() {
  const [modelUrl, setModelUrl] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedModel, setSelectedModel] = useState<TransformerModel | null>(null);
  const [customModelId, setCustomModelId] = useState('');

  const { registerAgent } = useContract();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !price) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use the selected model's ID, or custom model ID if provided
      const modelToUse = customModelId || selectedModel.modelId;
      await registerAgent(modelToUse, price);
      setSuccess(true);
      setModelUrl('');
      setPrice('');
      setSelectedModel(null);
      setCustomModelId('');
      toast({
        title: "Success",
        description: SUCCESS_MESSAGES.AGENT_REGISTERED,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.FAILED_TO_REGISTER_AGENT;
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const isFormValid = price && isValidPrice(price) && selectedModel;

  return (
    <WalletGuard>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register Agent</h1>
          <p className="text-muted-foreground">
            Register your AI sentiment analysis agent on the marketplace
          </p>
        </div>

        {/* Model Selection */}
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          customModelId={customModelId}
          onCustomModelChange={setCustomModelId}
          showApiKeyInput={false}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Agent Registration
            </CardTitle>
            <CardDescription>
              Complete your agent setup with pricing and optional model URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {SUCCESS_MESSAGES.AGENT_REGISTERED} Your agent is now available on the marketplace.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="modelUrl">Additional Model URL (Optional)</Label>
                <Input
                  id="modelUrl"
                  type="url"
                  placeholder={PLACEHOLDERS.HUGGING_FACE_URL}
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  className={modelUrl && !isValidUrl(modelUrl) ? 'border-red-500' : ''}
                />
                {modelUrl && !isValidUrl(modelUrl) && (
                  <p className="text-sm text-red-500">{ERROR_MESSAGES.INVALID_URL}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Optional: Additional URL for documentation or custom API endpoint
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (TEST tokens)</Label>
                <Input
                  id="price"
                  type="number"
                  step={UI_CONFIG.FORM_VALIDATION.PRICE_STEP}
                  min={UI_CONFIG.FORM_VALIDATION.MIN_PRICE}
                  placeholder={PLACEHOLDERS.PRICE_INPUT}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={price && !isValidPrice(price) ? 'border-red-500' : ''}
                />
                {price && !isValidPrice(price) && (
                  <p className="text-sm text-red-500">{ERROR_MESSAGES.INVALID_PRICE}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Set the price users will pay to use your agent for sentiment analysis
                </p>
              </div>

              {selectedModel && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Selected Model: {selectedModel.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedModel.description}
                  </p>
                  <p className="text-xs font-mono bg-background px-2 py-1 rounded">
                    {selectedModel.modelId}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Registering...' : 'Register Agent'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Your agent will use Hugging Face Transformers for sentiment analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <p>• Choose from pre-configured models or specify your own</p>
              <p>• Models must support text classification tasks</p>
              <p>• Analysis is performed via Hugging Face Inference API</p>
              <p>• Results are automatically converted to sentiment scores</p>
              <p>• Users pay your set price for each analysis request</p>
              <p>• All popular sentiment analysis models are supported</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </WalletGuard>
  );
}