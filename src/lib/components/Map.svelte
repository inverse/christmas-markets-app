<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { isMarketOpen } from "$lib/utils/marketStatus";
  import type { Market } from "$lib/types";
  import { mapStore, selectedMarket } from "$lib/mapStore";
  let { markets, now } = $props<{ markets: Market[]; now: Date }>();

  let mapElement: HTMLDivElement;
  let map: L.Map;
  let L: typeof import("leaflet");
  let markers: SvelteMap<string, L.Marker>;
  let userMarker: L.Marker;
  let starIcon: L.DivIcon;

  onMount(async () => {
    if (browser) {
      const leaflet = await import("leaflet");
      L = leaflet.default || leaflet;
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
        const status = isMarketOpen(market.dates, now).status;
        const icon = status === "open" ? christmasIconLit : christmasIcon;
        const popupHtml = `
					<div class="w-[300px] bg-snow overflow-hidden font-sans border border-gold/40 rounded-xl">
						<div class="relative h-40">
							<img src="${market.image_url}" alt="${market.name}" loading="lazy" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
							<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${market.name}</h3>
						</div>
						<div class="h-1 w-full bg-gradient-to-r from-pine via-gold to-berry"></div>
						<div class="p-4 space-y-2.5 bg-snow">
              ${
                market.description && market.description !== "Not found"
                  ? `
								<div class="text-[13px] text-stone-600 mb-2 leading-relaxed italic border-b border-gold/20 pb-2">
									${market.description}
								</div>
							`
                  : ""
              }
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
								<span>${market.address}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
								<span class="font-medium text-pine">${market.dates.raw}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
								<span class="${market.opening_times === "Not found" ? "italic text-stone-400" : ""}">${market.opening_times === "Not found" ? "Opening times to be announced" : market.opening_times}</span>
							</div>
							${
                market.admission !== "Not found"
                  ? `
								<div class="flex items-start gap-2 text-[13px] text-stone-700">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 1 7H6"/></svg>
									<span>${market.admission}</span>
								</div>
							`
                  : ""
              }
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

  onDestroy(() => {
    if (map) {
      map.remove();
      mapStore.set(null);
    }
  });

  let isLoadingLocation = $state(false);

  function findMe() {
    console.log("findMe clicked");
    if (navigator.geolocation && map) {
      isLoadingLocation = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLatLng = L.latLng(
            pos.coords.latitude,
            pos.coords.longitude,
          );

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
          alert(`Could not get your location: ${error.message}`);
        },
      );
    } else {
      console.log(
        "navigator.geolocation or map is missing",
        !!navigator.geolocation,
        !!map,
      );
      alert("Geolocation or map not available.");
    }
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
</div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }
</style>
