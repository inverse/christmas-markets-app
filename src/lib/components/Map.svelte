<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import type { MarketStatus } from "$lib/utils/marketStatus";
  import { buildPopup } from "$lib/utils/popup";
  import type { Market } from "$shared/types";
  import { mapStore, selectedMarket } from "$lib/mapStore";
  let { markets, statusByMarket } = $props<{
    markets: Market[];
    statusByMarket: Map<string, MarketStatus>;
  }>();

  let mapElement: HTMLDivElement;
  let map: L.Map;
  let L: typeof import("leaflet");
  let markers: SvelteMap<string, L.Marker>;
  let userMarker: L.Marker;
  let starIcon: L.DivIcon;
  let christmasIcon: L.DivIcon;
  let christmasIconLit: L.DivIcon;
  let markersReady = $state(false);

  onMount(async () => {
    if (browser) {
      const leaflet = await import("leaflet");
      L = leaflet.default || leaflet;
      // SvelteMap needs to be imported if it is from svelte
      const { SvelteMap } = await import("svelte/reactivity");
      christmasIcon = L.divIcon({
        html: `<div class="relative w-8 h-8 rounded-full border-2 border-gold/60 bg-gold/30 flex items-center justify-center"><img src="/icons/christmas-tree-raw.svg" class="w-5 h-5 opacity-70" /></div>`,
        className: "custom-tree-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      christmasIconLit = L.divIcon({
        html: `<div class="relative w-10 h-10 rounded-full border-2 border-gold bg-gold/60 flex items-center justify-center shadow-lg"><img src="/icons/christmas-tree-raw.svg" class="w-6 h-6" /></div>`,
        className: "custom-tree-icon-lit",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });
      starIcon = L.divIcon({
        html: `<svg viewBox="0 0 24 24" fill="#EAB308" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>`,
        className: "custom-star-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      map = L.map(mapElement, { zoomControl: false }).setView(
        [52.52, 13.4],
        12,
      );
      L.control.zoom({ position: "bottomleft" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      markers = new SvelteMap<string, L.Marker>();
      markets.forEach((market: Market) => {
        const status = statusByMarket.get(market.name) ?? "unknown";
        const marker = L.marker(
          [market.coordinates.lat, market.coordinates.lng],
          { icon: status === "open" ? christmasIconLit : christmasIcon },
        )
          .addTo(map)
          .bindPopup(() =>
            buildPopup(market, statusByMarket.get(market.name) ?? "unknown"),
          );
        markers.set(market.name, marker);
      });
      markersReady = true;
      selectedMarket.subscribe((name) => {
        if (name && markers.has(name)) {
          const marker = markers.get(name);
          if (marker && map) {
            marker.openPopup();
            map.setView(
              [marker.getLatLng().lat + 0.006, marker.getLatLng().lng],
              15,
            );
          }
        }
      });

      mapStore.set(map);
    }
  });

  $effect(() => {
    if (!markersReady) return;
    for (const market of markets) {
      const marker = markers.get(market.name);
      if (!marker) continue;
      const status = statusByMarket.get(market.name) ?? "unknown";
      marker.setIcon(status === "open" ? christmasIconLit : christmasIcon);
    }
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      mapStore.set(null);
    }
  });

  let isLoadingLocation = $state(false);
  let locationNotice = $state<string | null>(null);

  function findMe() {
    if (!navigator.geolocation || !map) {
      locationNotice = "Geolocation is not available on this device.";
      return;
    }
    isLoadingLocation = true;
    locationNotice = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);

        if (userMarker) {
          userMarker.setLatLng(userLatLng);
        } else {
          userMarker = L.marker(
            userLatLng,
            starIcon ? { icon: starIcon } : {},
          ).addTo(map);
        }

        // Find nearest market
        let nearestMarket = null;
        let minDistance = Infinity;

        markets.forEach((market) => {
          const marketLatLng = L.latLng(
            market.coordinates.lat,
            market.coordinates.lng,
          );
          const distance = userLatLng.distanceTo(marketLatLng);
          if (distance < minDistance) {
            minDistance = distance;
            nearestMarket = market;
          }
        });

        // Zoom to fit both user and nearest market
        if (nearestMarket) {
          const marketLatLng = L.latLng(
            nearestMarket.coordinates.lat,
            nearestMarket.coordinates.lng,
          );
          const bounds = L.latLngBounds(userLatLng, marketLatLng);
          map.fitBounds(bounds, { padding: [50, 50] });

          const marker = markers.get(nearestMarket.name);
          if (marker) {
            marker.openPopup();
          }
        } else {
          map.setView(userLatLng, 15);
        }

        isLoadingLocation = false;
      },
      (error: GeolocationPositionError) => {
        isLoadingLocation = false;
        locationNotice = `Could not get your location: ${error.message}`;
      },
    );
  }
</script>

<div bind:this={mapElement} class="h-screen w-full relative">
  <button
    onclick={findMe}
    disabled={isLoadingLocation}
    title="Find my location"
    class="absolute top-4 right-4 z-[1000] flex items-center justify-center w-11 h-11 bg-snow text-pine rounded-full shadow-lg border-2 border-gold hover:bg-gold-light/40 transition disabled:opacity-50"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-5 h-5 {isLoadingLocation ? 'animate-spin' : ''}"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  </button>

  {#if locationNotice}
    <div
      role="status"
      class="absolute bottom-6 left-1/2 z-[1000] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-lg bg-pine-dark/90 px-4 py-2.5 text-sm text-snow shadow-lg"
    >
      <span class="flex-1">{locationNotice}</span>
      <button
        onclick={() => (locationNotice = null)}
        aria-label="Dismiss"
        class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        &times;
      </button>
    </div>
  {/if}
</div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }
</style>
