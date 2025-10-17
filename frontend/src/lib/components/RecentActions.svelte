<script lang="ts">
	import { Clock, Leaf, CheckCircle } from 'lucide-svelte';
	
	// Mock data - replace with actual data from blockchain
	let recentActions = $state([
		{
			id: 1,
			action: 'Planted 50 trees in urban area',
			credits: 150,
			status: 'verified',
			timestamp: '2 hours ago',
			type: 'reforestation'
		},
		{
			id: 2,
			action: 'Installed solar panels (5kW)',
			credits: 200,
			status: 'verified',
			timestamp: '1 day ago',
			type: 'renewable_energy'
		},
		{
			id: 3,
			action: 'Implemented recycling program',
			credits: 75,
			status: 'pending',
			timestamp: '3 days ago',
			type: 'waste_reduction'
		},
		{
			id: 4,
			action: 'Reduced paper usage by 30%',
			credits: 45,
			status: 'verified',
			timestamp: '1 week ago',
			type: 'resource_conservation'
		}
	]);
	
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
</script>

<div class="card h-full">
	<h3 class="text-lg font-semibold text-secondary-900 mb-4">Recent Actions</h3>
	
	<div class="space-y-4">
		{#each recentActions as action}
			<div class="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg">
				<div class="flex-shrink-0">
					<Leaf class="h-5 w-5 text-primary-600" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-secondary-900 truncate">
						{action.action}
					</p>
					<div class="flex items-center justify-between mt-1">
						<span class="text-xs text-secondary-600 flex items-center">
							<Clock class="h-3 w-3 mr-1" />
							{action.timestamp}
						</span>
						<span class="text-sm font-medium text-primary-600">
							+{action.credits} CCT
						</span>
					</div>
					<div class="flex items-center mt-2">
						<div class="badge {getStatusColor(action.status)} flex items-center">
							<svelte:component this={getStatusIcon(action.status)} class="h-3 w-3 mr-1" />
							{action.status}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	<div class="mt-4 pt-4 border-t border-secondary-200">
		<a href="/actions" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
			View all actions →
		</a>
	</div>
</div>
