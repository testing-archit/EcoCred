const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

// API Response Types
interface ApiError extends Error {
    status?: number;
    response?: unknown;
    originalError?: unknown;
    isNetworkError?: boolean;
}

interface Company {
    id: string;
    walletAddress: string;
    name: string;
    description?: string;
    industry?: string;
    website?: string;
    logoUrl?: string;
    location?: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Action {
    id: string;
    companyId: string;
    actionType: string;
    description: string;
    quantity: number;
    unit: string;
    status: string;
    creditsAwarded: number;
    txHash?: string;
    blockNumber?: number;
    blockchainActionId?: number;
    createdAt: string;
    updatedAt: string;
    company?: {
        id: string;
        name: string;
        walletAddress?: string;
        verified?: boolean;
    };
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface OverviewResponse {
    companies?: { total: number; verified: number };
    actions?: { total: number; pending: number; verified: number };
    credits?: { totalIssued: number };
    badges?: { total: number };
}

interface TrendsResponse {
    trends: Array<{ date: string; creditsIssued: number }>;
}

interface ActionType {
    id: string;
    type: string;
    label: string;
    description?: string;
    unit: string;
    minCreditsPerUnit: number;
    maxCreditsPerUnit: number;
    defaultCreditsPerUnit: number;
    active: boolean;
}

interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    tier: string;
    icon?: string;
    imageUrl?: string;
    creditsRequired: number;
    criteria?: string;
    active: boolean;
    displayOrder: number;
}

interface LeaderboardEntry {
    id: string;
    companyId: string;
    company: Company;
    totalCredits: number;
    totalActions: number;
    totalBadges: number;
    rank: number;
    previousRank?: number;
}

interface Listing {
    id: string;
    sellerId: string;
    amount: number;
    pricePerCredit: string;
    totalPrice: string;
    status: string;
    buyerAddress?: string;
    listingId?: number;
    txHash?: string;
}

interface Stake {
    id: string;
    stakerId: string;
    amount: number;
    duration: number;
    startTime: string;
    endTime: string;
    claimed: boolean;
    rewardAmount: number;
    stakeId?: number;
    txHash?: string;
}

interface Vote {
    id: string;
    proposalId: number;
    voterId: string;
    support: boolean;
    votingPower: number;
    txHash?: string;
}

interface Industry {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}

interface QuickAction {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    route: string;
    audience: string;
    isPrimary: boolean;
    order: number;
}

interface Guideline {
    id: string;
    title: string;
    description: string;
    icon?: string;
    category: string;
    audience: string;
    displayOrder: number;
}

interface Faq {
    id: string;
    question: string;
    answer: string;
    category?: string;
    audience: string;
    displayOrder: number;
}

interface RoleOption {
    value: string;
    label: string;
    description: string;
}

class ApiService {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }

    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { requiresAuth = false, ...fetchOptions } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers as Record<string, string>)
        };

        if (requiresAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...fetchOptions,
                headers
            });

            if (!response.ok) {
                let errorData: { error?: { message?: string }; message?: string } | undefined;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
                }
                const errorMessage = errorData?.error?.message || errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
                const apiError: ApiError = new Error(errorMessage);
                apiError.status = response.status;
                apiError.response = errorData;
                apiError.originalError = errorData;
                throw apiError;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            
            // Handle network errors (Failed to fetch)
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                const networkError: ApiError = new Error('Unable to connect to server. Please make sure the backend is running on http://localhost:3001');
                networkError.isNetworkError = true;
                throw networkError;
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    // Generic HTTP methods
    async get<T = unknown>(endpoint: string, requiresAuth = false) {
        return this.request<T>(endpoint, { method: 'GET', requiresAuth });
    }

    async post<T = unknown>(endpoint: string, data?: unknown, requiresAuth = false) {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            requiresAuth
        });
    }

    async put<T = unknown>(endpoint: string, data?: unknown, requiresAuth = false) {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            requiresAuth
        });
    }

    async patch<T = unknown>(endpoint: string, data?: unknown, requiresAuth = false) {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
            requiresAuth
        });
    }

    async delete<T = unknown>(endpoint: string, requiresAuth = false) {
        return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
    }

    // Auth endpoints
    async getNonce(walletAddress: string) {
        return this.request<{ nonce: string; message: string }>(`/auth/nonce/${walletAddress}`);
    }

    async verifySignature(walletAddress: string, signature: string, message: string) {
        return this.request<{ token: string; company: Company }>('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, signature, message })
        });
    }

    // Company endpoints
    async getCompanies(page = 1, limit = 20, verified?: boolean) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (verified !== undefined) params.append('verified', verified.toString());
        return this.request<PaginatedResponse<Company>>(`/companies?${params}`);
    }

    async getCompany(id: string) {
        return this.request<Company>(`/companies/${id}`);
    }

    async createCompany(data: Partial<Company>) {
        return this.request<Company>('/companies', {
            method: 'POST',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async updateCompany(id: string, data: Partial<Company>) {
        return this.request<Company>(`/companies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async getCompanyActions(id: string, page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return this.request<PaginatedResponse<Action>>(`/companies/${id}/actions?${params}`);
    }

    // Action endpoints
    async getActions(page = 1, limit = 20, status?: string) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (status) params.append('status', status);
        return this.request<PaginatedResponse<Action>>(`/actions?${params}`);
    }

    async getAction(id: string) {
        return this.request<Action>(`/actions/${id}`);
    }

    async submitAction(data: Partial<Action>) {
        return this.request<Action>('/actions', {
            method: 'POST',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async verifyAction(id: string, approved: boolean, comments?: string) {
        return this.request<Action>(`/actions/${id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ approved, comments }),
            requiresAuth: true
        });
    }

    async updateActionBlockchain(id: string, data: { blockchainActionId?: number; txHash?: string; blockNumber?: number }) {
        return this.patch<Action>(`/actions/${id}/blockchain`, data, true);
    }

    async uploadActionDocument(id: string, fileName: string, fileUrl: string, fileType: string, fileSize: number) {
        return this.request<{ id: string; fileName: string; fileUrl: string }>(`/actions/${id}/documents`, {
            method: 'POST',
            body: JSON.stringify({ fileName, fileUrl, fileType, fileSize }),
            requiresAuth: true
        });
    }

    // Analytics endpoints
    async getOverview() {
        return this.request<OverviewResponse>('/analytics/overview');
    }

    async getCompanyAnalytics(id: string) {
        return this.request<{ company: Company; stats: { totalActions: number; totalCredits: number } }>(`/analytics/companies/${id}`);
    }

    async getTrends(days = 30) {
        return this.request<TrendsResponse>(`/analytics/trends?days=${days}`);
    }

    // Marketplace endpoints
    async getListings(page = 1, limit = 20, status = 'ACTIVE', sellerId?: string) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), status });
        if (sellerId) params.append('sellerId', sellerId);
        return this.request<PaginatedResponse<Listing>>(`/marketplace/listings?${params}`);
    }

    async getListing(id: string) {
        return this.request<Listing>(`/marketplace/listings/${id}`);
    }

    async createListing(data: Partial<Listing>) {
        return this.request<Listing>('/marketplace/listings', {
            method: 'POST',
            body: JSON.stringify(data),
            requiresAuth: true
        });
    }

    async cancelListing(id: string) {
        return this.request<Listing>(`/marketplace/listings/${id}/cancel`, {
            method: 'PUT',
            requiresAuth: true
        });
    }

    // Staking endpoints
    async getStakes(page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return this.request<PaginatedResponse<Stake>>(`/staking/stakes?${params}`);
    }

    async getMyStakes() {
        return this.request<Stake[]>('/staking/stakes/my', { requiresAuth: true });
    }

    async createStake(amount: number, duration: number) {
        return this.request<Stake>('/staking/stakes', {
            method: 'POST',
            body: JSON.stringify({ amount, duration }),
            requiresAuth: true
        });
    }

    async claimStake(id: string) {
        return this.request<Stake>(`/staking/stakes/${id}/claim`, {
            method: 'PUT',
            requiresAuth: true
        });
    }

    // Governance endpoints
    async getVotes(page = 1, limit = 20, proposalId?: number) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (proposalId !== undefined) params.append('proposalId', proposalId.toString());
        return this.request<PaginatedResponse<Vote>>(`/governance/votes?${params}`);
    }

    async getMyVotes() {
        return this.request<Vote[]>('/governance/votes/my', { requiresAuth: true });
    }

    async castVote(proposalId: number, support: boolean, votingPower: number, txHash?: string) {
        return this.request<Vote>('/governance/votes', {
            method: 'POST',
            body: JSON.stringify({ proposalId, support, votingPower, txHash }),
            requiresAuth: true
        });
    }

    async getProposalResults(id: number) {
        return this.request<{ forVotes: number; againstVotes: number; totalVotes: number }>(`/governance/proposals/${id}/results`);
    }

    // Action Types endpoints
    async getActionTypes(activeOnly: boolean = true) {
        const params = activeOnly ? '?active=true' : '';
        const response = await this.request<{ actionTypes: ActionType[] } | ActionType[]>(`/action-types${params}`);
        // Backend returns { actionTypes: [...] }, extract the array
        if (Array.isArray(response)) {
            return response;
        }
        return (response as { actionTypes: ActionType[] })?.actionTypes || [];
    }

    // Badges endpoints
    async getBadgeDefinitions(activeOnly: boolean = true) {
        const params = activeOnly ? '?active=true' : '';
        return this.request<BadgeDefinition[]>(`/badges/definitions${params}`);
    }

    async getBadgeDefinition(id: string) {
        return this.request<BadgeDefinition>(`/badges/definitions/${id}`);
    }

    async getEarnedBadges(companyId?: string) {
        if (companyId) {
            return this.request<Array<{ badge: BadgeDefinition; earnedAt: string }>>(`/badges/earned/${companyId}`);
        }
        return this.request<Array<{ badge: BadgeDefinition; earnedAt: string }>>('/badges/earned', { requiresAuth: true });
    }

    async getAvailableBadges(companyId: string) {
        return this.request<BadgeDefinition[]>(`/badges/${companyId}/available`);
    }

    async recordEarnedBadge(badgeId: string, tokenId?: number, txHash?: string) {
        return this.request<{ id: string; badgeId: string; tokenId?: number }>('/badges/earned', {
            method: 'POST',
            body: JSON.stringify({ badgeId, tokenId, txHash }),
            requiresAuth: true
        });
    }

    // Leaderboard endpoints
    async getLeaderboard(period: string = 'ALL_TIME', limit: number = 100) {
        return this.request<LeaderboardEntry[]>(`/leaderboard?period=${period}&limit=${limit}`);
    }

    async getCompanyLeaderboardPosition(companyId: string, period: string = 'ALL_TIME') {
        return this.request<LeaderboardEntry>(`/leaderboard/${companyId}?period=${period}`);
    }

    // Reference Data endpoints
    async getIndustries() {
        return this.request<{ success: boolean; data: Industry[] }>('/reference/industries');
    }

    async getQuickActions(audience?: string) {
        const params = audience ? `?audience=${audience}` : '';
        return this.request<{ success: boolean; data: QuickAction[] }>(`/reference/quick-actions${params}`);
    }

    async getGuidelines(audience?: string, category?: string) {
        const params = new URLSearchParams();
        if (audience) params.append('audience', audience);
        if (category) params.append('category', category);
        const queryString = params.toString();
        return this.request<{ success: boolean; data: Guideline[] }>(`/reference/guidelines${queryString ? `?${queryString}` : ''}`);
    }

    async getFaqs(audience?: string, category?: string) {
        const params = new URLSearchParams();
        if (audience) params.append('audience', audience);
        if (category) params.append('category', category);
        const queryString = params.toString();
        return this.request<{ success: boolean; data: Faq[] }>(`/reference/faqs${queryString ? `?${queryString}` : ''}`);
    }

    async getPlatformSettings() {
        return this.request<{ success: boolean; data: Record<string, string | number | boolean> }>('/reference/settings');
    }

    async getRoleOptions() {
        return this.request<{ success: boolean; data: RoleOption[] }>('/reference/role-options');
    }
}

export const api = new ApiService();
