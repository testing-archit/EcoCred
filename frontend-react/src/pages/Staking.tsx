import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, TrendingUp, Clock } from 'lucide-react';
import { api } from '../lib/services/api';
import { useUser } from '../contexts/UserContext';

interface Stake {
    id: string;
    amount: number;
    duration: number;
    endTime: string;
    claimed: boolean;
    stakeId?: number;
}

export function Staking() {
    const [stakes, setStakes] = useState<Stake[]>([]);
    const [loading, setLoading] = useState(true);
    const [staking] = useState(false);
    const [unstakingId] = useState<string | null>(null);
    const [showStakeModal, setShowStakeModal] = useState(false);
    const { isAuthenticated, user } = useUser();
    
    const isCompany = user?.role?.toUpperCase() === 'COMPANY';

    const [amount, setAmount] = useState(100);
    const [duration, setDuration] = useState(30);

    const loadStakes = useCallback(async () => {
        setLoading(true);
        try {
            if (isAuthenticated) {
                const response = await api.getMyStakes();
                setStakes(response || []);
            }
        } catch (error) {
            console.error('Failed to load stakes:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadStakes();
    }, [loadStakes]);

    function calculateReward(amount: number, durationDays: number) {
        const apy = 0.05;
        return (amount * apy * (durationDays / 365)).toFixed(2);
    }

    function isStakeEnded(endTime: string) {
        return new Date(endTime) < new Date();
    }

    const totalStaked = stakes.reduce((acc, s) => acc + (s.claimed ? 0 : s.amount), 0);
    const activeStakes = stakes.filter(s => !s.claimed).length;

    // Show access denied for non-company users
    if (isAuthenticated && !isCompany) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-16">
                    <TrendingUp className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Access Restricted</h2>
                    <p className="text-secondary-600">
                        Staking is only available to companies. Your role: {user?.role}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Staking Dashboard</h1>
                    <p className="mt-2 text-secondary-600">
                        Stake your Carbon Credits to earn rewards and governance rights.
                    </p>
                </div>

                <button
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
                    onClick={() => setShowStakeModal(true)}
                >
                    <Plus size={20} />
                    New Stake
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Total Staked</p>
                            <p className="text-2xl font-bold text-secondary-900">{totalStaked} Credits</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Active Stakes</p>
                            <p className="text-2xl font-bold text-secondary-900">{activeStakes}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Estimated APY</p>
                            <p className="text-2xl font-bold text-secondary-900">5.0%</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </div>
            ) : stakes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-secondary-200">
                    <TrendingUp size={48} className="mx-auto text-secondary-400 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900">No active stakes</h3>
                    <p className="text-secondary-500 mt-1">Start staking to earn rewards!</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">End Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Est. Reward</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {stakes.map((stake) => (
                                <tr key={stake.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                        {stake.amount} Credits
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {Math.round(stake.duration / (24 * 60 * 60))} Days
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {new Date(stake.endTime).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                        +{calculateReward(stake.amount, stake.duration / (24 * 60 * 60))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {stake.claimed ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                                                Claimed
                                            </span>
                                        ) : isStakeEnded(stake.endTime) ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Ready to Unstake
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Staking
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {!stake.claimed && isStakeEnded(stake.endTime) ? (
                                            <button
                                                className="text-primary-600 hover:text-primary-900 font-bold"
                                                disabled={unstakingId === stake.id}
                                            >
                                                {unstakingId === stake.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    'Unstake & Claim'
                                                )}
                                            </button>
                                        ) : !stake.claimed ? (
                                            <span className="text-secondary-400 cursor-not-allowed">Locked</span>
                                        ) : (
                                            <span className="text-secondary-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Stake Modal */}
            {showStakeModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity"
                            onClick={() => setShowStakeModal(false)}
                        />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                                    Create New Stake
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="amount" className="block text-sm font-medium text-secondary-700">
                                            Amount (Credits)
                                        </label>
                                        <input
                                            type="number"
                                            id="amount"
                                            value={amount}
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            min="1"
                                            className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="duration" className="block text-sm font-medium text-secondary-700">
                                            Duration (Days)
                                        </label>
                                        <select
                                            id="duration"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                        >
                                            <option value={30}>30 Days (5% APY)</option>
                                            <option value={90}>90 Days (7% APY)</option>
                                            <option value={180}>180 Days (10% APY)</option>
                                            <option value={365}>365 Days (15% APY)</option>
                                        </select>
                                    </div>
                                    <div className="bg-secondary-50 p-3 rounded-md">
                                        <p className="text-sm text-secondary-600 flex justify-between">
                                            <span>Estimated Reward:</span>
                                            <span className="font-bold text-green-600">
                                                +{calculateReward(amount, duration)} Credits
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:w-auto sm:text-sm"
                                    disabled={staking}
                                >
                                    {staking ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Stake Tokens'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowStakeModal(false)}
                                    disabled={staking}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
