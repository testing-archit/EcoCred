# EcoCred Development Guide

## Project Structure

```
EcoCred/
├── blockchain/          # Smart contracts and deployment
│   ├── contracts/       # Solidity contracts
│   ├── test/           # Contract tests
│   ├── scripts/        # Deployment scripts
│   └── ignition/       # Hardhat Ignition modules
├── backend/            # Node.js API server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Auth, error handling
│   │   └── database/   # Prisma schema
│   └── tests/          # API tests
└── frontend/           # SvelteKit web app
    ├── src/
    │   ├── routes/     # Pages
    │   ├── lib/
    │   │   ├── components/  # Reusable components
    │   │   ├── stores/      # State management
    │   │   └── services/    # API client
    └── static/         # Static assets
```

## Development Workflow

### 1. Start Local Blockchain

```bash
cd blockchain
npm run node
```

This starts a local Hardhat node on `http://localhost:8545`

### 2. Deploy Contracts

In a new terminal:

```bash
cd blockchain
npm run deploy
```

Save the deployed contract addresses.

### 3. Start Backend

```bash
cd backend

# First time setup
npm run db:generate
npm run db:push

# Start server
npm run dev
```

Backend runs on `http://localhost:3001`

### 4. Start Frontend

```bash
cd frontend

# Create .env.local with contract addresses
echo "VITE_API_URL=http://localhost:3001/api" > .env.local
echo "VITE_CONTRACT_ADDRESS_CARBON=<address>" >> .env.local
# ... add other contract addresses

npm run dev
```

Frontend runs on `http://localhost:5173`

## Common Tasks

### Update Smart Contracts

```bash
cd blockchain
# Edit contracts in contracts/
npm run compile
npm run test
npm run deploy
```

### Add API Endpoint

```bash
cd backend/src/routes
# Create or edit route file
# Update server.ts to register route
```

### Add Frontend Page

```bash
cd frontend/src/routes
# Create +page.svelte file
# SvelteKit automatically creates route
```

### Database Changes

```bash
cd backend
# Edit src/database/schema.prisma
npm run db:generate
npm run db:push
```

## Testing

### Smart Contracts

```bash
cd blockchain
npm run test                    # Run all tests
npm run test -- --grep "Token"  # Run specific tests
```

### Backend

```bash
cd backend
npm run test
```

### Frontend

```bash
cd frontend
npm run check      # Type checking
npm run build      # Production build test
```

## Deployment

### Testnet (Sepolia)

1. Get Sepolia ETH from faucet
2. Add private key to blockchain/.env
3. Deploy:

```bash
cd blockchain
npm run deploy:sepolia
```

4. Update backend and frontend with new addresses
5. Deploy backend to hosting service
6. Deploy frontend to Vercel/Netlify

### Production Checklist

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Error tracking (Sentry, etc.)
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Multi-sig for admin functions

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL in backend/.env
- Ensure Neon database is accessible
- Run `npm run db:push` to sync schema

### "Contract not deployed"
- Ensure local Hardhat node is running
- Check contract addresses in .env files
- Redeploy contracts if needed

### "MetaMask connection failed"
- Check network (should match deployed contracts)
- Ensure MetaMask is installed
- Check browser console for errors

### "API request failed"
- Verify backend is running on port 3001
- Check CORS settings
- Verify API_URL in frontend .env.local

## Best Practices

### Smart Contracts
- Always test before deploying
- Use events for important state changes
- Follow checks-effects-interactions pattern
- Add comprehensive comments

### Backend
- Validate all inputs
- Use TypeScript types
- Handle errors gracefully
- Log important operations

### Frontend
- Use TypeScript for type safety
- Keep components small and focused
- Use stores for shared state
- Handle loading and error states

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

## Getting Help

1. Check documentation in each directory
2. Review contract summaries in blockchain/CONTRACTS_SUMMARY.md
3. Check deployment guide in blockchain/DEPLOYMENT_GUIDE.md
4. Review API documentation in backend/README.md
