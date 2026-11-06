import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import * as prettier from "prettier";
import { parseArgs } from "node:util";
import { parseDates } from "../src/shared/dateParser.ts";
import { slugify } from "../src/lib/slug.ts";
import type { Market, MarketBase, MarketLocale } from "../src/shared/types.ts";

const RAW_URLS_PATH = path.resolve("data/markets-raw.json");
const BASE_OUTPUT_PATH = path.resolve("data/markets.base.json");
const EN_OUTPUT_PATH = path.resolve("data/markets.en.json");
const DE_OUTPUT_PATH = path.resolve("data/markets.de.json");

function toAbsoluteUrl(href: string): string {
  return href.startsWith("http") ? href : `https://www.berlin.de${href}`;
}

function nullable(text: string): string | null {
  return ["Not found", "Not yet known", "Noch nicht bekannt"].includes(text)
    ? null
    : text;
}

function getDdByDtLabelSimple(
  $: cheerio.CheerioAPI,
  dl: cheerio.Cheerio<cheerio.Element>,
  label: string,
): cheerio.Cheerio<cheerio.Element> | null {
  let result: cheerio.Cheerio<cheerio.Element> | null = null;
  dl.find("dt").each((_, el) => {
    const dtText = $(el).text().trim();
    if (dtText.toLowerCase() === label.toLowerCase()) {
      const next = $(el).next("dd");
      if (next.length) {
        result = next;
      }
    }
  });
  return result;
}

interface MarketDetails {
  dates: Dates;
  opening_times: string;
  admission: string;
}

const RETRY_ATTEMPTS = 6;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_DELAY_MS = 60_000;
const RETRY_MAX_RETRY_AFTER_MS = 300_000;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const FETCH_TIMEOUT_MS = 30_000;
const RETRY_AFTER_JITTER = 0.25;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Per-origin pacing shared by every outbound request: request starts are
// spaced by a base interval, and a 429/Retry-After response pushes the
// origin's next allowed time out while doubling its interval (halved again
// on each success), so a rate-limited host slows the whole run.
class RateLimiter {
  private static readonly BASE_MS = 1_000;
  private static readonly MAX_MS = 60_000;
  private readonly nextAllowed = new Map<string, number>();
  private readonly interval = new Map<string, number>();

  async acquire(url: string): Promise<void> {
    const origin = new URL(url).origin;
    const wait = (this.nextAllowed.get(origin) ?? 0) - Date.now();
    if (wait > 0) await delay(wait);
    this.nextAllowed.set(
      origin,
      Date.now() + (this.interval.get(origin) ?? RateLimiter.BASE_MS),
    );
  }

  penalize(url: string, ms: number): void {
    const origin = new URL(url).origin;
    const current = this.interval.get(origin) ?? RateLimiter.BASE_MS;
    this.interval.set(origin, Math.min(current * 2, RateLimiter.MAX_MS));
    this.nextAllowed.set(origin, Date.now() + ms);
  }

  reward(url: string): void {
    const origin = new URL(url).origin;
    const current = this.interval.get(origin) ?? RateLimiter.BASE_MS;
    this.interval.set(
      origin,
      Math.max(RateLimiter.BASE_MS, Math.floor(current / 2)),
    );
  }
}

const limiter = new RateLimiter();

async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Stream already closed or errored; nothing left to release.
  }
}

function parseRetryAfter(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.min(Math.max(seconds, 0) * 1000, RETRY_MAX_RETRY_AFTER_MS);
  }
  const date = Date.parse(header);
  if (Number.isNaN(date)) return null;
  return Math.min(Math.max(date - Date.now(), 0), RETRY_MAX_RETRY_AFTER_MS);
}

async function fetchWithRetry(
  url: string,
  userAgent: string = BROWSER_UA,
): Promise<Response> {
  const label = url.split("/").pop() || url;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    await limiter.acquire(url);
    let response: Response | null = null;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    const backoffMs = Math.min(
      RETRY_BASE_MS * 2 ** (attempt - 1),
      RETRY_MAX_DELAY_MS,
    );
    const retryAfterMs = response ? parseRetryAfter(response) : null;

    if (response) {
      if (response.ok) {
        limiter.reward(url);
        return response;
      }
      lastError = `HTTP ${response.status} ${response.statusText}`.trim();
      if (!RETRYABLE_STATUS.has(response.status)) {
        await discardBody(response);
        throw new Error(`${lastError} for ${url}`);
      }
      if (response.status === 429 || retryAfterMs != null) {
        limiter.penalize(url, retryAfterMs ?? backoffMs);
      }
      await discardBody(response);
    }

    if (attempt === RETRY_ATTEMPTS) break;

    const waitMs =
      retryAfterMs != null
        ? retryAfterMs * (1 + Math.random() * RETRY_AFTER_JITTER)
        : backoffMs + Math.random() * RETRY_BASE_MS;

    console.warn(
      `[Attempt ${attempt}/${RETRY_ATTEMPTS}] ${label}: ${lastError} - retrying in ${(waitMs / 1000).toFixed(1)}s`,
    );
    await delay(waitMs);
  }

  throw new Error(`${lastError} (gave up after ${RETRY_ATTEMPTS} attempts)`);
}

