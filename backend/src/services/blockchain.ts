import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { getContractAddresses } from '../config/contract-addresses.js';

// Contract ABIs (simplified - import full ABIs in production)
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function totalSupply() view returns (uint256)'
];

const ECOLEDGER_ABI = [
    'event ActionLogged(uint256 indexed actionId, address indexed company, string actionType, uint256 quantity)',
    'event ActionVerified(uint256 indexed actionId, address indexed verifier, bool approved, uint256 creditsAwarded)',
    'function getCompanyCredits(address company) view returns (uint256)',
    'function getCompanyReputation(address company) view returns (uint256)'
];

interface ContractAddresses {
    carbonCreditToken?: string;
    ecoBadgeNFT?: string;
    ecoLedgerV2?: string;
    marketplace?: string;
    staking?: string;
    governance?: string;
    leaderboard?: string;
}

class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private contracts: ContractAddresses;

    constructor() {
        // Auto-detect contract addresses from deployment artifacts - No .env needed!
        const deployedAddresses = getContractAddresses(31337); // Default to local Hardhat network
        
        const rpcUrl = 'http://localhost:8545'; // Hardhat local network
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        this.contracts = {
            // All addresses are automatically detected from deployment artifacts
            carbonCreditToken: deployedAddresses.carbonCreditToken,
            ecoBadgeNFT: deployedAddresses.ecoBadgeNFT,
            ecoLedgerV2: deployedAddresses.ecoLedgerV2,
            marketplace: deployedAddresses.marketplace,
            staking: deployedAddresses.staking,
            governance: deployedAddresses.governance,
            leaderboard: deployedAddresses.leaderboard
        };
        
        logger.info('✅ Contract addresses auto-detected from deployment artifacts');
    }

    // Get company's carbon credit balance
    async getCreditBalance(walletAddress: string): Promise<number> {
        try {
            if (!this.contracts.carbonCreditToken) {
                logger.warn('Carbon Credit Token contract address not configured');
                return 0;
            }

            const contract = new ethers.Contract(
                this.contracts.carbonCreditToken,
                ERC20_ABI,
                this.provider
            );

            const balance = await contract.balanceOf(walletAddress);
            return Number(balance);
        } catch (error) {
            logger.error('Error fetching credit balance:', error);
            return 0;
        }
    }

    // Get company's reputation score
    async getReputation(walletAddress: string): Promise<number> {
        try {
            if (!this.contracts.ecoLedgerV2) {
                logger.warn('EcoLedger V2 contract address not configured');
                return 0;
            }

            const contract = new ethers.Contract(
                this.contracts.ecoLedgerV2,
                ECOLEDGER_ABI,
                this.provider
            );

            const reputation = await contract.getCompanyReputation(walletAddress);
            return Number(reputation);
        } catch (error) {
            logger.error('Error fetching reputation:', error);
            return 0;
        }
    }

    // Listen to blockchain events
    async startEventListener() {
        if (!this.contracts.ecoLedgerV2) {
            logger.warn('Cannot start event listener: EcoLedger V2 address not configured');
            return;
        }

        const contract = new ethers.Contract(
            this.contracts.ecoLedgerV2,
            ECOLEDGER_ABI,
            this.provider
        );

        // Listen for ActionLogged events
        contract.on('ActionLogged', (actionId, company, actionType, quantity, event) => {
            logger.info('ActionLogged event:', {
                actionId: actionId.toString(),
                company,
                actionType,
                quantity: quantity.toString(),
                txHash: event.log.transactionHash
            });
        });

        // Listen for ActionVerified events
        contract.on('ActionVerified', (actionId, verifier, approved, creditsAwarded, event) => {
            logger.info('ActionVerified event:', {
                actionId: actionId.toString(),
                verifier,
                approved,
                creditsAwarded: creditsAwarded.toString(),
                txHash: event.log.transactionHash
            });
        });

        logger.info('Blockchain event listener started');
    }

    // Get transaction receipt
    async getTransactionReceipt(txHash: string) {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            return receipt;
        } catch (error) {
            logger.error('Error fetching transaction receipt:', error);
            return null;
        }
    }

    // Verify transaction was successful
    async verifyTransaction(txHash: string): Promise<boolean> {
        const receipt = await this.getTransactionReceipt(txHash);
        return receipt?.status === 1;
    }
}

export const blockchainService = new BlockchainService();
