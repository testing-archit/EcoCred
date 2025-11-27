import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Leaf, CheckCircle } from 'lucide-react';
import { api } from '../lib/services/api';
import { useUser } from '../contexts/UserContext';
import { cn } from '../lib/utils';

interface Action {
    id: string;
    action: string;
    credits: number;
    status: string;
    timestamp: string;
    type: string;
}

export function RecentActions() {
    const [recentActions, setRecentActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(false);
    const { user, isAuthenticated } = useUser();

    const loadRecentActions = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (isAuthenticated && user?.id) {
                response = await api.getCompanyActions(user.id, 1, 5);
            } else {
                response = await api.getActions(1, 5);
            }

            const actionsData = response.data || [];
            const actions = actionsData.map((action) => ({
                id: action.id,
                action: action.description || action.actionType || 'Eco Action',
                credits: action.creditsAwarded || 0,
                status: action.status?.toLowerCase() || 'pending',
                timestamp: formatTimestamp(action.createdAt),
                type: action.actionType || 'other'
            }));
            setRecentActions(actions);
        } catch (error) {
            console.error('Failed to load recent actions:', error);
            setRecentActions([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        loadRecentActions();
    }, [loadRecentActions]);

    function formatTimestamp(dateString: string): string {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        return date.toLocaleDateString();
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'verified':
                return 'text-green-600 bg-green-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            case 'rejected':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-secondary-600 bg-secondary-100';
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'verified':
                return CheckCircle;
            case 'pending':
                return Clock;
            default:
                return Clock;
        }
    }

    return (
        <motion.div 
            className="card h-full p-6 bg-white shadow-sm border border-secondary-200 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">Recent Actions</h3>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Clock className="h-6 w-6 text-secondary-400 animate-spin" />
                </div>
            ) : recentActions.length === 0 ? (
                <motion.div 
                    className="text-center py-8 text-secondary-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p>No recent actions found</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {recentActions.map((action, index) => {
                        const Icon = getStatusIcon(action.status);
                        return (
                            <motion.div 
                                key={action.id} 
                                className="flex items-start space-x-3 p-4 bg-gradient-to-r from-secondary-50 to-white rounded-lg border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all group mb-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                whileHover={{ x: 5, scale: 1.01 }}
                            >
                                <motion.div 
                                    className="flex-shrink-0"
                                    whileHover={{ rotate: 15, scale: 1.1 }}
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                                        <Leaf className="h-5 w-5 text-white" />
                                    </div>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
                                        {action.action}
                                    </p>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-secondary-500 flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {action.timestamp}
                                        </span>
                                        {action.credits > 0 && (
                                            <motion.span 
                                                className="text-sm font-bold text-primary-600"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                                            >
                                                +{action.credits} CCT
                                            </motion.span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <motion.div 
                                            className={cn("flex items-center px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(action.status))}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                                        >
                                            <Icon className="h-3 w-3 mr-1.5" />
                                            <span className="capitalize">{action.status}</span>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <motion.div 
                className="mt-4 pt-4 border-t border-secondary-200"
                whileHover={{ x: 5 }}
            >
                <Link to="/actions" className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1 group">
                    View all actions 
                    <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        →
                    </motion.span>
                </Link>
            </motion.div>
        </motion.div>
    );
}
