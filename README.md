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

#### Blockchain Layer
- **Solidity** `0.8.28` - Smart contract language
- **Hardhat** `^3.0.6` - Ethereum development environment
- **OpenZeppelin Contracts** - Secure, audited contract library
- **Ethers.js** `v6.15.0` - Ethereum library for blockchain interaction
- **Mocha & Chai** - Testing framework
- **Hardhat Ignition** - Deployment management

#### Backend (API Server)
- **Node.js** `18+` - JavaScript runtime
- **TypeScript** `5.8.0` - Type-safe JavaScript
- **Express.js** `4.21.2` - Web framework
- **PostgreSQL** - Relational database (Neon serverless)
- **Prisma ORM** `6.1.0` - Type-safe database client
- **JWT** `jsonwebtoken 9.0.2` - Authentication tokens
- **bcrypt** `6.0.0` - Password hashing
- **Helmet** `8.0.0` - Security headers
- **CORS** `2.8.5` - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Winston** `3.17.0` - Application logging

#### Frontend (Web Application)
- **React** `19.2.0` - UI library
- **TypeScript** `5.9.3` - Type-safe development
- **Vite** `7.2.4` - Fast build tool & dev server
- **React Router DOM** `7.9.6` - Client-side routing
- **TailwindCSS** `4.1.17` - Utility-first CSS framework
- **PostCSS** & **Autoprefixer** - CSS processing
- **Lucide React** `0.554.0` - Modern icon library
- **Recharts** `3.4.1` - Chart and data visualization
- **Framer Motion** `11.18.2` - Animation library
- **Ethers.js** `6.15.0` - Web3 integration
- **clsx** & **tailwind-merge** - Utility class management

#### Development & DevOps
- **tsx** `4.19.2` - TypeScript execution for Node.js
- **ESLint** `9.39.1` - Code linting
- **Vitest** `2.1.8` - Fast unit testing
- **Git** - Version control
- **npm** - Package management

#### Deployment & Hosting
- **Vercel** - Recommended for frontend & backend
- **Railway** / **Render** - Alternative backend hosting
- **Netlify** - Alternative frontend hosting
- **Neon** - Serverless PostgreSQL database
- **Infura** / **Alchemy** - Ethereum RPC providers
- **Etherscan** - Contract verification

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
cd ../frontend-react
npm install

# Contract addresses are auto-detected!
# No manual configuration needed

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 5. Quick Start (Alternative)

Use our automated setup script:

```bash
# Install all dependencies
bash scripts/setup.sh

# Start all services (follow the printed instructions)
bash scripts/start-dev.sh
```

---

## 👥 Role-Based Dashboards

The platform features distinct interfaces for different user roles:

### For Companies (COMPANY Role)
- **Dashboard**: Track carbon credits, badges, actions, and leaderboard ranking
- **Features**: Submit eco actions, trade credits on marketplace, stake for rewards, vote on proposals
- **Access**: Full platform access

### For Verifiers (VERIFIER Role)
- **Dashboard**: Pending verifications, approval statistics, verification rate
- **Features**: Review and approve/reject eco actions with multi-verifier consensus
- **Access**: Action verification, company directory, analytics

### For Auditors (AUDITOR Role)
- **Dashboard**: Audit statistics, flagged items, compliance metrics
- **Features**: Monitor platform activities, review actions for compliance
- **Access**: All actions, companies, governance, analytics

See `ROLE_BASED_UI.md` for detailed documentation.

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

### Automated Testing Suite

Run all tests across the platform:
```bash
bash scripts/test-all.sh
```

This runs:
- ✓ Blockchain contract tests
- ✓ Contract compilation validation
- ✓ Backend TypeScript build
- ✓ Backend type checking
- ✓ Frontend production build
- ✓ Frontend lint checks

### Individual Test Suites

**Smart Contracts**:
```bash
cd blockchain
npm test                    # All tests
npm run test:coverage       # With coverage
npm run test:token          # Token tests only
npm run test:ledger         # Ledger tests only
npm run test:integration    # Integration tests
```

**Backend**:
```bash
cd backend
npm run test
npm run test:coverage
```

**Frontend**:
```bash
cd frontend-react
npm run build              # Production build test
npm run lint               # Code quality check
```

---

## 🚢 Deployment

### Quick Deploy to Testnet (Sepolia)

**1. Deploy Smart Contracts**
```bash
cd blockchain
npm run deploy:sepolia:v3    # Deploys all contracts
npm run export:addresses     # Auto-exports addresses
```

**2. Initialize Platform**
```bash
# Grant verifier roles and set parameters
ACCESS_CONTROL_ADDRESS=0x... ECO_LEDGER_ADDRESS=0x... \
npx hardhat run scripts/initialize-platform.ts --network sepolia
```

**3. Deploy Backend** (Vercel example)
```bash
cd backend
vercel --prod
# Set environment variables in Vercel dashboard
```

**4. Deploy Frontend** (Vercel example)
```bash
cd frontend-react
vercel --prod
# Contract addresses auto-detected!
```

### Production Deployment Guide

For complete production deployment instructions, see:
- **`DEPLOYMENT_GUIDE.md`** - Step-by-step deployment guide
- **`SECURITY.md`** - Security checklist and best practices

⚠️ **Before mainnet deployment:**
- [ ] Complete professional security audit
- [ ] Test thoroughly on testnet (minimum 2 weeks)
- [ ] Review all contract parameters
- [ ] Implement multi-sig for admin functions
- [ ] Set up monitoring and alerts
- [ ] Document incident response procedures

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

## 🛠️ Utility Scripts

New helper scripts for development and deployment:

```bash
# Automated setup - installs all dependencies
bash scripts/setup.sh

# Development environment guide
bash scripts/start-dev.sh

# Comprehensive test suite
bash scripts/test-all.sh

# Platform initialization (after deployment)
ACCESS_CONTROL_ADDRESS=0x... ECO_LEDGER_ADDRESS=0x... \
npx hardhat run blockchain/scripts/initialize-platform.ts
```

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
- [ ] Contract upgradeability (proxy patterns)
- [ ] Insurance mechanisms for marketplace

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

## 🆘 Support & Documentation

- **Setup Guide**: See `scripts/setup.sh` for automated installation
- **Frontend**: See `frontend-react/README.md` for React app documentation
- **Backend**: See `backend/README.md` for API documentation  
- **Smart Contracts**: See `PROJECT_DOCUMENTATION.md` and `SMART_CONTRACTS_DOCUMENTATION.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md` for production deployment
- **Security**: See `SECURITY.md` for security features and best practices
- **Contributing**: See `CONTRIBUTING.md` for contribution guidelines
- **Role-Based UI**: See `ROLE_BASED_UI.md` for dashboard documentation

---

## 🌟 Acknowledgments

Built with ❤️ for a sustainable future.

- OpenZeppelin for secure smart contract libraries
- Hardhat for development tools
- SvelteKit for amazing frontend framework
- Neon for serverless PostgreSQL

---

**Version**: 2.1.0  
**Last Updated**: December 2024
