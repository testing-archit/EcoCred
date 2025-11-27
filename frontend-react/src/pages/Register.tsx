import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useWallet } from '../contexts/WalletContext';
import { api } from '../lib/services/api';

interface RoleOption {
    value: string;
    label: string;
    description: string;
}

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'COMPANY'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const navigate = useNavigate();
    const { login } = useUser();
    const { address, connect } = useWallet();
    const [roleOptions, setRoleOptions] = useState<RoleOption[]>([
        { value: 'COMPANY', label: '🏢 Company', description: 'Earn and trade carbon credits' },
        { value: 'VERIFIER', label: '✅ Verifier', description: 'Verify eco actions' },
        { value: 'AUDITOR', label: '🔍 Auditor', description: 'Audit platform activities' }
    ]);

    useEffect(() => {
        // Load role options from API
        async function loadRoleOptions() {
            try {
                const response = await api.getRoleOptions();
                if (response.success && response.data.length > 0) {
                    setRoleOptions(response.data);
                }
            } catch (error) {
                console.error('Failed to load role options:', error);
                // Keep default options on error
            }
        }
        loadRoleOptions();
    }, []);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('One number');
        return errors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') {
            setPasswordErrors(validatePassword(value));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check if wallet is connected
        if (!address) {
            setError('Please connect your wallet first');
            try {
                await connect();
            } catch {
                setError('Failed to connect wallet. Please try again.');
            }
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const errors = validatePassword(formData.password);
        if (errors.length > 0) {
            setError('Password does not meet requirements');
            return;
        }

        try {
            setLoading(true);

            const response = await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                walletAddress: address,
                name: formData.name,
                role: formData.role
            });

            login(response.user, response.token);
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            let errorMessage = 'Registration failed';
            
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (err.response?.data?.error?.message) {
                errorMessage = err.response.data.error.message;
            } else if (err.originalError?.error?.message) {
                errorMessage = err.originalError.error.message;
            }
            
            setError(errorMessage);
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

            <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
                <div className="w-full max-w-md">
                    {/* Logo and Header */}
                    <div className="text-center mb-8 animate-fade-in">
                        <div className="inline-block mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">🌱</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            Join EcoCred
                        </h1>
                        <p className="text-gray-600">Create your account and start making an impact</p>
                    </div>

                    {/* Main Card */}
                    <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                                <div className="flex items-center gap-2">
                                    <span className="text-red-500">⚠️</span>
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Wallet Connection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Wallet Address *
                                </label>
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

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                        placeholder="you@example.com"
                                    />
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        📧
                                    </span>
                                </div>
                            </div>

                            {/* Company Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                    Company/Organization Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                        placeholder="Your Company Name"
                                    />
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        🏢
                                    </span>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Account Type *
                                </label>
                                <div className="space-y-2">
                                    {roleOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.role === option.value
                                                    ? 'border-green-500 bg-green-50/50 shadow-md'
                                                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={option.value}
                                                checked={formData.role === option.value}
                                                onChange={handleChange}
                                                className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{option.label}</div>
                                                                <div className="text-sm text-gray-600">{option.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                        placeholder="••••••••"
                                    />
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        🔒
                                    </span>
                                </div>
                                {formData.password && passwordErrors.length > 0 && (
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs font-semibold text-amber-900 mb-1">Password must contain:</p>
                                        <div className="space-y-1">
                                            {passwordErrors.map((err, idx) => (
                                                <p key={idx} className="text-xs text-amber-700 flex items-center gap-1">
                                                    <span>•</span> {err}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none"
                                        placeholder="••••••••"
                                    />
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        🔒
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || passwordErrors.length > 0}
                                className="group relative w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden mt-6"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <span>✨</span>
                                            Create Account
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-300 hover:underline"
                            >
                                Sign in here →
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
