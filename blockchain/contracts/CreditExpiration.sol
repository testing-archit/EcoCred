// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./AccessControl.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

/// @title CreditExpiration - Carbon credit expiration and decay mechanism
/// @notice Implements time-based credit expiration to ensure credits remain valid
contract CreditExpiration is ReentrancyGuard, Pausable {
    struct CreditBatch {
        uint256 amount;
        uint256 mintTimestamp;
        uint256 expirationTimestamp;
        bool expired;
    }

    CarbonCreditToken public creditToken;
    AccessControl public accessControl;

    uint256 public defaultExpirationPeriod; // in seconds (e.g., 365 days)
    uint256 public gracePeriod; // in seconds (e.g., 30 days)
    
    mapping(address => CreditBatch[]) public creditBatches;
    mapping(address => uint256) public totalExpired;
    uint256 public globalExpiredAmount;

    event CreditsExpired(address indexed holder, uint256 amount, uint256 batchIndex);
    event ExpirationPeriodUpdated(uint256 newPeriod);
    event GracePeriodUpdated(uint256 newPeriod);
    event CreditsMarkedForExpiration(address indexed holder, uint256 amount, uint256 expirationTime);

    modifier onlyRole(AccessControl.Role role) {
        require(accessControl.hasRole(msg.sender, role), "missing role");
        _;
    }

    constructor(
        address tokenAddress,
        address accessControlAddress,
        uint256 expirationPeriod,
        uint256 gracePeriodDays
    ) {
        require(tokenAddress != address(0), "token address 0");
        require(accessControlAddress != address(0), "access control address 0");
        
        creditToken = CarbonCreditToken(tokenAddress);
        accessControl = AccessControl(accessControlAddress);
        defaultExpirationPeriod = expirationPeriod;
        gracePeriod = gracePeriodDays * 1 days;
    }

    /// @notice Mark credits for expiration when they are minted
    /// @param holder Address that received the credits
    /// @param amount Amount of credits minted
    function markForExpiration(address holder, uint256 amount) external onlyRole(AccessControl.Role.ADMIN) {
        require(holder != address(0), "zero address");
        require(amount > 0, "amount > 0");

        creditBatches[holder].push(CreditBatch({
            amount: amount,
            mintTimestamp: block.timestamp,
            expirationTimestamp: block.timestamp + defaultExpirationPeriod,
            expired: false
        }));

        emit CreditsMarkedForExpiration(holder, amount, block.timestamp + defaultExpirationPeriod);
    }

    /// @notice Check and expire credits for a specific holder
    /// @param holder Address to check for expired credits
    function checkAndExpire(address holder) external nonReentrant whenNotPaused returns (uint256) {
        uint256 expiredAmount = 0;
        
        for (uint256 i = 0; i < creditBatches[holder].length; i++) {
            CreditBatch storage batch = creditBatches[holder][i];
            
            if (!batch.expired && 
                block.timestamp >= batch.expirationTimestamp + gracePeriod &&
                creditToken.balanceOf(holder) >= batch.amount) {
                
                batch.expired = true;
                expiredAmount += batch.amount;
                
                // Burn expired credits
                require(creditToken.transferFrom(holder, address(this), batch.amount), "transfer failed");
                creditToken.burn(batch.amount);
                
                totalExpired[holder] += batch.amount;
                globalExpiredAmount += batch.amount;
                
                emit CreditsExpired(holder, batch.amount, i);
            }
        }
        
        return expiredAmount;
    }

    /// @notice Batch check and expire credits for multiple holders
    /// @param holders Array of holder addresses
    function batchCheckAndExpire(address[] calldata holders) external nonReentrant whenNotPaused returns (uint256 totalExpiredAmount) {
        require(holders.length > 0 && holders.length <= 50, "invalid batch size");
        
        for (uint256 i = 0; i < holders.length; i++) {
            totalExpiredAmount += this.checkAndExpire(holders[i]);
        }
    }

    /// @notice Get expiration status for a holder
    /// @param holder Address to check
    function getExpirationStatus(address holder) 
        external 
        view 
        returns (
            uint256 totalBatches,
            uint256 activeBatches,
            uint256 expiredBatches,
            uint256 totalExpiredAmount,
            uint256 nextExpirationTimestamp
        ) 
    {
        CreditBatch[] memory batches = creditBatches[holder];
        totalBatches = batches.length;
        uint256 nextExpiration = type(uint256).max;
        
        for (uint256 i = 0; i < batches.length; i++) {
            if (batches[i].expired) {
                expiredBatches++;
            } else {
                activeBatches++;
                if (batches[i].expirationTimestamp < nextExpiration) {
                    nextExpiration = batches[i].expirationTimestamp;
                }
            }
        }
        
        totalExpiredAmount = totalExpired[holder];
        nextExpirationTimestamp = nextExpiration == type(uint256).max ? 0 : nextExpiration;
    }

    /// @notice Get credit batch details
    /// @param holder Address of the holder
    /// @param batchIndex Index of the batch
    function getCreditBatch(address holder, uint256 batchIndex)
        external
        view
        returns (
            uint256 amount,
            uint256 mintTimestamp,
            uint256 expirationTimestamp,
            bool expired,
            bool canExpire
        )
    {
        require(batchIndex < creditBatches[holder].length, "batch not found");
        CreditBatch memory batch = creditBatches[holder][batchIndex];
        
        return (
            batch.amount,
            batch.mintTimestamp,
            batch.expirationTimestamp,
            batch.expired,
            !batch.expired && block.timestamp >= batch.expirationTimestamp + gracePeriod
        );
    }

    /// @notice Set expiration period (admin only)
    /// @param newPeriod New expiration period in seconds
    function setExpirationPeriod(uint256 newPeriod) external onlyRole(AccessControl.Role.ADMIN) {
        require(newPeriod >= 30 days && newPeriod <= 10 * 365 days, "invalid period");
        defaultExpirationPeriod = newPeriod;
        emit ExpirationPeriodUpdated(newPeriod);
    }

    /// @notice Set grace period (admin only)
    /// @param newGracePeriod New grace period in days
    function setGracePeriod(uint256 newGracePeriod) external onlyRole(AccessControl.Role.ADMIN) {
        require(newGracePeriod <= 365 days, "grace period too long");
        gracePeriod = newGracePeriod * 1 days;
        emit GracePeriodUpdated(gracePeriod);
    }
}

