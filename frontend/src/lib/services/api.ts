import { userStore } from '../stores/user';
import { notificationActions } from '../stores/notifications';
import { get } from 'svelte/store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

class ApiService {
    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { requiresAuth = false, ...fetchOptions } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers
        };

        // Add auth token if required
        if (requiresAuth) {
            const user = get(userStore);
            if (user.user?.token) {
                headers['Authorization'] = `Bearer ${user.user.token}`;
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...fetchOptions,
                headers
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Network error';
            notificationActions.error(message);
            throw error;
        }
    }

    // Auth endpoints
    async getNonce(walletAddress: string) {
        return this.request<{ nonce: string; message: string }>(`/auth/nonce/${walletAddress}`);
    }

    async verifySignature(walletAddress: string, signature: string, message: string) {
        return this.request<{ token: string; company: any }>('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, signature, message })
        });
    }

    // Company endpoints
    async getCompanies(page = 1, limit = 20, verified?: boolean) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (verified !== undefined) params.append('verified', verified.toString());
        return this.request<any>(`/companies?${params}`);
    }

    async getCompany(id: string) {
        return this.request<any>(`/companies/${id}`);
    }

    async createCompany(data: any) {
        return this.request<any>('/companies', {
            method: 'POST',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async updateCompany(id: string, data: any) {
        return this.request<any>(`/companies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async getCompanyActions(id: string, page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return this.request<any>(`/companies/${id}/actions?${params}`);
    }

    // Action endpoints
    async getActions(page = 1, limit = 20, status?: string) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (status) params.append('status', status);
        return this.request<any>(`/actions?${params}`);
    }

    async getAction(id: string) {
        return this.request<any>(`/actions/${id}`);
    }

    async submitAction(data: any) {
        return this.request<any>('/actions', {
            method: 'POST',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async verifyAction(id: string, approved: boolean, comments?: string) {
        return this.request<any>(`/actions/${id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ approved, comments }),
            requiresAuth: true
        });
    }

    // Analytics endpoints
    async getOverview() {
        return this.request<any>('/analytics/overview');
    }

    async getCompanyAnalytics(id: string) {
        return this.request<any>(`/analytics/companies/${id}`);
    }

    async getTrends(days = 30) {
        return this.request<any>(`/analytics/trends?days=${days}`);
    }

    async getActionTypes() {
        return this.request<any>('/analytics/action-types');
    }

    // Marketplace endpoints
    async getListings(page = 1, limit = 20, status = 'ACTIVE') {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), status });
        return this.request<any>(`/marketplace/listings?${params}`);
    }

    async getListing(id: string) {
        return this.request<any>(`/marketplace/listings/${id}`);
    }

    async createListing(data: any) {
        return this.request<any>('/marketplace/listings', {
            method: 'POST',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async cancelListing(id: string) {
        return this.request<any>(`/marketplace/listings/${id}/cancel`, {
            method: 'PUT',
            requiresAuth: true
        });
    }

    // Staking endpoints
    async getStakes(page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return this.request<any>(`/staking/stakes?${params}`);
    }

    async getMyStakes() {
        return this.request<any>('/staking/stakes/my', { requiresAuth: true });
    }

    async createStake(amount: number, duration: number) {
        return this.request<any>('/staking/stakes', {
            method: 'POST',
            body: JSON.stringify({ amount, duration }),
            requiresAuth: true
        });
    }

    async claimStake(id: string) {
        return this.request<any>(`/staking/stakes/${id}/claim`, {
            method: 'PUT',
            requiresAuth: true
        });
    }

    // Governance endpoints
    async getVotes(page = 1, limit = 20, proposalId?: number) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (proposalId !== undefined) params.append('proposalId', proposalId.toString());
        return this.request<any>(`/governance/votes?${params}`);
    }

    async getMyVotes() {
        return this.request<any>('/governance/votes/my', { requiresAuth: true });
    }

    async castVote(proposalId: number, support: boolean, votingPower: number) {
        return this.request<any>('/governance/votes', {
            method: 'POST',
            body: JSON.stringify({ proposalId, support, votingPower }),
            requiresAuth: true
        });
    }

    async getProposalResults(id: number) {
        return this.request<any>(`/governance/proposals/${id}/results`);
    }
}

export const api = new ApiService();
