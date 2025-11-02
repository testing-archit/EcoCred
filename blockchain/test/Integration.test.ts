import { expect } from "chai";
import { network } from "hardhat";
import { parseEther, formatEther } from "ethers";

const { ethers } = await network.connect();

/**
 * Integration test demonstrating the full EcoCred ecosystem
 */
describe("EcoCred Integration", function () {
  let accessControl: any;
  let token: any;
  let badge: any;
  let ledgerV2: any;
  let marketplace: any;
  let staking: any;
  let leaderboard: any;
  let governance: any;

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
    await staking.setMinter(staking.target);

    // Deploy Leaderboard
    leaderboard = await ethers.deployContract("Leaderboard", [ledgerV2.target]);
    await ledgerV2.setLeaderboard(leaderboard.target);

    // Deploy Governance
    governance = await ethers.deployContract("Governance", [
      token.target,
      accessControl.target,
    ]);
  });

  describe("Complete Flow", function () {
    it("Should complete full ecosystem workflow", async function () {
      // 1. Company logs eco action
      const actionId = await ledgerV2
        .connect(company1)
        .logEcoAction(
          "Solar Panel Installation",
          "Installed 100 solar panels",
          500,
          "California, USA",
          "renewable_energy"
        );

      expect(actionId).to.equal(1n);

      // 2. Verifiers verify the action
      await ledgerV2.connect(verifier1).verifyAction(actionId, true, 480);
      await ledgerV2.connect(verifier2).verifyAction(actionId, true, 480);

      // Check credits minted (with reputation multiplier)
      const balance1 = await token.balanceOf(company1.address);
      expect(balance1).to.be.gte(parseEther("480"));

      // 3. Company creates marketplace listing
      const listingAmount = parseEther("100");
      await token.connect(company1).approve(marketplace.target, listingAmount);
      
      const listingId = await marketplace
        .connect(company1)
        .createListing(listingAmount, parseEther("0.001"));

      expect(listingId).to.equal(1n);

      // 4. Buyer purchases from marketplace
      const purchaseAmount = parseEther("50");
      const price = parseEther("0.001");
      
      await marketplace.connect(buyer).purchase(listingId, purchaseAmount, {
        value: purchaseAmount * price / parseEther("1"),
      });

      const buyerBalance = await token.balanceOf(buyer.address);
      expect(buyerBalance).to.equal(purchaseAmount);

      // 5. Buyer stakes credits
      const stakeAmount = parseEther("30");
      await token.connect(buyer).approve(staking.target, stakeAmount);
      
      await staking.connect(buyer).stake(stakeAmount, 30); // 30 days

      const stakeCount = await staking.getStakeCount(buyer.address);
      expect(stakeCount).to.equal(1n);

      // 6. Check leaderboard
      const topCompanies = await leaderboard.getTopCompanies(10);
      expect(topCompanies.length).to.be.gte(0);

      // 7. Check company reputation
      const profile = await ledgerV2.getCompanyProfile(company1.address);
      expect(profile.totalCreditsEarned).to.be.gte(480);
      expect(profile.verifiedActions).to.equal(1n);
    });

    it("Should handle governance proposal flow", async function () {
      // First, mint some tokens to allow voting
      await token.mint(company1.address, parseEther("20000"));
      await token.mint(company2.address, parseEther("15000"));

      // Create a proposal
      const proposalData = token.interface.encodeFunctionData("setMinter", [company1.address]);
      
      const proposalId = await governance
        .connect(company1)
        .createProposal(
          "Change minter address",
          token.target,
          proposalData
        );

      expect(proposalId).to.equal(1n);

      // Vote on proposal
      await governance.connect(company1).vote(proposalId, true);
      await governance.connect(company2).vote(proposalId, false);

      // Check votes
      const proposal = await governance.getProposal(proposalId);
      expect(proposal.votesFor).to.equal(parseEther("20000"));
      expect(proposal.votesAgainst).to.equal(parseEther("15000"));
    });

    it("Should handle multiple verifications correctly", async function () {
      const actionId = await ledgerV2
        .connect(company1)
        .logEcoAction("Tree Planting", "Planted 1000 trees", 300, "Oregon, USA", "tree_planting");

      // First verifier
      await ledgerV2.connect(verifier1).verifyAction(actionId, true, 280);
      
      // Action should not be fully verified yet
      let action = await ledgerV2.getAction(actionId);
      expect(action.verified).to.equal(false);

      // Second verifier - now should be verified
      await ledgerV2.connect(verifier2).verifyAction(actionId, true, 280);
      
      action = await ledgerV2.getAction(actionId);
      expect(action.verified).to.equal(true);
      
      const balance = await token.balanceOf(company1.address);
      expect(balance).to.be.gte(parseEther("280"));
    });
  });
});

