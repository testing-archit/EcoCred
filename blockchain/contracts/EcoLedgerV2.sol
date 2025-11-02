// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./EcoBadgeNFT.sol";
import "./AccessControl.sol";
import "./Leaderboard.sol";

/// @title EcoLedgerV2 - Enhanced ledger with multi-verifier and reputation system
contract EcoLedgerV2 {
    struct Action {
        address company;
        string title;
        string description;
        uint256 estimatedCredits;
        string location;
        bool verified;
        uint256 actualCredits;
        uint256 verificationCount;
        mapping(address => bool) verifiers;
        uint256 timestamp;
        string category; // e.g., "renewable_energy", "tree_planting", "recycling"
    }

    struct CompanyProfile {
        uint256 totalCreditsEarned;
        uint256 totalActions;
        uint256 verifiedActions;
        uint256 reputationScore; // 0-1000
        bool isVerified;
    }

    AccessControl public accessControl;
    CarbonCreditToken public creditToken;
    EcoBadgeNFT public badgeNFT;
    Leaderboard public leaderboard; // Optional - can be set after deployment

    uint256 public actionCount;
    mapping(uint256 => Action) private _actions;
    mapping(address => CompanyProfile) public companies;
    mapping(address => uint256[]) public companyActions;

    uint256 public verificationThreshold; // number of verifications needed
    uint256 public reputationMultiplier; // basis points (100 = 1x)

    event EcoActionLogged(
        uint256 indexed actionId,
        address indexed company,
        string title,
        string category
    );
    event ActionVerified(
        uint256 indexed actionId,
        address indexed verifier,
        bool approved,
        uint256 credits
    );
    event ActionFullyVerified(
        uint256 indexed actionId,
        uint256 actualCredits
    );
    event CompanyVerified(address indexed company);
    event ReputationUpdated(address indexed company, uint256 newScore);

    modifier onlyRole(AccessControl.Role role) {
        require(accessControl.hasRole(msg.sender, role), "missing role");
        _;
    }

    constructor(
        address tokenAddress,
        address badgeAddress,
        address accessControlAddress,
        uint256 threshold
    ) {
        require(tokenAddress != address(0), "token address 0");
        require(badgeAddress != address(0), "badge address 0");
        require(accessControlAddress != address(0), "access control address 0");
        
        creditToken = CarbonCreditToken(tokenAddress);
        badgeNFT = EcoBadgeNFT(badgeAddress);
        accessControl = AccessControl(accessControlAddress);
        verificationThreshold = threshold > 0 ? threshold : 1;
        reputationMultiplier = 10000; // 1x default
    }

    function setVerificationThreshold(uint256 newThreshold) external onlyRole(AccessControl.Role.ADMIN) {
        require(newThreshold > 0, "threshold > 0");
        verificationThreshold = newThreshold;
    }

    function setReputationMultiplier(uint256 newMultiplier) external onlyRole(AccessControl.Role.ADMIN) {
        require(newMultiplier <= 20000, "multiplier too high"); // max 2x
        reputationMultiplier = newMultiplier;
    }

    function setLeaderboard(address leaderboardAddress) external onlyRole(AccessControl.Role.ADMIN) {
        require(leaderboardAddress != address(0), "zero address");
        leaderboard = Leaderboard(leaderboardAddress);
    }

    function logEcoAction(
        string calldata title,
        string calldata description,
        uint256 estimatedCredits,
        string calldata location,
        string calldata category
    ) external returns (uint256) {
        require(bytes(title).length > 0, "title required");
        require(estimatedCredits > 0, "estimate > 0");
        require(bytes(category).length > 0, "category required");

        uint256 id = ++actionCount;
        Action storage action = _actions[id];
        
        action.company = msg.sender;
        action.title = title;
        action.description = description;
        action.estimatedCredits = estimatedCredits;
        action.location = location;
        action.verified = false;
        action.actualCredits = 0;
        action.verificationCount = 0;
        action.timestamp = block.timestamp;
        action.category = category;

        CompanyProfile storage profile = companies[msg.sender];
        profile.totalActions++;

        companyActions[msg.sender].push(id);

        emit EcoActionLogged(id, msg.sender, title, category);
        return id;
    }

    function verifyAction(
        uint256 actionId,
        bool approved,
        uint256 actualCredits
    ) external onlyRole(AccessControl.Role.VERIFIER) {
        Action storage action = _actions[actionId];
        require(action.company != address(0), "action not found");
        require(!action.verifiers[msg.sender], "already verified");
        require(!action.verified || !approved, "action fully verified");

        action.verifiers[msg.sender] = true;

        if (approved) {
            require(actualCredits > 0, "credits > 0");
            action.verificationCount++;
            
            // If threshold reached, finalize verification
            if (action.verificationCount >= verificationThreshold && !action.verified) {
                _finalizeVerification(actionId, actualCredits);
            } else {
                emit ActionVerified(actionId, msg.sender, true, actualCredits);
            }
        } else {
            emit ActionVerified(actionId, msg.sender, false, 0);
        }
    }

    function _finalizeVerification(uint256 actionId, uint256 baseCredits) internal {
        Action storage action = _actions[actionId];
        require(!action.verified, "already verified");

        CompanyProfile storage profile = companies[action.company];

        // Apply reputation multiplier
        uint256 adjustedCredits = (baseCredits * reputationMultiplier) / 10000;
        action.actualCredits = adjustedCredits;
        action.verified = true;

        // Update company profile
        profile.totalCreditsEarned += adjustedCredits;
        profile.verifiedActions++;
        _updateReputation(action.company);

        // Mint credits
        creditToken.mint(action.company, adjustedCredits * 1e18);

        // Update leaderboard if set
        if (address(leaderboard) != address(0)) {
            leaderboard.updateLeaderboard(action.company);
        }

        // Mint badges based on milestones
        if (profile.totalCreditsEarned >= 1000 && profile.totalCreditsEarned - adjustedCredits < 1000) {
            badgeNFT.safeMint(action.company);
        }
        if (profile.totalCreditsEarned >= 5000 && profile.totalCreditsEarned - adjustedCredits < 5000) {
            badgeNFT.safeMint(action.company);
        }
        if (profile.totalCreditsEarned >= 10000 && profile.totalCreditsEarned - adjustedCredits < 10000) {
            badgeNFT.safeMint(action.company);
        }

        emit ActionFullyVerified(actionId, adjustedCredits);
    }

    function verifyCompany(address company) external onlyRole(AccessControl.Role.ADMIN) {
        require(company != address(0), "zero address");
        companies[company].isVerified = true;
        emit CompanyVerified(company);
    }

    function _updateReputation(address company) internal {
        CompanyProfile storage profile = companies[company];
        
        if (profile.totalActions == 0) {
            profile.reputationScore = 0;
            return;
        }

        // Calculate reputation: verified ratio * 500 + credits tier * 500
        uint256 verifiedRatio = (profile.verifiedActions * 1000) / profile.totalActions;
        uint256 creditsTier = profile.totalCreditsEarned > 10000 ? 1000 :
                             profile.totalCreditsEarned > 5000 ? 750 :
                             profile.totalCreditsEarned > 1000 ? 500 :
                             profile.totalCreditsEarned > 100 ? 250 : 0;
        
        profile.reputationScore = (verifiedRatio * 500) / 1000 + creditsTier;
        
        if (profile.reputationScore > 1000) profile.reputationScore = 1000;

        emit ReputationUpdated(company, profile.reputationScore);
    }

    function getAction(uint256 actionId)
        external
        view
        returns (
            address company,
            string memory title,
            string memory description,
            uint256 estimatedCredits,
            string memory location,
            bool verified,
            uint256 actualCredits,
            uint256 verificationCount,
            uint256 timestamp,
            string memory category
        )
    {
        Action storage action = _actions[actionId];
        require(action.company != address(0), "action not found");
        
        return (
            action.company,
            action.title,
            action.description,
            action.estimatedCredits,
            action.location,
            action.verified,
            action.actualCredits,
            action.verificationCount,
            action.timestamp,
            action.category
        );
    }

    function getCompanyProfile(address company)
        external
        view
        returns (
            uint256 totalCreditsEarned,
            uint256 totalActions,
            uint256 verifiedActions,
            uint256 reputationScore,
            bool isVerified
        )
    {
        CompanyProfile storage profile = companies[company];
        return (
            profile.totalCreditsEarned,
            profile.totalActions,
            profile.verifiedActions,
            profile.reputationScore,
            profile.isVerified
        );
    }

    function getCompanyActions(address company) external view returns (uint256[] memory) {
        return companyActions[company];
    }

    function hasVerified(uint256 actionId, address verifier) external view returns (bool) {
        return _actions[actionId].verifiers[verifier];
    }
}

