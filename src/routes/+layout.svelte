<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/icons/logo.svg" />
	<link rel="manifest" href="/manifest.json" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<title>Berlin Christmas Markets Map</title>
	<meta
		name="description"
		content="Discover Berlin's magical Christmas markets on an interactive map. Browse dates, hours and locations, then plan your festive visit."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Berlin Christmas Markets Map" />
	<meta property="og:description" content="Discover Berlin's magical Christmas markets on an interactive map. Browse dates, hours and locations, then plan your festive visit." />
	<meta property="og:image" content="/icons/logo.svg" />
</svelte:head>

{@render children()}
