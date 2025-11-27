import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../lib/config/contract-addresses';
import { walletService } from '../lib/services/wallet';
import { useNotifications } from '../contexts/NotificationContext';

interface EventData {
  actionId?: string;
  company?: string;
  title?: string;
  category?: string;
  verifier?: string;
  approved?: boolean;
  creditsAwarded?: string;
  to?: string;
  amount?: string;
  listingId?: string;
  seller?: string;
  pricePerCredit?: string;
  buyer?: string;
  totalPrice?: string;
  user?: string;
  stakeId?: string;
  lockPeriod?: string;
  reward?: string;
  retirementId?: string;
  retirer?: string;
  reason?: string;
  certificateId?: string;
}

interface BlockchainEvent {
  type: 'ActionLogged' | 'ActionVerified' | 'CreditsMinted' | 'ListingCreated' | 'PurchaseExecuted' | 'Staked' | 'Unstaked' | 'CreditsRetired';
  data: EventData;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export function useBlockchainEvents() {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const { addNotification } = useNotifications();

  const ECOLEDGER_ABI = [
    "event EcoActionLogged(uint256 indexed actionId, address indexed company, string title, string category)",
    "event ActionVerified(uint256 indexed actionId, address indexed verifier, bool approved, uint256 creditsAwarded)",
  ];

  const TOKEN_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ];

  const MARKETPLACE_ABI = [
    "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerCredit)",
    "event PurchaseExecuted(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice)",
  ];

  const STAKING_ABI = [
    "event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockPeriod)",
    "event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 reward)",
  ];

  const RETIREMENT_ABI = [
    "event CreditsRetired(uint256 indexed retirementId, address indexed retirer, uint256 amount, string reason, string certificateId)",
  ];

  const startListening = useCallback(async () => {
    const provider = walletService.getProvider();
    if (!provider || !CONTRACT_ADDRESSES.ECOLEDGER_CONTRACT) {
      return;
    }

    try {
      setIsListening(true);

      // Listen to EcoLedger events
      const ledgerContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ECOLEDGER_CONTRACT,
        ECOLEDGER_ABI,
        provider
      );

      ledgerContract.on('EcoActionLogged', (actionId, company, title, category, event) => {
        const newEvent: BlockchainEvent = {
          type: 'ActionLogged',
          data: { actionId: actionId.toString(), company, title, category },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Date.now()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
        addNotification('info', `New eco action logged: ${title}`);
      });

      ledgerContract.on('ActionVerified', (actionId, verifier, approved, creditsAwarded, event) => {
        const newEvent: BlockchainEvent = {
          type: 'ActionVerified',
          data: { actionId: actionId.toString(), verifier, approved, creditsAwarded: creditsAwarded.toString() },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Date.now()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 50));
        addNotification('success', `Action ${approved ? 'verified' : 'rejected'}: ${creditsAwarded.toString()} credits`);
      });

      // Listen to Token Transfer events (minting)
      if (CONTRACT_ADDRESSES.CARBON_CREDIT_TOKEN) {
        const tokenContract = new ethers.Contract(
          CONTRACT_ADDRESSES.CARBON_CREDIT_TOKEN,
          TOKEN_ABI,
          provider
        );

        tokenContract.on('Transfer', (from, to, value, event) => {
          // Only track minting (from zero address)
          if (from === ethers.ZeroAddress) {
            const newEvent: BlockchainEvent = {
              type: 'CreditsMinted',
              data: { to, amount: ethers.formatEther(value) },
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              timestamp: Date.now()
            };
            setEvents(prev => [newEvent, ...prev].slice(0, 50));
          }
        });
      }

      // Listen to Marketplace events
      if (CONTRACT_ADDRESSES.MARKETPLACE) {
        const marketplaceContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MARKETPLACE,
          MARKETPLACE_ABI,
          provider
        );

        marketplaceContract.on('ListingCreated', (listingId, seller, amount, pricePerCredit, event) => {
          const newEvent: BlockchainEvent = {
            type: 'ListingCreated',
            data: {
              listingId: listingId.toString(),
              seller,
              amount: ethers.formatEther(amount),
              pricePerCredit: ethers.formatEther(pricePerCredit)
            },
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now()
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
        });

        marketplaceContract.on('PurchaseExecuted', (listingId, buyer, amount, totalPrice, event) => {
          const newEvent: BlockchainEvent = {
            type: 'PurchaseExecuted',
            data: {
              listingId: listingId.toString(),
              buyer,
              amount: ethers.formatEther(amount),
              totalPrice: ethers.formatEther(totalPrice)
            },
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now()
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
          addNotification('success', `Purchase completed: ${ethers.formatEther(amount)} credits`);
        });
      }

      // Listen to Staking events
      if (CONTRACT_ADDRESSES.STAKING) {
        const stakingContract = new ethers.Contract(
          CONTRACT_ADDRESSES.STAKING,
          STAKING_ABI,
          provider
        );

        stakingContract.on('Staked', (user, stakeId, amount, lockPeriod, event) => {
          const newEvent: BlockchainEvent = {
            type: 'Staked',
            data: {
              user,
              stakeId: stakeId.toString(),
              amount: ethers.formatEther(amount),
              lockPeriod: lockPeriod.toString()
            },
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now()
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
        });

        stakingContract.on('Unstaked', (user, stakeId, amount, reward, event) => {
          const newEvent: BlockchainEvent = {
            type: 'Unstaked',
            data: {
              user,
              stakeId: stakeId.toString(),
              amount: ethers.formatEther(amount),
              reward: ethers.formatEther(reward)
            },
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now()
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
        });
      }

      // Listen to Retirement events
      if (CONTRACT_ADDRESSES.CREDIT_RETIREMENT) {
        const retirementContract = new ethers.Contract(
          CONTRACT_ADDRESSES.CREDIT_RETIREMENT,
          RETIREMENT_ABI,
          provider
        );

        retirementContract.on('CreditsRetired', (retirementId, retirer, amount, reason, certificateId, event) => {
          const newEvent: BlockchainEvent = {
            type: 'CreditsRetired',
            data: {
              retirementId: retirementId.toString(),
              retirer,
              amount: ethers.formatEther(amount),
              reason,
              certificateId
            },
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now()
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
          addNotification('info', `Credits retired: ${ethers.formatEther(amount)}`);
        });
      }

    } catch (error) {
      console.error('Failed to start event listeners:', error);
      setIsListening(false);
    }
    // ABIs are stable constants defined in the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNotification]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Note: In a real app, you'd want to remove all listeners here
  }, []);

  useEffect(() => {
    const provider = walletService.getProvider();
    if (provider) {
      // Use void to explicitly ignore the promise result
      void startListening();
    }
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, isListening, startListening, stopListening };
}

