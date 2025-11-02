import { network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Script to get deployed contract addresses from Hardhat Ignition
 * Usage: npx hardhat run scripts/get-deployed-addresses.ts --network <network>
 */
async function main() {
  const networkName = network.name;
  console.log(`\n📋 Deployed Contract Addresses for network: ${networkName}\n`);

  try {
    // Hardhat Ignition stores deployments in ignition/deployments/<chain-id>/
    // For local Hardhat network, chain ID is typically 31337
    const chainId = network.config.chainId || 31337;
    const deploymentsPath = join(
      process.cwd(),
      "ignition",
      "deployments",
      `chain-${chainId}`
    );

    // List all deployment directories
    const fs = await import("fs/promises");
    const deploymentDirs = await fs.readdir(deploymentsPath, { withFileTypes: true });

    const addresses: Record<string, Record<string, string>> = {};

    for (const dir of deploymentDirs) {
      if (dir.isDirectory()) {
        const moduleName = dir.name;
        const statePath = join(deploymentsPath, moduleName, "state.json");

        try {
          const stateContent = readFileSync(statePath, "utf-8");
          const state = JSON.parse(stateContent);

          addresses[moduleName] = {};

          // Extract contract addresses from deployment state
          if (state.chainSnapshot && state.chainSnapshot.contracts) {
            for (const [contractName, contractData] of Object.entries(
              state.chainSnapshot.contracts
            )) {
              if (
                contractData &&
                typeof contractData === "object" &&
                "address" in contractData
              ) {
                addresses[moduleName][contractName] = (
                  contractData as { address: string }
                ).address;
              }
            }
          }

          // Also check future module states
          if (state.future) {
            for (const future of state.future) {
              if (future.contracts) {
                for (const [contractName, contractData] of Object.entries(
                  future.contracts
                )) {
                  if (
                    contractData &&
                    typeof contractData === "object" &&
                    "address" in contractData
                  ) {
                    const fullName = `${future.moduleId}#${contractName}`;
                    addresses[moduleName][fullName] = (
                      contractData as { address: string }
                    ).address;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️  Could not read state for ${moduleName}:`, error);
        }
      }
    }

    // Display addresses
    if (Object.keys(addresses).length === 0) {
      console.log("❌ No deployments found for this network.\n");
      console.log("💡 Deploy contracts first:");
      console.log("   npm run deploy:counter    - Deploy Counter");
      console.log("   npm run deploy            - Deploy basic system");
      console.log("   npm run deploy:v2         - Deploy enhanced system\n");
      return;
    }

    for (const [moduleName, contracts] of Object.entries(addresses)) {
      console.log(`📦 Module: ${moduleName}`);
      console.log("─".repeat(50));
      
      for (const [contractName, address] of Object.entries(contracts)) {
        console.log(`   ${contractName.padEnd(40)} ${address}`);
      }
      console.log("");
    }

    // Also try to get from recent deployment output
    console.log("\n💡 Quick Access:");
    console.log("   Counter: npm run deploy:counter");
    console.log("   Basic System: npm run deploy");
    console.log("   Enhanced System: npm run deploy:v2\n");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("❌ No deployments found for this network.\n");
      console.log("💡 Deploy contracts first:");
      console.log("   npm run deploy:counter\n");
    } else {
      console.error("Error reading deployments:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

