import { ethers } from 'ethers';

export interface TransformerModel {
  id: string;
  name: string;
  modelId: string;
  description: string;
  task: string;
  labels: string[];
}

export interface Agent {
  id: number;
  owner: string;
  modelUrl: string;
  price: string;
  active: boolean;
  transformerModel?: TransformerModel;
  customModelId?: string;
}

export interface SentimentRequest {
  id: number;
  requester: string;
  agentId: number;
  text: string;
  timestamp: number;
}

export interface SentimentResult {
  requestId: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  timestamp: number;
}

export interface HuggingFaceResponse {
  label: string;
  score: number;
}

export interface TransformerAnalysisResult {
  predictions: HuggingFaceResponse[];
  modelUsed: string;
  processingTime: number;
  error?: string;
}

export interface ModelValidationResult {
  isValid: boolean;
  error?: string;
  modelInfo?: {
    id: string;
    task: string;
    library_name?: string;
  };
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface ContractState {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
}