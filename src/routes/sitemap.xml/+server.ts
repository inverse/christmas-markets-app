import { loadMarkets } from "$lib/data/markets";
import type { Dates } from "$shared/dateParser";
import type { RequestHandler } from "./$types";

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lastmod(dates: Dates | undefined): string | null {
  if (!dates) return null;
  if (dates.type === "range") {
    return dates.end_date || dates.start_date || null;
  }
  return dates.dates.length ? dates.dates[dates.dates.length - 1] : null;
}

// / is canonical English, /de is canonical German (SvelteKit strips the
// trailing slash, so /de/ would 308 to /de).
function alternates(origin: string, suffix: string): string[] {
  const en = `${origin}/${suffix}`;
  const de = `${origin}/de${suffix ? `/${suffix}` : ""}`;
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="de" href="${esc(de)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}"/>`,
  ];
}

export const GET: RequestHandler = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const en = await loadMarkets("en");

  // Locale homepages.
  const homeEntries = (["", "de"] as const).map((path) =>
    [
      "  <url>",
      `    <loc>${origin}/${path}</loc>`,
      "    <changefreq>weekly</changefreq>",
      "    <priority>1.0</priority>",
      ...alternates(origin, ""),
      "  </url>",
    ].join("\n"),
  );

  // One <url> per market deep link per locale so each market name can rank on
  // its own; hreflang pairs it with the other locale's fragment URL.
  const marketEntries = en.flatMap((market) => {
    const last = lastmod(market.dates);
    const suffix = `#market=${encodeURIComponent(market.id)}`;
    return (["", "de"] as const).map((path) =>
      [
        "  <url>",
        `    <loc>${origin}/${path}${suffix}</loc>`,
        ...(last ? [`    <lastmod>${last}</lastmod>`] : []),
        "    <changefreq>weekly</changefreq>",
        "    <priority>0.8</priority>",
        ...alternates(origin, suffix),
        "  </url>",
      ].join("\n"),
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...homeEntries, ...marketEntries].join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
