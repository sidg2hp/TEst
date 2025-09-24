import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Key, 
  ExternalLink, 
  CheckCircle, 
  Info,
  Zap
} from 'lucide-react';

interface ApiKeyGuideProps {
  onApiKeyProvided?: (apiKey: string) => void;
}

export function ApiKeyGuide({ onApiKeyProvided }: ApiKeyGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      step: 1,
      title: 'Visit Hugging Face',
      description: 'Go to Hugging Face settings to create your API token',
      action: (
        <Button variant="outline" size="sm" asChild>
          <a 
            href="https://huggingface.co/settings/tokens" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Hugging Face Settings
          </a>
        </Button>
      )
    },
    {
      step: 2,
      title: 'Create New Token',
      description: 'Click "New token" and give it a name like "Sentiment Analysis"',
    },
    {
      step: 3,
      title: 'Select Permissions',
      description: 'Choose "Read" permission (sufficient for inference)',
    },
    {
      step: 4,
      title: 'Copy Token',
      description: 'Copy your token (starts with "hf_") and paste it in the API key field above',
    }
  ];

  const benefits = [
    'Access to more models',
    'Faster inference speed', 
    'Higher rate limits',
    'No queuing delays',
    'Priority processing'
  ];

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Key Setup Guide
              </div>
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </CardTitle>
            <CardDescription>
              Get your free Hugging Face API key for better performance
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Benefits */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Benefits of using an API key:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h4 className="font-medium mb-3">Setup Steps:</h4>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.step} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h5 className="font-medium text-sm">{step.title}</h5>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.action && step.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notes */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Free tier limitations:</strong> Without an API key, you may experience slower response times, 
                rate limiting, and some models may require authentication. The API key is completely free and 
                significantly improves the experience.
              </AlertDescription>
            </Alert>

            {/* Environment Variable Option */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">For Developers:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                You can also set the API key as an environment variable:
              </p>
              <code className="block p-2 bg-muted rounded text-xs font-mono">
             VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
              </code>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
