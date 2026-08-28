<script lang="ts">
	import { fade } from 'svelte/transition';

	let { onClose, daysUntilFirstMarket } = $props<{ 
		onClose: () => void;
		daysUntilFirstMarket?: number;
	}>();

</script>

<div class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70" transition:fade>
	<div class="bg-snow rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-gold relative">

		<h2 class="font-display text-2xl font-bold text-pine mb-4">Welcome!</h2>
		<p class="text-stone-700 mb-6">
			Discover the magic of Berlin's Christmas markets. Explore the map to find your nearest festive spot.
		</p>
		
		{#if daysUntilFirstMarket !== undefined}
			<div class="bg-pine text-white p-4 rounded-xl text-center mb-6">
				<div class="text-3xl font-bold font-display">{daysUntilFirstMarket}</div>
				<div class="text-sm font-semibold uppercase tracking-wider text-gold">Days until the first market</div>
			</div>
		{/if}

		<button
			onclick={onClose}
			class="w-full bg-gold text-pine font-bold py-3 rounded-lg hover:bg-gold-dark transition"
		>
			Explore Markets
		</button>
	</div>
</div>
