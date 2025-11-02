# Quick Environment Setup Guide

## 📍 Where to Put Counter Address

### Frontend `.env.local` file

**Location:** `EcoCred/frontend/.env.local`

Add this line:
```env
VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Complete Example

Here's what your `frontend/.env.local` should look like with Counter:

```env
# Network
VITE_NETWORK=localhost
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337

# Contract Addresses
VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CARBON_CREDIT_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_ECO_BADGE_NFT=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_ECOLEDGER_CONTRACT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

## 🚀 Quick Setup Steps

### Step 1: Get Your Counter Address

```bash
cd EcoCred/blockchain
npm run deploy:counter
```

Copy the address from output:
```
CounterModule#Counter - 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 2: Add to Frontend `.env.local`

```bash
cd ../frontend

# Create .env.local if it doesn't exist
touch .env.local

# Add the Counter address
echo "VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3" >> .env.local
```

Or edit manually:
```bash
nano .env.local
# Add: VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 3: Restart Frontend Server

```bash
npm run dev
```

The Counter address will now be available in your frontend code!

## 📝 Your Counter Address (from deployment)

```
VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb2315678afecb367f032d93F642f64180aa3
```

**Note:** This is for local Hardhat network. For Sepolia testnet, deploy with:
```bash
npm run deploy:counter --network sepolia
```

And use that address instead.

## 🔍 How It's Used in Code

In `frontend/src/lib/services/contracts.ts`, the Counter address is read like this:

```typescript
const CONTRACTS = {
    COUNTER: import.meta.env.VITE_COUNTER_ADDRESS || '0x0000000000000000000000000000000000000000'
};
```

So just add `VITE_COUNTER_ADDRESS` to your `.env.local` and it will work!

## ✅ Complete Checklist

- [ ] Deploy Counter: `npm run deploy:counter`
- [ ] Copy the address from output
- [ ] Create `frontend/.env.local` file
- [ ] Add `VITE_COUNTER_ADDRESS=0x...` to `.env.local`
- [ ] Restart frontend server: `npm run dev`
- [ ] Counter should now work in your app!

