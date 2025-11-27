import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Wallet, Flame } from 'lucide-react';
import { ethers } from 'ethers';
import { useBlockchain } from '../hooks/useBlockchain';
import { useWallet } from '../contexts/WalletContext';
import { useUser } from '../contexts/UserContext';

export function BlockchainData() {
  const { address } = useWallet();
  const { user } = useUser();
  const { getTokenBalance, getCompanyProfile, getCreditDistribution, loading } = useBlockchain();
  const [data, setData] = useState({
    tokenBalance: '0',
    onChainCredits: '0',
    reputation: '0',
    totalSupply: '0',
    circulatingSupply: '0'
  });

  useEffect(() => {
    if (!address) return;

    const loadData = async () => {
      try {
        const [balance, distribution] = await Promise.all([
          getTokenBalance(address),
          getCreditDistribution()
        ]);

        let onChainCredits = '0';
        let reputation = '0';

        if (user?.walletAddress) {
          try {
            const profile = await getCompanyProfile(user.walletAddress);
            if (profile) {
              onChainCredits = ethers.formatEther(profile.totalCreditsEarned || 0);
              reputation = profile.reputationScore?.toString() || '0';
    }
          } catch (error) {
            console.error('Failed to load company profile:', error);
          }
        }

        setData({
          tokenBalance: balance,
          onChainCredits,
          reputation,
          totalSupply: distribution ? ethers.formatEther(distribution.totalSupply || 0) : '0',
          circulatingSupply: distribution ? ethers.formatEther(distribution.circulatingSupply || 0) : '0'
        });
      } catch (error) {
        console.error('Failed to load blockchain data:', error);
      }
    };

    loadData();
  }, [address, user, getTokenBalance, getCompanyProfile, getCreditDistribution]);

  const handleRefresh = async () => {
    if (!address) return;

    try {
      const [balance, distribution] = await Promise.all([
        getTokenBalance(address),
        getCreditDistribution()
      ]);

      let onChainCredits = '0';
      let reputation = '0';

      if (user?.walletAddress) {
        try {
          const profile = await getCompanyProfile(user.walletAddress);
          if (profile) {
            onChainCredits = ethers.formatEther(profile.totalCreditsEarned || 0);
            reputation = profile.reputationScore?.toString() || '0';
          }
        } catch (error) {
          console.error('Failed to load company profile:', error);
        }
      }

      setData({
        tokenBalance: balance,
        onChainCredits,
        reputation,
        totalSupply: distribution ? ethers.formatEther(distribution.totalSupply || 0) : '0',
        circulatingSupply: distribution ? ethers.formatEther(distribution.circulatingSupply || 0) : '0'
      });
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
    }
  };

  const stats = [
    {
      icon: Wallet,
      label: 'Token Balance',
      value: parseFloat(data.tokenBalance).toFixed(2),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: TrendingUp,
      label: 'On-Chain Credits',
      value: parseFloat(data.onChainCredits).toFixed(2),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Activity,
      label: 'Reputation Score',
      value: data.reputation,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Flame,
      label: 'Total Supply',
      value: parseFloat(data.totalSupply).toFixed(0),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (!address) {
    return (
      <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
        <p className="text-secondary-600 text-center">Connect wallet to view blockchain data</p>
      </div>
    );
  }

  return (
    <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">On-Chain Data</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className={`${stat.bgColor} p-4 rounded-lg`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <p className="text-sm font-medium text-secondary-700">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {loading ? '...' : stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>
      <button
        onClick={handleRefresh}
        className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh Data'}
      </button>
    </div>
  );
}

