# EcoCred Production Deployment Guide

This guide walks you through deploying the EcoCred platform to production environments.

## Overview

EcoCred consists of three main components:
1. **Smart Contracts** - Deployed to Ethereum blockchain
2. **Backend API** - Node.js/Express server
3. **Frontend Application** - React SPA

## Pre-Deployment Checklist

### Security Review
- [ ] Complete security audit of smart contracts
- [ ] Review and update all environment variables
- [ ] Generate strong, unique JWT_SECRET
- [ ] Review CORS settings for production domains
- [ ] Enable rate limiting on API endpoints
- [ ] Review database security settings
- [ ] Set up monitoring and alerting
- [ ] Document incident response procedures

### Testing
- [ ] All unit tests passing (`bash scripts/test-all.sh`)
- [ ] Integration tests validated
- [ ] Manual testing on testnet completed
- [ ] Load testing performed
- [ ] Security scanning completed (`npm audit`)

### Infrastructure
- [ ] Production database provisioned (PostgreSQL)
- [ ] Blockchain RPC provider configured (Infura, Alchemy, or own node)
- [ ] CDN configured for frontend assets
- [ ] SSL/TLS certificates obtained
- [ ] Domain names configured
- [ ] Backup systems in place

## Part 1: Smart Contract Deployment

### 1.1 Choose Network

**Testnets** (for testing):
- Sepolia (Ethereum testnet)
- Goerli (Ethereum testnet)

**Mainnets** (for production):
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism

### 1.2 Setup Deployment Wallet

```bash
# Generate a new wallet or use existing
# NEVER use wallets with mainnet funds for testnet deployment

# For testnet:
# - Get test ETH from faucets
# - Sepolia: https://sepoliafaucet.com/

# For mainnet:
# - Ensure sufficient ETH for gas fees
# - Recommended: Use a hardware wallet
```

### 1.3 Configure Environment

Create `blockchain/.env`:
```env
# For Sepolia Testnet
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# For Mainnet (when ready)
# MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
# MAINNET_PRIVATE_KEY=your_private_key_here
```

### 1.4 Deploy Contracts

```bash
cd blockchain

# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy:sepolia:v3

# Verify contracts on Etherscan
npm run verify

# Export contract addresses
npm run export:addresses
```

### 1.5 Initialize Platform

```bash
# Set environment variables for initialization
export ACCESS_CONTROL_ADDRESS=0x...
export ECO_LEDGER_ADDRESS=0x...

# Run initialization script
npx hardhat run scripts/initialize-platform.ts --network sepolia
```

### 1.6 Verify Deployment

- Check contracts on Etherscan
- Verify all contract addresses are correct  
- Test basic contract functions
- Ensure roles are properly assigned

## Part 2: Database Setup

### 2.1 Provision Database

**Recommended Providers**:
- **Neon** (Serverless PostgreSQL, free tier available)
- **Supabase** (PostgreSQL with extras)
- **Railway** (Simple deployment platform)
- **AWS RDS** (Enterprise-grade)

### 2.2 Database Configuration

1. Create production database
2. Note connection string (format: `postgresql://user:password@host:port/database`)
3. Enable SSL/TLS connections
4. Configure connection pooling
5. Set up automated backups

### 2.3 Initialize Database

```bash
cd backend

# Set DATABASE_URL in .env
echo "DATABASE_URL=your_connection_string" > .env

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed reference data
npm run db:seed-reference

# Optional: Seed sample data for testing
npm run db:seed-if-empty
```

## Part 3: Backend API Deployment

### 3.1 Choose Deployment Platform

**Recommended Options**:
- **Vercel** (Serverless, easy deployment)
- **Railway** (Simple, full-stack)
- **Render** (Free tier available)
- **AWS/GCP/Azure** (Enterprise)

### 3.2 Configure Environment Variables

Set these in your deployment platform:

```env
# Database
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=production

# Server
PORT=3001

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info
```

### 3.3 Deploy to Vercel

Create `vercel.json` in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

Deploy:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd backend
vercel --prod
```

### 3.4 Alternative: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add environment variables via Railway dashboard

# Deploy
railway up
```

