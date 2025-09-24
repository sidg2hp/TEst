# 🚀 Confidential AI Agent Marketplace - ROFL + Sapphire Deployment Guide

## Overview

This guide will help you deploy the **Confidential AI Agent Marketplace** using:

- **Oasis Sapphire** for confidential smart contracts
- **ROFL (Runtime OFFchain Logic)** for trusted AI inference in TEE
- **React Frontend** for user interaction

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React         │    │   Sapphire       │    │   ROFL Worker   │
│   Frontend      │◄──►│   Smart Contract │◄──►│   (TEE)         │
│                 │    │   (Confidential) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MetaMask      │    │   Encrypted      │    │   Hugging Face  │
│   Wallet        │    │   State Storage  │    │   AI Models     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

### 1. Development Environment

```bash
# Node.js and npm
node --version  # >= 18.0.0
npm --version   # >= 8.0.0

# Python for ROFL worker
python --version  # >= 3.11
pip --version

# Oasis CLI
oasis --version
```

### 2. Accounts and Tokens

- **MetaMask** wallet with Sapphire Testnet configured
- **Test ROSE tokens** from [Sapphire Testnet Faucet](https://faucet.testnet.oasis.dev/)
- **Hugging Face Account** for AI model access (optional but recommended)

### 3. Required Tools

```bash
# Install Oasis CLI
curl -fsSL https://github.com/oasisprotocol/cli/releases/download/v1.3.2/oasis_1.3.2_linux_amd64.tar.gz | tar xz
sudo mv oasis /usr/local/bin/

# Install Hardhat
npm install -g hardhat

# Install Docker (for ROFL)
docker --version
```

## Step 1: Environment Setup

### 1.1 Clone and Setup Project

```bash
git clone <your-repo>
cd confidential-sentiment-marketplace
npm install
```

### 1.2 Environment Variables

Create `.env` file:

```env
# Blockchain Configuration
PRIVATE_KEY=0x_your_private_key_here
SAPPHIRE_TESTNET_URL=https://testnet.sapphire.oasis.dev
VITE_CHAIN_ID=0x5aff
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev

# Hugging Face API (Optional)
VITE_HUGGINGFACE_API_KEY=hf_your_token_here
HUGGINGFACE_TOKEN=hf_your_token_here

# ROFL Configuration (Will be set after deployment)
ROFL_APP_ID=
WORKER_PRIVATE_KEY=
WORKER_ADDRESS=
CONTRACT_ADDRESS=
```

### 1.3 Install Dependencies

```bash
# Install Hardhat dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @oasisprotocol/sapphire-hardhat

# Install ROFL worker dependencies
cd rofl-worker
pip install -r requirements.txt
cd ..
```

## Step 2: Deploy Smart Contract

### 2.1 Compile Contract

```bash
npx hardhat compile
```

### 2.2 Deploy to Sapphire Testnet

```bash
npx hardhat run scripts/deploy.js --network sapphire-testnet
```

Expected output:

```
🚀 Deploying Confidential Sentiment Analysis contract to Sapphire...
📝 Deploying with account: 0x1234...
✅ Contract deployed to: 0xABCD1234...
📋 Contract ABI saved to: rofl-worker/contract_abi.json
🎨 Frontend config saved to: src/contracts/ConfidentialSentimentAnalysis.json
```

### 2.3 Update Environment

Add the contract address to your `.env`:

```env
CONTRACT_ADDRESS=0xABCD1234_your_deployed_contract_address
VITE_CONTRACT_ADDRESS=0xABCD1234_your_deployed_contract_address
```

## Step 3: Deploy ROFL Worker

### 3.1 Create ROFL Worker Account

```bash
# Generate a new account for the ROFL worker
oasis account generate --name rofl-worker

# Export the private key
oasis account export rofl-worker --format private-key
```

Add to `.env`:

```env
WORKER_PRIVATE_KEY=0x_worker_private_key
WORKER_ADDRESS=0x_worker_address
```

### 3.2 Fund Worker Account

Transfer some test ROSE to the worker address for gas fees.

### 3.3 Create ROFL Application

```bash
cd rofl-worker

# Create the ROFL application
oasis rofl create \
  --network testnet \
  --account rofl-worker \
  --name "confidential-sentiment-analysis" \
  --description "TEE-based sentiment analysis worker"
```

This will output a ROFL App ID. Add it to `.env`:

```env
ROFL_APP_ID=rofl_app_id_here
```

### 3.4 Build ROFL Docker Image

```bash
# Build the Docker image
docker build -t confidential-sentiment-worker .

# Tag for deployment
docker tag confidential-sentiment-worker:latest rofl/confidential-sentiment:v1.0.0
```

### 3.5 Deploy ROFL Worker

```bash
# Deploy to ROFL infrastructure
oasis rofl deploy \
  --network testnet \
  --account rofl-worker \
  --image rofl/confidential-sentiment:v1.0.0 \
  --config rofl.yaml
```

## Step 4: Register ROFL Worker with Contract

### 4.1 Register Worker

```bash
# Set environment variables for registration
export CONTRACT_ADDRESS=0x_your_contract_address
export ROFL_APP_ID=your_rofl_app_id
export WORKER_ADDRESS=0x_worker_address

# Register the ROFL worker with the smart contract
npx hardhat run scripts/register-rofl.js --network sapphire-testnet
```

Expected output:

```
🤖 Registering ROFL Worker with Confidential Sentiment Analysis contract...
✅ Registration verified successfully!
💾 ROFL configuration saved to: rofl-worker/rofl-config.json
```

## Step 5: Frontend Setup

### 5.1 Update Contract Configuration

The deployment script should have created `src/contracts/ConfidentialSentimentAnalysis.json`. Verify it contains the correct contract address.

### 5.2 Start Frontend

```bash
npm run dev
```

Visit `http://localhost:5173` and:

1. Connect your MetaMask wallet
2. Switch to Sapphire Testnet
3. Check the dashboard for ROFL status

## Step 6: Testing the System

### 6.1 Register an AI Agent

1. Go to "Register Agent" page
2. Select a Hugging Face model (e.g., `cardiffnlp/twitter-roberta-base-sentiment-latest`)
3. Set a price (e.g., 0.1 TEST)
4. Submit registration

### 6.2 Submit Sentiment Request

1. Go to "Submit Request" page
2. Select your registered agent
3. Enter text to analyze
4. Pay and submit

### 6.3 Check Results

1. Go to "Results" page
2. Watch for ROFL worker to process your request
3. See the confidential sentiment analysis result

## Monitoring and Debugging

### Check ROFL Worker Status

```bash
# Check ROFL application status
oasis rofl status --network testnet --app-id your_rofl_app_id

# View ROFL worker logs
oasis rofl logs --network testnet --app-id your_rofl_app_id
```

### Check Contract Status

Visit the debug page at `/debug` in your frontend to:

- Verify contract deployment
- Check ROFL worker registration
- Test contract functions

### Monitor Events

```bash
# Monitor contract events
npx hardhat run scripts/monitor-events.js --network sapphire-testnet
```

## Production Deployment

### Mainnet Configuration

For production deployment on Sapphire Mainnet:

1. Update `.env` for mainnet:

```env
SAPPHIRE_MAINNET_URL=https://sapphire.oasis.dev
VITE_CHAIN_ID=0x5afe
VITE_SAPPHIRE_RPC_URL=https://sapphire.oasis.dev
```

2. Deploy to mainnet:

```bash
npx hardhat run scripts/deploy.js --network sapphire-mainnet
```

3. Create production ROFL app:

```bash
oasis rofl create --network mainnet --account production-account
```

## Security Considerations

### 1. Private Key Management

- **Never commit private keys** to version control
- Use hardware wallets for production deployments
- Implement key rotation for ROFL workers

### 2. TEE Attestation

- Verify TEE attestations in production
- Monitor worker health and attestation status
- Implement backup workers for high availability

### 3. Contract Security

- Audit smart contract code before mainnet deployment
- Implement circuit breakers for emergency stops
- Monitor contract interactions and unusual patterns

## Troubleshooting

### Common Issues

**Contract deployment fails:**

- Check account balance (need test ROSE)
- Verify network configuration
- Check Hardhat config

**ROFL worker offline:**

- Check worker account balance
- Verify Docker image deployment
- Check ROFL app registration

**Frontend can't connect:**

- Verify MetaMask network configuration
- Check contract address in environment
- Ensure Sapphire testnet is selected

**Sentiment requests not processed:**

- Check ROFL worker status
- Verify worker registration with contract
- Check Hugging Face API access

### Getting Help

- **Oasis Documentation**: https://docs.oasis.io/
- **Sapphire Guide**: https://docs.oasis.io/dapp/sapphire/
- **ROFL Documentation**: https://docs.oasis.io/build/rofl/
- **GitHub Issues**: Create issues in your repository

## Cost Estimation

### Testnet (Free)

- Contract deployment: ~0.1 TEST ROSE
- ROFL app creation: ~100 TEST tokens
- Transaction fees: ~0.001 TEST per transaction

### Mainnet

- Contract deployment: ~$0.10 USD
- ROFL app creation: ~$10 USD
- Transaction fees: ~$0.001 USD per transaction

## Next Steps

1. **Scale ROFL Workers**: Deploy multiple workers for load balancing
2. **Add More AI Models**: Support different types of AI analysis
3. **Implement Staking**: Add economic incentives for workers
4. **Mobile Support**: Create mobile app with Oasis Wallet integration
5. **Analytics Dashboard**: Build admin dashboard for monitoring

## Conclusion

You now have a fully functional **Confidential AI Agent Marketplace** running on:

- ✅ **Sapphire** for confidential smart contracts
- ✅ **ROFL** for trusted off-chain AI inference
- ✅ **React Frontend** for user interaction
- ✅ **TEE Security** for protecting user data

Your users can now submit sensitive text for AI analysis with complete privacy and verifiable results!
