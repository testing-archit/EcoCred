import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Leaf } from 'lucide-react';
import { CompanyDashboard } from '../components/CompanyDashboard';
import { VerifierDashboard } from '../components/VerifierDashboard';
import { AuditorDashboard } from '../components/AuditorDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { useUser } from '../contexts/UserContext';

export function Home() {
    const { user, isAuthenticated } = useUser();

    // Determine which dashboard to show based on role
    const renderDashboard = () => {
        if (!user) return null;
        
        const role = user.role?.toUpperCase();
        
        switch (role) {
            case 'ADMIN':
                return <AdminDashboard user={user} />;
            case 'VERIFIER':
                return <VerifierDashboard user={user} />;
            case 'AUDITOR':
                return <AuditorDashboard user={user} />;
            case 'COMPANY':
            default:
                return <CompanyDashboard user={user} />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!isAuthenticated ? (
                <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-2xl mx-auto">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mb-6"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <Leaf className="h-12 w-12 text-white" />
                            </div>
                        </motion.div>
                        <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                            Welcome to EcoCred
                        </h2>
                        <p className="text-lg text-secondary-600 mb-8">
                            Join the sustainable future. Track your eco actions, earn carbon credits, and make a real impact on the environment.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    Create Account
                                </Link>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300"
                                >
                                    <LogIn className="h-5 w-5 mr-2" />
                                    Sign In
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                renderDashboard()
            )}
        </div>
    );
}
