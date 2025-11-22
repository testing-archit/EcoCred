import { ethers } from 'ethers';
import { walletService } from './wallet';

// Contract addresses (read from env)
const CONTRACTS = {
    CARBON_CREDIT_TOKEN: import.meta.env.VITE_CARBON_CREDIT_TOKEN as string,
    ECO_BADGE_NFT: import.meta.env.VITE_ECO_BADGE_NFT as string,
    ECOLEDGER_CONTRACT: import.meta.env.VITE_ECOLEDGER_CONTRACT as string,
    ACCESS_CONTROL: import.meta.env.VITE_ACCESS_CONTROL as string,
    COUNTER: import.meta.env.VITE_COUNTER_ADDRESS || '0x0000000000000000000000000000000000000000'
};

// Contract ABIs (minimal interfaces)
const CARBON_CREDIT_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function totalSupply() view returns (uint256)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'function mint(address to, uint256 amount)'
];

const ECO_BADGE_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function safeMint(address to)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

const ECOLEDGER_ABI = [
    'function logEcoAction(string title, string description, uint256 estimatedCredits, string location) returns (uint256)',
    'function verifyAction(uint256 actionId, bool approved, uint256 actualCredits)',
    'function getAction(uint256 actionId) view returns (string title, string description, uint256 estimatedCredits, string location, bool verified, uint256 actualCredits)',
    'function actionCount() view returns (uint256)',
    'function owner() view returns (address)',
    'event EcoActionLogged(uint256 indexed actionId, address indexed company, string title)',
    'event ActionVerified(uint256 indexed actionId, bool approved, uint256 credits)'
];

const COUNTER_ABI = [
	'function x() view returns (uint256)',
	'function inc()',
	'function incBy(uint256 by)'
];

const ACCESS_CONTROL_ABI = [
	'function hasRole(address account, uint8 role) view returns (bool)',
	'function roles(address account) view returns (uint8)',
	'function owner() view returns (address)'
];

const ECOLEDGER_OWNER_ABI = [
	'function owner() view returns (address)'
];

export interface EcoAction {
	id: number;
	title: string;
	description: string;
	estimatedCredits: number;
	location: string;
	verified: boolean;
	actualCredits: number;
	company: string;
}

export interface CarbonCreditBalance {
	balance: string;
	totalSupply: string;
}

export interface EcoBadge {
	id: number;
	uri: string;
	tier: string;
	name: string;
}

export enum UserRole {
	NONE = 0,
	ADMIN = 1,
	VERIFIER = 2,
	MODERATOR = 3,
	COMPANY = 4 // Regular company user (no special role)
}

class ContractService {
	private carbonCreditContract: ethers.Contract | null = null;
	private ecoBadgeContract: ethers.Contract | null = null;
	private ecoLedgerContract: ethers.Contract | null = null;
	private counterContract: ethers.Contract | null = null;
	private accessControlContract: ethers.Contract | null = null;

	constructor() {
		// Initialize contracts when wallet connects
		walletService.subscribe((state) => {
			if (state.isConnected && state.chainId) {
				this.initializeContracts();
			} else {
				this.clearContracts();
			}
		});
	}

	private initializeContracts() {
		const provider = walletService.getProvider();
		if (!provider) {
			console.warn('Provider not available, cannot initialize contracts');
			return;
		}

		console.log('Initializing contracts with provider...');
		console.log('Counter address:', CONTRACTS.COUNTER);

		if (CONTRACTS.CARBON_CREDIT_TOKEN) {
			this.carbonCreditContract = new ethers.Contract(
				CONTRACTS.CARBON_CREDIT_TOKEN,
				CARBON_CREDIT_ABI,
				provider
			);
		}

		if (CONTRACTS.ECO_BADGE_NFT) {
			this.ecoBadgeContract = new ethers.Contract(
				CONTRACTS.ECO_BADGE_NFT,
				ECO_BADGE_ABI,
				provider
			);
		}

		if (CONTRACTS.ECOLEDGER_CONTRACT) {
			this.ecoLedgerContract = new ethers.Contract(
				CONTRACTS.ECOLEDGER_CONTRACT,
				ECOLEDGER_ABI,
				provider
			);
		}

		if (CONTRACTS.COUNTER && CONTRACTS.COUNTER !== '0x0000000000000000000000000000000000000000') {
			this.counterContract = new ethers.Contract(
				CONTRACTS.COUNTER,
				COUNTER_ABI,
				provider
			);
			console.log('Counter contract initialized at:', CONTRACTS.COUNTER);
		} else {
			console.warn('Counter contract address not set or invalid');
		}

		if (CONTRACTS.ACCESS_CONTROL && CONTRACTS.ACCESS_CONTROL !== '0x0000000000000000000000000000000000000000') {
			this.accessControlContract = new ethers.Contract(
				CONTRACTS.ACCESS_CONTROL,
				ACCESS_CONTROL_ABI,
				provider
			);
			console.log('AccessControl contract initialized at:', CONTRACTS.ACCESS_CONTROL);
		} else {
			console.warn('AccessControl contract address not set or invalid');
		}
	}

