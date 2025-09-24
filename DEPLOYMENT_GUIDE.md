# Smart Contract Deployment Guide

## Quick Fix for "could not decode result data" Error

The error you're experiencing means the smart contract is not deployed or accessible. Here's how to fix it:

## Option 1: Use a Pre-deployed Contract (Fastest)

If there's already a deployed contract on Sapphire Testnet, set it in your environment:

```bash
# Create .env file in project root
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_CHAIN_ID=0x5aff
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
```

## Option 2: Deploy Your Own Contract

### Prerequisites

1. **MetaMask** with Sapphire Testnet configured
2. **Test tokens** from [Sapphire Testnet Faucet](https://faucet.testnet.oasis.dev/)
3. **Remix IDE** or **Hardhat/Foundry**

### Method A: Using Remix IDE (Easiest)

1. **Open Remix**: Go to [remix.ethereum.org](https://remix.ethereum.org)

2. **Create Contract**:

   - Create new file: `SentimentAnalysis.sol`
   - Copy the contract code from `contracts/SentimentAnalysis.sol`

3. **Compile**:

   - Go to "Solidity Compiler" tab
   - Select compiler version `0.8.19+`
   - Click "Compile SentimentAnalysis.sol"

4. **Deploy**:

   - Go to "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - Select "SentimentAnalysis" contract
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Copy Address**:
   - After deployment, copy the contract address
   - Add to your `.env` file

### Method B: Using Hardhat

1. **Install Dependencies**:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. **Initialize Hardhat**:

```bash
npx hardhat init
```

3. **Configure Network** (`hardhat.config.js`):

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sapphire: {
      url: "https://testnet.sapphire.oasis.dev",
      accounts: [process.env.PRIVATE_KEY], // Your wallet private key
      chainId: 0x5aff,
    },
  },
};
```

4. **Deploy Script** (`scripts/deploy.js`):

```javascript
async function main() {
  const SentimentAnalysis = await ethers.getContractFactory(
    "SentimentAnalysis"
  );
  const contract = await SentimentAnalysis.deploy();
  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

5. **Deploy**:

```bash
npx hardhat run scripts/deploy.js --network sapphire
```

## Option 3: Quick Test with Mock Data

For immediate testing without blockchain deployment:

1. **Go to Contract Debug page** (`/debug`)
2. **Test with sample address**: `0x1234567890123456789012345678901234567890`
3. **Use Transformers Demo** (`/demo`) for AI functionality testing

## Environment Variables Setup

Create a `.env` file in your project root:

```env
# Blockchain Configuration
VITE_CHAIN_ID=0x5aff
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS

# Optional: Hugging Face API
VITE_HUGGINGFACE_API_KEY=hf_your_token_here
```

## Verification Steps

1. **Check Contract**: Visit `/debug` page to verify contract status
2. **Test Registration**: Try registering an agent
3. **Test Marketplace**: Browse available agents
4. **Test Analysis**: Submit sentiment analysis requests

## Common Issues & Solutions

### "No contract code found"

- **Problem**: Contract address points to empty address
- **Solution**: Verify contract deployment and address

### "Contract call failed"

- **Problem**: Wrong network or ABI mismatch
- **Solution**: Check network connection and contract version

### "Insufficient payment"

- **Problem**: Not enough test tokens
- **Solution**: Get tokens from faucet

## Network Information

- **Network**: Sapphire Testnet
- **Chain ID**: `0x5aff` (23295)
- **RPC URL**: `https://testnet.sapphire.oasis.dev`
- **Explorer**: `https://testnet.explorer.sapphire.oasis.dev/`
- **Faucet**: `https://faucet.testnet.oasis.dev/`

## Need Help?

1. **Debug Page**: Use `/debug` to diagnose issues
2. **Check Explorer**: Verify transactions on Sapphire explorer
3. **Test Demo**: Use `/demo` for Transformers functionality
4. **Console Logs**: Check browser console for detailed errors

The key is ensuring you have a valid deployed contract address in your environment variables!
