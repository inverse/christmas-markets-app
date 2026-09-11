<script lang="ts">
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
  import { simulatedDate } from "$lib/utils/date";
  import {
    getEarliestDate,
    isMarketOpen,
    type MarketStatus,
  } from "$lib/utils/marketStatus";

  let { data } = $props();
  let markets = $derived(data.markets);
  let now = $derived($simulatedDate || new Date());

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
    if (hasSeen) return;
    localStorage.setItem("hasSeenWelcome", "true");
    // A shared market link is more relevant than the intro, so don't stomp it.
    if (window.location.hash === "") openWelcome();
  });
</script>

<main class="h-screen w-screen relative">
  {#if $welcomeOpen}
    <WelcomeModal
      daysUntilFirstMarket={daysUntilFirst}
      marketCount={markets.length}
      {anyMarketOpen}
      {allMarketsClosed}
      onClose={closeWelcome}
    />
  {/if}

  {#if $aboutOpen}
    <AboutModal onClose={closeAbout} />
  {/if}

  <Map {markets} {statusByMarket} />

  <button
    onclick={openMenu}
    aria-expanded={$menuOpen}
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

  {#if $menuOpen}
    <MarketList
      {markets}
      {statusByMarket}
      {earliestDates}
      onClose={closeMenu}
      onShowWelcome={openWelcome}
      onShowAbout={openAbout}
    />
  {/if}

  <InstallPrompt />
</main>
