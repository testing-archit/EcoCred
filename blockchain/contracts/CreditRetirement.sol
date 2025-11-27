// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./AccessControl.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

/// @title CreditRetirement - Carbon credit retirement and burning mechanism
/// @notice Allows companies to permanently retire/burn carbon credits to offset emissions
contract CreditRetirement is ReentrancyGuard, Pausable {
    struct Retirement {
        address retirer;
        uint256 amount;
        string reason;
        string certificateId;
        uint256 timestamp;
        bool verified;
    }

    CarbonCreditToken public creditToken;
    AccessControl public accessControl;

    uint256 public totalRetired;
    uint256 public retirementCount;
    mapping(uint256 => Retirement) public retirements;
    mapping(address => uint256[]) public userRetirements;
    mapping(string => bool) public usedCertificates; // Prevent duplicate certificate IDs

    event CreditsRetired(
        uint256 indexed retirementId,
        address indexed retirer,
        uint256 amount,
        string reason,
        string certificateId
    );
    event RetirementVerified(uint256 indexed retirementId, address indexed verifier);
    event CertificateIssued(uint256 indexed retirementId, string certificateId);

    modifier onlyRole(AccessControl.Role role) {
        require(accessControl.hasRole(msg.sender, role), "missing role");
        _;
    }

    constructor(address tokenAddress, address accessControlAddress) {
        require(tokenAddress != address(0), "token address 0");
        require(accessControlAddress != address(0), "access control address 0");
        
        creditToken = CarbonCreditToken(tokenAddress);
        accessControl = AccessControl(accessControlAddress);
    }

    /// @notice Retire carbon credits permanently (burn them)
    /// @param amount Amount of credits to retire (in token units, 18 decimals)
    /// @param reason Reason for retirement (e.g., "Offset company emissions")
    /// @param certificateId Unique certificate ID for this retirement
    function retireCredits(
        uint256 amount,
        string calldata reason,
        string calldata certificateId
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(amount > 0, "amount > 0");
        require(bytes(reason).length > 0, "reason required");
        require(bytes(certificateId).length > 0, "certificate ID required");
        require(!usedCertificates[certificateId], "certificate already used");
        require(creditToken.balanceOf(msg.sender) >= amount, "insufficient balance");

        // Transfer tokens to this contract (they will be burned)
        require(creditToken.transferFrom(msg.sender, address(this), amount), "transfer failed");

        // Burn the tokens using the burn function
        creditToken.burn(amount);

        uint256 retirementId = ++retirementCount;
        retirements[retirementId] = Retirement({
            retirer: msg.sender,
            amount: amount,
            reason: reason,
            certificateId: certificateId,
            timestamp: block.timestamp,
            verified: false
        });

        userRetirements[msg.sender].push(retirementId);
        usedCertificates[certificateId] = true;
        totalRetired += amount;

        emit CreditsRetired(retirementId, msg.sender, amount, reason, certificateId);
        return retirementId;
    }

    /// @notice Verify a retirement (admin/verifier only)
    /// @param retirementId ID of the retirement to verify
    function verifyRetirement(uint256 retirementId) external onlyRole(AccessControl.Role.VERIFIER) {
        Retirement storage retirement = retirements[retirementId];
        require(retirement.retirer != address(0), "retirement not found");
        require(!retirement.verified, "already verified");

        retirement.verified = true;
        emit RetirementVerified(retirementId, msg.sender);
        emit CertificateIssued(retirementId, retirement.certificateId);
    }

    /// @notice Get retirement details
    /// @param retirementId ID of the retirement
    function getRetirement(uint256 retirementId)
        external
        view
        returns (
            address retirer,
            uint256 amount,
            string memory reason,
            string memory certificateId,
            uint256 timestamp,
            bool verified
        )
    {
        Retirement storage retirement = retirements[retirementId];
        require(retirement.retirer != address(0), "retirement not found");
        
        return (
            retirement.retirer,
            retirement.amount,
            retirement.reason,
            retirement.certificateId,
            retirement.timestamp,
            retirement.verified
        );
    }

    /// @notice Get all retirements for a user
    /// @param user Address of the user
    function getUserRetirements(address user) external view returns (uint256[] memory) {
        return userRetirements[user];
    }

    /// @notice Get total retired credits for a user
    /// @param user Address of the user
    function getTotalRetiredByUser(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < userRetirements[user].length; i++) {
            total += retirements[userRetirements[user][i]].amount;
        }
        return total;
    }
}

