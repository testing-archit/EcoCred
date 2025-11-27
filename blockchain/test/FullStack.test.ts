import { expect } from "chai";
import { network } from "hardhat";
import { parseEther } from "ethers";

const { ethers } = await network.connect();

/**
 * Full stack integration test
 * Tests the complete blockchain ecosystem with all contracts
 */
describe("EcoCred Full Stack Integration", function () {
  let accessControl: any;
  let token: any;
  let badge: any;
  let ledgerV2: any;
  let marketplace: any;
  let staking: any;
  let governance: any;
  let leaderboard: any;
  let retirement: any;
  let expiration: any;
  let batchOps: any;
  let analytics: any;

  let owner: any;
  let verifier1: any;
  let verifier2: any;
  let company1: any;
  let company2: any;
  let buyer: any;

  beforeEach(async function () {
    [owner, verifier1, verifier2, company1, company2, buyer] = await ethers.getSigners();

    // Deploy AccessControl
    accessControl = await ethers.deployContract("AccessControl");

    // Deploy Token
    token = await ethers.deployContract("CarbonCreditToken", [owner.address, owner.address]);

    // Deploy Badge
    badge = await ethers.deployContract("EcoBadgeNFT", ["https://example.com/metadata/"]);

    // Deploy LedgerV2
    ledgerV2 = await ethers.deployContract("EcoLedgerV2", [
      token.target,
      badge.target,
      accessControl.target,
      2, // verification threshold
    ]);

    // Set ledger as minter
    await token.setMinter(ledgerV2.target);

    // Grant verifier roles
    await accessControl.grantRole(verifier1.address, 2); // VERIFIER
    await accessControl.grantRole(verifier2.address, 2); // VERIFIER

    // Deploy Marketplace
    marketplace = await ethers.deployContract("CarbonCreditMarketplace", [
      token.target,
      250, // 2.5% fee
    ]);

    // Deploy Staking
    staking = await ethers.deployContract("CreditStaking", [
      token.target,
      500, // 5% reward rate
    ]);

    // Set staking as minter (for rewards)
    await token.setMinter(staking.target);

    // Deploy Leaderboard
    leaderboard = await ethers.deployContract("Leaderboard", [ledgerV2.target]);
    await ledgerV2.setLeaderboard(leaderboard.target);

    // Deploy Governance
    governance = await ethers.deployContract("Governance", [
      token.target,
      accessControl.target,
    ]);

    // Deploy Retirement
    retirement = await ethers.deployContract("CreditRetirement", [token.target]);

    // Deploy Expiration
    expiration = await ethers.deployContract("CreditExpiration", [token.target]);

    // Deploy BatchOperations
    batchOps = await ethers.deployContract("BatchOperations", [
      token.target,
      ledgerV2.target,
      marketplace.target,
      staking.target,
    ]);

    // Deploy Analytics
    analytics = await ethers.deployContract("Analytics", [
      ledgerV2.target,
      token.target,
      marketplace.target,
      staking.target,
      retirement.target,
    ]);
  });

  describe("Complete Ecosystem Flow", function () {
    it("Should handle complete eco action lifecycle", async function () {
      // 1. Company logs action
      const actionId = await ledgerV2
        .connect(company1)
        .logEcoAction(
          "Solar Panel Installation",
          "Installed 100 solar panels reducing CO2 by 50 tons",
          500,
          "California, USA",
          "renewable_energy"
        );

      expect(actionId).to.equal(1n);

      // 2. Verifiers verify
      await ledgerV2.connect(verifier1).verifyAction(actionId, true, 480);
      await ledgerV2.connect(verifier2).verifyAction(actionId, true, 480);

      // 3. Check credits minted
      const balance1 = await token.balanceOf(company1.address);
      expect(balance1).to.be.gte(parseEther("480"));

      // 4. Create marketplace listing
      const listingAmount = parseEther("100");
      await token.connect(company1).approve(marketplace.target, listingAmount);
      
      const listingId = await marketplace
        .connect(company1)
        .createListing(listingAmount, parseEther("0.001"));

      // 5. Purchase from marketplace
      const purchaseAmount = parseEther("50");
      const price = parseEther("0.001");
      
      await marketplace.connect(buyer).purchase(listingId, purchaseAmount, {
        value: purchaseAmount * price / parseEther("1"),
      });

      // 6. Stake credits
      const stakeAmount = parseEther("30");
      await token.connect(buyer).approve(staking.target, stakeAmount);
      await staking.connect(buyer).stake(stakeAmount, 30);

      // 7. Retire credits
      const retireAmount = parseEther("10");
      await token.connect(company1).approve(retirement.target, retireAmount);
      await retirement.connect(company1).retireCredits(
        retireAmount,
        "Offsetting company emissions",
        "CERT-001"
      );

      // 8. Check analytics
      const platformStats = await analytics.getPlatformStats();
      expect(platformStats.totalActions).to.equal(1n);
      expect(platformStats.totalCreditsMinted).to.be.gte(parseEther("480"));
    });

    it("Should handle batch operations", async function () {
      // Mint some tokens first
      await token.mint(company1.address, parseEther("10000"));

      // Batch transfer
      const recipients = [company2.address, buyer.address];
      const amounts = [parseEther("1000"), parseEther("2000")];
      
      await token.connect(company1).approve(batchOps.target, parseEther("3000"));
      await batchOps.connect(company1).batchTransfer(recipients, amounts);

      expect(await token.balanceOf(company2.address)).to.equal(parseEther("1000"));
      expect(await token.balanceOf(buyer.address)).to.equal(parseEther("2000"));
    });

    it("Should track expiration correctly", async function () {
      // Mint credits
      await token.mint(company1.address, parseEther("1000"));

      // Check expiration status
      const status = await expiration.getExpirationStatus(company1.address);
      expect(status.totalBatches).to.be.gte(0n);

      // Check and expire if needed
      await expiration.checkAndExpire(company1.address);
    });

    it("Should provide accurate analytics", async function () {
      // Log multiple actions
      await ledgerV2.connect(company1).logEcoAction("Action 1", "Desc 1", 100, "Loc 1", "cat1");
      await ledgerV2.connect(company2).logEcoAction("Action 2", "Desc 2", 200, "Loc 2", "cat2");

      // Verify actions
      await ledgerV2.connect(verifier1).verifyAction(1n, true, 95);
      await ledgerV2.connect(verifier2).verifyAction(1n, true, 95);

      // Get platform stats
      const stats = await analytics.getPlatformStats();
      expect(stats.totalActions).to.equal(2n);
      expect(stats.verifiedActions).to.equal(1n);

      // Get company analytics
      const companyStats = await analytics.getCompanyAnalytics(company1.address);
      expect(companyStats.totalCredits).to.be.gte(parseEther("95"));
    });
  });

  describe("Security and Access Control", function () {
    it("Should enforce access control on verifiers", async function () {
      const actionId = await ledgerV2
        .connect(company1)
        .logEcoAction("Test Action", "Test", 100, "Test", "test");

      // Non-verifier should not be able to verify
      await expect(
        ledgerV2.connect(buyer).verifyAction(actionId, true, 100)
      ).to.be.reverted;

      // Verifier should be able to verify
      await expect(
        ledgerV2.connect(verifier1).verifyAction(actionId, true, 95)
      ).to.not.be.reverted;
    });

    it("Should prevent unauthorized minting", async function () {
      await expect(
        token.connect(company1).mint(company1.address, parseEther("1000"))
      ).to.be.reverted;
    });
  });
});