## Part 4: Frontend Deployment

### 4.1 Configure Environment

Create `frontend-react/.env.production`:
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_CHAIN_ID=11155111  # Sepolia testnet
VITE_NETWORK_NAME=sepolia
```

### 4.2 Build for Production

```bash
cd frontend-react

# Install dependencies
npm install

# Build
npm run build

# Test build locally
npm run preview
```

### 4.3 Deploy to Vercel

```bash
# From frontend-react directory
vercel --prod
```

Or connect GitHub repository to Vercel for automatic deployments:
1. Go to vercel.com
2. Import Git Repository
3. Select `frontend-react` as root directory
4. Configure environment variables
5. Deploy

### 4.4 Alternative: Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
cd frontend-react
netlify deploy --prod --dir=dist
```

### 4.5 Configure Custom Domain

1. Add custom domain in deployment platform
2. Configure DNS records:
   - Frontend: CNAME or A record to deployment platform
   - API: CNAME or A record to API deployment
3. Enable SSL/TLS (automatic on Vercel/Netlify)

## Part 5: Post-Deployment

### 5.1 Verification Checklist

- [ ] All smart contracts verified on block explorer
- [ ] Frontend loads and displays correctly
- [ ] API endpoints responding correctly
- [ ] Database connections working
- [ ] MetaMask connects successfully
- [ ] Test transaction flows end-to-end:
  - [ ] User registration
  - [ ] Eco action submission
  - [ ] Verification process
  - [ ] Credit minting
  - [ ] Marketplace trading
  - [ ] Staking/unstaking

### 5.2 Monitoring Setup

1. **Application Monitoring**
   - Set up error tracking (Sentry, Rollbar)
   - Configure uptime monitoring (UptimeRobot, Pingdom)
   - Set up log aggregation (Logtail, Papertrail)

2. **Smart Contract Monitoring**
   - Monitor contract events
   - Track gas prices
   - Alert on unusual activity
   - Monitor contract balances

3. **Database Monitoring**
   - Monitor query performance
   - Track connection pool usage
   - Set up backup verification
   - Alert on failed queries

### 5.3 Performance Optimization

- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Enable gzip/brotli compression
- [ ]Optimize database queries and indexes
- [ ] Implement response caching where appropriate
- [ ] Monitor and optimize bundle sizes

### 5.4 Security Hardening

- [ ] Enable rate limiting
- [ ] Configure WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Rotate secrets regularly

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error rates and performance
- Check system health dashboards
- Review security alerts

**Weekly**:
- Review and analyze logs
- Check database backups
- Update dependencies (security patches)

**Monthly**:
- Security audit review
- Performance optimization review
- Cost optimization review
- Backup restoration testing

### Upgrade Procedures

1. Test upgrades on staging environment
2. Schedule maintenance window
3. Notify users in advance
4. Create database backup
5. Deploy changes
6. Verify functionality
7. Monitor for issues
8. Rollback if necessary

## Rollback Procedures

### Backend Rollback
```bash
# Vercel
vercel rollback

# Railway
railway rollback
```

### Frontend Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```

### Database Rollback
```bash
# Restore from backup
# Use platform-specific backup restoration

# If using Prisma migrations:
npx prisma migrate resolve --rolled-back <migration_name>
```

## Troubleshooting

### Common Issues

**Contract Deployment Fails**
- Check wallet balance (sufficient ETH for gas)
- Verify RPC URL is correct
- Check network congestion (try higher gas price)

**Database Connection Errors**
- Verify connection string format
- Check firewall rules
- Verify SSL/TLS settings
- Check connection pool limits

**Frontend Can't Connect to API**
- Verify CORS settings
- Check API URL in frontend env
- Verify API is deployed and running
- Check SSL/TLS certificates

**MetaMask Not Connecting**
- Verify network configuration
- Check chain ID matches
- Verify contract addresses
- Check RPC endpoint

## Support

For deployment assistance:
- Check documentation in `/docs`
- Review existing GitHub issues
- Contact support team
- Consult deployment platform docs

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024
