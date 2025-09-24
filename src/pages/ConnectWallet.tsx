import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { getCurrentNetworkConfig } from '@/config';

export function ConnectWallet() {
  const { isConnected, account, chainId, connect, disconnect, switchToSapphire, isLoading, error } = useWallet();

  const networkConfig = getCurrentNetworkConfig();
  const isSapphireChain = chainId === parseInt(networkConfig.chainId, 16);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect Wallet</h1>
        <p className="text-muted-foreground">
          Connect your Web3 wallet to access the sentiment analysis marketplace
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your MetaMask or Oasis wallet to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Wallet Connected</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Address:</span>
                  <Badge variant="outline" className="font-mono">
                    {account}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Chain ID:</span>
                  <Badge variant={isSapphireChain ? "default" : "secondary"}>
                    {chainId}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={disconnect} variant="outline">
                  Disconnect
                </Button>
                {!isSapphireChain && (
                  <Button onClick={switchToSapphire} variant="default">
                    Switch to Sapphire
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To use this application, you need to connect a Web3 wallet. We support:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• MetaMask</li>
                <li>• Oasis Wallet</li>
                <li>• Other Ethereum-compatible wallets</li>
              </ul>
              
              <Button 
                onClick={connect} 
                disabled={isLoading} 
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isSapphireChain && isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please switch to the {networkConfig.chainName} to use all features of this application.
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal ml-1"
              onClick={switchToSapphire}
            >
              Switch Network <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Network Information</CardTitle>
          <CardDescription>
            This application runs on {networkConfig.chainName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Network:</span>
            <span className="text-sm">{networkConfig.chainName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Chain ID:</span>
            <span className="text-sm font-mono">{networkConfig.chainId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">RPC URL:</span>
            <span className="text-sm font-mono break-all">{networkConfig.rpcUrl}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}