import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CONTRACT_CONFIG, getCurrentNetworkConfig, isValidEthereumAddress } from '@/config';
import { ethers } from 'ethers';
import ContractABI from '@/abi/Contract.json';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Settings, 
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';

interface ContractInfo {
  address: string;
  isValid: boolean;
  hasCode: boolean;
  codeSize?: number;
  agentCount?: number;
  error?: string;
}

export function ContractDebugger() {
  const { provider, isConnected, chainId } = useWallet();
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const currentAddress = CONTRACT_CONFIG.address || '';
  const networkConfig = getCurrentNetworkConfig();

  useEffect(() => {
    if (isConnected && currentAddress) {
      checkContract(currentAddress);
    }
  }, [isConnected, currentAddress]);

  const checkContract = async (address: string) => {
    if (!provider || !address) return;

    setIsChecking(true);
    try {
      // Check if address is valid format
      if (!isValidEthereumAddress(address)) {
        setContractInfo({
          address,
          isValid: false,
          hasCode: false,
          error: 'Invalid Ethereum address format'
        });
        return;
      }

      // Check if there's code at the address
      const code = await provider.getCode(address);
      const hasCode = code !== '0x';
      const codeSize = code.length / 2 - 1; // Convert hex to bytes

      if (!hasCode) {
        setContractInfo({
          address,
          isValid: false,
          hasCode: false,
          codeSize,
          error: 'No contract code found at this address'
        });
        return;
      }

      // Try to create contract instance and call getAgentCount
      try {
        const contract = new ethers.Contract(address, ContractABI, provider);
        const agentCount = await contract.getAgentCount();
        
        setContractInfo({
          address,
          isValid: true,
          hasCode: true,
          codeSize,
          agentCount: Number(agentCount)
        });
      } catch (contractError) {
        setContractInfo({
          address,
          isValid: false,
          hasCode: true,
          codeSize,
          error: `Contract call failed: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`
        });
      }
    } catch (error) {
      setContractInfo({
        address,
        isValid: false,
        hasCode: false,
        error: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testContractMethods = async () => {
    if (!provider || !contractInfo?.isValid) return;

    setIsChecking(true);
    try {
      const contract = new ethers.Contract(contractInfo.address, ContractABI, provider);
      
      const results = {
        getAgentCount: null as any,
        agents: null as any,
        errors: [] as string[]
      };

      // Test getAgentCount
      try {
        const count = await contract.getAgentCount();
        results.getAgentCount = Number(count);
      } catch (error) {
        results.errors.push(`getAgentCount: ${error instanceof Error ? error.message : 'Failed'}`);
      }

      // Test agents array (if count > 0)
      if (results.getAgentCount > 0) {
        try {
          const agent = await contract.agents(0);
          results.agents = {
            owner: agent.owner,
            modelUrl: agent.modelUrl,
            price: ethers.formatEther(agent.price),
            active: agent.active
          };
        } catch (error) {
          results.errors.push(`agents(0): ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      setTestResults(results);
    } catch (error) {
      setTestResults({
        errors: [`General error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = (address: string) => {
    const explorerUrl = `${networkConfig.blockExplorerUrl}address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Contract Debugger
          </CardTitle>
          <CardDescription>
            Debug and verify smart contract configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Configuration */}
          <div className="space-y-2">
            <Label>Current Contract Address</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={currentAddress || 'Not configured'} 
                readOnly 
                className="font-mono text-sm"
              />
              {currentAddress && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentAddress)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInExplorer(currentAddress)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            {!currentAddress && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Contract address not configured. Please set VITE_CONTRACT_ADDRESS in your environment variables.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Network Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Network:</span>
              <p className="text-muted-foreground">{networkConfig.chainName}</p>
            </div>
            <div>
              <span className="font-medium">Chain ID:</span>
              <p className="text-muted-foreground">{chainId || 'Not connected'}</p>
            </div>
          </div>

          {/* Contract Status */}
          {contractInfo && (
            <div className="space-y-3">
              <Separator />
              <h4 className="font-medium">Contract Status</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Address Valid:</span>
                  {isValidEthereumAddress(contractInfo.address) ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Has Code:</span>
                  {contractInfo.hasCode ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Yes ({contractInfo.codeSize} bytes)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      No Code
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">ABI Compatible:</span>
                  {contractInfo.isValid ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Compatible
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Incompatible
                    </Badge>
                  )}
                </div>

                {contractInfo.agentCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Agent Count:</span>
                    <Badge variant="outline">
                      {contractInfo.agentCount}
                    </Badge>
                  </div>
                )}
              </div>

              {contractInfo.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{contractInfo.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Test Custom Address */}
          <div className="space-y-2">
            <Label htmlFor="customAddress">Test Custom Address</Label>
            <div className="flex gap-2">
              <Input
                id="customAddress"
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={() => checkContract(customAddress)}
                disabled={!customAddress || isChecking}
              >
                {isChecking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Check'
                )}
              </Button>
            </div>
          </div>

          {/* Test Methods */}
          {contractInfo?.isValid && (
            <div className="space-y-3">
              <Separator />
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Test Contract Methods</h4>
                <Button
                  onClick={testContractMethods}
                  disabled={isChecking}
                  size="sm"
                >
                  {isChecking ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    'Test Methods'
                  )}
                </Button>
              </div>

              {testResults && (
                <div className="space-y-2">
                  {testResults.getAgentCount !== null && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">getAgentCount():</span>
                      <Badge variant="outline">{testResults.getAgentCount}</Badge>
                    </div>
                  )}

                  {testResults.agents && (
                    <div className="p-2 bg-muted rounded">
                      <span className="text-sm font-medium">First Agent:</span>
                      <pre className="text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(testResults.agents, null, 2)}
                      </pre>
                    </div>
                  )}

                  {testResults.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {testResults.errors.map((error, index) => (
                            <div key={index} className="text-xs">{error}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Help */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Common Issues:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Contract address not set in environment variables</li>
                <li>• Wrong network (check if you're on Sapphire Testnet)</li>
                <li>• Contract not deployed at the specified address</li>
                <li>• ABI mismatch with deployed contract</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
