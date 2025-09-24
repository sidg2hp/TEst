import { useROFLStatus } from '@/hooks/useROFLStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Cpu,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ROFLStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function ROFLStatus({ showDetails = true, className = '' }: ROFLStatusProps) {
  const { roflStatus, platformStats, isLoading, error, refreshStatus } = useROFLStatus();

  const getStatusColor = () => {
    if (!roflStatus.isEnabled) return 'text-gray-500';
    if (roflStatus.isOnline) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (!roflStatus.isEnabled) return XCircle;
    if (roflStatus.isOnline) return CheckCircle;
    return AlertTriangle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              ROFL TEE Worker Status
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Trusted Execution Environment for confidential AI processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
                <span className="text-sm font-medium">Worker Status</span>
              </div>
              <div className={`text-lg font-semibold ${getStatusColor()}`}>
                {isLoading ? 'Checking...' : roflStatus.isEnabled ? 
                  (roflStatus.isOnline ? 'Online' : 'Offline') : 'Disabled'}
              </div>
            </div>

            {roflStatus.isEnabled && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Processed</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {roflStatus.totalProcessed}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                  <div className="text-lg font-semibold text-purple-600">
                    {roflStatus.processingRequests}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Last Active</span>
                  </div>
                  <div className="text-sm text-orange-600">
                    {roflStatus.lastActivity ? 
                      roflStatus.lastActivity.toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detailed Information */}
          {showDetails && roflStatus.isEnabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">TEE Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">App ID:</span>
                    <div className="font-mono text-xs bg-muted p-1 rounded mt-1">
                      {roflStatus.appId ? 
                        `${roflStatus.appId.slice(0, 10)}...${roflStatus.appId.slice(-8)}` : 
                        'Not configured'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Worker Address:</span>
                    <div className="font-mono text-xs bg-muted p-1 rounded mt-1">
                      {roflStatus.workerAddress ? 
                        `${roflStatus.workerAddress.slice(0, 6)}...${roflStatus.workerAddress.slice(-4)}` : 
                        'Not configured'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Platform Statistics */}
          {showDetails && platformStats && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Platform Statistics</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {platformStats.totalAgents}
                    </div>
                    <div className="text-xs text-muted-foreground">Agents</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {platformStats.totalRequests}
                    </div>
                    <div className="text-xs text-muted-foreground">Requests</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {platformStats.feePercent}%
                    </div>
                    <div className="text-xs text-muted-foreground">Platform Fee</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {(platformStats.totalFees / 1e18).toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">ROSE Fees</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Status Messages */}
          {!roflStatus.isEnabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                ROFL worker is not enabled. Off-chain AI processing is unavailable.
                Contact the platform administrator to enable TEE processing.
              </AlertDescription>
            </Alert>
          )}

          {roflStatus.isEnabled && !roflStatus.isOnline && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ROFL worker appears to be offline. New sentiment analysis requests
                may not be processed until the worker comes back online.
              </AlertDescription>
            </Alert>
          )}

          {roflStatus.isEnabled && roflStatus.isOnline && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ROFL worker is online and processing requests. All sentiment analysis
                is performed securely within the Trusted Execution Environment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Features */}
      {showDetails && roflStatus.isEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Security Features
            </CardTitle>
            <CardDescription>
              Confidential computing protections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">TEE Attestation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Worker identity verified through hardware attestation
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Encrypted State</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  User inputs encrypted at rest and in transit
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Confidential Processing</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI inference performed in isolated secure enclave
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Verifiable Results</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Output authenticity guaranteed by cryptographic proof
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
