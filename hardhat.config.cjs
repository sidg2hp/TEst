require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");

// Load environment variables
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const SAPPHIRE_TESTNET_URL = process.env.SAPPHIRE_TESTNET_URL || "https://testnet.sapphire.oasis.dev";
const SAPPHIRE_MAINNET_URL = process.env.SAPPHIRE_MAINNET_URL || "https://sapphire.oasis.dev";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable for better optimization
    },
  },
  
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337,
    },
    
    // Sapphire Testnet
    "sapphire-testnet": {
      url: SAPPHIRE_TESTNET_URL,
      accounts: [PRIVATE_KEY],
      chainId: 0x5aff, // 23295
    },
    
    // Sapphire Mainnet
    "sapphire-mainnet": {
      url: SAPPHIRE_MAINNET_URL,
      accounts: [PRIVATE_KEY],
      chainId: 0x5afe, // 23294
    },
  },
  
  // Etherscan configuration for contract verification
  etherscan: {
    apiKey: {
      "sapphire-testnet": "dummy", // Sapphire doesn't require API key
      "sapphire-mainnet": "dummy",
    },
    customChains: [
      {
        network: "sapphire-testnet",
        chainId: 0x5aff,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev",
        },
      },
      {
        network: "sapphire-mainnet",
        chainId: 0x5afe,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.dev/api",
          browserURL: "https://explorer.sapphire.oasis.dev",
        },
      },
    ],
  },
  
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  
  // Mocha configuration for tests
  mocha: {
    timeout: 40000,
  },
  
  // Contract size limits
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
};
