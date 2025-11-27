import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Leaf, CheckCircle, Clock, XCircle } from 'lucide-react';
import { api } from '../lib/services/api';
import { useUser } from '../contexts/UserContext';
import { useBlockchain } from '../hooks/useBlockchain';
import { TransactionStatus } from '../components/TransactionStatus';
import { VerificationModal } from '../components/VerificationModal';
import { useNotifications } from '../contexts/NotificationContext';
import { ContractTransactionResponse, Interface } from 'ethers';

interface EcoAction {
    id: string;
    type: string;
    description: string;
    creditsEarned: number;
    status: string;
    createdAt: string;
    verifiedAt?: string;
    blockchainActionId?: number;
    estimatedCredits?: number;
    company?: { name: string };
    actionType?: string;
}

interface ActionType {
    id: string;
    type: string;
    label: string;
    name?: string;
    description?: string;
    unit: string;
    minCreditsPerUnit: number;
    maxCreditsPerUnit: number;
    defaultCreditsPerUnit: number;
    baseCredits?: number;
}

export function Actions() {
    const [actions, setActions] = useState<EcoAction[]>([]);
    const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [selectedActionForVerification, setSelectedActionForVerification] = useState<EcoAction | null>(null);
    const [pendingTransaction, setPendingTransaction] = useState<ContractTransactionResponse | null>(null);
    const { isAuthenticated, user } = useUser();
    const { logEcoAction, verifyAction } = useBlockchain();
    const { addNotification } = useNotifications();
    
    const isVerifier = user?.role?.toUpperCase() === 'VERIFIER';
    const isAuditor = user?.role?.toUpperCase() === 'AUDITOR';
    const isCompany = !isVerifier && !isAuditor;
    
    // Debug: Log role info
    useEffect(() => {
        console.log('Actions Page - User role:', user?.role, 'isVerifier:', isVerifier, 'isAuditor:', isAuditor, 'isCompany:', isCompany);
    }, [user?.role, isVerifier, isAuditor, isCompany]);

    const [formData, setFormData] = useState({
        actionType: '',
        description: '',
        quantity: '',
        unit: '',
        evidence: ''
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('[Actions] Loading data - isAuthenticated:', isAuthenticated, 'isVerifier:', isVerifier, 'isAuditor:', isAuditor);
            let actionsRes;
            if (isVerifier || isAuditor) {
                // Verifiers and Auditors see pending actions
                console.log('[Actions] Loading pending actions for verifier/auditor');
                actionsRes = await api.getActions(1, 100, 'PENDING');
            } else {
                // Companies see their own actions (backend filters by company if authenticated)
                console.log('[Actions] Loading actions for company user');
                actionsRes = isAuthenticated ? await api.getActions(1, 100) : { data: [] };
            }
            console.log('[Actions] API response:', actionsRes);
            
            let typesRes: ActionType[] = [];
            try {
                typesRes = await api.getActionTypes();
                // Ensure we always have an array
                if (!Array.isArray(typesRes)) {
                    console.warn('Action types response is not an array:', typesRes);
                    typesRes = [];
                }
            } catch (error) {
                console.error('Failed to load action types:', error);
                typesRes = [];
            }
            
            const actionsData = actionsRes.data || actionsRes.actions || [];
            console.log('[Actions] Actions data array length:', actionsData.length, 'data:', actionsData);
            const mappedActions: EcoAction[] = actionsData.map((a: {
                id: string;
                actionType: string;
                description: string;
                creditsAwarded?: number;
                status: string;
                createdAt: string;
                updatedAt?: string;
                blockchainActionId?: number;
                company?: { id: string; name: string; walletAddress: string; verified?: boolean };
            }) => ({
                id: a.id,
                type: a.actionType,
                description: a.description,
                creditsEarned: a.creditsAwarded || 0,
                status: a.status,
                createdAt: a.createdAt,
                verifiedAt: a.updatedAt,
                blockchainActionId: a.blockchainActionId,
                estimatedCredits: a.creditsAwarded || 0,
                company: a.company ? { name: a.company.name } : undefined,
                actionType: a.actionType
            }));
            
            console.log('[Actions] Successfully loaded', mappedActions.length, 'actions');
            setActions(mappedActions);
            setActionTypes(typesRes);
        } catch (error) {
            console.error('[Actions] Failed to load data:', error);
            setActions([]);
        } finally {
            setLoading(false);
        }
    }, [isVerifier, isAuditor, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        if (!isAuthenticated) {
            addNotification('error', 'Please log in to submit an action');
            return;
        }

        // Validate form
        if (!formData.actionType) {
            addNotification('error', 'Please select an action type');
            return;
        }
        if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) {
            addNotification('error', 'Please enter a valid quantity');
            return;
        }
        if (!formData.unit) {
            addNotification('error', 'Please enter a unit');
            return;
        }
        if (!formData.description || formData.description.length < 10) {
            addNotification('error', 'Please enter a description (minimum 10 characters)');
            return;
        }

        setSubmitting(true);
        try {
            const selectedType = Array.isArray(actionTypes) 
                ? actionTypes.find(t => t.type === formData.actionType || t.id === formData.actionType)
                : null;
            
            // Submit to backend (don't execute blockchain yet - wait for verification)
            console.log('[Actions] Submitting action:', {
                actionType: formData.actionType,
                description: formData.description,
                quantity: parseInt(formData.quantity, 10),
                unit: formData.unit || selectedType?.unit || 'unit'
            });
            
            const submittedAction = await api.submitAction({
                actionType: formData.actionType,
                description: formData.description,
                quantity: parseInt(formData.quantity, 10),
                unit: formData.unit || selectedType?.unit || 'unit'
            });
            
            console.log('[Actions] Action submitted successfully:', submittedAction);

            addNotification('success', 'Action submitted successfully! A verifier will review it before blockchain execution.');
            setShowModal(false);
            setFormData({ actionType: '', description: '', quantity: '', unit: '', evidence: '' });
            
            // Wait a moment for database to be updated, then reload
            setTimeout(async () => {
                console.log('[Actions] Reloading actions after submission...');
                await loadData();
            }, 500);
        } catch (error) {
            console.error('Failed to submit action:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit action';
            addNotification('error', errorMessage);
            // Don't close modal on error - let user retry
        } finally {
            setSubmitting(false);
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <CheckCircle className="text-green-600" size={20} />;
            case 'PENDING':
                return <Clock className="text-yellow-600" size={20} />;
            case 'REJECTED':
                return <XCircle className="text-red-600" size={20} />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    async function handleVerifyAction(approved: boolean, comments: string) {
        if (!selectedActionForVerification) {
            console.error('No action selected for verification');
            return;
        }

        try {
            setSubmitting(true);
            console.log('Verifying action:', { 
                actionId: selectedActionForVerification.id, 
                approved, 
                comments 
            });
            
            // First, verify via backend API
            const response = await api.verifyAction(selectedActionForVerification.id, approved, comments);
            console.log('Backend verification response:', response);
            
            // Execute blockchain smart contract AFTER verification approval
            if (approved) {
                try {
                    const actualCredits = response?.action?.creditsAwarded || 
                                         selectedActionForVerification.creditsEarned || 
                                         selectedActionForVerification.estimatedCredits || 0;
                    
                    if (actualCredits > 0) {
                        // Get blockchain action ID from database response
                        let blockchainActionId = response?.action?.blockchainActionId || 
                                                response?.blockchainActionId ||
                                                selectedActionForVerification.blockchainActionId;
                        
                        // Step 1: If not logged yet, log the action to blockchain first
                        if (!blockchainActionId) {
                            addNotification('info', 'Logging action to blockchain...');
                            const logTx = await logEcoAction(
                                selectedActionForVerification.description.substring(0, 50),
                                selectedActionForVerification.description,
                                actualCredits,
                                'Global',
                                selectedActionForVerification.actionType || selectedActionForVerification.type || 'Other'
                            );
                            
                            if (logTx) {
                                const receipt = await logTx.wait();
                                // Extract action ID from event logs
                                const ecoLedgerInterface = new ethers.Interface([
                                    'event EcoActionLogged(uint256 indexed actionId, address indexed company, string title, string category)'
                                ]);
                                
                                let foundActionId: number | null = null;
                                for (const log of receipt.logs) {
                                    try {
                                        const parsed = ecoLedgerInterface.parseLog({
                                            topics: log.topics as string[],
                                            data: log.data
                                        });
                                        if (parsed && parsed.name === 'EcoActionLogged') {
                                            foundActionId = Number(parsed.args.actionId);
                                            break;
                                        }
                                    } catch {
                                        // Not the event we're looking for
                                    }
                                }
                                
                                if (foundActionId) {
                                    blockchainActionId = foundActionId;
                                    // Update backend with blockchain action ID
                                    await api.updateActionBlockchain(selectedActionForVerification.id, {
                                        blockchainActionId: foundActionId,
                                        txHash: receipt.hash,
                                        blockNumber: receipt.blockNumber
                                    });
                                }
                                addNotification('info', `Action logged to blockchain with ID: ${foundActionId || 'pending'}...`);
                            }
                        }
                        
                        // Step 2: Verify on blockchain to mint credits
                        if (blockchainActionId) {
                            const verifyTx = await verifyAction(Number(blockchainActionId), true, actualCredits);
                            if (verifyTx) {
                                setPendingTransaction(verifyTx);
                                addNotification('info', 'Verifying on blockchain... Credits will be minted after confirmation!');
                                // Update backend with verification transaction hash
                                await api.updateActionBlockchain(selectedActionForVerification.id, {
                                    txHash: verifyTx.hash
                                });
                        }
                    } else {
                            addNotification('warning', 'Action verified in database. Blockchain action ID not found. Please check blockchain connection.');
                        }
                    }
                } catch (blockchainError) {
                    console.error('Blockchain execution failed:', blockchainError);
                    const errorMsg = blockchainError instanceof Error ? blockchainError.message : 'Unknown error';
                    addNotification('warning', `Action verified in database, but blockchain execution failed: ${errorMsg}`);
                }
            }
            
            addNotification('success', `Action ${approved ? 'approved' : 'rejected'} successfully`);
            setShowVerificationModal(false);
            setSelectedActionForVerification(null);
            await loadData();
        } catch (error) {
            console.error('Failed to verify action:', error);
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            addNotification('error', errorMessage);
            // Don't throw - let modal stay open for retry
        } finally {
            setSubmitting(false);
        }
    }

    function openVerificationModal(action: EcoAction) {
        setSelectedActionForVerification(action);
        setShowVerificationModal(true);
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TransactionStatus
                transaction={pendingTransaction}
                onComplete={async (receipt) => {
                    // Transaction completed successfully
                    try {
                        if (receipt) {
                            // Parse logs to find action ID (if available in events)
                            // For now, we'll update this when we have the action ID stored
                            addNotification('success', 'Action successfully logged on blockchain!');
                        }
                    } catch (err) {
                        console.error('Error processing transaction receipt:', err);
                    }
                    setPendingTransaction(null);
                    loadData();
                }}
                onError={(error) => {
                    setPendingTransaction(null);
                    addNotification('error', `Transaction failed: ${error.message}`);
                }}
            />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">
                        {isVerifier ? 'Pending Verifications' : isAuditor ? 'Action Audits' : 'Eco Actions'}
                    </h1>
                    <p className="mt-2 text-secondary-600">
                        {isVerifier 
                            ? 'Review and verify eco actions submitted by companies.'
                            : isAuditor
                            ? 'Audit and monitor all platform actions for compliance.'
                            : 'Submit your eco-friendly actions to earn carbon credits.'}
                    </p>
                </div>

                {!(isVerifier || isAuditor) && (
                    <button
                        type="button"
                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-all shadow-lg font-semibold text-base hover:scale-105 disabled:opacity-50"
                        onClick={() => {
                            if (!isAuthenticated) {
                                addNotification('info', 'Redirecting to login...');
                                setTimeout(() => {
                                    window.location.href = '/login';
                                }, 500);
                                return;
                            }
                            setShowModal(true);
                        }}
                        disabled={loading}
                    >
                        <Plus size={22} />
                        Log Eco Action
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Leaf size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Total Actions</p>
                            <p className="text-2xl font-bold text-secondary-900">{actions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Verified</p>
                            <p className="text-2xl font-bold text-secondary-900">
                                {actions.filter(a => a.status === 'VERIFIED').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Leaf size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Credits Earned</p>
                            <p className="text-2xl font-bold text-secondary-900">
                                {actions.reduce((sum, a) => sum + (a.status === 'VERIFIED' ? a.creditsEarned : 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </div>
            ) : actions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-secondary-200">
                    <Leaf size={64} className="mx-auto text-secondary-300 mb-6" />
                    <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                        {isVerifier ? 'No pending actions to verify' : isAuditor ? 'No actions to audit' : 'No actions yet'}
                    </h3>
                    <p className="text-secondary-500 text-lg mb-8">
                        {isVerifier || isAuditor ? 'All actions have been processed' : 'Submit your first eco-friendly action!'}
                    </p>
                    {/* Always show button unless explicitly verifier or auditor */}
                    {!(isVerifier || isAuditor) ? (
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-all shadow-xl font-semibold text-lg hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                                console.log('Button clicked - isAuthenticated:', isAuthenticated);
                                if (!isAuthenticated) {
                                    addNotification('info', 'Redirecting to login...');
                                    setTimeout(() => {
                                        window.location.href = '/login';
                                    }, 500);
                                    return;
                                }
                                setShowModal(true);
                            }}
                            disabled={loading}
                            style={{ display: 'block', visibility: 'visible' }}
                        >
                            <Plus size={24} />
                            {isAuthenticated ? 'Log Your First Eco Action' : 'Log In to Submit Action'}
                        </button>
                    ) : (
                        <div className="text-sm text-secondary-500">
                            {isVerifier ? 'Verifiers review actions' : 'Auditors monitor actions'}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Description</th>
                                {(isVerifier || isAuditor) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Company</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                                {(isVerifier || isAuditor) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {actions.map((action) => (
                                <tr key={action.id} className="hover:bg-secondary-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                        {action.type || action.actionType?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-secondary-500">
                                        {action.description}
                                    </td>
                                    {(isVerifier || isAuditor) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                                            {action.company?.name || action.companyName || 'Unknown'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                        {action.creditsEarned || action.estimatedCredits || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(action.status)}
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(action.status)}`}>
                                                {action.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {new Date(action.createdAt || action.timestamp).toLocaleDateString()}
                                    </td>
                                    {(isVerifier || isAuditor) && action.status === 'PENDING' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => openVerificationModal(action)}
                                                disabled={submitting}
                                                className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {submitting ? 'Processing...' : 'Review & Verify'}
                                            </button>
                                        </td>
                                    )}
                                    {(isVerifier || isAuditor) && action.status !== 'PENDING' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                action.status === 'VERIFIED' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {action.status}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Submit Action Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" onClick={() => setShowModal(false)}>
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity" />
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div 
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-secondary-900">
                                            Log New Eco Action
                                    </h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="text-secondary-400 hover:text-secondary-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-sm text-secondary-600 mb-4">
                                        Submit your eco-friendly action. A verifier will review it and execute the blockchain transaction to mint credits.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="actionType" className="block text-sm font-medium text-secondary-700">
                                                Action Type *
                                            </label>
                                            <select
                                                id="actionType"
                                                value={formData.actionType}
                                                onChange={(e) => {
                                                    const selectedType = Array.isArray(actionTypes) 
                                                        ? actionTypes.find(t => t.type === e.target.value || t.id === e.target.value)
                                                        : null;
                                                    setFormData({ 
                                                        ...formData, 
                                                        actionType: e.target.value,
                                                        unit: selectedType?.unit || ''
                                                    });
                                                }}
                                                className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                                required
                                            >
                                                <option value="">Select an action type</option>
                                                {Array.isArray(actionTypes) && actionTypes.length > 0 ? (
                                                    actionTypes.map((type) => (
                                                        <option key={type.id} value={type.type || type.id}>
                                                            {type.label || type.name || type.type} 
                                                            {type.defaultCreditsPerUnit || type.baseCredits ? ` (~${(type.defaultCreditsPerUnit || type.baseCredits || 0)} credits/${type.unit || 'unit'})` : ''}
                                                    </option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>Loading action types...</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="quantity" className="block text-sm font-medium text-secondary-700">
                                                    Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    id="quantity"
                                                    value={formData.quantity}
                                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                                    min="1"
                                                    step="1"
                                                    className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="unit" className="block text-sm font-medium text-secondary-700">
                                                    Unit *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="unit"
                                                    value={formData.unit}
                                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                    className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                                    placeholder="kg, trees, kWh, etc."
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                                                Description *
                                            </label>
                                            <textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4}
                                                className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                                placeholder="Describe your eco-friendly action in detail (min 10 characters)..."
                                                required
                                                minLength={10}
                                            />
                                            <p className="mt-1 text-xs text-secondary-500">
                                                {formData.description.length}/500 characters
                                            </p>
                                        </div>
                                        <div>
                                            <label htmlFor="evidence" className="block text-sm font-medium text-secondary-700">
                                                Evidence (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="evidence"
                                                value={formData.evidence}
                                                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                                                className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                                placeholder="Link to proof, photos, or documentation"
                                            />
                                            <p className="mt-1 text-xs text-secondary-500">
                                                Provide evidence to speed up verification
                                            </p>
                                        </div>
                                        {formData.actionType && formData.quantity && Array.isArray(actionTypes) && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <p className="text-sm font-medium text-green-900">Estimated Credits:</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {(() => {
                                                        const selectedType = actionTypes.find(t => (t.type === formData.actionType || t.id === formData.actionType));
                                                        if (!selectedType || !formData.quantity) return '0';
                                                        const creditsPerUnit = selectedType.defaultCreditsPerUnit || selectedType.baseCredits || selectedType.minCreditsPerUnit || 0;
                                                        const credits = creditsPerUnit * parseInt(formData.quantity, 10);
                                                        return credits.toLocaleString();
                                                    })()} credits
                                                </p>
                                                <p className="text-xs text-green-700 mt-1">
                                                    Final amount will be determined by the verifier
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:w-auto sm:text-sm disabled:opacity-50"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Action'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 sm:mt-0 sm:w-auto sm:text-sm"
                                        onClick={() => setShowModal(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => {
                    setShowVerificationModal(false);
                    setSelectedActionForVerification(null);
                }}
                action={selectedActionForVerification}
                onVerify={handleVerifyAction}
            />
        </div>
    );
}
