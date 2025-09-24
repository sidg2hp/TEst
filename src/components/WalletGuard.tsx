import { ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface WalletGuardProps {
  children: ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const { isConnected, connect, isLoading } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Required
            </CardTitle>
            <CardDescription>
              Please connect your wallet to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={connect} 
              disabled={isLoading} 
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}