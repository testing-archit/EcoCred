import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Retiring credits with account:", deployer.address);

  const retirementAddress = process.argv[2];
  const amount = process.argv[3] || "1000000000000000000"; // 1 token default (18 decimals)
  const reason = process.argv[4] || "Offset company emissions";
  const certificateId = process.argv[5] || `CERT-${Date.now()}`;

  if (!retirementAddress) {
    console.error("Usage: npx hardhat run scripts/retire-credits.ts --network <network> <retirement_address> [amount] [reason] [certificate_id]");
    process.exit(1);
  }

  const Retirement = await ethers.getContractFactory("CreditRetirement");
  const retirement = Retirement.attach(retirementAddress);

  console.log(`Retiring ${ethers.formatEther(amount)} credits...`);
  console.log(`Reason: ${reason}`);
  console.log(`Certificate ID: ${certificateId}`);

  const tx = await retirement.retireCredits(amount, reason, certificateId);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  if (receipt && receipt.logs.length > 0) {
    const log = receipt.logs[0] as any;
    console.log("Retirement successful! Retirement ID:", log.args?.[0]?.toString() || "Unknown");
  } else {
    console.log("Retirement transaction completed but no event logs found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
