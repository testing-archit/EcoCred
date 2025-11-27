import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, AlertTriangle, TrendingUp, FileText, Activity, Users, CheckCircle2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../lib/services/api';
import { BlockchainEventFeed } from './BlockchainEventFeed';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import { useBlockchain } from '../hooks/useBlockchain';

interface User {
    id: string;
    walletAddress: string;
    name: string;
    role?: string;
}

interface FlaggedItem {
    id: string;
    title: string;
    description: string;
}

interface AuditorDashboardProps {
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
    if (!iconName) return Shield;
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Shield;
}

export function AuditorDashboard({ user }: AuditorDashboardProps) {
    const [loading, setLoading] = useState(true);
    const { events } = useBlockchainEvents();
    const { getPlatformStats } = useBlockchain();
    const [stats, setStats] = useState({
        totalAudits: 0,
        auditsThisMonth: 0,
        issuesFound: 0,
        complianceRate: 0,
        companiesAudited: 0,
        onChainActions: 0,
        totalCreditsMinted: 0
    });
    const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
    const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const overview = await api.getOverview();

            const newStats = {
                totalAudits: 0,
                auditsThisMonth: 0,
                issuesFound: 0,
                complianceRate: 95,
                companiesAudited: overview.companies?.total || 0,
                onChainActions: 0,
                totalCreditsMinted: 0
            };

            // Load blockchain statistics
            try {
                const platformStats = await getPlatformStats();
                if (platformStats) {
                    newStats.onChainActions = Number(platformStats.totalActions) || 0;
                    newStats.totalCreditsMinted = Number(platformStats.totalCreditsIssued) || 0;
                }
            } catch (error) {
                console.error('Failed to load blockchain stats:', error);
            }

            setStats(newStats);
            // Load flagged items or suspicious activities
            setFlaggedItems([]);

            // Load quick actions from API
            try {
                const quickActionsResponse = await api.getQuickActions('AUDITOR');
                if (quickActionsResponse.success) {
                    setQuickActions(quickActionsResponse.data);
                }
            } catch (quickActionsError) {
                console.error('Failed to load quick actions:', quickActionsError);
            }
        } catch (error) {
            console.error('Failed to load auditor dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [getPlatformStats]);

    useEffect(() => {
        loadDashboardData();
    }, [user?.id, loadDashboardData]);

    // Auto-refresh when blockchain events occur
    useEffect(() => {
        if (events.length > 0) {
            loadDashboardData();
        }
    }, [events.length, loadDashboardData]);

    const statCards = [
        {
            icon: FileText,
            label: "Total Audits",
            value: stats.totalAudits,
            color: "blue",
            gradient: "from-blue-500 to-cyan-600",
            description: "All time"
        },
        {
            icon: Activity,
            label: "This Month",
            value: stats.auditsThisMonth,
            color: "green",
            gradient: "from-green-500 to-emerald-600",
            description: "Audits conducted"
        },
        {
            icon: AlertTriangle,
            label: "Issues Found",
            value: stats.issuesFound,
            color: "red",
            gradient: "from-red-500 to-rose-600",
            description: "Requires attention"
        },
        {
            icon: CheckCircle2,
            label: "Compliance Rate",
            value: `${stats.complianceRate}%`,
            color: "purple",
            gradient: "from-purple-500 to-indigo-600",
            description: "Platform-wide"
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
                        <Shield className="h-8 w-8 text-purple-600" />
                    </motion.div>
                    <h1 className="text-4xl font-bold gradient-text">Auditor Dashboard</h1>
                </div>
                <p className="text-secondary-600 text-lg">Monitor platform activities, compliance, and detect anomalies</p>
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
                                            <p className="text-xs text-secondary-500 mt-1">{stat.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div
                            className="lg:col-span-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-secondary-900">Flagged Items</h3>
                                    <Link
                                        to="/analytics"
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        View All →
                                    </Link>
                                </div>
                                {flaggedItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                        <p className="text-secondary-600 font-medium">No flagged items</p>
                                        <p className="text-sm text-secondary-500 mt-2">Platform is operating normally</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {flaggedItems.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                className="border border-red-200 bg-red-50 rounded-lg p-4"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + index * 0.1 }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-secondary-900 mb-1">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-sm text-secondary-600">{item.description}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            className="lg:col-span-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-6">Audit Tools</h3>
                                <div className="space-y-3">
                                    <Link
                                        to="/companies"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors border border-secondary-200"
                                    >
                                        <Users className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">Company Audits</p>
                                            <p className="text-xs text-secondary-600">Review company profiles</p>
                                        </div>
                                    </Link>
                                    <Link
                                        to="/actions"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors border border-secondary-200"
                                    >
                                        <FileText className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">Action Audits</p>
                                            <p className="text-xs text-secondary-600">Verify action integrity</p>
                                        </div>
                                    </Link>
                                    <Link
                                        to="/analytics"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors border border-secondary-200"
                                    >
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">Analytics</p>
                                            <p className="text-xs text-secondary-600">Platform insights</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Blockchain Statistics</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium text-secondary-700">On-Chain Actions</span>
                                        <span className="text-xl font-bold text-blue-600">{stats.onChainActions}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <span className="text-sm font-medium text-secondary-700">Total Credits Minted</span>
                                        <span className="text-xl font-bold text-green-600">{stats.totalCreditsMinted}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <span className="text-sm font-medium text-secondary-700">Companies Audited</span>
                                        <span className="text-xl font-bold text-purple-600">{stats.companiesAudited}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <BlockchainEventFeed maxEvents={6} roleFilter={false} />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
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
                                            <Link to="/companies" className="btn-primary flex items-center justify-center w-full">
                                                <Search className="h-5 w-5 mr-2" />
                                                Audit Companies
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/actions" className="btn-secondary flex items-center justify-center w-full">
                                                <FileText className="h-5 w-5 mr-2" />
                                                Review Actions
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/analytics" className="btn-secondary flex items-center justify-center w-full">
                                                <TrendingUp className="h-5 w-5 mr-2" />
                                                Platform Analytics
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Link to="/governance" className="btn-secondary flex items-center justify-center w-full">
                                                <Shield className="h-5 w-5 mr-2" />
                                                Governance
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

