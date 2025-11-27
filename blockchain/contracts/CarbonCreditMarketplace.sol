// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

/// @title CarbonCreditMarketplace - P2P marketplace for trading carbon credits
contract CarbonCreditMarketplace is ReentrancyGuard, Pausable {
    struct Listing {
        address seller;
        uint256 amount;
        uint256 pricePerCredit; // in wei
        bool active;
        uint256 timestamp;
    }

    CarbonCreditToken public creditToken;
    uint256 public feePercentage; // basis points (100 = 1%)
    uint256 public constant MAX_FEE = 1000; // 10%

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerCredit);
    event ListingCancelled(uint256 indexed listingId);
    event PurchaseExecuted(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);

    modifier onlySeller(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "only seller");
        _;
    }

    constructor(address tokenAddress, uint256 initialFee) Pausable() {
        require(tokenAddress != address(0), "token address 0");
        require(initialFee <= MAX_FEE, "fee too high");
        creditToken = CarbonCreditToken(tokenAddress);
        feePercentage = initialFee;
    }

    function setFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "fee too high");
        feePercentage = newFee;
    }

    function createListing(uint256 amount, uint256 pricePerCredit) external nonReentrant whenNotPaused returns (uint256) {
        require(amount > 0, "amount > 0");
        require(pricePerCredit > 0, "price > 0");
        require(creditToken.balanceOf(msg.sender) >= amount, "insufficient balance");

        // Transfer tokens to marketplace (escrow)
        require(creditToken.transferFrom(msg.sender, address(this), amount), "transfer failed");

        uint256 listingId = ++listingCount;
        listings[listingId] = Listing({
            seller: msg.sender,
            amount: amount,
            pricePerCredit: pricePerCredit,
            active: true,
            timestamp: block.timestamp
        });

        sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, msg.sender, amount, pricePerCredit);
        return listingId;
    }

    function purchase(uint256 listingId, uint256 amount) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "listing inactive");
        require(listing.amount >= amount, "insufficient listing");
        require(msg.sender != listing.seller, "cannot buy own");

        uint256 totalPrice = amount * listing.pricePerCredit;
        require(msg.value >= totalPrice, "insufficient payment");

        // Calculate fees
        uint256 fee = (totalPrice * feePercentage) / 10000;
        uint256 sellerAmount = totalPrice - fee;

        // Transfer tokens to buyer
        require(creditToken.transfer(msg.sender, amount), "token transfer failed");

        // Transfer payment to seller
        payable(listing.seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        emit PurchaseExecuted(listingId, msg.sender, amount, totalPrice);
    }

    function cancelListing(uint256 listingId) external nonReentrant onlySeller(listingId) whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "already cancelled");

        listing.active = false;
        
        // Return tokens to seller
        require(creditToken.transfer(listing.seller, listing.amount), "return failed");

        emit ListingCancelled(listingId);
    }

    function getListing(uint256 listingId) external view returns (
        address seller,
        uint256 amount,
        uint256 pricePerCredit,
        bool active,
        uint256 timestamp
    ) {
        Listing storage listing = listings[listingId];
        require(listing.seller != address(0), "listing not found");
        return (
            listing.seller,
            listing.amount,
            listing.pricePerCredit,
            listing.active,
            listing.timestamp
        );
    }

    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "no fees");
        payable(owner).transfer(balance);
    }

    receive() external payable {
        // Allow contract to receive ETH
    }
}

