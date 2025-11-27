# 🌍 EcoCred: Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Smart Contracts - Detailed Explanation](#smart-contracts)
4. [Backend System](#backend-system)
5. [Frontend System](#frontend-system)
6. [Workflow & User Journeys](#workflow--user-journeys)
7. [Security Features](#security-features)
8. [Deployment](#deployment)

---

## Project Overview

**EcoCred** is a comprehensive blockchain-powered carbon credit rewards platform that brings transparency, accountability, and gamification to sustainability efforts. Companies log eco-friendly actions, earn tokenized carbon credits (ERC-20), unlock NFT badges (ERC-721), and participate in a vibrant ecosystem with marketplace, staking, governance, and analytics features.

### Key Features
- 🌱 **Tokenized Carbon Credits** (ERC-20)
- 🎖️ **Achievement NFT Badges** (ERC-721)
- ✅ **Multi-Verifier Approval System**
- 🏆 **Reputation & Leaderboard System**
- 🛒 **P2P Carbon Credit Marketplace**
- 💰 **Staking with Rewards**
- 🗳️ **DAO Governance**
- 📊 **Comprehensive Analytics**
- 🔐 **MetaMask & Email/Password Authentication**

### Tech Stack
- **Blockchain**: Solidity 0.8.28, Hardhat, Ethers.js v6
- **Backend**: Node.js, TypeScript, Express.js, PostgreSQL (Neon), Prisma ORM
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Smart Contracts**: 11 core contracts + utility contracts

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  • React Components                                          │
│  • Wallet Connection (MetaMask)                              │
│  • API Integration                                           │
│  • UI/UX Components                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│  • REST API Endpoints                                        │
│  • Authentication (JWT + Wallet)                             │
│  • Business Logic                                            │
│  • Database ORM (Prisma)                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Prisma ORM
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              DATABASE (PostgreSQL - Neon)                    │
│  • User Management                                           │
│  • Company Profiles                                          │
│  • Action Records                                            │
│  • Verification Records                                      │
│  • Reference Data (Industries, Guidelines, etc.)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN NETWORK (Ethereum)                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          SMART CONTRACTS (Solidity)                  │    │
│  │  • CarbonCreditToken (ERC-20)                        │    │
│  │  • EcoBadgeNFT (ERC-721)                             │    │
│  │  • EcoLedgerV2 (Action Logging & Verification)       │    │
│  │  • CarbonCreditMarketplace                           │    │
│  │  • CreditStaking                                     │    │
│  │  • Governance                                        │    │
│  │  • Leaderboard                                       │    │
│  │  • CreditRetirement                                  │    │
│  │  • CreditExpiration                                  │    │
│  │  • BatchOperations                                   │    │
│  │  • Analytics                                         │    │
│  │  • AccessControl (Role Management)                   │    │
│  │  • Utility Contracts (Pausable, ReentrancyGuard)    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts - Detailed Explanation

### Core Token Contracts

#### 1. **CarbonCreditToken.sol** (ERC-20 Token)
**Purpose**: Tokenized carbon credits representing verified eco-friendly actions.

**Key Features**:
- Standard ERC-20 token implementation
- Controlled minting (only authorized minter can mint)
- Burn functionality to permanently remove tokens
- Transfer and approval mechanisms

**Important Functions**:
- `mint(address to, uint256 amount)`: Only minter can create new credits
- `burn(uint256 amount)`: Users can burn their own tokens
- `burnFrom(address from, uint256 amount)`: Burn tokens from another address (requires allowance)
- `setMinter(address newMinter)`: Owner can change the minter address

**Use Cases**:
- Rewarding companies for verified eco-actions
- Trading on marketplace
- Staking for rewards
- Retirement/burning for offset claims

**Token Details**:
- Name: "Carbon Credit"
- Symbol: "CCT"
- Decimals: 18
- No maximum supply (minted on-demand based on verified actions)

---

#### 2. **EcoBadgeNFT.sol** (ERC-721 NFT)
**Purpose**: Non-fungible tokens representing achievement milestones for companies.

**Key Features**:
- ERC-721 compatible NFT implementation
- Base URI for metadata storage (IPFS or centralized)
- Owner enumeration (basic)
- Transfer and approval mechanisms

**Important Functions**:
- `safeMint(address to)`: Only owner (EcoLedger) can mint badges
- `tokenURI(uint256 id)`: Returns metadata URI for a token
- `setBaseURI(string base)`: Owner can update metadata base URI
- `transferFrom()`: Standard NFT transfer

**Badge System**:
- Minted automatically when companies reach credit milestones:
  - Bronze: 1,000 credits
  - Silver: 5,000 credits
  - Gold: 10,000 credits
  - Platinum: Higher tiers (configurable)

**Use Cases**:
- Proof of achievement
- Reputation display
- Collectible rewards
- On-chain verification of sustainability milestones

---

### Action Management Contracts

#### 3. **EcoLedgerV2.sol** (Core Action Ledger)
**Purpose**: Central contract for logging eco-actions, multi-verifier approval, and credit minting coordination.

**Key Features**:
- Action logging with metadata
- Multi-verifier approval system (threshold-based)
- Reputation system for companies
- Automatic badge minting on milestones
- Integration with all other contracts

**Important Structures**:
```solidity
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
    string category;
}

struct CompanyProfile {
    uint256 totalCreditsEarned;
    uint256 totalActions;
    uint256 verifiedActions;
    uint256 reputationScore; // 0-1000
    bool isVerified;
}
```

**Key Functions**:
- `logEcoAction(...)`: Companies log their eco-actions
- `verifyAction(uint256 actionId, bool approved, uint256 actualCredits)`: Verifiers approve/reject actions
- `getCompanyProfile(address)`: Retrieve company statistics
- `getAction(uint256)`: Retrieve action details

**Workflow**:
1. Company logs action → PENDING status
2. Verifiers review and verify → Verification count increases
3. When threshold reached → Action verified, credits minted, reputation updated
4. Badges minted automatically at milestones

**Reputation System**:
- Based on verified action ratio and total credits earned
- Score ranges from 0-1000
- Affects credit multipliers (reputation multiplier)
- Used for leaderboard rankings

**Multi-Verification**:
- Configurable verification threshold (default: 1)
- Each verifier can only verify once per action
- Prevents double verification
- Consensus-based approval

---

#### 4. **AccessControl.sol** (Role-Based Access Control)
**Purpose**: Manages roles and permissions across the platform.

**Roles**:
- `NONE`: No special permissions
- `ADMIN`: Full platform control
- `VERIFIER`: Can verify eco-actions
- `MODERATOR`: Can moderate content (future use)

**Key Functions**:
- `grantRole(address account, Role role)`: Owner grants roles
- `revokeRole(address account)`: Owner revokes roles
- `hasRole(address account, Role role)`: Check if account has role
- `transferOwnership(address newOwner)`: Transfer contract ownership

**Security**:
- Only owner can grant/revoke roles
- Owner cannot revoke their own admin role
- Ownership transfer resets roles appropriately

**Used By**:
- EcoLedgerV2 (for verifier checks)
- Governance (for admin checks)
- CreditRetirement (for verifier checks)
- CreditExpiration (for admin checks)

---

### Trading & Marketplace Contracts

#### 5. **CarbonCreditMarketplace.sol** (P2P Trading)
**Purpose**: Peer-to-peer marketplace for buying and selling carbon credits.

**Key Features**:
- Create listings with price per credit
- Purchase credits from listings
- Escrow mechanism (tokens held in contract until purchase)
- Fee system (configurable percentage)
- Reentrancy protection
- Pausable for emergencies

**Listing Structure**:
```solidity
struct Listing {
    address seller;
    uint256 amount;           // Credits for sale
    uint256 pricePerCredit;   // Price in wei per credit
    bool active;
    uint256 timestamp;
}
```

**Key Functions**:
- `createListing(uint256 amount, uint256 pricePerCredit)`: Create a new listing
- `purchase(uint256 listingId, uint256 amount)`: Buy credits from listing
- `cancelListing(uint256 listingId)`: Cancel and get tokens back
- `setFee(uint256 newFee)`: Update platform fee (max 10%)

**Workflow**:
1. Seller creates listing → Tokens escrowed in contract
2. Buyer sends ETH → Receives tokens, seller receives ETH minus fee
3. Listing automatically deactivates when sold out
4. Seller can cancel anytime (gets tokens back)

**Fee System**:
- Configurable fee percentage (basis points: 100 = 1%)
- Maximum fee: 10% (1000 basis points)
- Fees accumulate in contract (owner can withdraw)

**Security**:
- ReentrancyGuard prevents attack vectors
- Pausable for emergency stops
- Transfer validation before escrow

---

### Staking & Rewards Contracts

#### 6. **CreditStaking.sol** (Staking Mechanism)
**Purpose**: Allows companies to stake carbon credits for rewards.

**Key Features**:
- Lock credits for a period (days)
- Earn rewards based on staking duration
- Configurable reward rate
- Multiple stakes per user
- Automatic reward calculation

**Stake Structure**:
```solidity
struct Stake {
    uint256 amount;
    uint256 timestamp;
    uint256 lockPeriod;  // in seconds
    bool isLocked;
}
```

**Key Functions**:
- `stake(uint256 amount, uint256 lockPeriodInDays)`: Lock credits
- `unstake(uint256 stakeIndex)`: Unlock and claim rewards
- `calculateReward(Stake)`: View pending rewards
- `getTotalPendingRewards(address)`: Total rewards for user

**Reward System**:
- Configurable annual reward rate (max 50%)
- Rewards calculated: `(amount * rate * duration) / (365 days * 10000)`
- Rewards minted from token contract (requires minter role)
- No rewards if lock period not completed

**Use Cases**:
- Long-term commitment incentives
- Passive income for credit holders
- Platform liquidity locking

---

### Retirement & Expiration Contracts

#### 7. **CreditRetirement.sol** (Credit Retirement)
**Purpose**: Permanent retirement/burning of carbon credits for offset claims.

**Key Features**:
- Burn credits permanently
- Certificate generation for retirements
- Verification system for retirements
- Prevents duplicate certificate IDs
- Track retirement history

**Retirement Structure**:
```solidity
struct Retirement {
    address retirer;
    uint256 amount;
    string reason;
    string certificateId;
    uint256 timestamp;
    bool verified;
}
```

**Key Functions**:
- `retireCredits(uint256 amount, string reason, string certificateId)`: Retire credits
- `verifyRetirement(uint256 retirementId)`: Verifier confirms retirement
- `getRetirement(uint256)`: View retirement details
- `getUserRetirements(address)`: All retirements for a user

**Workflow**:
1. User retires credits → Credits burned, retirement record created
2. Verifier verifies retirement → Certificate issued
3. Certificate ID tracked to prevent duplicates

**Use Cases**:
- Carbon offset claims
- Regulatory compliance
- Corporate sustainability reporting
- Permanent carbon removal claims

---

#### 8. **CreditExpiration.sol** (Credit Expiration)
**Purpose**: Time-based expiration system to ensure credits remain valid.

**Key Features**:
- Configurable expiration period (default: 365 days)
- Grace period before expiration (default: 30 days)
- Batch expiration checking
- Automatic credit burning on expiration

**Credit Batch Structure**:
```solidity
struct CreditBatch {
    uint256 amount;
    uint256 mintTimestamp;
    uint256 expirationTimestamp;
    bool expired;
}
```

**Key Functions**:
- `markForExpiration(address holder, uint256 amount)`: Admin marks credits for expiration
- `checkAndExpire(address holder)`: Check and expire credits for a holder
- `batchCheckAndExpire(address[] holders)`: Batch expiration check
- `getExpirationStatus(address)`: View expiration status

**Expiration Logic**:
- Credits expire after: `mintTimestamp + expirationPeriod + gracePeriod`
- Expired credits are automatically burned
- Grace period allows users to use credits before expiration
- Prevents stale credits from circulating

**Use Cases**:
- Ensure credits represent recent actions
- Prevent long-term hoarding
- Maintain market freshness
- Regulatory compliance (time-bound credits)

---

### Governance & DAO Contracts

#### 9. **Governance.sol** (DAO Governance)
**Purpose**: Decentralized autonomous organization for platform governance.

**Key Features**:
- Proposal creation (token-weighted)
- Voting system (token-weighted)
- Quorum requirements
- Executable proposals
- Voting period management

**Proposal Structure**:
```solidity
struct Proposal {
    address proposer;
    string description;
    uint256 votesFor;
    uint256 votesAgainst;
    uint256 deadline;
    bool executed;
    bytes data;        // Calldata for execution
    address target;    // Target contract for execution
}
```

**Key Functions**:
- `createProposal(string description, address target, bytes data)`: Create proposal (requires 10,000+ tokens)
- `vote(uint256 proposalId, bool support)`: Cast vote (requires 1,000+ tokens)
- `executeProposal(uint256 proposalId)`: Execute passed proposal
- `getProposal(uint256)`: View proposal details

**Governance Rules**:
- Minimum tokens to propose: 10,000 CCT
- Minimum tokens to vote: 1,000 CCT
- Voting period: 7 days (configurable)
- Proposal passes if: `votesFor > votesAgainst` AND deadline passed
- Proposals can execute arbitrary contract calls

**Use Cases**:
- Platform parameter changes
- Fee adjustments
- Contract upgrades (via proxy)
- Treasury management
- Community decisions

---

### Analytics & Utility Contracts

#### 10. **Leaderboard.sol** (Ranking System)
**Purpose**: Track and rank companies based on carbon credits and reputation.

**Key Features**:
- Top companies ranking (top 100)
- Weighted scoring (credits + reputation)
- Automatic updates on verification
- Rank querying

**Leaderboard Entry Structure**:
```solidity
struct LeaderboardEntry {
    address company;
    uint256 totalCredits;
    uint256 reputationScore;
    uint256 rank;
}
```

**Key Functions**:
- `updateLeaderboard(address company)`: Called by EcoLedger on verification
- `getTopCompanies(uint256 limit)`: Get top N companies
- `getCompanyRank(address)`: Get specific company rank
- `setTopCount(uint256)`: Adjust leaderboard size

**Ranking Algorithm**:
- Score = `totalCredits + (reputationScore * 100)`
- Higher score = higher rank
- Rankings updated automatically on credit minting

**Use Cases**:
- Competitive rankings
- Reputation display
- Company discovery
- Gamification

---

#### 11. **BatchOperations.sol** (Gas Optimization)
**Purpose**: Gas-efficient batch operations for common actions.

**Key Features**:
- Batch token transfers
- Batch action logging
- Batch marketplace listings
- Batch staking operations

**Key Functions**:
- `batchTransfer(address[] recipients, uint256[] amounts)`: Send credits to multiple addresses
- `batchLogActions(...)`: Log multiple actions in one transaction
- `batchCreateListings(...)`: Create multiple marketplace listings
- `batchStake(...)`: Create multiple stakes
- `batchUnstake(uint256[] indices)`: Unstake multiple positions

**Gas Savings**:
- Reduces transaction overhead
- Single approval instead of multiple
- Batch size limits: 20-50 items per batch

**Use Cases**:
- Airdrops
- Bulk operations
- Gas optimization for power users
- Corporate bulk actions

---

#### 12. **Analytics.sol** (Platform Statistics)
**Purpose**: Aggregate statistics from all contracts for analytics.

**Key Features**:
- Platform-wide statistics
- Company-specific analytics
- Credit distribution tracking
- Action statistics

**Platform Stats Structure**:
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
```

**Company Analytics Structure**:
```solidity
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
- `getPlatformStats()`: Overall platform metrics
- `getCompanyAnalytics(address)`: Company-specific data
- `getCreditDistribution()`: Supply breakdown
- `getActionStats()`: Action statistics

**Use Cases**:
- Dashboard metrics
- Reporting
- Trend analysis
- Platform health monitoring

---

### Utility & Security Contracts

#### 13. **Pausable.sol** (Emergency Pause)
**Purpose**: Emergency pause functionality for critical operations.

**Key Features**:
- Pause/unpause contract operations
- Only owner can pause
- Modifier protection

**Key Functions**:
- `pause()`: Emergency stop
- `unpause()`: Resume operations
- `whenNotPaused` modifier: Protects functions

**Used By**:
- CarbonCreditMarketplace
- CreditStaking
- CreditExpiration
- CreditRetirement

---

#### 14. **ReentrancyGuard.sol** (Reentrancy Protection)
**Purpose**: Protection against reentrancy attacks.

**Key Features**:
- Simple reentrancy guard
- State-based protection
- Modifier-based

**Key Functions**:
- `nonReentrant` modifier: Prevents reentrant calls

**Used By**:
- CarbonCreditMarketplace
- CreditStaking
- CreditRetirement
- CreditExpiration

**Security**:
- Prevents recursive calls
- Critical for external calls
- Standard security practice

---

#### 15. **TimelockController.sol** (Time-Delayed Execution)
**Purpose**: Time-delayed execution for critical operations.

**Key Features**:
- Schedule operations for future execution
- Minimum delay requirement (1 hour - 30 days)
- Cancel before execution

**Operation Structure**:
```solidity
struct Operation {
    address target;
    bytes data;
    uint256 timestamp;  // Execution time
    bool executed;
    bool cancelled;
}
```

**Key Functions**:
- `schedule(address target, bytes data)`: Schedule operation
- `execute(uint256 operationId)`: Execute after delay
- `cancel(uint256 operationId)`: Cancel before execution
- `setMinDelay(uint256)`: Update minimum delay

**Use Cases**:
- Governance proposals
- Parameter changes
- Contract upgrades
- Security measure for critical operations

---

### Contract Relationships & Integration

```
AccessControl (Central RBAC)
    ├── EcoLedgerV2 (uses for VERIFIER role)
    ├── Governance (uses for ADMIN role)
    ├── CreditRetirement (uses for VERIFIER role)
    └── CreditExpiration (uses for ADMIN role)

CarbonCreditToken (ERC-20)
    ├── EcoLedgerV2 (mints credits)
    ├── CarbonCreditMarketplace (trades tokens)
    ├── CreditStaking (locks tokens)
    ├── CreditRetirement (burns tokens)
    ├── CreditExpiration (burns expired tokens)
    ├── BatchOperations (batch transfers)
    └── Governance (token-weighted voting)

EcoLedgerV2 (Core Action Ledger)
    ├── Mints CarbonCreditToken
    ├── Mints EcoBadgeNFT (milestones)
    ├── Updates Leaderboard
    ├── Uses AccessControl (verifier checks)
    └── Tracks company profiles

EcoBadgeNFT (ERC-721)
    └── Minted by EcoLedgerV2 (milestones)

CarbonCreditMarketplace
    ├── Uses CarbonCreditToken
    ├── Uses Pausable
    └── Uses ReentrancyGuard

CreditStaking
    ├── Uses CarbonCreditToken
    ├── Uses Pausable
    └── Uses ReentrancyGuard

CreditRetirement
    ├── Uses CarbonCreditToken
    ├── Uses AccessControl
    ├── Uses Pausable
    └── Uses ReentrancyGuard

CreditExpiration
    ├── Uses CarbonCreditToken
    ├── Uses AccessControl
    ├── Uses Pausable
    └── Uses ReentrancyGuard

BatchOperations
    ├── Uses CarbonCreditToken
    ├── Uses EcoLedgerV2
    ├── Uses CarbonCreditMarketplace
    └── Uses CreditStaking

Analytics
    ├── Reads from EcoLedgerV2
    ├── Reads from CarbonCreditToken
    ├── Reads from CarbonCreditMarketplace
    ├── Reads from CreditStaking
    └── Reads from CreditRetirement

Governance
    ├── Uses CarbonCreditToken (voting power)
    └── Uses AccessControl (admin checks)

Leaderboard
    └── Reads from EcoLedgerV2 (company profiles)

TimelockController
    └── Uses AccessControl (admin checks)
```

---

## Backend System

### Architecture

The backend is a RESTful API built with Express.js and TypeScript, serving as the bridge between the frontend and blockchain, while maintaining off-chain data in PostgreSQL.

### Database Schema (Prisma)

**Key Models**:

1. **User**
   - Authentication (email/password, wallet address)
   - Role (COMPANY, VERIFIER, ADMIN, AUDITOR)
   - Company linkage (optional)

2. **Company**
   - Wallet address (unique)
   - Profile information (name, description, industry)
   - Verification status
   - Relations to actions, verifications, listings, stakes, votes

3. **Action**
   - Eco-action records
   - Company linkage
   - Status (PENDING, VERIFIED, REJECTED, PROCESSING)
   - Blockchain references (txHash, blockNumber, blockchainActionId)

4. **Verification**
   - Verifier approval/rejection records
   - Comments
   - Blockchain transaction references

5. **Reference Data Tables**:
   - Industry
   - QuickAction
   - Guideline
   - Faq
   - PlatformSetting

### API Endpoints

**Authentication** (`/api/auth`)
- `GET /nonce/:walletAddress` - Get signing nonce
- `POST /verify` - Verify signature & get JWT
- `POST /login` - Email/password login
- `POST /register` - Register new user

**Actions** (`/api/actions`)
- `GET /actions` - List actions (filtered by role)
- `POST /actions` - Submit new action
- `GET /actions/:id` - Get action details
- `POST /actions/:id/verify` - Verify action (verifier)
- `PATCH /actions/:id/blockchain` - Update blockchain references

**Companies** (`/api/companies`)
- `GET /companies` - List companies
- `POST /companies` - Register company
- `GET /companies/:id` - Get company details
- `PUT /companies/:id` - Update company profile

**Marketplace** (`/api/marketplace`)
- `GET /marketplace/listings` - Browse listings
- `POST /marketplace/listings` - Create listing

**Staking** (`/api/staking`)
- `GET /staking/stakes/my` - User's stakes
- `POST /staking/stakes` - Create stake

**Governance** (`/api/governance`)
- `GET /governance/proposals` - List proposals
- `POST /governance/proposals` - Create proposal

**Analytics** (`/api/analytics`)
- `GET /analytics/overview` - Platform stats
- `GET /analytics/trends` - Historical data

**Reference Data** (`/api/reference`)
- `GET /industries` - List industries
- `GET /quick-actions` - Get quick actions by audience
- `GET /guidelines` - Get guidelines
- `GET /faqs` - Get FAQs
- `GET /settings` - Platform settings

### Authentication Flow

1. **Wallet Login**:
   - Frontend requests nonce
   - User signs message with MetaMask
   - Backend verifies signature
   - JWT token issued

2. **Email/Password Login**:
   - User submits credentials
   - Backend validates password
   - JWT token issued
   - Wallet address optional (can link later)

### Role-Based Access Control

- **COMPANY**: Can log actions, view own data, trade credits
- **VERIFIER**: Can verify actions, view pending actions
- **ADMIN**: Full platform access
- **AUDITOR**: Read-only access to all data

---

## Frontend System

### Architecture

Built with React + TypeScript, Vite for bundling, and TailwindCSS for styling.

### Key Components

**Context Providers**:
- `WalletContext` - MetaMask connection management
- `UserContext` - Authentication state
- `NotificationContext` - Toast notifications
- `ThemeContext` - Dark mode support

**Pages**:
- `Home` - Landing page
- `Login` - Authentication (wallet + email/password)
- `Register` - User registration
- `Actions` - Action logging and viewing
- `Companies` - Company directory
- `Analytics` - Platform statistics
- `Marketplace` - Credit trading
- `Staking` - Staking interface
- `Governance` - DAO proposals
- `Leaderboard` - Company rankings
- `Badges` - NFT badge display
- `Profile` - User/company profile

**Dashboards** (Role-Specific):
- `CompanyDashboard` - Company stats and quick actions
- `VerifierDashboard` - Pending actions for verification
- `AuditorDashboard` - Read-only analytics
- `AdminDashboard` - Platform management

### Blockchain Integration

**Service Layer** (`lib/services/blockchain.ts`):
- Ethers.js v6 integration
- Contract instance creation
- Transaction handling
- Event parsing
- Error handling

**Hook** (`hooks/useBlockchain.ts`):
- React hook for blockchain operations
- Loading states
- Notification integration
- Transaction tracking

**Contract Addresses** (`lib/config/contract-addresses.ts`):
- Auto-imported from deployment artifacts
- Type-safe contract references

---

## Workflow & User Journeys

### 1. Company Journey: Logging an Eco Action

```
1. Company connects wallet OR logs in with email/password
   ↓
2. Navigates to Actions page
   ↓
3. Clicks "Log Eco Action"
   ↓
4. Fills form:
   - Action type (dropdown from database)
   - Description
   - Quantity & Unit
   - Estimated credits calculated automatically
   ↓
5. Submits action → Saved to database (status: PENDING)
   ↓
6. Verifier reviews action (in Verifier Dashboard)
   ↓
7. Verifier approves → Backend API call
   ↓
8. Backend creates verification record
   ↓
9. Frontend executes blockchain:
   a. logEcoAction() → Creates blockchain action
   b. verifyAction() → Verifies on-chain
   ↓
10. EcoLedgerV2:
    - Checks verification threshold
    - If reached: Mints credits, updates reputation, mints badges
    - Updates leaderboard
    ↓
11. Frontend updates action with blockchain references
    ↓
12. Company sees verified action and credits in wallet
```

### 2. Verifier Journey: Verifying Actions

```
1. Verifier logs in (email/password or wallet)
   ↓
2. Navigates to Verifier Dashboard
   ↓
3. Sees list of pending actions:
   - Company name
   - Action description
   - Estimated credits
   - Action details
   ↓
4. Clicks "Review" on an action
   ↓
5. Verification Modal opens:
   - Approve/Reject buttons
   - Optional comments field
   ↓
6. Verifier selects "Approve" and adds comments
   ↓
7. Clicks "Confirm Approval"
   ↓
8. Backend:
   - Creates verification record
   - Calculates credits based on action type
   - Updates action status to VERIFIED
   ↓
9. Frontend:
   - Logs action on blockchain (if not already logged)
   - Verifies action on blockchain
   - Waits for transaction confirmation
   ↓
10. Credits minted to company
    ↓
11. Action marked as verified, credits visible
```

### 3. Marketplace Journey: Trading Credits

```
1. Company has verified credits in wallet
   ↓
2. Navigates to Marketplace page
   ↓
3. Clicks "List Credits"
   ↓
4. Enters:
   - Amount to list
   - Price per credit (in ETH)
   ↓
5. Approves token spending (if first time)
   ↓
6. Creates listing → Tokens escrowed in marketplace contract
   ↓
7. Buyer browses listings
   ↓
8. Buyer clicks "Purchase"
   ↓
9. Sends ETH (price * amount)
   ↓
10. Marketplace:
    - Transfers credits to buyer
    - Transfers ETH to seller (minus fee)
    - Updates listing status
    ↓
11. Transaction complete, credits in buyer's wallet
```

### 4. Staking Journey: Earning Rewards

```
1. Company has credits in wallet
   ↓
2. Navigates to Staking page
   ↓
3. Enters:
   - Amount to stake
   - Lock period (days)
   ↓
4. Approves token spending
   ↓
5. Stakes credits → Locked in staking contract
   ↓
6. Waits for lock period to complete
   ↓
7. Unstakes → Receives:
   - Original staked amount
   - Calculated rewards (minted)
   ↓
8. Rewards automatically calculated based on:
   - Staked amount
   - Lock period
   - Annual reward rate
```

### 5. Governance Journey: DAO Proposals

```
1. Token holder (10,000+ CCT) creates proposal
   ↓
2. Proposal includes:
   - Description
   - Target contract address
   - Calldata for execution
   ↓
3. Voting period begins (7 days)
   ↓
4. Token holders (1,000+ CCT) vote:
   - For or Against
   - Voting power = token balance
   ↓
5. Voting period ends
   ↓
6. Anyone can execute if:
   - votesFor > votesAgainst
   - Deadline passed
   ↓
7. Proposal executed → Target contract called with calldata
```

---

## Security Features

### Smart Contract Security

1. **Access Control**:
   - Role-based permissions (AccessControl.sol)
   - Modifier-based restrictions
   - Owner-only functions

2. **Reentrancy Protection**:
   - ReentrancyGuard on all external call functions
   - Checks-Effects-Interactions pattern

3. **Integer Overflow Protection**:
   - Solidity 0.8.28 automatic overflow checks
   - Safe arithmetic operations

4. **Input Validation**:
   - Require statements on all inputs
   - Zero address checks
   - Amount validation

5. **Pausable Mechanism**:
   - Emergency pause for critical contracts
   - Owner can pause/unpause

6. **Timelock Controller**:
   - Delayed execution for critical operations
   - Prevents immediate changes

### Backend Security

1. **Authentication**:
   - JWT tokens for API access
   - MetaMask signature verification
   - Password hashing (bcrypt)

2. **Authorization**:
   - Role-based access control
   - Endpoint-level permission checks

3. **Input Validation**:
   - Express validator middleware
   - Sanitization of user inputs

4. **Error Handling**:
   - Centralized error handler
   - No sensitive data in errors

### Frontend Security

1. **Wallet Security**:
   - MetaMask integration (user controls keys)
   - No private key storage

2. **API Security**:
   - JWT tokens stored securely
   - Automatic token refresh

3. **Input Validation**:
   - Client-side validation
   - Server-side validation (backup)

---

## Deployment

### Local Development

1. **Start Hardhat Node**:
   ```bash
   cd blockchain
   npm run node
   ```

2. **Deploy Contracts**:
   ```bash
   npm run deploy
   ```

3. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend**:
   ```bash
   cd frontend-react
   npm run dev
   ```

### Production Deployment

1. **Smart Contracts**:
   - Deploy to testnet (Sepolia) first
   - Verify contracts on Etherscan
   - Deploy to mainnet after audit

2. **Backend**:
   - Deploy to cloud provider (Vercel, Railway, etc.)
   - Set environment variables
   - Run database migrations

3. **Frontend**:
   - Build production bundle
   - Deploy to CDN (Vercel, Netlify, etc.)
   - Configure environment variables

### Contract Addresses

Contract addresses are automatically exported from deployment artifacts and imported into the frontend, eliminating manual configuration.

---

## Conclusion

EcoCred is a comprehensive, production-ready blockchain platform for carbon credit management with:

- **11 Core Smart Contracts** covering all aspects of carbon credit lifecycle
- **Full-Stack Application** with React frontend and Express.js backend
- **Database-Driven** reference data and off-chain records
- **Secure & Scalable** architecture with role-based access control
- **User-Friendly** interfaces for all stakeholders

The platform enables transparent, verifiable, and gamified sustainability tracking while maintaining the security and decentralization benefits of blockchain technology.

---

**Version**: 2.0.0  
**Last Updated**: November 2024  
**Solidity Version**: 0.8.28  
**Network**: Ethereum (Hardhat Local / Sepolia Testnet)
