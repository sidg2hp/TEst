import { ContractDebugger } from '@/components/ContractDebugger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { Settings, AlertTriangle, ExternalLink, FileText } from 'lucide-react';

export function ContractDebug() {
  const { isConnected, connect } = useWallet();
  const { contract, error } = useContract();

  const contractDeploymentGuide = () => {
    window.open('https://docs.oasis.io/dapp/sapphire/guide/', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contract Debug</h1>
        <p className="text-muted-foreground">
          Debug and verify your smart contract configuration
        </p>
      </div>

      {!isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to debug the contract.
            <Button
              variant="link"
              onClick={connect}
              className="p-0 h-auto ml-2"
            >
              Connect Wallet
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <>
          {/* Contract Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Contract Status Overview
              </CardTitle>
              <CardDescription>
                Current contract initialization status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Contract Instance:</div>
                  <div className={`text-sm ${contract ? 'text-green-600' : 'text-red-600'}`}>
                    {contract ? '✓ Initialized' : '✗ Not initialized'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Status:</div>
                  <div className="text-sm">
                    {error ? (
                      <span className="text-red-600">Error: {error}</span>
                    ) : contract ? (
                      <span className="text-green-600">Ready</span>
                    ) : (
                      <span className="text-yellow-600">Loading...</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debugger Component */}
          <ContractDebugger />

          {/* Help and Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Deployment Help
              </CardTitle>
              <CardDescription>
                Need to deploy a contract? Here are some resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No contract deployed yet?</strong> You'll need to deploy the sentiment analysis 
                  smart contract to Sapphire Testnet before the marketplace can work.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Quick Setup Options:</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-sm">Use Sample Contract</div>
                      <div className="text-xs text-muted-foreground">
                        Deploy a pre-built contract for testing
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={contractDeploymentGuide}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Deploy Guide
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-sm">Environment Setup</div>
                      <div className="text-xs text-muted-foreground">
                        Set VITE_CONTRACT_ADDRESS in your .env file
                      </div>
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      VITE_CONTRACT_ADDRESS=0x...
                    </code>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Sample Contract Code:</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <div>// SPDX-License-Identifier: MIT</div>
                  <div>pragma solidity ^0.8.19;</div>
                  <div></div>
                  <div>contract SentimentAnalysis &#123;</div>
                  <div>&nbsp;&nbsp;struct Agent &#123;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;address owner;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;string modelUrl;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;uint256 price;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;bool active;</div>
                  <div>&nbsp;&nbsp;&#125;</div>
                  <div></div>
                  <div>&nbsp;&nbsp;Agent[] public agents;</div>
                  <div></div>
                  <div>&nbsp;&nbsp;function getAgentCount() public view returns (uint256) &#123;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;return agents.length;</div>
                  <div>&nbsp;&nbsp;&#125;</div>
                  <div></div>
                  <div>&nbsp;&nbsp;function registerAgent(string memory _modelUrl, uint256 _price) public &#123;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;agents.push(Agent(msg.sender, _modelUrl, _price, true));</div>
                  <div>&nbsp;&nbsp;&#125;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
