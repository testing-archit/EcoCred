import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Platform Initialization Script
 * 
 * This script initializes the EcoCred platform after contract deployment.
 * It performs the following tasks:
 * 1. Grant VERIFIER roles to specified addresses
 * 2. Set initial platform parameters
 * 3. Validate deployment configuration
 * 
 * Usage: 
 * ACCESS_CONTROL_ADDRESS=0x... ECO_LEDGER_ADDRESS=0x... npx hardhat run scripts/initialize-platform.ts --network <network>
 */

async function main() {
  console.log("🌍 Initializing EcoCred Platform...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Load contract addresses from deployment artifacts
  // You'll need to update these addresses after deployment
  const ACCESS_CONTROL_ADDRESS = process.env.ACCESS_CONTROL_ADDRESS;
  const ECO_LEDGER_ADDRESS = process.env.ECO_LEDGER_ADDRESS;

  if (!ACCESS_CONTROL_ADDRESS || !ECO_LEDGER_ADDRESS) {
    console.error("❌ Error: Required environment variables not set!");
    console.error("   Please set ACCESS_CONTROL_ADDRESS and ECO_LEDGER_ADDRESS");
    console.error("\nUsage:");
    console.error("   ACCESS_CONTROL_ADDRESS=0x... ECO_LEDGER_ADDRESS=0x... npx hardhat run scripts/initialize-platform.ts --network <network>");
    process.exit(1);
  }

  // Get contract instances
  console.log("📄 Loading contracts...");
  const AccessControl = await ethers.getContractAt("AccessControl", ACCESS_CONTROL_ADDRESS);
  const EcoLedger = await ethers.getContractAt("EcoLedgerV2", ECO_LEDGER_ADDRESS);

  console.log("✓ AccessControl at:", ACCESS_CONTROL_ADDRESS);
  console.log("✓ EcoLedgerV2 at:", ECO_LEDGER_ADDRESS);
  console.log("");

  // ============================================================================
  // STEP 1: Grant VERIFIER roles
  // ============================================================================
  console.log("👥 Granting VERIFIER roles...");

  const VERIFIER_ADDRESSES = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat account #1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat account #2
    // Add more verifier addresses here
  ];

  // Role enum value: 0=NONE, 1=ADMIN, 2=VERIFIER, 3=MODERATOR
  const VERIFIER_ROLE = 2;

  for (const verifierAddress of VERIFIER_ADDRESSES) {
    try {
      const hasRole = await AccessControl.hasRole(
        verifierAddress,
        VERIFIER_ROLE
      );

      if (hasRole) {
        console.log(`   ⏭  ${verifierAddress} already has VERIFIER role`);
        continue;
      }

      const tx = await AccessControl.grantRole(verifierAddress, VERIFIER_ROLE);
      await tx.wait();
      console.log(`   ✅ Granted VERIFIER role to ${verifierAddress}`);
    } catch (error) {
      console.error(`   ❌ Failed to grant role to ${verifierAddress}:`, error);
    }
  }
  console.log("");

  // ============================================================================
  // STEP 2: Set platform parameters
  // ============================================================================
  console.log("⚙️  Setting platform parameters...");

  try {
    // Set verification threshold (minimum verifications required)
    const currentThreshold = await EcoLedger.verificationThreshold();
    const newThreshold = 1; // Require 1 verification for approval

    if (currentThreshold !== BigInt(newThreshold)) {
      const tx = await EcoLedger.setVerificationThreshold(newThreshold);
      await tx.wait();
      console.log(`   ✅ Set verification threshold to ${newThreshold}`);
    } else {
      console.log(`   ⏭  Verification threshold already set to ${currentThreshold}`);
    }
  } catch (error) {
    console.error("   ❌ Failed to set verification threshold:", error);
  }
  console.log("");

  // ============================================================================
  // STEP 3: Validate deployment
  // ============================================================================
  console.log("🔍 Validating deployment...");

  // Check admin role (Role.ADMIN = 1)
  const ADMIN_ROLE = 1;
  const hasAdminRole = await AccessControl.hasRole(
    deployer.address,
    ADMIN_ROLE
  );
  console.log(`   ${hasAdminRole ? "✅" : "❌"} Deployer has admin role:`, hasAdminRole);

  // Check verifier count
  const verifierCount = VERIFIER_ADDRESSES.length;
  console.log(`   ✅ Total verifiers configured: ${verifierCount}`);

  // Check threshold
  const threshold = await EcoLedger.verificationThreshold();
  console.log(`   ✅ Verification threshold: ${threshold}`);

  console.log("");
  console.log("🎉 Platform initialization complete!");
  console.log("");
  console.log("📋 Next Steps:");
  console.log("   1. Share verifier addresses with your team");
  console.log("   2. Test eco action submission and verification");
  console.log("   3. Configure frontend with contract addresses");
  console.log("   4. Deploy to production when ready");
  console.log("");
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
