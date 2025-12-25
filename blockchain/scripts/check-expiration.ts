import { network } from "hardhat";
import type { EventLog } from "ethers";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking credit expiration with account:", deployer.address);

  const expirationAddress = process.argv[2];
  const holderAddress = process.argv[3];

  if (!expirationAddress || !holderAddress) {
    console.error("Usage: npx hardhat run scripts/check-expiration.ts --network <network> <expiration_address> <holder_address>");
    process.exit(1);
  }

  const Expiration = await ethers.getContractFactory("CreditExpiration");
  const expiration = Expiration.attach(expirationAddress);

  console.log(`Checking expiration status for: ${holderAddress}`);

  const status = await expiration.getExpirationStatus(holderAddress);
  console.log("\nExpiration Status:");
  console.log(`  Total Batches: ${status.totalBatches}`);
  console.log(`  Active Batches: ${status.activeBatches}`);
  console.log(`  Expired Batches: ${status.expiredBatches}`);
  console.log(`  Total Expired Amount: ${ethers.formatEther(status.totalExpiredAmount)} tokens`);
  console.log(`  Next Expiration: ${new Date(Number(status.nextExpirationTimestamp) * 1000).toLocaleString()}`);

  // Check and expire if needed
  console.log("\nChecking for expired credits...");
  const tx = await expiration.checkAndExpire(holderAddress);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt) {
    console.log("Transaction receipt is null");
    return;
  }

  // Find the CreditsExpired event and check if it's an EventLog with args
  const expiredEvent = receipt.logs.find(
    (log): log is EventLog =>
      'eventName' in log && log.eventName === "CreditsExpired"
  );

  if (expiredEvent && expiredEvent.args) {
    console.log(`Expired ${ethers.formatEther(expiredEvent.args.amount)} credits`);
  } else {
    console.log("No credits expired at this time");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

