import { ethers } from "hardhat";

/**
 * Platform Initialization Script
 * 
 * This script initializes the EcoCred platform after deployment:
 * - Grants VERIFIER role to specified addresses
 * - Sets initial platform parameters
 * - Validates deployment configuration
 */

async function main() {
  console.log("🌍 Initializing EcoCred Platform...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Load contract addresses from deployment artifacts
  // You'll need to update these addresses after deployment
  const ACCESS_CONTROL_ADDRESS = process.env.ACCESS_CONTROL_ADDRESS || "0x...";
  const ECO_LEDGER_ADDRESS = process.env.ECO_LEDGER_ADDRESS || "0x...";
  
  if (ACCESS_CONTROL_ADDRESS === "0x..." || ECO_LEDGER_ADDRESS === "0x...") {
    console.error("❌ Please set ACCESS_CONTROL_ADDRESS and ECO_LEDGER_ADDRESS environment variables");
    console.log("\nExample:");
    console.log("  ACCESS_CONTROL_ADDRESS=0x... ECO_LEDGER_ADDRESS=0x... npx hardhat run scripts/initialize-platform.ts\n");
    process.exit(1);
  }

  // Get contract instances
  console.log("📄 Loading contracts...");
  const AccessControl = await ethers.getContractAt("AccessControl", ACCESS_CONTROL_ADDRESS);
  const EcoLedger = await ethers.getContractAt("EcoLedgerV2", ECO_LEDGER_ADDRESS);
  
  console.log("✓ AccessControl at:", ACCESS_CONTROL_ADDRESS);
  console.log("✓ EcoLedgerV2 at:", ECO_LEDGER_ADDRESS);
  console.log();

  // Step 1: Grant VERIFIER roles
  console.log("1️⃣  Granting VERIFIER Roles");
  console.log("────────────────────────────────────────");
  
  // Add verifier addresses here
  const verifiers = [
    // Example verifier addresses - replace with actual addresses
    // "0x1234567890123456789012345678901234567890",
    // "0x2345678901234567890123456789012345678901",
  ];

  if (verifiers.length === 0) {
    console.log("⚠️  No verifiers specified. Skipping verifier role grants.");
    console.log("   To add verifiers, edit this script and add addresses to the 'verifiers' array.\n");
  } else {
    for (const verifier of verifiers) {
      try {
        console.log(`Granting VERIFIER role to ${verifier}...`);
        const tx = await AccessControl.grantRole(verifier, 2); // 2 = VERIFIER role
        await tx.wait();
        console.log(`✓ Granted VERIFIER role to ${verifier}`);
      } catch (error: any) {
        console.error(`✗ Failed to grant role to ${verifier}:`, error.message);
      }
    }
    console.log();
  }

  // Step 2: Set Initial Platform Parameters
  console.log("2️⃣  Setting Platform Parameters");
  console.log("────────────────────────────────────────");
  
  try {
    // Set verification threshold (number of verifiers needed to approve an action)
    const currentThreshold = await EcoLedger.verificationThreshold();
    console.log(`Current verification threshold: ${currentThreshold}`);
    
    // Optionally update threshold
    const newThreshold = 1; // Change as needed
    if (currentThreshold !== BigInt(newThreshold)) {
      console.log(`Setting verification threshold to ${newThreshold}...`);
      const tx = await EcoLedger.setVerificationThreshold(newThreshold);
      await tx.wait();
      console.log(`✓ Verification threshold set to ${newThreshold}`);
    } else {
      console.log(`✓ Verification threshold already set to ${newThreshold}`);
    }
  } catch (error: any) {
    console.error("✗ Failed to set platform parameters:", error.message);
  }
  console.log();

  // Step 3: Validate Deployment
  console.log("3️⃣  Validating Deployment");
  console.log("────────────────────────────────────────");
  
  try {
    // Check if deployer is admin
    const isAdmin = await AccessControl.hasRole(deployer.address, 1); // 1 = ADMIN role
    console.log(`Deployer admin status: ${isAdmin ? "✓ Admin" : "✗ Not Admin"}`);
    
    // Check contract ownership
    const ledgerOwner = await EcoLedger.owner();
    console.log(`EcoLedger owner: ${ledgerOwner}`);
    console.log(`Owner matches deployer: ${ledgerOwner === deployer.address ? "✓ Yes" : "✗ No"}`);
    
    // Get platform stats
    console.log("\n📊 Platform Statistics:");
    console.log("────────────────────────────────────────");
    console.log("Platform initialized and ready for use!");
    
  } catch (error: any) {
    console.error("✗ Validation failed:", error.message);
  }
  console.log();

  // Summary
  console.log("════════════════════════════════════════");
  console.log("✨ Platform Initialization Complete!");
  console.log("════════════════════════════════════════");
  console.log("\nNext Steps:");
  console.log("1. Verify all contract deployments");
  console.log("2. Add more verifiers as needed using AccessControl.grantRole()");
  console.log("3. Configure frontend with contract addresses");
  console.log("4. Test the platform with sample eco actions");
  console.log();
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
