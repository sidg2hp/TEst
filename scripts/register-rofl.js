import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = hre;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🤖 Registering ROFL Worker with Confidential Sentiment Analysis contract...");
  
  // Get environment variables
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
  const roflAppId = process.env.ROFL_APP_ID;
  const workerAddress = process.env.WORKER_ADDRESS;
  
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS environment variable is required");
  }
  
  if (!roflAppId) {
    throw new Error("ROFL_APP_ID environment variable is required. Get this from 'oasis rofl create' command");
  }
  
  if (!workerAddress) {
    throw new Error("WORKER_ADDRESS environment variable is required. This should be the address of your ROFL worker account");
  }
  
  // Get the deployer account (should be contract owner)
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Using account: ${deployer.address}`);
  
  // Load contract ABI
  let contractABI;
  try {
    const abiPath = path.join(__dirname, "../rofl-worker/contract_abi.json");
    if (fs.existsSync(abiPath)) {
      contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    } else {
      // Fallback to compiled contract
      const ConfidentialSentimentAnalysis = await ethers.getContractFactory("ConfidentialSentimentAnalysis");
      contractABI = ConfidentialSentimentAnalysis.interface.formatJson();
    }
  } catch (error) {
    throw new Error(`Failed to load contract ABI: ${error.message}`);
  }
  
  // Connect to the contract
  const contract = new ethers.Contract(contractAddress, contractABI, deployer);
  
  console.log(`📄 Contract Address: ${contractAddress}`);
  console.log(`🔑 ROFL App ID: ${roflAppId}`);
  console.log(`👤 Worker Address: ${workerAddress}`);
  
  // Check if caller is the platform owner
  try {
    const platformOwner = await contract.platformOwner();
    if (platformOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error(`Only platform owner (${platformOwner}) can register ROFL worker. Current account: ${deployer.address}`);
    }
    console.log("✅ Caller is platform owner");
  } catch (error) {
    console.error("❌ Failed to verify platform owner:", error.message);
    return;
  }
  
  // Register the ROFL worker
  try {
    console.log("🔄 Registering ROFL worker...");
    
    // Convert ROFL App ID to bytes32 if it's a string
    let appIdBytes32;
    if (roflAppId.startsWith("0x")) {
      appIdBytes32 = roflAppId;
    } else {
      // Convert string to bytes32
      appIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(roflAppId));
    }
    
    // Estimate gas
    const gasEstimate = await contract.registerROFLWorker.estimateGas(appIdBytes32, workerAddress);
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    
    // Send transaction
    const tx = await contract.registerROFLWorker(appIdBytes32, workerAddress, {
      gasLimit: gasEstimate + 50000n, // Add buffer
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Check for events
    const events = receipt.logs;
    for (const event of events) {
      try {
        const parsedEvent = contract.interface.parseLog(event);
        if (parsedEvent.name === "ROFLWorkerRegistered") {
          console.log("🎉 ROFL Worker registered successfully!");
          console.log(`   App ID: ${parsedEvent.args.appId}`);
          console.log(`   Worker Address: ${parsedEvent.args.workerAddress}`);
        }
      } catch (e) {
        // Ignore parsing errors for other events
      }
    }
    
    // Verify registration
    console.log("\n🔍 Verifying registration...");
    const currentAppId = await contract.expectedROFLAppId();
    const currentWorkerAddress = await contract.roflWorkerAddress();
    const roflEnabled = await contract.roflEnabled();
    
    console.log(`Current App ID: ${currentAppId}`);
    console.log(`Current Worker: ${currentWorkerAddress}`);
    console.log(`ROFL Enabled: ${roflEnabled}`);
    
    if (currentAppId === appIdBytes32 && currentWorkerAddress === workerAddress && roflEnabled) {
      console.log("✅ Registration verified successfully!");
    } else {
      console.log("⚠️  Registration verification failed. Check the values above.");
    }
    
  } catch (error) {
    console.error("❌ Failed to register ROFL worker:");
    console.error(error.message);
    
    if (error.message.includes("revert")) {
      console.log("\n💡 Common issues:");
      console.log("- Make sure you're using the platform owner account");
      console.log("- Check that the ROFL App ID is correct");
      console.log("- Verify the worker address is valid");
    }
    
    return;
  }
  
  // Save configuration for ROFL worker
  const roflConfig = {
    contractAddress,
    roflAppId: appIdBytes32,
    workerAddress,
    registeredAt: new Date().toISOString(),
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  };
  
  const configFile = path.join(__dirname, "../rofl-worker/rofl-config.json");
  fs.writeFileSync(configFile, JSON.stringify(roflConfig, null, 2));
  console.log(`💾 ROFL configuration saved to: ${configFile}`);
  
  // Instructions for next steps
  console.log("\n📋 Next Steps:");
  console.log("=".repeat(50));
  console.log("1. Set these environment variables for your ROFL worker:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   ROFL_APP_ID=${roflAppId}`);
  console.log(`   WORKER_PRIVATE_KEY=<your-worker-private-key>`);
  console.log(`   SAPPHIRE_RPC_URL=${network.name.includes("testnet") ? "https://testnet.sapphire.oasis.dev" : "https://sapphire.oasis.dev"}`);
  
  console.log("\n2. Deploy your ROFL application:");
  console.log("   cd rofl-worker");
  console.log("   oasis rofl deploy --network testnet");
  
  console.log("\n3. Start the ROFL worker:");
  console.log("   python main.py");
  
  console.log("\n🎉 ROFL Worker registration completed!");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ ROFL registration failed:");
    console.error(error);
    process.exit(1);
  });
