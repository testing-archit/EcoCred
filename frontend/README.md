# GreenLedger Frontend

A modern, responsive web application for the GreenLedger decentralized carbon credit rewards platform. Built with SvelteKit and TypeScript.

## 🌟 Features

- **Company Dashboard**: Real-time tracking of carbon credits, eco actions, and sustainability metrics
- **Eco Action Logging**: Submit and track sustainability initiatives with blockchain verification
- **Leaderboard**: Competitive rankings to encourage participation
- **NFT Badge Gallery**: Showcase earned milestone achievements
- **MetaMask Integration**: Seamless wallet connection and blockchain interactions
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠 Tech Stack

- **Framework**: SvelteKit 5.0
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide Svelte
- **Blockchain**: Ethers.js
- **Wallet**: MetaMask integration

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── Navigation.svelte
│   │   ├── DashboardChart.svelte
│   │   └── RecentActions.svelte
│   ├── services/            # Business logic and API services
│   │   ├── wallet.ts        # MetaMask wallet integration
│   │   └── contracts.ts     # Smart contract interactions
│   └── assets/             # Static assets
├── routes/                 # SvelteKit routes
│   ├── +layout.svelte      # Main layout
│   ├── +page.svelte        # Dashboard home
│   ├── actions/            # Eco action logging
│   ├── leaderboard/        # Company rankings
│   └── badges/             # NFT badge gallery
└── app.css                 # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask browser extension

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/archit/Desktop/blockchain_project/EcoCred/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🔗 Blockchain Integration

### Smart Contracts

The frontend integrates with three main smart contracts:

1. **CarbonCreditToken.sol** (ERC-20)
   - Manages carbon credit tokens
   - Handles transfers and balances

2. **EcoBadgeNFT.sol** (ERC-721)
   - NFT badges for sustainability milestones
   - Bronze, Silver, Gold, Platinum tiers

3. **GreenLedger.sol**
   - Main contract for logging eco actions
   - Verification and credit minting logic

### Wallet Connection

- **MetaMask Integration**: Automatic wallet detection and connection
- **Network Support**: Sepolia testnet (configurable)
- **Account Management**: Real-time balance and transaction tracking

### Contract Addresses

Update contract addresses in `src/lib/services/contracts.ts`:

```typescript
const CONTRACTS = {
  CARBON_CREDIT_TOKEN: '0x...', // Your deployed contract address
  ECO_BADGE_NFT: '0x...',       // Your deployed contract address
  ECOLEDGER_CONTRACT: '0x...'   // Your deployed contract address
};
```

## 🎨 Design System

### Color Palette

- **Primary Green**: `#22c55e` - Sustainability and growth
- **Secondary Gray**: `#64748b` - Neutral text and backgrounds
- **Accent Colors**: Bronze, Silver, Gold, Platinum for badge tiers

### Components

- **Cards**: Consistent shadow and border radius
- **Buttons**: Primary and secondary variants
- **Badges**: Status indicators with color coding
- **Charts**: Interactive data visualizations

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Navigation**: Collapsible mobile menu
- **Tables**: Horizontal scroll on small screens

## 🔧 Configuration

### Environment Variables

Create `.env.local` for configuration:

```env
VITE_NETWORK=sepolia
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
VITE_CONTRACT_ADDRESS_CARBON=0x...
VITE_CONTRACT_ADDRESS_BADGE=0x...
VITE_CONTRACT_ADDRESS_LEDGER=0x...
```

### TailwindCSS Configuration

Custom configuration in `tailwind.config.js`:

- Extended color palette for sustainability theme
- Custom component classes
- Form styling with `@tailwindcss/forms`

## 🧪 Development

### Mock Data

The application includes mock data for development:

- Dashboard statistics
- Recent eco actions
- Leaderboard rankings
- NFT badges

Replace mock functions in `contracts.ts` with actual contract calls when deployed.

### Type Safety

- Full TypeScript support
- Interface definitions for all data structures
- Strict type checking enabled

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Netlify

1. Build the project: `npm run build`
2. Deploy the `build` directory
3. Configure redirects for SPA routing

### Static Hosting

```bash
npm run build
# Deploy the generated `build` directory
```

## 🔒 Security Considerations

- **Wallet Security**: Never store private keys
- **Contract Verification**: Always verify deployed contracts
- **Input Validation**: Sanitize all user inputs
- **HTTPS**: Use secure connections in production

## 📊 Performance

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: WebP format with fallbacks
- **Caching**: Browser caching for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the GreenLedger ecosystem. See main project README for license information.

## 🆘 Support

For issues and questions:

1. Check the [Issues](../../issues) page
2. Review the smart contract documentation
3. Contact the development team

---

**Built with ❤️ for a sustainable future**