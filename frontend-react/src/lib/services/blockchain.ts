import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contract-addresses';
import { walletService } from './wallet';

// Contract ABIs (simplified - in production, import from artifacts)
// These are minimal ABIs for the functions we need
const CARBON_CREDIT_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function burn(uint256 amount)",
  "function burnFrom(address from, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const ECOLEDGER_V2_ABI = [
  "function logEcoAction(string memory title, string memory description, uint256 estimatedCredits, string memory location, string memory category) returns (uint256)",
  "function verifyAction(uint256 actionId, bool approved, uint256 actualCredits)",
  "function getAction(uint256 actionId) view returns (address company, string memory title, string memory description, uint256 estimatedCredits, string memory location, bool verified, uint256 actualCredits, uint256 verificationCount, uint256 timestamp, string memory category)",
  "function getCompanyProfile(address company) view returns (uint256 totalCreditsEarned, uint256 totalActions, uint256 verifiedActions, uint256 reputationScore, bool isVerified)",
  "function actionCount() view returns (uint256)",
  "event EcoActionLogged(uint256 indexed actionId, address indexed company, string title, string category)",
  "event ActionVerified(uint256 indexed actionId, address indexed verifier, bool approved, uint256 actualCredits)",
  "event ActionFullyVerified(uint256 indexed actionId, uint256 actualCredits)",
];

const MARKETPLACE_ABI = [
  "function createListing(uint256 amount, uint256 pricePerCredit) returns (uint256)",
  "function purchase(uint256 listingId, uint256 amount) payable",
  "function cancelListing(uint256 listingId)",
  "function getListing(uint256 listingId) view returns (address seller, uint256 amount, uint256 pricePerCredit, bool active, uint256 timestamp)",
  "function listingCount() view returns (uint256)",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerCredit)",
  "event PurchaseExecuted(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice)",
];

const STAKING_ABI = [
  "function stake(uint256 amount, uint256 lockPeriodInDays)",
  "function unstake(uint256 stakeIndex)",
  "function getStake(address user, uint256 index) view returns (uint256 amount, uint256 timestamp, uint256 lockPeriod, bool isLocked, uint256 pendingReward)",
  "function getStakeCount(address user) view returns (uint256)",
  "function totalStaked(address user) view returns (uint256)",
  "function calculateReward((uint256 amount, uint256 timestamp, uint256 lockPeriod, bool isLocked) stakeData) view returns (uint256)",
  "event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockPeriod)",
  "event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 reward)",
];

const RETIREMENT_ABI = [
  "function retireCredits(uint256 amount, string memory reason, string memory certificateId) returns (uint256)",
  "function getRetirement(uint256 retirementId) view returns (address retirer, uint256 amount, string memory reason, string memory certificateId, uint256 timestamp, bool verified)",
  "function getUserRetirements(address user) view returns (uint256[] memory)",
  "function getTotalRetiredByUser(address user) view returns (uint256)",
  "function totalRetired() view returns (uint256)",
  "event CreditsRetired(uint256 indexed retirementId, address indexed retirer, uint256 amount, string reason, string certificateId)",
];

const EXPIRATION_ABI = [
  "function checkAndExpire(address holder) returns (uint256)",
  "function getExpirationStatus(address holder) view returns (uint256 totalBatches, uint256 activeBatches, uint256 expiredBatches, uint256 totalExpiredAmount, uint256 nextExpirationTimestamp)",
  "function getCreditBatch(address holder, uint256 batchIndex) view returns (uint256 amount, uint256 mintTimestamp, uint256 expirationTimestamp, bool expired, bool canExpire)",
];

const BATCH_OPERATIONS_ABI = [
  "function batchTransfer(address[] memory recipients, uint256[] memory amounts)",
  "function batchLogActions(string[] memory titles, string[] memory descriptions, uint256[] memory estimatedCredits, string[] memory locations, string[] memory categories) returns (uint256[] memory)",
  "function batchCreateListings(uint256[] memory amounts, uint256[] memory prices) returns (uint256[] memory)",
  "function batchStake(uint256[] memory amounts, uint256[] memory lockPeriods)",
  "function batchUnstake(uint256[] memory stakeIndices)",
];

