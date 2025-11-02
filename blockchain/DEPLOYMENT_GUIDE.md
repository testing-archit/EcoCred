# Deployment Scripts Guide

## 📍 Deployment File Locations

Your project uses **Hardhat Ignition** for deployments, which is the modern, recommended approach. Here are your deployment files:

### Primary Deployment Files

1. **`ignition/modules/EcoSystem.ts`** - Basic System Deployment
   - Location: `EcoCred/blockchain/ignition/modules/EcoSystem.ts`
   - Deploys: CarbonCreditToken, EcoBadgeNFT, EcoLedger (basic)
   - Used by: `npm run deploy`

2. **`ignition/modules/EcoSystemV2.ts`** - Enhanced System Deployment ⭐
   - Location: `EcoCred/blockchain/ignition/modules/EcoSystemV2.ts`
   - Deploys: All contracts including AccessControl, Marketplace, Staking, Governance, Leaderboard
   - Used by: `npm run deploy:v2`

### How They Work

These files use **Hardhat Ignition** (not traditional scripts):
- Uses `buildModule()` to define deployment logic
- Automatically handles contract dependencies
- Supports deployment resumption if interrupted
- Creates deployment artifacts for future reference

## 🚀 Deployment Commands

```bash
# Deploy basic system (EcoSystem.ts)
npm run deploy

# Deploy enhanced system (EcoSystemV2.ts)
npm run deploy:v2

# Deploy to Hardhat local network
npm run deploy:hardhat

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

## 📝 Creating a Traditional Deploy Script (Alternative)

If you prefer traditional deployment scripts (like `scripts/deploy.ts`), here's how to create one:

### Example: Traditional Deploy Script

Create `scripts/deploy.ts`:

```typescript
import { network } from "hardhat";
import { parseEther } from "ethers";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy CarbonCreditToken
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const token = await CarbonCreditToken.deploy(
    deployer.address,  // owner
    deployer.address   // initial minter (will be changed)
  );
  await token.waitForDeployment();
  console.log("CarbonCreditToken deployed to:", await token.getAddress());

  // Deploy EcoBadgeNFT
  const EcoBadgeNFT = await ethers.getContractFactory("EcoBadgeNFT");
  const badge = await EcoBadgeNFT.deploy("https://example.com/metadata/");
  await badge.waitForDeployment();
  console.log("EcoBadgeNFT deployed to:", await badge.getAddress());

  // Deploy EcoLedger
  const EcoLedger = await ethers.getContractFactory("EcoLedger");
  const ledger = await EcoLedger.deploy(
    await token.getAddress(),
    await badge.getAddress()
  );
  await ledger.waitForDeployment();
  console.log("EcoLedger deployed to:", await ledger.getAddress());

  // Set ledger as minter
  await token.setMinter(await ledger.getAddress());
  console.log("Set ledger as minter");

  // Save addresses to a file or return them
  const addresses = {
    token: await token.getAddress(),
    badge: await badge.getAddress(),
    ledger: await ledger.getAddress(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(addresses, null, 2));

  return addresses;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Then run it with:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## 🔍 Current Project Structure

```
EcoCred/blockchain/
├── ignition/
│   └── modules/
│       ├── EcoSystem.ts          ← Basic deployment
│       ├── EcoSystemV2.ts        ← Enhanced deployment (RECOMMENDED)
│       └── Counter.ts            ← Counter example
├── scripts/
│   ├── create-listing.ts         ← Utility script (not deployment)
│   ├── grant-role.ts             ← Utility script
│   ├── stake-credits.ts          ← Utility script
│   └── verify-action.ts          ← Utility script
└── contracts/
    └── ...                       ← Your smart contracts
```

## 📋 Comparison: Ignition vs Traditional Scripts

### Hardhat Ignition (Current - Recommended)
✅ **Advantages:**
- Automatic dependency management
- Can resume interrupted deployments
- Better error handling
- Deployment state tracking
- Supports complex multi-step deployments

❌ **Disadvantages:**
- Slightly different syntax
- Newer technology (less examples online)

### Traditional Scripts
✅ **Advantages:**
- Simple, straightforward
- Many examples available
- Full control over deployment flow
- Easy to understand for beginners

❌ **Disadvantages:**
- Manual dependency management
- Need to handle errors manually
- No resumption on failure

## 🎯 Recommended Approach

**Use Ignition modules** (EcoSystemV2.ts) because:
1. It's already set up in your project
2. Better for complex deployments with dependencies
3. Industry best practice for Hardhat v3+

## 🔧 Customizing Deployment Parameters

You can customize deployment parameters when running Ignition:

```bash
# Deploy with custom base URI
npx hardhat ignition deploy ignition/modules/EcoSystemV2.ts \
  --parameters '{"EcoSystemV2Module":{"baseURI":"https://myapi.com/metadata/"}}'

# Deploy with custom marketplace fee
npx hardhat ignition deploy ignition/modules/EcoSystemV2.ts \
  --parameters '{"EcoSystemV2Module":{"marketplaceFee":300}}'
```

Or modify the default values directly in `EcoSystemV2.ts`.

## 📖 Further Reading

- [Hardhat Ignition Documentation](https://hardhat.org/ignition/docs)
- [Hardhat Deploy Guide](https://hardhat.org/hardhat-runner/docs/guides/deploying)

