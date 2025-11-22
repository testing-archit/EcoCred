import { contractService, UserRole } from './contracts';
import { walletService, type WalletState } from './wallet';

export interface AuthState {
	isAuthenticated: boolean;
	role: UserRole;
	address: string | null;
	isLoading: boolean;
}

class AuthService {
	private state: AuthState = {
		isAuthenticated: false,
		role: UserRole.COMPANY,
		address: null,
		isLoading: false
	};

	private listeners: Array<(state: AuthState) => void> = [];

	constructor() {
		// Subscribe to wallet changes
		walletService.subscribe(async (walletState: WalletState) => {
			if (walletState.isConnected && walletState.address) {
				await this.checkRole(walletState.address);
			} else {
				this.updateState({
					isAuthenticated: false,
					role: UserRole.COMPANY,
					address: null,
					isLoading: false
				});
			}
		});
	}

	private updateState(updates: Partial<AuthState>) {
		this.state = { ...this.state, ...updates };
		this.notifyListeners();
	}

	private notifyListeners() {
		this.listeners.forEach(listener => listener({ ...this.state }));
	}

	public subscribe(listener: (state: AuthState) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	public getState(): AuthState {
		return { ...this.state };
	}

	public async checkRole(address: string): Promise<UserRole> {
		this.updateState({ isLoading: true, address });
		
		try {
			const role = await contractService.getUserRole(address);
			this.updateState({
				isAuthenticated: true,
				role,
				address,
				isLoading: false
			});
			return role;
		} catch (error) {
			console.error('Error checking role:', error);
			this.updateState({
				isAuthenticated: false,
				role: UserRole.COMPANY,
				address,
				isLoading: false
			});
			return UserRole.COMPANY;
		}
	}

	public async refreshRole(): Promise<void> {
		const walletState = walletService.getState();
		if (walletState.isConnected && walletState.address) {
			await this.checkRole(walletState.address);
		}
	}

	public isAdmin(): boolean {
		return this.state.role === UserRole.ADMIN;
	}

	public isVerifier(): boolean {
		return this.state.role === UserRole.ADMIN || this.state.role === UserRole.VERIFIER;
	}

	public isCompany(): boolean {
		return this.state.role === UserRole.COMPANY || this.state.isAuthenticated;
	}
}

// Create singleton instance
export const authService = new AuthService();

