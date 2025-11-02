import { network } from "hardhat";
import { parseEther } from "ethers";

const { ethers } = await network.connect();

/**
 * Script to create a marketplace listing
 * Usage: npx hardhat run scripts/create-listing.ts --network <network>
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Creating listing with account:", signer.address);

  const marketplaceAddress = process.env.MARKETPLACE_CONTRACT || process.argv[2];
  const tokenAddress = process.env.CARBON_CREDIT_TOKEN || process.argv[3];
  const amount = process.argv[4] || "100";
  const pricePerCredit = process.argv[5] || "0.001"; // in ETH

  if (!marketplaceAddress || !tokenAddress) {
    throw new Error("Please provide Marketplace and Token contract addresses");
  }

  const tokenAbi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
  ];

  const marketplaceAbi = [
    "function createListing(uint256 amount, uint256 pricePerCredit) returns (uint256)",
    "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerCredit)",
  ];

  const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
  const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

  // Check balance
  const balance = await token.balanceOf(signer.address);
  const amountWei = parseEther(amount);
  
  console.log("Current balance:", ethers.formatEther(balance));
  console.log("Amount to list:", amount);

  if (balance < amountWei) {
    throw new Error("Insufficient balance");
  }

  // Approve marketplace
  try {
    const approveTx = await token.approve(marketplaceAddress, amountWei);
    await approveTx.wait();
    console.log("Approval successful");
  } catch (error: any) {
    console.error("Error approving:", error.message);
    return;
  }

  // Create listing
  try {
    const priceWei = parseEther(pricePerCredit);
    const tx = await marketplace.createListing(amountWei, priceWei);
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    
    // Find the ListingCreated event
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id("ListingCreated(uint256,address,uint256,uint256)")
    );

    if (event) {
      const listingId = ethers.toNumber(event.topics[1]);
      console.log("Listing created successfully! Listing ID:", listingId);
    } else {
      console.log("Listing created successfully!");
    }
  } catch (error: any) {
    console.error("Error creating listing:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

