<script lang="ts">
  import "../app.css";
  import "leaflet/dist/leaflet.css";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { initDateSimulation } from "$lib/utils/date";
  import { initTheme } from "$lib/utils/theme";
  import type { Component } from "svelte";

  // Dynamically import to avoid SSR issues with Svelte 5 components
  let DevDateSelector: Component | null = $state(null);
  onMount(async () => {
    initDateSimulation();
    initTheme();
    if (import.meta.env.DEV) {
      const module = await import("$lib/components/DevDateSelector.svelte");
      DevDateSelector = module.default;
    }
  });

  let { children } = $props();
</script>

{#if browser && DevDateSelector}
  <DevDateSelector />
{/if}

<svelte:head>
  <link rel="icon" href="/icons/logo.svg" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />

  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
    integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />

  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <title>Berlin Christmas Markets 2026: Dates, Hours &amp; Map</title>
  <meta
    name="description"
    content="Find Berlin Christmas markets by date, location, opening hours and admission price. Explore markets across Mitte, Charlottenburg, Prenzlauer Berg, Kreuzberg and more."
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:title"
    content="Berlin Christmas Markets 2026: Dates, Hours &amp; Map"
  />
  <meta
    property="og:description"
    content="Find Berlin Christmas markets by date, location, opening hours and admission price. Explore markets across Mitte, Charlottenburg, Prenzlauer Berg, Kreuzberg and more."
  />
  <meta property="og:image" content="/icons/logo.svg" />
</svelte:head>

{@render children()}
