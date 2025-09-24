import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut } from 'lucide-react';

export function Header() {
  const { isConnected, account, chainId, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">AI Sentiment Marketplace</h2>
          {chainId && (
            <Badge variant="secondary">
              Chain ID: {chainId}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && account ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                <Wallet className="w-3 h-3 mr-1" />
                {formatAddress(account)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={disconnect}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Badge variant="destructive">Not Connected</Badge>
          )}
        </div>
      </div>
    </header>
  );
}