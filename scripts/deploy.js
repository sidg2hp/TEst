import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = hre;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Confidential Sentiment Analysis contract to Sapphire...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ROSE`);
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Low balance! Get test tokens from https://faucet.testnet.oasis.dev/");
  }
  
  // Deploy the contract
  console.log("🔨 Compiling and deploying contract...");
  const ConfidentialSentimentAnalysis = await ethers.getContractFactory("ConfidentialSentimentAnalysis");
  
  // Deploy with constructor parameters if needed
  const contract = await ConfidentialSentimentAnalysis.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);
  
  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await contract.deploymentTransaction().wait(2);
  
  // Get deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentTx = contract.deploymentTransaction();
  
  console.log("\n📄 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deploy Tx Hash: ${deploymentTx.hash}`);
  console.log(`Gas Used: ${deploymentTx.gasLimit.toString()}`);
  console.log(`Gas Price: ${ethers.formatUnits(deploymentTx.gasPrice, "gwei")} gwei`);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    txHash: deploymentTx.hash,
    timestamp: new Date().toISOString(),
    abi: ConfidentialSentimentAnalysis.interface.formatJson(),
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${contractAddress}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);
  
  // Save ABI for ROFL worker
  const abiFile = path.join(__dirname, "../rofl-worker/contract_abi.json");
  fs.writeFileSync(abiFile, ConfidentialSentimentAnalysis.interface.formatJson());
  console.log(`📋 Contract ABI saved to: ${abiFile}`);
  
  // Save frontend configuration
  const frontendConfigDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  
  const frontendConfig = {
    address: contractAddress,
    abi: JSON.parse(ConfidentialSentimentAnalysis.interface.formatJson()),
    network: network.name,
    chainId: network.chainId.toString(),
  };
  
  const frontendConfigFile = path.join(frontendConfigDir, "ConfidentialSentimentAnalysis.json");
  fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
  console.log(`🎨 Frontend config saved to: ${frontendConfigFile}`);
  
  // Test basic contract functions
  console.log("\n🧪 Testing basic contract functions...");
  try {
    const agentCount = await contract.getAgentCount();
    console.log(`✅ getAgentCount(): ${agentCount}`);
    
    const platformStats = await contract.getPlatformStats();
    console.log(`✅ Platform stats: ${platformStats.totalAgents} agents, ${platformStats.totalRequests} requests`);
    
    console.log("✅ Contract is working correctly!");
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }
  
  // Environment variable instructions
  console.log("\n🔧 Environment Setup:");
  console.log("=".repeat(50));
  console.log("Add these to your .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_CHAIN_ID=0x${network.chainId.toString(16)}`);
  console.log(`VITE_SAPPHIRE_RPC_URL=${network.name.includes("testnet") ? "https://testnet.sapphire.oasis.dev" : "https://sapphire.oasis.dev"}`);
  
  // ROFL deployment instructions
  console.log("\n🤖 ROFL Worker Setup:");
  console.log("=".repeat(50));
  console.log("1. Set up ROFL environment variables:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   ROFL_APP_ID=<your-rofl-app-id>`);
  console.log(`   WORKER_PRIVATE_KEY=<worker-private-key>`);
  console.log("\n2. Register ROFL worker with the contract:");
  console.log(`   npx hardhat run scripts/register-rofl.js --network ${network.name}`);
  console.log("\n3. Deploy ROFL app:");
  console.log("   cd rofl-worker && oasis rofl create --network testnet");
  
  // Explorer links
  console.log("\n🔍 View on Explorer:");
  console.log("=".repeat(50));
  const explorerUrl = network.name.includes("testnet") 
    ? "https://testnet.explorer.sapphire.oasis.dev"
    : "https://explorer.sapphire.oasis.dev";
  console.log(`Contract: ${explorerUrl}/address/${contractAddress}`);
  console.log(`Deploy Tx: ${explorerUrl}/tx/${deploymentTx.hash}`);
  
  console.log("\n🎉 Deployment completed successfully!");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
