<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
</svelte:head>

{@render children()}
