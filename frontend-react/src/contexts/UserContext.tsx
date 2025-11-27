import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/services/api';
import { WalletContext } from './WalletContext';

interface User {
    id: string;
    walletAddress: string;
    name: string;
    verified: boolean;
    token?: string;
    email?: string;
    companyId?: string;
    companyName?: string;
    industry?: string;
    role?: string;
    totalCredits?: number;
    totalActions?: number;
    badgesEarned?: number;
    ranking?: number;
}

interface UserContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const initializedRef = useRef<boolean | null>(null);
    
    // Get wallet connection status - use context directly (WalletProvider wraps UserProvider in App.tsx)
    const walletContext = useContext(WalletContext);
    const isConnected = walletContext?.isConnected ?? false;

    const logout = useCallback(() => {
        localStorage.removeItem('ecocred_token');
        api.clearToken();
        setUser(null);
    }, []);

    const login = useCallback((userData: User, token: string) => {
        console.log('[UserContext] Login called with:', { userData, token: token.substring(0, 20) + '...' });
        localStorage.setItem('ecocred_token', token);
        api.setToken(token);
        const userWithToken = { ...userData, token };
        console.log('[UserContext] Setting user state:', userWithToken);
        setUser(userWithToken);
        console.log('[UserContext] User state updated, isAuthenticated:', !!userWithToken);
    }, []);

    // Initialize from localStorage on mount
    if (initializedRef.current === null) {
        initializedRef.current = true;
        const token = localStorage.getItem('ecocred_token');
        if (token) {
            api.setToken(token);
        }
    }

    useEffect(() => {
        // Set loading to false after initial render
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
    }, []);

    // Removed auto-logout on wallet disconnection
    // This was preventing email/password login from working
    // Users can log in with email/password without connecting a wallet
    // Wallet connection is optional for login

    const updateProfile = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            logout,
            updateProfile
        }}>
            {children}
        </UserContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
