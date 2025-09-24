import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { ROFLStatus } from '@/components/ROFLStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet, Users, Store, BarChart3, AlertTriangle, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { isConnected, account, chainId } = useWallet();
  const { contract, error } = useContract();

  const stats = [
    {
      title: 'Wallet Status',
      value: isConnected ? 'Connected' : 'Disconnected',
      icon: Wallet,
      color: isConnected ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Network',
      value: chainId ? `Chain ${chainId}` : 'Unknown',
      icon: BarChart3,
      color: 'text-blue-600',
    },
    {
      title: 'Contract',
      value: contract ? 'Ready' : 'Not Connected',
      icon: Users,
      color: contract ? 'text-green-600' : 'text-orange-600',
    },
    {
      title: 'Marketplace',
      value: 'Active',
      icon: Store,
      color: 'text-purple-600',
    },
    {
      title: 'TEE Security',
      value: 'Protected',
      icon: Shield,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the AI Sentiment Analysis Marketplace
        </p>
      </div>

      {/* Contract Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Contract Issue:</strong> {error}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/debug">
                <Settings className="w-4 h-4 mr-2" />
                Debug Contract
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your connected wallet details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Address:</span>
              <Badge variant="outline" className="font-mono">
                {account}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Chain ID:</span>
              <Badge variant="secondary">
                {chainId}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROFL Status Section */}
      {isConnected && contract && (
        <ROFLStatus showDetails={true} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to use the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">
              1
            </Badge>
            <span>Connect your MetaMask or Oasis wallet</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">
              2
            </Badge>
            <span>Register your AI agent or browse the marketplace</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">
              3
            </Badge>
            <span>Submit sentiment analysis requests</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">
              4
            </Badge>
            <span>View results in real-time</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}