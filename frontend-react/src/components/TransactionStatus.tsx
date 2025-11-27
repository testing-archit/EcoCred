import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
  error?: string;
}

interface TransactionStatusProps {
  transaction: ethers.ContractTransactionResponse | null;
  onComplete?: (receipt: ethers.TransactionReceipt) => void;
  onError?: (error: Error) => void;
}

export function TransactionStatus({ transaction, onComplete, onError }: TransactionStatusProps) {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setStatus({
      hash: transaction.hash,
      status: 'pending',
      confirmations: 0
    });

    const checkStatus = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum!);
        const receipt = await provider.waitForTransaction(transaction.hash, 1);
        
        if (receipt) {
          const confirmations = typeof receipt.confirmations === 'function' 
            ? await receipt.confirmations() 
            : receipt.confirmations || 1;
          
          setStatus({
            hash: receipt.hash,
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            blockNumber: receipt.blockNumber,
            confirmations: Number(confirmations),
            error: receipt.status === 0 ? 'Transaction failed' : undefined
          });

          if (receipt.status === 1 && onComplete) {
            onComplete(receipt as ethers.TransactionReceipt);
          } else if (receipt.status === 0 && onError) {
            onError(new Error('Transaction failed'));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
        setStatus(prev => prev ? {
          ...prev,
          status: 'failed',
          error: errorMessage
        } : null);
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    };

    checkStatus();
  }, [transaction, onComplete, onError]);

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'confirmed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case 'confirmed':
        return 'Transaction confirmed';
      case 'failed':
        return 'Transaction failed';
      default:
        return 'Waiting for confirmation...';
    }
  };

  const getExplorerUrl = (): string => {
    // For local Hardhat, you might want to use a local block explorer
    // For testnets/mainnet, use the appropriate explorer
    const chainId = 31337; // Hardhat default
    if (chainId === 31337) {
      return `http://localhost:8545`; // Local network
    }
    return `https://etherscan.io/tx/${status?.hash}`;
  };

  if (!isVisible || !status) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg border border-secondary-200 p-4 min-w-[300px] max-w-md"
      >
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary-900 text-sm">{getStatusText()}</p>
            <p className="text-xs text-secondary-600 font-mono mt-1 truncate">
              {status.hash.slice(0, 10)}...{status.hash.slice(-8)}
            </p>
            {status.blockNumber && (
              <p className="text-xs text-secondary-500 mt-1">
                Block: {status.blockNumber} ({status.confirmations} confirmations)
              </p>
            )}
            {status.error && (
              <p className="text-xs text-red-600 mt-1">{status.error}</p>
            )}
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

