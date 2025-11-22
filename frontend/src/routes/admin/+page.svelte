<script lang="ts">
	import { contractService, type EcoAction, UserRole } from '$lib/services/contracts';
	import { walletService, type WalletState } from '$lib/services/wallet';
	import { authService } from '$lib/services/auth';
	import { onMount } from 'svelte';
	import { CheckCircle, XCircle, Clock, RefreshCw, Shield, DollarSign } from 'lucide-svelte';

	let walletState = $state<WalletState>(walletService.getState());
	let authState = $state(authService.getState());
	let actions = $state<EcoAction[]>([]);
	let isLoading = $state(false);
	let isVerifying = $state<number | null>(null);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	let unsubscribeWallet: (() => void) | null = null;
	let unsubscribeAuth: (() => void) | null = null;

	async function loadActions() {
		if (!walletState.isConnected) return;
		isLoading = true;
		error = null;
		try {
			actions = await contractService.getAllActions();
			console.log('Loaded actions:', actions);
		} catch (err: any) {
			console.error('Error loading actions:', err);
			error = err?.message || 'Failed to load actions';
		}
		isLoading = false;
	}

	async function verifyAction(actionId: number, approved: boolean) {
		if (!walletState.isConnected) return;
		if (!authService.isVerifier()) {
			error = 'You do not have permission to verify actions';
			return;
		}

		isVerifying = actionId;
		error = null;
		success = null;

		try {
			// Get the action to get estimated credits
			const action = actions.find(a => a.id === actionId);
			const actualCredits = approved ? (action?.estimatedCredits || 0) : 0;

			const txHash = await contractService.verifyAction(actionId, approved, actualCredits);
			success = `Action ${approved ? 'approved' : 'rejected'}. Transaction: ${txHash}`;
			
			// Reload actions after a delay
			setTimeout(() => {
				loadActions();
				success = null;
			}, 2000);
		} catch (err: any) {
			console.error('Error verifying action:', err);
			error = err?.message || 'Failed to verify action';
		}
		isVerifying = null;
	}

	function getStatusColor(verified: boolean) {
		return verified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
	}

	function getStatusIcon(verified: boolean) {
		return verified ? CheckCircle : Clock;
	}

	onMount(() => {
		unsubscribeWallet = walletService.subscribe((state) => {
			walletState = state;
			if (state.isConnected) {
				loadActions();
			} else {
				actions = [];
			}
		});

		unsubscribeAuth = authService.subscribe((state) => {
			authState = state;
		});

		// Check role on mount
		authService.refreshRole();

		if (walletState.isConnected) {
			loadActions();
		}

		return () => {
			if (unsubscribeWallet) unsubscribeWallet();
			if (unsubscribeAuth) unsubscribeAuth();
		};
	});
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-secondary-900 mb-2 flex items-center">
					<Shield class="h-8 w-8 mr-3 text-primary-600" />
					Admin Dashboard
				</h1>
				<p class="text-secondary-600">Verify and manage eco actions submitted by companies</p>
				{#if walletState.isConnected && walletState.address}
					<div class="mt-2 text-sm">
						<p class="text-secondary-600">
							Connected as: <span class="font-mono text-primary-600">{walletService.formatAddress(walletState.address)}</span>
						</p>
						<p class="text-secondary-600">
							Role: <span class="font-semibold text-primary-600">
								{authState.role === UserRole.ADMIN ? 'ADMIN' : authState.role === UserRole.VERIFIER ? 'VERIFIER' : authState.role === UserRole.MODERATOR ? 'MODERATOR' : 'COMPANY'}
							</span>
						</p>
					</div>
				{/if}
			</div>
			<button
				class="btn-secondary flex items-center"
				onclick={loadActions}
				disabled={isLoading}
			>
				<RefreshCw class="h-4 w-4 mr-2 {isLoading ? 'animate-spin' : ''}" />
				Refresh
			</button>
		</div>
	</div>

	<!-- Role Information Card -->
	{#if !authService.isVerifier() && walletState.isConnected}
		<div class="mb-6 card bg-blue-50 border border-blue-200">
			<div class="flex items-start">
				<Shield class="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
				<div class="flex-1">
					<p class="font-semibold text-blue-900 mb-2">How to Get Admin/Verifier Access</p>
					<div class="text-sm text-blue-800 space-y-2">
						<p><strong>Option 1: Using AccessControl Contract</strong></p>
						<p>If you have deployed an AccessControl contract, the deployer is automatically an ADMIN. To grant admin/verifier role to another address:</p>
						<code class="block bg-blue-100 p-2 rounded mt-1 text-xs">
							cd blockchain<br/>
							npx hardhat run scripts/grant-role.ts --network localhost ACCESS_CONTROL_ADDRESS YOUR_WALLET_ADDRESS ADMIN
						</code>
						
						<p class="mt-3"><strong>Option 2: Using Basic EcoLedger</strong></p>
						<p>If you're using the basic EcoLedger contract (without AccessControl), connect the wallet that deployed the contract. The deployer/owner is automatically treated as ADMIN.</p>
						
						<p class="mt-3"><strong>Current Status:</strong></p>
						<p>Your wallet address: <span class="font-mono">{walletState.address}</span></p>
						<p>Your current role: <span class="font-semibold">COMPANY</span> (no admin access)</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if !walletState.isConnected}
		<div class="card p-6 text-center">
			<p class="text-secondary-600">Please connect your wallet to access the admin dashboard.</p>
		</div>
	{:else if !authService.isVerifier()}
		<div class="card p-6 bg-red-50 border border-red-200">
			<div class="flex items-center">
				<XCircle class="h-5 w-5 text-red-600 mr-2" />
				<div>
					<p class="font-semibold text-red-900">Access Denied</p>
					<p class="text-sm text-red-700 mt-1">
						You do not have admin or verifier permissions. Only authorized verifiers can access this page.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Messages -->
		{#if error}
			<div class="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
				<p class="font-semibold">Error:</p>
				<p class="text-sm">{error}</p>
			</div>
		{/if}

		{#if success}
			<div class="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
				<p class="font-semibold">Success:</p>
				<p class="text-sm">{success}</p>
			</div>
		{/if}

		<!-- Admin Capabilities Info -->
		<div class="mb-6 card bg-primary-50 border border-primary-200">
			<div class="flex items-start">
				<Shield class="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="font-semibold text-primary-900 mb-2">Admin Capabilities</h3>
					<div class="text-sm text-primary-800 space-y-1">
						<p><strong>✓ Verify Actions:</strong> Approve or reject eco actions submitted by companies</p>
						<p><strong>✓ Mint Credits:</strong> When approving actions, carbon credits are automatically minted to companies</p>
						<p><strong>✓ Award Badges:</strong> Badges are automatically awarded when companies reach milestones (100+ credits)</p>
						<p><strong>✓ View All Actions:</strong> See all submitted actions (pending and verified)</p>
						{#if authState.role === UserRole.ADMIN}
							<p class="mt-2 pt-2 border-t border-primary-200"><strong>Additional Admin Powers (via smart contracts):</strong></p>
							<p><strong>• Manage Roles:</strong> Grant/revoke ADMIN, VERIFIER, or MODERATOR roles (AccessControl contract)</p>
							<p><strong>• Configure System:</strong> Set verification thresholds, reputation multipliers (EcoLedgerV2)</p>
							<p><strong>• Transfer Ownership:</strong> Transfer AccessControl ownership to another address</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Token Minting Info -->
		<div class="mb-6 card bg-green-50 border border-green-200">
			<div class="flex items-start">
				<DollarSign class="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="font-semibold text-green-900 mb-2">ERC-20 Token Minting Details</h3>
					<div class="text-sm text-green-800 space-y-2">
						<div>
							<p class="font-semibold mb-1">When Tokens Are Minted:</p>
							<p>• When you <strong>approve an action</strong> as admin/verifier</p>
							<p>• Tokens are minted to the company that submitted the action</p>
						</div>
						<div>
							<p class="font-semibold mb-1">How Many Tokens Are Minted:</p>
							<p>• Formula: <code class="bg-green-100 px-1 rounded">actualCredits × 1e18</code></p>
							<p>• Example: If you approve with 100 credits → <strong>100,000,000,000,000,000,000 tokens</strong> (100 with 18 decimals)</p>
							<p>• The <code class="bg-green-100 px-1 rounded">actualCredits</code> is set by <strong>you</strong> when verifying (can differ from estimated)</p>
							{#if authState.role === UserRole.ADMIN}
								<p class="mt-1">• In EcoLedgerV2: Credits are multiplied by reputation multiplier (default: 1x = 10000 basis points)</p>
							{/if}
						</div>
						<div>
							<p class="font-semibold mb-1">Who Can Change Minting:</p>
							<p>• <strong>Admin/Verifier:</strong> Controls the <code class="bg-green-100 px-1 rounded">actualCredits</code> amount when verifying actions</p>
							<p>• <strong>Token Owner:</strong> Can change the minter address (who is allowed to mint)</p>
							{#if authState.role === UserRole.ADMIN}
								<p>• <strong>Admin:</strong> Can change reputation multiplier in EcoLedgerV2 (affects final credit amount)</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions List -->
		<div class="card">
			<div class="mb-6">
				<h2 class="text-xl font-semibold text-secondary-900">Pending Verifications</h2>
				<p class="text-sm text-secondary-600 mt-1">
					{actions.filter(a => !a.verified).length} pending, {actions.filter(a => a.verified).length} verified
				</p>
			</div>

			{#if isLoading}
				<div class="text-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
					<p class="text-secondary-600 mt-4">Loading actions...</p>
				</div>
			{:else if actions.length === 0}
				<div class="text-center py-12">
					<Clock class="h-12 w-12 text-secondary-400 mx-auto mb-4" />
					<p class="text-secondary-600">No actions found</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each actions as action}
						<div class="border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between mb-4">
								<div class="flex-1">
									<div class="flex items-center mb-2">
										<h3 class="text-lg font-semibold text-secondary-900 mr-3">
											{action.title}
										</h3>
										<div class="badge {getStatusColor(action.verified)} flex items-center">
											{#if action.verified}
												<CheckCircle class="h-3 w-3 mr-1" />
											{:else}
												<Clock class="h-3 w-3 mr-1" />
											{/if}
											{action.verified ? 'Verified' : 'Pending'}
										</div>
									</div>
									<p class="text-sm text-secondary-600 mb-2">Action ID: #{action.id}</p>
									<p class="text-secondary-700 mb-4">{action.description}</p>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
								<div>
									<p class="text-xs text-secondary-500 mb-1">Location</p>
									<p class="text-sm font-medium text-secondary-900">{action.location}</p>
								</div>
								<div>
									<p class="text-xs text-secondary-500 mb-1">Estimated Credits</p>
									<p class="text-sm font-medium text-secondary-900 flex items-center">
										<DollarSign class="h-4 w-4 mr-1 text-primary-600" />
										{action.estimatedCredits}
									</p>
								</div>
								<div>
									<p class="text-xs text-secondary-500 mb-1">Actual Credits</p>
									<p class="text-sm font-medium text-secondary-900">
										{action.verified ? action.actualCredits : 'Not verified'}
									</p>
								</div>
							</div>

							{#if !action.verified}
								<div class="flex items-center space-x-3 pt-4 border-t border-secondary-200">
									<button
										class="btn-primary flex items-center flex-1"
										onclick={() => verifyAction(action.id, true)}
										disabled={isVerifying === action.id}
									>
										{#if isVerifying === action.id}
											<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Verifying...
										{:else}
											<CheckCircle class="h-4 w-4 mr-2" />
											Approve
										{/if}
									</button>
									<button
										class="btn-secondary flex items-center flex-1"
										onclick={() => verifyAction(action.id, false)}
										disabled={isVerifying === action.id}
									>
										<XCircle class="h-4 w-4 mr-2" />
										Reject
									</button>
								</div>
							{:else}
								<div class="pt-4 border-t border-secondary-200">
									<p class="text-sm text-green-600 flex items-center">
										<CheckCircle class="h-4 w-4 mr-2" />
										Verified - {action.actualCredits} credits awarded
									</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

