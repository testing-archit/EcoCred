import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

interface ActionItem {
    id: string;
    description?: string;
    actionType?: string;
    estimatedCredits?: number;
    company?: { name: string };
}

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: ActionItem | null;
    onVerify: (approved: boolean, comments: string) => Promise<void>;
}

export function VerificationModal({ isOpen, onClose, action, onVerify }: VerificationModalProps) {
    const [approved, setApproved] = useState<boolean | null>(null);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { addNotification } = useNotifications();

    const handleSubmit = async () => {
        if (approved === null) {
            addNotification('error', 'Please select approve or reject');
            return;
        }

        console.log('handleSubmit called', { approved, comments, actionId: action?.id });
        setSubmitting(true);
        
        try {
            console.log('VerificationModal: Starting verification', { approved, comments, action: action?.id });
            await onVerify(approved, comments || '');
            console.log('VerificationModal: Verification successful');
            // Success notification is handled by parent
            handleClose();
        } catch (error) {
            console.error('VerificationModal: Verification error', error);
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            addNotification('error', errorMessage);
            setSubmitting(false); // Re-enable button on error
        }
    };

    const handleClose = () => {
        setApproved(null);
        setComments('');
        onClose();
    };

    if (!isOpen || !action) return null;

    if (!isOpen || !action) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 overflow-y-auto" 
                    role="dialog" 
                    aria-modal="true"
                    onClick={(e) => {
                        // Close modal when clicking backdrop
                        if (e.target === e.currentTarget) {
                            handleClose();
                        }
                    }}
                >
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                        />
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        {/* Modal Content */}
                        <motion.div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => {
                                // Stop clicks inside modal from bubbling to backdrop
                                e.stopPropagation();
                            }}
                        >
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg leading-6 font-medium text-secondary-900">
                                    Verify Eco Action
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="text-secondary-400 hover:text-secondary-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Action Details */}
                            <div className="mb-6 space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-secondary-700">Action Description</p>
                                    <p className="text-sm text-secondary-900 mt-1">{action.description}</p>
                                </div>
                                {action.company && (
                                    <div>
                                        <p className="text-sm font-medium text-secondary-700">Company</p>
                                        <p className="text-sm text-secondary-900 mt-1">{action.company.name}</p>
                                    </div>
                                )}
                                {action.estimatedCredits && (
                                    <div>
                                        <p className="text-sm font-medium text-secondary-700">Estimated Credits</p>
                                        <p className="text-sm text-secondary-900 mt-1">{action.estimatedCredits}</p>
                                    </div>
                                )}
                                {action.actionType && (
                                    <div>
                                        <p className="text-sm font-medium text-secondary-700">Action Type</p>
                                        <p className="text-sm text-secondary-900 mt-1">{action.actionType}</p>
                                    </div>
                                )}
                            </div>

                            {/* Approval/Rejection Selection */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-secondary-700 mb-3">Decision</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Approve button clicked', { submitting, approved });
                                            if (submitting) {
                                                console.log('Button disabled - already submitting');
                                                return;
                                            }
                                            console.log('Setting approved to true');
                                            setApproved(true);
                                        }}
                                        disabled={submitting}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            submitting
                                                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                                                : approved === true
                                                ? 'border-green-500 bg-green-50 cursor-pointer'
                                                : 'border-secondary-200 hover:border-green-300 cursor-pointer'
                                        }`}
                                        style={{ pointerEvents: submitting ? 'none' : 'auto' }}
                                    >
                                        <CheckCircle2 className={`h-6 w-6 mx-auto mb-2 ${
                                            approved === true ? 'text-green-600' : 'text-secondary-400'
                                        }`} />
                                        <p className={`font-medium ${
                                            approved === true ? 'text-green-700' : 'text-secondary-600'
                                        }`}>Approve</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Reject button clicked', { submitting });
                                            if (submitting) return;
                                            setApproved(false);
                                        }}
                                        disabled={submitting}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            submitting
                                                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                                                : approved === false
                                                ? 'border-red-500 bg-red-50 cursor-pointer'
                                                : 'border-secondary-200 hover:border-red-300 cursor-pointer'
                                        }`}
                                        style={{ pointerEvents: submitting ? 'none' : 'auto' }}
                                    >
                                        <XCircle className={`h-6 w-6 mx-auto mb-2 ${
                                            approved === false ? 'text-red-600' : 'text-secondary-400'
                                        }`} />
                                        <p className={`font-medium ${
                                            approved === false ? 'text-red-700' : 'text-secondary-600'
                                        }`}>Reject</p>
                                    </button>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="mb-6">
                                <label htmlFor="comments" className="block text-sm font-medium text-secondary-700 mb-2">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    id="comments"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                    className="w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                    placeholder="Add any comments about your verification decision..."
                                />
                            </div>
                        </div>

                        <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Confirm button clicked', { approved, submitting, actionId: action?.id });
                                    
                                    if (approved === null) {
                                        addNotification('error', 'Please select approve or reject first');
                                        return;
                                    }
                                    
                                    if (submitting) {
                                        console.log('Already submitting, ignoring click');
                                        return;
                                    }
                                    
                                    console.log('Calling handleSubmit...');
                                    await handleSubmit();
                                }}
                                disabled={submitting || approved === null}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:w-auto sm:text-sm transition-all ${
                                    approved === null || submitting
                                        ? 'bg-secondary-400 cursor-not-allowed opacity-50'
                                        : approved
                                        ? 'bg-green-600 hover:bg-green-700 cursor-pointer active:bg-green-800'
                                        : 'bg-red-600 hover:bg-red-700 cursor-pointer active:bg-red-800'
                                }`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : approved === null ? (
                                    'Select Approve or Reject'
                                ) : (
                                    `Confirm ${approved ? 'Approval' : 'Rejection'}`
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={submitting}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
            )}
        </AnimatePresence>
    );
}

