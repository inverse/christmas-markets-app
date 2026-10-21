import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const headers = { "User-Agent": "Mozilla/5.0" };

function toAbsolute(href: string): string {
  return href.startsWith("http") ? href : `https://www.berlin.de${href}`;
}

// A market page is valid only if it has an "At a Glance" section (German
// pages use "Auf einen Blick"). Cancelled or moved markets still return 200.
const GLANCE_HEADINGS = /^\s*(at a glance|auf einen blick)\s*$/i;
// Cancelled or moved markets still return 200 with the page intact.
const CANCELLED_PHRASES = /it no longer takes place|findet nicht mehr statt/i;
async function hasGlanceSection(url: string): Promise<boolean> {
  const res = await fetch(url, { headers });
  if (!res.ok) return false;
  const html = await res.text();
  if (CANCELLED_PHRASES.test(html)) return false;
  const $ = cheerio.load(html);
  return $("h2").toArray().some((el) => GLANCE_HEADINGS.test($(el).text()));
}

// Returns a valid English URL for a German market page, or null.
async function findEnglishUrl(gUrl: string, id: string): Promise<string | null> {
  const res = await fetch(gUrl, { headers });
  const $ = cheerio.load(await res.text());
  const candidates: string[] = [];
  const enLink = $('link[hreflang="en"]').attr("href");
  if (enLink) candidates.push(toAbsolute(enLink));
  const slug = gUrl.match(/\/weihnachtsmarkt\/\d+-\d+-(.*)\.html/)?.[1];
  if (slug) candidates.push(`https://www.berlin.de/en/christmas-markets/${id}-3230598-${slug}.en.html`);
  for (const c of candidates) {
    if (await hasGlanceSection(c).catch(() => false)) return c;
  }
  // No English page: keep the German page if it is valid.
  if (await hasGlanceSection(gUrl).catch(() => false)) return gUrl;
  return null;
}

async function main() {
  const rawUrlsPath = path.resolve("data/markets-raw.json");
  const rawUrls = JSON.parse(fs.readFileSync(rawUrlsPath, "utf8"));
  const existingIds = new Set<string>();
  for (const u of rawUrls) {
    const m = u.match(/\/(\d+)-/);
    if (m) existingIds.add(m[1]);
  }

  const districts = [
    "charlottenburg", "friedrichshain", "hellersdorf", "hohenschoenhausen",
    "kreuzberg", "koepenick", "lichtenberg", "marzahn", "mitte", "neukoelln",
    "pankow", "prenzlauer-berg", "reinickendorf", "schoeneberg", "spandau",
    "steglitz", "tempelhof", "tiergarten", "treptow", "wedding", "weissensee",
    "wilmersdorf", "zehlendorf"
  ];

  const allGermanUrls = new Set<string>();
  async function fetchLinks(url: string) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) return;
      const html = await res.text();
      const $ = cheerio.load(html);
      $("a").each((_, el) => {
        let h = $(el).attr("href");
        if (!h) return;
        if (h.startsWith("/")) h = "https://www.berlin.de" + h;
        if (h.includes("/weihnachtsmarkt/") && h.endsWith(".html") && !h.includes("rubric") && !h.includes("index") && !h.includes("suche")) {
          allGermanUrls.add(h);
        }
      });
    } catch (e) {}
  }

  console.log("Fetching main page...");
  await fetchLinks("https://www.berlin.de/weihnachtsmarkt/");
  for (const d of districts) {
    console.log(`Fetching district: ${d}`);
    await fetchLinks(`https://www.berlin.de/weihnachtsmarkt/${d}/`);
  }

  console.log(`Found ${allGermanUrls.size} German market URLs total.`);

  const newUrls: string[] = [];

  for (const gUrl of allGermanUrls) {
    const m = gUrl.match(/\/weihnachtsmarkt\/(\d+)-/);
    if (!m) continue;
    const id = m[1];
    if (existingIds.has(id)) continue;

    try {
      const enUrl = await findEnglishUrl(gUrl, id);
      if (enUrl) newUrls.push(enUrl);
      else console.log(`Skipping, no valid English page: ${gUrl}`);
    } catch (e) {
      console.log(`Skipping, fetch failed: ${gUrl}`);
    }
  }

  const combined = [...rawUrls, ...newUrls];
  fs.writeFileSync(rawUrlsPath, JSON.stringify(combined, null, 2), "utf8");
  console.log(`Added ${newUrls.length} new markets. Total markets in raw: ${combined.length}`);
}

main();
