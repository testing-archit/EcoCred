/**
 * Auto-detected contract addresses from deployment artifacts
 * This file reads addresses from Hardhat deployment artifacts
 */

import { readFileSync, existsSync } from "fs";
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

// Contract name mapping - supports both V2 and V3 deployments
const CONTRACT_NAMES = {
  // V2 contracts
  CarbonCreditToken: ["EcoSystemV2Module#CarbonCreditToken", "EcoSystemV3Module#CarbonCreditToken"],
  EcoBadgeNFT: ["EcoSystemV2Module#EcoBadgeNFT", "EcoSystemV3Module#EcoBadgeNFT"],
  EcoLedgerV2: ["EcoSystemV2Module#EcoLedgerV2", "EcoSystemV3Module#EcoLedgerV2"],
  AccessControl: ["EcoSystemV2Module#AccessControl", "EcoSystemV3Module#AccessControl"],
  CarbonCreditMarketplace: ["EcoSystemV2Module#CarbonCreditMarketplace", "EcoSystemV3Module#CarbonCreditMarketplace"],
  CreditStaking: ["EcoSystemV2Module#CreditStaking", "EcoSystemV3Module#CreditStaking"],
  Governance: ["EcoSystemV2Module#Governance", "EcoSystemV3Module#Governance"],
  Leaderboard: ["EcoSystemV2Module#Leaderboard", "EcoSystemV3Module#Leaderboard"],
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

function getDeployedAddresses(chainId: number = 31337): Record<string, string> {
  const chainDir = CHAIN_ID_TO_DIR[chainId] || `chain-${chainId}`;
  const deploymentsDir = join(__dirname, "..", "..", "..", "blockchain", "ignition", "deployments", chainDir);
  const addressesFile = join(deploymentsDir, "deployed_addresses.json");

  if (!existsSync(addressesFile)) {
    console.warn(`⚠️  No deployment found for chain ${chainId} at ${addressesFile}`);
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

export function getContractAddresses(chainId: number = 31337): {
  carbonCreditToken?: string;
  ecoBadgeNFT?: string;
  ecoLedgerV2?: string;
  marketplace?: string;
  staking?: string;
  governance?: string;
  leaderboard?: string;
  accessControl?: string;
  creditRetirement?: string;
  creditExpiration?: string;
  timelockController?: string;
  batchOperations?: string;
  analytics?: string;
} {
  const addresses = getDeployedAddresses(chainId);

  return {
    carbonCreditToken: findContractAddress(addresses, CONTRACT_NAMES.CarbonCreditToken),
    ecoBadgeNFT: findContractAddress(addresses, CONTRACT_NAMES.EcoBadgeNFT),
    ecoLedgerV2: findContractAddress(addresses, CONTRACT_NAMES.EcoLedgerV2),
    marketplace: findContractAddress(addresses, CONTRACT_NAMES.CarbonCreditMarketplace),
    staking: findContractAddress(addresses, CONTRACT_NAMES.CreditStaking),
    governance: findContractAddress(addresses, CONTRACT_NAMES.Governance),
    leaderboard: findContractAddress(addresses, CONTRACT_NAMES.Leaderboard),
    accessControl: findContractAddress(addresses, CONTRACT_NAMES.AccessControl),
    creditRetirement: findContractAddress(addresses, CONTRACT_NAMES.CreditRetirement),
    creditExpiration: findContractAddress(addresses, CONTRACT_NAMES.CreditExpiration),
    timelockController: findContractAddress(addresses, CONTRACT_NAMES.TimelockController),
    batchOperations: findContractAddress(addresses, CONTRACT_NAMES.BatchOperations),
    analytics: findContractAddress(addresses, CONTRACT_NAMES.Analytics),
  };
}

