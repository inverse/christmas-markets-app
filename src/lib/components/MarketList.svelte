<script lang="ts">
	import { isMarketOpen, statusInfo } from '$lib/utils/marketStatus';
	import { mapStore, selectedMarket } from '$lib/mapStore';
	import { fade, fly } from 'svelte/transition';

	let { markets, onClose } = $props<{ markets: any[]; onClose: () => void }>();

	const sortedMarkets = $derived([...markets].sort((a, b) => {
		const statusA = isMarketOpen(a.dates).status;
		const statusB = isMarketOpen(b.dates).status;

		const order = { open: 0, closed: 1, unknown: 2 };
		return order[statusA] - order[statusB];
	}));

	let startX = 0;

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
	}

	function handleTouchEnd(e: TouchEvent) {
		const endX = e.changedTouches[0].clientX;
		if (startX - endX > 50) {
			// 50px swipe threshold
			onClose();
		}
	}

	function jumpTo(market: any) {
		selectedMarket.set(market.name);
		onClose();
	}
</script>

<div class="fixed inset-0 z-[1000] bg-black/60" onclick={onClose} transition:fade></div>
<div
	class="fixed top-0 left-0 z-[1001] w-full sm:w-96 h-full bg-cream shadow-2xl overflow-y-auto scrollbar-thin"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	transition:fly={{ x: -320, duration: 300 }}
>
	<header class="sticky top-0 z-10 bg-gradient-to-br from-pine to-pine-dark px-5 pb-4 pt-5 border-b-4 border-gold">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex items-center justify-center w-11 h-11 rounded-full bg-gold/20 border border-gold">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gold"><path d="M12 2L2 20h20L12 2z" /><path d="M12 5l-7 13h14L12 5z" /><path d="M12 8l-5 9h10L12 8z" /><rect x="10" y="20" width="4" height="4" /></svg>
				</div>
				<div>
					<h2 class="font-display text-xl font-bold leading-tight text-white">Christmas Markets</h2>
					<p class="text-xs text-gold mt-0.5">Berlin's festive highlights</p>
				</div>
			</div>
			<button
				onclick={onClose}
				aria-label="Close menu"
				class="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition"
			>
				&times;
			</button>
		</div>
	</header>

	<div class="p-4 space-y-4">
		<section class="rounded-xl bg-snow border border-stone-200 border-l-4 border-l-gold p-4">
			<h3 class="font-display font-bold mb-1 text-pine">About</h3>
			<p class="text-sm leading-relaxed text-stone-600">
				Explore Berlin's magical Christmas markets with our interactive map. Find your nearest market and enjoy the festive spirit!
			</p>
		</section>

		<section>
			<h3 class="font-display font-bold mb-2 text-pine px-1">Markets</h3>
			<ul class="space-y-2">
				{#each sortedMarkets as market}
					{@const meta = statusInfo(isMarketOpen(market.dates).status)}
					<li>
						<button
							onclick={() => jumpTo(market)}
							class="group w-full text-left bg-snow rounded-xl p-3 border border-stone-200 hover:border-gold hover:shadow-md transition flex gap-3"
						>
							<img
								src={market.image_url}
								alt=""
								loading="lazy"
								class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
							/>
							<div class="min-w-0 flex-1">
								<h4 class="font-display font-bold text-sm text-pine leading-snug group-hover:text-gold-dark transition">
									{market.name}
								</h4>
								<p class="text-xs text-stone-500 mt-0.5 truncate" title={market.address}>{market.address}</p>
								<div class="mt-1.5 flex items-center gap-2">
									<span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full {meta.pill}">
										<span class="w-1.5 h-1.5 rounded-full {meta.dot}"></span>
										{meta.label}
									</span>
									<span class="text-[11px] text-stone-400 truncate">{market.dates}</span>
								</div>
							</div>
							<span class="self-center text-stone-300 group-hover:text-gold transition-transform group-hover:translate-x-0.5">&rsaquo;</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>
