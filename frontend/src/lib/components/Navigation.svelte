<script lang="ts">
	import { page } from '$app/stores';
	import { Wallet, Leaf, Trophy, Award, Home, Shield } from 'lucide-svelte';
	import { walletService, type WalletState } from '$lib/services/wallet';
	import { authService } from '$lib/services/auth';
	import { UserRole } from '$lib/services/contracts';
	import { onMount, onDestroy } from 'svelte';
	
	let walletState = $state<WalletState>(walletService.getState());
	let authState = $state(authService.getState());
	let isMenuOpen = $state(false);
	let isConnecting = $state(false);
	
	let unsubscribeWallet: (() => void) | null = null;
	let unsubscribeAuth: (() => void) | null = null;
	
	onMount(() => {
		unsubscribeWallet = walletService.subscribe((state) => {
			walletState = state;
		});
		unsubscribeAuth = authService.subscribe((state) => {
			authState = state;
		});
		authService.refreshRole();
	});
	
	onDestroy(() => {
		if (unsubscribeWallet) unsubscribeWallet();
		if (unsubscribeAuth) unsubscribeAuth();
	});
	
	async function connectWallet() {
		isConnecting = true;
		const success = await walletService.connect();
		if (success) {
			// Optionally switch to Sepolia testnet
			await walletService.switchToSepolia();
		}
		isConnecting = false;
	}
	
	async function disconnectWallet() {
		await walletService.disconnect();
	}
	
	const navItems = $derived.by(() => {
		const isVerifier = authState.role === UserRole.ADMIN || authState.role === UserRole.VERIFIER;
		return [
			{ href: '/', label: 'Dashboard', icon: Home },
			{ href: '/actions', label: 'Eco Actions', icon: Leaf },
			{ href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
			{ href: '/badges', label: 'NFT Badges', icon: Award },
			...(isVerifier ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
			{ href: '/counter', label: 'Counter', icon: null }
		];
	});
</script>

<nav class="bg-white shadow-lg border-b border-secondary-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<!-- Logo and Brand -->
			<div class="flex items-center">
				<div class="flex-shrink-0 flex items-center">
					<Leaf class="h-8 w-8 text-primary-600" />
					<span class="ml-2 text-xl font-bold text-secondary-900">GreenLedger</span>
				</div>
			</div>
			
			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-8">
                {#each navItems as item}
                    <a
                        href={item.href}
                        class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                            {$page.url.pathname === item.href 
                                ? 'text-primary-600 bg-primary-50' 
                                : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'}"
                    >
                        {#if item.icon}
                            <item.icon class="h-4 w-4 mr-2" />
                        {/if}
                        {item.label}
                    </a>
                {/each}
			</div>
			
			<!-- Wallet Connection -->
			<div class="flex items-center space-x-4">
				{#if walletState.isConnected}
					<div class="flex items-center space-x-2">
						<div class="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
							{walletService.formatAddress(walletState.address!)}
						</div>
						{#if walletState.balance}
							<div class="text-xs text-secondary-600">
								{parseFloat(walletState.balance).toFixed(4)} ETH
							</div>
						{/if}
						<button
							onclick={disconnectWallet}
							class="text-secondary-600 hover:text-secondary-900 text-sm"
						>
							Disconnect
						</button>
					</div>
				{:else}
					<button
						onclick={connectWallet}
						disabled={isConnecting}
						class="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isConnecting}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Connecting...
						{:else}
							<Wallet class="h-4 w-4 mr-2" />
							Connect Wallet
						{/if}
					</button>
				{/if}
				
				<!-- Mobile menu button -->
				<button
					onclick={() => isMenuOpen = !isMenuOpen}
					class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100"
					aria-label="Toggle mobile menu"
				>
					<svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
						<path class={isMenuOpen ? 'hidden' : 'inline-flex'} stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						<path class={isMenuOpen ? 'inline-flex' : 'hidden'} stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	</div>
	
	<!-- Mobile Navigation -->
	{#if isMenuOpen}
		<div class="md:hidden">
			<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-secondary-200">
                {#each navItems as item}
                    <a
                        href={item.href}
                        class="flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                            {$page.url.pathname === item.href 
                                ? 'text-primary-600 bg-primary-50' 
                                : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'}"
                    >
                        {#if item.icon}
                            <item.icon class="h-5 w-5 mr-3" />
                        {/if}
                        {item.label}
                    </a>
                {/each}
			</div>
		</div>
	{/if}
</nav>
