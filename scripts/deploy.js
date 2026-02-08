const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PlasmaX402Gate to Plasma Testnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "XPL\n");

  // Set price: 0.01 XPL (10000000000000000 wei)
  const price = ethers.parseEther("0.01");
  console.log("💵 Setting price to:", ethers.formatEther(price), "XPL per request\n");

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const PlasmaX402Gate = await ethers.getContractFactory("PlasmaX402Gate");
  const gateway = await PlasmaX402Gate.deploy(price);

  await gateway.waitForDeployment();
  const contractAddress = await gateway.getAddress();

  console.log("✅ PlasmaX402Gate deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("\n📋 Contract Details:");
  console.log("   Owner:", await gateway.owner());
  console.log("   Price:", ethers.formatEther(await gateway.price()), "XPL");
  console.log("   Balance:", ethers.formatEther(await gateway.getBalance()), "XPL");

  console.log("\n🔗 View on Explorer:");
  console.log(`   https://testnet.plasmascan.to/address/${contractAddress}`);

  console.log("\n📝 Save this info:");
  console.log("=====================================");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("=====================================");
  
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
