<script lang="ts">
    import { Leaf, Upload, FileText, Calendar, MapPin, DollarSign, CheckCircle, Clock } from 'lucide-svelte';
    import { contractService } from '$lib/services/contracts';
    import { walletService } from '$lib/services/wallet';
    
	let formData = $state({
		actionType: '',
		title: '',
		description: '',
		location: '',
		date: '',
		estimatedCredits: 0,
		documentation: null as File | null,
		additionalNotes: ''
	});
	
	let actionTypes = [
		{ value: 'reforestation', label: 'Reforestation & Tree Planting', credits: '50-200 per tree' },
		{ value: 'renewable_energy', label: 'Renewable Energy Installation', credits: '100-500 per kW' },
		{ value: 'waste_reduction', label: 'Waste Reduction & Recycling', credits: '10-100 per ton' },
		{ value: 'energy_efficiency', label: 'Energy Efficiency Improvements', credits: '25-150 per kWh saved' },
		{ value: 'water_conservation', label: 'Water Conservation', credits: '5-50 per 1000L saved' },
		{ value: 'sustainable_transport', label: 'Sustainable Transportation', credits: '20-100 per trip' },
		{ value: 'carbon_capture', label: 'Carbon Capture Technology', credits: '200-1000 per ton' },
		{ value: 'other', label: 'Other Sustainability Action', credits: 'Variable' }
	];
	
	let recentActions = $state([
		{
			id: 1,
			title: 'Planted 50 trees in urban area',
			type: 'reforestation',
			credits: 150,
			status: 'verified',
			date: '2024-01-15',
			txHash: '0x1234...5678'
		},
		{
			id: 2,
			title: 'Installed solar panels (5kW)',
			type: 'renewable_energy',
			credits: 200,
			status: 'verified',
			date: '2024-02-20',
			txHash: '0x9876...5432'
		},
		{
			id: 3,
			title: 'Implemented recycling program',
			type: 'waste_reduction',
			credits: 75,
			status: 'pending',
			date: '2024-03-10',
			txHash: '0xabcd...efgh'
		}
	]);
	
    let isSubmitting = $state(false);
    let showSuccess = $state(false);
    let lastActionId = $state<number | null>(null);
    let lastTxHash = $state<string | null>(null);
	
	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			formData.documentation = target.files[0];
		}
	}
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'verified':
				return 'text-green-600 bg-green-100';
			case 'pending':
				return 'text-yellow-600 bg-yellow-100';
			case 'rejected':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-secondary-600 bg-secondary-100';
		}
	}
	
	function getStatusIcon(status: string) {
		switch (status) {
			case 'verified':
				return CheckCircle;
			case 'pending':
				return Clock;
			default:
				return Clock;
		}
	}
	
    async function submitAction(event: SubmitEvent) {
        event.preventDefault();
        isSubmitting = true;
        lastActionId = null;
        lastTxHash = null;

        try {
            const state = walletService.getState();
            if (!state.isConnected) {
                isSubmitting = false;
                return;
            }
            const actionId = await contractService.logEcoAction(
                formData.title,
                formData.description,
                formData.estimatedCredits,
                formData.location
            );
            lastActionId = actionId;
            lastTxHash = 'submitted';
        } catch (e) {
            console.error('Failed to submit on-chain action', e);
            isSubmitting = false;
            return;
        }

		// Add to recent actions
		const newAction = {
			id: recentActions.length + 1,
			title: formData.title,
			type: formData.actionType,
			credits: formData.estimatedCredits,
			status: 'pending',
			date: formData.date,
			txHash: '0x' + Math.random().toString(16).substr(2, 8) + '...' + Math.random().toString(16).substr(2, 8)
		};
		recentActions = [newAction, ...recentActions];
		
		// Reset form
		formData = {
			actionType: '',
			title: '',
			description: '',
			location: '',
			date: '',
			estimatedCredits: 0,
			documentation: null,
			additionalNotes: ''
		};
		
		isSubmitting = false;
		showSuccess = true;
		
		setTimeout(() => {
			showSuccess = false;
		}, 5000);
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-secondary-900 mb-2">Log Eco Action</h1>
		<p class="text-secondary-600">Record your sustainability efforts and earn carbon credits</p>
	</div>
	
	<!-- Success Message -->
	{#if showSuccess}
		<div class="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
			<CheckCircle class="h-5 w-5 mr-2" />
			Action submitted successfully! It will be verified and credits will be minted once approved.
		</div>
	{/if}
	
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Action Form -->
		<div class="lg:col-span-2">
			<div class="card">
				<h3 class="text-lg font-semibold text-secondary-900 mb-6">New Eco Action</h3>
				
				<form onsubmit={submitAction} class="space-y-6">
					<!-- Action Type -->
					<div>
						<label for="actionType" class="block text-sm font-medium text-secondary-700 mb-2">
							Action Type
						</label>
						<select
							id="actionType"
							bind:value={formData.actionType}
							class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
						>
							<option value="">Select an action type</option>
							{#each actionTypes as type}
								<option value={type.value}>{type.label} ({type.credits})</option>
							{/each}
						</select>
					</div>
					
					<!-- Title -->
					<div>
						<label for="title" class="block text-sm font-medium text-secondary-700 mb-2">
							Action Title
						</label>
						<input
							type="text"
							id="title"
							bind:value={formData.title}
							placeholder="e.g., Planted 100 trees in community park"
							class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
						/>
					</div>
					
					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-secondary-700 mb-2">
							Description
						</label>
						<textarea
							id="description"
							bind:value={formData.description}
							rows="4"
							placeholder="Provide detailed information about your sustainability action..."
							class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
						></textarea>
					</div>
					
					<!-- Location and Date -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="location" class="block text-sm font-medium text-secondary-700 mb-2">
								<MapPin class="h-4 w-4 inline mr-1" />
								Location
							</label>
							<input
								type="text"
								id="location"
								bind:value={formData.location}
								placeholder="City, Country"
								class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								required
							/>
						</div>
						
						<div>
							<label for="date" class="block text-sm font-medium text-secondary-700 mb-2">
								<Calendar class="h-4 w-4 inline mr-1" />
								Date
							</label>
							<input
								type="date"
								id="date"
								bind:value={formData.date}
								class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								required
							/>
						</div>
					</div>
					
					<!-- Estimated Credits -->
					<div>
						<label for="credits" class="block text-sm font-medium text-secondary-700 mb-2">
							<DollarSign class="h-4 w-4 inline mr-1" />
							Estimated Credits
						</label>
						<input
							type="number"
							id="credits"
							bind:value={formData.estimatedCredits}
							min="1"
							placeholder="Enter estimated carbon credits to be earned"
							class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
						/>
						<p class="text-xs text-secondary-500 mt-1">
							Credits will be verified by our team before minting
						</p>
					</div>
					
					<!-- Documentation Upload -->
					<div>
						<label for="documentation" class="block text-sm font-medium text-secondary-700 mb-2">
							<Upload class="h-4 w-4 inline mr-1" />
							Documentation
						</label>
						<input
							type="file"
							id="documentation"
							onchange={handleFileUpload}
							accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
							class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						<p class="text-xs text-secondary-500 mt-1">
							Upload photos, certificates, or documents supporting your action (PDF, JPG, PNG, DOC)
						</p>
					</div>
					
					<!-- Additional Notes -->
					<div>
						<label for="notes" class="block text-sm font-medium text-secondary-700 mb-2">
							Additional Notes
						</label>
						<textarea
							id="notes"
							bind:value={formData.additionalNotes}
							rows="3"
							placeholder="Any additional information or context..."
							class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						></textarea>
					</div>
					
					<!-- Submit Button -->
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Submitting...
						{:else}
							<Leaf class="h-4 w-4 mr-2" />
							Submit Eco Action
						{/if}
					</button>
                {#if lastActionId}
                <div class="text-xs text-secondary-600">
                    Submitted Action ID: <span class="font-mono">{lastActionId}</span>
                    {#if lastTxHash}
                        · Tx: <span class="font-mono">{lastTxHash}</span>
                    {/if}
                </div>
                {/if}
				</form>
			</div>
		</div>
		
		<!-- Recent Actions Sidebar -->
		<div class="lg:col-span-1">
			<div class="card">
				<h3 class="text-lg font-semibold text-secondary-900 mb-4">Recent Actions</h3>
				
				<div class="space-y-4">
					{#each recentActions as action}
						<div class="p-4 bg-secondary-50 rounded-lg">
							<div class="flex items-start justify-between mb-2">
								<h4 class="text-sm font-medium text-secondary-900 truncate">
									{action.title}
								</h4>
                                <div class="badge {getStatusColor(action.status)} flex items-center ml-2">
                                    {#if action.status === 'verified'}
                                        <CheckCircle class="h-3 w-3 mr-1" />
                                    {:else}
                                        <Clock class="h-3 w-3 mr-1" />
                                    {/if}
                                    {action.status}
                                </div>
							</div>
							
							<div class="text-xs text-secondary-600 space-y-1">
								<p>Credits: <span class="font-medium text-primary-600">+{action.credits}</span></p>
								<p>Date: {action.date}</p>
								<p>TX: <span class="font-mono">{action.txHash}</span></p>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-4 pt-4 border-t border-secondary-200">
					<a href="/" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
						View all actions →
					</a>
				</div>
			</div>
			
			<!-- Info Card -->
			<div class="card mt-6">
				<h3 class="text-lg font-semibold text-secondary-900 mb-4">How It Works</h3>
				<div class="space-y-3 text-sm text-secondary-600">
					<div class="flex items-start">
						<div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
							<span class="text-xs font-medium text-primary-600">1</span>
						</div>
						<p>Submit your eco action with documentation</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
							<span class="text-xs font-medium text-primary-600">2</span>
						</div>
						<p>Our team verifies the action</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
							<span class="text-xs font-medium text-primary-600">3</span>
						</div>
						<p>Carbon credits are minted as ERC-20 tokens</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
							<span class="text-xs font-medium text-primary-600">4</span>
						</div>
						<p>NFT badges are awarded for milestones</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
