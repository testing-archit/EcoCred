import { useEffect, useState, useCallback } from 'react';
import { Loader2, Award, Lock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useBlockchain } from '../hooks/useBlockchain';
import { useWallet } from '../contexts/WalletContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../lib/services/api';

interface Badge {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    criteria: string;
    earned: boolean;
    earnedAt?: string;
    tokenId?: number;
}

export function Badges() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'earned' | 'available'>('all');
    const { isAuthenticated, user } = useUser();
    const { address } = useWallet();
    const { addNotification } = useNotifications();
    const { getBadgeBalance, getBadgeTokenId, getBadgeTokenURI, getBadgeOwner } = useBlockchain();

    const loadBadges = useCallback(async () => {
        if (!isAuthenticated || !address) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Load badge definitions from backend
            const badgeDefinitions = await api.getBadgeDefinitions(true);
            
            // Get owned badges from blockchain
            const balance = await getBadgeBalance(address);
            const ownedTokenIds: number[] = [];
            
            // Get all owned token IDs
            for (let i = 0; i < balance; i++) {
                try {
                    const tokenId = await getBadgeTokenId(address, i);
                    if (tokenId > 0) {
                        ownedTokenIds.push(tokenId);
                    }
                } catch (error) {
                    console.error(`Failed to get token ID at index ${i}:`, error);
                }
            }

            // Map badge definitions to our format
            const badgesList: Badge[] = badgeDefinitions.map((def: any) => {
                // Check if user owns this badge by finding matching tokenId
                // For now, we'll check if any owned badge matches the criteria
                const isOwned = ownedTokenIds.length > 0;
                const ownedTokenId = isOwned ? ownedTokenIds[0] : undefined; // Simplified - in production, map badge def to tokenId

                return {
                    id: def.id,
                    name: def.name,
                    description: def.description || '',
                    imageUrl: def.imageUrl || '',
                    criteria: def.criteria || `Requires ${def.creditsRequired} credits`,
                    earned: isOwned,
                    tokenId: ownedTokenId
                };
            });

            // Also create entries for owned badges that might not be in definitions
            for (const tokenId of ownedTokenIds) {
                const alreadyIncluded = badgesList.some(b => b.tokenId === tokenId);
                if (!alreadyIncluded) {
                    try {
                        const tokenURI = await getBadgeTokenURI(tokenId);
                        const owner = await getBadgeOwner(tokenId);
                        
                        badgesList.push({
                            id: `token-${tokenId}`,
                            name: `Badge #${tokenId}`,
                            description: `NFT Badge Token #${tokenId}`,
                            imageUrl: tokenURI,
                            criteria: 'Earned through platform achievements',
                            earned: owner.toLowerCase() === address.toLowerCase(),
                            tokenId
                        });
                    } catch (error) {
                        console.error(`Failed to load badge ${tokenId}:`, error);
                    }
                }
            }

            setBadges(badgesList);
        } catch (error) {
            console.error('Failed to load badges:', error);
            addNotification('error', 'Failed to load badges from blockchain');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, address, getBadgeBalance, getBadgeTokenId, getBadgeTokenURI, getBadgeOwner, addNotification]);

    useEffect(() => {
        loadBadges();
    }, [loadBadges]);

    const filteredBadges = badges.filter(badge => {
        if (filter === 'earned') return badge.earned;
        if (filter === 'available') return !badge.earned;
        return true;
    });

    const earnedCount = badges.filter(b => b.earned).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900">NFT Badges</h1>
                <p className="mt-2 text-secondary-600">
                    Earn unique NFT badges for your environmental achievements.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Total Badges</p>
                            <p className="text-2xl font-bold text-secondary-900">{badges.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Earned</p>
                            <p className="text-2xl font-bold text-secondary-900">{earnedCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Lock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Locked</p>
                            <p className="text-2xl font-bold text-secondary-900">{badges.length - earnedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-6">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${filter === 'all'
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50'
                            }`}
                    >
                        All Badges
                    </button>
                    <button
                        onClick={() => setFilter('earned')}
                        className={`px-4 py-2 text-sm font-medium border-t border-b ${filter === 'earned'
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50'
                            }`}
                    >
                        Earned
                    </button>
                    <button
                        onClick={() => setFilter('available')}
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${filter === 'available'
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50'
                            }`}
                    >
                        Available
                    </button>
                </div>
            </div>

            {/* Badges Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </div>
            ) : filteredBadges.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-secondary-200">
                    <Award size={48} className="mx-auto text-secondary-400 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900">No badges found</h3>
                    <p className="text-secondary-500 mt-1">Try adjusting your filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBadges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${badge.earned
                                ? 'border-green-400 hover:shadow-lg'
                                : 'border-secondary-200 opacity-75 hover:opacity-100'
                                }`}
                        >
                            <div className="relative">
                                <div className={`aspect-square bg-gradient-to-br ${badge.earned
                                    ? 'from-green-400 to-blue-500'
                                    : 'from-secondary-200 to-secondary-300'
                                    } flex items-center justify-center`}>
                                    {badge.earned ? (
                                        <Award size={80} className="text-white" />
                                    ) : (
                                        <Lock size={80} className="text-secondary-400" />
                                    )}
                                </div>
                                {badge.earned && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                        Earned
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-secondary-900 mb-1">{badge.name}</h3>
                                <p className="text-sm text-secondary-600 mb-3">{badge.description}</p>
                                <div className="text-xs text-secondary-500 mb-3">
                                    <span className="font-medium">Criteria:</span> {badge.criteria}
                                </div>
                                {badge.earned && badge.earnedAt && (
                                    <div className="text-xs text-green-600 font-medium">
                                        Earned on {new Date(badge.earnedAt).toLocaleDateString()}
                                    </div>
                                )}
                                {badge.earned && badge.tokenId && (
                                    <div className="text-xs text-secondary-400 mt-1">
                                        Token ID: #{badge.tokenId}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