	private clearContracts() {
		this.carbonCreditContract = null;
		this.ecoBadgeContract = null;
		this.ecoLedgerContract = null;
		this.counterContract = null;
		this.accessControlContract = null;
	}

	public async getCarbonCreditBalance(address: string): Promise<CarbonCreditBalance> {
		if (!this.carbonCreditContract) {
			throw new Error('Contract not initialized');
		}

		try {
			const [balance, totalSupply] = await Promise.all([
				this.carbonCreditContract.balanceOf(address),
				this.carbonCreditContract.totalSupply()
			]);

			return {
				balance: ethers.formatEther(balance),
				totalSupply: ethers.formatEther(totalSupply)
			};
		} catch (error) {
			console.error('Failed to get carbon credit balance:', error);
			throw error;
		}
	}

	public async getEcoBadges(address: string): Promise<EcoBadge[]> {
		if (!this.ecoBadgeContract) {
			throw new Error('Contract not initialized');
		}

		try {
			const balance = await this.ecoBadgeContract.balanceOf(address);
			const badgeCount = Number(balance);

			const badges: EcoBadge[] = [];
			for (let i = 0; i < badgeCount; i++) {
				const tokenId = await this.ecoBadgeContract.tokenOfOwnerByIndex(address, i);
				const uri = await this.ecoBadgeContract.tokenURI(tokenId);
				
				badges.push({
					id: Number(tokenId),
					uri,
					tier: 'gold', // This would be parsed from the URI metadata
					name: `Badge ${Number(tokenId)}`
				});
			}

			return badges;
		} catch (error) {
			console.error('Failed to get eco badges:', error);
			throw error;
		}
	}

	public async logEcoAction(
		title: string,
		description: string,
		estimatedCredits: number,
		location: string
	): Promise<number> {
		if (!this.ecoLedgerContract) {
			throw new Error('Contract not initialized');
		}

		const signer = walletService.getSigner();
		if (!signer) {
			throw new Error('Wallet not connected');
		}

		try {
			const contractWithSigner = this.ecoLedgerContract.connect(signer) as any;
			const tx = await contractWithSigner.logEcoAction(
				title,
				description,
				estimatedCredits,
				location
			);

			const receipt = await tx.wait();
			
			// Extract action ID from the event
			const event = receipt.logs.find(
				(log: any) => log.topics[0] === ethers.id('EcoActionLogged(uint256,address,string)')
			);
			
			if (event) {
				const actionId = Number(event.topics[1]);
				return actionId;
			}

			throw new Error('Failed to get action ID from transaction');
		} catch (error) {
			console.error('Failed to log eco action:', error);
			throw error;
		}
	}

	public async getEcoAction(actionId: number): Promise<EcoAction> {
		if (!this.ecoLedgerContract) {
			throw new Error('Contract not initialized');
		}

		try {
			const action = await this.ecoLedgerContract.getAction(actionId);
			
			return {
				id: actionId,
				title: action[0],
				description: action[1],
				estimatedCredits: Number(action[2]),
				location: action[3],
				verified: action[4],
				actualCredits: Number(action[5]),
				company: 'Current User' // This would be resolved from the contract
			};
		} catch (error) {
			console.error('Failed to get eco action:', error);
			throw error;
		}
	}

