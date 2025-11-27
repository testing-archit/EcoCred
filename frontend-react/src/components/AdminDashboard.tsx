import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, CheckCircle2, TrendingUp, Settings, Activity, AlertTriangle, Building, FileCheck, Award } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../lib/services/api';
import { BlockchainEventFeed } from './BlockchainEventFeed';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import { useNotifications } from '../contexts/NotificationContext';
import { useBlockchain } from '../hooks/useBlockchain';

interface User {
    id: string;
    walletAddress: string;
    name: string;
    role?: string;
}

interface ActionItem {
    id: string;
    title?: string;
    description?: string;
    status: string;
    creditsEarned?: number;
    createdAt: string;
    company?: { name: string };
}

interface AdminDashboardProps {
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

interface GuidelineItem {
    id: string;
    title: string;
    description: string;
    icon?: string;
}

// Helper to get Lucide icon by name
function getIconComponent(iconName?: string): LucideIcon {
    if (!iconName) return Shield;
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Shield;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
    const [loading, setLoading] = useState(true);
    const { events } = useBlockchainEvents();
    const { addNotification } = useNotifications();
    const { getPlatformStats } = useBlockchain();
    const [stats, setStats] = useState({
        totalCompanies: 0,
        totalActions: 0,
        pendingVerifications: 0,
        verifiedActions: 0,
        totalCreditsMinted: 0,
        platformRevenue: 0,
        activeUsers: 0,
        flaggedItems: 0
    });
    const [recentActions, setRecentActions] = useState<ActionItem[]>([]);
    const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);
    const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Load platform stats from API
            const actionsResponse = await api.getActions(1, 100);
            const companiesResponse = await api.getCompanies(1, 100);
            
            const actions = actionsResponse.data || [];
            const companies = companiesResponse.data || [];

            // Calculate stats
            const pendingActions = actions.filter((a) => a.status === 'PENDING').length;
            const verifiedActionsCount = actions.filter((a) => a.status === 'VERIFIED').length;
            const totalCredits = actions
                .filter((a) => a.status === 'VERIFIED')
                .reduce((sum: number, a) => sum + (a.creditsAwarded || 0), 0);

            // Get blockchain stats if available
            let blockchainStats = null;
            try {
                blockchainStats = await getPlatformStats();
            } catch (error) {
                console.error('Failed to load blockchain stats:', error);
            }

            setStats({
                totalCompanies: companies.length,
                totalActions: actions.length,
                pendingVerifications: pendingActions,
                verifiedActions: verifiedActionsCount,
                totalCreditsMinted: blockchainStats 
                    ? Number(blockchainStats.totalCreditsMinted) / 1e18 
                    : totalCredits,
                platformRevenue: 0, // TODO: Calculate from marketplace fees
                activeUsers: companies.filter((c) => c.verified).length,
                flaggedItems: 0 // TODO: Implement flagging system
            });

            // Set recent actions
            const mappedActions: ActionItem[] = actions.slice(0, 5).reverse().map((a) => ({
                id: a.id,
                title: a.actionType,
                description: a.description,
                status: a.status,
                creditsEarned: a.creditsAwarded,
                createdAt: a.createdAt,
                company: undefined
            }));
            setRecentActions(mappedActions);

            // Load quick actions from API
            try {
                const quickActionsResponse = await api.getQuickActions('ADMIN');
                if (quickActionsResponse.success) {
                    setQuickActions(quickActionsResponse.data);
                }
            } catch (quickActionsError) {
                console.error('Failed to load quick actions:', quickActionsError);
            }

