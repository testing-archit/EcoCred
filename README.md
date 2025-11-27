# 🌍 EcoCred: Decentralized Carbon Credit Rewards Platform

A comprehensive blockchain-powered platform that brings **transparency, accountability, and gamification** to sustainability efforts. Companies log eco-friendly actions, earn tokenized carbon credits (ERC-20), unlock NFT badges (ERC-721), and participate in a vibrant ecosystem with marketplace, staking, and governance features.

![Version](https://img.shields.io/badge/version-2.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Blockchain](https://img.shields.io/badge/blockchain-Ethereum-purple)

---

## ✨ Features

### Core Features
- 🌱 **Carbon Credits (ERC-20)** - Tokenized proof of eco-friendly actions
- 🎖️ **EcoBadge NFTs (ERC-721)** - Milestone rewards (Bronze, Silver, Gold, Platinum)
- 📊 **Interactive Dashboard** - Real-time tracking with charts and analytics
- 🌍 **Public Transparency** - Verifiable on-chain records to combat greenwashing
- 🏆 **Gamification** - Leaderboard system driving healthy competition

### Advanced Features
- 🛒 **Marketplace** - P2P carbon credit trading
- 💰 **Staking** - Lock credits for rewards
- 🗳️ **Governance** - DAO-style voting on proposals
- 📈 **Analytics** - Comprehensive platform and company statistics
- 🔐 **MetaMask Auth** - Signature-based wallet authentication

---

## 🏗️ Architecture

### Tech Stack

**Blockchain**
- Solidity 0.8.28
- Hardhat development environment
- OpenZeppelin contracts
- Ethers.js v6

**Backend API**
- Node.js + TypeScript
- Express.js REST API
- PostgreSQL (Neon) database
- Prisma ORM
- JWT + MetaMask signature auth

**Frontend**
- SvelteKit 5.0
- TypeScript
- TailwindCSS with dark mode
- Lucide icons
- Recharts for data visualization

### Smart Contracts

1. **CarbonCreditToken.sol** - ERC-20 carbon credits
2. **EcoBadgeNFT.sol** - ERC-721 milestone NFTs
3. **EcoLedgerV2.sol** - Enhanced action logging with multi-verification
4. **AccessControl.sol** - Role-based permissions
5. **CarbonCreditMarketplace.sol** - P2P trading platform
6. **CreditStaking.sol** - Staking with rewards
7. **Governance.sol** - DAO voting system
8. **Leaderboard.sol** - Company rankings

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (or use provided Neon database)
- MetaMask browser extension

### 1. Clone Repository

```bash
git clone <repository-url>
cd EcoCred
```

### 2. Setup Blockchain

```bash
cd blockchain
npm install

# Start local Hardhat node
npm run node

# In another terminal, deploy contracts
npm run deploy

# Get deployed contract addresses
npm run get-addresses
```

### 3. Setup Backend

```bash
cd ../backend
npm install

# Database is already configured with Neon PostgreSQL
# Initialize database
npm run db:generate
npm run db:push

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3001`

### 4. Setup Frontend

```bash
cd ../frontend
npm install

# Update contract addresses in .env.local
# VITE_CONTRACT_ADDRESS_CARBON=<address>
# VITE_CONTRACT_ADDRESS_BADGE=<address>
# VITE_CONTRACT_ADDRESS_LEDGER=<address>

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📖 How It Works

### For Companies

1. **Connect Wallet** → MetaMask authentication
2. **Register Profile** → Create company profile
3. **Log Eco Action** → Submit sustainability initiatives
4. **Verification** → Multi-verifier approval process
5. **Earn Credits** → Receive ERC-20 carbon credits
6. **Unlock Badges** → NFT milestones at credit thresholds
7. **Trade Credits** → List on marketplace or stake for rewards
8. **Participate** → Vote on governance proposals

### For Verifiers

1. **Review Actions** → Examine submitted eco actions
2. **Verify/Reject** → Approve or deny with comments
3. **Multi-Verification** → Threshold-based consensus

### For Platform

- **Transparent Records** → All actions recorded on-chain
- **Reputation System** → Companies build trust scores
- **Analytics** → Track platform growth and impact
- **Governance** → Community-driven decision making

---

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
BLOCKCHAIN_RPC_URL=http://localhost:8545
# Contract addresses are auto-detected - no need to set them manually!
```

**Frontend** - No `.env` files needed!
- Contract addresses are automatically detected from deployment artifacts
- See `DEPLOYMENT_AUTO.md` for details

---

## 📚 API Documentation

### Authentication
- `GET /api/auth/nonce/:walletAddress` - Get signing nonce
- `POST /api/auth/verify` - Verify signature & get JWT

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Register company
- `PUT /api/companies/:id` - Update profile
- `GET /api/companies/:id/actions` - Action history

### Actions
- `GET /api/actions` - List all actions
- `POST /api/actions` - Submit action
- `POST /api/actions/:id/verify` - Verify action

### Analytics
- `GET /api/analytics/overview` - Platform stats
- `GET /api/analytics/trends` - Historical data

### Marketplace
- `GET /api/marketplace/listings` - Browse listings
- `POST /api/marketplace/listings` - Create listing

### Staking
- `GET /api/staking/stakes/my` - User's stakes
- `POST /api/staking/stakes` - Create stake

### Governance
- `GET /api/governance/votes` - All votes
- `POST /api/governance/votes` - Cast vote

Full API documentation: See `backend/README.md`

---

## 🧪 Testing

### Smart Contracts
```bash
cd blockchain
npm run test
```

### Backend
```bash
cd backend
npm run test
```

### Frontend
```bash
cd frontend
npm run check
```

---

## 🚢 Deployment

### Testnet Deployment (Sepolia)

1. **Deploy Contracts**
```bash
cd blockchain
npm run deploy:sepolia
npm run export:addresses  # Auto-export addresses
```

Contract addresses are automatically detected - no manual configuration needed!

3. **Deploy Backend**
- Use Vercel, Railway, or any Node.js hosting
- Set environment variables
- Run database migrations

4. **Deploy Frontend**
- Use Vercel, Netlify, or similar
- Set environment variables
- Build and deploy

### Mainnet Deployment

⚠️ **Before mainnet deployment:**
- Complete security audit
- Test thoroughly on testnet
- Review all contract parameters
- Implement multi-sig for admin functions
- Set up monitoring and alerts

---

## 🔒 Security

- ✅ Role-based access control
- ✅ Input validation on all endpoints
- ✅ JWT token authentication
- ✅ MetaMask signature verification
- ✅ Solidity 0.8.28 (overflow protection)
- ⚠️ Recommended: Add reentrancy guards
- ⚠️ Recommended: Implement pausable mechanism
- ⚠️ Recommended: Professional security audit before mainnet

---

## 📊 Database Schema

The PostgreSQL database includes:
- **Company** - Extended profiles with metadata
- **Action** - Eco actions with verification status
- **Document** - Supporting documents for actions
- **Verification** - Verification records
- **Listing** - Marketplace listings
- **Stake** - Staking records
- **Vote** - Governance votes
- **Analytics** - Platform snapshots

See `backend/src/database/schema.prisma` for full schema.

---

## 🎨 Frontend Features

- **Dark Mode** - System preference detection + manual toggle
- **Responsive Design** - Mobile-first approach
- **Toast Notifications** - Real-time feedback
- **State Management** - Svelte stores for wallet, user, theme
- **API Integration** - Comprehensive service layer
- **Modern UI** - Glassmorphism, animations, gradients

---

## 📈 Roadmap

- [ ] Email notifications for verifications
- [ ] Mobile app (React Native)
- [ ] Oracle integration for automated verification
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Carbon offset marketplace integration
- [ ] Corporate dashboard with team management
- [ ] API webhooks for integrations
- [ ] Advanced analytics and reporting

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

- **Documentation**: See individual README files in `blockchain/`, `backend/`, and `frontend/`
- **Smart Contracts**: See `blockchain/CONTRACTS_SUMMARY.md`
- **Deployment**: See `blockchain/DEPLOYMENT_GUIDE.md`

---

## 🌟 Acknowledgments

Built with ❤️ for a sustainable future.

- OpenZeppelin for secure smart contract libraries
- Hardhat for development tools
- SvelteKit for amazing frontend framework
- Neon for serverless PostgreSQL

---

**Version**: 2.0.0  
**Last Updated**: November 2024
