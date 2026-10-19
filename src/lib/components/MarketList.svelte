<script lang="ts">
  import { statusInfo, type MarketStatus } from "$lib/utils/marketStatus";
  import { selectedMarket } from "$lib/mapStore";
  import { isDark, toggleTheme } from "$lib/utils/theme";
  import { onMount, untrack } from "svelte";
  import GetYourGuideWidget from "$lib/components/GetYourGuideWidget.svelte";
  import { fade, fly } from "svelte/transition";
  import type { Market } from "$shared/types";

  type Filter = "all" | "open" | "upcoming" | "closed" | "unknown";

  let {
    markets,
    statusByMarket,
    earliestDates,
    planDate,
    nextDate,
    season,
    onSetDate,
    onClose,
    onShowWelcome,
    onShowAbout,
  } = $props<{
    markets: Market[];
    statusByMarket: Map<string, MarketStatus>;
    earliestDates: Map<string, Date>;
    planDate: string | null;
    nextDate: string | null;
    season: { start: string; end: string } | null;
    onSetDate: (date: string | null) => void;
    onClose: () => void;
    onShowWelcome: () => void;
    onShowAbout: () => void;
  }>();
  // Opening the drawer with a planned day lands on that day's open markets.
  let activeFilter = $state<Filter>(untrack(() => planDate) ? "open" : "all");

  const sortedMarkets = $derived(
    [...markets].sort((a, b) => {
      const dateA = earliestDates.get(a.name)?.getTime() ?? Infinity;
      const dateB = earliestDates.get(b.name)?.getTime() ?? Infinity;
      return dateA - dateB;
    }),
  );

  const filteredMarkets = $derived(
    sortedMarkets.filter((market) => {
      if (activeFilter === "all") return true;
      const status = statusByMarket.get(market.name) ?? "unknown";
      if (activeFilter === "upcoming") {
        return status === "upcoming" || status === "unknown";
      }
      return status === activeFilter;
    }),
  );

  // Parsed as UTC so the label never shifts a day in western time zones.
  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const planLabel = $derived(
    planDate ? dayLabel.format(new Date(`${planDate}T00:00:00Z`)) : null,
  );

  const filterOptions = $derived<{ id: Filter; label: string }[]>([
    { id: "all", label: "All" },
    { id: "open", label: planLabel ? `Open ${planLabel}` : "Open today" },
    { id: "upcoming", label: "Upcoming" },
  ]);

  function setDate(date: string | null) {
    activeFilter = date ? "open" : "all";
    onSetDate(date);
  }

  function getCount(id: Filter): number {
    if (id === "upcoming") {
      return counts.upcoming + counts.unknown;
    }
    return counts[id];
  }

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
          <h2 class="font-sans text-xl font-bold leading-tight text-white">
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
        class="font-display flex items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-surface px-3 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <span class="text-base">🎄</span>
        <span>Welcome</span>
      </button>
      <button
        onclick={() => close(onShowAbout)}
        class="font-display flex items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-surface px-3 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <span class="text-base">ℹ️</span>
        <span>About</span>
      </button>
    </div>
    <div class="mb-2 flex items-end justify-between px-1">
      <h3 class="font-display font-bold text-ink-brand">
        <label for="visit-date">Plan a visit</label>
      </h3>
    </div>
    <div class="rounded-xl border border-pine/20 bg-pine/5 p-3">
      <p class="mb-2 text-xs text-stone-600">
        Want to know what's open on a particular day? Pick a date and the map
        and list will show you.
      </p>
      <div class="flex items-center gap-2">
        <input
          id="visit-date"
          type="date"
          value={planDate ?? ""}
          min={season?.start}
          max={season?.end}
          onchange={(event) => setDate(event.currentTarget.value || null)}
          class="min-w-0 flex-1 rounded-lg border border-pine/30 bg-surface px-3 py-2.5 text-sm font-semibold shadow-xs transition focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 [&::-webkit-calendar-picker-indicator]:cursor-pointer {planDate
            ? 'text-ink-brand'
            : 'text-stone-400'}"
        />
        {#if planDate}
          <button
            onclick={() => setDate(null)}
            class="whitespace-nowrap rounded-lg px-2 py-2 text-xs font-semibold text-pine underline"
            >Clear</button
          >
        {/if}
      </div>
    </div>

    <section>
      <div class="mb-2 flex items-end justify-between px-1">
        <h3 class="font-display font-bold text-ink-brand">Markets</h3>
        <span class="text-xs font-semibold text-stone-500"
          >{filteredMarkets.length} shown</span
        >
      </div>
      <a
        href="https://forms.gle/eoZER8JEssuHaGtDA"
        target="_blank"
        rel="noopener noreferrer"
        class="mb-3 inline-block px-1 text-xs font-semibold text-ink-brand underline decoration-gold underline-offset-2 hover:text-ink-gold"
      >
        Know a market we're missing? Tell us about it
      </a>
      <div
        class="drag-guard mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin"
      >
        {#each filterOptions as filter (filter.id)}
          <button
            onclick={() => (activeFilter = filter.id)}
            aria-pressed={activeFilter === filter.id}
            class="font-display whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition {activeFilter ===
            filter.id
              ? 'border-pine bg-pine text-white'
              : 'border-stone-200 bg-surface text-stone-600 hover:border-gold hover:text-ink-brand'}"
          >
            {filter.label} <span class="opacity-70">{getCount(filter.id)}</span>
          </button>
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
            {#if planDate && activeFilter === "open"}
              <p>No markets are open on {planLabel}.</p>
              {#if nextDate}
                <button
                  onclick={() => setDate(nextDate)}
                  class="mt-3 rounded-full bg-pine px-4 py-2 text-xs font-semibold text-white"
                  >Jump to {dayLabel.format(
                    new Date(`${nextDate}T00:00:00Z`),
                  )}</button
                >
              {/if}
            {:else}
              No markets match this filter.
            {/if}
          </li>
        {/each}
      </ul>

      <div class="pt-3">
        <p
          class="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-stone-400"
        >
          Discover additional activities &middot; Partner
        </p>
        {#key $isDark}<GetYourGuideWidget />{/key}
      </div>
    </section>
  </div>
</div>
