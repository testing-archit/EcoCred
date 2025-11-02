import { ethers } from 'ethers';
import { walletService } from './wallet';

// Contract addresses (read from env)
const CONTRACTS = {
    CARBON_CREDIT_TOKEN: import.meta.env.VITE_CARBON_CREDIT_TOKEN as string,
    ECO_BADGE_NFT: import.meta.env.VITE_ECO_BADGE_NFT as string,
    ECOLEDGER_CONTRACT: import.meta.env.VITE_ECOLEDGER_CONTRACT as string,
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
    'event EcoActionLogged(uint256 indexed actionId, address indexed company, string title)',
    'event ActionVerified(uint256 indexed actionId, bool approved, uint256 credits)'
];

const COUNTER_ABI = [
	'function x() view returns (uint256)',
	'function inc()',
	'function incBy(uint256 by)'
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

class ContractService {
	private carbonCreditContract: ethers.Contract | null = null;
	private ecoBadgeContract: ethers.Contract | null = null;
	private ecoLedgerContract: ethers.Contract | null = null;
	private counterContract: ethers.Contract | null = null;

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
		if (!provider) return;

		this.carbonCreditContract = new ethers.Contract(
			CONTRACTS.CARBON_CREDIT_TOKEN,
			CARBON_CREDIT_ABI,
			provider
		);

		this.ecoBadgeContract = new ethers.Contract(
			CONTRACTS.ECO_BADGE_NFT,
			ECO_BADGE_ABI,
			provider
		);

		this.ecoLedgerContract = new ethers.Contract(
			CONTRACTS.ECOLEDGER_CONTRACT,
			ECOLEDGER_ABI,
			provider
		);

		this.counterContract = new ethers.Contract(
			CONTRACTS.COUNTER,
			COUNTER_ABI,
			provider
		);
	}

	private clearContracts() {
		this.carbonCreditContract = null;
		this.ecoBadgeContract = null;
		this.ecoLedgerContract = null;
		this.counterContract = null;
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
		if (!this.counterContract) {
			throw new Error('Contract not initialized');
		}
		const value = await this.counterContract.x();
		return Number(value);
	}

	public async incrementCounter(by?: number): Promise<string> {
		if (!this.counterContract) {
			throw new Error('Contract not initialized');
		}
		const signer = walletService.getSigner();
		if (!signer) {
			throw new Error('Wallet not connected');
		}
		const contractWithSigner = this.counterContract.connect(signer) as any;
		const tx = by && by > 0 ? await contractWithSigner.incBy(by) : await contractWithSigner.inc();
		await tx.wait();
		return tx.hash as string;
	}
}

// Create singleton instance
export const contractService = new ContractService();
