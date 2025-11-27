# EcoCred Blockchain Contracts

A comprehensive blockchain-based carbon credit reward system with advanced features including marketplace, staking, governance, and reputation systems.

## 📋 Contracts Overview

### Core Contracts

1. **CarbonCreditToken.sol** - ERC20-compatible token for carbon credits
   - Controlled minting by authorized minter (EcoLedger)
   - Standard transfer and approval functionality
   - 18 decimals precision

2. **EcoBadgeNFT.sol** - ERC721-compatible NFT for milestone badges
   - Minted when companies reach credit milestones
   - Base URI for metadata
   - Token enumeration support

3. **EcoLedger.sol** - Basic ledger for logging and verifying eco actions
   - Companies log eco-friendly actions
   - Admin verification and credit minting
   - Badge rewards at milestones

4. **EcoLedgerV2.sol** - Enhanced ledger with advanced features
   - Multi-verifier system (requires threshold of verifiers)
   - Company reputation scoring
   - Action categories
   - Reputation-based credit multipliers

### Advanced Contracts

5. **CarbonCreditMarketplace.sol** - P2P marketplace for trading credits
   - Create listings for credit sales
   - Purchase credits with ETH
   - Configurable marketplace fees
   - Escrow functionality

6. **CreditStaking.sol** - Staking mechanism with rewards
   - Lock credits for specified periods
   - Earn rewards based on lock duration
   - Configurable reward rates
   - Multiple stake positions per user

7. **AccessControl.sol** - Role-based access control
   - Roles: ADMIN, VERIFIER, MODERATOR
   - Grant/revoke role functionality
   - Ownership transfer

8. **Governance.sol** - DAO-style governance
   - Create proposals
   - Vote with carbon credits
   - Execute proposals based on voting results
   - Configurable quorum and proposal thresholds

9. **Leaderboard.sol** - Ranking system for companies
   - Tracks top companies by credits and reputation
   - Updates automatically via ledger events
   - Query top N companies

### Security & Utility Contracts

10. **ReentrancyGuard.sol** - Protection against reentrancy attacks
    - Simple reentrancy guard implementation
    - Used by marketplace, staking, and other contracts

11. **Pausable.sol** - Emergency pause functionality
    - Allows owner to pause contract operations
    - Critical for emergency situations

12. **TimelockController.sol** - Time-delayed execution for critical operations
    - Adds delay before executing critical operations
    - Enhances security for admin functions

### Enhanced Features (V3)

13. **CreditRetirement.sol** - Carbon credit retirement and burning mechanism
    - Permanently retire/burn carbon credits to offset emissions
    - Certificate-based retirement tracking
    - Verifier approval system
    - Prevents duplicate certificate usage

14. **CreditExpiration.sol** - Credit expiration and decay mechanism
    - Time-based credit expiration
    - Grace period for expired credits
    - Automatic expiration checking
    - Batch expiration processing

15. **BatchOperations.sol** - Gas-efficient batch operations
    - Batch transfers to multiple addresses
    - Batch action logging
    - Batch marketplace listings
    - Batch staking/unstaking

16. **Analytics.sol** - Comprehensive platform analytics
    - Platform-wide statistics
    - Company-specific analytics
    - Credit distribution tracking
    - Action statistics

