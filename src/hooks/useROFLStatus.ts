import { useState, useEffect } from 'react';
import { useContract } from './useContract';
import { useWallet } from './useWallet';

interface ROFLStatus {
  isEnabled: boolean;
  appId: string | null;
  workerAddress: string | null;
  isOnline: boolean;
  lastActivity: Date | null;
  processingRequests: number;
  totalProcessed: number;
}

interface PlatformStats {
  totalAgents: number;
  totalRequests: number;
  totalFees: number;
  feePercent: number;
  roflActive: boolean;
}

export function useROFLStatus() {
  const [roflStatus, setROFLStatus] = useState<ROFLStatus>({
    isEnabled: false,
    appId: null,
    workerAddress: null,
    isOnline: false,
    lastActivity: null,
    processingRequests: 0,
    totalProcessed: 0,
  });
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { contract } = useContract();
  const { isConnected } = useWallet();

  const fetchROFLStatus = async () => {
    if (!contract || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get platform stats (includes ROFL status)
      const stats = await contract.getPlatformStats();
      setPlatformStats({
        totalAgents: Number(stats.totalAgents),
        totalRequests: Number(stats.totalRequests),
        totalFees: Number(stats.totalFees),
        feePercent: Number(stats.feePercent),
        roflActive: stats.roflActive,
      });

      // Get ROFL-specific information
      let appId = null;
      let workerAddress = null;
      
      try {
        appId = await contract.expectedROFLAppId();
        workerAddress = await contract.roflWorkerAddress();
      } catch (err) {
        console.warn('Could not fetch ROFL details:', err);
      }

      // Check if ROFL worker is online by looking at recent activity
      const isOnline = await checkWorkerOnline();
      
      setROFLStatus({
        isEnabled: stats.roflActive,
        appId: appId || null,
        workerAddress: workerAddress || null,
        isOnline,
        lastActivity: isOnline ? new Date() : null,
        processingRequests: 0, // This would need event monitoring
        totalProcessed: Number(stats.totalRequests),
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ROFL status');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWorkerOnline = async (): Promise<boolean> => {
    if (!contract) return false;

    try {
      // Check for recent SentimentResult events (within last 5 minutes)
      const currentBlock = await contract.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 50); // Approximate last 5 minutes
      
      const filter = contract.filters.SentimentResult();
      const events = await contract.queryFilter(filter, fromBlock, currentBlock);
      
      // If there are recent events, worker is likely online
      return events.length > 0;
    } catch (err) {
      console.warn('Failed to check worker online status:', err);
      return false;
    }
  };

  const listenForROFLEvents = () => {
    if (!contract) return;

    // Listen for ROFL worker registration
    const roflFilter = contract.filters.ROFLWorkerRegistered();
    contract.on(roflFilter, (appId, workerAddress, event) => {
      console.log('ROFL Worker registered:', { appId, workerAddress });
      fetchROFLStatus(); // Refresh status
    });

    // Listen for sentiment results (indicates worker activity)
    const resultFilter = contract.filters.SentimentResult();
    contract.on(resultFilter, (requestId, sentiment, confidence, worker, event) => {
      console.log('ROFL result received:', { requestId, sentiment, confidence, worker });
      
      setROFLStatus(prev => ({
        ...prev,
        isOnline: true,
        lastActivity: new Date(),
        totalProcessed: prev.totalProcessed + 1,
      }));
    });

    // Cleanup function
    return () => {
      contract.removeAllListeners(roflFilter);
      contract.removeAllListeners(resultFilter);
    };
  };

  useEffect(() => {
    fetchROFLStatus();
    
    // Set up event listeners
    const cleanup = listenForROFLEvents();
    
    // Periodic status updates
    const interval = setInterval(fetchROFLStatus, 30000); // Every 30 seconds
    
    return () => {
      cleanup?.();
      clearInterval(interval);
    };
  }, [contract, isConnected]);

  const refreshStatus = () => {
    fetchROFLStatus();
  };

  return {
    roflStatus,
    platformStats,
    isLoading,
    error,
    refreshStatus,
  };
}
