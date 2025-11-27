import { ethers } from 'ethers';

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
    balance: string | null;
}

class WalletService {
    private state: WalletState = {
        isConnected: false,
        address: null,
        chainId: null,
        balance: null
    };

    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;

    // Event listeners
    private listeners: Array<(state: WalletState) => void> = [];

    constructor() {
        // Check if MetaMask is available
        if (typeof window !== 'undefined' && window.ethereum) {
            this.setupEventListeners();
        }
    }

    private setupEventListeners() {
        if (!window.ethereum) return;

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.updateAccount(accounts[0]);
            }
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId: string) => {
            this.updateChain(parseInt(chainId, 16));
        });
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener({ ...this.state }));
    }

    public subscribe(listener: (state: WalletState) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public getState(): WalletState {
        return { ...this.state };
    }

    public async connect(): Promise<boolean> {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Get account info
            const address = accounts[0];
            const network = await this.provider.getNetwork();
            const balance = await this.provider.getBalance(address);

            // Update state
            this.state = {
                isConnected: true,
                address,
                chainId: Number(network.chainId),
                balance: ethers.formatEther(balance)
            };

            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            return false;
        }
    }

    public async disconnect(): Promise<void> {
        this.state = {
            isConnected: false,
            address: null,
            chainId: null,
            balance: null
        };

        this.provider = null;
        this.signer = null;

        this.notifyListeners();
    }

    private async updateAccount(address: string) {
        if (!this.provider) return;

        try {
            const balance = await this.provider.getBalance(address);
            this.state.address = address;
            this.state.balance = ethers.formatEther(balance);
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to update account:', error);
        }
    }

    private async updateChain(chainId: number) {
        this.state.chainId = chainId;
        this.notifyListeners();
    }

    public async switchToSepolia(): Promise<boolean> {
        try {
            if (!window.ethereum) return false;

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
            });

            return true;
        } catch (error) {
            // If the chain doesn't exist, add it
            const ethError = error as { code?: number };
            if (ethError.code === 4902 && window.ethereum) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia Test Network',
                                rpcUrls: ['https://sepolia.infura.io/v3/'],
                                nativeCurrency: {
                                    name: 'SepoliaETH',
                                    symbol: 'SEP',
                                    decimals: 18,
                                },
                                blockExplorerUrls: ['https://sepolia.etherscan.io'],
                            },
                        ],
                    });
                    return true;
                } catch (addError) {
                    console.error('Failed to add Sepolia network:', addError);
                    return false;
                }
            }
            console.error('Failed to switch to Sepolia:', error);
            return false;
        }
    }

    public getProvider(): ethers.BrowserProvider | null {
        return this.provider;
    }

    public getSigner(): ethers.JsonRpcSigner | null {
        return this.signer;
    }

    public formatAddress(address: string): string {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

export const walletService = new WalletService();

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, callback: (...args: unknown[]) => void) => void;
            removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
        };
    }
}