function parseMarketDetails($: cheerio.CheerioAPI): MarketDetails {
  const dl = $(".info-container-list");
  const details: MarketDetails = {
    dates: { raw: "Not found", type: "range", start_date: "", end_date: "" },
    opening_times: "Not found",
    admission: "Not found",
  };

  if (dl.length) {
    const labels = [
      { key: "dates" as const, label: ["Dates", "Date", "Termine", "Datum"] },
      {
        key: "opening_times" as const,
        label: ["Opening Hours", "Öffnungszeiten"],
      },
      { key: "admission" as const, label: ["Admission Fee", "Eintritt"] },
    ];
    for (const { key, label } of labels) {
      let dd = null;
      for (const l of label) {
        dd = getDdByDtLabelSimple($, dl, l);
        if (dd) break;
      }
      if (dd) {
        const ddText = dd.text().trim();
        if (key === "dates") {
          const parsed = parseDates(ddText);
          details[key] = parsed ?? {
            raw: ddText,
            type: "range",
            start_date: "",
            end_date: "",
          };
        } else {
          details[key] = ddText;
        }
      }
    }
  }

  return details;
}

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetchWithRetry(
      url,
      "ChristmasMarketsApp/1.0 (me@malachisoord.com)",
    );
    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error(`Geocoding error for "${address}":`, err);
  }
  return null;
}

interface MarketFailure {
  name: string;
  url: string;
  error: string;
}

const failures: MarketFailure[] = [];

