import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../lib/services/api';
import { Loader2, Wallet, LogOut, CheckCircle2 } from 'lucide-react';

export function ConnectWallet() {
    const { connect, disconnect, address, formatAddress } = useWallet();
    const { user, login, logout, isAuthenticated } = useUser();
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        if (typeof window.ethereum === "undefined") {
            addNotification("error", "MetaMask is not installed!");
            return;
        }

        setLoading(true);
        try {
            const connected = await connect();
            if (connected && window.ethereum) {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    await authenticate(accounts[0]);
                }
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
            addNotification("error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const authenticate = async (walletAddress: string) => {
        try {
            const { message } = await api.getNonce(walletAddress);

            if (!window.ethereum) throw new Error("No wallet found");

            const signature = await window.ethereum.request({
                method: "personal_sign",
                params: [message, walletAddress],
            });

            const { token, company } = await api.verifySignature(
                walletAddress,
                signature,
                message,
            );

            login(company, token);
            addNotification("success", "Successfully logged in!");
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Authentication failed";
            addNotification("error", errorMessage);
            disconnect();
        }
    };

    const handleDisconnect = () => {
        disconnect();
        logout();
        addNotification("info", "Disconnected wallet");
    };

    return (
        <>
            {isAuthenticated ? (
                <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="hidden md:block text-right">
                        <div className="flex items-center gap-2 text-sm font-semibold text-secondary-900">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                            >
                                <CheckCircle2 size={16} className="text-green-500" />
                            </motion.div>
                            {user?.name}
                        </div>
                        <div className="text-xs text-secondary-500 font-mono mt-0.5">
                            {address ? formatAddress(address) : ''}
                        </div>
                    </div>

                    <motion.button
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-all shadow-sm hover:shadow-md"
                        onClick={handleDisconnect}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline font-medium">Disconnect</span>
                    </motion.button>
                </motion.div>
            ) : (
                <motion.button
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    onClick={handleConnect}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.05 }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Connecting...</span>
                        </>
                    ) : (
                        <>
                            <Wallet size={18} />
                            <span className="font-semibold">Connect Wallet</span>
                        </>
                    )}
                </motion.button>
            )}
        </>
    );
}