	public async transferCarbonCredits(to: string, amount: string): Promise<string> {
		if (!this.carbonCreditContract) {
			throw new Error('Contract not initialized');
		}

		const signer = walletService.getSigner();
		if (!signer) {
			throw new Error('Wallet not connected');
		}

		try {
			const contractWithSigner = this.carbonCreditContract.connect(signer) as any;
			const tx = await contractWithSigner.transfer(to, ethers.parseEther(amount));
			
			await tx.wait();
			return tx.hash;
		} catch (error) {
			console.error('Failed to transfer carbon credits:', error);
			throw error;
		}
	}

	// Mock functions for development (remove when contracts are deployed)
	public async mockGetCarbonCreditBalance(address: string): Promise<CarbonCreditBalance> {
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		return {
			balance: '2450.0',
			totalSupply: '100000.0'
		};
	}

	public async mockGetEcoBadges(address: string): Promise<EcoBadge[]> {
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		return [
			{ id: 1, uri: 'ipfs://...', tier: 'bronze', name: 'Tree Planter' },
			{ id: 2, uri: 'ipfs://...', tier: 'gold', name: 'Solar Pioneer' },
			{ id: 3, uri: 'ipfs://...', tier: 'silver', name: 'Waste Warrior' }
		];
	}

	public async mockLogEcoAction(
		title: string,
		description: string,
		estimatedCredits: number,
		location: string
	): Promise<number> {
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		// Return a mock action ID
		return Math.floor(Math.random() * 1000) + 1;
	}

	// Counter helpers
	public async getCounter(): Promise<number> {
		const counterAddress = CONTRACTS.COUNTER;
		if (!counterAddress || counterAddress === '0x0000000000000000000000000000000000000000') {
			throw new Error('Counter contract address not set. Please set VITE_COUNTER_ADDRESS in your .env.local file.');
		}

		const provider = walletService.getProvider();
		if (!provider) {
			throw new Error('Wallet provider not available. Please connect your wallet.');
		}

		// Create a fresh contract instance to ensure we're using the current provider
		const counterContract = new ethers.Contract(
			counterAddress,
			COUNTER_ABI,
			provider
		);

		try {
			// First, verify the contract has code at this address
			const code = await provider.getCode(counterAddress);
			if (!code || code === '0x') {
				throw new Error(`No contract found at address ${counterAddress}. Make sure the contract is deployed and you're on the correct network.`);
			}

			console.log('Reading counter from address:', counterAddress);
			const value = await counterContract.x();
			const numValue = Number(value);
			console.log('Counter value read successfully:', numValue);
			return numValue;
		} catch (error: any) {
			console.error('Error reading counter:', error);
			if (error?.code === 'CALL_EXCEPTION' || error?.code === 'BAD_DATA') {
				throw new Error(`Failed to read counter. The contract might not exist at address ${counterAddress}, you might be on the wrong network, or the contract ABI might be incorrect.`);
			}
			throw new Error(`Failed to read counter: ${error?.message || 'Unknown error'}`);
		}
	}

	public async incrementCounter(by?: number): Promise<string> {
		const counterAddress = CONTRACTS.COUNTER;
		if (!counterAddress || counterAddress === '0x0000000000000000000000000000000000000000') {
			throw new Error('Counter contract address not set. Please set VITE_COUNTER_ADDRESS in your .env.local file.');
		}

		const signer = walletService.getSigner();
		if (!signer) {
			throw new Error('Wallet not connected');
		}

		// Create a fresh contract instance with the signer
		const counterContract = new ethers.Contract(
			counterAddress,
			COUNTER_ABI,
			signer
		);

		try {
			const tx = by && by > 0 ? await counterContract.incBy(by) : await counterContract.inc();
			const receipt = await tx.wait();
			if (!receipt) {
				throw new Error('Transaction failed');
			}
			console.log('Counter incremented successfully. Transaction hash:', tx.hash);
			return tx.hash as string;
		} catch (error: any) {
			console.error('Error incrementing counter:', error);
			throw error;
		}
	}

