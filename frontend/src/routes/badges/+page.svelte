<script lang="ts">
	import { Award, Star, Trophy, Medal, Shield, Zap, TreePine, Recycle, Eye } from 'lucide-svelte';
	
	// Mock data - replace with actual data from blockchain
	let badges = $state([
		{
			id: 1,
			name: 'Tree Planter',
			description: 'Planted 100+ trees',
			tier: 'bronze',
			icon: TreePine,
			earned: true,
			date: '2024-01-15',
			creditsRequired: 500,
			image: '/api/placeholder/200/200'
		},
		{
			id: 2,
			name: 'Solar Pioneer',
			description: 'Installed renewable energy systems',
			tier: 'gold',
			icon: Zap,
			earned: true,
			date: '2024-02-20',
			creditsRequired: 1500,
			image: '/api/placeholder/200/200'
		},
		{
			id: 3,
			name: 'Waste Warrior',
			description: 'Implemented comprehensive recycling program',
			tier: 'silver',
			icon: Recycle,
			earned: true,
			date: '2024-03-10',
			creditsRequired: 1000,
			image: '/api/placeholder/200/200'
		},
		{
			id: 4,
			name: 'Carbon Neutral',
			description: 'Achieved net-zero carbon emissions',
			tier: 'gold',
			icon: Shield,
			earned: false,
			date: null,
			creditsRequired: 5000,
			image: '/api/placeholder/200/200'
		},
		{
			id: 5,
			name: 'Eco Innovator',
			description: 'Developed sustainable technology solutions',
			tier: 'platinum',
			icon: Star,
			earned: false,
			date: null,
			creditsRequired: 10000,
			image: '/api/placeholder/200/200'
		},
		{
			id: 6,
			name: 'Green Leader',
			description: 'Led community sustainability initiatives',
			tier: 'gold',
			icon: Trophy,
			earned: false,
			date: null,
			creditsRequired: 3000,
			image: '/api/placeholder/200/200'
		}
	]);
	
	let filterTier = $state('all');
	let filterEarned = $state('all');
	
	let earnedCount = badges.filter(b => b.earned).length;
	let totalCount = badges.length;
	
	function getTierColor(tier: string) {
		switch (tier) {
			case 'bronze':
				return 'from-amber-400 to-amber-600';
			case 'silver':
				return 'from-gray-300 to-gray-500';
			case 'gold':
				return 'from-yellow-400 to-yellow-600';
			case 'platinum':
				return 'from-purple-400 to-purple-600';
			default:
				return 'from-secondary-400 to-secondary-600';
		}
	}
	
	function getTierTextColor(tier: string) {
		switch (tier) {
			case 'bronze':
				return 'text-amber-800';
			case 'silver':
				return 'text-gray-800';
			case 'gold':
				return 'text-yellow-800';
			case 'platinum':
				return 'text-purple-800';
			default:
				return 'text-secondary-800';
		}
	}
	
	function getTierBgColor(tier: string) {
		switch (tier) {
			case 'bronze':
				return 'bg-amber-100';
			case 'silver':
				return 'bg-gray-100';
			case 'gold':
				return 'bg-yellow-100';
			case 'platinum':
				return 'bg-purple-100';
			default:
				return 'bg-secondary-100';
		}
	}
	
	function getFilteredBadges() {
		return badges.filter(badge => {
			const tierMatch = filterTier === 'all' || badge.tier === filterTier;
			const earnedMatch = filterEarned === 'all' || 
				(filterEarned === 'earned' && badge.earned) ||
				(filterEarned === 'unearned' && !badge.earned);
			return tierMatch && earnedMatch;
		});
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-secondary-900 mb-2">NFT Badge Gallery</h1>
		<p class="text-secondary-600">Your sustainability milestone achievements</p>
	</div>
	
	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
						<Award class="h-5 w-5 text-primary-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Badges Earned</p>
					<p class="text-2xl font-bold text-secondary-900">{earnedCount}/{totalCount}</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
						<Star class="h-5 w-5 text-yellow-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Highest Tier</p>
					<p class="text-2xl font-bold text-secondary-900">Gold</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
						<Trophy class="h-5 w-5 text-green-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Progress</p>
					<p class="text-2xl font-bold text-secondary-900">{Math.round((earnedCount / totalCount) * 100)}%</p>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Filters -->
	<div class="card mb-8">
		<div class="flex flex-wrap items-center gap-4">
			<div class="flex items-center space-x-2">
				<span class="text-sm font-medium text-secondary-700">Filter by tier:</span>
				<select 
					bind:value={filterTier}
					class="bg-white border border-secondary-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				>
					<option value="all">All Tiers</option>
					<option value="bronze">Bronze</option>
					<option value="silver">Silver</option>
					<option value="gold">Gold</option>
					<option value="platinum">Platinum</option>
				</select>
			</div>
			
			<div class="flex items-center space-x-2">
				<span class="text-sm font-medium text-secondary-700">Filter by status:</span>
				<select 
					bind:value={filterEarned}
					class="bg-white border border-secondary-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				>
					<option value="all">All Badges</option>
					<option value="earned">Earned</option>
					<option value="unearned">Not Earned</option>
				</select>
			</div>
		</div>
	</div>
	
	<!-- Badge Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each getFilteredBadges() as badge}
			<div class="card {!badge.earned ? 'opacity-60' : ''} hover:shadow-xl transition-shadow duration-300">
				<div class="relative">
					<!-- Badge Image/Icon -->
					<div class="w-full h-48 bg-gradient-to-br {getTierColor(badge.tier)} rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
						<svelte:component this={badge.icon} class="h-16 w-16 text-white" />
						{#if !badge.earned}
							<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
								<Eye class="h-8 w-8 text-white" />
							</div>
						{/if}
					</div>
					
					<!-- Badge Info -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-secondary-900">{badge.name}</h3>
							<span class="badge {getTierBgColor(badge.tier)} {getTierTextColor(badge.tier)}">
								{badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
							</span>
						</div>
						
						<p class="text-sm text-secondary-600">{badge.description}</p>
						
						<div class="space-y-2">
							<div class="flex items-center justify-between text-sm">
								<span class="text-secondary-600">Credits Required:</span>
								<span class="font-medium text-secondary-900">{badge.creditsRequired.toLocaleString()}</span>
							</div>
							
							{#if badge.earned}
								<div class="flex items-center justify-between text-sm">
									<span class="text-secondary-600">Earned:</span>
									<span class="font-medium text-green-600">{badge.date}</span>
								</div>
							{:else}
								<div class="bg-secondary-100 rounded-lg p-3">
									<p class="text-sm text-secondary-600 text-center">
										Keep earning credits to unlock this badge!
									</p>
								</div>
							{/if}
						</div>
						
						{#if badge.earned}
							<button class="w-full btn-primary">
								View on Blockchain
							</button>
						{:else}
							<button class="w-full btn-secondary" disabled>
								Locked
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Empty State -->
	{#if getFilteredBadges().length === 0}
		<div class="text-center py-12">
			<Award class="h-16 w-16 text-secondary-400 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-secondary-900 mb-2">No badges found</h3>
			<p class="text-secondary-600">Try adjusting your filters to see more badges.</p>
		</div>
	{/if}
</div>
