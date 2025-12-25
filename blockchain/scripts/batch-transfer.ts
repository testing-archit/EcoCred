import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Batch transferring credits with account:", deployer.address);

  const batchOpsAddress = process.argv[2];
  const recipients = process.argv.slice(3);

  if (!batchOpsAddress || recipients.length === 0) {
    console.error("Usage: npx hardhat run scripts/batch-transfer.ts --network <network> <batch_ops_address> <recipient1> <recipient2> ... [amount1] [amount2] ...");
    console.error("Example: npx hardhat run scripts/batch-transfer.ts --network localhost <address> 0x123... 0x456... 1000000000000000000 2000000000000000000");
    process.exit(1);
  }

  const BatchOps = await ethers.getContractFactory("BatchOperations");
  const batchOps = BatchOps.attach(batchOpsAddress);

  // Parse recipients and amounts
  const recipientAddresses: string[] = [];
  const amounts: bigint[] = [];
  const defaultAmount = ethers.parseEther("1"); // 1 token default

  for (let i = 0; i < recipients.length; i++) {
    if (ethers.isAddress(recipients[i])) {
      recipientAddresses.push(recipients[i]);
      // Check if next argument is an amount
      if (i + 1 < recipients.length && !ethers.isAddress(recipients[i + 1])) {
        amounts.push(BigInt(recipients[i + 1]));
        i++; // Skip the amount in next iteration
      } else {
        amounts.push(defaultAmount);
      }
    }
  }

  if (recipientAddresses.length === 0) {
    console.error("No valid recipient addresses provided");
    process.exit(1);
  }

  console.log(`Batch transferring to ${recipientAddresses.length} recipients...`);
  for (let i = 0; i < recipientAddresses.length; i++) {
    console.log(`  ${recipientAddresses[i]}: ${ethers.formatEther(amounts[i])} tokens`);
  }

  const tx = await batchOps.batchTransfer(recipientAddresses, amounts);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Batch transfer successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

