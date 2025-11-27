import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, FileCheck, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../lib/services/api';
import { VerificationModal } from './VerificationModal';
import { BlockchainEventFeed } from './BlockchainEventFeed';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import { useNotifications } from '../contexts/NotificationContext';
import { useBlockchain } from '../hooks/useBlockchain';
import { TransactionStatus } from './TransactionStatus';
import { ContractTransactionResponse, ethers } from 'ethers';

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
    estimatedCredits?: number;
    creditsEarned?: number;
    creditsAwarded?: number;
    blockchainActionId?: string;
    createdAt: string;
    updatedAt?: string;
    company?: { name: string };
}

interface VerifierDashboardProps {
    user: User;
}

interface GuidelineItem {
    id: string;
    title: string;
    description: string;
    icon?: string;
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
    if (!iconName) return FileCheck;
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || FileCheck;
}

export function VerifierDashboard({ user }: VerifierDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const { events } = useBlockchainEvents();
    const [stats, setStats] = useState({
        pendingActions: 0,
        verifiedToday: 0,
        rejectedToday: 0,
        totalVerified: 0,
        verificationRate: 0
    });
    const [pendingActions, setPendingActions] = useState<ActionItem[]>([]);
    const [pendingTransaction, setPendingTransaction] = useState<ContractTransactionResponse | null>(null);
    const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);
    const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);
    const { addNotification } = useNotifications();
    const { logEcoAction, verifyAction } = useBlockchain();

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Load pending actions for verification
            const actionsResponse = await api.getActions(1, 50, 'PENDING');
            const actions = actionsResponse.data || [];

            // Load action types to calculate estimated credits
            const actionTypesResponse = await api.getActionTypes();
            const actionTypesMap = new Map(
                actionTypesResponse.map((at: { type: string; defaultCreditsPerUnit?: number; minCreditsPerUnit?: number; maxCreditsPerUnit?: number }) => [
                    at.type,
                    at.defaultCreditsPerUnit || at.minCreditsPerUnit || 0
                ])
            );

            const mappedActions: ActionItem[] = actions.slice(0, 5).map((a: any) => {
                // Use estimatedCredits from backend if available, otherwise calculate it
                // Backend now calculates estimated credits for pending actions
                const estimatedCredits = a.estimatedCredits !== undefined && a.estimatedCredits > 0
                    ? a.estimatedCredits
                    : (a.status === 'PENDING' && a.quantity) 
                        ? (a.quantity * (actionTypesMap.get(a.actionType) || 0))
                        : (a.creditsAwarded || 0);

                console.log('[VerifierDashboard] Mapping action:', {
                    id: a.id,
                    actionType: a.actionType,
                    company: a.company,
                    estimatedCredits,
                    creditsAwarded: a.creditsAwarded,
                    quantity: a.quantity
                });

                return {
                    id: a.id,
                    title: a.actionType,
                    description: a.description,
                    status: a.status,
                    estimatedCredits: estimatedCredits,
                    creditsEarned: a.creditsAwarded || 0,
                    creditsAwarded: a.creditsAwarded || 0,
                    blockchainActionId: a.blockchainActionId?.toString(),
                    createdAt: a.createdAt,
                    updatedAt: a.updatedAt,
                    company: a.company ? { name: a.company.name || 'Unknown Company' } : { name: 'Unknown Company' }
                };
            });
            setPendingActions(mappedActions);

            // Load guidelines from API
            try {
                const guidelinesResponse = await api.getGuidelines('VERIFIER');
                if (guidelinesResponse.success) {
                    setGuidelines(guidelinesResponse.data.slice(0, 5));
                }
            } catch (guidelinesError) {
                console.error('Failed to load guidelines:', guidelinesError);
            }

            // Load quick actions from API
            try {
                const quickActionsResponse = await api.getQuickActions('VERIFIER');
                if (quickActionsResponse.success) {
                    setQuickActions(quickActionsResponse.data);
                }
            } catch (quickActionsError) {
                console.error('Failed to load quick actions:', quickActionsError);
            }

            // Load verifier stats
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Get verifier's verifications
                const allActions = await api.getActions(1, 1000);
                const allActionsList = allActions.data || [];

                // Calculate stats
                const verifiedToday = allActionsList.filter((a) => {
                    if (a.status !== 'VERIFIED') return false;
                    const verifiedDate = new Date(a.updatedAt || a.createdAt);
                    return verifiedDate >= today;
                }).length;

                const rejectedToday = allActionsList.filter((a) => {
                    if (a.status !== 'REJECTED') return false;
                    const rejectedDate = new Date(a.updatedAt || a.createdAt);
                    return rejectedDate >= today;
                }).length;

                const totalVerified = allActionsList.filter((a) => a.status === 'VERIFIED').length;
                const totalProcessed = allActionsList.filter((a) =>
                    a.status === 'VERIFIED' || a.status === 'REJECTED'
                ).length;

                const verificationRate = totalProcessed > 0
                    ? Math.round((totalVerified / totalProcessed) * 100)
                    : 0;

                setStats({
                    pendingActions: actions.length,
                    verifiedToday,
                    rejectedToday,
                    totalVerified,
                    verificationRate
                });
            } catch (statsError) {
                console.error('Failed to load stats:', statsError);
                setStats({
                    pendingActions: actions.length,
                    verifiedToday: 0,
                    rejectedToday: 0,
                    totalVerified: 0,
                    verificationRate: 0
                });
            }
        } catch (error) {
            console.error('Failed to load verifier dashboard data:', error);
            addNotification('error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        loadDashboardData();
    }, [user?.id, loadDashboardData]);

    // Auto-refresh when blockchain events occur (verification events)
    useEffect(() => {
        if (events.length > 0) {
            const hasVerificationEvent = events.some(e =>
                e.type === 'ActionVerified' || e.type === 'CreditsMinted'
            );
            if (hasVerificationEvent) {
                loadDashboardData();
            }
        }
        // Only react to new events being added, not the entire events array
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events.length, loadDashboardData]);

    async function handleVerifyAction(approved: boolean, comments: string) {
        if (!selectedAction) {
            console.error('No action selected for verification');
            return;
        }

        setVerifying(selectedAction.id);
        try {
            console.log('Verifying action:', { 
                actionId: selectedAction.id, 
                approved, 
                comments 
            });
            
            // First, verify via backend API
            const response = await api.verifyAction(selectedAction.id, approved, comments);
            console.log('Backend verification response:', response);

            // Execute blockchain smart contract verification
            if (approved) {
                try {
                    const actualCredits = selectedAction.creditsEarned || 
                                         selectedAction.creditsAwarded || 
                                         selectedAction.estimatedCredits || 0;
                    
                    if (actualCredits <= 0) {
                        console.warn('[VerifierDashboard] No credits to award, skipping blockchain verification');
                    } else {
                        let blockchainActionId = selectedAction.blockchainActionId;
                        
                        // Step 1: Ensure action is logged on blockchain
                        // If action doesn't exist on blockchain yet, log it first
                        if (!blockchainActionId) {
                            console.log('[VerifierDashboard] Action not on blockchain yet. Logging action first...');
                            
                            // Get full action details including company wallet address
                            const actionDetails = await api.get(`/actions/${selectedAction.id}`) as any;
                            const companyAddress = actionDetails?.company?.walletAddress;
                            
                            if (!companyAddress) {
                                throw new Error('Company wallet address not found. Cannot log action on blockchain.');
                            }
                            
                            // Determine action title and category
                            const actionTitle = selectedAction.title || 
                                               selectedAction.description?.substring(0, 50) || 
                                               'Eco Action';
                            const actionDescription = selectedAction.description || '';
                            const actionCategory = (actionDetails?.actionType as string) || 'general';
                            const actionLocation = (actionDetails?.location as string) || 'N/A';
                            
                            console.log('[VerifierDashboard] Logging action on blockchain:', {
                                title: actionTitle,
                                description: actionDescription.substring(0, 100),
                                estimatedCredits: actualCredits,
                                category: actionCategory,
                                company: companyAddress
                            });
                            
                            // IMPORTANT: Log the action on blockchain
                            // Note: The contract sets action.company = msg.sender, so this will create
                            // an action attributed to the verifier. However, this is a workaround for
                            // actions that weren't logged when submitted. In production, companies
                            // should log actions to blockchain when submitting them.
                            // TODO: Consider adding a contract function to log on behalf of company
                            console.warn('[VerifierDashboard] Logging action on blockchain from verifier wallet. In production, companies should log actions when submitting.');
                            const logTx = await logEcoAction(
                                actionTitle,
                                actionDescription,
                                actualCredits,
                                actionLocation,
                                actionCategory
                            );
                            
                            if (!logTx) {
                                throw new Error('Failed to log action on blockchain');
                            }
                            
                            // Wait for transaction to be mined
                            console.log('[VerifierDashboard] Waiting for logEcoAction transaction confirmation...');
                            addNotification('info', 'Logging action on blockchain...');
                            
                            const logReceipt = await logTx.wait();
                            if (!logReceipt) {
                                throw new Error('Transaction receipt not available');
                            }
                            
                            console.log('[VerifierDashboard] Log transaction confirmed:', {
                                hash: logReceipt.hash,
                                blockNumber: logReceipt.blockNumber
                            });
                            
                            // Extract blockchain action ID from transaction receipt events
                            const ecoLedgerInterface = new ethers.Interface([
                                "event EcoActionLogged(uint256 indexed actionId, address indexed company, string title, string category)"
                            ]);
                            
                            let extractedActionId: number | null = null;
                            
                            // Parse logs to find EcoActionLogged event
                            if (logReceipt.logs && logReceipt.logs.length > 0) {
                                for (const log of logReceipt.logs) {
                                    try {
                                        const parsedLog = ecoLedgerInterface.parseLog({
                                            topics: log.topics,
                                            data: log.data
                                        });
                                        
                                        if (parsedLog && parsedLog.name === 'EcoActionLogged') {
                                            extractedActionId = Number(parsedLog.args.actionId);
                                            console.log('[VerifierDashboard] ✅ Extracted blockchain action ID:', extractedActionId);
                                            break;
                                        }
                                    } catch (parseError) {
                                        // Not the log we're looking for, continue
                                        continue;
                                    }
                                }
                            }
                            
                            if (!extractedActionId) {
                                console.error('[VerifierDashboard] Failed to extract action ID from logs:', logReceipt.logs);
                                throw new Error('Failed to extract blockchain action ID from transaction. Check transaction logs manually.');
                            }
                            
                            blockchainActionId = extractedActionId.toString();
                            
                            // Update database with blockchain action ID
                            console.log('[VerifierDashboard] Updating database with blockchain action ID...');
                            await api.patch(`/actions/${selectedAction.id}/blockchain`, {
                                blockchainActionId: extractedActionId,
                                txHash: logReceipt.hash,
                                blockNumber: logReceipt.blockNumber
                            });
                            
                            console.log('[VerifierDashboard] ✅ Database updated with blockchain action ID:', extractedActionId);
                            addNotification('success', `Action logged on blockchain (ID: ${extractedActionId})`);
                        } else {
                            console.log('[VerifierDashboard] Action already on blockchain with ID:', blockchainActionId);
                        }
                        
                        // Step 2: Verify the action on blockchain
                        if (!blockchainActionId) {
                            throw new Error('Blockchain action ID is required for verification');
                        }
                        
                        console.log('[VerifierDashboard] Verifying action on blockchain...', {
                            blockchainActionId,
                            approved,
                            actualCredits
                        });
                        
                        addNotification('info', `Verifying action on blockchain (Action ID: ${blockchainActionId})...`);
                        
                        const verifyTx = await verifyAction(
                            parseInt(blockchainActionId.toString()), 
                            approved, 
                            actualCredits
                        );
                        
                        if (!verifyTx) {
                            throw new Error('Failed to create verification transaction');
                        }
                        
                        console.log('[VerifierDashboard] Verification transaction sent:', verifyTx.hash);
                        setPendingTransaction(verifyTx);
                        
                        // Wait for verification transaction to be mined
                        console.log('[VerifierDashboard] Waiting for verification transaction confirmation...');
                        addNotification('info', 'Verification transaction submitted. Waiting for confirmation...');
                        
                        const verifyReceipt = await verifyTx.wait();
                        if (!verifyReceipt) {
                            throw new Error('Verification transaction receipt not available');
                        }
                        
                        console.log('[VerifierDashboard] ✅ Verification transaction confirmed:', {
                            hash: verifyReceipt.hash,
                            blockNumber: verifyReceipt.blockNumber
                        });
                        
                        // Update database with verification transaction details
                        await api.patch(`/actions/${selectedAction.id}/blockchain`, {
                            txHash: verifyReceipt.hash,
                            blockNumber: verifyReceipt.blockNumber
                        });
                        
                        addNotification('success', '✅ Action verified on blockchain! Credits have been minted.');
                        console.log('[VerifierDashboard] ✅ Blockchain verification complete!');
                    }
                } catch (blockchainError) {
                    console.error('[VerifierDashboard] ❌ Blockchain execution failed:', blockchainError);
                    const errorMessage = blockchainError instanceof Error ? blockchainError.message : 'Blockchain execution failed';
                    addNotification('warning', `⚠️ Action verified in database, but blockchain execution failed: ${errorMessage}. You can retry verification later.`);
                    // Don't throw - allow database verification to succeed even if blockchain fails
                }
            } else {
                // Rejection - no blockchain action needed
                console.log('[VerifierDashboard] Action rejected, no blockchain verification needed');
            }

            // Reload data
            await loadDashboardData();

            addNotification('success', `Action ${approved ? 'approved' : 'rejected'} successfully`);
            setShowVerificationModal(false);
            setSelectedAction(null);
        } catch (error) {
            console.error('Verification failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            addNotification('error', errorMessage);
            throw error;
        } finally {
            setVerifying(null);
        }
    }

    function openVerificationModal(action: ActionItem) {
        setSelectedAction(action);
        setShowVerificationModal(true);
    }

    const statCards = [
        {
            icon: Clock,
            label: "Pending Actions",
            value: stats.pendingActions,
            color: "yellow",
            gradient: "from-yellow-500 to-amber-600",
            description: "Awaiting verification"
        },
        {
            icon: CheckCircle2,
            label: "Verified Today",
            value: stats.verifiedToday,
            color: "green",
            gradient: "from-green-500 to-emerald-600",
            description: "Actions approved"
        },
        {
            icon: XCircle,
            label: "Rejected Today",
            value: stats.rejectedToday,
            color: "red",
            gradient: "from-red-500 to-rose-600",
            description: "Actions rejected"
        },
        {
            icon: TrendingUp,
            label: "Verification Rate",
            value: `${stats.verificationRate}%`,
            color: "blue",
            gradient: "from-blue-500 to-cyan-600",
            description: "This week"
        }
    ];

    return (
        <>
            <TransactionStatus
                transaction={pendingTransaction}
                onComplete={() => {
                    setPendingTransaction(null);
                    addNotification('success', 'Action successfully verified on blockchain!');
                    loadDashboardData();
                }}
                onError={(error) => {
                    setPendingTransaction(null);
                    addNotification('error', `Blockchain verification failed: ${error.message}`);
                }}
            />
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
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </motion.div>
                    <h1 className="text-4xl font-bold gradient-text">Verifier Dashboard</h1>
                </div>
                <p className="text-secondary-600 text-lg">Review and verify eco actions submitted by companies</p>
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
                                    <h3 className="text-lg font-semibold text-secondary-900">Pending Verifications</h3>
                                    <Link
                                        to="/actions"
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        View All →
                                    </Link>
                                </div>
                                {pendingActions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileCheck className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                                        <p className="text-secondary-600">No pending actions to verify</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingActions.map((action, index) => (
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
                                                            <span>Estimated: {action.estimatedCredits || 0} credits</span>
                                                            <span>•</span>
                                                            <span>{new Date(action.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openVerificationModal(action)}
                                                            disabled={verifying === action.id}
                                                            className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                                                        >
                                                            {verifying === action.id ? 'Verifying...' : 'Review'}
                                                        </button>
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
                                <h3 className="text-lg font-semibold text-secondary-900 mb-6">Verification Guidelines</h3>
                                <div className="space-y-4">
                                    {guidelines.length > 0 ? (
                                        guidelines.map((guideline, index) => {
                                            const IconComponent = getIconComponent(guideline.icon);
                                            const colors = ['text-green-600', 'text-yellow-600', 'text-blue-600', 'text-purple-600', 'text-cyan-600'];
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
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">Verify Evidence</p>
                                            <p className="text-xs text-secondary-600">Check all supporting documents</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">Assess Impact</p>
                                            <p className="text-xs text-secondary-600">Evaluate environmental benefit</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FileCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">Multi-Verification</p>
                                            <p className="text-xs text-secondary-600">Requires consensus</p>
                                        </div>
                                    </div>
                                        </>
                                    )}
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
                        <BlockchainEventFeed maxEvents={8} roleFilter={true} />
                    </motion.div>

                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                    >
                        <div className="card p-6 bg-white shadow-sm border border-secondary-200 rounded-xl">
                            <h3 className="text-lg font-semibold text-secondary-900 mb-6">Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    <Link to="/actions" className="btn-primary flex items-center justify-center w-full">
                                        <FileCheck className="h-5 w-5 mr-2" />
                                        Review Actions
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
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to="/analytics" className="btn-secondary flex items-center justify-center w-full">
                                        <TrendingUp className="h-5 w-5 mr-2" />
                                        Analytics
                                    </Link>
                                </motion.div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => {
                    setShowVerificationModal(false);
                    setSelectedAction(null);
                }}
                action={selectedAction}
                onVerify={handleVerifyAction}
            />
        </>
    );
}

