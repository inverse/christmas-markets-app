<script lang="ts">
  import { page } from "$app/state";
  import Map from "$lib/components/Map.svelte";
  import MarketList from "$lib/components/MarketList.svelte";
  import WelcomeModal from "$lib/components/WelcomeModal.svelte";
  import AboutModal from "$lib/components/AboutModal.svelte";
  import InstallPrompt from "$lib/components/InstallPrompt.svelte";
  import { onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import {
    menuOpen,
    openMenu,
    closeMenu,
    aboutOpen,
    welcomeOpen,
    openAbout,
    closeAbout,
    openWelcome,
    closeWelcome,
  } from "$lib/mapStore";
  import { initMarkets } from "$lib/mapStore";
  import { simulatedDate } from "$lib/utils/date";
  import {
    getEarliestDate,
    isMarketOpenOnDate,
    isValidIsoDate,
    nextMarketDate,
    seasonRange,
    toIsoDate,
    type MarketStatus,
  } from "$lib/utils/marketStatus";
  import { messages } from "$lib/i18n/messages";
  import type { Market } from "$shared/types";
  import type { Dates } from "$shared/dateParser";

  let { data } = $props();
  let markets = $derived(data.markets);
  $effect(() => initMarkets(data.markets));
  let now = $derived($simulatedDate || new Date());
  let today = $derived(toIsoDate(now));

  // Optional ?date=YYYY-MM-DD; absent or invalid means "today" (normal view).
  function dateFromSearch(search: string): string | null {
    const date = new URLSearchParams(search).get("date");
    return date && isValidIsoDate(date) ? date : null;
  }
  let planDate = $state<string | null>(dateFromSearch(page.url.search));
  let statusDay = $derived(planDate ?? today);

  function statusesOn(day: string) {
    const statuses = new SvelteMap<string, MarketStatus>();
    for (const market of markets) {
      statuses.set(market.id, isMarketOpenOnDate(market.dates, day).status);
    }
    return statuses;
  }

  const statusByMarket = $derived(statusesOn(statusDay));
  // The welcome modal describes the real present, never the planned day.
  const todayStatuses = $derived(
    planDate ? [...statusesOn(today).values()] : [...statusByMarket.values()],
  );

  const earliestDates = $derived.by(() => {
    const dates = new SvelteMap<string, Date>();
    for (const market of markets) {
      dates.set(market.id, getEarliestDate(market.dates));
    }
    return dates;
  });

  const season = $derived(seasonRange(markets));
  const nextDate = $derived(
    planDate ? nextMarketDate(markets, planDate) : null,
  );

  // Writes the plan date into the current history entry, keeping its hash and
  // history.state (SvelteKit's replaceState would drop the #menu view marker).
  function syncUrl() {
    const query = planDate ? `?date=${planDate}` : "";
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query}${window.location.hash}`,
    );
  }

  function selectDate(date: string | null) {
    planDate = date;
    syncUrl();
  }

  // Adopts the date already in the entry we landed on; the URL is the source
  // of truth, so no history write happens here.
  function restoreDateFromUrl() {
    planDate = dateFromSearch(window.location.search);
  }

  const anyMarketOpen = $derived(todayStatuses.some((s) => s === "open"));
  const allMarketsClosed = $derived(
    todayStatuses.every((s) => s === "closed" || s === "unknown"),
  );

  const daysUntilFirst = $derived.by(() => {
    let earliest = Infinity;
    for (const market of markets) {
      const dates = market.dates;
      if (!dates) continue;
      if (dates.type === "range" && dates.start_date) {
        const t = new Date(dates.start_date).getTime();
        if (t >= now.getTime() && t < earliest) earliest = t;
      } else if (dates.type === "dates" && Array.isArray(dates.dates)) {
        for (const d of dates.dates) {
          const t = new Date(d).getTime();
          if (t >= now.getTime() && t < earliest) earliest = t;
        }
      }
    }
    if (earliest === Infinity) return undefined;
    const diffTime = earliest - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : undefined;
  });

  onMount(() => {
    const hasSeen = localStorage.getItem("hasSeenWelcome");
    if (hasSeen) return;
    localStorage.setItem("hasSeenWelcome", "true");
    // A shared market link is more relevant than the intro, so don't stomp it.
    if (window.location.hash === "") openWelcome();
  });

  // One Event node per market date so rich results can show each market's
  // real opening days. Ranges expand to days, capped so huge ranges stay sane.
  const MAX_RANGE_DAYS = 62;
  function marketDates(dates: Dates | undefined): string[] {
    if (!dates) return [];
    if (dates.type === "dates") return dates.dates;
    if (!dates.start_date || !dates.end_date) return [];
    const start = new Date(`${dates.start_date}T00:00:00Z`).getTime();
    const end = new Date(`${dates.end_date}T00:00:00Z`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return dates.start_date ? [dates.start_date] : [];
    }
    const days = Math.round((end - start) / 86_400_000) + 1;
    if (days > MAX_RANGE_DAYS) {
      // ponytail: emit only the endpoints for very long ranges; add full
      // expansion if a market ever legitimately runs >62 days.
      return [dates.start_date, dates.end_date];
    }
    return Array.from({ length: days }, (_, i) =>
      new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    );
  }

  function marketEventNode(
    market: Market,
    date: string,
    origin: string,
    localePath: string,
  ) {
    const admission = market.admission?.trim().toLowerCase();
    return {
      "@type": "Event",
      name: market.name,
      description: market.description,
      image: market.image_url,
      url: `${origin}${localePath === "/" ? "" : localePath}/#market=${encodeURIComponent(market.id)}`,
      startDate: date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: market.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: market.address,
          addressLocality: "Berlin",
          addressCountry: "DE",
        },
      },
      ...(admission === "free"
        ? {
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    };
  }

  const jsonLd = $derived.by(() => {
    const dict = messages(data.locale);
    const origin = data.origin;
    const localePath = data.localePath;
    const itemListElement = markets.flatMap((market, i) =>
      marketDates(market.dates).map((date) => ({
        "@type": "ListItem",
        position: i + 1,
        item: marketEventNode(market, date, origin, localePath),
      })),
    );
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: dict.title,
      description: dict.description,
      url: `${origin}${localePath}`,
      inLanguage: data.locale === "de" ? "de-DE" : "en-GB",
      mainEntity: {
        "@type": "ItemList",
        name: dict.menuTitle,
        numberOfItems: markets.length,
        itemListElement,
      },
    };
  });
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</` +
    `script>`}
</svelte:head>

<!-- Back/forward lands on an entry whose ?date may differ from memory; adopt it. -->
<svelte:window onpopstate={restoreDateFromUrl} />
<main class="h-screen w-screen relative">
  {#if $welcomeOpen}
    <WelcomeModal
      locale={data.locale}
      daysUntilFirstMarket={daysUntilFirst}
      marketCount={markets.length}
      {anyMarketOpen}
      {allMarketsClosed}
      onClose={closeWelcome}
    />
  {/if}

  {#if $aboutOpen}
    <AboutModal onClose={closeAbout} locale={data.locale} />
  {/if}

  <Map {markets} {statusByMarket} locale={data.locale} />

  <button
    onclick={openMenu}
    aria-expanded={$menuOpen}
    class="font-sans site-menu-button absolute top-4 left-4 z-[500] flex items-center gap-2 bg-pine text-snow pl-3 pr-4 py-2.5 rounded-full shadow-lg border border-gold/60 hover:bg-pine-dark transition"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      class="w-5 h-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg
    >
    <span class="font-sans font-semibold">{messages(data.locale).menu}</span>
  </button>
  {#if $menuOpen}
    <MarketList
      locale={data.locale}
      {markets}
      {statusByMarket}
      {earliestDates}
      {planDate}
      {nextDate}
      {season}
      onSetDate={selectDate}
      onClose={closeMenu}
      onShowWelcome={openWelcome}
      onShowAbout={openAbout}
    />
  {/if}

  <InstallPrompt locale={data.locale} />
</main>
