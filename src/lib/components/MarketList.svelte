<script lang="ts">
  import { statusInfo, type MarketStatus } from "$lib/utils/marketStatus";
  import { selectedMarket } from "$lib/mapStore";
  import { isDark, toggleTheme } from "$lib/utils/theme";
  import { onMount } from "svelte";
  import GetYourGuideWidget from "$lib/components/GetYourGuideWidget.svelte";
  import { fade, fly } from "svelte/transition";
  import type { Market } from "$shared/types";

  type Filter = "all" | "open" | "upcoming" | "closed" | "unknown";

  let {
    markets,
    statusByMarket,
    earliestDates,
    onClose,
    onShowWelcome,
    onShowAbout,
  } = $props<{
    markets: Market[];
    statusByMarket: Map<string, MarketStatus>;
    earliestDates: Map<string, Date>;
    onClose: () => void;
    onShowWelcome: () => void;
    onShowAbout: () => void;
  }>();
  let activeFilter = $state<Filter>("all");

  const sortedMarkets = $derived(
    [...markets].sort((a, b) => {
      const dateA = earliestDates.get(a.name)?.getTime() ?? Infinity;
      const dateB = earliestDates.get(b.name)?.getTime() ?? Infinity;
      return dateA - dateB;
    }),
  );

  const filteredMarkets = $derived(
    sortedMarkets.filter(
      (market) =>
        activeFilter === "all" ||
        statusByMarket.get(market.name) === activeFilter,
    ),
  );

  const filterOptions: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open now" },
    { id: "upcoming", label: "Upcoming" },
    { id: "unknown", label: "Dates TBA" },
  ];

  const counts = $derived.by(() => {
    const counts: Record<Filter, number> = {
      all: markets.length,
      open: 0,
      upcoming: 0,
      closed: 0,
      unknown: 0,
    };
    for (const market of markets) {
      const status: MarketStatus = statusByMarket.get(market.name) ?? "unknown";
      counts[status]++;
    }
    return counts;
  });

  function jumpTo(market: Market) {
    close(() => selectedMarket.set(market.name));
  }

  // Drag-to-close: the drawer follows the finger horizontally; past a
  // threshold (or a fast leftward flick) it glides out, otherwise it springs
  // back. Vertical drags are left to native scrolling and the filter row is
  // exempt so it can still be scrolled horizontally.
  let panelEl = $state<HTMLElement | undefined>();
  let isDragging = $state(false);
  let offsetPct = $state(0);
  let isClosing = $state(false);
  let backdropOpacity = $derived(1 + offsetPct / 100);

  const SNAP_THRESHOLD_PCT = 25;
  const FLING_VELOCITY = 0.35; // px per ms

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let axis: "x" | "y" | null = null;
  let velocity = 0;
  let panelWidth = 0;

  function close(after?: () => void) {
    if (isClosing) return;
    isClosing = true;
    isDragging = false;
    offsetPct = -100;
    setTimeout(() => {
      after?.();
      onClose();
    }, 280);
  }

  function snapBack() {
    isDragging = false;
    offsetPct = 0;
  }

  function onTouchStart(e: TouchEvent) {
    if (isClosing || e.touches.length !== 1) return;
    if ((e.target as HTMLElement).closest(".drag-guard")) return;
    const t = e.touches[0];
    startX = lastX = t.clientX;
    startY = t.clientY;
    axis = null;
    velocity = 0;
    lastT = performance.now();
    panelWidth = panelEl?.getBoundingClientRect().width ?? 1;
    isDragging = true;
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging || axis === "y") return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const now = performance.now();
    if (axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis === "y") {
        isDragging = false; // let the panel scroll natively
        return;
      }
    }
    e.preventDefault();
    velocity = (t.clientX - lastX) / Math.max(1, now - lastT);
    lastX = t.clientX;
    lastT = now;
    offsetPct = Math.max(-100, Math.min(0, (dx / panelWidth) * 100));
  }

  function onTouchEnd() {
    if (!isDragging || axis !== "x") return;
    isDragging = false;
    const flung = offsetPct < -8 && velocity < -FLING_VELOCITY;
    if (offsetPct < -SNAP_THRESHOLD_PCT || flung) close();
    else snapBack();
  }

  function onTouchCancel() {
    isDragging = false;
    snapBack();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  onMount(() => {
    const el = panelEl;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    window.addEventListener("keydown", onKeydown);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("keydown", onKeydown);
    };
  });
