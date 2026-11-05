import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import * as prettier from "prettier";
import { parseArgs } from "node:util";
import { parseDates } from "../src/shared/dateParser.ts";
import type { Market } from "../src/shared/types.ts";

const RAW_URLS_PATH = path.resolve("data/markets-raw.json");
const OUTPUT_PATH = path.resolve("data/markets.json");

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

async function fetchWithRetry(url: string): Promise<Response> {
  const label = url.split("/").pop() || url;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    let response: Response | null = null;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (response) {
      if (response.ok) return response;
      lastError = `HTTP ${response.status} ${response.statusText}`.trim();
      if (!RETRYABLE_STATUS.has(response.status)) {
        throw new Error(`${lastError} for ${url}`);
      }
    }

    if (attempt === RETRY_ATTEMPTS) break;

    const backoffMs = Math.min(
      RETRY_BASE_MS * 2 ** (attempt - 1),
      RETRY_MAX_DELAY_MS,
    );
    const waitMs =
      (response && parseRetryAfter(response)) ??
      backoffMs + Math.random() * RETRY_BASE_MS;

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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ChristmasMarketsApp/1.0 (me@malachisoord.com)",
      },
    });
    if (!response.ok) return null;
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
      address = `${street}, ${postal}, ${locality}`;
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

    return {
      name,
      address,
      dates: details.dates,
      opening_times: details.opening_times,
      admission: details.admission,
      description,
      image_url,
      coordinates: { lng, lat },
      coordinates_approximate,
      url,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to process ${url}: ${errMsg}`);
    failures.push({ name: url, url, error: errMsg });
    return null;
  }
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

async function processMarketsSequential(urls: string[]) {
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const market = await processMarket(i, urls.length, urls[i]);
    if (market) {
      results.push(market);
    }
    if (i < urls.length - 1) {
      await delay(1000);
    }
  }
  return results;
}

// Usage: markets:generate [--missing] [--only <url-substring>]...
//   (no flags)  scrape every URL in markets-raw.json
//   --missing   scrape only URLs that are not yet in markets.json
//   --only      scrape only URLs containing the given text (repeatable)
// Scraped markets are merged into markets.json by URL; a failed scrape keeps
// the previous entry instead of dropping the market.
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
  const existing: Market[] = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"))
    : [];
  const byUrl = new Map(existing.map((m) => [m.url, m]));

  const only = values.only ?? [];
  const targets = urls.filter(
    (u) =>
      (!values.missing || !byUrl.has(u)) &&
      (only.length === 0 || only.some((s) => u.includes(s))),
  );
  if (targets.length === 0) {
    console.log("Nothing to fetch.");
    return;
  }
  console.log(
    `Loaded ${urls.length} market URLs from markets-raw.json. Scraping ${targets.length}...`,
  );

  for (const market of await processMarketsSequential(targets)) {
    byUrl.set(market.url, market);
  }
  const markets = urls.flatMap((u) => byUrl.get(u) ?? []);

  const jsonContent = JSON.stringify(markets, null, 2);
  const config = await prettier.resolveConfig(OUTPUT_PATH);
  const formatted = await prettier.format(jsonContent, {
    ...config,
    filepath: OUTPUT_PATH,
  });
  fs.writeFileSync(OUTPUT_PATH, formatted);
  console.log(`Successfully wrote ${markets.length} markets to ${OUTPUT_PATH}`);

  if (failures.length > 0) {
    console.warn(`\nEncountered ${failures.length} failures:`);
    for (const f of failures) {
      console.warn(`- ${f.name} (${f.url}): ${f.error}`);
    }
  }
}

main();
