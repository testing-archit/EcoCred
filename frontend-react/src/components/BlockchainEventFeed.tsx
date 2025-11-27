import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, ShoppingBag, Wallet, Flame, ExternalLink, Filter } from 'lucide-react';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import { useUser } from '../contexts/UserContext';

interface BlockchainEventFeedProps {
    maxEvents?: number;
    roleFilter?: boolean;
}

export function BlockchainEventFeed({ maxEvents = 10, roleFilter = true }: BlockchainEventFeedProps) {
    const { events, isListening } = useBlockchainEvents();
    const { user } = useUser();
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    // Event type icons and colors
    const eventConfig = {
        ActionLogged: {
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            label: 'Action Logged'
        },
        ActionVerified: {
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            label: 'Action Verified'
        },
        CreditsMinted: {
            icon: Wallet,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            label: 'Credits Minted'
        },
        ListingCreated: {
            icon: ShoppingBag,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            label: 'Listing Created'
        },
        PurchaseExecuted: {
            icon: ShoppingBag,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            label: 'Purchase Executed'
        },
        Staked: {
            icon: Wallet,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            label: 'Credits Staked'
        },
        Unstaked: {
            icon: Wallet,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            label: 'Credits Unstaked'
        },
        CreditsRetired: {
            icon: Flame,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            label: 'Credits Retired'
        }
    };

    // Filter events based on role and selected filter
    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        // Role-based filtering
        if (roleFilter && user) {
            const role = user.role?.toUpperCase();

            if (role === 'VERIFIER') {
                // Verifiers see verification-related events
                filtered = filtered.filter(e =>
                    e.type === 'ActionLogged' ||
                    e.type === 'ActionVerified' ||
                    e.type === 'CreditsMinted'
                );
            } else if (role === 'COMPANY' && user.walletAddress) {
                // Companies see their own events
                filtered = filtered.filter(e =>
                    e.data?.company?.toLowerCase() === user.walletAddress.toLowerCase() ||
                    e.data?.seller?.toLowerCase() === user.walletAddress.toLowerCase() ||
                    e.data?.buyer?.toLowerCase() === user.walletAddress.toLowerCase() ||
                    e.data?.user?.toLowerCase() === user.walletAddress.toLowerCase()
                );
            }
            // Auditors see all events (no filtering)
        }

        // Type-based filtering
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(e => e.type === selectedFilter);
        }

        return filtered.slice(0, maxEvents);
    }, [events, user, roleFilter, selectedFilter, maxEvents]);

    // Get unique event types for filter
    const eventTypes = useMemo(() => {
        const types = new Set(events.map(e => e.type));
        return Array.from(types);
    }, [events]);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const getBlockExplorerUrl = (txHash: string) => {
        // For local development, this would link to a local explorer
        // In production, use the appropriate block explorer
        return `https://etherscan.io/tx/${txHash}`;
    };

    return (
        <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-secondary-900">Blockchain Events</h3>
                    {isListening && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                    )}
                </div>

                {eventTypes.length > 1 && (
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-secondary-500" />
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="text-sm border border-secondary-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="all">All Events</option>
                            {eventTypes.map(type => (
                                <option key={type} value={type}>
                                    {eventConfig[type as keyof typeof eventConfig]?.label || type}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                    <p className="text-secondary-600">No blockchain events yet</p>
                    <p className="text-sm text-secondary-500 mt-2">
                        {isListening ? 'Listening for events...' : 'Event listener not active'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.map((event, index) => {
                            const config = eventConfig[event.type as keyof typeof eventConfig];
                            if (!config) return null;

                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={`${event.transactionHash}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${config.bgColor} border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`h-5 w-5 ${config.color}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className={`font-semibold ${config.color}`}>
                                                    {config.label}
                                                </h4>
                                                <span className="text-xs text-secondary-500 whitespace-nowrap">
                                                    {formatTimestamp(event.timestamp)}
                                                </span>
                                            </div>

                                            <div className="space-y-1 text-sm text-secondary-700">
                                                {event.data?.title && (
                                                    <p className="font-medium">{event.data.title}</p>
                                                )}
                                                {event.data?.amount && (
                                                    <p>Amount: {event.data.amount} credits</p>
                                                )}
                                                {event.data?.company && (
                                                    <p className="font-mono text-xs truncate">
                                                        Company: {event.data.company.substring(0, 10)}...
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 mt-2 text-xs text-secondary-500">
                                                <span>Block #{event.blockNumber}</span>
                                                <a
                                                    href={getBlockExplorerUrl(event.transactionHash)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    View Tx
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
