// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EcoLedgerV2.sol";
import "./CarbonCreditToken.sol";
import "./CarbonCreditMarketplace.sol";
import "./CreditStaking.sol";
import "./CreditRetirement.sol";

/// @title Analytics - Comprehensive analytics and statistics for the EcoCred platform
/// @notice Aggregates data from multiple contracts to provide insights
contract Analytics {
    EcoLedgerV2 public ecoLedger;
    CarbonCreditToken public creditToken;
    CarbonCreditMarketplace public marketplace;
    CreditStaking public staking;
    CreditRetirement public retirement;

    struct PlatformStats {
        uint256 totalActions;
        uint256 verifiedActions;
        uint256 totalCreditsMinted;
        uint256 totalCreditsRetired;
        uint256 totalCreditsStaked;
        uint256 totalMarketplaceVolume;
        uint256 activeCompanies;
        uint256 totalBadgesMinted;
    }

    struct CompanyAnalytics {
        uint256 totalCredits;
        uint256 stakedCredits;
        uint256 retiredCredits;
        uint256 marketplaceSales;
        uint256 reputationScore;
        uint256 totalActions;
        uint256 verifiedActions;
        uint256 badges;
    }

    event AnalyticsUpdated(address indexed company);

    constructor(
        address ledgerAddress,
        address tokenAddress,
        address payable marketplaceAddress,
        address stakingAddress,
        address retirementAddress
    ) {
        require(ledgerAddress != address(0), "ledger address 0");
        require(tokenAddress != address(0), "token address 0");
        require(marketplaceAddress != address(0), "marketplace address 0");
        require(stakingAddress != address(0), "staking address 0");
        require(retirementAddress != address(0), "retirement address 0");

        ecoLedger = EcoLedgerV2(ledgerAddress);
        creditToken = CarbonCreditToken(tokenAddress);
        marketplace = CarbonCreditMarketplace(marketplaceAddress);
        staking = CreditStaking(stakingAddress);
        retirement = CreditRetirement(retirementAddress);
    }

    /// @notice Get comprehensive platform statistics
    /// @return stats Platform statistics struct
    function getPlatformStats() external view returns (PlatformStats memory stats) {
        stats.totalActions = ecoLedger.actionCount();
        
        // Note: This is a simplified version. In production, you'd want to track
        // verified actions and active companies more efficiently
        stats.totalCreditsMinted = creditToken.totalSupply();
        stats.totalCreditsRetired = retirement.totalRetired();
        stats.totalCreditsStaked = staking.totalStakedAmount();
        
        // Marketplace volume would need to be tracked via events or a separate mapping
        // For now, we'll return 0 as a placeholder
        stats.totalMarketplaceVolume = 0;
    }

    /// @notice Get comprehensive analytics for a specific company
    /// @param company Address of the company
    /// @return analytics Company analytics struct
    function getCompanyAnalytics(address company) external view returns (CompanyAnalytics memory analytics) {
        (, uint256 totalActions, uint256 verifiedActions, uint256 reputationScore,) = 
            ecoLedger.getCompanyProfile(company);
        
        analytics.totalCredits = creditToken.balanceOf(company);
        analytics.stakedCredits = staking.totalStaked(company);
        analytics.retiredCredits = retirement.getTotalRetiredByUser(company);
        analytics.reputationScore = reputationScore;
        analytics.totalActions = totalActions;
        analytics.verifiedActions = verifiedActions;
        
        // Marketplace sales would need to be tracked separately
        analytics.marketplaceSales = 0;
        
        // Badge count would need to be tracked from EcoBadgeNFT
        analytics.badges = 0;
    }

    /// @notice Get top companies by credits
    /// @return companies Array of company addresses
    /// @return credits Array of credit amounts
    function getTopCompaniesByCredits(uint256 /* limit */) 
        external 
        pure 
        returns (address[] memory companies, uint256[] memory credits) 
    {
        // This is a simplified version. In production, you'd want to use
        // the Leaderboard contract or maintain a sorted list
        // For now, this is a placeholder that would need to be implemented
        // with off-chain indexing or a more sophisticated on-chain structure
        
        companies = new address[](0);
        credits = new uint256[](0);
    }

    /// @notice Get credit distribution statistics
    /// @return totalSupply Total supply of credits
    /// @return totalStaked Total staked credits
    /// @return totalRetired Total retired credits
    /// @return circulatingSupply Circulating supply (total - staked - retired)
    function getCreditDistribution()
        external
        view
        returns (
            uint256 totalSupply,
            uint256 totalStaked,
            uint256 totalRetired,
            uint256 circulatingSupply
        )
    {
        totalSupply = creditToken.totalSupply();
        totalStaked = staking.totalStakedAmount();
        totalRetired = retirement.totalRetired();
        
        // Note: This calculation assumes retired credits are burned
        // If they're just locked, adjust accordingly
        circulatingSupply = totalSupply - totalStaked;
    }

    /// @notice Get action statistics
    /// @return totalActions Total number of actions logged
    /// @return verifiedActions Estimated number of verified actions
    /// @return pendingActions Estimated number of pending actions
    function getActionStats()
        external
        view
        returns (
            uint256 totalActions,
            uint256 verifiedActions,
            uint256 pendingActions
        )
    {
        totalActions = ecoLedger.actionCount();
        // Note: Verified and pending actions would need to be tracked
        // via events or a separate mapping for accurate counts
        verifiedActions = 0;
        pendingActions = totalActions;
    }
}

