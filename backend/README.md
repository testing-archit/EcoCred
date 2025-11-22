# EcoCred Backend API

Backend API server for the EcoCred carbon credit platform. Provides REST endpoints for company management, eco action tracking, marketplace, staking, and governance.

## Features

- 🔐 **MetaMask Authentication** - Signature-based wallet authentication with JWT
- 🏢 **Company Management** - Profile creation and management
- 🌱 **Action Tracking** - Submit and verify eco-friendly actions
- 📊 **Analytics** - Platform statistics and trends
- 🛒 **Marketplace** - List and trade carbon credits
- 💰 **Staking** - Stake credits for rewards
- 🗳️ **Governance** - Vote on proposals
- 🔗 **Blockchain Integration** - Smart contract interaction and event listening

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT + MetaMask signatures
- **Blockchain**: Ethers.js

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

The database is already configured with Neon PostgreSQL. Contract addresses will be added after deployment.

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `GET /api/auth/nonce/:walletAddress` - Get nonce for signing
- `POST /api/auth/verify` - Verify signature and get JWT token

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Register company (authenticated)
- `PUT /api/companies/:id` - Update company profile (authenticated)
- `GET /api/companies/:id/actions` - Get company action history

### Actions
- `GET /api/actions` - List all actions
- `GET /api/actions/:id` - Get action details
- `POST /api/actions` - Submit new action (authenticated)
- `POST /api/actions/:id/verify` - Verify action (verifier)
- `POST /api/actions/:id/documents` - Upload documents (authenticated)

### Analytics
- `GET /api/analytics/overview` - Platform statistics
- `GET /api/analytics/companies/:id` - Company analytics
- `GET /api/analytics/trends` - Historical trends
- `GET /api/analytics/action-types` - Action type distribution

### Marketplace
- `GET /api/marketplace/listings` - Get all listings
- `GET /api/marketplace/listings/:id` - Get listing details
- `POST /api/marketplace/listings` - Create listing (authenticated)
- `PUT /api/marketplace/listings/:id/cancel` - Cancel listing (authenticated)

### Staking
- `GET /api/staking/stakes` - Get all stakes
- `GET /api/staking/stakes/my` - Get user's stakes (authenticated)
- `POST /api/staking/stakes` - Create stake (authenticated)
- `PUT /api/staking/stakes/:id/claim` - Claim rewards (authenticated)

### Governance
- `GET /api/governance/votes` - Get all votes
- `GET /api/governance/votes/my` - Get user's votes (authenticated)
- `POST /api/governance/votes` - Cast vote (authenticated)
- `GET /api/governance/proposals/:id/results` - Get proposal results

## Database Schema

The Prisma schema includes:
- **Company** - Extended company profiles
- **Action** - Eco actions with verification
- **Document** - Supporting documents
- **Verification** - Verification records
- **Listing** - Marketplace listings
- **Stake** - Staking records
- **Vote** - Governance votes
- **Analytics** - Platform snapshots

## Authentication Flow

1. Frontend requests nonce: `GET /api/auth/nonce/:walletAddress`
2. User signs message with MetaMask
3. Frontend sends signature: `POST /api/auth/verify`
4. Backend verifies signature and returns JWT token
5. Include token in subsequent requests: `Authorization: Bearer <token>`

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start production
npm start

# Database management
npm run db:studio  # Open Prisma Studio
npm run db:migrate # Run migrations
```

## Production Deployment

1. Set environment variables
2. Run database migrations
3. Build the application
4. Start with process manager (PM2, Docker, etc.)

## Security

- JWT tokens expire after 7 days
- All routes validate input with express-validator
- Helmet.js for security headers
- CORS configured for frontend origin
- Signature verification for authentication
