<script lang="ts">
  import { statusInfo, type MarketStatus } from "#lib/utils/marketStatus";
  import { selectedMarket, userPosition } from "#lib/mapStore";
  import {
    formatDistance,
    haversineDistance,
    locationErrorMessage,
  } from "#lib/utils/findMe";
  import { isDark, toggleTheme } from "#lib/utils/theme";
  import { onMount } from "svelte";
  import AttractionStrip from "#lib/components/AttractionStrip.svelte";
  import { containFocus } from "#lib/actions/containFocus";
  import { fade, fly } from "svelte/transition";
  import type { Locale, Market } from "#shared/types";
  import { resolve } from "$app/paths";
  import { interpolate, messages } from "#lib/i18n/messages";

  type Filter = "all" | "open" | "upcoming" | "closed" | "unknown";

  let {
    markets,
    locale,
    statusByMarket,
    earliestDates,
    planDate,
    nextDate,
    season,
    onSetDate,
    onClose,
    onShowWelcome,
    onShowAbout,
  }: {
    markets: Market[];
    locale: Locale;
    statusByMarket: Map<string, MarketStatus>;
    earliestDates: Map<string, Date>;
    planDate: string | null;
    nextDate: string | null;
    season: { start: string; end: string } | null;
    onSetDate: (date: string | null) => void;
    onClose: () => void;
    onShowWelcome: () => void;
    onShowAbout: () => void;
  } = $props();
  let searchQuery = $state("");
  let sortMode = $state<"date" | "distance">("date");
  let isLocating = $state(false);
  let sortError = $state<string | null>(null);

  function distanceTo(market: Market): number {
    const pos = $userPosition;
    return pos ? haversineDistance(pos, market.coordinates) : Infinity;
  }

  // Default view is markets open today; a planned day also lands on open.
  let activeFilter = $state<Filter>("open");

  const sortedMarkets = $derived.by(() => {
    const list = [...markets];
    if (sortMode === "distance" && $userPosition) {
      return list.sort((a, b) => distanceTo(a) - distanceTo(b));
    }
    return list.sort((a, b) => {
      const dateA = earliestDates.get(a.id)?.getTime() ?? Infinity;
      const dateB = earliestDates.get(b.id)?.getTime() ?? Infinity;
      return dateA - dateB;
    });
  });

  const filteredMarkets = $derived(
    sortedMarkets.filter((market) => {
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const haystack = `${market.name} ${market.address}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (activeFilter === "all") return true;
      const status = statusByMarket.get(market.id) ?? "unknown";
      if (activeFilter === "upcoming") {
        return status === "upcoming" || status === "unknown";
      }
      return status === activeFilter;
    }),
  );

  // "Nearest" needs a position: reuse the browser fix when none is cached.
  function onSortChange(event: Event) {
    const mode = (event.currentTarget as HTMLSelectElement)
      .value as typeof sortMode;
    sortError = null;
    if (mode === "distance" && !$userPosition) {
      requestLocation();
      return;
    }
    sortMode = mode;
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      sortMode = "date";
      sortError = locationErrorMessage(0, "", locale);
      return;
    }
    isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isLocating = false;
        userPosition.set({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        sortMode = "distance";
      },
      (error) => {
        isLocating = false;
        sortMode = "date";
        sortError = locationErrorMessage(error.code, error.message, locale);
      },
    );
  }
  // Parsed as UTC so the label never shifts a day in western time zones.
  const dayLabel = $derived(
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
  );
  const dict = $derived(messages(locale));

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const planLabel = $derived(
    planDate ? dayLabel.format(new Date(`${planDate}T00:00:00Z`)) : null,
  );

  const filterOptions = $derived<{ id: Filter; label: string }[]>([
    {
      id: "open",
      label: planLabel
        ? interpolate(dict.filterOpenOn, { date: planLabel })
        : dict.filterOpenToday,
    },
    { id: "upcoming", label: dict.filterUpcoming },
    { id: "all", label: dict.filterAll },
  ]);

  function setDate(date: string | null) {
    activeFilter = "open";
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
      const status: MarketStatus = statusByMarket.get(market.id) ?? "unknown";
      counts[status]++;
    }
    return counts;
  });

  function jumpTo(market: Market) {
    close(() => selectedMarket.set(market.id));
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

  // Keeps ?date and the #menu hash on the switched page.
  function preserveLocaleState(event: MouseEvent) {
    const link = event.currentTarget as HTMLAnchorElement;
    link.href = link.pathname + window.location.search + window.location.hash;
  }
</script>

<button
  class="fixed inset-0 z-[1000] bg-pine-dark/60"
  aria-label={dict.closeMenu}
  style="opacity: {backdropOpacity}"
  onclick={() => close()}
  transition:fade={{ duration: reduceMotion ? 0 : 200 }}
></button>
<div
  use:containFocus
  bind:this={panelEl}
  role="dialog"
  tabindex="-1"
  aria-labelledby="menu-title"
  class="festive-surface safe-area-bottom fixed top-0 left-0 z-[1001] h-full w-full overflow-y-auto overscroll-y-contain shadow-2xl sm:w-96 scrollbar-thin"
  style="padding-top: env(safe-area-inset-top); transform: translate3d({offsetPct}%, 0, 0); transition: {isDragging
    ? 'none'
    : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)'}; will-change: {isDragging
    ? 'transform'
    : 'auto'}"
  in:fly={reduceMotion ? { duration: 0 } : { x: -320, duration: 300 }}
>
  <header
    class="fairy-lights-header relative sticky top-0 z-10 overflow-visible border-b-4 border-gold bg-gradient-to-br from-pine to-pine-dark px-5 pb-4 pt-5"
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
          <h2
            id="menu-title"
            class="font-sans text-xl font-bold leading-tight text-white"
          >
            {dict.menuTitle}
          </h2>
          <p class="mt-0.5 text-xs text-gold">
            {interpolate(dict.menuSubtitle, { count: String(markets.length) })}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          onclick={() => close()}
          aria-label={dict.closeMenu}
          class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <div class="space-y-4 p-4">
    <div class="flex gap-2">
      <button
        onclick={() => close(onShowWelcome)}
        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-surface px-2 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <i class="fa-solid fa-snowflake" aria-hidden="true"></i>
        <span>{dict.welcome}</span>
      </button>
      <button
        onclick={() => close(onShowAbout)}
        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-surface px-2 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        <span>{dict.about}</span>
      </button>
      <a
        href={resolve("/[[lang=locale]]", {
          lang: locale === "de" ? undefined : "de",
        })}
        onclick={preserveLocaleState}
        lang={locale === "de" ? "en" : "de"}
        hreflang={locale === "de" ? "en" : "de"}
        aria-label={locale === "de"
          ? "Switch to English"
          : "Auf Deutsch wechseln"}
        class="flex w-10 flex-shrink-0 items-center justify-center rounded-lg border border-pine/30 bg-surface px-2 py-2.5 text-xs font-semibold text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        {locale === "de" ? "EN" : "DE"}
      </a>
      <button
        onclick={toggleTheme}
        aria-pressed={$isDark}
        aria-label={dict.toggleDarkMode}
        title={dict.toggleDarkMode}
        class="flex w-10 flex-shrink-0 items-center justify-center rounded-lg border border-pine/30 bg-surface text-ink-brand shadow-xs transition hover:bg-pine hover:text-white"
      >
        <i class="fa-solid {$isDark ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"
        ></i>
      </button>
    </div>
    <div class="mb-2 flex items-end justify-between px-1">
      <h3 class="font-sans text-lg font-bold tracking-tight text-ink-brand">
        <label for="visit-date">{dict.planAVisit}</label>
      </h3>
    </div>
    <div class="rounded-xl border border-pine/20 bg-pine/5 p-3">
      <p class="mb-2 text-xs text-stone-600">{dict.planAVisitHint}</p>
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
          >
            {dict.clearDate}
          </button>
        {/if}
      </div>
    </div>
    <AttractionStrip {locale} />

    <section>
      <div class="mb-2 flex items-end justify-between px-1">
        <h3 class="font-sans text-lg font-bold tracking-tight text-ink-brand">
          {dict.marketsHeading}
        </h3>
        <span class="text-xs font-semibold text-stone-500">
          {interpolate(dict.shownCount, {
            count: String(filteredMarkets.length),
          })}
        </span>
      </div>
      <div class="mb-3 flex items-center gap-2">
        <div class="relative min-w-0 flex-1">
          <input
            type="search"
            bind:value={searchQuery}
            aria-label={dict.searchMarkets}
            placeholder={dict.searchMarkets}
            class="w-full rounded-lg border border-stone-200 bg-surface py-2 pl-8 pr-8 text-sm shadow-xs transition placeholder:text-stone-400 focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          />
          <i
            class="fa-solid fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400"
            aria-hidden="true"
          ></i>
          {#if searchQuery}
            <button
              onclick={() => (searchQuery = "")}
              aria-label={dict.clearSearch}
              class="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          {/if}
        </div>
        <select
          value={sortMode}
          onchange={onSortChange}
          disabled={isLocating}
          aria-label={dict.sortMarkets}
          class="rounded-lg border border-stone-200 bg-surface px-2 py-2 text-sm font-semibold text-stone-700 shadow-xs transition focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-60"
        >
          <option value="date">{dict.sortByDate}</option>
          <option value="distance">{dict.sortByDistance}</option>
        </select>
      </div>
      {#if sortError}
        <p class="mb-3 px-1 text-xs text-ink-berry" role="alert">{sortError}</p>
      {/if}
      <a
        href="https://forms.gle/eoZER8JEssuHaGtDA"
        target="_blank"
        rel="noopener noreferrer"
        class="mb-3 inline-block px-1 text-xs font-semibold text-ink-brand underline decoration-gold underline-offset-2 hover:text-ink-gold"
      >
        {dict.suggestMarket}
      </a>
      <div
        class="drag-guard mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin"
      >
        {#each filterOptions as filter (filter.id)}
          <button
            onclick={() => (activeFilter = filter.id)}
            aria-pressed={activeFilter === filter.id}
            class="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition {activeFilter ===
            filter.id
              ? 'border-pine bg-pine text-white'
              : 'border-stone-200 bg-surface text-stone-700 hover:border-gold hover:text-ink-brand'}"
          >
            {filter.label} <span class="opacity-70">{getCount(filter.id)}</span>
          </button>
        {/each}
      </div>
      <ul class="space-y-2">
        {#each filteredMarkets as market (market.id)}
          {@const status = statusByMarket.get(market.id) ?? "unknown"}
          {@const meta = statusInfo(status)}
          {@const isClosed = status === "closed"}
          <li>
            <button
              onclick={() => jumpTo(market)}
              class="group flex w-full gap-3 rounded-xl border border-stone-200 bg-surface py-3 pr-3 pl-0 text-left transition hover:border-gold/70 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              <span
                class="w-1 flex-shrink-0 self-stretch rounded-full {meta.bar}"
                aria-hidden="true"
              ></span>
              <img
                src={market.image_url}
                alt=""
                loading="lazy"
                class="h-16 w-16 flex-shrink-0 rounded-lg object-cover transition-opacity {isClosed
                  ? 'opacity-60 group-hover:opacity-100'
                  : ''}"
              />
              <div class="min-w-0 flex-1">
                <h4
                  class="font-sans text-sm font-semibold leading-snug {isClosed
                    ? 'text-stone-500'
                    : 'text-stone-800'}"
                >
                  {market.name}
                </h4>
                <p
                  class="mt-1 truncate text-xs text-stone-600"
                  title={market.address}
                >
                  {market.address}
                </p>
                <div class="mt-1.5 flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold {meta.bg} {meta.color} border {meta.border}"
                  >
                    <span class="h-1.5 w-1.5 rounded-full {meta.dot}"></span>
                    {dict.status[status]}
                  </span>
                  {#if $userPosition}
                    <span
                      class="whitespace-nowrap text-[11px] font-semibold text-stone-500"
                    >
                      {formatDistance(distanceTo(market))}
                    </span>
                  {/if}
                  <span
                    class="market-date min-w-0 flex-1 truncate text-[11px] text-stone-400"
                    title={market.dates.raw || dict.checkSite}
                  >
                    {market.dates.raw || dict.checkSite}
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
              <p>
                {interpolate(dict.noMarketsOpenOn, { date: planLabel ?? "" })}
              </p>
              {#if nextDate}
                <button
                  onclick={() => setDate(nextDate)}
                  class="mt-3 rounded-full bg-pine px-4 py-2 text-xs font-semibold text-white"
                >
                  {interpolate(dict.jumpToDate, {
                    date: dayLabel.format(new Date(`${nextDate}T00:00:00Z`)),
                  })}
                </button>
              {/if}
            {:else}
              {dict.noMarketsMatch}
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  </div>
</div>
