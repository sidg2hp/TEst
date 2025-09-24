// Network and blockchain configuration
export const NETWORK_CONFIG = {
  SAPPHIRE_TESTNET: {
    chainId: import.meta.env.VITE_CHAIN_ID || '0x5aff',
    chainName: 'Sapphire Testnet',
    rpcUrl: import.meta.env.VITE_SAPPHIRE_RPC_URL || 'https://testnet.sapphire.oasis.dev',
    blockExplorerUrl: 'https://testnet.explorer.sapphire.oasis.dev/',
    nativeCurrency: {
      name: 'TEST',
      symbol: 'TEST',
      decimals: 18,
    },
  },
} as const;

// Contract configuration
export const CONTRACT_CONFIG = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS,
} as const;

// Application constants
export const APP_CONFIG = {
  name: 'Sentiment AI',
  description: 'AI-powered sentiment analysis marketplace',
  version: '1.0.0',
} as const;

// Hugging Face Transformers configuration
export const TRANSFORMERS_CONFIG = {
  API_BASE_URL: 'https://api-inference.huggingface.co/models',
  API_KEY: import.meta.env.VITE_HUGGINGFACE_API_KEY,
  DEFAULT_MODELS: [
    {
      id: 'simple-sentiment',
      name: 'Simple Sentiment (Free)',
      modelId: 'distilbert-base-uncased-finetuned-sst-2-english',
      description: 'Basic sentiment analysis, no authentication required',
      task: 'text-classification',
      labels: ['negative', 'positive'],
    },
    {
      id: 'general-sentiment',
      name: 'General Sentiment Analysis',
      modelId: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      description: 'General purpose sentiment analysis trained on Twitter data',
      task: 'text-classification',
      labels: ['negative', 'neutral', 'positive'],
    },
    {
      id: 'financial-sentiment',
      name: 'Financial News Sentiment',
      modelId: 'mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis',
      description: 'Optimized for financial news and market sentiment',
      task: 'text-classification',
      labels: ['negative', 'neutral', 'positive'],
    },
    {
      id: 'emotion-analysis',
      name: 'Emotion Detection',
      modelId: 'j-hartmann/emotion-english-distilroberta-base',
      description: 'Detects emotions: joy, optimism, anger, sadness',
      task: 'text-classification',
      labels: ['anger', 'fear', 'joy', 'love', 'optimism', 'pessimism', 'sadness', 'surprise', 'trust'],
    },
    {
      id: 'review-sentiment',
      name: 'Product Review Sentiment',
      modelId: 'nlptown/bert-base-multilingual-uncased-sentiment',
      description: 'Specialized for product reviews and ratings',
      task: 'text-classification',
      labels: ['1 star', '2 stars', '3 stars', '4 stars', '5 stars'],
    },
  ],
  SUPPORTED_TASKS: [
    'text-classification',
    'sentiment-analysis',
  ],
  API_TIMEOUT: 30000, // 30 seconds
  MAX_TEXT_LENGTH: 10000,
} as const;

// UI constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 256, // 64 * 4 = 256px (w-64 in Tailwind)
  FORM_VALIDATION: {
    MIN_TEXT_LENGTH: 10,
    MIN_PRICE: 0,
    PRICE_STEP: 0.001,
  },
  PERCENTAGE_CALCULATION: {
    DECIMAL_PLACES: 1,
    MULTIPLY_BY: 100,
  },
  ADDRESS_DISPLAY: {
    PREFIX_LENGTH: 6,
    SUFFIX_LENGTH: 4,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_INSTALLED: 'MetaMask is not installed',
  NO_ACCOUNTS_FOUND: 'No accounts found',
  FAILED_TO_CONNECT: 'Failed to connect wallet',
  FAILED_TO_REGISTER_AGENT: 'Failed to register agent',
  FAILED_TO_SUBMIT_REQUEST: 'Failed to submit request',
  FAILED_TO_LOAD_AGENTS: 'Failed to load agents',
  CONTRACT_NOT_INITIALIZED: 'Contract not initialized',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_PRICE: 'Please enter a valid price greater than 0',
  FORM_VALIDATION_FAILED: 'Please fill in all required fields',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  AGENT_REGISTERED: 'Agent registered successfully!',
  REQUEST_SUBMITTED: 'Your sentiment analysis request has been submitted. Check the results page for updates.',
  WALLET_CONNECTED: 'Wallet connected successfully',
} as const;

// Placeholder texts
export const PLACEHOLDERS = {
  HUGGING_FACE_URL: 'https://huggingface.co/your-username/your-model',
  PRICE_INPUT: '0.1',
  TEXT_ANALYSIS: 'Enter the text you want to analyze for sentiment...',
  SEARCH_AGENTS: 'Search agents...',
} as const;

// Form validation patterns
export const VALIDATION_PATTERNS = {
  URL_REGEX: /^https?:\/\/.+/,
  ETHEREUM_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  POSITIVE_NUMBER_REGEX: /^\d*\.?\d+$/,
} as const;

// Network helper functions
export const getNetworkConfig = (networkName: keyof typeof NETWORK_CONFIG = 'SAPPHIRE_TESTNET') => {
  return NETWORK_CONFIG[networkName];
};

export const getCurrentNetworkConfig = () => {
  return getNetworkConfig('SAPPHIRE_TESTNET');
};

// Utility function to format addresses
export const formatAddress = (address: string): string => {
  if (!address) return '';
  const { PREFIX_LENGTH, SUFFIX_LENGTH } = UI_CONFIG.ADDRESS_DISPLAY;
  return `${address.slice(0, PREFIX_LENGTH)}...${address.slice(-SUFFIX_LENGTH)}`;
};

// Validation helper functions
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return VALIDATION_PATTERNS.URL_REGEX.test(url);
  } catch {
    return false;
  }
};

export const isValidPrice = (priceStr: string): boolean => {
  const num = parseFloat(priceStr);
  return !isNaN(num) && num > UI_CONFIG.FORM_VALIDATION.MIN_PRICE;
};

export const isValidEthereumAddress = (address: string): boolean => {
  return VALIDATION_PATTERNS.ETHEREUM_ADDRESS_REGEX.test(address);
};