const ANALYTICS_ABI = [
  "function getPlatformStats() view returns ((uint256 totalActions, uint256 verifiedActions, uint256 totalCreditsMinted, uint256 totalCreditsRetired, uint256 totalCreditsStaked, uint256 totalMarketplaceVolume, uint256 activeCompanies, uint256 totalBadgesMinted))",
  "function getCompanyAnalytics(address company) view returns ((uint256 totalCredits, uint256 stakedCredits, uint256 retiredCredits, uint256 marketplaceSales, uint256 reputationScore, uint256 totalActions, uint256 verifiedActions, uint256 badges))",
  "function getCreditDistribution() view returns (uint256 totalSupply, uint256 totalStaked, uint256 totalRetired, uint256 circulatingSupply)",
  "function getActionStats() view returns (uint256 totalActions, uint256 verifiedActions, uint256 pendingActions)",
];

const ECO_BADGE_NFT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function ownerOf(uint256 id) view returns (address)",
  "function tokenURI(uint256 id) view returns (string)",
  "function tokenOfOwnerByIndex(address owner_, uint256 index) view returns (uint256)",
  "function safeMint(address to) returns (uint256)",
  "function transferFrom(address from, address to, uint256 id)",
  "function approve(address spender, uint256 id)",
  "function getApproved(uint256 id) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed id)",
];

const GOVERNANCE_ABI = [
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (address proposer, string memory description, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool executed, bytes memory data, address target)",
  "function hasVoted(uint256, address) view returns (bool)",
  "function votingPower(uint256, address) view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function quorumThreshold() view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function createProposal(string calldata description, address target, bytes calldata data) returns (uint256)",
  "function vote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  "function getProposal(uint256 proposalId) view returns (address proposer, string memory description, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool executed)",
  "event ProposalCreated(uint256 indexed proposalId, address proposer, string description)",
  "event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 votes)",
  "event ProposalExecuted(uint256 indexed proposalId)",
];

const LEADERBOARD_ABI = [
  "function topCompanies(uint256) view returns (address)",
  "function topCount() view returns (uint256)",
  "function getTopCompanies(uint256 limit) view returns ((address company, uint256 totalCredits, uint256 reputationScore, uint256 rank)[])",
  "function getCompanyRank(address company) view returns (uint256)",
  "function updateLeaderboard(address company)",
  "event LeaderboardUpdated(address indexed company, uint256 rank, uint256 credits)",
];

class BlockchainService {
  private getProvider(): ethers.BrowserProvider {
    const provider = walletService.getProvider();
    if (!provider) {
      throw new Error('Wallet not connected');
    }
    return provider;
  }

  private async getSigner(): Promise<ethers.JsonRpcSigner> {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    return signer;
  }

  // Carbon Credit Token
  async getTokenBalance(address: string): Promise<string> {
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CARBON_CREDIT_TOKEN, CARBON_CREDIT_TOKEN_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async transferTokens(to: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CARBON_CREDIT_TOKEN, CARBON_CREDIT_TOKEN_ABI, signer);
    return contract.transfer(to, ethers.parseEther(amount));
  }

