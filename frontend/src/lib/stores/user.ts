import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

interface User {
    id: string;
    walletAddress: string;
    name: string;
    verified: boolean;
    token?: string;
}

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
}

const initialState: UserState = {
    user: null,
    isAuthenticated: false,
    loading: false
};

export const userStore: Writable<UserState> = writable(initialState);

// Actions
export const userActions = {
    setUser: (user: User, token: string) => {
        // Store token in localStorage
        localStorage.setItem('ecocred_token', token);

        userStore.set({
            user: { ...user, token },
            isAuthenticated: true,
            loading: false
        });
    },

    logout: () => {
        localStorage.removeItem('ecocred_token');
        userStore.set(initialState);
    },

    setLoading: (loading: boolean) => {
        userStore.update(state => ({ ...state, loading }));
    },

    updateProfile: (updates: Partial<User>) => {
        userStore.update(state => ({
            ...state,
            user: state.user ? { ...state.user, ...updates } : null
        }));
    }
};

// Load user from localStorage on init
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ecocred_token');
    if (token) {
        // Token exists, validate it with backend
        userActions.setLoading(true);
        // This will be handled by the API service
    }
}
