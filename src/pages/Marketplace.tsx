import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { WalletGuard } from '@/components/WalletGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Agent } from '@/types';
import { Store, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Marketplace() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getAgents } = useContract();
  const navigate = useNavigate();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const agentList = await getAgents();
      setAgents(agentList.filter(agent => agent.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleUseAgent = (agentId: number) => {
    navigate('/request', { state: { selectedAgentId: agentId } });
  };

  return (
    <WalletGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and select AI sentiment analysis agents
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Agents</h2>
          <Button onClick={loadAgents} variant="outline" disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Store className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No agents available</h3>
                <p className="mt-2 text-muted-foreground">
                  Be the first to register an agent on the marketplace!
                </p>
                <Button 
                  onClick={() => navigate('/register')} 
                  className="mt-4"
                >
                  Register Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Agent #{agent.id}
                    </span>
                    <Badge variant="secondary">{agent.price} TEST</Badge>
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Owner: {formatAddress(agent.owner)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Model URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {agent.modelUrl}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="flex-shrink-0"
                      >
                        <a
                          href={agent.modelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                    <Button 
                      onClick={() => handleUseAgent(agent.id)}
                      size="sm"
                    >
                      Use Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </WalletGuard>
  );
}