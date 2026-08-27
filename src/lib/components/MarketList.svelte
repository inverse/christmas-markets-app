<script lang="ts">
	import { mapStore, selectedMarket } from '$lib/mapStore';
	import { fade, fly } from 'svelte/transition';
	let startX = 0;

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
	}

	function handleTouchEnd(e: TouchEvent) {
		const endX = e.changedTouches[0].clientX;
		if (startX - endX > 50) { // 50px swipe threshold
			onClose();
		}
	}
	let { markets, onClose } = $props<{ markets: any[], onClose: () => void }>();

	function jumpTo(market: any) {
		selectedMarket.set(market.name);
		onClose();
	}
</script>

<div class="fixed inset-0 z-[1000] bg-black/50" onclick={onClose} transition:fade></div>
<div class="fixed top-0 left-0 w-full md:w-80 h-full bg-white z-[1001] shadow-lg p-4 overflow-y-auto" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd} transition:fly={{ x: -320, duration: 300 }}>
	<div class="flex justify-between items-center mb-4 bg-[#14532d] p-4 rounded text-white border-b-4 border-[#d4af37]">
		<h2 class="text-xl font-bold">Christmas Markets</h2>
		<button onclick={onClose} class="text-2xl hover:text-[#d4af37]">&times;</button>
	</div>
	<ul class="space-y-2">
		{#each markets as market}
			<li>
				<button 
					onclick={() => jumpTo(market)}
					class="w-full text-left p-2 hover:bg-gray-100 rounded border-b"
				>
					<h3 class="font-bold text-sm">{market.name}</h3>
					<p class="text-xs text-gray-500">{market.address}</p>
				</button>
			</li>
		{/each}
	</ul>
</div>