</script>

<button
  class="fixed inset-0 z-[1000] bg-pine-dark/60"
  aria-label="Close menu"
  style="opacity: {backdropOpacity}"
  onclick={() => close()}
  transition:fade
></button>
<div
  bind:this={panelEl}
  role="dialog"
  tabindex="-1"
  aria-label="Christmas markets"
  class="festive-surface safe-area-bottom fixed top-0 left-0 z-[1001] h-full w-full overflow-y-auto overscroll-y-contain shadow-2xl sm:w-96 scrollbar-thin"
  style="padding-top: env(safe-area-inset-top); transform: translate3d({offsetPct}%, 0, 0); transition: {isDragging
    ? 'none'
    : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)'}; will-change: {isDragging
    ? 'transform'
    : 'auto'}"
  in:fly={{ x: -320, duration: 300 }}
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
      <div class="flex items-center gap-1.5">
        <button
          onclick={toggleTheme}
          aria-pressed={$isDark}
          aria-label="Dark mode"
          title="Toggle dark mode"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <i
            class="fa-solid {$isDark ? 'fa-sun' : 'fa-moon'}"
            aria-hidden="true"
          ></i>
        </button>
        <button
          onclick={() => close()}
          aria-label="Close menu"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
        >
          &times;
        </button>
      </div>
    </div>
  </header>

  <div class="space-y-4 p-4">
    <div class="grid grid-cols-2 gap-2">
      <button
        onclick={() => close(onShowWelcome)}
        class="flex items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-surface px-3 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <span class="text-base">🎄</span>
        <span>Welcome</span>
      </button>
      <button
        onclick={() => close(onShowAbout)}
        class="flex items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-surface px-3 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <span class="text-base">ℹ️</span>
        <span>About</span>
      </button>
    </div>

    <section>
      <div class="mb-2 flex items-end justify-between px-1">
        <h3 class="font-display font-bold text-ink-brand">Markets</h3>
        <span class="text-xs font-semibold text-ink-berry"
          >{filteredMarkets.length} shown</span
        >
      </div>
      <div
        class="drag-guard mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin"
      >
        {#each filterOptions as filter (filter.id)}
          {#if filter.id !== "unknown" || counts[filter.id] > 0}
            <button
              onclick={() => (activeFilter = filter.id)}
              aria-pressed={activeFilter === filter.id}
              class="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition {activeFilter ===
              filter.id
                ? 'border-pine bg-pine text-white'
                : 'border-stone-200 bg-surface text-stone-600 hover:border-gold hover:text-ink-brand'}"
            >
              {filter.label} <span class="opacity-70">{counts[filter.id]}</span>
            </button>
          {/if}
        {/each}
      </div>
      <ul class="space-y-2">
        {#each filteredMarkets as market (market.name)}
          {@const meta = statusInfo(
            statusByMarket.get(market.name) ?? "unknown",
          )}
          <li>
            <button
              onclick={() => jumpTo(market)}
              class="group flex w-full gap-3 rounded-xl border border-stone-200 border-l-4 bg-surface p-3 text-left transition hover:border-gold hover:shadow-md"
            >
              <img
                src={market.image_url}
                alt=""
                loading="lazy"
                class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <h4
                  class="font-display text-sm font-bold leading-snug text-ink-brand transition group-hover:text-ink-gold"
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

      <div class="pt-3">
        <p
          class="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-stone-400"
        >
          Discover additional activities
        </p>
        {#key $isDark}<GetYourGuideWidget />{/key}
      </div>
    </section>
  </div>
</div>
