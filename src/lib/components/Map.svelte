<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { isMarketOpen } from "$lib/utils/marketStatus";
  import type { Market } from "$lib/types";
  import { mapStore } from "$lib/mapStore";

  let { markets, now } = $props<{ markets: Market[]; now: Date }>();

  let mapElement: HTMLDivElement;
  let map: L.Map;
  let markers: SvelteMap<string, L.Marker>;
  let userMarker: L.Marker;

  onMount(async () => {
    if (browser) {
      const leaflet = await import("leaflet");
      const L = leaflet.default || leaflet;

      // SvelteMap needs to be imported if it is from svelte
      const { SvelteMap } = await import("svelte/reactivity");

      const christmasIcon = L.icon({
        iconUrl: "/icons/christmas-tree-raw.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const christmasIconLit = L.icon({
        iconUrl: "/icons/christmas-tree-raw.svg",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: "animate-pulse",
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
        const status = isMarketOpen(market.dates, now).status;
        const icon = status === "open" ? christmasIconLit : christmasIcon;

        const popupHtml = `
          <div class="w-[300px] bg-snow overflow-hidden font-sans border border-gold/40 rounded-xl">
            <div class="relative h-40">
              <img src="${market.image_url}" alt="${market.name}" loading="lazy" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${market.name}</h3>
            </div>
            <div class="p-4">
              <a href="${market.url}" target="_blank" class="block text-center text-sm font-bold py-2.5 rounded-lg border border-gold/70">View details</a>
            </div>
          </div>
        `;

        const marker = L.marker(
          [market.coordinates.lat, market.coordinates.lng],
          { icon },
        )
          .addTo(map)
          .bindPopup(popupHtml);
        markers.set(market.name, marker);
      });

      mapStore.set(map);
    }
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      mapStore.set(null);
    }
  });

  function findMe() {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const latlng = [
          pos.coords.latitude,
          pos.coords.longitude,
        ] as L.LatLngExpression;
        if (userMarker) {
          userMarker.setLatLng(latlng);
        } else {
          userMarker = L.marker(latlng).addTo(map);
        }
        map.setView(latlng, 15);
      });
    }
  }
</script>

<div bind:this={mapElement} class="h-screen w-full relative">
  <button
    onclick={findMe}
    title="Find my location"
    class="absolute top-4 right-4 z-[1000] flex items-center justify-center w-11 h-11 bg-snow text-pine rounded-full shadow-lg border-2 border-gold hover:bg-gold-light/40 transition"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-5 h-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  </button>
</div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }
</style>
