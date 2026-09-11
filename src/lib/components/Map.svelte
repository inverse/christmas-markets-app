<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
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
  let popupMarkets: Map<L.Popup, string>;
  let openPopupName: string | null = null;
  let pendingPopupClear: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeSelected: (() => void) | null = null;
  let userMarker: L.Marker;
  let userLocationIcon: L.DivIcon;
  let treeIcons: Record<MarketStatus, L.DivIcon>;
  let markersReady = $state(false);

  onMount(async () => {
    if (browser) {
      const leaflet = await import("leaflet");
      L = leaflet.default || leaflet;
      // SvelteMap needs to be imported if it is from svelte
      const makeTreeIcon = (
        html: string,
        size: number,
        className: string,
      ): L.DivIcon =>
        L.divIcon({
          html,
          className,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });

      treeIcons = {
        open: makeTreeIcon(
          `<div class="relative w-10 h-10">
            <span class="absolute inset-0 rounded-full bg-pine/50 marker-pulse"></span>
            <span class="map-marker map-marker--open absolute inset-0 rounded-full border-2 border-pine flex items-center justify-center">
              <img src="/icons/christmas-tree-raw.svg" class="w-6 h-6" />
            </span>
          </div>`,
          40,
          "custom-tree-icon-open",
        ),
        upcoming: makeTreeIcon(
          `<div class="map-marker relative w-8 h-8 rounded-full border-2 border-gold flex items-center justify-center">
            <img src="/icons/christmas-tree-raw.svg" class="w-5 h-5" />
          </div>`,
          32,
          "custom-tree-icon-upcoming",
        ),
        closed: makeTreeIcon(
          `<div class="map-marker relative w-8 h-8 rounded-full border-2 border-stone-400 flex items-center justify-center">
            <img src="/icons/christmas-tree-raw.svg" class="w-5 h-5 grayscale opacity-70" />
          </div>`,
          32,
          "custom-tree-icon-closed",
        ),
        unknown: makeTreeIcon(
          `<div class="map-marker relative w-8 h-8 rounded-full border-2 border-dashed border-gold flex items-center justify-center">
            <img src="/icons/christmas-tree-raw.svg" class="w-5 h-5 opacity-80" />
          </div>`,
          32,
          "custom-tree-icon-unknown",
        ),
      };
      userLocationIcon = L.divIcon({
        html: `<div class="relative w-8 h-8">
          <span class="absolute inset-0 rounded-full bg-blue-500/50 marker-pulse"></span>
          <span class="map-marker absolute inset-0 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          </span>
        </div>`,
        className: "custom-user-icon",
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
      popupMarkets = new SvelteMap<L.Popup, string>();
      markets.forEach((market: Market) => {
        const status: MarketStatus =
          statusByMarket.get(market.name) ?? "unknown";
        const marker = L.marker(
          [market.coordinates.lat, market.coordinates.lng],
          { icon: treeIcons[status] },
        )
          .addTo(map)
          .bindPopup(
            () =>
              buildPopup(market, statusByMarket.get(market.name) ?? "unknown"),
            { maxWidth: 340, minWidth: 280, autoPanPadding: L.point(20, 60) },
          );
        const popup = marker.getPopup();
        if (popup) popupMarkets.set(popup, market.name);
        markers.set(market.name, marker);
      });
      markersReady = true;

      // Leaflet closes the previous popup when another one opens, so
      // popupclose also fires while switching markers. The clear is deferred
      // so a popupopen in the same tick cancels it, leaving #market=<new name>.
      map.on("popupopen", (event) => {
        if (pendingPopupClear !== null) {
          clearTimeout(pendingPopupClear);
          pendingPopupClear = null;
        }
        const name = popupMarkets.get(event.popup) ?? null;
        openPopupName = name;
        if (name !== null) selectedMarket.set(name);
      });
      map.on("popupclose", (event) => {
        if ((popupMarkets.get(event.popup) ?? null) !== openPopupName) return;
        openPopupName = null;
        if (pendingPopupClear !== null) clearTimeout(pendingPopupClear);
        pendingPopupClear = setTimeout(() => {
          pendingPopupClear = null;
          if (openPopupName === null) selectedMarket.set(null);
        }, 0);
      });

      unsubscribeSelected = selectedMarket.subscribe((name) => {
        if (name !== null && markers.has(name)) {
          const marker = markers.get(name);
          if (marker && map && !marker.isPopupOpen()) {
            marker.openPopup();
            map.setView(
              [marker.getLatLng().lat + 0.006, marker.getLatLng().lng],
              15,
            );
          }
        } else if (name === null) {
          map.closePopup();
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
      const status: MarketStatus = statusByMarket.get(market.name) ?? "unknown";
      marker.setIcon(treeIcons[status]);
    }
  });

  onDestroy(() => {
    unsubscribeSelected?.();
    if (pendingPopupClear !== null) clearTimeout(pendingPopupClear);
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
            userLocationIcon ? { icon: userLocationIcon } : {},
          ).addTo(map);
        }

        // Find nearest market
        let minDistance = Infinity;
        const nearestMarket = markets.reduce(
          (acc: Market | null, market: Market): Market | null => {
            const marketLatLng = L.latLng(
              market.coordinates.lat,
              market.coordinates.lng,
            );
            const distance = userLatLng.distanceTo(marketLatLng);
            if (distance < minDistance) {
              minDistance = distance;
              return market;
            }
            return acc;
          },
          null,
        );

        // Zoom to fit both user and nearest market
        if (nearestMarket) {
          const marketLatLng = L.latLng(
            nearestMarket.coordinates.lat,
            nearestMarket.coordinates.lng,
          );
          const bounds = L.latLngBounds(userLatLng, marketLatLng);
          map.fitBounds(bounds, { padding: [100, 100] });

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
