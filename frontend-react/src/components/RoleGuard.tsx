import { type ReactNode } from 'react';
import { useUser } from '../contexts/UserContext';
import { Shield, AlertCircle } from 'lucide-react';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: string[];
    fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { user, isAuthenticated } = useUser();

    if (!isAuthenticated || !user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-16">
                    <AlertCircle className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Authentication Required</h2>
                    <p className="text-secondary-600">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    const userRole = user.role?.toUpperCase();
    const hasAccess = allowedRoles.some(role => role.toUpperCase() === userRole);

    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-16">
                    <Shield className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Access Restricted</h2>
                    <p className="text-secondary-600 mb-2">
                        This page is only available to: {allowedRoles.join(', ')}
                    </p>
                    <p className="text-sm text-secondary-500">Your current role: {user.role || 'Unknown'}</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

