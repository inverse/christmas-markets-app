<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mapStore, selectedMarket } from '$lib/mapStore';
	import { browser } from '$app/environment';

	let { markets } = $props<{ markets: any[] }>();
	let mapElement: HTMLElement;
	let map: any;
	let L: any;
	let userMarker: any;

	onMount(async () => {
		if (browser) {
			const leaflet = await import('leaflet');
			L = leaflet.default || leaflet;

			// Custom Christmas Icon
			const christmasIcon = L.icon({
				iconUrl: '/icons/christmas-tree.svg',
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32]
			});

			map = L.map(mapElement, { zoomControl: false }).setView([52.52, 13.40], 12);
			L.control.zoom({ position: 'bottomleft' }).addTo(map);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(map);

			const markers = new Map();
			markets.forEach((market: any) => {
				const marker = L.marker([market.coordinates.lat, market.coordinates.lng], { icon: christmasIcon })
					.addTo(map)
					.bindPopup(`
						<div class='text-sm w-64 rounded-lg overflow-hidden shadow-xl'>
							<img src='${market.image_url}' alt='${market.name}' class='w-full h-32 object-cover'/>
							<div class='p-4 bg-white'>
								<h3 class='font-bold text-lg mb-1 text-gray-800 leading-tight'>${market.name}</h3>
								<p class='text-xs text-gray-600 mb-3'>${market.address}</p>
								<a href='${market.url}' target='_blank' class='inline-block bg-[#d4af37] text-[#14532d] text-xs font-bold py-2 px-4 rounded hover:bg-[#c5a02e] transition'>More Info</a>
							</div>
						</div>
					`);
				markers.set(market.name, marker);
			});

			selectedMarket.subscribe(name => {
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
				const latlng = [pos.coords.latitude, pos.coords.longitude];
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
				map.setView(latlng, 15);
			});
		}
	}
</script>

<div bind:this={mapElement} class="h-screen w-full relative">
	<button 
		onclick={findMe}
		class="absolute top-4 right-4 z-[1000] bg-white p-3 rounded shadow-lg font-bold border-2 border-[#d4af37] text-[#14532d] hover:bg-gray-100"
	>
		📍
	</button>
</div>

<style>
	:global(.leaflet-container) { height: 100%; width: 100%; }
	:global(.leaflet-popup-content-wrapper) { padding: 0 !important; border-radius: 0.5rem !important; overflow: hidden; }
	:global(.leaflet-popup-content) { margin: 0 !important; }
</style>
