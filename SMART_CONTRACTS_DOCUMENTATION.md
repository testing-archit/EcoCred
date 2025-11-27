# EcoCred Smart Contracts - Complete Documentation

This document provides a comprehensive explanation of each smart contract in the EcoCred platform.

---

## Table of Contents

1. [Core Contracts](#core-contracts)
2. [Token & NFT Contracts](#token--nft-contracts)
3. [Marketplace & Trading](#marketplace--trading)
4. [Staking & Rewards](#staking--rewards)
5. [Governance & Access Control](#governance--access-control)
6. [Analytics & Leaderboard](#analytics--leaderboard)
7. [Credit Management](#credit-management)
8. [Utility Contracts](#utility-contracts)
9. [Legacy Contracts](#legacy-contracts)

---

## Core Contracts

### 1. EcoLedgerV2.sol

**Purpose**: The main ledger contract that tracks eco-actions, manages verification, mints credits, and maintains company reputation.

**Key Features**:
- **Action Logging**: Companies log eco-actions with metadata (title, description, credits, location, category)
- **Multi-Verifier System**: Multiple verifiers can review actions; configurable verification threshold
- **Credit Minting**: Automatically mints carbon credits when verification threshold is reached
- **Reputation System**: Calculates company reputation scores (0-1000) based on verified actions and total credits
- **Badge Integration**: Automatically mints NFT badges at credit milestones (1K, 5K, 10K credits)
- **Leaderboard Integration**: Updates leaderboard rankings when actions are verified

**Structs**:
```solidity
struct Action {
    address company;           // Company that logged the action
    string title;              // Action title
    string description;        // Detailed description
    uint256 estimatedCredits;  // Estimated credits before verification
    string location;           // Geographic location
    bool verified;             // Whether action is fully verified
    uint256 actualCredits;     // Actual credits awarded after verification
    uint256 verificationCount; // Number of verifiers who approved
    mapping(address => bool) verifiers; // Track which verifiers have verified
    uint256 timestamp;         // When action was logged
    string category;           // Action category (e.g., "tree_planting")
}

struct CompanyProfile {
    uint256 totalCreditsEarned;  // Total credits earned by company
    uint256 totalActions;        // Total actions logged
    uint256 verifiedActions;     // Number of verified actions
    uint256 reputationScore;     // Reputation score (0-1000)
    bool isVerified;             // Whether company is verified
}
```

**Key Functions**:
- `logEcoAction(title, description, estimatedCredits, location, category)`: Log a new eco-action
- `verifyAction(actionId, approved, actualCredits)`: Verifier reviews and approves/rejects action
- `getAction(actionId)`: Retrieve action details
- `getCompanyProfile(company)`: Get company statistics and reputation
- `setVerificationThreshold(newThreshold)`: Admin updates verification threshold
- `setReputationMultiplier(newMultiplier)`: Admin sets credit multiplier based on reputation

**Workflow**:
1. Company calls `logEcoAction()` → Action created with PENDING status
2. Verifiers call `verifyAction()` → Verification count increases
3. When threshold reached → `_finalizeVerification()` is called:
   - Applies reputation multiplier to credits
   - Mints credits to company
   - Updates company profile and reputation
   - Updates leaderboard
   - Mints badges at milestones

**Reputation Calculation**:
- Based on verified action ratio (50% weight) and credits tier (50% weight)
- Formula: `(verifiedRatio * 500) / 1000 + creditsTier`
- Credits tiers: 100+ = 250, 1000+ = 500, 5000+ = 750, 10000+ = 1000
- Maximum reputation score: 1000

**Events**:
- `EcoActionLogged`: Emitted when action is logged
- `ActionVerified`: Emitted for each verification
- `ActionFullyVerified`: Emitted when action reaches verification threshold
- `ReputationUpdated`: Emitted when company reputation changes

---

## Token & NFT Contracts

### 2. CarbonCreditToken.sol

**Purpose**: ERC20-compatible token representing carbon credits on the blockchain.

**Key Features**:
- **Controlled Minting**: Only designated minter (EcoLedgerV2) can mint tokens
- **Burn Functionality**: Tokens can be burned for retirement/expiration
- **Standard ERC20**: Implements transfer, approve, transferFrom functions
- **18 Decimals**: Uses standard 18 decimal places for precision

**Roles**:
- **Owner**: Can update the minter address
- **Minter**: Can mint new tokens (typically EcoLedgerV2)

**Key Functions**:
- `mint(to, amount)`: Minter-only function to create new tokens
- `burn(amount)`: Anyone can burn their own tokens
- `burnFrom(from, amount)`: Burn tokens from another address (requires allowance)
- `transfer(to, amount)`: Standard ERC20 transfer
- `approve(spender, amount)`: Approve spender to transfer tokens
- `transferFrom(from, to, amount)`: Transfer from another address (requires allowance)
- `setMinter(newMinter)`: Owner-only function to change minter

**Token Details**:
- **Name**: "Carbon Credit"
- **Symbol**: "CCT"
- **Decimals**: 18
- **Total Supply**: Dynamic (increases with minting, decreases with burning)

**Events**:
- `Transfer`: Standard ERC20 transfer event
- `Approval`: Standard ERC20 approval event
- `Burn`: Emitted when tokens are burned
- `MinterUpdated`: Emitted when minter address changes

---

### 3. EcoBadgeNFT.sol

**Purpose**: ERC721-like NFT contract for eco-achievement badges.

**Key Features**:
- **Non-Fungible Tokens**: Each badge is a unique NFT
- **Metadata URI**: Uses baseURI + tokenId pattern for metadata
- **Auto-Incrementing IDs**: Tokens are minted with sequential IDs
- **Owner Enumeration**: Basic token enumeration for frontend queries
- **Transfer Support**: Supports standard NFT transfers

**Key Functions**:
- `safeMint(to)`: Owner-only function to mint badges to addresses
- `tokenURI(id)`: Returns metadata URI for a badge
- `balanceOf(account)`: Returns number of badges owned
- `ownerOf(id)`: Returns owner of specific badge
- `approve(spender, id)`: Approve transfer of specific badge
- `setApprovalForAll(operator, approved)`: Approve operator for all tokens
- `transferFrom(from, to, id)`: Transfer badge between addresses
- `tokenOfOwnerByIndex(owner, index)`: Get badge ID by index for owner
- `setBaseURI(base)`: Owner-only function to update metadata base URI

**Badge Structure**:
- Each badge is identified by a unique `tokenId`
- Metadata is stored off-chain at `baseURI + tokenId`
- Badges are typically minted automatically when companies reach credit milestones

**Events**:
- `Transfer`: Emitted when badge is transferred or minted
- `Approval`: Emitted when approval is granted
- `ApprovalForAll`: Emitted when operator approval is set

---

## Marketplace & Trading

### 4. CarbonCreditMarketplace.sol

**Purpose**: Peer-to-peer marketplace for buying and selling carbon credits.

**Key Features**:
- **Listing System**: Sellers create listings with price per credit
- **Escrow Mechanism**: Credits are held in contract until purchase
- **Fee System**: Configurable platform fee (max 10%)
- **Reentrancy Protection**: Uses ReentrancyGuard for security
- **Pausable**: Can be paused in emergencies

**Structs**:
```solidity
struct Listing {
    address seller;           // Address of seller
    uint256 amount;           // Credits available for sale
    uint256 pricePerCredit;   // Price in wei per credit
    bool active;              // Whether listing is active
    uint256 timestamp;        // When listing was created
}
```

**Key Functions**:
- `createListing(amount, pricePerCredit)`: Create new listing (transfers tokens to escrow)
- `purchase(listingId, amount)`: Buy credits from listing (sends ETH, receives tokens)
- `cancelListing(listingId)`: Cancel listing and get tokens back
- `getListing(listingId)`: Get listing details
- `getSellerListings(seller)`: Get all listings by a seller
- `withdrawFees()`: Owner-only function to withdraw accumulated fees
- `setFee(newFee)`: Owner-only function to update fee percentage

**Workflow**:
1. Seller calls `createListing()` → Tokens transferred to contract (escrow)
2. Buyer sends ETH via `purchase()` → Receives tokens, seller receives ETH minus fee
3. Listing automatically deactivates when sold out
4. Seller can cancel anytime to get tokens back

**Fee Calculation**:
- Fee = `(totalPrice * feePercentage) / 10000` (basis points)
- Seller receives: `totalPrice - fee`
- Fees accumulate in contract until owner withdraws

**Events**:
- `ListingCreated`: Emitted when new listing is created
- `ListingCancelled`: Emitted when listing is cancelled
- `PurchaseExecuted`: Emitted when purchase occurs

---

## Staking & Rewards

### 5. CreditStaking.sol

**Purpose**: Staking mechanism allowing companies to lock credits for rewards.

**Key Features**:
- **Lock Periods**: Credits are locked for specified duration (days)
- **Reward System**: Calculates rewards based on lock period and reward rate
- **Multiple Stakes**: Users can have multiple active stakes
- **Automatic Rewards**: Rewards are minted when stakes are unlocked
- **Configurable Rate**: Admin can set reward rate (max 50% APY)

**Structs**:
```solidity
struct Stake {
    uint256 amount;      // Amount staked
    uint256 timestamp;   // When stake was created
    uint256 lockPeriod;  // Lock duration in seconds
    bool isLocked;       // Whether stake is still locked
}
```

**Key Functions**:
- `stake(amount, lockPeriodInDays)`: Lock credits for rewards
- `unstake(stakeIndex)`: Unlock stake and claim rewards
- `calculateReward(stakeData)`: Calculate reward for a stake
- `getStake(user, index)`: Get stake details by index
- `getStakeCount(user)`: Get number of stakes for user
- `getTotalPendingRewards(user)`: Calculate total pending rewards
- `setRewardRate(newRate)`: Owner-only function to update reward rate
- `setMinter(newMinter)`: Owner-only function to set reward minter

**Reward Calculation**:
- Annual reward = `(amount * rewardRate) / BASIS_POINTS`
- Actual reward = `(annualReward * stakingDuration) / 365 days`
- Rewards are only calculated for unlocked stakes

**Requirements**:
- Contract must be set as minter in CarbonCreditToken to mint rewards
- Stakes must complete lock period before unstaking
- Rewards are automatically minted when unstaking

**Events**:
- `Staked`: Emitted when credits are staked
- `Unstaked`: Emitted when stake is unlocked and rewards claimed
- `RewardClaimed`: Emitted when rewards are claimed

---

## Governance & Access Control

### 6. Governance.sol

**Purpose**: DAO-style governance system for platform decisions.

**Key Features**:
- **Proposal System**: Token holders can create proposals
- **Voting**: Weighted voting based on token balance
- **Execution**: Successful proposals can execute arbitrary calls
- **Thresholds**: Minimum tokens required to propose and vote
- **Voting Period**: Configurable voting window (default 7 days)

**Structs**:
```solidity
struct Proposal {
    address proposer;        // Address that created proposal
    string description;      // Proposal description
    uint256 votesFor;        // Total votes in favor
    uint256 votesAgainst;    // Total votes against
    uint256 deadline;        // Voting deadline timestamp
    bool executed;           // Whether proposal was executed
    bytes data;              // Calldata for execution
    address target;          // Target contract address
}
```

**Key Functions**:
- `createProposal(description, target, data)`: Create new proposal (requires minimum tokens)
- `vote(proposalId, support)`: Vote on proposal (true = for, false = against)
- `executeProposal(proposalId)`: Execute successful proposal
- `getProposal(proposalId)`: Get proposal details
- `setVotingPeriod(newPeriod)`: Admin-only function to update voting period
- `setQuorumThreshold(newThreshold)`: Admin-only function to update quorum

**Voting Requirements**:
- Proposal threshold: 10,000 tokens (default)
- Quorum threshold: 1,000 tokens (default)
- Voting power = token balance at time of vote
- One vote per address per proposal

**Execution**:
- Proposals can execute arbitrary calls to any contract
- Requires majority votes (votesFor > votesAgainst)
- Can only execute after voting deadline
- Execution can fail if calldata is invalid

**Events**:
- `ProposalCreated`: Emitted when proposal is created
- `VoteCast`: Emitted when vote is cast
- `ProposalExecuted`: Emitted when proposal is executed

---

### 7. AccessControl.sol

**Purpose**: Role-based access control system for the platform.

**Key Features**:
- **Role Enumeration**: Four roles (NONE, ADMIN, VERIFIER, MODERATOR)
- **Owner System**: Single owner with ADMIN role
- **Role Management**: Owner can grant/revoke roles
- **Ownership Transfer**: Owner can transfer ownership

**Roles**:
- **NONE**: Default role, no special permissions
- **ADMIN**: Full platform control, can grant/revoke roles
- **VERIFIER**: Can verify eco-actions (used by EcoLedgerV2)
- **MODERATOR**: Reserved for future moderation features

**Key Functions**:
- `grantRole(account, role)`: Owner-only function to grant role
- `revokeRole(account)`: Owner-only function to revoke role
- `hasRole(account, role)`: Check if account has specific role
- `transferOwnership(newOwner)`: Owner-only function to transfer ownership

**Security**:
- Only owner can grant/revoke roles
- Owner cannot revoke their own ADMIN role
- Ownership transfer resets old owner's role to NONE
- New owner automatically gets ADMIN role

**Usage**:
- Other contracts use `onlyRole` modifier for access control
- Verifiers must have VERIFIER role to verify actions
- Admins can perform administrative functions

**Events**:
- `RoleGranted`: Emitted when role is granted
- `RoleRevoked`: Emitted when role is revoked
- `OwnershipTransferred`: Emitted when ownership is transferred

---

## Analytics & Leaderboard

### 8. Leaderboard.sol

**Purpose**: Ranking system for companies based on credits and reputation.

**Key Features**:
- **Top Companies**: Tracks top 100 companies
- **Auto-Update**: Updates when companies earn credits (called by EcoLedgerV2)
- **Weighted Ranking**: Uses credits + (reputation * 100) as score
- **Configurable Size**: Admin can adjust top companies count

**Structs**:
```solidity
struct LeaderboardEntry {
    address company;         // Company address
    uint256 totalCredits;    // Total credits earned
    uint256 reputationScore; // Reputation score
    uint256 rank;            // Current rank
}
```

**Key Functions**:
- `updateLeaderboard(company)`: Called by EcoLedgerV2 to update rankings
- `getTopCompanies(limit)`: Get top N companies with details
- `getCompanyRank(company)`: Get rank of specific company (0 if not ranked)
- `setTopCount(newCount)`: Owner-only function to adjust top companies count

**Ranking Algorithm**:
- Score = `totalCredits + (reputationScore * 100)`
- Companies sorted by score (descending)
- Updates trigger position shifts when companies improve

**Integration**:
- Automatically called by EcoLedgerV2 when actions are verified
- Provides data for frontend leaderboard display
- Only tracks top companies (configurable, default 100)

**Events**:
- `LeaderboardUpdated`: Emitted when company rank changes

---

### 9. Analytics.sol

**Purpose**: Comprehensive analytics aggregator for platform statistics.

**Key Features**:
- **Platform Stats**: Aggregates data from multiple contracts
- **Company Analytics**: Provides detailed analytics per company
- **Credit Distribution**: Tracks supply, staked, retired, and circulating credits
- **Action Statistics**: Tracks total, verified, and pending actions

**Structs**:
```solidity
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
```

**Key Functions**:
- `getPlatformStats()`: Get overall platform statistics
- `getCompanyAnalytics(company)`: Get detailed analytics for company
- `getCreditDistribution()`: Get credit supply breakdown
- `getActionStats()`: Get action statistics

**Data Sources**:
- EcoLedgerV2: Actions, credits, reputation
- CarbonCreditToken: Total supply, balances
- CarbonCreditMarketplace: Trading volume
- CreditStaking: Staked amounts
- CreditRetirement: Retired amounts

**Note**: Some statistics (like marketplace volume, badge count) require event indexing or separate tracking for full accuracy.

**Events**:
- `AnalyticsUpdated`: Emitted when analytics are updated

---

## Credit Management

### 10. CreditRetirement.sol

**Purpose**: Permanent retirement (burning) of carbon credits for offsetting emissions.

**Key Features**:
- **Permanent Burning**: Credits are burned when retired
- **Certificate System**: Each retirement gets unique certificate ID
- **Verification**: Verifiers can verify retirements
- **Duplicate Prevention**: Certificate IDs must be unique
- **Tracking**: Tracks all retirements per user

**Structs**:
```solidity
struct Retirement {
    address retirer;        // Address that retired credits
    uint256 amount;         // Amount retired (in token units)
    string reason;          // Reason for retirement
    string certificateId;   // Unique certificate identifier
    uint256 timestamp;      // When retirement occurred
    bool verified;          // Whether retirement is verified
}
```

**Key Functions**:
- `retireCredits(amount, reason, certificateId)`: Retire (burn) credits permanently
- `verifyRetirement(retirementId)`: Verifier-only function to verify retirement
- `getRetirement(retirementId)`: Get retirement details
- `getUserRetirements(user)`: Get all retirement IDs for user
- `getTotalRetiredByUser(user)`: Calculate total retired by user

**Workflow**:
1. User calls `retireCredits()` with certificate ID
2. Tokens transferred to contract and burned
3. Retirement record created
4. Verifier can verify retirement (optional)

**Requirements**:
- Certificate ID must be unique (prevents duplicate retirements)
- User must have sufficient balance
- Reason and certificate ID required

**Events**:
- `CreditsRetired`: Emitted when credits are retired
- `RetirementVerified`: Emitted when retirement is verified
- `CertificateIssued`: Emitted when certificate is issued

---

### 11. CreditExpiration.sol

**Purpose**: Time-based expiration system for carbon credits.

**Key Features**:
- **Expiration Period**: Credits expire after configurable period (default 1 year)
- **Grace Period**: Additional time after expiration before burning (default 30 days)
- **Batch Tracking**: Tracks credits in batches per mint
- **Automatic Expiration**: Can check and expire credits for holders
- **Admin Control**: Admin can mark credits for expiration

**Structs**:
```solidity
struct CreditBatch {
    uint256 amount;              // Amount in batch
    uint256 mintTimestamp;       // When credits were minted
    uint256 expirationTimestamp; // When batch expires
    bool expired;                // Whether batch is expired
}
```

**Key Functions**:
- `markForExpiration(holder, amount)`: Admin-only function to mark credits for expiration
- `checkAndExpire(holder)`: Check and expire credits for holder
- `batchCheckAndExpire(holders)`: Batch check multiple holders
- `getExpirationStatus(holder)`: Get expiration status for holder
- `getCreditBatch(holder, batchIndex)`: Get batch details
- `setExpirationPeriod(newPeriod)`: Admin-only function to update expiration period
- `setGracePeriod(newGracePeriod)`: Admin-only function to update grace period

**Expiration Logic**:
1. Credits are marked for expiration when minted
2. After expiration period + grace period, credits can be expired
3. Expired credits are burned automatically
4. Holders have grace period to use credits before expiration

**Requirements**:
- Expiration period: 30 days to 10 years
- Grace period: Up to 365 days
- Credits must be in holder's balance to expire

**Events**:
- `CreditsExpired`: Emitted when credits expire
- `ExpirationPeriodUpdated`: Emitted when expiration period changes
- `GracePeriodUpdated`: Emitted when grace period changes
- `CreditsMarkedForExpiration`: Emitted when credits are marked

---

## Utility Contracts

### 12. BatchOperations.sol

**Purpose**: Gas-efficient batch operations for common actions.

**Key Features**:
- **Batch Transfers**: Transfer to multiple addresses in one transaction
- **Batch Action Logging**: Log multiple actions at once
- **Batch Listings**: Create multiple marketplace listings
- **Batch Staking**: Stake multiple amounts with different lock periods
- **Batch Unstaking**: Unstake multiple positions at once

**Key Functions**:
- `batchTransfer(recipients, amounts)`: Transfer to multiple addresses (max 50)
- `batchLogActions(titles, descriptions, credits, locations, categories)`: Log multiple actions (max 20)
- `batchCreateListings(amounts, prices)`: Create multiple listings (max 10)
- `batchStake(amounts, lockPeriods)`: Create multiple stakes (max 10)
- `batchUnstake(stakeIndices)`: Unstake multiple positions (max 20)

**Gas Savings**:
- Reduces transaction overhead by batching operations
- Single approval can cover multiple operations
- Useful for companies with many actions/listings

**Requirements**:
- All array lengths must match
- Array lengths must be within limits
- Sufficient balance/allowance required

**Events**:
- `BatchTransferExecuted`: Emitted when batch transfer completes
- `BatchActionLogged`: Emitted when batch actions are logged
- `BatchStakeExecuted`: Emitted when batch staking completes

---

### 13. Pausable.sol

**Purpose**: Emergency pause functionality for contracts.

**Key Features**:
- **Pause/Unpause**: Owner can pause contract operations
- **Modifiers**: `whenNotPaused` and `whenPaused` modifiers
- **Ownership Transfer**: Owner can transfer ownership

**Key Functions**:
- `pause()`: Owner-only function to pause contract
- `unpause()`: Owner-only function to unpause contract
- `transferOwnership(newOwner)`: Owner-only function to transfer ownership

**Usage**:
- Contracts inherit from Pausable
- Critical functions use `whenNotPaused` modifier
- Allows emergency stop in case of vulnerabilities or attacks

**Events**:
- `Paused`: Emitted when contract is paused
- `Unpaused`: Emitted when contract is unpaused

---

### 14. ReentrancyGuard.sol

**Purpose**: Protection against reentrancy attacks.

**Key Features**:
- **Simple Guard**: Uses status flag to prevent reentrancy
- **Non-Reentrant Modifier**: `nonReentrant` modifier for protected functions
- **Status States**: NOT_ENTERED and ENTERED states

**Mechanism**:
- Sets status to ENTERED when function starts
- Prevents nested calls (reentrancy)
- Resets to NOT_ENTERED when function completes

**Usage**:
- Applied to functions that make external calls
- Prevents recursive calls during execution
- Critical for functions that transfer tokens/ETH

**Best Practice**: Use on all functions that:
- Transfer tokens or ETH
- Make external calls to untrusted contracts
- Update state and then call external functions

---

### 15. TimelockController.sol

**Purpose**: Time-delayed execution for critical operations.

**Key Features**:
- **Delayed Execution**: Operations scheduled with minimum delay
- **Admin Control**: Only admins can schedule and execute
- **Cancellation**: Admins can cancel scheduled operations
- **Security**: Prevents immediate execution of critical changes

**Structs**:
```solidity
struct Operation {
    address target;      // Target contract address
    bytes data;          // Calldata for execution
    uint256 timestamp;   // Execution timestamp
    bool executed;       // Whether operation was executed
    bool cancelled;      // Whether operation was cancelled
}
```

**Key Functions**:
- `schedule(target, data)`: Admin-only function to schedule operation
- `execute(operationId)`: Admin-only function to execute operation (after delay)
- `cancel(operationId)`: Admin-only function to cancel operation
- `getOperation(operationId)`: Get operation details
- `setMinDelay(newDelay)`: Admin-only function to update minimum delay

**Workflow**:
1. Admin schedules operation → Execution timestamp = now + minDelay
2. Wait for delay period
3. Admin executes operation → Calls target with calldata
4. Admin can cancel before execution

**Requirements**:
- Minimum delay: 1 hour to 30 days
- Operations can only execute after delay
- Operations must be executed by admin

**Use Cases**:
- Updating critical parameters
- Changing ownership
- Updating minter addresses
- Changing verification thresholds

**Events**:
- `OperationScheduled`: Emitted when operation is scheduled
- `OperationExecuted`: Emitted when operation is executed
- `OperationCancelled`: Emitted when operation is cancelled
- `MinDelayUpdated`: Emitted when delay is updated

---

## Legacy Contracts

### 16. EcoLedger.sol

**Purpose**: Original simplified ledger contract (replaced by EcoLedgerV2).

**Key Features**:
- **Basic Action Logging**: Simple action tracking
- **Owner Verification**: Only owner can verify actions
- **Credit Minting**: Mints credits when verified
- **Badge Minting**: Mints badge at 100+ credits milestone

**Differences from EcoLedgerV2**:
- Single owner verification (no multi-verifier system)
- No reputation system
- No company profiles
- Simpler action structure
- Fixed badge milestone (100 credits)

**Status**: Legacy contract, not actively used. EcoLedgerV2 is the current implementation.

**Key Functions**:
- `logEcoAction(title, description, estimatedCredits, location)`: Log action
- `verifyAction(actionId, approved, actualCredits)`: Owner-only verification
- `getAction(actionId)`: Get action details

---

## Contract Relationships

```
AccessControl
    ├── EcoLedgerV2 (VERIFIER role)
    ├── Governance (ADMIN role)
    ├── CreditRetirement (VERIFIER role)
    ├── CreditExpiration (ADMIN role)
    └── TimelockController (ADMIN role)

CarbonCreditToken
    ├── EcoLedgerV2 (mints credits)
    ├── CarbonCreditMarketplace (escrow)
    ├── CreditStaking (staking)
    ├── CreditRetirement (burns credits)
    └── CreditExpiration (burns credits)

EcoLedgerV2
    ├── CarbonCreditToken (mints credits)
    ├── EcoBadgeNFT (mints badges)
    ├── AccessControl (checks roles)
    └── Leaderboard (updates rankings)

Pausable & ReentrancyGuard
    ├── CarbonCreditMarketplace
    ├── CreditStaking
    ├── CreditRetirement
    └── CreditExpiration
```

---

## Security Features

### Access Control
- Role-based permissions via AccessControl
- Owner-only functions for critical operations
- Verifier-only functions for verification

### Reentrancy Protection
- ReentrancyGuard on all external call functions
- Prevents recursive attacks

### Pausable Contracts
- Emergency pause functionality
- Allows stopping operations in case of vulnerabilities

### Timelock
- Delayed execution for critical changes
- Prevents immediate malicious updates

### Input Validation
- Zero address checks
- Amount > 0 checks
- Array length validation
- Bounds checking

---

## Gas Optimization

### Batch Operations
- BatchOperations contract reduces gas for multiple operations
- Single approval covers multiple transfers
- Reduces transaction overhead

### Efficient Data Structures
- Mappings for O(1) lookups
- Events for off-chain indexing
- Minimal storage usage

### Unchecked Blocks
- Safe arithmetic in unchecked blocks where appropriate
- Reduces gas for known-safe operations

---

## Events & Indexing

All contracts emit comprehensive events for:
- **Indexing**: Off-chain indexing of transactions
- **Monitoring**: Real-time monitoring of contract activity
- **Analytics**: Building analytics dashboards
- **Debugging**: Tracking contract execution

Key events include:
- Transfer events (ERC20/NFT)
- Action logging and verification
- Marketplace transactions
- Staking/unstaking
- Governance proposals and votes
- Retirement and expiration

---

## Upgradeability Notes

**Current State**: All contracts are non-upgradeable (implementation contracts).

**Future Considerations**:
- Consider upgradeable proxies for critical contracts
- Use OpenZeppelin Upgradeable contracts
- Implement upgrade governance via TimelockController
- Maintain backwards compatibility

---

## Testing Recommendations

1. **Unit Tests**: Test each function independently
2. **Integration Tests**: Test contract interactions
3. **Edge Cases**: Test boundary conditions and error cases
4. **Gas Tests**: Measure and optimize gas usage
5. **Security Audits**: Professional security audits recommended
6. **Formal Verification**: Consider formal verification for critical logic

---

## Deployment Order

1. AccessControl (needed by others)
2. CarbonCreditToken (needed by most contracts)
3. EcoBadgeNFT (needed by EcoLedgerV2)
4. EcoLedgerV2 (core contract)
5. CarbonCreditMarketplace
6. CreditStaking
7. CreditRetirement
8. CreditExpiration
9. Governance
10. Leaderboard (set in EcoLedgerV2 after deployment)
11. Analytics (set all contract addresses)
12. BatchOperations (set all contract addresses)
13. TimelockController (for governance)

---

## Contract Addresses

Contract addresses should be:
- Stored in deployment configuration
- Set in dependent contracts after deployment
- Documented for frontend integration
- Verified on block explorers

---

## Additional Resources

- **Solidity Version**: 0.8.28
- **License**: MIT
- **Standards**: ERC20, ERC721-compatible
- **Network**: Compatible with any EVM chain

---

**Last Updated**: 2024
**Version**: 1.0.0

