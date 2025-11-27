import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Sparkles, Crown, Medal } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useBlockchain } from '../hooks/useBlockchain';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../lib/services/api';
import { ethers } from 'ethers';

interface LeaderboardEntry {
    rank: number;
    company: string; // wallet address
    totalCredits: bigint;
    reputationScore: bigint;
    companyName?: string;
    totalActions?: number;
    verified?: boolean;
}

export function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('all-time');
    const { user } = useUser();
    const { getTopCompanies, getCompanyRank } = useBlockchain();
    const { addNotification } = useNotifications();

    const loadLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            // Try blockchain contract first
            try {
                const topCompanies = await getTopCompanies(100);
                if (topCompanies && topCompanies.length > 0) {
                    // Map blockchain data to our format
                    const mappedEntries: LeaderboardEntry[] = topCompanies.map((entry: any, index: number) => ({
                        rank: Number(entry.rank) || index + 1,
                        company: entry.company,
                        totalCredits: entry.totalCredits,
                        reputationScore: entry.reputationScore,
                        companyName: undefined, // Will fetch from backend if needed
                        totalActions: 0,
                        verified: false
                    }));

                    // Try to enrich with backend data for company names
                    try {
                        const backendResponse = await api.getLeaderboard('ALL_TIME');
                        const backendMap = new Map(
                            (backendResponse || []).map((e: any) => [e.company?.walletAddress, e])
                        );

                        const enrichedEntries = mappedEntries.map(entry => {
                            const backendData = backendMap.get(entry.company);
                            return {
                                ...entry,
                                companyName: backendData?.company?.name || `${entry.company.slice(0, 6)}...${entry.company.slice(-4)}`,
                                totalActions: backendData?.totalActions || 0,
                                verified: backendData?.company?.verified || false
                            };
                        });

                        setEntries(enrichedEntries);
                        setLoading(false);
                        return;
                    } catch (backendError) {
                        console.warn('Failed to enrich with backend data, using blockchain data only:', backendError);
                        // Use blockchain data without backend enrichment
                    }
                    
                    // If backend enrichment failed, use blockchain data as-is
                    setEntries(mappedEntries);
                    setLoading(false);
                    return;
                }
            } catch (blockchainError) {
                console.warn('Failed to load from blockchain, falling back to backend:', blockchainError);
            }

            // Fallback to backend API
            const periodMap: Record<string, string> = {
                'weekly': 'WEEKLY',
                'monthly': 'MONTHLY',
                'all-time': 'ALL_TIME'
            };
            const response = await api.getLeaderboard(periodMap[period]);
            const mappedEntries: LeaderboardEntry[] = (response || []).map((entry: any, index: number) => ({
                rank: entry.rank || index + 1,
                company: entry.company?.walletAddress || entry.companyId || '',
                totalCredits: BigInt(entry.totalCredits || 0),
                reputationScore: BigInt(0),
                companyName: entry.company?.name || 'Unknown',
                totalActions: entry.totalActions || 0,
                verified: entry.company?.verified || false
            }));
            setEntries(mappedEntries);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            addNotification('error', 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    }, [period, getTopCompanies, addNotification]);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-600';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-orange-600';
        return 'text-secondary-600';
    };

    const getRankBg = (rank: number) => {
        if (rank === 1) return 'bg-yellow-100';
        if (rank === 2) return 'bg-gray-100';
        if (rank === 3) return 'bg-orange-100';
        return 'bg-secondary-50';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
                className="flex justify-between items-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Sparkles className="h-8 w-8 text-primary-600" />
                        </motion.div>
                        <h1 className="text-4xl font-bold gradient-text">Leaderboard</h1>
                    </div>
                    <p className="mt-2 text-secondary-600 text-lg">
                        Top performing companies in carbon credit generation.
                    </p>
                </div>

                <motion.select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly' | 'all-time')}
                    className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="all-time">All Time</option>
                </motion.select>
            </motion.div>

            {/* Top 3 Podium */}
            {!loading && entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {/* 2nd Place */}
                    <motion.div 
                        className="order-1"
                        initial={{ opacity: 0, x: -50, y: 50 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                    >
                        <div className="card card-hover p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-400 to-gray-500"></div>
                            <motion.div 
                                className={`w-16 h-16 mx-auto mb-3 rounded-full ${getRankBg(2)} flex items-center justify-center shadow-lg`}
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Medal className={getRankColor(2)} size={32} />
                            </motion.div>
                            <div className="text-2xl font-bold text-secondary-400 mb-1">2nd</div>
                            <h3 className="font-semibold text-secondary-900 mb-2">{entries[1].companyName || `${entries[1].company.slice(0, 6)}...${entries[1].company.slice(-4)}`}</h3>
                            <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{ethers.formatEther(entries[1].totalCredits)} Credits</p>
                        </div>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div 
                        className="order-2"
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.6, type: "spring" }}
                    >
                        <div className="card p-6 text-center relative overflow-hidden border-2 border-yellow-400 shadow-xl bg-gradient-to-br from-yellow-50 to-amber-50">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400"></div>
                            <motion.div 
                                className={`w-20 h-20 mx-auto mb-3 rounded-full ${getRankBg(1)} flex items-center justify-center shadow-xl relative`}
                                animate={{ 
                                    y: [0, -10, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Crown className={getRankColor(1)} size={40} />
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-yellow-400 opacity-20"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-1">1st</div>
                            <h3 className="font-semibold text-secondary-900 mb-2 text-lg">{entries[0].companyName || `${entries[0].company.slice(0, 6)}...${entries[0].company.slice(-4)}`}</h3>
                            <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{ethers.formatEther(entries[0].totalCredits)} Credits</p>
                        </div>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div 
                        className="order-3"
                        initial={{ opacity: 0, x: 50, y: 50 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                    >
                        <div className="card card-hover p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                            <motion.div 
                                className={`w-16 h-16 mx-auto mb-3 rounded-full ${getRankBg(3)} flex items-center justify-center shadow-lg`}
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            >
                                <Medal className={getRankColor(3)} size={32} />
                            </motion.div>
                            <div className="text-2xl font-bold text-orange-600 mb-1">3rd</div>
                            <h3 className="font-semibold text-secondary-900 mb-2">{entries[2].companyName || `${entries[2].company.slice(0, 6)}...${entries[2].company.slice(-4)}`}</h3>
                            <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{ethers.formatEther(entries[2].totalCredits)} Credits</p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Full Leaderboard Table */}
            {loading ? (
                <motion.div 
                    className="flex justify-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </motion.div>
            ) : entries.length === 0 ? (
                <motion.div 
                    className="text-center py-12 card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Trophy size={48} className="mx-auto text-secondary-400 mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-secondary-900">No data available</h3>
                    <p className="text-secondary-500 mt-1">Check back later for rankings</p>
                </motion.div>
            ) : (
                <motion.div 
                    className="card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-gradient-to-r from-secondary-50 to-secondary-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Credits</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Actions</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Avg/Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {entries.map((entry, index) => {
                                    const isCurrentUser = user?.walletAddress?.toLowerCase() === entry.company.toLowerCase();
                                    const creditsFormatted = ethers.formatEther(entry.totalCredits);
                                    return (
                                        <motion.tr
                                            key={entry.company}
                                            className={`${isCurrentUser ? 'bg-gradient-to-r from-primary-50 to-primary-100/50' : 'hover:bg-secondary-50'} transition-colors`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 + 0.5, duration: 0.3 }}
                                            whileHover={{ scale: 1.01, x: 5 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`flex items-center gap-2 ${getRankColor(entry.rank)} font-bold text-lg`}>
                                                    {entry.rank <= 3 && <Trophy size={20} />}
                                                    #{entry.rank}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-secondary-900">
                                                        {entry.companyName || `${entry.company.slice(0, 6)}...${entry.company.slice(-4)}`}
                                                    </span>
                                                    {entry.verified && (
                                                        <motion.span 
                                                            className="px-2 py-0.5 text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full border border-green-200"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: index * 0.05 + 0.6 }}
                                                        >
                                                            ✓ Verified
                                                        </motion.span>
                                                    )}
                                                    {isCurrentUser && (
                                                        <motion.span 
                                                            className="px-2 py-0.5 text-xs bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 rounded-full border border-primary-300"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: index * 0.05 + 0.6 }}
                                                        >
                                                            You
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                {parseFloat(creditsFormatted).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                {entry.totalActions || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                {entry.totalActions && entry.totalActions > 0 
                                                    ? (parseFloat(creditsFormatted) / entry.totalActions).toFixed(1) 
                                                    : '0'}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
