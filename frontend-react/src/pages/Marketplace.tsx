import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import { api } from '../lib/services/api';
import { useUser } from '../contexts/UserContext';

interface Listing {
    id: string;
    amount: number;
    pricePerCredit: string;
    totalPrice: string;
    listingId?: number;
    seller: {
        name: string;
        walletAddress: string;
        verified: boolean;
    };
}

export function Marketplace() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingListing] = useState(false);
    const [buyingListingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { user, isAuthenticated } = useUser();
    
    const isCompany = user?.role?.toUpperCase() === 'COMPANY';

    const [amount, setAmount] = useState(1);
    const [pricePerCredit, setPricePerCredit] = useState('0.01');

    useEffect(() => {
        if (isCompany || !isAuthenticated) {
            loadListings();
        }
    }, [isCompany, isAuthenticated]);

    async function loadListings() {
        setLoading(true);
        try {
            const response = await api.getListings(1, 50, 'ACTIVE');
            setListings(response.listings || []);
        } catch (error) {
            console.error('Failed to load listings:', error);
        } finally {
            setLoading(false);
        }
    }

    function isOwner(listing: Listing) {
        return user?.walletAddress?.toLowerCase() === listing.seller.walletAddress.toLowerCase();
    }

    // Show access denied for non-company users
    if (isAuthenticated && !isCompany) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-16">
                    <ShoppingCart className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Access Restricted</h2>
                    <p className="text-secondary-600">
                        The marketplace is only available to companies. Your role: {user?.role}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
                className="flex justify-between items-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Sparkles className="h-8 w-8 text-primary-600" />
                        </motion.div>
                        <h1 className="text-4xl font-bold gradient-text">Carbon Credit Marketplace</h1>
                    </div>
                    <p className="mt-2 text-secondary-600 text-lg">
                        Buy and sell verified carbon credits directly on the blockchain.
                    </p>
                </div>

                <motion.button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => setShowCreateModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={20} />
                    Create Listing
                </motion.button>
            </motion.div>

            {loading ? (
                <motion.div 
                    className="flex justify-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </motion.div>
            ) : listings.length === 0 ? (
                <motion.div 
                    className="text-center py-12 card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ShoppingCart size={48} className="mx-auto text-secondary-400 mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-secondary-900">No active listings</h3>
                    <p className="text-secondary-500 mt-1">Be the first to list your carbon credits!</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {listings.map((listing, index) => (
                            <motion.div
                                key={listing.id}
                                className="card card-hover overflow-hidden relative group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                                                {listing.amount} Credits
                                            </h3>
                                            <p className="text-sm text-secondary-500 flex items-center gap-2">
                                                by {listing.seller.name}
                                                {listing.seller.verified && (
                                                    <motion.span 
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: index * 0.1 + 0.2 }}
                                                    >
                                                        ✓ Verified
                                                    </motion.span>
                                                )}
                                            </p>
                                        </div>
                                        <motion.div 
                                            className="text-right"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                                        >
                                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                                                {listing.totalPrice} ETH
                                            </p>
                                            <p className="text-xs text-secondary-500">
                                                {listing.pricePerCredit} ETH / credit
                                            </p>
                                        </motion.div>
                                    </div>

                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-secondary-100">
                                        <div className="text-xs text-secondary-400 font-mono">
                                            ID: #{listing.listingId || 'PENDING'}
                                        </div>

                                        {isOwner(listing) ? (
                                            <motion.button 
                                                className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Cancel
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                                disabled={buyingListingId === listing.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {buyingListingId === listing.id ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin inline mr-2" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Buy Now'
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Listing Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 overflow-y-auto" 
                        role="dialog" 
                        aria-modal="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <motion.div
                                className="fixed inset-0 bg-secondary-900 bg-opacity-75 backdrop-blur-sm"
                                onClick={() => setShowCreateModal(false)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                            <motion.div 
                                className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl sm:my-8 sm:align-middle sm:max-w-lg w-full"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            >
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                                    Create New Listing
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
                                        <label htmlFor="price" className="block text-sm font-medium text-secondary-700">
                                            Price per Credit (ETH)
                                        </label>
                                        <input
                                            type="text"
                                            id="price"
                                            value={pricePerCredit}
                                            onChange={(e) => setPricePerCredit(e.target.value)}
                                            className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                        />
                                    </div>
                                    <div className="bg-secondary-50 p-3 rounded-md">
                                        <p className="text-sm text-secondary-600 flex justify-between">
                                            <span>Total Price:</span>
                                            <span className="font-bold">
                                                {(amount * parseFloat(pricePerCredit || '0')).toFixed(4)} ETH
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:w-auto sm:text-sm"
                                    disabled={creatingListing}
                                >
                                    {creatingListing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Create Listing'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creatingListing}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
