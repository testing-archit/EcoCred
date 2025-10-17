<script lang="ts">
	import { page } from '$app/stores';
	import { Home, ArrowLeft } from 'lucide-svelte';
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
	<div class="max-w-md w-full text-center">
		<div class="mb-8">
			<h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
			<h2 class="text-2xl font-semibold text-secondary-900 mb-2">Page Not Found</h2>
			<p class="text-secondary-600 mb-8">
				The page you're looking for doesn't exist or has been moved.
			</p>
		</div>
		
		<div class="space-y-4">
			<a href="/" class="btn-primary inline-flex items-center">
				<Home class="h-4 w-4 mr-2" />
				Go Home
			</a>
			
			<button onclick={() => history.back()} class="btn-secondary inline-flex items-center">
				<ArrowLeft class="h-4 w-4 mr-2" />
				Go Back
			</button>
		</div>
	</div>
</div>

