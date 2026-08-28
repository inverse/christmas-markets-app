<script lang="ts">
	import { isMarketOpen, statusInfo } from '$lib/utils/marketStatus';
	import { onMount, onDestroy } from 'svelte';
	import { mapStore, selectedMarket } from '$lib/mapStore';
	import { browser } from '$app/environment';

	let { markets } = $props<{ markets: any[] }>();
	let mapElement: HTMLElement;
	let map: any;
	let L: any;
	let userMarker: any;
	let markers: Map<string, any>;
	onMount(async () => {
		if (browser) {
			const leaflet = await import('leaflet');
			L = leaflet.default || leaflet;

			const christmasIcon = L.icon({
				iconUrl: '/icons/christmas-tree.svg',
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32]
			});

			const christmasIconLit = L.icon({
				iconUrl: '/icons/christmas-tree-lights.svg',
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32]
			});

			map = L.map(mapElement, { zoomControl: false }).setView([52.52, 13.4], 12);
			L.control.zoom({ position: 'bottomleft' }).addTo(map);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(map);

			markers = new Map();
			markets.forEach((market: any) => {
				const meta = statusInfo(isMarketOpen(market.dates).status);
				const popupHtml = `
					<div class="w-[300px] bg-snow overflow-hidden font-sans">
						<div class="relative h-40">
							<img src="${market.image_url}" alt="${market.name}" loading="lazy" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"></div>
							<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow ${meta.pill}">
								<span class="w-1.5 h-1.5 rounded-full ${meta.dot}"></span>
								${meta.label}
							</span>
							<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${market.name}</h3>
						</div>
						<div class="p-4 space-y-2.5">
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
								<span>${market.address}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
								<span class="${market.dates === 'Not found' ? 'italic text-stone-400' : ''}">${market.dates === 'Not found' ? 'Dates to be announced' : market.dates}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
								<span class="${market.opening_times === 'Not found' ? 'italic text-stone-400' : ''}">${market.opening_times === 'Not found' ? 'Opening times to be announced' : market.opening_times}</span>
							</div>
							<a href="${market.url}" target="_blank" class="mt-1 flex items-center justify-center gap-1.5 w-full bg-gold hover:bg-gold-dark text-pine text-sm font-bold py-2.5 rounded-lg transition shadow-sm">
								More Info
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
							</a>
						</div>
					</div>
				`;
				const marker = L.marker([market.coordinates.lat, market.coordinates.lng], { icon: christmasIcon })
					.addTo(map)
					.bindPopup(popupHtml);
				markers.set(market.name, marker);
			});

			selectedMarket.subscribe((name) => {
				if (name && markers.has(name)) {
					const marker = markers.get(name);
					marker.openPopup();
					map.setView(marker.getLatLng(), 15);
				}
			});

			mapStore.set(map);
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
					const latlng = [userLat, userLng];

					if (userMarker) {
						userMarker.setLatLng(latlng);
					} else {
						userMarker = L.marker(latlng, {
							icon: L.divIcon({
								html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
								className: 'user-marker'
							})
						}).addTo(map);
					}

					// Find closest market
					let closestMarket = null;
					let minDistance = Infinity;

					markets.forEach((market) => {
						const d = L.latLng([market.coordinates.lat, market.coordinates.lng]).distanceTo(latlng);
						if (d < minDistance) {
							minDistance = d;
							closestMarket = market;
						}
					});

					if (closestMarket) {
						const marker = markers.get(closestMarket.name);
						marker.openPopup();
						map.setView(marker.getLatLng(), 15);
					}
				});
		}
	}
</script>

<div bind:this={mapElement} class="h-screen w-full relative">
	<button
		onclick={findMe}
		title="Find my location"
		class="absolute top-4 right-4 z-[1000] flex items-center justify-center w-11 h-11 bg-snow text-pine rounded-full shadow-lg border-2 border-gold hover:bg-cream transition"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
	</button>
</div>

<style>
	:global(.leaflet-container) {
		height: 100%;
		width: 100%;
	}

	:global(.leaflet-control-zoom a) {
		color: var(--color-pine) !important;
	}

	:global(.leaflet-control-zoom a:hover) {
		background: var(--color-cream) !important;
	}
</style>
