# Automatic Contract Deployment & Address Detection

This project now uses **automatic contract deployment** and **address detection** - no `.env` files needed!

## 🚀 How It Works

### 1. **Automatic Deployment**
Contracts are automatically deployed when you run:
```bash
cd blockchain
npm run deploy:auto
```

This will:
- Deploy all contracts to the Hardhat local network
- Automatically export addresses to the frontend

### 2. **Address Detection**
Contract addresses are automatically detected from Hardhat deployment artifacts and written to:
```
frontend/src/lib/config/contract-addresses.ts
```

### 3. **Frontend Integration**
The frontend automatically reads addresses from the generated TypeScript file - no environment variables needed!

## 📋 Available Commands

### Deploy Contracts
```bash
cd blockchain

# Deploy to local Hardhat network (default)
npm run deploy:hardhat

# Deploy and automatically export addresses
npm run deploy:auto

# Just export addresses from existing deployment
npm run export:addresses
```

### For Different Networks
```bash
# Sepolia testnet (requires network config in hardhat.config.ts)
npm run deploy:sepolia

# Export addresses for a specific chain
CHAIN_ID=11155111 npm run export:addresses
```

## 🔄 Workflow

### First Time Setup
1. Start Hardhat node (if not already running):
   ```bash
   cd blockchain
   npm run node
   ```

2. Deploy contracts and export addresses:
   ```bash
   npm run deploy:auto
   ```

3. Start frontend:
   ```bash
   cd ../frontend
   npm run dev
   ```

### After Contract Changes
Simply run:
```bash
cd blockchain
npm run deploy:auto
```

The frontend will automatically pick up the new addresses!

## 📁 File Structure

```
blockchain/
├── ignition/
│   └── deployments/
│       └── chain-31337/          # Deployment artifacts
│           └── deployed_addresses.json
├── scripts/
│   └── export-addresses.ts       # Address export script
└── package.json

frontend/
└── src/
    └── lib/
        └── config/
            └── contract-addresses.ts  # Auto-generated addresses
```

## ✅ Benefits

1. **No .env files** - Everything is automatic
2. **Always in sync** - Addresses are always from actual deployments
3. **Easy to maintain** - Single source of truth (deployment artifacts)
4. **Type-safe** - TypeScript types generated automatically

## 🔧 Advanced Usage

### Custom Chain ID
To export addresses for a different chain:
```bash
CHAIN_ID=11155111 npm run export:addresses
```

### Manual Deployment
If you need to deploy manually:
```bash
# Deploy contracts
npx hardhat ignition deploy ignition/modules/EcoSystemV2.ts --network hardhatMainnet

# Export addresses
npm run export:addresses
```

## 🐛 Troubleshooting

### "No deployment found"
If you see this warning, it means contracts haven't been deployed yet. Run:
```bash
npm run deploy:auto
```

### "Contract addresses not loading"
1. Check that `frontend/src/lib/config/contract-addresses.ts` exists
2. Run `npm run export:addresses` to regenerate it
3. Restart the frontend dev server

### Addresses are wrong
1. Delete the deployment artifacts if needed:
   ```bash
   rm -rf blockchain/ignition/deployments/chain-31337
   ```
2. Redeploy:
   ```bash
   npm run deploy:auto
   ```

## 📝 Notes

- The deployment script automatically detects the chain ID from deployment artifacts
- Default addresses are provided for local development if no deployment is found
- Addresses are generated as TypeScript constants for type safety
- The generated file is updated every time you deploy contracts

