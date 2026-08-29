<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import MarketList from "$lib/components/MarketList.svelte";
  import WelcomeModal from "$lib/components/WelcomeModal.svelte";
  import { onMount } from "svelte";
  import { simulatedDate } from "$lib/utils/date";
  import {
    getEarliestDate,
    isMarketOpen,
    isAllClosed,
  } from "$lib/utils/marketStatus";

  let { data } = $props();
  let markets = $derived(data.markets);
  let now = $derived($simulatedDate || new Date());

  let isMenuOpen = $state(false);
  let showWelcome = $state(false);

  const anyMarketOpen = $derived(
    markets.some((m) => isMarketOpen(m.dates, now).status === "open"),
  );
  const allMarketsClosed = $derived(isAllClosed(markets, now));

  const earliestMarketDate = $derived(
    markets.reduce((min: Date | null, market) => {
      const date = getEarliestDate(market.dates);
      if (min === null || date < min) return date;
      return min;
    }, null),
  );

  const daysUntilFirst = $derived(() => {
    if (!earliestMarketDate) return undefined;
    const diffTime = earliestMarketDate.getTime() - now.getTime();
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
</script>

<main class="h-screen w-screen relative">
  {#if showWelcome}
    <WelcomeModal
      daysUntilFirstMarket={daysUntilFirst()}
      marketCount={markets.length}
      {anyMarketOpen}
      {allMarketsClosed}
      onClose={closeWelcome}
    />
  {/if}

  <Map {markets} {now} />

  <button
    onclick={() => (isMenuOpen = true)}
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
    <span class="font-display font-semibold">Markets</span>
  </button>

  {#if isMenuOpen}
    <MarketList
      {markets}
      {now}
      onClose={() => (isMenuOpen = false)}
      onShowWelcome={() => {
        showWelcome = true;
        isMenuOpen = false;
      }}
    />
  {/if}
</main>
