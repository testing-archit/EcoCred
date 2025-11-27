# Test Account Credentials

## 📋 Account Information

### 1. 👤 COMPANY Account
- **Email:** `company@ecocred.test`
- **Password:** `Company123!`
- **Wallet Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Role:** COMPANY
- **Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 2. 🔍 VERIFIER Account
- **Email:** `verifier@ecocred.test`
- **Password:** `Verifier123!`
- **Wallet Address:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Role:** VERIFIER
- **Private Key:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### 3. 📊 AUDITOR Account
- **Email:** `auditor@ecocred.test`
- **Password:** `Auditor123!`
- **Wallet Address:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Role:** AUDITOR
- **Private Key:** `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

---

## 🚀 How to Use These Accounts

### Option 1: Email/Password Login
1. Go to http://localhost:5173/login
2. Enter the email and password from above
3. Connect your wallet when prompted

### Option 2: Wallet Login
1. Import the private key into MetaMask:
   - Open MetaMask
   - Click the account icon → Import Account
   - Paste the private key
2. Make sure MetaMask is connected to Hardhat network:
   - Network: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency: ETH
3. Go to http://localhost:5173/login
4. Click "Connect Wallet" and sign the message

---

## 📝 Notes

- These accounts use Hardhat's default test accounts
- All accounts are pre-verified for testing
- The COMPANY account has an associated company profile
- Wallet addresses are from Hardhat's default accounts (accounts #0, #1, #2)

---

## 🔐 Security Note

**These are TEST accounts only!** Do not use these credentials in production.
The private keys are publicly known as they are Hardhat's default test accounts.

