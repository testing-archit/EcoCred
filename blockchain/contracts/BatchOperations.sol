// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./EcoLedgerV2.sol";
import "./CarbonCreditMarketplace.sol";
import "./CreditStaking.sol";

/// @title BatchOperations - Gas-efficient batch operations for common actions
/// @notice Allows users to perform multiple operations in a single transaction
contract BatchOperations {
    CarbonCreditToken public creditToken;
    EcoLedgerV2 public ecoLedger;
    CarbonCreditMarketplace public marketplace;
    CreditStaking public staking;

    event BatchTransferExecuted(address indexed from, address[] to, uint256[] amounts);
    event BatchActionLogged(address indexed company, uint256[] actionIds);
    event BatchStakeExecuted(address indexed user, uint256 stakeCount);

    constructor(
        address tokenAddress,
        address ledgerAddress,
        address payable marketplaceAddress,
        address stakingAddress
    ) {
        require(tokenAddress != address(0), "token address 0");
        require(ledgerAddress != address(0), "ledger address 0");
        require(marketplaceAddress != address(0), "marketplace address 0");
        require(stakingAddress != address(0), "staking address 0");

        creditToken = CarbonCreditToken(tokenAddress);
        ecoLedger = EcoLedgerV2(ledgerAddress);
        marketplace = CarbonCreditMarketplace(marketplaceAddress);
        staking = CreditStaking(stakingAddress);
    }

    /// @notice Batch transfer credits to multiple addresses
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts to transfer (must match recipients length)
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length > 0 && recipients.length <= 50, "invalid batch size");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(creditToken.balanceOf(msg.sender) >= totalAmount, "insufficient balance");
        require(creditToken.allowance(msg.sender, address(this)) >= totalAmount, "insufficient allowance");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(creditToken.transferFrom(msg.sender, recipients[i], amounts[i]), "transfer failed");
        }

        emit BatchTransferExecuted(msg.sender, recipients, amounts);
    }

    /// @notice Batch log multiple eco actions
    /// @param titles Array of action titles
    /// @param descriptions Array of action descriptions
    /// @param estimatedCredits Array of estimated credits
    /// @param locations Array of locations
    /// @param categories Array of categories
    function batchLogActions(
        string[] calldata titles,
        string[] calldata descriptions,
        uint256[] calldata estimatedCredits,
        string[] calldata locations,
        string[] calldata categories
    ) external returns (uint256[] memory) {
        require(
            titles.length == descriptions.length &&
            titles.length == estimatedCredits.length &&
            titles.length == locations.length &&
            titles.length == categories.length,
            "length mismatch"
        );
        require(titles.length > 0 && titles.length <= 20, "invalid batch size");

        uint256[] memory actionIds = new uint256[](titles.length);

        for (uint256 i = 0; i < titles.length; i++) {
            actionIds[i] = ecoLedger.logEcoAction(
                titles[i],
                descriptions[i],
                estimatedCredits[i],
                locations[i],
                categories[i]
            );
        }

        emit BatchActionLogged(msg.sender, actionIds);
        return actionIds;
    }

    /// @notice Batch create marketplace listings
    /// @param amounts Array of amounts to list
    /// @param prices Array of prices per credit
    function batchCreateListings(
        uint256[] calldata amounts,
        uint256[] calldata prices
    ) external returns (uint256[] memory) {
        require(amounts.length == prices.length, "length mismatch");
        require(amounts.length > 0 && amounts.length <= 10, "invalid batch size");

        uint256[] memory listingIds = new uint256[](amounts.length);

        for (uint256 i = 0; i < amounts.length; i++) {
            listingIds[i] = marketplace.createListing(amounts[i], prices[i]);
        }

        return listingIds;
    }

    /// @notice Batch stake credits with different lock periods
    /// @param amounts Array of amounts to stake
    /// @param lockPeriods Array of lock periods in days
    function batchStake(
        uint256[] calldata amounts,
        uint256[] calldata lockPeriods
    ) external {
        require(amounts.length == lockPeriods.length, "length mismatch");
        require(amounts.length > 0 && amounts.length <= 10, "invalid batch size");

        for (uint256 i = 0; i < amounts.length; i++) {
            staking.stake(amounts[i], lockPeriods[i]);
        }

        emit BatchStakeExecuted(msg.sender, amounts.length);
    }

    /// @notice Batch unstake multiple positions
    /// @param stakeIndices Array of stake indices to unstake
    function batchUnstake(uint256[] calldata stakeIndices) external {
        require(stakeIndices.length > 0 && stakeIndices.length <= 20, "invalid batch size");

        for (uint256 i = 0; i < stakeIndices.length; i++) {
            staking.unstake(stakeIndices[i]);
        }
    }
}