	// Role checking functions
	public async getUserRole(address: string): Promise<UserRole> {
		// First check AccessControl if available
		if (this.accessControlContract && CONTRACTS.ACCESS_CONTROL) {
			try {
				const adminRole = await this.accessControlContract.hasRole(address, UserRole.ADMIN);
				if (adminRole) return UserRole.ADMIN;
				
				const verifierRole = await this.accessControlContract.hasRole(address, UserRole.VERIFIER);
				if (verifierRole) return UserRole.VERIFIER;
				
				const moderatorRole = await this.accessControlContract.hasRole(address, UserRole.MODERATOR);
				if (moderatorRole) return UserRole.MODERATOR;
			} catch (error) {
				console.warn('Error checking AccessControl roles:', error);
			}
		}

		// Fallback: Check if user is owner of EcoLedger (for backward compatibility)
		if (this.ecoLedgerContract && CONTRACTS.ECOLEDGER_CONTRACT) {
			try {
				const ledgerContract = new ethers.Contract(
					CONTRACTS.ECOLEDGER_CONTRACT,
					ECOLEDGER_OWNER_ABI,
					walletService.getProvider()
				);
				const owner = await ledgerContract.owner();
				if (owner.toLowerCase() === address.toLowerCase()) {
					return UserRole.ADMIN; // Owner is treated as admin
				}
			} catch (error) {
				console.warn('Error checking EcoLedger owner:', error);
			}
		}

		return UserRole.COMPANY; // Default to company role
	}

	public async isAdmin(address: string): Promise<boolean> {
		const role = await this.getUserRole(address);
		return role === UserRole.ADMIN;
	}

	public async isVerifier(address: string): Promise<boolean> {
		const role = await this.getUserRole(address);
		return role === UserRole.ADMIN || role === UserRole.VERIFIER;
	}

	// Get all actions (for admin dashboard)
	public async getAllActions(): Promise<EcoAction[]> {
		if (!this.ecoLedgerContract) {
			throw new Error('EcoLedger contract not initialized');
		}

		try {
			// We need to get actionCount first, but it's not in the ABI
			// For now, we'll need to add it or use events
			// This is a simplified version - in production, you'd query events
			const actions: EcoAction[] = [];
			
			// Try to get actionCount if available
			try {
				const actionCountContract = new ethers.Contract(
					CONTRACTS.ECOLEDGER_CONTRACT,
					ECOLEDGER_ABI,
					walletService.getProvider()
				);
				const count = await actionCountContract.actionCount();
				const countNum = Number(count);

				// Fetch all actions
				for (let i = 1; i <= countNum; i++) {
					try {
						const action = await this.getEcoAction(i);
						actions.push(action);
					} catch (error) {
						// Action might not exist, skip
						console.warn(`Action ${i} not found`);
					}
				}
			} catch (error) {
				console.warn('Could not get actionCount, returning empty array');
			}

			return actions;
		} catch (error: any) {
			console.error('Error getting all actions:', error);
			throw new Error(`Failed to get actions: ${error?.message || 'Unknown error'}`);
		}
	}

	// Verify action (admin/verifier only)
	public async verifyAction(actionId: number, approved: boolean, actualCredits: number): Promise<string> {
		if (!this.ecoLedgerContract) {
			throw new Error('EcoLedger contract not initialized');
		}

		const signer = walletService.getSigner();
		if (!signer) {
			throw new Error('Wallet not connected');
		}

		const address = await signer.getAddress();
		const isAdminOrVerifier = await this.isVerifier(address);
		if (!isAdminOrVerifier) {
			throw new Error('Only admins and verifiers can verify actions');
		}

		try {
			const contractWithSigner = this.ecoLedgerContract.connect(signer) as any;
			const tx = await contractWithSigner.verifyAction(actionId, approved, actualCredits);
			const receipt = await tx.wait();
			if (!receipt) {
				throw new Error('Transaction failed');
			}
			console.log('Action verified successfully. Transaction hash:', tx.hash);
			return tx.hash as string;
		} catch (error: any) {
			console.error('Error verifying action:', error);
			throw error;
		}
	}
}

// Create singleton instance
export const contractService = new ContractService();
