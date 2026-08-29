<script lang="ts">
  import {
    isMarketOpen,
    statusInfo,
    getEarliestDate,
  } from "$lib/utils/marketStatus";
  import { selectedMarket } from "$lib/mapStore";
  import { fade, fly } from "svelte/transition";
  import type { Market } from "$lib/types";

  type Filter = "all" | "open" | "upcoming" | "closed" | "unknown";

  let { markets, onClose, onShowWelcome, now } = $props<{
    markets: Market[];
    onClose: () => void;
    onShowWelcome: () => void;
    now: Date;
  }>();
  let activeFilter = $state<Filter>("all");

  const sortedMarkets = $derived(
    [...markets].sort((a, b) => {
      const dateA = getEarliestDate(a.dates);
      const dateB = getEarliestDate(b.dates);
      return dateA.getTime() - dateB.getTime();
    }),
  );

  $effect(() => {
    console.log(
      "Markets sorted:",
      sortedMarkets.map((m) => m.name),
    );
  });

  const filteredMarkets = $derived(
    sortedMarkets.filter(
      (market) =>
        activeFilter === "all" ||
        isMarketOpen(market.dates, now).status === activeFilter,
    ),
  );

  const filterOptions: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open now" },
    { id: "upcoming", label: "Upcoming" },
    { id: "unknown", label: "Dates TBA" },
  ];

  const counts = $derived(() => {
    const counts: Record<Filter, number> = {
      all: markets.length,
      open: 0,
      upcoming: 0,
      closed: 0,
      unknown: 0,
    };
    for (const market of markets) {
      const status = isMarketOpen(market.dates, now).status;
      if (status in counts) counts[status]++;
    }
    return counts;
  });

  function jumpTo(market: Market) {
    selectedMarket.set(market.name);
    onClose();
  }

  let startX = 0;

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) onClose();
  }
</script>

<button
  class="fixed inset-0 z-[1000] bg-pine-dark/60"
  aria-label="Close menu"
  onclick={onClose}
  transition:fade
></button>
<div
  role="dialog"
  tabindex="-1"
  aria-label="Christmas markets"
  class="festive-surface safe-area-bottom fixed top-0 left-0 z-[1001] h-full w-full overflow-y-auto shadow-2xl sm:w-96 scrollbar-thin"
  style="padding-top: env(safe-area-inset-top);"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  transition:fly={{ x: -320, duration: 300 }}
>
  <header
    class="relative sticky top-0 z-10 overflow-hidden border-b-4 border-gold bg-gradient-to-br from-pine to-pine-dark px-5 pb-4 pt-5"
  >
    <img
      src="/icons/christmas-tree-raw.svg"
      alt=""
      class="pointer-events-none absolute -right-3 top-1 h-16 w-20 rotate-12 opacity-20"
      aria-hidden="true"
    />
    <div class="relative flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-gold/20"
        >
          <img
            src="/icons/christmas-tree-raw.svg"
            alt=""
            class="h-6 w-6 object-contain"
          />
        </div>
        <div>
          <h2 class="font-display text-xl font-bold leading-tight text-white">
            Christmas Markets
          </h2>
          <p class="mt-0.5 text-xs text-gold">
            {markets.length} festive highlights in Berlin
          </p>
        </div>
      </div>
      <button
        onclick={onClose}
        aria-label="Close menu"
        class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
      >
        &times;
      </button>
    </div>
  </header>

  <div class="space-y-4 p-4">
    <section
      class="rounded-xl border border-stone-200 border-l-4 border-l-berry bg-snow p-4"
    >
      <h3 class="mb-1 font-display font-bold text-pine">About</h3>
      <p class="text-sm leading-relaxed text-stone-600">
        Explore Berlin's magical Christmas markets with our interactive map.
        Find your nearest market and enjoy the festive spirit!
      </p>
    </section>
    <button
      onclick={onShowWelcome}
      class="flex w-full items-center justify-center gap-2 rounded-lg border border-pine bg-snow px-4 py-2 text-sm font-semibold text-pine transition hover:bg-pine hover:text-white"
    >
      <span class="text-lg">🎄</span>
      <span>Welcome Guide</span>
    </button>

    <section>
      <div class="mb-2 flex items-end justify-between px-1">
        <h3 class="font-display font-bold text-pine">Markets</h3>
        <span class="text-xs font-semibold text-berry"
          >{filteredMarkets.length} shown</span
        >
      </div>
      <div class="mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
        {#each filterOptions as filter (filter.id)}
          <button
            onclick={() => (activeFilter = filter.id)}
            aria-pressed={activeFilter === filter.id}
            class="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition {activeFilter ===
            filter.id
              ? 'border-pine bg-pine text-white'
              : 'border-stone-200 bg-snow text-stone-600 hover:border-gold hover:text-pine'}"
          >
            {filter.label} <span class="opacity-70">{counts()[filter.id]}</span>
          </button>
        {/each}
      </div>
      <ul class="space-y-2">
        {#each filteredMarkets as market (market.name)}
          {@const meta = statusInfo(isMarketOpen(market.dates, now).status)}
          <li>
            <button
              onclick={() => jumpTo(market)}
              class="group flex w-full gap-3 rounded-xl border border-stone-200 border-l-4 bg-snow p-3 text-left transition hover:border-gold hover:shadow-md"
            >
              <img
                src={market.image_url}
                alt=""
                loading="lazy"
                class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <h4
                  class="font-display text-sm font-bold leading-snug text-pine transition group-hover:text-gold-dark"
                >
                  {market.name}
                </h4>
                <p
                  class="mt-0.5 truncate text-xs text-stone-500"
                  title={market.address}
                >
                  {market.address}
                </p>
                <div class="mt-1.5 flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold {meta.bg} {meta.color} border {meta.border}"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full {meta.color.replace(
                        'text',
                        'bg',
                      )}"
                    ></span>
                    {meta.label}
                  </span>
                  <span class="truncate text-[11px] text-stone-400">
                    {market.dates.raw}
                  </span>
                </div>
              </div>
              <span
                class="self-center text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gold"
              >
                &rsaquo;
              </span>
            </button>
          </li>
        {:else}
          <li
            class="rounded-xl border border-dashed border-stone-300 p-5 text-center text-sm text-stone-500"
          >
            No markets match this filter.
          </li>
        {/each}
      </ul>
    </section>
  </div>
</div>
