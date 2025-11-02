# How to Get Contract Addresses

## 🎯 Quick Answer: Getting Counter Address

### Method 1: Deploy and Get Address (Recommended)

```bash
cd EcoCred/blockchain
npm run deploy:counter
```

The address will be shown in the output:
```
Deployed Addresses

CounterModule#Counter - 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Method 2: Query Deployed Addresses

```bash
npm run get-addresses
# or
npx hardhat run scripts/get-deployed-addresses.ts
```

### Method 3: Check Ignition Deployment Files

Addresses are stored in:
```
ignition/deployments/chain-<chain-id>/<module-name>/state.json
```

## 📍 All Contract Addresses

### Counter Contract

**Deploy:**
```bash
npm run deploy:counter
```

**Address Location:** 
- Shown in deployment output
- Or run: `npm run get-addresses`

### Basic System (EcoSystem)

**Deploy:**
```bash
npm run deploy
```

**Contracts Deployed:**
- CarbonCreditToken
- EcoBadgeNFT
- EcoLedger

### Enhanced System (EcoSystemV2)

**Deploy:**
```bash
npm run deploy:v2
```

**Contracts Deployed:**
- AccessControl
- CarbonCreditToken
- EcoBadgeNFT
- EcoLedgerV2
- CarbonCreditMarketplace
- CreditStaking
- Leaderboard
- Governance

## 🔍 Finding Addresses from Previous Deployments

### Option 1: Check Deployment Output

If you deployed recently, scroll up in your terminal to find the deployment output with addresses.

### Option 2: Check Ignition State Files

```bash
# For local Hardhat network (chain ID 31337)
cat ignition/deployments/chain-31337/CounterModule/state.json | grep -A 5 "address"

# For Sepolia (chain ID 11155111)
cat ignition/deployments/chain-11155111/CounterModule/state.json | grep -A 5 "address"
```

### Option 3: Use the Script

```bash
npx hardhat run scripts/get-deployed-addresses.ts
```

This will show all deployed contracts for the current network.

## 🌐 Network-Specific Addresses

Addresses are different for each network:

- **Local Hardhat**: `chain-31337`
- **Sepolia Testnet**: `chain-11155111`
- **Ethereum Mainnet**: `chain-1`

Make sure you're checking the correct network's deployment files.

## 💡 Quick Reference

| Command | What It Does |
|--------|-------------|
| `npm run deploy:counter` | Deploy Counter contract |
| `npm run deploy` | Deploy basic system |
| `npm run deploy:v2` | Deploy enhanced system |
| `npm run get-addresses` | Show all deployed addresses |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |

## 🔗 Using Addresses in Frontend

Once you have addresses, add them to your `.env.local` file in the frontend:

```env
VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CARBON_CREDIT_TOKEN=0x...
VITE_ECO_BADGE_NFT=0x...
VITE_ECOLEDGER_CONTRACT=0x...
```

## ⚠️ Important Notes

1. **Addresses are Network-Specific**: Same contract has different addresses on different networks
2. **Local Network Addresses**: Hardhat uses deterministic addresses for local development
3. **Save Addresses**: Always save deployed addresses after deployment
4. **Check Network**: Make sure you're using addresses from the correct network

## 📝 Example: Getting Counter Address

```bash
# 1. Deploy Counter
npm run deploy:counter

# Output shows:
# CounterModule#Counter - 0x5FbDB2315678afecb367f032d93F642f64180aa3

# 2. Use this address in your frontend .env.local
VITE_COUNTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# 3. Or query later
npm run get-addresses
```

## 🆘 Troubleshooting

**Q: Address not found?**
- Make sure you deployed to the correct network
- Check the `ignition/deployments` folder exists
- Verify the chain ID matches your network

**Q: Address changed?**
- Local Hardhat addresses are deterministic (same every time)
- Testnet/mainnet addresses are unique per deployment
- Redeploying creates new addresses

**Q: Want to see all deployments?**
```bash
ls -la ignition/deployments/chain-31337/
```

