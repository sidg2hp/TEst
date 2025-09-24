import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import { ContractState, Agent, SentimentResult } from '@/types';
import { CONTRACT_CONFIG, ERROR_MESSAGES } from '@/config';
import ContractABI from '@/abi/Contract.json';

interface ContractContextType extends ContractState {
  registerAgent: (modelUrl: string, price: string) => Promise<void>;
  requestSentiment: (agentId: number, text: string, paymentAmount: string) => Promise<void>;
  getAgents: () => Promise<Agent[]>;
  listenForSentimentResults: (callback: (result: SentimentResult) => void) => () => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

type ContractAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: ethers.Contract }
  | { type: 'INIT_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: ContractState = {
  contract: null,
  isLoading: false,
  error: null,
};

function contractReducer(state: ContractState, action: ContractAction): ContractState {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, isLoading: true, error: null };
    case 'INIT_SUCCESS':
      return { ...state, contract: action.payload, isLoading: false, error: null };
    case 'INIT_ERROR':
      return { ...state, contract: null, isLoading: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function ContractProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contractReducer, initialState);
  const { provider, signer, isConnected } = useWallet();

  useEffect(() => {
    if (isConnected && signer) {
      dispatch({ type: 'INIT_START' });
      try {
        if (!CONTRACT_CONFIG.address) {
          dispatch({
            type: 'INIT_ERROR',
            payload: 'Contract address not configured. Please set VITE_CONTRACT_ADDRESS environment variable.',
          });
          return;
        }

        const contract = new ethers.Contract(CONTRACT_CONFIG.address, ContractABI, signer);
        
        // Test the contract by calling a simple read method
        contract.getAgentCount()
          .then(() => {
            dispatch({ type: 'INIT_SUCCESS', payload: contract });
          })
          .catch((error) => {
            dispatch({
              type: 'INIT_ERROR',
              payload: `Contract call failed: ${error.message}. Check if the contract is deployed at ${CONTRACT_CONFIG.address}`,
            });
          });
      } catch (error) {
        dispatch({
          type: 'INIT_ERROR',
          payload: error instanceof Error ? error.message : ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED,
        });
      }
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [isConnected, signer]);

  const registerAgent = async (modelUrl: string, price: string) => {
    if (!state.contract) {
      throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
    }

    const priceWei = ethers.parseEther(price);
    const tx = await state.contract.registerAgent(modelUrl, priceWei);
    await tx.wait();
  };

  const requestSentiment = async (agentId: number, text: string, paymentAmount: string) => {
    if (!state.contract) {
      throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
    }

    const valueWei = ethers.parseEther(paymentAmount);
    const tx = await state.contract.requestSentiment(agentId, text, { value: valueWei });
    await tx.wait();
  };

  const getAgents = async (): Promise<Agent[]> => {
    if (!state.contract) {
      throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
    }

    const agentCount = await state.contract.getAgentCount();
    const agents: Agent[] = [];

    for (let i = 0; i < agentCount; i++) {
      const agent = await state.contract.agents(i);
      agents.push({
        id: i,
        owner: agent.owner,
        modelUrl: agent.modelUrl,
        price: ethers.formatEther(agent.price),
        active: agent.active,
      });
    }

    return agents;
  };

  const listenForSentimentResults = (callback: (result: SentimentResult) => void) => {
    if (!state.contract) {
      return () => {};
    }

    const handleSentimentResult = (requestId: bigint, sentiment: string, confidence: bigint) => {
      callback({
        requestId: Number(requestId),
        sentiment: sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative',
        confidence: Number(confidence),
        timestamp: Date.now(),
      });
    };

    state.contract.on('SentimentResult', handleSentimentResult);

    return () => {
      state.contract?.off('SentimentResult', handleSentimentResult);
    };
  };

  return (
    <ContractContext.Provider
      value={{
        ...state,
        registerAgent,
        requestSentiment,
        getAgents,
        listenForSentimentResults,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export const useContract = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};