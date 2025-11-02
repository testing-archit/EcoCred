import { network } from "hardhat";
import { parseEther } from "ethers";

const { ethers } = await network.connect();

/**
 * Script to verify an eco action
 * Usage: npx hardhat run scripts/verify-action.ts --network <network>
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Verifying action with account:", signer.address);

  // Get contract addresses from environment or pass as arguments
  const ledgerAddress = process.env.ECOLEDGER_CONTRACT || process.argv[2];
  const actionId = process.argv[3] || "1";
  const approved = process.argv[4] !== "false"; // default true
  const credits = process.argv[5] || "100";

  if (!ledgerAddress) {
    throw new Error("Please provide EcoLedger contract address");
  }

  // Get contract instance
  const ledgerAbi = [
    "function verifyAction(uint256 actionId, bool approved, uint256 actualCredits)",
    "function getAction(uint256 actionId) view returns (address company, string memory title, string memory description, uint256 estimatedCredits, string memory location, bool verified, uint256 actualCredits)",
  ];

  const ledger = new ethers.Contract(ledgerAddress, ledgerAbi, signer);

  // Get action details first
  try {
    const action = await ledger.getAction(actionId);
    console.log("\nAction Details:");
    console.log("Title:", action.title);
    console.log("Company:", action.company);
    console.log("Estimated Credits:", action.estimatedCredits.toString());
    console.log("Already Verified:", action.verified);
    console.log("");
  } catch (error) {
    console.error("Error fetching action:", error);
    return;
  }

  // Verify the action
  try {
    const tx = await ledger.verifyAction(actionId, approved, parseEther(credits));
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Action verified successfully!");
  } catch (error: any) {
    console.error("Error verifying action:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

