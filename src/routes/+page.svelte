<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import MarketList from "$lib/components/MarketList.svelte";
  import WelcomeModal from "$lib/components/WelcomeModal.svelte";
  import AboutModal from "$lib/components/AboutModal.svelte";
  import { onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { simulatedDate } from "$lib/utils/date";
  import {
    getEarliestDate,
    isMarketOpen,
    type MarketStatus,
  } from "$lib/utils/marketStatus";

  let { data } = $props();
  let markets = $derived(data.markets);
  let now = $derived($simulatedDate || new Date());

  let isMenuOpen = $state(false);
  let showWelcome = $state(false);
  let showAbout = $state(false);

  const statusByMarket = $derived.by(() => {
    const statuses = new SvelteMap<string, MarketStatus>();
    for (const market of markets) {
      statuses.set(market.name, isMarketOpen(market.dates, now).status);
    }
    return statuses;
  });

  const earliestDates = $derived.by(() => {
    const dates = new SvelteMap<string, Date>();
    for (const market of markets) {
      dates.set(market.name, getEarliestDate(market.dates));
    }
    return dates;
  });

  const anyMarketOpen = $derived(
    [...statusByMarket.values()].some((status) => status === "open"),
  );
  const allMarketsClosed = $derived(
    [...statusByMarket.values()].every(
      (status) => status === "closed" || status === "unknown",
    ),
  );

  const daysUntilFirst = $derived.by(() => {
    let earliest = Infinity;
    for (const date of earliestDates.values()) {
      if (date.getTime() < earliest) earliest = date.getTime();
    }
    if (earliest === Infinity) return undefined;
    const diffTime = earliest - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : undefined;
  });

  onMount(() => {
    const hasSeen = localStorage.getItem("hasSeenWelcome");
    if (!hasSeen) {
      showWelcome = true;
      localStorage.setItem("hasSeenWelcome", "true");
    }
  });

  function closeWelcome() {
    showWelcome = false;
  }

  function closeAbout() {
    showAbout = false;
  }
</script>

<main class="h-screen w-screen relative">
  {#if showWelcome}
    <WelcomeModal
      daysUntilFirstMarket={daysUntilFirst}
      marketCount={markets.length}
      {anyMarketOpen}
      {allMarketsClosed}
      onClose={closeWelcome}
    />
  {/if}

  {#if showAbout}
    <AboutModal onClose={closeAbout} />
  {/if}

  <Map {markets} {statusByMarket} />

  <button
    onclick={() => (isMenuOpen = true)}
    aria-expanded={isMenuOpen}
    class="site-menu-button absolute top-4 left-4 z-[500] flex items-center gap-2 bg-pine text-snow pl-3 pr-4 py-2.5 rounded-full shadow-lg border border-gold/60 hover:bg-pine-dark transition"
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
    <span class="font-display font-semibold">Menu</span>
  </button>

  {#if isMenuOpen}
    <MarketList
      {markets}
      {statusByMarket}
      {earliestDates}
      onClose={() => (isMenuOpen = false)}
      onShowWelcome={() => {
        showWelcome = true;
        isMenuOpen = false;
      }}
      onShowAbout={() => {
        showAbout = true;
        isMenuOpen = false;
      }}
    />
  {/if}
</main>
