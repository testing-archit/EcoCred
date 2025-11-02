import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("EcoBadgeNFT", function () {
  let badge: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    badge = await ethers.deployContract("EcoBadgeNFT", ["https://example.com/metadata/"]);
  });

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await badge.name()).to.equal("EcoBadge");
      expect(await badge.symbol()).to.equal("ECOB");
    });

    it("Should set baseURI", async function () {
      expect(await badge.baseURI()).to.equal("https://example.com/metadata/");
    });

    it("Should set owner", async function () {
      expect(await badge.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint badges", async function () {
      await expect(badge.connect(owner).safeMint(user1.address))
        .to.emit(badge, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, 1n);

      expect(await badge.balanceOf(user1.address)).to.equal(1n);
      expect(await badge.ownerOf(1)).to.equal(user1.address);
      expect(await badge.nextId()).to.equal(2n);
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(
        badge.connect(user1).safeMint(user2.address)
      ).to.be.revertedWith("only owner");
    });

    it("Should not allow minting to zero address", async function () {
      await expect(
        badge.connect(owner).safeMint(ethers.ZeroAddress)
      ).to.be.revertedWith("to zero");
    });

    it("Should generate correct tokenURI", async function () {
      await badge.connect(owner).safeMint(user1.address);
      expect(await badge.tokenURI(1)).to.equal("https://example.com/metadata/1");
    });

    it("Should handle multiple mints", async function () {
      await badge.connect(owner).safeMint(user1.address);
      await badge.connect(owner).safeMint(user1.address);
      await badge.connect(owner).safeMint(user2.address);

      expect(await badge.balanceOf(user1.address)).to.equal(2n);
      expect(await badge.balanceOf(user2.address)).to.equal(1n);
      expect(await badge.nextId()).to.equal(4n);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await badge.connect(owner).safeMint(user1.address);
    });

    it("Should allow owner to transfer", async function () {
      await expect(badge.connect(user1).transferFrom(user1.address, user2.address, 1))
        .to.emit(badge, "Transfer")
        .withArgs(user1.address, user2.address, 1n);

      expect(await badge.ownerOf(1)).to.equal(user2.address);
      expect(await badge.balanceOf(user1.address)).to.equal(0n);
      expect(await badge.balanceOf(user2.address)).to.equal(1n);
    });

    it("Should allow approved spender to transfer", async function () {
      await badge.connect(user1).approve(user2.address, 1);
      
      await expect(badge.connect(user2).transferFrom(user1.address, user2.address, 1))
        .to.emit(badge, "Transfer")
        .withArgs(user1.address, user2.address, 1n);

      expect(await badge.ownerOf(1)).to.equal(user2.address);
    });

    it("Should allow approved operator to transfer", async function () {
      await badge.connect(user1).setApprovalForAll(user2.address, true);
      
      await expect(badge.connect(user2).transferFrom(user1.address, user2.address, 1))
        .to.emit(badge, "Transfer")
        .withArgs(user1.address, user2.address, 1n);
    });

    it("Should not allow unauthorized transfer", async function () {
      await expect(
        badge.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("not authorized");
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        badge.connect(user1).transferFrom(user1.address, ethers.ZeroAddress, 1)
      ).to.be.revertedWith("to zero");
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      await badge.connect(owner).safeMint(user1.address);
    });

    it("Should allow owner to approve spender", async function () {
      await expect(badge.connect(user1).approve(user2.address, 1))
        .to.emit(badge, "Approval")
        .withArgs(user1.address, user2.address, 1n);

      expect(await badge.getApproved(1)).to.equal(user2.address);
    });

    it("Should allow setting approval for all", async function () {
      await expect(badge.connect(user1).setApprovalForAll(user2.address, true))
        .to.emit(badge, "ApprovalForAll")
        .withArgs(user1.address, user2.address, true);

      expect(await badge.isApprovedForAll(user1.address, user2.address)).to.equal(true);
    });

    it("Should clear approval on transfer", async function () {
      await badge.connect(user1).approve(user2.address, 1);
      await badge.connect(user1).transferFrom(user1.address, user2.address, 1);
      
      expect(await badge.getApproved(1)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Enumeration", function () {
    beforeEach(async function () {
      await badge.connect(owner).safeMint(user1.address);
      await badge.connect(owner).safeMint(user1.address);
      await badge.connect(owner).safeMint(user2.address);
    });

    it("Should return correct token by index", async function () {
      const token1 = await badge.tokenOfOwnerByIndex(user1.address, 0);
      const token2 = await badge.tokenOfOwnerByIndex(user1.address, 1);
      
      expect(token1).to.be.oneOf([1n, 2n]);
      expect(token2).to.be.oneOf([1n, 2n]);
      expect(token1).to.not.equal(token2);
    });
  });

  describe("BaseURI Management", function () {
    it("Should allow owner to update baseURI", async function () {
      const newURI = "https://newmetadata.com/";
      await badge.connect(owner).setBaseURI(newURI);
      expect(await badge.baseURI()).to.equal(newURI);
    });

    it("Should not allow non-owner to update baseURI", async function () {
      await expect(
        badge.connect(user1).setBaseURI("https://newmetadata.com/")
      ).to.be.revertedWith("only owner");
    });
  });
});