async function processMarket(index: number, total: number, url: string) {
  console.log(`[${index + 1}/${total}] Fetching ${url}`);
  try {
    const response = await fetchWithRetry(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const name =
      $("meta[property='og:title']").attr("content") ||
      $("h1").first().text().trim() ||
      "Unknown Market";

    let address = "";
    const street =
      $(".street-address").text().trim() || $(".street").text().trim();
    const postal = $(".postal-code").text().trim();
    const locality = $(".locality").text().trim();
    if (street || postal || locality) {
      address = [street, postal, locality].filter(Boolean).join(", ");
    } else {
      address = "Berlin, Deutschland";
    }

    let lat = 52.52;
    let lng = 13.4;
    let coordinates_approximate = false;
    const latStr = $("div.geomap-map").attr("data-marker-lat");
    const lngStr = $("div.geomap-map").attr("data-marker-long");

    if (latStr && lngStr) {
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
    } else if (address) {
      console.log(`Geocoding address fallback for ${name}: ${address}`);
      const coords = await geocodeAddress(address);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        coordinates_approximate = true;
      } else {
        coordinates_approximate = true;
        console.warn(
          `No coordinates found for ${name} — using city-centre fallback`,
        );
      }
    } else {
      coordinates_approximate = true;
      console.warn(
        `No coordinates found for ${name} — using city-centre fallback`,
      );
    }

    const image_url = $("meta[property='og:image']").attr("content") || "";

    const description =
      $("meta[property='og:description']").attr("content") ||
      $(".text p").first().text().trim() ||
      "";

    const details = parseMarketDetails($);

    const deHref = $('link[hreflang="de"]').attr("href");
    const deUrl = deHref ? toAbsoluteUrl(deHref) : null;

    return {
      market: {
        id: slugify(name),
        name,
        address,
        dates: details.dates,
        opening_times: nullable(details.opening_times),
        admission: nullable(details.admission),
        description,
        image_url,
        coordinates: { lng, lat },
        coordinates_approximate,
        url,
      } satisfies Market,
      deUrl,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to process ${url}: ${errMsg}`);
    failures.push({ name: url, url, error: errMsg });
    return null;
  }
}

// Scrapes only locale-specific fields from a German market page; base data
// (dates, coordinates, image) comes from the English scrape.
async function processGermanLocale(deUrl: string): Promise<MarketLocale> {
  const response = await fetchWithRetry(deUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  const name =
    $("meta[property='og:title']").attr("content") ||
    $("h1").first().text().trim() ||
    "Unknown Market";

  const street =
    $(".street-address").text().trim() || $(".street").text().trim();
  const postal = $(".postal-code").text().trim();
  const locality = $(".locality").text().trim();
  const address =
    [street, postal, locality].filter(Boolean).join(", ") ||
    "Berlin, Deutschland";

  const description =
    $("meta[property='og:description']").attr("content") ||
    $(".text p").first().text().trim() ||
    "";

  const details = parseMarketDetails($);

  return {
    name,
    address,
    dates_raw: details.dates.raw,
    url: deUrl,
    opening_times: nullable(details.opening_times),
    admission: nullable(details.admission),
    description,
  };
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

// Short summary of parsed dates for the run log: "a to b" for ranges,
// "n days" for lists.
function datesSummary(market: Market): string {
  const dates = market.dates;
  if (dates.type === "range") {
    return dates.start_date || dates.end_date
      ? `${dates.start_date ?? "?"} to ${dates.end_date ?? "?"}`
      : dates.raw || "unparsed";
  }
  return `${dates.dates?.length ?? 0} days`;
}

interface RunStats {
  enOk: number;
  enFailed: number;
  deOk: number;
  deMissingLink: number;
  deFailed: number;
}

async function* processMarketsSequential(
  urls: string[],
  stats: RunStats,
): AsyncGenerator<{ market: Market; de: MarketLocale | null }> {
  for (let i = 0; i < urls.length; i++) {
    const result = await processMarket(i, urls.length, urls[i]);
    if (!result) {
      stats.enFailed++;
      console.log(`  en: FAILED - previous entry kept if present`);
      continue;
    }
    const { market, deUrl } = result;
    stats.enOk++;
    console.log(`  en: ${market.name} (${datesSummary(market)})`);

    let de: MarketLocale | null = null;
    if (deUrl && deUrl !== market.url) {
      console.log(`  de: fetching ${deUrl}`);
      try {
        de = await processGermanLocale(deUrl);
        stats.deOk++;
      } catch (err) {
        stats.deFailed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`  de: FAILED ${errMsg}`);
        failures.push({ name: deUrl, url: deUrl, error: errMsg });
      }
    } else if (deUrl === market.url) {
      // Raw URL is already the German page: reuse the scrape.
      const { raw: dates_raw } = market.dates;
      de = {
        name: market.name,
        address: market.address,
        dates_raw,
        url: market.url,
        opening_times: market.opening_times,
        admission: market.admission,
        description: market.description,
      };
      stats.deOk++;
      console.log(`  de: source URL is the German page - reused`);
    } else {
      stats.deMissingLink++;
      console.warn(`  de: no German page linked - will fall back to English`);
    }
    yield { market, de };
  }
}

// Usage: markets:generate [--missing] [--only <url-substring>]...
//   no flags: scrape every URL in markets-raw.json (English + linked German page)
//   --missing: scrape only URLs absent from markets.en.json or markets.de.json
//   --only: scrape only URLs containing the given text (repeatable)
// Scraped markets are merged by URL/id; failed scrapes keep existing data.
async function main() {
  const { values } = parseArgs({
    options: {
      missing: { type: "boolean" },
      only: { type: "string", multiple: true },
    },
  });

  if (!fs.existsSync(RAW_URLS_PATH)) {
    console.error(`Error: ${RAW_URLS_PATH} not found.`);
    process.exit(1);
  }

  const urls: string[] = JSON.parse(fs.readFileSync(RAW_URLS_PATH, "utf-8"));
  const base: MarketBase[] = fs.existsSync(BASE_OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(BASE_OUTPUT_PATH, "utf-8"))
    : [];
  const locale: Record<string, MarketLocale> = fs.existsSync(EN_OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(EN_OUTPUT_PATH, "utf-8"))
    : {};
  const localeDe: Record<string, MarketLocale> = fs.existsSync(DE_OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(DE_OUTPUT_PATH, "utf-8"))
    : {};
  const existing: Market[] = base.flatMap((market) => {
    const content = locale[market.id];
    if (!content) return [];
    return [
      {
        ...market,
        ...content,
        dates: { ...market.dates, raw: content.dates_raw },
      } as Market,
    ];
  });
  const byUrl = new Map(existing.map((market) => [market.url, market]));
  const only = values.only ?? [];
  const missingEnCount = urls.filter((url) => !byUrl.has(url)).length;
  const missingDeCount = urls.filter(
    (url) => !localeDe[byUrl.get(url)?.id ?? ""],
  ).length;
  const targets = urls.filter((url) => {
    const id = byUrl.get(url)?.id;
    const missingEn = !byUrl.has(url);
    const missingDe = id ? !localeDe[id] : true;
    return (
      (!values.missing || missingEn || missingDe) &&
      (only.length === 0 || only.some((substring) => url.includes(substring)))
    );
  });
  if (targets.length === 0) {
    console.log("Nothing to fetch.");
    return;
  }
  const scope = values.missing
    ? `missing en: ${missingEnCount}, missing de: ${missingDeCount}`
    : only.length > 0
      ? `filtered by --only`
      : "full scrape";
  console.log(
    `Loaded ${urls.length} market URLs. Scraping ${targets.length} (${scope})`,
  );

  const startedAt = Date.now();
  const deBefore = Object.keys(localeDe).length;
  const stats: RunStats = {
    enOk: 0,
    enFailed: 0,
    deOk: 0,
    deMissingLink: 0,
    deFailed: 0,
  };

  const outputConfigs = new Map(
    await Promise.all(
      [BASE_OUTPUT_PATH, EN_OUTPUT_PATH, DE_OUTPUT_PATH].map(
        async (outputPath) =>
          [
            outputPath,
            (await prettier.resolveConfig(outputPath)) ?? {},
          ] as const,
      ),
    ),
  );

  // Persists every market scraped so far; runs after each market so an
  // interrupted run keeps its progress. Temp file + rename keeps each write atomic.
  async function writeOutputs(): Promise<{ en: number; de: number }> {
    const markets = urls.flatMap((url) => byUrl.get(url) ?? []);
    const ids = new Set<string>();
    const nextBase: MarketBase[] = [];
    const nextLocale: Record<string, MarketLocale> = {};
    const nextLocaleDe: Record<string, MarketLocale> = {};
    for (const market of markets) {
      if (ids.has(market.id))
        throw new Error(`Duplicate market id: ${market.id}`);
      ids.add(market.id);
      const { raw: dates_raw, ...dates } = market.dates;
      nextBase.push({
        id: market.id,
        dates,
        image_url: market.image_url,
        coordinates: market.coordinates,
        coordinates_approximate: market.coordinates_approximate,
      });
      nextLocale[market.id] = {
        name: market.name,
        address: market.address,
        dates_raw,
        url: market.url,
        opening_times: market.opening_times,
        admission: market.admission,
        description: market.description,
      };
      if (localeDe[market.id]) {
        nextLocaleDe[market.id] = localeDe[market.id];
      }
    }

    for (const [outputPath, content] of [
      [BASE_OUTPUT_PATH, nextBase],
      [EN_OUTPUT_PATH, nextLocale],
      [DE_OUTPUT_PATH, nextLocaleDe],
    ] as const) {
      const json = JSON.stringify(content, null, 2);
      const formatted = await prettier.format(json, {
        ...outputConfigs.get(outputPath),
        filepath: outputPath,
      });
      const tmpPath = `${outputPath}.tmp`;
      fs.writeFileSync(tmpPath, formatted);
      fs.renameSync(tmpPath, outputPath);
    }
    return { en: nextBase.length, de: Object.keys(nextLocaleDe).length };
  }

  process.on("SIGINT", () => {
    console.log("\nInterrupted - fetched markets already saved.");
    process.exit(130);
  });

  let counts: { en: number; de: number } | undefined;
  for await (const { market, de } of processMarketsSequential(targets, stats)) {
    const previous = byUrl.get(market.url);
    const id = previous?.id ?? market.id;
    byUrl.set(market.url, { ...market, id });
    if (de) localeDe[id] = de;
    counts = await writeOutputs();
  }
  counts ??= await writeOutputs();
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  const deDelta = counts.de - deBefore;
  const deChange =
    deDelta > 0 ? `, +${deDelta} new` : deDelta < 0 ? `, ${deDelta}` : "";
  console.log(
    `Done in ${Math.floor(elapsed / 60)}m ${elapsed % 60}s.\n` +
      `  en: ${counts.en} entries (${stats.enOk} scraped, ${stats.enFailed} failed)\n` +
      `  de: ${counts.de} entries (${stats.deOk} scraped${deChange}, ` +
      `${stats.deMissingLink} no de link, ${stats.deFailed} failed)`,
  );

  if (failures.length > 0) {
    console.warn(`Encountered ${failures.length} failures:`);
    for (const failure of failures) {
      console.warn(`- ${failure.name} (${failure.url}): ${failure.error}`);
    }
    console.warn("Re-run with --missing to retry failures only.");
  }
}

main();
