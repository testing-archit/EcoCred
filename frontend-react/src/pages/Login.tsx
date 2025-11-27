import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useWallet } from '../contexts/WalletContext';
import { api } from '../lib/services/api';

export default function Login() {
    const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useUser();
    const { address, connect } = useWallet();

    // Handle wallet login
    const handleWalletLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        try {
            setLoading(true);
            setError('');

            if (!address) {
                await connect();
                return;
            }

            // Check if email and password are provided (required for new users or users missing them)
            if (!email || !password) {
                setError('Email and password are required');
                return;
            }

            // Get nonce
            const nonceResponse = await api.get(`/auth/nonce/${address}`);
            const { message } = nonceResponse;

            // Request signature from MetaMask
            const provider = window.ethereum;
            if (!provider) throw new Error('No wallet found');
            const signature = await provider.request({
                method: 'personal_sign',
                params: [message, address]
            });

            // Verify signature and login (with email/password if needed)
            const response = await api.post<{ user: { id: string; walletAddress: string; name: string; verified: boolean }; token: string }>('/auth/verify', {
                walletAddress: address,
                signature,
                message,
                email,
                password
            });

            login(response.user, response.token);
            navigate('/');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to login with wallet';
            setError(errorMessage);
            console.error('Wallet login error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle email/password login
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            // Try to login with just email/password first
            // Wallet address is optional - user may already have one in database
            const response = await api.post<{
                token: string;
                user: {
                    id: string;
                    email: string;
                    role: string;
                    walletAddress: string;
                    emailVerified: boolean;
                    company: {
                        id: string;
                        name: string;
                        verified: boolean;
                    } | null;
                };
            }>('/auth/login', {
                email,
                password,
                walletAddress: address || undefined // Only send if connected
            });

            console.log('[Login] Backend response received:', response);
            
            // Validate response structure
            if (!response || !response.user || !response.token) {
                throw new Error('Invalid response format from server');
            }
            
            // Map backend response to frontend User format
            // Backend returns: { token, user: { id, email, role, walletAddress, emailVerified, company: { id, name, verified } } }
            const userData = {
                id: response.user.id,
                walletAddress: response.user.walletAddress || '',
                name: response.user.company?.name || response.user.email?.split('@')[0] || 'User',
                verified: response.user.company?.verified ?? response.user.emailVerified ?? false,
                email: response.user.email,
                companyId: response.user.company?.id,
                companyName: response.user.company?.name,
                role: response.user.role
            };

            // Validate required fields
            if (!userData.id || !userData.walletAddress || !userData.name) {
                console.error('[Login] Missing required user fields:', userData);
                throw new Error('Invalid user data received from server');
            }

            console.log('[Login] Mapped user data:', userData);
            console.log('[Login] Calling login function with token length:', response.token.length);
            
            login(userData, response.token);
            
            console.log('[Login] Login function called successfully, navigating...');
            // Use setTimeout to ensure state updates are processed
            setTimeout(() => {
                console.log('[Login] Executing navigation to /');
                navigate('/', { replace: true });
            }, 200);
        } catch (err) {
            console.error('[Login] Full error object:', err);
            console.error('[Login] Error details:', {
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
                response: (err as any)?.response,
                status: (err as any)?.status
            });
            
            const errorMessage = err instanceof Error ? err.message : 'Invalid credentials';
            
            // If error indicates wallet is required and not connected, prompt user
            if ((errorMessage.includes('wallet') || errorMessage.includes('Wallet')) && !address) {
                setError('Please connect your wallet to complete login. Click "Connect Wallet" above.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo and Header */}
                    <div className="text-center mb-8 animate-fade-in">
                        <div className="inline-block mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">🌱</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600">Sign in to continue to EcoCred</p>
                    </div>

                    {/* Main Card */}
                    <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
                        {/* Tab Selector */}
                        <div className="relative flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-2xl">
                            <div
                                className={`absolute top-1.5 h-[calc(100%-12px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-out ${activeTab === 'wallet' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+1.5px)] w-[calc(50%-6px)]'
                                    }`}
                            />
                            <button
                                onClick={() => setActiveTab('wallet')}
                                className={`relative flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'wallet'
                                        ? 'text-green-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-xl">🔐</span>
                                    Wallet
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`relative flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'email'
                                        ? 'text-green-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-xl">✉️</span>
                                    Email
                                </span>
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                                <div className="flex items-center gap-2">
                                    <span className="text-red-500">⚠️</span>
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Wallet Login */}
                        {activeTab === 'wallet' && (
                            <form onSubmit={handleWalletLogin} className="space-y-6 animate-fade-in">
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-2xl p-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">🦊</span>
                                        <div>
                                            <p className="font-semibold text-blue-900 mb-1">Connect Your Wallet</p>
                                            <p className="text-sm text-blue-700">Sign in with your wallet and provide your email/password to complete authentication.</p>
                                        </div>
                                    </div>
                                </div>

                                {!address ? (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await connect();
                                            } catch {
                                                setError('Failed to connect wallet. Please try again.');
                                            }
                                        }}
                                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all duration-300 text-gray-600 font-medium"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <span>🔗</span>
                                            Connect Wallet
                                        </span>
                                    </button>
                                ) : (
                                    <div className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-mono text-gray-700">
                                                    {address.substring(0, 6)}...{address.substring(38)}
                                                </span>
                                            </div>
                                            <span className="text-green-600 text-sm font-semibold">✓ Connected</span>
                                        </div>
                                    </div>
                                )}

                                {/* Email and Password fields for wallet login */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="wallet-email" className="block text-sm font-semibold text-gray-700">
                                            Email Address *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="wallet-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                                placeholder="you@example.com"
                                            />
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                                📧
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="wallet-password" className="block text-sm font-semibold text-gray-700">
                                            Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="wallet-password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                                placeholder="••••••••"
                                            />
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                                🔒
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !address}
                                    className="group relative w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                <span>✍️</span>
                                                Sign Message & Login
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>
                        )}

                        {/* Email/Password Login */}
                        {activeTab === 'email' && (
                            <form onSubmit={handleEmailLogin} className="space-y-6 animate-fade-in">
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl p-6 mb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">✉️</span>
                                        <div>
                                            <p className="font-semibold text-purple-900 mb-1">Email & Password Login</p>
                                            <p className="text-sm text-purple-700">Sign in with your email and password. Wallet connection is optional if your account already has a wallet address.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Connection (Optional) */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Wallet Address {!address && <span className="text-gray-400 font-normal">(Optional)</span>}
                                    </label>
                                    {!address ? (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await connect();
                                                } catch {
                                                    setError('Failed to connect wallet. You can still login with email/password.');
                                                }
                                            }}
                                            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all duration-300 text-gray-600 font-medium"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span>🔗</span>
                                                Connect Wallet (Optional)
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-sm font-mono text-gray-700">
                                                        {address.substring(0, 6)}...{address.substring(38)}
                                                    </span>
                                                </div>
                                                <span className="text-green-600 text-sm font-semibold">✓ Connected</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                            placeholder="you@example.com"
                                        />
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            📧
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                            placeholder="••••••••"
                                        />
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            🔒
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email || !password}
                                    className="group relative w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀</span>
                                                Sign In
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-300 hover:underline"
                            >
                                Create one now →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out forwards;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}
