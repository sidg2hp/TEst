import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletState } from '@/types';
import { getCurrentNetworkConfig, ERROR_MESSAGES } from '@/config';

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSapphire: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

type WalletAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { account: string; provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner; chainId: number } }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'CHAIN_CHANGED'; payload: number };

const initialState: WalletState = {
  isConnected: false,
  account: null,
  provider: null,
  signer: null,
  chainId: null,
  isLoading: false,
  error: null,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, isLoading: true, error: null };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        provider: action.payload.provider,
        signer: action.payload.signer,
        chainId: action.payload.chainId,
        isLoading: false,
        error: null,
      };
    case 'CONNECT_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'DISCONNECT':
      return { ...initialState };
    case 'CHAIN_CHANGED':
      return { ...state, chainId: action.payload };
    default:
      return state;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const connect = async () => {
    try {
      dispatch({ type: 'CONNECT_START' });

      if (!window.ethereum) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error(ERROR_MESSAGES.NO_ACCOUNTS_FOUND);
      }

      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: {
          account: accounts[0],
          provider,
          signer,
          chainId: Number(network.chainId),
        },
      });
    } catch (error) {
      dispatch({
        type: 'CONNECT_ERROR',
        payload: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_CONNECT,
      });
    }
  };

  const disconnect = () => {
    dispatch({ type: 'DISCONNECT' });
  };

  const switchToSapphire = async () => {
    try {
      if (!window.ethereum) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
      }

      const networkConfig = getCurrentNetworkConfig();

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: networkConfig.chainId,
            chainName: networkConfig.chainName,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: [networkConfig.rpcUrl],
            blockExplorerUrls: [networkConfig.blockExplorerUrl],
          },
        ],
      });

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (error) {
      console.error('Failed to switch to Sapphire:', error);
    }
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      }
    };

    const handleChainChanged = (chainId: string) => {
      dispatch({ type: 'CHAIN_CHANGED', payload: parseInt(chainId, 16) });
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        switchToSapphire,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};