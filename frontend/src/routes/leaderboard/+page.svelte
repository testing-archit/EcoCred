<script lang="ts">
	import { Trophy, Medal, Award, Users, TrendingUp, Filter } from 'lucide-svelte';
	
	// Mock data - replace with actual data from blockchain
	let companies = $state([
		{
			id: 1,
			name: 'EcoTech Solutions',
			credits: 15420,
			actions: 89,
			badges: 5,
			rank: 1,
			change: '+2'
		},
		{
			id: 2,
			name: 'GreenCorp Industries',
			credits: 12850,
			actions: 76,
			badges: 4,
			rank: 2,
			change: '+1'
		},
		{
			id: 3,
			name: 'Sustainable Future Ltd',
			credits: 11200,
			actions: 68,
			badges: 4,
			rank: 3,
			change: '-1'
		},
		{
			id: 4,
			name: 'Climate Action Co',
			credits: 9850,
			actions: 54,
			badges: 3,
			rank: 4,
			change: '+3'
		},
		{
			id: 5,
			name: 'EcoVenture Partners',
			credits: 9200,
			actions: 51,
			badges: 3,
			rank: 5,
			change: '-2'
		},
		{
			id: 6,
			name: 'GreenTech Innovations',
			credits: 8750,
			actions: 48,
			badges: 3,
			rank: 6,
			change: '+1'
		},
		{
			id: 7,
			name: 'Sustainable Systems',
			credits: 8200,
			actions: 45,
			badges: 2,
			rank: 7,
			change: '+2'
		},
		{
			id: 8,
			name: 'EcoVision Group',
			credits: 7850,
			actions: 43,
			badges: 2,
			rank: 8,
			change: '-1'
		},
		{
			id: 9,
			name: 'GreenPath Enterprises',
			credits: 7200,
			actions: 40,
			badges: 2,
			rank: 9,
			change: '+1'
		},
		{
			id: 10,
			name: 'Climate Solutions Inc',
			credits: 6800,
			actions: 38,
			badges: 2,
			rank: 10,
			change: '-2'
		}
	]);
	
	let currentUser = $state({
		name: 'Your Company',
		credits: 2450,
		actions: 28,
		badges: 3,
		rank: 12,
		change: '+1'
	});
	
	let filterPeriod = $state('all');
	let filterOptions = ['all', 'month', 'week', 'day'];
	
	function getRankIcon(rank: number) {
		switch (rank) {
			case 1:
				return Trophy;
			case 2:
				return Medal;
			case 3:
				return Award;
			default:
				return null;
		}
	}
	
	function getRankColor(rank: number) {
		switch (rank) {
			case 1:
				return 'bg-yellow-100 text-yellow-800';
			case 2:
				return 'bg-gray-100 text-gray-800';
			case 3:
				return 'bg-amber-100 text-amber-800';
			default:
				return 'bg-secondary-100 text-secondary-800';
		}
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-secondary-900 mb-2">Leaderboard</h1>
				<p class="text-secondary-600">See how your company ranks in sustainability efforts</p>
			</div>
			<div class="flex items-center space-x-4">
				<select 
					bind:value={filterPeriod}
					class="bg-white border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				>
					{#each filterOptions as option}
						<option value={option}>
							{option === 'all' ? 'All Time' : 
							 option === 'month' ? 'This Month' :
							 option === 'week' ? 'This Week' : 'Today'}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
	
	<!-- Current User Card -->
	<div class="card mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
						<Users class="h-6 w-6 text-white" />
					</div>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-secondary-900">{currentUser.name}</h3>
					<p class="text-sm text-secondary-600">Rank #{currentUser.rank}</p>
				</div>
			</div>
			<div class="flex items-center space-x-6">
				<div class="text-center">
					<p class="text-2xl font-bold text-primary-600">{currentUser.credits.toLocaleString()}</p>
					<p class="text-sm text-secondary-600">Credits</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-secondary-900">{currentUser.actions}</p>
					<p class="text-sm text-secondary-600">Actions</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-secondary-900">{currentUser.badges}</p>
					<p class="text-sm text-secondary-600">Badges</p>
				</div>
				<div class="flex items-center space-x-1">
					<TrendingUp class="h-4 w-4 text-green-600" />
					<span class="text-sm font-medium text-green-600">{currentUser.change}</span>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Top 3 Podium -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		{#each companies.slice(0, 3) as company, index}
			<div class="card {index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'}">
				<div class="text-center">
					<div class="flex justify-center mb-4">
						{#if getRankIcon(company.rank)}
							<div class="w-16 h-16 {getRankColor(company.rank)} rounded-full flex items-center justify-center">
								<svelte:component this={getRankIcon(company.rank)} class="h-8 w-8" />
							</div>
						{/if}
					</div>
					<h3 class="text-xl font-bold text-secondary-900 mb-2">{company.name}</h3>
					<p class="text-3xl font-bold text-primary-600 mb-2">{company.credits.toLocaleString()}</p>
					<p class="text-sm text-secondary-600 mb-4">Carbon Credits</p>
					<div class="flex justify-center space-x-4 text-sm">
						<span class="text-secondary-600">{company.actions} actions</span>
						<span class="text-secondary-600">{company.badges} badges</span>
					</div>
					<div class="flex items-center justify-center mt-2">
						<TrendingUp class="h-4 w-4 text-green-600 mr-1" />
						<span class="text-sm font-medium text-green-600">{company.change}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Full Leaderboard Table -->
	<div class="card">
		<h3 class="text-lg font-semibold text-secondary-900 mb-6">Complete Rankings</h3>
		
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-secondary-200">
				<thead class="bg-secondary-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
							Rank
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
							Company
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
							Credits
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
							Actions
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
							Badges
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
							Change
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-secondary-200">
					{#each companies as company}
						<tr class="hover:bg-secondary-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<span class="badge {getRankColor(company.rank)}">
										#{company.rank}
									</span>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
										<Users class="h-4 w-4 text-primary-600" />
									</div>
									<div class="text-sm font-medium text-secondary-900">
										{company.name}
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
								{company.credits.toLocaleString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
								{company.actions}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
								{company.badges}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<TrendingUp class="h-4 w-4 text-green-600 mr-1" />
									<span class="text-sm font-medium text-green-600">{company.change}</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