## 🚀 Deployment

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npm run compile
   ```

3. **Run tests:**
   ```bash
   npm run test
   ```

4. **Deploy to local network:**
   ```bash
   npm run deploy:hardhat        # V2 deployment
   npm run deploy:hardhat:v3     # V3 deployment (recommended)
   ```

5. **Deploy to Sepolia testnet:**
   ```bash
   npm run deploy:sepolia        # V2 deployment
   npm run deploy:sepolia:v3     # V3 deployment (recommended)
   ```

### Deployment Modules

- **EcoSystem.ts** - Basic deployment (original contracts)
- **EcoSystemV2.ts** - Full deployment with all advanced contracts
- **EcoSystemV3.ts** - Enhanced deployment with security features and new contracts (recommended)

### Configuration

Set environment variables for deployment:

```bash
export SEPOLIA_RPC_URL="your_rpc_url"
export SEPOLIA_PRIVATE_KEY="your_private_key"
```

Or use Hardhat config variables (recommended).

## 📜 Scripts

### Utility Scripts

1. **verify-action.ts** - Verify an eco action
   ```bash
   npx hardhat run scripts/verify-action.ts --network <network> <ledger_address> <action_id> [approved] [credits]
   ```

2. **create-listing.ts** - Create marketplace listing
   ```bash
   npx hardhat run scripts/create-listing.ts --network <network> <marketplace_address> <token_address> [amount] [price_per_credit]
   ```

3. **stake-credits.ts** - Stake carbon credits
   ```bash
   npx hardhat run scripts/stake-credits.ts --network <network> <staking_address> <token_address> [amount] [lock_days]
   ```

4. **grant-role.ts** - Grant roles in AccessControl
   ```bash
   npx hardhat run scripts/grant-role.ts --network <network> <access_control_address> <target_address> <role>
   ```

5. **retire-credits.ts** - Retire/burn carbon credits
   ```bash
   npx hardhat run scripts/retire-credits.ts --network <network> <retirement_address> [amount] [reason] [certificate_id]
   ```

6. **batch-transfer.ts** - Batch transfer credits to multiple addresses
   ```bash
   npx hardhat run scripts/batch-transfer.ts --network <network> <batch_ops_address> <recipient1> <recipient2> ... [amount1] [amount2] ...
   ```

7. **check-expiration.ts** - Check and expire credits
   ```bash
   npx hardhat run scripts/check-expiration.ts --network <network> <expiration_address> <holder_address>
   ```

8. **get-analytics.ts** - Get platform and company analytics
   ```bash
   npx hardhat run scripts/get-analytics.ts --network <network> <analytics_address> [company_address]
   ```

## 🧪 Testing

Comprehensive test suites are available for all contracts:

- `CarbonCreditToken.test.ts` - Token functionality tests
- `EcoBadgeNFT.test.ts` - NFT functionality tests
- `EcoLedger.test.ts` - Ledger functionality tests

Run all tests:
```bash
npm run test
```

## 🏗️ Architecture

### Contract Interactions

```
AccessControl
    ↓
EcoLedgerV2 ←→ CarbonCreditToken
    ↓              ↓
Leaderboard    Marketplace
    ↓              ↓
Governance     CreditStaking
```

### Key Features

1. **Multi-Verification**: Actions require multiple verifiers to reach consensus
2. **Reputation System**: Companies earn reputation based on verified actions
3. **Marketplace**: Trade carbon credits peer-to-peer (with reentrancy protection and pause)
4. **Staking**: Lock credits to earn rewards (with reentrancy protection and pause)
5. **Governance**: DAO-style decision making
6. **Leaderboard**: Competitive ranking system
7. **Credit Retirement**: Permanently burn credits to offset emissions
8. **Credit Expiration**: Time-based credit validity with grace periods
9. **Batch Operations**: Gas-efficient batch transfers and actions
10. **Analytics**: Comprehensive platform and company statistics
11. **Timelock**: Delayed execution for critical operations
12. **Enhanced Security**: Reentrancy guards and pause functionality throughout

## 🔒 Security Considerations

- All contracts use Solidity 0.8.28 (latest stable)
- **Reentrancy guards** implemented in marketplace, staking, retirement, and expiration contracts
- **Pausable functionality** for emergency stops in marketplace and staking
- **Timelock controller** for critical operations
- Access control enforced via modifiers
- Input validation on all public functions
- Safe math via Solidity 0.8+ built-in checks
- Burn functionality for permanent credit removal

## 📝 Notes

- Marketplace fees default to 2.5% (250 basis points)
- Staking reward rate default to 5% per year (500 basis points)
- Verification threshold defaults to 2 verifiers
- Governance voting period defaults to 7 days
- Credit expiration period defaults to 1 year
- Grace period for expired credits defaults to 30 days
- Timelock delay defaults to 2 days
- Batch operations limited to 50 transfers, 20 actions, 10 listings/stakes per transaction

## 🔄 Upgrade Path

The contracts are designed to be upgradeable patterns:
- Consider using proxy patterns for production
- State migration scripts for major upgrades
- EcoLedgerV2 can coexist with EcoLedger for gradual migration

## 📚 Documentation

Each contract includes NatSpec documentation. Generate documentation:

```bash
hardhat docgen
```

## 🤝 Contributing

When adding new contracts:
1. Add comprehensive tests
2. Update deployment scripts
3. Add utility scripts for interaction
4. Update this README

## 📄 License

MIT License - See individual contract headers
