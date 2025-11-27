import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Network chain ID to deployment directory mapping
const CHAIN_ID_TO_DIR: Record<number, string> = {
  31337: "chain-31337", // Hardhat local network
  11155111: "chain-11155111", // Sepolia testnet
  1: "chain-1", // Mainnet
};

// Contract name mapping
const CONTRACT_NAMES = {
  CarbonCreditToken: "EcoSystemV2Module#CarbonCreditToken",
  EcoBadgeNFT: "EcoSystemV2Module#EcoBadgeNFT",
  EcoLedgerV2: "EcoSystemV2Module#EcoLedgerV2",
  AccessControl: "EcoSystemV2Module#AccessControl",
  CarbonCreditMarketplace: "EcoSystemV2Module#CarbonCreditMarketplace",
  CreditStaking: "EcoSystemV2Module#CreditStaking",
  Governance: "EcoSystemV2Module#Governance",
  Leaderboard: "EcoSystemV2Module#Leaderboard",
};

async function getDeployedAddresses(chainId: number): Promise<Record<string, string>> {
  const chainDir = CHAIN_ID_TO_DIR[chainId] || `chain-${chainId}`;
  const deploymentsDir = join(__dirname, "..", "ignition", "deployments", chainDir);
  const addressesFile = join(deploymentsDir, "deployed_addresses.json");

  if (!existsSync(addressesFile)) {
    console.log(`No deployment found for chain ${chainId}`);
    return {};
  }

  try {
    const content = readFileSync(addressesFile, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading addresses file: ${error}`);
    return {};
  }
}

async function exportAddressesForFrontend(chainId: number = 31337, autoDeploy: boolean = false): Promise<void> {
  let addresses = await getDeployedAddresses(chainId);
  
  if (Object.keys(addresses).length === 0 && autoDeploy) {
    console.log("No deployed addresses found. Deploying contracts...");
    try {
      await deployContracts();
      // Retry reading addresses after deployment
      addresses = await getDeployedAddresses(chainId);
    } catch (error) {
      console.warn("⚠️  Deployment failed or skipped. Using default addresses.");
    }
  }

  // Map to frontend format
  const frontendAddresses: Record<string, string> = {
    CARBON_CREDIT_TOKEN: addresses[CONTRACT_NAMES.CarbonCreditToken] || "",
    ECO_BADGE_NFT: addresses[CONTRACT_NAMES.EcoBadgeNFT] || "",
    ECOLEDGER_CONTRACT: addresses[CONTRACT_NAMES.EcoLedgerV2] || "",
    ACCESS_CONTROL: addresses[CONTRACT_NAMES.AccessControl] || "",
    MARKETPLACE: addresses[CONTRACT_NAMES.CarbonCreditMarketplace] || "",
    STAKING: addresses[CONTRACT_NAMES.CreditStaking] || "",
    GOVERNANCE: addresses[CONTRACT_NAMES.Governance] || "",
    LEADERBOARD: addresses[CONTRACT_NAMES.Leaderboard] || "",
    COUNTER: "", // Counter is deployed separately if needed
  };

  // Export to frontend directory as TypeScript file
  const frontendDir = join(__dirname, "..", "..", "frontend", "src", "lib", "config");
  if (!existsSync(frontendDir)) {
    mkdirSync(frontendDir, { recursive: true });
  }

  // Generate TypeScript file
  const tsContent = `/**
 * Auto-generated contract addresses from deployment artifacts
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Generated on: ${new Date().toISOString()}
 * Chain ID: ${chainId}
 */

export const CONTRACT_ADDRESSES = {
  CARBON_CREDIT_TOKEN: "${frontendAddresses.CARBON_CREDIT_TOKEN}",
  ECO_BADGE_NFT: "${frontendAddresses.ECO_BADGE_NFT}",
  ECOLEDGER_CONTRACT: "${frontendAddresses.ECOLEDGER_CONTRACT}",
  ACCESS_CONTROL: "${frontendAddresses.ACCESS_CONTROL}",
  MARKETPLACE: "${frontendAddresses.MARKETPLACE}",
  STAKING: "${frontendAddresses.STAKING}",
  GOVERNANCE: "${frontendAddresses.GOVERNANCE}",
  LEADERBOARD: "${frontendAddresses.LEADERBOARD}",
  COUNTER: "${frontendAddresses.COUNTER || "0x0000000000000000000000000000000000000000"}",
} as const;

export type ContractAddressKey = keyof typeof CONTRACT_ADDRESSES;
`;

  const outputFile = join(frontendDir, "contract-addresses.ts");
  writeFileSync(outputFile, tsContent);
  
  console.log("✅ Contract addresses exported to:", outputFile);
  console.log("Addresses:", frontendAddresses);
}

async function deployContracts(): Promise<boolean> {
  console.log("🚀 Deploying contracts...");
  return new Promise((resolve, reject) => {
    // Deploy using Hardhat Ignition
    const deployProcess = spawn("npx", [
      "hardhat",
      "ignition",
      "deploy",
      "ignition/modules/EcoSystemV2.ts",
      "--network",
      "hardhatMainnet"
    ], {
      cwd: join(__dirname, ".."),
      stdio: "inherit",
      shell: true
    });

    deployProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Contracts deployed successfully!");
        resolve(true);
      } else {
        console.error(`❌ Deployment failed with code ${code}`);
        reject(new Error(`Deployment failed with exit code ${code}`));
      }
    });

    deployProcess.on("error", (error) => {
      console.error("❌ Deployment process error:", error);
      reject(error);
    });
  });
}

async function main() {
  const chainIdArg = process.argv[2];
  const autoDeploy = process.argv.includes("--deploy") || process.argv.includes("-d");
  const chainId = chainIdArg ? parseInt(chainIdArg) : 31337;

  console.log(`📦 Processing contracts for chain ID: ${chainId}`);
  if (autoDeploy) {
    console.log("🚀 Auto-deploy enabled - will deploy if addresses not found");
  }

  try {
    await exportAddressesForFrontend(chainId, autoDeploy);
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getDeployedAddresses, exportAddressesForFrontend, deployContracts };

