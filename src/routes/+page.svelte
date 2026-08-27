<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import MarketList from '$lib/components/MarketList.svelte';
	
	let { data } = $props();
	let markets = $derived(data.markets);
	let isMenuOpen = $state(false);
</script>

<main class="h-screen w-screen relative">
	<Map {markets} />
	
	<button 
		onclick={() => isMenuOpen = true}
		class="absolute top-4 left-4 z-[500] bg-[#b31942] text-white p-3 rounded shadow-lg font-bold border-2 border-[#d4af37]"
	>
		☰ Menu
	</button>

	{#if isMenuOpen}
		<MarketList {markets} onClose={() => isMenuOpen = false} />
	{/if}
</main>
