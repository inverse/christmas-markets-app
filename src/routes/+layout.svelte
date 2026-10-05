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

  let { data, children } = $props();

  const TITLE = "Berlin Christmas Markets 2026: Dates, Hours & Map";
  const DESCRIPTION =
    "Find Berlin Christmas markets by date, location, opening hours and admission price. Explore markets across Mitte, Charlottenburg, Prenzlauer Berg, Kreuzberg and more.";
  const IMAGE_ALT =
    "Berlin Christmas Markets 2026: a map of over 20 Berlin Christmas markets with dates, opening hours and admission prices.";
  const SITE_URL = $derived(`${data.origin}/`);
  const SHARE_IMAGE = $derived(`${data.origin}/icons/og-image.png`);
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
  <title>{TITLE}</title>
  <meta name="description" content={DESCRIPTION} />

  <link rel="canonical" href={SITE_URL} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Berlin Christmas Markets" />
  <meta property="og:locale" content="en_GB" />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:title" content={TITLE} />
  <meta property="og:description" content={DESCRIPTION} />
  <meta property="og:image" content={SHARE_IMAGE} />
  <meta property="og:image:secure_url" content={SHARE_IMAGE} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={IMAGE_ALT} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={TITLE} />
  <meta name="twitter:description" content={DESCRIPTION} />
  <meta name="twitter:image" content={SHARE_IMAGE} />
  <meta name="twitter:image:alt" content={IMAGE_ALT} />
</svelte:head>

{@render children()}