            // Load guidelines from API
            try {
                const guidelinesResponse = await api.getGuidelines('ADMIN');
                if (guidelinesResponse.success) {
                    setGuidelines(guidelinesResponse.data.slice(0, 5));
                }
            } catch (guidelinesError) {
                console.error('Failed to load guidelines:', guidelinesError);
            }
        } catch (error) {
            console.error('Failed to load admin dashboard data:', error);
            addNotification('error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [addNotification, getPlatformStats]);

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
            icon: Building,
            label: "Total Companies",
            value: stats.totalCompanies,
            color: "blue",
            gradient: "from-blue-500 to-cyan-600",
            description: "Registered companies"
        },
        {
            icon: FileCheck,
            label: "Total Actions",
            value: stats.totalActions,
            color: "green",
            gradient: "from-green-500 to-emerald-600",
            description: "All eco actions"
        },
        {
            icon: Activity,
            label: "Pending Verifications",
            value: stats.pendingVerifications,
            color: "yellow",
            gradient: "from-yellow-500 to-amber-600",
            description: "Awaiting review"
        },
        {
            icon: CheckCircle2,
            label: "Verified Actions",
            value: stats.verifiedActions,
            color: "green",
            gradient: "from-green-500 to-teal-600",
            description: "Successfully verified"
        },
        {
            icon: Award,
            label: "Credits Minted",
            value: Math.round(stats.totalCreditsMinted).toLocaleString(),
            color: "purple",
            gradient: "from-purple-500 to-indigo-600",
            description: "Total credits issued"
        },
        {
            icon: Users,
            label: "Active Users",
            value: stats.activeUsers,
            color: "indigo",
            gradient: "from-indigo-500 to-blue-600",
            description: "Verified companies"
        },
        {
            icon: TrendingUp,
            label: "Platform Revenue",
            value: `$${stats.platformRevenue.toLocaleString()}`,
            color: "emerald",
            gradient: "from-emerald-500 to-green-600",
            description: "Marketplace fees"
        },
        {
            icon: AlertTriangle,
            label: "Flagged Items",
            value: stats.flaggedItems,
            color: "red",
            gradient: "from-red-500 to-rose-600",
            description: "Require attention"
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
                        <Shield className="h-8 w-8 text-blue-600" />
                    </motion.div>
                    <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
                </div>
                <p className="text-secondary-600 text-lg">Platform management and oversight</p>
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
                    {/* Stats Grid */}
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
                        {/* Recent Actions */}
                        <motion.div
                            className="lg:col-span-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-secondary-900">Recent Activity</h3>
                                    <Link
                                        to="/actions"
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        View All →
                                    </Link>
                                </div>
                                {recentActions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Activity className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                                        <p className="text-secondary-600">No recent actions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recentActions.map((action, index) => (
                                            <motion.div
                                                key={action.id}
                                                className="border border-secondary-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + index * 0.1 }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-secondary-900 mb-1">
                                                            {action.title || action.description?.substring(0, 50)}
                                                        </h4>
                                                        <p className="text-sm text-secondary-600 mb-2">
                                                            {action.company?.name || 'Unknown Company'}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs text-secondary-500">
                                                            <span className={`px-2 py-1 rounded-full ${
                                                                action.status === 'VERIFIED' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : action.status === 'PENDING'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {action.status}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(action.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            className="lg:col-span-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl mb-6">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-6">Quick Actions</h3>
                                <div className="space-y-3">
                                    {quickActions.length > 0 ? (
                                        quickActions.map((action) => {
                                            const IconComponent = getIconComponent(action.icon);
                                            if (action.route === '#refresh') {
                                                return (
                                                    <motion.div key={action.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        <button
                                                            onClick={loadDashboardData}
                                                            disabled={loading}
                                                            className={`${action.isPrimary ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center w-full disabled:opacity-50`}
                                                        >
                                                            <IconComponent className="h-5 w-5 mr-2" />
                                                            {loading ? 'Refreshing...' : action.title}
                                                        </button>
                                                    </motion.div>
                                                );
                                            }
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
                                                    <Users className="h-5 w-5 mr-2" />
                                                    Manage Companies
                                                </Link>
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Link to="/actions" className="btn-secondary flex items-center justify-center w-full">
                                                    <FileCheck className="h-5 w-5 mr-2" />
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
                                                <button
                                                    onClick={loadDashboardData}
                                                    disabled={loading}
                                                    className="btn-secondary flex items-center justify-center w-full disabled:opacity-50"
                                                >
                                                    <Activity className="h-5 w-5 mr-2" />
                                                    {loading ? 'Refreshing...' : 'Refresh Data'}
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Admin Guidelines */}
                            <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-6">Admin Guidelines</h3>
                                <div className="space-y-4">
                                    {guidelines.length > 0 ? (
                                        guidelines.map((guideline, index) => {
                                            const IconComponent = getIconComponent(guideline.icon);
                                            const colors = ['text-blue-600', 'text-purple-600', 'text-yellow-600', 'text-green-600', 'text-cyan-600'];
                                            return (
                                                <div key={guideline.id} className="flex items-start gap-3">
                                                    <IconComponent className={`h-5 w-5 ${colors[index % colors.length]} mt-0.5 flex-shrink-0`} />
                                                    <div>
                                                        <p className="font-medium text-secondary-900 text-sm">{guideline.title}</p>
                                                        <p className="text-xs text-secondary-600">{guideline.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <>
                                            <div className="flex items-start gap-3">
                                                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-secondary-900 text-sm">Platform Oversight</p>
                                                    <p className="text-xs text-secondary-600">Monitor all platform activities</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Settings className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-secondary-900 text-sm">System Management</p>
                                                    <p className="text-xs text-secondary-600">Configure platform settings</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-secondary-900 text-sm">Issue Resolution</p>
                                                    <p className="text-xs text-secondary-600">Address flagged items</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Blockchain Events */}
                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <BlockchainEventFeed maxEvents={10} roleFilter={false} />
                    </motion.div>
                </>
            )}
        </>
    );
}

