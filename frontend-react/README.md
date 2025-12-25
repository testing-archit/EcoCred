# EcoCred Frontend (React)

Modern React frontend for the EcoCred carbon credit rewards platform with role-based interfaces and comprehensive blockchain integration.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS 4** - Utility-first styling
- **Ethers.js v6** - Blockchain interaction
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Framer Motion** - Animations

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdminDashboard.tsx
│   ├── AuditorDashboard.tsx
│   ├── CompanyDashboard.tsx
│   ├── VerifierDashboard.tsx
│   ├── Navigation.tsx
│   ├── ConnectWallet.tsx
│   ├── RoleGuard.tsx
│   └── ...
├── pages/              # Route components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Actions.tsx
│   ├── Marketplace.tsx
│   ├── Staking.tsx
│   └── ...
├── contexts/           # React contexts
│   ├── WalletContext.tsx    # MetaMask integration
│   ├── UserContext.tsx      # User state and authentication
│   ├── ThemeContext.tsx     # Dark/light mode
│   └── NotificationContext.tsx
├── hooks/              # Custom hooks
│   ├── useBlockchain.ts
│   └── useBlockchainEvents.ts
├── lib/                # Utilities and config
│   ├── config/
│   │   └── contract-addresses.ts
│   └── utils.ts
├── App.tsx             # Main app component
└── main.tsx           # Entry point
```

## Role-Based Architecture

The frontend adapts its interface based on user roles:

### COMPANY Role
- **Dashboard**: Carbon credits, actions, badges, ranking
- **Access**: All features (actions, marketplace, staking, governance, badges)
- **Features**: Submit eco actions, trade credits, stake, vote

### VERIFIER Role
- **Dashboard**: Pending verifications, statistics
- **Access**: Actions (for verification), companies, analytics
- **Features**: Approve/reject eco actions, view verification metrics

### AUDITOR Role
- **Dashboard**: Audit statistics, flagged items
- **Access**: All actions for auditing, companies, governance, analytics
- **Features**: Audit platform activities, monitor compliance

See [ROLE_BASED_UI.md](../ROLE_BASED_UI.md) for complete documentation.

## Key Components

### Context Providers

#### WalletContext
```tsx
// Manages MetaMask connection and blockchain state
const { account, chainId, connect, disconnect, provider, signer } = useWallet();
```

**Features**:
- MetaMask connection/disconnection
- Network detection and validation
- Account change handling
- Provider and signer access

#### UserContext
```tsx
// Manages user authentication and profile
const { user, login, logout, updateProfile, isAuthenticated } = useUser();
```

**Features**:
- JWT authentication
- User profile management
- Role-based access control
- Automatic token refresh

#### ThemeContext
```tsx
// Manages dark/light mode
const { theme, toggleTheme } = useTheme();
```

### Custom Hooks

#### useBlockchain
```tsx
const { 
  contracts,          // Contract instances
  loading,           // Loading state
  error,             // Error state
  callContract,      // Call contract method
  sendTransaction    // Send transaction
} = useBlockchain();
```

**Features**:
- Automatic contract initialization
- Transaction management
- Error handling
- Loading states

#### useBlockchainEvents
```tsx
const { events, subscribe, unsubscribe } = useBlockchainEvents('CarbonCreditToken', 'Transfer');
```

**Features**:
- Event subscription
- Real-time updates
- Event history
- Automatic cleanup

### Route Protection

```tsx
// RoleGuard.tsx
<RoleGuard allowedRoles={['COMPANY', 'ADMIN']}>
  <ProtectedComponent />
</RoleGuard>
```

## Development

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Backend API running
- Smart contracts deployed

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Environment Configuration

Contract addresses are **auto-detected** from blockchain deployment artifacts. No manual configuration needed!

Optional environment variables (`.env.local`):
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=localhost
```

### Available Scripts

```bash
# Development server
npm run dev

# Type checking
tsc -b

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Contract Integration

### Contract Address Auto-Detection

The app automatically loads contract addresses from:
1. Blockchain deployment artifacts (`ignition/deployments/`)
2. Exported addresses (`contract-addresses.json`)

### Contract Instances

Access contracts via `useBlockchain` hook:

```tsx
const { contracts } = useBlockchain();

// Use contracts
await contracts.carbonCredit.balanceOf(address);
await contracts.marketplace.createListing(amount, price);
await contracts.staking.stake(amount, lockPeriod);
```

### Transaction Handling

```tsx
const { sendTransaction } = useBlockchain();

const handleStake = async () => {
  try {
    const tx = await sendTransaction(
      contracts.staking,
      'stake',
      [amount, lockPeriod]
    );
    // Transaction sent, wait for confirmation
    await tx.wait();
    // Success!
  } catch (error) {
    // Handle error
  }
};
```

## API Integration

### Authentication

```tsx
// Login with wallet signature
const { login } = useUser();
await login(walletAddress, signature);

// Login with email/password
await loginWithEmail(email, password);
```

### API Calls

```tsx
// Example: Fetch eco actions
const response = await fetch(`${API_BASE_URL}/api/actions`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const actions = await response.json();
```

## Styling

### TailwindCSS

The app uses TailwindCSS 4 with custom configuration:

- **Dark mode**: Class-based with system preference detection
- **Custom colors**: Brand colors defined in `tailwind.config.js`
- **Animations**: Custom keyframes and utilities
- **Responsive**: Mobile-first approach

### Theme Customization

Edit `tailwind.config.js`:
```js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10b981',
          blue: '#3b82f6',
          // ...
        }
      }
    }
  }
}
```

## Building for Production

```bash
# Build
npm run build

# Output in dist/ directory
# dist/
#   ├── assets/
#   │   ├── index-[hash].js
#   │   └── index-[hash].css
#   └── index.html
```

### Deployment

Deploy `dist/` directory to:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=dist`
- **Static hosting**: Upload `dist/` contents

## Best Practices

### Code Organization

- **One component per file**
- **Shared types** in component files
- **Extract complex logic** to custom hooks
- **Keep components small** and focused

### State Management

- **Local state** for component-specific data
- **Context** for cross-cutting concerns (user, wallet, theme)
- **Backend API** as source of truth
- **Blockchain** for immutable data

### Performance

- **Code splitting**: Automatic with Vite
- **Lazy loading**: Use React.lazy() for routes
- **Memoization**: useMemo/useCallback for expensive operations
- **Optimistic updates**: Update UI before confirmation

### TypeScript

- **Strict mode** enabled
- **Interface** for object shapes
- **Type** for unions and primitives
- **Avoid any** - use unknown instead

## Troubleshooting

### MetaMask Not Connecting

1. Check MetaMask is installed
2. Verify network (Chain ID 31337 for local)
3. Check account is unlocked
4. Try different browser

### Contract Methods Failing

1. Verify contracts are deployed
2. Check contract addresses are correct
3. Ensure sufficient gas
4. Verify network matches deployment

### Build Errors

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf .vite`
3. Check TypeScript errors: `tsc -b`

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT
