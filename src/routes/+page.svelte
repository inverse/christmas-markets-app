<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	let { data } = $props();
	let markets = $derived(data.markets.features);

	onMount(async () => {
		if (browser) {
			const L = await import('leaflet');
			import('leaflet/dist/leaflet.css');
			const map = L.map('map').setView([52.52, 13.40], 11);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(map);

			markets.forEach(market => {
				L.marker([market.geometry.coordinates[1], market.geometry.coordinates[0]])
					.addTo(map)
					.bindPopup(`<b>${market.properties.title}</b><br>${market.properties.address}`);
			});
		}
	});
</script>

<div id="map" style="height: 500px; width: 100%;"></div>

<h1>Berlin Christmas Markets 2026</h1>
<div class="market-list">
	{#each markets as market}
		<div class="market-card">
			<h2>{market.properties.title}</h2>
			<img src={market.properties.image.url} alt={market.properties.image.alt} />
			<p>{market.properties.description}</p>
			<p><strong>Address:</strong> {market.properties.address}</p>
			<a href={market.properties.url} target="_blank">More Info</a>
		</div>
	{/each}
</div>

<style>
	:global(.leaflet-container) { height: 100%; width: 100%; }
	.market-card { border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
	img { max-width: 200px; height: auto; }
</style>
