import React, { createContext, useContext, useEffect, useState } from 'react';
import { walletService, type WalletState } from '../lib/services/wallet';

interface WalletContextType extends WalletState {
    connect: () => Promise<boolean>;
    disconnect: () => Promise<void>;
    switchToSepolia: () => Promise<boolean>;
    formatAddress: (address: string) => string;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<WalletState>(walletService.getState());

    useEffect(() => {
        const unsubscribe = walletService.subscribe((newState) => {
            setState(newState);
        });
        return () => unsubscribe();
    }, []);

    const value = {
        ...state,
        connect: () => walletService.connect(),
        disconnect: () => walletService.disconnect(),
        switchToSepolia: () => walletService.switchToSepolia(),
        formatAddress: (address: string) => walletService.formatAddress(address),
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
