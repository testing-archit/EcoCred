<script lang="ts">
	import { TrendingUp, Leaf, Award, Users, Activity, Calendar } from 'lucide-svelte';
	import DashboardChart from '$lib/components/DashboardChart.svelte';
	import RecentActions from '$lib/components/RecentActions.svelte';
	
	// Mock data - replace with actual data from blockchain
	let stats = $state({
		totalCredits: 2450,
		totalActions: 28,
		badgesEarned: 3,
		ranking: 12
	});
	
	let weeklyData = $state([
		{ day: 'Mon', credits: 120 },
		{ day: 'Tue', credits: 200 },
		{ day: 'Wed', credits: 150 },
		{ day: 'Thu', credits: 300 },
		{ day: 'Fri', credits: 280 },
		{ day: 'Sat', credits: 190 },
		{ day: 'Sun', credits: 210 }
	]);
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-secondary-900 mb-2">Company Dashboard</h1>
		<p class="text-secondary-600">Track your sustainability efforts and carbon credit rewards</p>
	</div>
	
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
						<Leaf class="h-5 w-5 text-primary-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Total Credits</p>
					<p class="text-2xl font-bold text-secondary-900">{stats.totalCredits.toLocaleString()}</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
						<Activity class="h-5 w-5 text-blue-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Eco Actions</p>
					<p class="text-2xl font-bold text-secondary-900">{stats.totalActions}</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
						<Award class="h-5 w-5 text-yellow-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Badges Earned</p>
					<p class="text-2xl font-bold text-secondary-900">{stats.badgesEarned}</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
						<TrendingUp class="h-5 w-5 text-purple-600" />
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-secondary-600">Ranking</p>
					<p class="text-2xl font-bold text-secondary-900">#{stats.ranking}</p>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Charts and Recent Actions -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Credits Chart -->
		<div class="lg:col-span-2">
			<div class="card">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-secondary-900">Weekly Carbon Credits</h3>
					<div class="flex items-center text-sm text-secondary-600">
						<Calendar class="h-4 w-4 mr-1" />
						Last 7 days
					</div>
				</div>
				<DashboardChart data={weeklyData} />
			</div>
		</div>
		
		<!-- Recent Actions -->
		<div class="lg:col-span-1">
			<RecentActions />
		</div>
	</div>
	
	<!-- Quick Actions -->
	<div class="mt-8">
		<div class="card">
			<h3 class="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<a href="/actions" class="btn-primary text-center">
					<Leaf class="h-5 w-5 mr-2 inline" />
					Log Eco Action
				</a>
				<a href="/leaderboard" class="btn-secondary text-center">
					<Users class="h-5 w-5 mr-2 inline" />
					View Leaderboard
				</a>
				<a href="/badges" class="btn-secondary text-center">
					<Award class="h-5 w-5 mr-2 inline" />
					View Badges
				</a>
				<button class="btn-secondary">
					<TrendingUp class="h-5 w-5 mr-2 inline" />
					View Analytics
				</button>
			</div>
		</div>
	</div>
</div>
