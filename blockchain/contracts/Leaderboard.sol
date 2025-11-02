// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EcoLedgerV2.sol";

/// @title Leaderboard - Ranking system for companies based on carbon credits
contract Leaderboard {
    struct LeaderboardEntry {
        address company;
        uint256 totalCredits;
        uint256 reputationScore;
        uint256 rank;
    }

    EcoLedgerV2 public ecoLedger;
    address public owner;

    mapping(uint256 => address) public topCompanies; // rank => address
    uint256 public topCount = 100; // Top 100 companies

    event LeaderboardUpdated(address indexed company, uint256 rank, uint256 credits);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(address ledgerAddress) {
        require(ledgerAddress != address(0), "ledger address 0");
        owner = msg.sender;
        ecoLedger = EcoLedgerV2(ledgerAddress);
    }

    function updateLeaderboard(address company) external {
        // Only allow ledger to update
        require(msg.sender == address(ecoLedger), "only ledger");

        (uint256 totalCredits, , , uint256 reputationScore, ) = ecoLedger.getCompanyProfile(company);
        
        // Simple ranking: find position and update
        _updateRank(company, totalCredits, reputationScore);
    }

    function _updateRank(address company, uint256 credits, uint256 reputation) internal {
        // Simple implementation: find where company should be ranked
        // In production, use a more efficient data structure
        
        uint256 currentRank = _findRank(credits, reputation);
        
        if (currentRank <= topCount) {
            // Shift companies down if needed
            for (uint256 i = topCount; i > currentRank; i--) {
                if (i > 1) {
                    topCompanies[i] = topCompanies[i - 1];
                }
            }
            
            if (currentRank > 0 && currentRank <= topCount) {
                topCompanies[currentRank] = company;
                emit LeaderboardUpdated(company, currentRank, credits);
            }
        }
    }

    function _findRank(uint256 credits, uint256 reputation) internal view returns (uint256) {
        uint256 score = credits + (reputation * 100); // Weighted score
        
        for (uint256 i = 1; i <= topCount; i++) {
            address companyAtRank = topCompanies[i];
            if (companyAtRank == address(0)) {
                return i;
            }
            
            (uint256 rankCredits, , , uint256 rankRep, ) = ecoLedger.getCompanyProfile(companyAtRank);
            uint256 rankScore = rankCredits + (rankRep * 100);
            
            if (score > rankScore) {
                return i;
            }
        }
        
        return topCount + 1; // Not in top 100
    }

    function getTopCompanies(uint256 limit) external view returns (LeaderboardEntry[] memory) {
        require(limit > 0 && limit <= topCount, "invalid limit");
        
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](limit);
        
        for (uint256 i = 1; i <= limit; i++) {
            address company = topCompanies[i];
            if (company == address(0)) break;
            
            (uint256 credits, , , uint256 reputation, ) = ecoLedger.getCompanyProfile(company);
            
            entries[i - 1] = LeaderboardEntry({
                company: company,
                totalCredits: credits,
                reputationScore: reputation,
                rank: i
            });
        }
        
        return entries;
    }

    function getCompanyRank(address company) external view returns (uint256) {
        for (uint256 i = 1; i <= topCount; i++) {
            if (topCompanies[i] == company) {
                return i;
            }
        }
        return 0; // Not ranked
    }

    function setTopCount(uint256 newCount) external onlyOwner {
        require(newCount > 0 && newCount <= 1000, "invalid count");
        topCount = newCount;
    }
}

