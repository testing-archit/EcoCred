import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Award, Activity, Calendar, ShoppingBag, Wallet, Trophy } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DashboardChart } from './DashboardChart';
import { RecentActions } from './RecentActions';
import { BlockchainData } from './BlockchainData';
import { BlockchainEventFeed } from './BlockchainEventFeed';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import { api } from '../lib/services/api';

interface User {
    id: string;
    walletAddress: string;
    name: string;
    role?: string;
}

interface CompanyStats {
    totalActions?: number;
    totalCreditsEarned?: number;
}

interface CompanyDashboardProps {
    user: User;
}

interface QuickActionItem {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    route: string;
    isPrimary: boolean;
}

// Helper to get Lucide icon by name
function getIconComponent(iconName?: string): LucideIcon {
    if (!iconName) return Leaf;
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Leaf;
}

export function CompanyDashboard({ user }: CompanyDashboardProps) {
    const [loading, setLoading] = useState(true);
    const { events } = useBlockchainEvents();
    const [stats, setStats] = useState({
        totalCredits: 0,
        totalActions: 0,
        badgesEarned: 0,
        ranking: 0,
        companyStats: null as CompanyStats | null
    });
    const [weeklyData, setWeeklyData] = useState([
        { day: 'Mon', credits: 0 },
        { day: 'Tue', credits: 0 },
        { day: 'Wed', credits: 0 },
        { day: 'Thu', credits: 0 },
        { day: 'Fri', credits: 0 },
        { day: 'Sat', credits: 0 },
        { day: 'Sun', credits: 0 }
    ]);
    const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const overview = await api.getOverview();
            const trends = await api.getTrends(7);

            const newStats = {
                ...stats,
                totalCredits: overview.credits?.totalIssued || 0,
                totalActions: overview.actions?.total || 0
            };

            if (trends.trends && trends.trends.length > 0) {
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const trendMap = new Map(trends.trends.map((t) => {
                    const date = new Date(t.date);
                    return [daysOfWeek[date.getDay()], t.creditsIssued || 0] as [string, number];
                }));

                setWeeklyData(prev => prev.map(item => ({
                    ...item,
                    credits: Number(trendMap.get(item.day)) || 0
                })));
            }

            if (user?.id) {
                try {
                    const companyAnalytics = await api.getCompanyAnalytics(user.id);
                    newStats.companyStats = companyAnalytics.stats || null;
                    newStats.totalActions = companyAnalytics.stats?.totalActions || newStats.totalActions;
                    newStats.totalCredits = companyAnalytics.stats?.totalCredits || newStats.totalCredits;
                } catch (error) {
                    console.error('Failed to load company analytics:', error);
                }
            }
            setStats(newStats);

            // Load quick actions from API
            try {
                const quickActionsResponse = await api.getQuickActions('COMPANY');
                if (quickActionsResponse.success) {
                    setQuickActions(quickActionsResponse.data);
                }
            } catch (quickActionsError) {
                console.error('Failed to load quick actions:', quickActionsError);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, stats]);

    useEffect(() => {
        loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Auto-refresh when blockchain events occur
    useEffect(() => {
        if (events.length > 0) {
            loadDashboardData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events.length]);

    const statCards = [
        {
            icon: Leaf,
            label: "Total Credits",
            value: stats.totalCredits.toLocaleString(),
            color: "primary",
            gradient: "from-green-500 to-emerald-600"
        },
        {
            icon: Activity,
            label: "Eco Actions",
            value: stats.totalActions,
            color: "blue",
            gradient: "from-blue-500 to-cyan-600"
        },
        {
            icon: Award,
            label: "Badges Earned",
            value: stats.badgesEarned,
            color: "yellow",
            gradient: "from-yellow-500 to-amber-600"
        },
        {
            icon: Trophy,
            label: "Ranking",
            value: `#${stats.ranking || 'N/A'}`,
            color: "purple",
            gradient: "from-purple-500 to-indigo-600"
        }
    ];

    return (
        <>
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <Leaf className="h-8 w-8 text-primary-600" />
                    </motion.div>
                    <h1 className="text-4xl font-bold gradient-text">Company Dashboard</h1>
                </div>
                <p className="text-secondary-600 text-lg">Track your sustainability efforts and carbon credit rewards</p>
            </motion.div>

            {loading ? (
                <motion.div
                    className="flex justify-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Activity size={40} className="animate-spin text-primary-600" />
                </motion.div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {statCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    className="stat-card group relative overflow-hidden bg-white shadow-sm border border-secondary-200 rounded-xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                >
                                    <div className="relative z-10 flex items-center p-6">
                                        <motion.div
                                            className="flex-shrink-0"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                                                <Icon className="h-7 w-7 text-white" />
                                            </div>
                                        </motion.div>
                                        <div className="ml-4 flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary-600 mb-1">{stat.label}</p>
                                            <p className="text-3xl font-bold text-secondary-900">{stat.value}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <motion.div
                            className="lg:col-span-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <div className="card card-hover p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-secondary-900">Weekly Carbon Credits</h3>
                                    <div className="flex items-center text-sm text-secondary-600 bg-secondary-50 px-3 py-1 rounded-full border border-secondary-200">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        Last 7 days
                                    </div>
                                </div>
                                <div className="min-h-[320px]">
                                    <DashboardChart data={weeklyData} />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="lg:col-span-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <RecentActions />
                        </motion.div>
                    </div>

                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <BlockchainData />
                    </motion.div>

                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                    >
                        <BlockchainEventFeed maxEvents={5} roleFilter={true} />
                    </motion.div>

                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                            <h3 className="text-lg font-semibold text-secondary-900 mb-6">Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {quickActions.length > 0 ? (
                                    quickActions.map((action) => {
                                        const IconComponent = getIconComponent(action.icon);
                                        return (
                                            <motion.div key={action.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Link to={action.route} className={`${action.isPrimary ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center w-full`}>
                                                    <IconComponent className="h-5 w-5 mr-2" />
                                                    {action.title}
                                                </Link>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/actions" className="btn-primary flex items-center justify-center w-full">
                                                <Leaf className="h-5 w-5 mr-2" />
                                                Log Eco Action
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/marketplace" className="btn-secondary flex items-center justify-center w-full">
                                                <ShoppingBag className="h-5 w-5 mr-2" />
                                                Marketplace
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/staking" className="btn-secondary flex items-center justify-center w-full">
                                                <Wallet className="h-5 w-5 mr-2" />
                                                Stake Credits
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/leaderboard" className="btn-secondary flex items-center justify-center w-full">
                                                <Trophy className="h-5 w-5 mr-2" />
                                                Leaderboard
                                            </Link>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </>
    );
}

