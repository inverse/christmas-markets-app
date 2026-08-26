export async function load() {
	const response = await fetch('https://www.berlin.de/weihnachtsmarkt/suche/.x-feed/category.geojson?id=10135126&language=en_GB&_rnd=496605');
	const data = await response.json();
	return {
		markets: data
	};
}
