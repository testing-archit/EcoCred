import { network } from "hardhat";
import { parseEther } from "ethers";

const { ethers } = await network.connect();

/**
 * Script to stake carbon credits
 * Usage: npx hardhat run scripts/stake-credits.ts --network <network>
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Staking credits with account:", signer.address);

  const stakingAddress = process.env.STAKING_CONTRACT || process.argv[2];
  const tokenAddress = process.env.CARBON_CREDIT_TOKEN || process.argv[3];
  const amount = process.argv[4] || "100";
  const lockPeriodDays = process.argv[5] || "30";

  if (!stakingAddress || !tokenAddress) {
    throw new Error("Please provide Staking and Token contract addresses");
  }

  const tokenAbi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
  ];

  const stakingAbi = [
    "function stake(uint256 amount, uint256 lockPeriodInDays)",
    "function getStakeCount(address user) view returns (uint256)",
    "function rewardRate() view returns (uint256)",
  ];

  const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
  const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);

  // Check balance
  const balance = await token.balanceOf(signer.address);
  const amountWei = parseEther(amount);
  
  console.log("Current balance:", ethers.formatEther(balance));
  console.log("Amount to stake:", amount);
  console.log("Lock period (days):", lockPeriodDays);

  if (balance < amountWei) {
    throw new Error("Insufficient balance");
  }

  // Get current reward rate
  const rewardRate = await staking.rewardRate();
  console.log("Current reward rate:", ethers.formatEther(rewardRate * BigInt(100) / BigInt(10000)), "% per year");

  // Approve staking contract
  try {
    const approveTx = await token.approve(stakingAddress, amountWei);
    await approveTx.wait();
    console.log("Approval successful");
  } catch (error: any) {
    console.error("Error approving:", error.message);
    return;
  }

  // Stake tokens
  try {
    const tx = await staking.stake(amountWei, lockPeriodDays);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    const stakeCount = await staking.getStakeCount(signer.address);
    console.log("Staking successful! Total stakes:", stakeCount.toString());
    console.log(`Tokens locked for ${lockPeriodDays} days`);
  } catch (error: any) {
    console.error("Error staking:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

