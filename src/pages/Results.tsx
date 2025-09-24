import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { WalletGuard } from '@/components/WalletGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SentimentResult } from '@/types';
import { BarChart3, TrendingUp, Minus, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_CONFIG } from '@/config';

export function Results() {
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { listenForSentimentResults } = useContract();
  const { account } = useWallet();

  useEffect(() => {
    if (!account) return;

    const cleanup = listenForSentimentResults((result) => {
      setResults(prev => [result, ...prev].slice(0, 50)); // Keep last 50 results
    });

    return cleanup;
  }, [account, listenForSentimentResults]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      case 'neutral':
      default:
        return Minus;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral':
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 80) return { label: 'High', color: 'text-green-600' };
    if (confidence >= 60) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  };

  return (
    <WalletGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground">
            Real-time sentiment analysis results from your requests
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Live Results Feed
            </CardTitle>
            <CardDescription>
              Results appear in real-time as they are processed by AI agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No results yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Submit sentiment analysis requests to see results here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const SentimentIcon = getSentimentIcon(result.sentiment);
                  const confidenceLevel = getConfidenceLevel(result.confidence);
                  
                  return (
                    <Card key={`${result.requestId}-${result.timestamp}`} className={cn(
                      "border-2 transition-colors",
                      getSentimentColor(result.sentiment)
                    )}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              getSentimentColor(result.sentiment)
                            )}>
                              <SentimentIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "font-medium capitalize",
                                    getSentimentColor(result.sentiment)
                                  )}
                                >
                                  {result.sentiment}
                                </Badge>
                                <Badge variant="secondary">
                                  Request #{result.requestId}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatTimestamp(result.timestamp)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {result.confidence}%
                            </div>
                            <div className={cn("text-sm font-medium", confidenceLevel.color)}>
                              {confidenceLevel.label} Confidence
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
              <CardDescription>
                Analysis of your recent sentiment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {['positive', 'neutral', 'negative'].map((sentiment) => {
                  const count = results.filter(r => r.sentiment === sentiment).length;
                  const percentage = results.length > 0 ? ((count / results.length) * UI_CONFIG.PERCENTAGE_CALCULATION.MULTIPLY_BY).toFixed(UI_CONFIG.PERCENTAGE_CALCULATION.DECIMAL_PLACES) : '0';
                  const SentimentIcon = getSentimentIcon(sentiment);
                  
                  return (
                    <div key={sentiment} className="text-center space-y-2">
                      <div className={cn(
                        "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
                        getSentimentColor(sentiment)
                      )}>
                        <SentimentIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {sentiment} ({percentage}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WalletGuard>
  );
}