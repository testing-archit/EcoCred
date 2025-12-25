import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const analyticsAddress = process.argv[2];
  const companyAddress = process.argv[3];

  if (!analyticsAddress) {
    console.error("Usage: npx hardhat run scripts/get-analytics.ts --network <network> <analytics_address> [company_address]");
    process.exit(1);
  }

  const Analytics = await ethers.getContractFactory("Analytics");
  const analytics = Analytics.attach(analyticsAddress);

  console.log("=== EcoCred Platform Analytics ===\n");

  // Platform stats
  const stats = await analytics.getPlatformStats();
  console.log("Platform Statistics:");
  console.log(`  Total Actions: ${stats.totalActions}`);
  console.log(`  Total Credits Minted: ${ethers.formatEther(stats.totalCreditsMinted)}`);
  console.log(`  Total Credits Retired: ${ethers.formatEther(stats.totalCreditsRetired)}`);
  console.log(`  Total Credits Staked: ${ethers.formatEther(stats.totalCreditsStaked)}`);
  console.log(`  Active Companies: ${stats.activeCompanies}`);

  // Credit distribution
  const distribution = await analytics.getCreditDistribution();
  console.log("\nCredit Distribution:");
  console.log(`  Total Supply: ${ethers.formatEther(distribution.totalSupply)}`);
  console.log(`  Total Staked: ${ethers.formatEther(distribution.totalStaked)}`);
  console.log(`  Total Retired: ${ethers.formatEther(distribution.totalRetired)}`);
  console.log(`  Circulating Supply: ${ethers.formatEther(distribution.circulatingSupply)}`);

  // Action stats
  const actionStats = await analytics.getActionStats();
  console.log("\nAction Statistics:");
  console.log(`  Total Actions: ${actionStats.totalActions}`);
  console.log(`  Verified Actions: ${actionStats.verifiedActions}`);
  console.log(`  Pending Actions: ${actionStats.pendingActions}`);

  // Company analytics if address provided
  if (companyAddress) {
    console.log(`\n=== Company Analytics: ${companyAddress} ===`);
    const companyAnalytics = await analytics.getCompanyAnalytics(companyAddress);
    console.log(`  Total Credits: ${ethers.formatEther(companyAnalytics.totalCredits)}`);
    console.log(`  Staked Credits: ${ethers.formatEther(companyAnalytics.stakedCredits)}`);
    console.log(`  Retired Credits: ${ethers.formatEther(companyAnalytics.retiredCredits)}`);
    console.log(`  Reputation Score: ${companyAnalytics.reputationScore}`);
    console.log(`  Total Actions: ${companyAnalytics.totalActions}`);
    console.log(`  Verified Actions: ${companyAnalytics.verifiedActions}`);
    console.log(`  Badges: ${companyAnalytics.badges}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

