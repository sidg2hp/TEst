import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContract } from '@/hooks/useContract';
import { WalletGuard } from '@/components/WalletGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Agent } from '@/types';
import { Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  PLACEHOLDERS, 
  UI_CONFIG,
  formatAddress 
} from '@/config';

export function SentimentRequest() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { getAgents, requestSentiment } = useContract();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    // Pre-select agent if passed through navigation state
    if (location.state?.selectedAgentId) {
      setSelectedAgentId(location.state.selectedAgentId.toString());
    }
  }, [location.state]);

  const loadAgents = async () => {
    try {
      setIsLoadingAgents(true);
      const agentList = await getAgents();
      setAgents(agentList.filter(agent => agent.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FAILED_TO_LOAD_AGENTS);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !text) return;

    const agentId = parseInt(selectedAgentId);
    const selectedAgent = agents.find(agent => agent.id === agentId);
    if (!selectedAgent) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await requestSentiment(agentId, text, selectedAgent.price);
      setSuccess(true);
      setText('');
      toast({
        title: "Request Submitted",
        description: SUCCESS_MESSAGES.REQUEST_SUBMITTED,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.FAILED_TO_SUBMIT_REQUEST;
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

  const selectedAgent = agents.find(agent => agent.id === parseInt(selectedAgentId));
  const isFormValid = selectedAgentId && text.trim().length > 0;

  return (
    <WalletGuard>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit Request</h1>
          <p className="text-muted-foreground">
            Request sentiment analysis from available AI agents
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Sentiment Analysis Request
            </CardTitle>
            <CardDescription>
              Select an agent and provide text for sentiment analysis
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
                    Request submitted successfully! Monitor the results page for your analysis.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="agent">Select Agent</Label>
                <Select 
                  value={selectedAgentId} 
                  onValueChange={setSelectedAgentId}
                  disabled={isLoadingAgents}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAgents ? "Loading agents..." : "Choose an AI agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>Agent #{agent.id}</span>
                          <Badge variant="outline" className="ml-2">
                            {agent.price} TEST
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {agents.length === 0 && !isLoadingAgents && (
                  <p className="text-sm text-red-500">No active agents available</p>
                )}
              </div>

              {selectedAgent && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Price:</span>
                      <Badge variant="secondary">{selectedAgent.price} TEST</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Owner:</span>
                      <span className="text-sm font-mono">
                        {formatAddress(selectedAgent.owner)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Model:</span>
                      <p className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                        {selectedAgent.modelUrl}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="text">Text to Analyze</Label>
                <Textarea
                  id="text"
                  placeholder={PLACEHOLDERS.TEXT_ANALYSIS}
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Minimum {UI_CONFIG.FORM_VALIDATION.MIN_TEXT_LENGTH} characters required
                  </p>
                  <span className={`text-sm ${text.length >= UI_CONFIG.FORM_VALIDATION.MIN_TEXT_LENGTH ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {text.length} characters
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!isFormValid || isLoading || text.length < UI_CONFIG.FORM_VALIDATION.MIN_TEXT_LENGTH}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Submitting...' : `Submit Request ${selectedAgent ? `(${selectedAgent.price} TEST)` : ''}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
            <CardDescription>
              Understanding the sentiment analysis process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <p>1. Select an AI agent from the marketplace</p>
              <p>2. Provide text for sentiment analysis</p>
              <p>3. Pay the agent's fee in TEST tokens</p>
              <p>4. Wait for the analysis to complete</p>
              <p>5. View results on the results page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </WalletGuard>
  );
}