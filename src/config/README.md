# Configuration System

This directory contains the centralized configuration system for the Sentiment AI application. The configuration has been refactored to eliminate hardcoded values and improve maintainability.

## Structure

### `index.ts`

Main configuration file containing all application constants and settings.

## Configuration Categories

### Network Configuration (`NETWORK_CONFIG`)

Blockchain and network-related settings:

- Chain configuration (ID, name, RPC URL)
- Native currency settings
- Block explorer URLs

**Environment Variables:**

- `VITE_CHAIN_ID` - Blockchain chain ID (default: 0x5aff)
- `VITE_SAPPHIRE_RPC_URL` - RPC endpoint URL
- `VITE_CONTRACT_ADDRESS` - Smart contract address

### Transformers Configuration (`TRANSFORMERS_CONFIG`)

Hugging Face Transformers integration settings:

- Pre-configured models for different use cases
- API configuration and timeout settings
- Model validation and testing capabilities

**Environment Variables:**

- `VITE_HUGGINGFACE_API_KEY` - Hugging Face API key (optional, for faster inference)

### Application Configuration (`APP_CONFIG`)

Basic application metadata:

- Application name
- Description
- Version

### UI Configuration (`UI_CONFIG`)

User interface constants:

- Form validation rules (min text length, price validation)
- Display formatting (address truncation, percentage calculations)
- Layout constants (sidebar width)

### Messages (`ERROR_MESSAGES`, `SUCCESS_MESSAGES`)

Centralized message strings for:

- Error messages (validation, network errors, etc.)
- Success notifications
- User feedback

### Placeholders (`PLACEHOLDERS`)

Default placeholder text for form inputs:

- Hugging Face model URL
- Price input
- Text analysis field

### Validation Patterns (`VALIDATION_PATTERNS`)

Regular expressions for input validation:

- URL validation
- Ethereum address validation
- Number validation

## Utility Functions

### Network Helpers

- `getNetworkConfig(networkName)` - Get configuration for specific network
- `getCurrentNetworkConfig()` - Get current network configuration

### Validation Helpers

- `isValidUrl(url)` - Validate URL format
- `isValidPrice(priceStr)` - Validate price input
- `isValidEthereumAddress(address)` - Validate Ethereum address format

### Formatting Helpers

- `formatAddress(address)` - Format Ethereum address for display (truncated)

## Usage Examples

### Import configuration:

```typescript
import {
  getCurrentNetworkConfig,
  ERROR_MESSAGES,
  UI_CONFIG,
  formatAddress,
} from "@/config";
```

### Use network configuration:

```typescript
const networkConfig = getCurrentNetworkConfig();
console.log(networkConfig.chainName); // "Sapphire Testnet"
```

### Use validation:

```typescript
if (!isValidUrl(modelUrl)) {
  setError(ERROR_MESSAGES.INVALID_URL);
}
```

### Use formatting:

```typescript
const shortAddress = formatAddress(walletAddress); // "0x1234...5678"
```

## Migration Notes

The following hardcoded values have been extracted to configuration:

### Before:

```typescript
// Hardcoded values scattered throughout components
throw new Error("MetaMask is not installed");
placeholder = "https://huggingface.co/your-username/your-model";
chainName: "Sapphire Testnet";
text.length >= 10;
```

### After:

```typescript
// Centralized configuration
throw new Error(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
placeholder={PLACEHOLDERS.HUGGING_FACE_URL}
chainName: networkConfig.chainName
text.length >= UI_CONFIG.FORM_VALIDATION.MIN_TEXT_LENGTH
```

## Benefits

1. **Maintainability**: All configuration in one place
2. **Consistency**: Reused messages and values across components
3. **Environment-specific**: Easy to change settings per deployment
4. **Type Safety**: TypeScript constants with proper typing
5. **Flexibility**: Easy to add new networks or modify settings
6. **Testability**: Configuration can be mocked for testing

## Environment Setup

Create a `.env` file with required variables:

```env
# Blockchain Configuration
VITE_CHAIN_ID=0x5aff
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Hugging Face API (Optional - for faster inference and higher rate limits)
VITE_HUGGINGFACE_API_KEY=hf_your_api_key_here
```

## Transformers Integration

The application now supports Hugging Face Transformers for sentiment analysis:

### Pre-configured Models

- **Financial Sentiment**: Optimized for financial news and market data
- **General Sentiment**: Twitter-trained for general purpose analysis
- **Emotion Detection**: Detects multiple emotions beyond sentiment
- **Product Reviews**: Specialized for e-commerce and review analysis

### Custom Models

Users can specify any Hugging Face model that supports text classification:

```typescript
// Example custom models
"cardiffnlp/twitter-roberta-base-sentiment-latest";
"nlptown/bert-base-multilingual-uncased-sentiment";
"j-hartmann/emotion-english-distilroberta-base";
```

### API Integration

- Uses Hugging Face Inference API for analysis
- Automatic model validation and testing
- Rate limiting and error handling
- Supports both free and paid API tiers

## Troubleshooting

### Common Issues

#### 401 Unauthorized Error

**Problem**: `POST https://api-inference.huggingface.co/models/... 401 (Unauthorized)`

**Solutions**:

1. **Get a free API key**: Visit [Hugging Face Settings](https://huggingface.co/settings/tokens) to create a free API token
2. **Set environment variable**: Add `VITE_HUGGINGFACE_API_KEY=hf_your_token` to your `.env` file
3. **Use API key in demo**: Enter your API key in the demo page's API key input field
4. **Try free models**: Use models like `distilbert-base-uncased-finetuned-sst-2-english` that don't require authentication

#### 503 Service Unavailable

**Problem**: Model is loading or unavailable

**Solutions**:

1. **Wait and retry**: Models may take a few seconds to load
2. **Try different model**: Some models are more popular and load faster
3. **Check model status**: Verify the model exists on Hugging Face

#### Rate Limiting (429)

**Problem**: Too many requests without API key

**Solutions**:

1. **Add API key**: Free API keys have much higher rate limits
2. **Wait between requests**: Add delays between multiple requests
3. **Use batch processing**: Process multiple texts efficiently

### Free Models (No API Key Required)

- `distilbert-base-uncased-finetuned-sst-2-english` - Basic sentiment
- `microsoft/DialoGPT-medium` - Conversational AI
- `facebook/bart-large-mnli` - Zero-shot classification

### Recommended Models (With API Key)

- `cardiffnlp/twitter-roberta-base-sentiment-latest` - General sentiment
- `mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis` - Financial
- `j-hartmann/emotion-english-distilroberta-base` - Emotions
