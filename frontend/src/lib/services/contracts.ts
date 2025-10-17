import { ethers } from 'ethers';
import { walletService } from './wallet';

// Contract addresses (these would be deployed contract addresses)
const CONTRACTS = {
	CARBON_CREDIT_TOKEN: '0x...', // Replace with actual deployed contract address
	ECO_BADGE_NFT: '0x...', // Replace with actual deployed contract address
	ECOLEDGER_CONTRACT: '0x...' // Replace with actual deployed contract address
};

// Contract ABIs (simplified - replace with actual ABIs)
const CARBON_CREDIT_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function totalSupply() view returns (uint256)',
	'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const ECO_BADGE_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function safeMint(address to, string memory uri)',
	'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

const ECOLEDGER_ABI = [
	'function logEcoAction(string memory title, string memory description, uint256 estimatedCredits, string memory location) returns (uint256)',
	'function verifyAction(uint256 actionId, bool approved, uint256 actualCredits)',
	'function mintCarbonCredits(address to, uint256 amount)',
	'function getAction(uint256 actionId) view returns (string memory, string memory, uint256, string memory, bool, uint256)',
	'event EcoActionLogged(uint256 indexed actionId, address indexed company, string title)',
	'event ActionVerified(uint256 indexed actionId, bool approved, uint256 credits)'
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
	}

	private clearContracts() {
		this.carbonCreditContract = null;
		this.ecoBadgeContract = null;
		this.ecoLedgerContract = null;
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
}

// Create singleton instance
export const contractService = new ContractService();