  async approveTokens(spender: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CARBON_CREDIT_TOKEN, CARBON_CREDIT_TOKEN_ABI, signer);
    return contract.approve(spender, ethers.parseEther(amount));
  }

  async burnTokens(amount: string): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CARBON_CREDIT_TOKEN, CARBON_CREDIT_TOKEN_ABI, signer);
    return contract.burn(ethers.parseEther(amount));
  }

  // EcoLedger V2
  async logEcoAction(title: string, description: string, estimatedCredits: number, location: string, category: string): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECOLEDGER_CONTRACT, ECOLEDGER_V2_ABI, signer);
    return contract.logEcoAction(title, description, estimatedCredits, location, category);
  }

  async getAction(actionId: number) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECOLEDGER_CONTRACT, ECOLEDGER_V2_ABI, provider);
    return contract.getAction(actionId);
  }

  async getCompanyProfile(companyAddress: string) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECOLEDGER_CONTRACT, ECOLEDGER_V2_ABI, provider);
    return contract.getCompanyProfile(companyAddress);
  }

  async verifyAction(actionId: number, approved: boolean, actualCredits: number): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECOLEDGER_CONTRACT, ECOLEDGER_V2_ABI, signer);
    // Credits are passed as regular numbers, contract converts to wei when minting
    return contract.verifyAction(actionId, approved, approved ? BigInt(actualCredits) : 0);
  }

  // Marketplace
  async createListing(amount: string, pricePerCredit: string): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, signer);
    return contract.createListing(ethers.parseEther(amount), ethers.parseEther(pricePerCredit));
  }

  async purchaseListing(listingId: number, amount: string, pricePerCredit: string): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, signer);
    const totalPrice = BigInt(ethers.parseEther(amount).toString()) * BigInt(ethers.parseEther(pricePerCredit).toString());
    return contract.purchase(listingId, ethers.parseEther(amount), { value: totalPrice });
  }

  async getListing(listingId: number) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, provider);
    return contract.getListing(listingId);
  }

  // Staking
  async stakeCredits(amount: string, lockPeriodDays: number): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, signer);
    return contract.stake(ethers.parseEther(amount), lockPeriodDays);
  }

  async unstakeCredits(stakeIndex: number): Promise<ethers.ContractTransactionResponse> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, signer);
    return contract.unstake(stakeIndex);
  }

  async getStake(userAddress: string, stakeIndex: number) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, provider);
    return contract.getStake(userAddress, stakeIndex);
  }

  async getStakeCount(userAddress: string): Promise<number> {
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, provider);
    return Number(await contract.getStakeCount(userAddress));
  }

  // Credit Retirement
  async retireCredits(amount: string, reason: string, certificateId: string): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.CREDIT_RETIREMENT) {
      throw new Error('Credit Retirement contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CREDIT_RETIREMENT, RETIREMENT_ABI, signer);
    return contract.retireCredits(ethers.parseEther(amount), reason, certificateId);
  }

  async getRetirement(retirementId: number) {
    if (!CONTRACT_ADDRESSES.CREDIT_RETIREMENT) {
      throw new Error('Credit Retirement contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CREDIT_RETIREMENT, RETIREMENT_ABI, provider);
    return contract.getRetirement(retirementId);
  }

  async getUserRetirements(userAddress: string): Promise<number[]> {
    if (!CONTRACT_ADDRESSES.CREDIT_RETIREMENT) {
      throw new Error('Credit Retirement contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CREDIT_RETIREMENT, RETIREMENT_ABI, provider);
    const retirements = await contract.getUserRetirements(userAddress);
    return retirements.map((id: bigint) => Number(id));
  }

  // Credit Expiration
  async checkAndExpire(holderAddress: string): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.CREDIT_EXPIRATION) {
      throw new Error('Credit Expiration contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CREDIT_EXPIRATION, EXPIRATION_ABI, signer);
    return contract.checkAndExpire(holderAddress);
  }

  async getExpirationStatus(holderAddress: string) {
    if (!CONTRACT_ADDRESSES.CREDIT_EXPIRATION) {
      throw new Error('Credit Expiration contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.CREDIT_EXPIRATION, EXPIRATION_ABI, provider);
    return contract.getExpirationStatus(holderAddress);
  }

  // Batch Operations
  async batchTransfer(recipients: string[], amounts: string[]): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.BATCH_OPERATIONS) {
      throw new Error('Batch Operations contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.BATCH_OPERATIONS, BATCH_OPERATIONS_ABI, signer);
    const amountsParsed = amounts.map(amt => ethers.parseEther(amt));
    return contract.batchTransfer(recipients, amountsParsed);
  }

  async batchLogActions(titles: string[], descriptions: string[], estimatedCredits: number[], locations: string[], categories: string[]): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.BATCH_OPERATIONS) {
      throw new Error('Batch Operations contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.BATCH_OPERATIONS, BATCH_OPERATIONS_ABI, signer);
    return contract.batchLogActions(titles, descriptions, estimatedCredits, locations, categories);
  }

  // Analytics
  async getPlatformStats() {
    if (!CONTRACT_ADDRESSES.ANALYTICS) {
      throw new Error('Analytics contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ANALYTICS, ANALYTICS_ABI, provider);
    return contract.getPlatformStats();
  }

  async getCompanyAnalytics(companyAddress: string) {
    if (!CONTRACT_ADDRESSES.ANALYTICS) {
      throw new Error('Analytics contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ANALYTICS, ANALYTICS_ABI, provider);
    return contract.getCompanyAnalytics(companyAddress);
  }

  async getCreditDistribution() {
    if (!CONTRACT_ADDRESSES.ANALYTICS) {
      throw new Error('Analytics contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ANALYTICS, ANALYTICS_ABI, provider);
    return contract.getCreditDistribution();
  }

  // EcoBadge NFT
  async getBadgeBalance(ownerAddress: string): Promise<number> {
    if (!CONTRACT_ADDRESSES.ECO_BADGE_NFT) {
      throw new Error('EcoBadge NFT contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECO_BADGE_NFT, ECO_BADGE_NFT_ABI, provider);
    const balance = await contract.balanceOf(ownerAddress);
    return Number(balance);
  }

  async getBadgeTokenId(ownerAddress: string, index: number): Promise<number> {
    if (!CONTRACT_ADDRESSES.ECO_BADGE_NFT) {
      throw new Error('EcoBadge NFT contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECO_BADGE_NFT, ECO_BADGE_NFT_ABI, provider);
    const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, index);
    return Number(tokenId);
  }

  async getBadgeTokenURI(tokenId: number): Promise<string> {
    if (!CONTRACT_ADDRESSES.ECO_BADGE_NFT) {
      throw new Error('EcoBadge NFT contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECO_BADGE_NFT, ECO_BADGE_NFT_ABI, provider);
    return contract.tokenURI(tokenId);
  }

  async getBadgeOwner(tokenId: number): Promise<string> {
    if (!CONTRACT_ADDRESSES.ECO_BADGE_NFT) {
      throw new Error('EcoBadge NFT contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.ECO_BADGE_NFT, ECO_BADGE_NFT_ABI, provider);
    return contract.ownerOf(tokenId);
  }

  // Governance
  async getProposalCount(): Promise<number> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, provider);
    const count = await contract.proposalCount();
    return Number(count);
  }

  async getProposal(proposalId: number) {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, provider);
    return contract.getProposal(proposalId);
  }

  async createProposal(description: string, target: string, data: string): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, signer);
    const dataBytes = data ? ethers.toUtf8Bytes(data) : '0x';
    return contract.createProposal(description, target, dataBytes);
  }

  async voteOnProposal(proposalId: number, support: boolean): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, signer);
    return contract.vote(proposalId, support);
  }

  async executeProposal(proposalId: number): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const signer = await this.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, signer);
    return contract.executeProposal(proposalId);
  }

  async hasVoted(proposalId: number, voterAddress: string): Promise<boolean> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, provider);
    return contract.hasVoted(proposalId, voterAddress);
  }

  async getVotingPeriod(): Promise<number> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, provider);
    const period = await contract.votingPeriod();
    return Number(period);
  }

  async getQuorumThreshold(): Promise<string> {
    if (!CONTRACT_ADDRESSES.GOVERNANCE) {
      throw new Error('Governance contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, provider);
    const threshold = await contract.quorumThreshold();
    return ethers.formatEther(threshold);
  }

  // Leaderboard
  async getTopCompanies(limit: number) {
    if (!CONTRACT_ADDRESSES.LEADERBOARD) {
      throw new Error('Leaderboard contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.LEADERBOARD, LEADERBOARD_ABI, provider);
    return contract.getTopCompanies(limit);
  }

  async getCompanyRank(companyAddress: string): Promise<number> {
    if (!CONTRACT_ADDRESSES.LEADERBOARD) {
      throw new Error('Leaderboard contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.LEADERBOARD, LEADERBOARD_ABI, provider);
    const rank = await contract.getCompanyRank(companyAddress);
    return Number(rank);
  }

  async getTopCount(): Promise<number> {
    if (!CONTRACT_ADDRESSES.LEADERBOARD) {
      throw new Error('Leaderboard contract not deployed');
    }
    const provider = this.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.LEADERBOARD, LEADERBOARD_ABI, provider);
    const count = await contract.topCount();
    return Number(count);
  }
}

export const blockchainService = new BlockchainService();

