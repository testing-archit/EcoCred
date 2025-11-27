import { useState, useCallback } from 'react';
import { blockchainService } from '../lib/services/blockchain';
import { useWallet } from '../contexts/WalletContext';
import { useNotifications } from '../contexts/NotificationContext';

export function useBlockchain() {
  const { address, isConnected } = useWallet();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleTransaction = useCallback(async <T,>(
    transactionFn: () => Promise<T>,
    successMessage: string,
    errorMessage: string = 'Transaction failed'
  ): Promise<T | null> => {
    if (!isConnected || !address) {
      addNotification('error', 'Please connect your wallet');
      return null;
    }

    setLoading(true);
    try {
      const result = await transactionFn();
      addNotification('success', successMessage);
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      const ethersError = error as { reason?: string; message?: string };
      const message = ethersError.reason || ethersError.message || errorMessage;
      addNotification('error', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, addNotification]);

  // Token operations
  const getTokenBalance = useCallback(async (userAddress?: string) => {
    if (!userAddress && !address) return '0';
    try {
      return await blockchainService.getTokenBalance(userAddress || address!);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }, [address]);

  const transferTokens = useCallback(async (to: string, amount: string) => {
    return handleTransaction(
      () => blockchainService.transferTokens(to, amount),
      `Successfully transferred ${amount} tokens`,
      'Token transfer failed'
    );
  }, [handleTransaction]);

  const burnTokens = useCallback(async (amount: string) => {
    return handleTransaction(
      () => blockchainService.burnTokens(amount),
      `Successfully burned ${amount} tokens`,
      'Token burn failed'
    );
  }, [handleTransaction]);

  // EcoLedger operations
  const logEcoAction = useCallback(async (
    title: string,
    description: string,
    estimatedCredits: number,
    location: string,
    category: string
  ) => {
    if (!isConnected || !address) {
      addNotification('error', 'Please connect your wallet');
      return null;
    }

    setLoading(true);
    try {
      const tx = await blockchainService.logEcoAction(title, description, estimatedCredits, location, category);
      // Return the transaction object directly (not wrapped in handleTransaction)
      return tx;
    } catch (error) {
      console.error('Transaction error:', error);
      const ethersError = error as { reason?: string; message?: string };
      const message = ethersError.reason || ethersError.message || 'Failed to log eco action';
      addNotification('error', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, addNotification]);

  const getAction = useCallback(async (actionId: number) => {
    try {
      return await blockchainService.getAction(actionId);
    } catch (error) {
      console.error('Failed to get action:', error);
      return null;
    }
  }, []);

  const getCompanyProfile = useCallback(async (companyAddress?: string) => {
    if (!companyAddress && !address) return null;
    try {
      return await blockchainService.getCompanyProfile(companyAddress || address!);
    } catch (error) {
      console.error('Failed to get company profile:', error);
      return null;
    }
  }, [address]);

  const verifyAction = useCallback(async (
    actionId: number,
    approved: boolean,
    actualCredits: number
  ) => {
    if (!isConnected || !address) {
      addNotification('error', 'Please connect your wallet');
      return null;
    }

    setLoading(true);
    try {
      const tx = await blockchainService.verifyAction(actionId, approved, actualCredits);
      return tx;
    } catch (error) {
      console.error('Transaction error:', error);
      const ethersError = error as { reason?: string; message?: string };
      const message = ethersError.reason || ethersError.message || 'Failed to verify action';
      addNotification('error', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, addNotification]);

  // Marketplace operations
  const createListing = useCallback(async (amount: string, pricePerCredit: string) => {
    return handleTransaction(
      () => blockchainService.createListing(amount, pricePerCredit),
      'Listing created successfully',
      'Failed to create listing'
    );
  }, [handleTransaction]);

  const purchaseListing = useCallback(async (listingId: number, amount: string, pricePerCredit: string) => {
    return handleTransaction(
      () => blockchainService.purchaseListing(listingId, amount, pricePerCredit),
      'Purchase successful',
      'Purchase failed'
    );
  }, [handleTransaction]);

  const getListing = useCallback(async (listingId: number) => {
    try {
      return await blockchainService.getListing(listingId);
    } catch (error) {
      console.error('Failed to get listing:', error);
      return null;
    }
  }, []);

  // Staking operations
  const stakeCredits = useCallback(async (amount: string, lockPeriodDays: number) => {
    return handleTransaction(
      () => blockchainService.stakeCredits(amount, lockPeriodDays),
      `Successfully staked ${amount} credits for ${lockPeriodDays} days`,
      'Staking failed'
    );
  }, [handleTransaction]);

  const unstakeCredits = useCallback(async (stakeIndex: number) => {
    return handleTransaction(
      () => blockchainService.unstakeCredits(stakeIndex),
      'Successfully unstaked credits',
      'Unstaking failed'
    );
  }, [handleTransaction]);

  const getStake = useCallback(async (userAddress: string, stakeIndex: number) => {
    try {
      return await blockchainService.getStake(userAddress, stakeIndex);
    } catch (error) {
      console.error('Failed to get stake:', error);
      return null;
    }
  }, []);

  // Retirement operations
  const retireCredits = useCallback(async (amount: string, reason: string, certificateId: string) => {
    return handleTransaction(
      () => blockchainService.retireCredits(amount, reason, certificateId),
      `Successfully retired ${amount} credits`,
      'Credit retirement failed'
    );
  }, [handleTransaction]);

  const getUserRetirements = useCallback(async (userAddress?: string) => {
    if (!userAddress && !address) return [];
    try {
      return await blockchainService.getUserRetirements(userAddress || address!);
    } catch (error) {
      console.error('Failed to get retirements:', error);
      return [];
    }
  }, [address]);

  // Expiration operations
  const checkAndExpire = useCallback(async (holderAddress?: string) => {
    if (!holderAddress && !address) return null;
    return handleTransaction(
      () => blockchainService.checkAndExpire(holderAddress || address!),
      'Expiration check completed',
      'Expiration check failed'
    );
  }, [address, handleTransaction]);

  const getExpirationStatus = useCallback(async (holderAddress?: string) => {
    if (!holderAddress && !address) return null;
    try {
      return await blockchainService.getExpirationStatus(holderAddress || address!);
    } catch (error) {
      console.error('Failed to get expiration status:', error);
      return null;
    }
  }, [address]);

  // Batch operations
  const batchTransfer = useCallback(async (recipients: string[], amounts: string[]) => {
    return handleTransaction(
      () => blockchainService.batchTransfer(recipients, amounts),
      `Successfully transferred to ${recipients.length} recipients`,
      'Batch transfer failed'
    );
  }, [handleTransaction]);

  // Analytics operations
  const getPlatformStats = useCallback(async () => {
    try {
      return await blockchainService.getPlatformStats();
    } catch (error) {
      console.error('Failed to get platform stats:', error);
      return null;
    }
  }, []);

  const getCompanyAnalytics = useCallback(async (companyAddress?: string) => {
    if (!companyAddress && !address) return null;
    try {
      return await blockchainService.getCompanyAnalytics(companyAddress || address!);
    } catch (error) {
      console.error('Failed to get company analytics:', error);
      return null;
    }
  }, [address]);

  const getCreditDistribution = useCallback(async () => {
    try {
      return await blockchainService.getCreditDistribution();
    } catch (error) {
      console.error('Failed to get credit distribution:', error);
      return null;
    }
  }, []);

  // EcoBadge NFT
  const getBadgeBalance = useCallback(async (ownerAddress?: string) => {
    if (!ownerAddress && !address) return 0;
    try {
      return await blockchainService.getBadgeBalance(ownerAddress || address!);
    } catch (error) {
      console.error('Failed to get badge balance:', error);
      return 0;
    }
  }, [address]);

  const getBadgeTokenId = useCallback(async (ownerAddress: string, index: number) => {
    try {
      return await blockchainService.getBadgeTokenId(ownerAddress, index);
    } catch (error) {
      console.error('Failed to get badge token ID:', error);
      return 0;
    }
  }, []);

  const getBadgeTokenURI = useCallback(async (tokenId: number) => {
    try {
      return await blockchainService.getBadgeTokenURI(tokenId);
    } catch (error) {
      console.error('Failed to get badge token URI:', error);
      return null;
    }
  }, []);

  const getBadgeOwner = useCallback(async (tokenId: number) => {
    try {
      return await blockchainService.getBadgeOwner(tokenId);
    } catch (error) {
      console.error('Failed to get badge owner:', error);
      return null;
    }
  }, []);

  // Governance
  const getProposalCount = useCallback(async () => {
    try {
      return await blockchainService.getProposalCount();
    } catch (error) {
      console.error('Failed to get proposal count:', error);
      return 0;
    }
  }, []);

  const getProposal = useCallback(async (proposalId: number) => {
    try {
      return await blockchainService.getProposal(proposalId);
    } catch (error) {
      console.error('Failed to get proposal:', error);
      return null;
    }
  }, []);

  const createProposal = useCallback(async (description: string, target: string, data: string = '') => {
    return handleTransaction(
      () => blockchainService.createProposal(description, target, data),
      'Proposal created successfully',
      'Failed to create proposal'
    );
  }, [handleTransaction]);

  const voteOnProposal = useCallback(async (proposalId: number, support: boolean) => {
    return handleTransaction(
      () => blockchainService.voteOnProposal(proposalId, support),
      `Vote ${support ? 'for' : 'against'} proposal submitted`,
      'Failed to vote on proposal'
    );
  }, [handleTransaction]);

  const executeProposal = useCallback(async (proposalId: number) => {
    return handleTransaction(
      () => blockchainService.executeProposal(proposalId),
      'Proposal executed successfully',
      'Failed to execute proposal'
    );
  }, [handleTransaction]);

  const hasVoted = useCallback(async (proposalId: number, voterAddress?: string) => {
    if (!voterAddress && !address) return false;
    try {
      return await blockchainService.hasVoted(proposalId, voterAddress || address!);
    } catch (error) {
      console.error('Failed to check vote status:', error);
      return false;
    }
  }, [address]);

  const getVotingPeriod = useCallback(async () => {
    try {
      return await blockchainService.getVotingPeriod();
    } catch (error) {
      console.error('Failed to get voting period:', error);
      return null;
    }
  }, []);

  // Leaderboard
  const getTopCompanies = useCallback(async (limit: number = 100) => {
    try {
      return await blockchainService.getTopCompanies(limit);
    } catch (error) {
      console.error('Failed to get top companies:', error);
      return [];
    }
  }, []);

  const getCompanyRank = useCallback(async (companyAddress?: string) => {
    if (!companyAddress && !address) return 0;
    try {
      return await blockchainService.getCompanyRank(companyAddress || address!);
    } catch (error) {
      console.error('Failed to get company rank:', error);
      return 0;
    }
  }, [address]);

  // Batch Operations
  const batchLogActions = useCallback(async (
    titles: string[],
    descriptions: string[],
    estimatedCredits: number[],
    locations: string[],
    categories: string[]
  ) => {
    return handleTransaction(
      () => blockchainService.batchLogActions(titles, descriptions, estimatedCredits, locations, categories),
      `Batch logged ${titles.length} actions successfully`,
      'Batch action logging failed'
    );
  }, [handleTransaction]);

  return {
    loading,
    // Token
    getTokenBalance,
    transferTokens,
    burnTokens,
    // EcoLedger
    logEcoAction,
    verifyAction,
    getAction,
    getCompanyProfile,
    // Marketplace
    createListing,
    purchaseListing,
    getListing,
    // Staking
    stakeCredits,
    unstakeCredits,
    getStake,
    // Retirement
    retireCredits,
    getUserRetirements,
    // Expiration
    checkAndExpire,
    getExpirationStatus,
    // Batch
    batchTransfer,
    batchLogActions,
    // Analytics
    getPlatformStats,
    getCompanyAnalytics,
    getCreditDistribution,
    // EcoBadge NFT
    getBadgeBalance,
    getBadgeTokenId,
    getBadgeTokenURI,
    getBadgeOwner,
    // Governance
    getProposalCount,
    getProposal,
    createProposal,
    voteOnProposal,
    executeProposal,
    hasVoted,
    getVotingPeriod,
    // Leaderboard
    getTopCompanies,
    getCompanyRank,
  };
}

