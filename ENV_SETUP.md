# Environment Variables Setup Guide

This guide explains all the environment variables needed for both the blockchain backend and frontend.

## 📁 Backend (Blockchain) - `.env` file

Create a `.env` file in the `EcoCred/blockchain/` directory with the following variables:

### Required Variables

```env
# Sepolia Testnet RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Private Key for deployment account (NEVER commit this!)
SEPOLIA_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
```

### How to Get These Values

#### 1. SEPOLIA_RPC_URL

You have several options:

**Option A: Infura (Recommended)**
1. Go to https://infura.io/
2. Sign up for a free account
3. Create a new project
4. Select "Ethereum" network
5. Copy the "Sepolia" endpoint URL
6. Replace `YOUR_PROJECT_ID` in the URL

**Option B: Alchemy**
1. Go to https://www.alchemy.com/
2. Sign up for a free account
3. Create a new app for "Ethereum" on "Sepolia" network
4. Copy the HTTP endpoint URL

**Option C: Public RPC (Less Reliable)**
```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

#### 2. SEPOLIA_PRIVATE_KEY

**IMPORTANT SECURITY NOTES:**
- ⚠️ **NEVER commit your private key to git**
- ⚠️ **Use a separate account for deployments, not your main wallet**
- ⚠️ **Only use testnet accounts with testnet ETH**
- ⚠️ **Never use mainnet private keys here**

To get a testnet account:

1. **Create a new MetaMask account** (or use a new address)
2. **Export the private key** from MetaMask:
   - Click account icon → Account details → Export Private Key
   - Enter your password
   - Copy the private key (starts with `0x`)
3. **Get Sepolia testnet ETH** from a faucet:
   - https://sepoliafaucet.com/
   - https://faucet.quicknode.com/ethereum/sepolia
   - https://sepolia-faucet.pk910.de/

**Example format:**
```env
SEPOLIA_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Optional Variables

```env
# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

Get from: https://etherscan.io/apis

---

## 📁 Frontend - `.env.local` file

Create a `.env.local` file in the `EcoCred/frontend/` directory with the following variables:

### Required Variables

```env
# Network name
VITE_NETWORK=sepolia

# RPC URL (can be same as backend or different)
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Core contract addresses (fill after deployment)
VITE_CARBON_CREDIT_TOKEN=0x0000000000000000000000000000000000000000
VITE_ECO_BADGE_NFT=0x0000000000000000000000000000000000000000
VITE_ECOLEDGER_CONTRACT=0x0000000000000000000000000000000000000000

# Counter contract address (for testing/development)
# Get by running: npm run deploy:counter (in blockchain folder)
VITE_COUNTER_ADDRESS=0x0000000000000000000000000000000000000000
```

### Advanced Contract Addresses (V2 System)

```env
# Optional - for enhanced features
VITE_ACCESS_CONTROL_CONTRACT=0x0000000000000000000000000000000000000000
VITE_MARKETPLACE_CONTRACT=0x0000000000000000000000000000000000000000
VITE_STAKING_CONTRACT=0x0000000000000000000000000000000000000000
VITE_LEADERBOARD_CONTRACT=0x0000000000000000000000000000000000000000
VITE_GOVERNANCE_CONTRACT=0x0000000000000000000000000000000000000000
```

### How to Fill Contract Addresses

1. **Deploy contracts** (see deployment guide in README.md):
   ```bash
   cd EcoCred/blockchain
   npm run deploy:sepolia
   ```

2. **Copy the deployed addresses** from the deployment output

3. **Paste them into `.env.local`** in the frontend directory

### Chain ID Configuration

```env
# Chain IDs for network validation
VITE_CHAIN_ID_SEPOLIA=11155111
VITE_CHAIN_ID_MAINNET=1
VITE_CHAIN_ID_HARDHAT=31337
VITE_CHAIN_ID=11155111  # Current network
```

---

## 🚀 Quick Setup Steps

### Step 1: Backend Setup

```bash
cd EcoCred/blockchain

# Copy example file
cp .env.example .env

# Edit .env and add your values
nano .env  # or use your preferred editor
```

Fill in:
- `SEPOLIA_RPC_URL` (get from Infura/Alchemy)
- `SEPOLIA_PRIVATE_KEY` (export from MetaMask testnet account)

### Step 2: Get Testnet ETH

1. Create/select a testnet account in MetaMask
2. Switch to Sepolia testnet
3. Get test ETH from a faucet (links above)
4. Verify you have ETH in your account

### Step 3: Deploy Contracts

```bash
cd EcoCred/blockchain
npm run deploy:sepolia
```

### Step 4: Frontend Setup

```bash
cd EcoCred/frontend

# Copy example file
cp .env.example .env.local

# Edit .env.local
nano .env.local  # or use your preferred editor
```

Fill in:
- `VITE_RPC_URL` (same as backend or different)
- Contract addresses from deployment output

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` or `.env.local` files**
   - They're already in `.gitignore`
   - Double-check before committing

2. ✅ **Use separate accounts**
   - One account for testnet deployments
   - Different account for main wallet

3. ✅ **Use testnet for development**
   - Only use mainnet when ready for production
   - Test thoroughly on testnets first

4. ✅ **Keep private keys secure**
   - Never share them
   - Don't put them in code
   - Use environment variables only

5. ✅ **Rotate keys if exposed**
   - If a private key is ever exposed, immediately:
     - Create a new account
     - Transfer funds out of old account
     - Update environment variables

---

## 🧪 Local Development Setup

For local development with Hardhat:

### Backend `.env` (local development)
```env
# Not needed for Hardhat local network
# Just run: npm run node
```

### Frontend `.env.local` (local development)
```env
VITE_NETWORK=localhost
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337

# Deploy to local network first
# npm run deploy:hardhat
# Then copy addresses here
VITE_CARBON_CREDIT_TOKEN=0x...  # from local deployment
VITE_ECO_BADGE_NFT=0x...        # from local deployment
VITE_ECOLEDGER_CONTRACT=0x...   # from local deployment
```

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] `.env` file created in `blockchain/` directory
- [ ] `SEPOLIA_RPC_URL` is valid and accessible
- [ ] `SEPOLIA_PRIVATE_KEY` is valid (64 hex chars after 0x)
- [ ] Account has Sepolia testnet ETH
- [ ] `.env` is in `.gitignore` (check before commit)
- [ ] `.env.local` created in `frontend/` directory
- [ ] All contract addresses filled after deployment
- [ ] RPC URL matches network you're deploying to

---

## 🆘 Troubleshooting

### "Invalid private key"
- Ensure it starts with `0x`
- Must be exactly 66 characters (0x + 64 hex chars)
- No spaces or extra characters

### "Insufficient funds"
- Your deployment account needs ETH for gas
- Get testnet ETH from faucets listed above

### "Network error" or "RPC error"
- Check your RPC URL is correct
- Verify your Infura/Alchemy project is active
- Try a different RPC provider

### "Contract not found" (frontend)
- Verify contract addresses are correct
- Ensure contracts are deployed to the network you're using
- Check network matches in MetaMask

---

## 📚 Additional Resources

- [Hardhat Environment Variables](https://hardhat.org/hardhat-runner/docs/config#configuration-via-environment-variables)
- [Infura Setup Guide](https://docs.infura.io/)
- [Alchemy Setup Guide](https://docs.alchemy.com/)
- [Sepolia Faucets](https://sepoliafaucet.com/)

---

**Remember:** Never commit `.env` or `.env.local` files with real values!

