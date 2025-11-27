/**
 * Simple script to export deployed contract addresses to frontend
 * Usage: npx hardhat run scripts/export-addresses.ts [chainId]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Network chain ID to deployment directory mapping
const CHAIN_ID_TO_DIR: Record<number, string> = {
  31337: "chain-31337", // Hardhat local network
  11155111: "chain-11155111", // Sepolia testnet
  1: "chain-1", // Mainnet
};

// Contract name mapping from deployment artifacts to frontend names
// Prioritizes V3 deployments over V2
const CONTRACT_NAMES = {
  CarbonCreditToken: ["EcoSystemV3Module#CarbonCreditToken", "EcoSystemV2Module#CarbonCreditToken"],
  EcoBadgeNFT: ["EcoSystemV3Module#EcoBadgeNFT", "EcoSystemV2Module#EcoBadgeNFT"],
  EcoLedgerV2: ["EcoSystemV3Module#EcoLedgerV2", "EcoSystemV2Module#EcoLedgerV2"],
  AccessControl: ["EcoSystemV3Module#AccessControl", "EcoSystemV2Module#AccessControl"],
  CarbonCreditMarketplace: ["EcoSystemV3Module#CarbonCreditMarketplace", "EcoSystemV2Module#CarbonCreditMarketplace"],
  CreditStaking: ["EcoSystemV3Module#CreditStaking", "EcoSystemV2Module#CreditStaking"],
  Governance: ["EcoSystemV3Module#Governance", "EcoSystemV2Module#Governance"],
  Leaderboard: ["EcoSystemV3Module#Leaderboard", "EcoSystemV2Module#Leaderboard"],
  // V3 new contracts
  CreditRetirement: ["EcoSystemV3Module#CreditRetirement"],
  CreditExpiration: ["EcoSystemV3Module#CreditExpiration"],
  TimelockController: ["EcoSystemV3Module#TimelockController"],
  BatchOperations: ["EcoSystemV3Module#BatchOperations"],
  Analytics: ["EcoSystemV3Module#Analytics"],
};

// Helper to find contract address (tries V3 first, then V2)
function findContractAddress(addresses: Record<string, string>, names: string[]): string | undefined {
  for (const name of names) {
    if (addresses[name]) {
      return addresses[name];
    }
  }
  return undefined;
}

function getDeployedAddresses(chainId: number): Record<string, string> {
  const chainDir = CHAIN_ID_TO_DIR[chainId] || `chain-${chainId}`;
  const deploymentsDir = join(__dirname, "..", "ignition", "deployments", chainDir);
  const addressesFile = join(deploymentsDir, "deployed_addresses.json");

  if (!existsSync(addressesFile)) {
    console.log(`⚠️  No deployment found for chain ${chainId} at ${addressesFile}`);
    return {};
  }

  try {
    const content = readFileSync(addressesFile, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading addresses file: ${error}`);
    return {};
  }
}

function exportAddressesForFrontend(chainId: number = 31337): void {
  const addresses = getDeployedAddresses(chainId);

  if (Object.keys(addresses).length === 0) {
    console.log("⚠️  No deployed addresses found. Using default Hardhat addresses for local development.");
  }

  // Map to frontend format
  const frontendAddresses: Record<string, string> = {
    CARBON_CREDIT_TOKEN: findContractAddress(addresses, CONTRACT_NAMES.CarbonCreditToken) || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ECO_BADGE_NFT: findContractAddress(addresses, CONTRACT_NAMES.EcoBadgeNFT) || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    ECOLEDGER_CONTRACT: findContractAddress(addresses, CONTRACT_NAMES.EcoLedgerV2) || "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    ACCESS_CONTROL: findContractAddress(addresses, CONTRACT_NAMES.AccessControl) || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    MARKETPLACE: findContractAddress(addresses, CONTRACT_NAMES.CarbonCreditMarketplace) || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    STAKING: findContractAddress(addresses, CONTRACT_NAMES.CreditStaking) || "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    GOVERNANCE: findContractAddress(addresses, CONTRACT_NAMES.Governance) || "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    LEADERBOARD: findContractAddress(addresses, CONTRACT_NAMES.Leaderboard) || "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
    CREDIT_RETIREMENT: findContractAddress(addresses, CONTRACT_NAMES.CreditRetirement) || "",
    CREDIT_EXPIRATION: findContractAddress(addresses, CONTRACT_NAMES.CreditExpiration) || "",
    TIMELOCK_CONTROLLER: findContractAddress(addresses, CONTRACT_NAMES.TimelockController) || "",
    BATCH_OPERATIONS: findContractAddress(addresses, CONTRACT_NAMES.BatchOperations) || "",
    ANALYTICS: findContractAddress(addresses, CONTRACT_NAMES.Analytics) || "",
    COUNTER: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Default Hardhat counter
  };

  // Export to frontend directory as TypeScript file
  const frontendDir = join(__dirname, "..", "..", "frontend-react", "src", "lib", "config");
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
  CREDIT_RETIREMENT: "${frontendAddresses.CREDIT_RETIREMENT}",
  CREDIT_EXPIRATION: "${frontendAddresses.CREDIT_EXPIRATION}",
  TIMELOCK_CONTROLLER: "${frontendAddresses.TIMELOCK_CONTROLLER}",
  BATCH_OPERATIONS: "${frontendAddresses.BATCH_OPERATIONS}",
  ANALYTICS: "${frontendAddresses.ANALYTICS}",
  COUNTER: "${frontendAddresses.COUNTER}",
} as const;

export type ContractAddressKey = keyof typeof CONTRACT_ADDRESSES;
`;

  const outputFile = join(frontendDir, "contract-addresses.ts");
  writeFileSync(outputFile, tsContent);

  console.log("✅ Contract addresses exported to:", outputFile);
  console.log("\n📋 Exported addresses:");
  Object.entries(frontendAddresses).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
}

// Main execution - default to 31337 (Hardhat local network)
// Chain ID can be set via CHAIN_ID environment variable
const chainIdEnv = process.env.CHAIN_ID;
const chainId = chainIdEnv ? parseInt(chainIdEnv) : 31337;

console.log(`📦 Exporting contract addresses for chain ID: ${chainId}`);
exportAddressesForFrontend(chainId);

