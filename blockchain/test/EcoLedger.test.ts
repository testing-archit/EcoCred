import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("EcoLedger", function () {
  let ledger: any;
  let token: any;
  let badge: any;
  let owner: any;
  let company1: any;
  let company2: any;

  beforeEach(async function () {
    [owner, company1, company2] = await ethers.getSigners();
    
    // Deploy contracts
    token = await ethers.deployContract("CarbonCreditToken", [owner.address, owner.address]);
    badge = await ethers.deployContract("EcoBadgeNFT", ["https://example.com/metadata/"]);
    
    ledger = await ethers.deployContract("EcoLedger", [token.target, badge.target]);
    
    // Set ledger as minter
    await token.setMinter(ledger.target);
  });

  describe("Deployment", function () {
    it("Should set correct owner and contracts", async function () {
      expect(await ledger.owner()).to.equal(owner.address);
      expect(await ledger.creditToken()).to.equal(token.target);
      expect(await ledger.badgeNFT()).to.equal(badge.target);
    });
  });

  describe("Logging Eco Actions", function () {
    it("Should allow companies to log eco actions", async function () {
      const title = "Tree Planting Initiative";
      const description = "Planted 1000 trees in urban areas";
      const estimatedCredits = 500;
      const location = "New York, USA";

      await expect(
        ledger.connect(company1).logEcoAction(title, description, estimatedCredits, location)
      )
        .to.emit(ledger, "EcoActionLogged")
        .withArgs(1n, company1.address, title);

      expect(await ledger.actionCount()).to.equal(1n);
    });

    it("Should require non-empty title", async function () {
      await expect(
        ledger.connect(company1).logEcoAction("", "description", 100, "location")
      ).to.be.revertedWith("title required");
    });

    it("Should require positive estimated credits", async function () {
      await expect(
        ledger.connect(company1).logEcoAction("title", "description", 0, "location")
      ).to.be.revertedWith("estimate > 0");
    });

    it("Should allow retrieving action details", async function () {
      const title = "Solar Panel Installation";
      const description = "Installed 50 solar panels";
      const estimatedCredits = 200;
      const location = "California, USA";

      await ledger.connect(company1).logEcoAction(title, description, estimatedCredits, location);
      
      const action = await ledger.getAction(1);
      expect(action[0]).to.equal(title);
      expect(action[1]).to.equal(description);
      expect(action[2]).to.equal(BigInt(estimatedCredits));
      expect(action[3]).to.equal(location);
      expect(action[4]).to.equal(false); // verified
      expect(action[5]).to.equal(0n); // actualCredits
    });
  });

  describe("Verifying Actions", function () {
    beforeEach(async function () {
      await ledger.connect(company1).logEcoAction(
        "Carbon Offset Project",
        "Reduced emissions by 1000 tons",
        1000,
        "Seattle, USA"
      );
    });

    it("Should allow owner to verify and approve actions", async function () {
      const actionId = 1;
      const actualCredits = 950;

      await expect(
        ledger.connect(owner).verifyAction(actionId, true, actualCredits)
      )
        .to.emit(ledger, "ActionVerified")
        .withArgs(BigInt(actionId), true, BigInt(actualCredits));

      const action = await ledger.getAction(actionId);
      expect(action[4]).to.equal(true); // verified
      expect(action[5]).to.equal(BigInt(actualCredits));

      // Check that credits were minted
      expect(await token.balanceOf(company1.address)).to.equal(
        ethers.parseEther(actualCredits.toString())
      );
    });

    it("Should mint badge when credits >= 100", async function () {
      const actionId = 1;
      const actualCredits = 150;

      await ledger.connect(owner).verifyAction(actionId, true, actualCredits);

      // Check badge was minted
      expect(await badge.balanceOf(company1.address)).to.equal(1n);
    });

    it("Should not mint badge when credits < 100", async function () {
      const actionId = 1;
      const actualCredits = 50;

      await ledger.connect(owner).verifyAction(actionId, true, actualCredits);

      // Check no badge was minted
      expect(await badge.balanceOf(company1.address)).to.equal(0n);
    });

    it("Should allow owner to reject actions", async function () {
      const actionId = 1;

      await expect(
        ledger.connect(owner).verifyAction(actionId, false, 0)
      )
        .to.emit(ledger, "ActionVerified")
        .withArgs(BigInt(actionId), false, 0n);

      const action = await ledger.getAction(actionId);
      expect(action[4]).to.equal(true); // verified
      expect(action[5]).to.equal(0n); // no credits

      // Check no credits were minted
      expect(await token.balanceOf(company1.address)).to.equal(0n);
    });

    it("Should not allow non-owner to verify actions", async function () {
      await expect(
        ledger.connect(company1).verifyAction(1, true, 100)
      ).to.be.revertedWith("only owner");
    });

    it("Should not allow verifying already verified actions", async function () {
      await ledger.connect(owner).verifyAction(1, true, 100);
      
      await expect(
        ledger.connect(owner).verifyAction(1, true, 200)
      ).to.be.revertedWith("already verified");
    });

    it("Should require positive credits for approved actions", async function () {
      await expect(
        ledger.connect(owner).verifyAction(1, true, 0)
      ).to.be.revertedWith("credits > 0");
    });
  });

  describe("Multiple Actions", function () {
    it("Should handle multiple actions from different companies", async function () {
      // Company 1 logs action
      await ledger.connect(company1).logEcoAction("Action 1", "Desc 1", 100, "Loc 1");
      
      // Company 2 logs action
      await ledger.connect(company2).logEcoAction("Action 2", "Desc 2", 200, "Loc 2");

      expect(await ledger.actionCount()).to.equal(2n);

      // Verify both
      await ledger.connect(owner).verifyAction(1, true, 100);
      await ledger.connect(owner).verifyAction(2, true, 200);

      expect(await token.balanceOf(company1.address)).to.equal(ethers.parseEther("100"));
      expect(await token.balanceOf(company2.address)).to.equal(ethers.parseEther("200"));
    });
  });
});

