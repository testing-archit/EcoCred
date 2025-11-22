import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

interface WalletState {
    address: string | null;
    isConnected: boolean;
    chainId: number | null;
    balance: string | null;
}

const initialState: WalletState = {
    address: null,
    isConnected: false,
    chainId: null,
    balance: null
};

export const walletStore: Writable<WalletState> = writable(initialState);

// Derived store for shortened address
export const shortAddress = derived(
    walletStore,
    ($wallet) => {
        if (!$wallet.address) return null;
        return `${$wallet.address.slice(0, 6)}...${$wallet.address.slice(-4)}`;
    }
);

// Actions
export const walletActions = {
    connect: (address: string, chainId: number) => {
        walletStore.update(state => ({
            ...state,
            address,
            chainId,
            isConnected: true
        }));
    },

    disconnect: () => {
        walletStore.set(initialState);
    },

    updateBalance: (balance: string) => {
        walletStore.update(state => ({
            ...state,
            balance
        }));
    },

    updateChainId: (chainId: number) => {
        walletStore.update(state => ({
            ...state,
            chainId
        }));
    }
};
