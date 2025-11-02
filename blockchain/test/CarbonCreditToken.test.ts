import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CarbonCreditToken", function () {
  let token: any;
  let owner: any;
  let minter: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();
    token = await ethers.deployContract("CarbonCreditToken", [owner.address, minter.address]);
  });

  describe("Deployment", function () {
    it("Should set the correct owner and minter", async function () {
      expect(await token.owner()).to.equal(owner.address);
      expect(await token.minter()).to.equal(minter.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("Carbon Credit");
      expect(await token.symbol()).to.equal("CCT");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await expect(token.connect(minter).mint(user1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, amount);
      
      expect(await token.balanceOf(user1.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(amount);
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWith("only minter");
    });

    it("Should not allow minting to zero address", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(minter).mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("mint to 0");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await token.connect(minter).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens between users", async function () {
      const amount = ethers.parseEther("100");
      await expect(token.connect(user1).transfer(user2.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(user1.address, user2.address, amount);
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
      expect(await token.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should not allow transfer to zero address", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(user1).transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("to 0");
    });

    it("Should not allow transfer with insufficient balance", async function () {
      const amount = ethers.parseEther("2000");
      await expect(
        token.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWith("insufficient balance");
    });
  });

  describe("Approval and TransferFrom", function () {
    beforeEach(async function () {
      await token.connect(minter).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should approve spender", async function () {
      const amount = ethers.parseEther("100");
      await expect(token.connect(user1).approve(user2.address, amount))
        .to.emit(token, "Approval")
        .withArgs(user1.address, user2.address, amount);
      
      expect(await token.allowance(user1.address, user2.address)).to.equal(amount);
    });

    it("Should allow transferFrom with approval", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(user1).approve(user2.address, amount);
      
      await expect(token.connect(user2).transferFrom(user1.address, user2.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(user1.address, user2.address, amount);
      
      expect(await token.balanceOf(user2.address)).to.equal(amount);
      expect(await token.allowance(user1.address, user2.address)).to.equal(0n);
    });

    it("Should not allow transferFrom without approval", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(user2).transferFrom(user1.address, user2.address, amount)
      ).to.be.revertedWith("insufficient allowance");
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to update minter", async function () {
      await expect(token.connect(owner).setMinter(user1.address))
        .to.emit(token, "MinterUpdated")
        .withArgs(user1.address);
      
      expect(await token.minter()).to.equal(user1.address);
    });

    it("Should not allow non-owner to update minter", async function () {
      await expect(
        token.connect(user1).setMinter(user2.address)
      ).to.be.revertedWith("only owner");
    });
  });
});

