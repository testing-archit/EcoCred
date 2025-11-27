import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Trophy, Award, Home, Shield, TrendingUp, Building, ShoppingBag, Wallet, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { ConnectWallet } from './ConnectWallet';
import { useUser } from '../contexts/UserContext';
import { cn } from '../lib/utils';

export function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout, user } = useUser();

    // Base navigation items
    const allNavItems = [
        { href: "/", label: "Dashboard", icon: Home, roles: ['COMPANY', 'VERIFIER', 'AUDITOR', 'ADMIN'] },
        { href: "/actions", label: "Eco Actions", icon: Leaf, roles: ['COMPANY', 'VERIFIER', 'AUDITOR', 'ADMIN'] },
        { href: "/companies", label: "Companies", icon: Building, roles: ['COMPANY', 'VERIFIER', 'AUDITOR', 'ADMIN'] },
        { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, roles: ['COMPANY'] },
        { href: "/staking", label: "Staking", icon: Wallet, roles: ['COMPANY'] },
        { href: "/governance", label: "Governance", icon: Shield, roles: ['COMPANY', 'AUDITOR'] },
        { href: "/analytics", label: "Analytics", icon: TrendingUp, roles: ['COMPANY', 'VERIFIER', 'AUDITOR', 'ADMIN'] },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy, roles: ['COMPANY', 'VERIFIER', 'AUDITOR', 'ADMIN'] },
        { href: "/badges", label: "NFT Badges", icon: Award, roles: ['COMPANY'] },
    ];

    // Filter navigation items based on user role
    const navItems = isAuthenticated && user?.role
        ? allNavItems.filter(item => item.roles.includes(user.role!.toUpperCase()))
        : allNavItems.filter(item => item.roles.includes('COMPANY')); // Default for unauthenticated

    return (
        <nav className="glass-effect shadow-lg border-b border-secondary-200/50 sticky top-0 z-50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <motion.div 
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex-shrink-0 flex items-center group cursor-pointer">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Leaf className="h-8 w-8 text-primary-600" />
                            </motion.div>
                            <span className="ml-2 text-xl font-bold gradient-text">
                                GreenLedger
                            </span>
                        </div>
                    </motion.div>

                    <div className="hidden md:flex items-center space-x-2">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <Link
                                        to={item.href}
                                        className={cn(
                                            "relative flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                                            isActive
                                                ? "text-primary-600 bg-primary-50"
                                                : "text-secondary-700 hover:text-primary-600 hover:bg-primary-50/50"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-primary-50 rounded-lg"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn("h-4 w-4 mr-2 relative z-10", isActive && "text-primary-600")} />
                                        <span className="relative z-10">{item.label}</span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="flex items-center space-x-4">
                        <ConnectWallet />
                        
                        {!isAuthenticated ? (
                            <>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        to="/login"
                                        className="hidden md:flex items-center px-4 py-2 rounded-lg text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-300"
                                    >
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Login
                                    </Link>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        to="/register"
                                        className="hidden md:flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-300"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Register
                                    </Link>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="hidden md:flex items-center px-4 py-2 rounded-lg text-sm font-medium text-secondary-700 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
                                >
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </motion.div>
                        )}

                        <motion.button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100"
                            aria-label="Toggle mobile menu"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <AnimatePresence mode="wait">
                                {isMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X className="h-6 w-6" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Menu className="h-6 w-6" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="md:hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-lg border-t border-secondary-200">
                            {!isAuthenticated && (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-secondary-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 mb-2"
                                    >
                                        <LogIn className="h-5 w-5 mr-3" />
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 transition-all duration-200 mb-2"
                                    >
                                        <UserPlus className="h-5 w-5 mr-3" />
                                        Register
                                    </Link>
                                    <div className="border-t border-secondary-200 my-2"></div>
                                </>
                            )}
                            {navItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;
                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            to={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={cn(
                                                "flex items-center px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
                                                isActive
                                                    ? "text-primary-600 bg-primary-50"
                                                    : "text-secondary-700 hover:text-primary-600 hover:bg-primary-50"
                                            )}
                                        >
                                            <Icon className="h-5 w-5 mr-3" />
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
