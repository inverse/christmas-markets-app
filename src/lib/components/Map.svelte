<script lang="ts">
  import { isMarketOpen, statusInfo } from "$lib/utils/marketStatus";
  import { onMount, onDestroy } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { mapStore, selectedMarket } from "$lib/mapStore";
  import { browser } from "$app/environment";
  import type * as Leaflet from "leaflet";
  import type { Market } from "$lib/types";
  let { markets } = $props<{ markets: Market[] }>();
  let mapElement: HTMLElement;
  let map: Leaflet.Map | undefined;
  let L: typeof import("leaflet");
  let userMarker: Leaflet.Marker | undefined;
  let markers: SvelteMap<string, Leaflet.Marker> = new SvelteMap();
  onMount(async () => {
    if (browser) {
      const leaflet = await import("leaflet");
      L = leaflet.default || leaflet;

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

      markers = new SvelteMap();
      markets.forEach((market: Market) => {
        const status = isMarketOpen(market.dates).status;
        const meta = statusInfo(status);
        const icon = status === "open" ? christmasIconLit : christmasIcon;
        const popupHtml = `
					<div class="w-[300px] bg-snow overflow-hidden font-sans border border-gold/40 rounded-xl">
						<div class="relative h-40">
							<img src="${market.image_url}" alt="${market.name}" loading="lazy" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
							<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow ${meta.pill}">
								<span class="w-1.5 h-1.5 rounded-full ${meta.dot}"></span>
								${meta.label}
							</span>
							<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${market.name}</h3>
						</div>
						<div class="h-1 w-full bg-gradient-to-r from-pine via-gold to-berry"></div>
						<div class="p-4 space-y-2.5 bg-snow">
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
								<span>${market.address}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
								<span class="${market.dates === "Not found" ? "italic text-stone-400" : "font-medium text-pine"}">${market.dates === "Not found" ? "Dates to be announced" : market.dates}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
								<span class="${market.opening_times === "Not found" ? "italic text-stone-400" : ""}">${market.opening_times === "Not found" ? "Opening times to be announced" : market.opening_times}</span>
							</div>
							${
                market.admission !== "Not found"
                  ? `
								<div class="flex items-start gap-2 text-[13px] text-stone-700">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
									<span>${market.admission}</span>
								</div>
							`
                  : ""
              }
							<a href="${market.url}" target="_blank" class="popup-cta mt-2 flex items-center justify-center gap-1.5 w-full text-sm font-bold py-2.5 rounded-lg transition shadow-sm border border-gold/70">
								View market details
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
							</a>
						</div>
					</div>
				`;
        const marker = L.marker(
          [market.coordinates.lat, market.coordinates.lng],
          { icon },
        )
          .addTo(map!)
          .bindPopup(popupHtml);
        markers.set(market.name, marker);
      });

      selectedMarket.subscribe((name) => {
        if (name && markers.has(name)) {
          const marker = markers.get(name);
          if (marker && map) {
            marker.openPopup();
            map.setView(marker.getLatLng(), 15);
          }
        }
      });

      mapStore.set(map!);
    }
  });

  onDestroy(() => {
    if (browser) {
      mapStore.set(null);
    }
  });

  function findMe() {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const latlng = [userLat, userLng] as L.LatLngExpression;

        if (userMarker) {
          userMarker.setLatLng(latlng);
        } else {
          userMarker = L.marker(latlng, {
            icon: L.divIcon({
              html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
              className: "user-marker",
            }),
          }).addTo(map!);
        }

        let closestMarket: Market | undefined;
        let minDistance = Infinity;
        markets.forEach((market: Market) => {
          const d = L.latLng([
            market.coordinates.lat,
            market.coordinates.lng,
          ]).distanceTo(latlng);
          if (d < minDistance) {
            minDistance = d;
            closestMarket = market;
          }
        });

        if (closestMarket) {
          const marker = markers.get(closestMarket!.name);
          if (marker) {
            map!.setView(marker.getLatLng(), 15);
          }
        }
      });
    }
  }
</script>

<div bind:this={mapElement} class="h-screen w-full relative">
  <div
    class="seasonal-map-frame pointer-events-none absolute inset-x-0 top-0 z-[400] h-1.5"
    aria-hidden="true"
  ></div>
  <button
    onclick={findMe}
    title="Find my location"
    class="map-location-control absolute top-4 right-4 z-[1000] flex items-center justify-center w-11 h-11 bg-snow text-pine rounded-full shadow-lg border-2 border-gold hover:bg-gold-light/40 transition"
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
      ><circle cx="12" cy="12" r="3" /><path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
      /></svg
    >
  </button>
</div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }

  :global(.animate-pulse) {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
</style>
