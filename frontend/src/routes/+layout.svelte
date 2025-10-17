<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>GreenLedger - Decentralized Carbon Credit Rewards</title>
	<meta name="description" content="Blockchain-powered platform for transparent, verifiable carbon credit rewards" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
	<Navigation />
	<main>
		{@render children?.()}
	</main>
</div>
