<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import MarketList from '$lib/components/MarketList.svelte';
	import WelcomeModal from '$lib/components/WelcomeModal.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	let markets = $derived(data.markets);
	let isMenuOpen = $state(false);
	let showWelcome = $state(false);

	onMount(() => {
		showWelcome = true;
	});

	function closeWelcome() {
		showWelcome = false;
	}
</script>

<main class="h-screen w-screen relative">
	{#if showWelcome}
		<WelcomeModal onClose={closeWelcome} />
	{/if}

	<Map {markets} />

	<button
		onclick={() => (isMenuOpen = true)}
		class="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-pine text-snow pl-3 pr-4 py-2.5 rounded-full shadow-lg border border-gold/60 hover:bg-pine-dark transition"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-5 h-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
		<span class="font-display font-semibold">Markets</span>
	</button>

	{#if isMenuOpen}
		<MarketList {markets} onClose={() => (isMenuOpen = false)} />
	{/if}
</main>
