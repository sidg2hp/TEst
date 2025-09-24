# 🚀 Quick Setup Instructions

## ✅ Fixes Applied

Your project has been successfully upgraded to use **Oasis Sapphire + ROFL** architecture! Here's what was fixed:

1. ✅ **Hardhat Configuration**: Renamed `hardhat.config.js` to `hardhat.config.cjs` (ESM compatibility)
2. ✅ **Smart Contract**: Updated to use proper Sapphire encryption API
3. ✅ **Dependencies**: Installed all required Sapphire and Hardhat packages
4. ✅ **Scripts**: Converted deployment scripts to ESM format

## 🔑 Required: Private Key Setup

**⚠️ IMPORTANT**: You need to add your private key to deploy the contract.

### Option 1: Use MetaMask Private Key (Recommended for Testing)

1. **Export Private Key from MetaMask:**

   - Open MetaMask
   - Click Account Details
   - Click "Export Private Key"
   - Enter your password
   - Copy the private key

2. **Update .env file:**
   ```bash
   # Replace the placeholder with your actual private key
   PRIVATE_KEY=0x_YOUR_ACTUAL_PRIVATE_KEY_HERE
   ```

### Option 2: Generate New Test Account

```bash
# Generate a new test account
npx hardhat accounts

# Or create with ethers
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🪙 Get Test Tokens

1. **Visit Sapphire Testnet Faucet**: https://faucet.testnet.oasis.dev/
2. **Select "Sapphire"** from dropdown
3. **Enter your wallet address**
4. **Request test ROSE tokens**

## 🚀 Deploy Contract

Once you have:

- ✅ Valid private key in `.env`
- ✅ Test ROSE tokens in your account

Run:

```bash
npm run deploy:testnet
```

## 📱 Configure MetaMask for Sapphire

Add Sapphire Testnet to MetaMask:

- **Network Name**: Sapphire Testnet
- **RPC URL**: https://testnet.sapphire.oasis.dev
- **Chain ID**: 23295 (0x5aff)
- **Currency**: TEST
- **Block Explorer**: https://testnet.explorer.sapphire.oasis.dev

## 🔧 Current .env File Status

Your `.env` file now contains:

```env
# Frontend Configuration
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CHAIN_ID=0x5aff
VITE_HUGGINGFACE_API_KEY=

# Blockchain Configuration
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001  # ⚠️ REPLACE THIS!
SAPPHIRE_TESTNET_URL=https://testnet.sapphire.oasis.dev
```

## 🎯 Next Steps

1. **Update PRIVATE_KEY** with your actual private key
2. **Get test tokens** from the faucet
3. **Deploy contract**: `npm run deploy:testnet`
4. **Start frontend**: `npm run dev`

## 🔐 Security Notes

- **Never commit real private keys** to version control
- **Use test accounts only** for development
- **For production**: Use hardware wallets or secure key management

## 🆘 Need Help?

If you encounter issues:

1. Check your private key format (should start with 0x)
2. Ensure you have test ROSE tokens
3. Verify network connectivity to Sapphire testnet
4. Check the deployment logs for specific errors

The project is ready to deploy once you add your private key! 🎉
