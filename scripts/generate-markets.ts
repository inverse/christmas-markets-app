import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { parseDates, type Dates } from "../src/shared/dateParser.ts";

const RAW_URLS_PATH = path.resolve("data/markets-raw.json");
const OUTPUT_PATH = path.resolve("data/markets.json");

const DATA_MAP: Record<string, Dates> = {
  "On all Sundays in Advent 2026 (29 November, 6, 13 and 20 December 2026)": {
    raw: "On all Sundays in Advent 2026 (29 November, 6, 13 and 20 December 2026)",
    type: "dates",
    dates: ["2026-11-29", "2026-12-06", "2026-12-13", "2026-12-20"],
  },
  "On the first three Advent weekends in 2026 (November 28 and 29, December 05, 06, 12, and 13)":
    {
      raw: "On the first three Advent weekends in 2026 (November 28 and 29, December 05, 06, 12, and 13)",
      type: "dates",
      dates: [
        "2026-11-28",
        "2026-11-29",
        "2026-12-05",
        "2026-12-06",
        "2026-12-12",
        "2026-12-13",
      ],
    },
  "On all weekends in Advent (November 28 and 29, December 5, 6, 12, 13, 19, and 20, 2026)":
    {
      raw: "On all weekends in Advent (November 28 and 29, December 5, 6, 12, 13, 19, and 20, 2026)",
      type: "dates",
      dates: [
        "2026-11-28",
        "2026-11-29",
        "2026-12-05",
        "2026-12-06",
        "2026-12-12",
        "2026-12-13",
        "2026-12-19",
        "2026-12-20",
      ],
    },
  "On all Advent weekends in 2026 (November 28 and 29, as well as December 5, 6, 12, 13, 19 and 21, 2026)":
    {
      raw: "On all Advent weekends in 2026 (November 28 and 29, as well as December 5, 6, 12, 13, 19 and 21, 2026)",
      type: "dates",
      dates: [
        "2026-11-28",
        "2026-11-29",
        "2026-12-05",
        "2026-12-06",
        "2026-12-12",
        "2026-12-13",
        "2026-12-19",
        "2026-12-21",
      ],
    },
  "December 5 and 6, 2026": {
    raw: "December 5 and 6, 2026",
    type: "dates",
    dates: ["2026-12-05", "2026-12-06"],
  },
  "December 19 and 20, 2026": {
    raw: "December 19 and 20, 2026",
    type: "dates",
    dates: ["2026-12-19", "2026-12-20"],
  },
  "November 28 and 29, 2026": {
    raw: "November 28 and 29, 2026",
    type: "dates",
    dates: ["2026-11-28", "2026-11-29"],
  },
  "November 4 to December 23, 2026; closed on November 15 (Remembrance Day) and November 22 (All Souls’ Day)":
    {
      raw: "November 4 to December 23, 2026; closed on November 15 (Remembrance Day) and November 22 (All Souls’ Day)",
      type: "dates",
      dates: [
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
        "2026-11-09",
        "2026-11-10",
        "2026-11-11",
        "2026-11-12",
        "2026-11-13",
        "2026-11-14",
        "2026-11-16",
        "2026-11-17",
        "2026-11-18",
        "2026-11-19",
        "2026-11-20",
        "2026-11-21",
        "2026-11-23",
        "2026-11-24",
        "2026-11-25",
        "2026-11-26",
        "2026-11-27",
        "2026-11-28",
        "2026-11-29",
        "2026-11-30",
        "2026-12-01",
        "2026-12-02",
        "2026-12-03",
        "2026-12-04",
        "2026-12-05",
        "2026-12-06",
        "2026-12-07",
        "2026-12-08",
        "2026-12-09",
        "2026-12-10",
        "2026-12-11",
        "2026-12-12",
        "2026-12-13",
        "2026-12-14",
        "2026-12-15",
        "2026-12-16",
        "2026-12-17",
        "2026-12-18",
        "2026-12-19",
        "2026-12-20",
        "2026-12-21",
        "2026-12-22",
        "2026-12-23",
      ],
    },
};

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
  dates: Dates | string;
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
      response = await fetch(url);
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
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, waitMs);
    await promise;
  }

  throw new Error(`${lastError} (gave up after ${RETRY_ATTEMPTS} attempts)`);
}

async function getMarketDetails(url: string): Promise<MarketDetails> {
  const response = await fetchWithRetry(url);
  const text = await response.text();
  const $ = cheerio.load(text);
  const dl = $(".info-container-list");
  const details: MarketDetails = {
    dates: "Not found",
    opening_times: "Not found",
    admission: "Not found",
  };

  if (dl.length) {
    const labels = [
      { key: "dates" as const, label: ["Dates", "Date"] },
      { key: "opening_times" as const, label: "Opening Hours" },
      { key: "admission" as const, label: "Admission Fee" },
    ];
    for (const { key, label } of labels) {
      let dd = null;
      if (Array.isArray(label)) {
        for (const l of label) {
          dd = getDdByDtLabelSimple($, dl, l);
          if (dd) break;
        }
      } else {
        dd = getDdByDtLabelSimple($, dl, label);
      }
      if (dd) {
        const ddText = dd.text().trim();
        if (key === "dates") {
          if (DATA_MAP[ddText]) {
            details[key] = { ...DATA_MAP[ddText], raw: ddText };
          } else {
            const parsed = parseDates(ddText);
            if (!parsed) {
              details[key] = {
                raw: ddText,
                type: "range",
                start_date: "",
                end_date: "",
              };
            } else {
              details[key] = parsed;
            }
          }
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
      address = `${street}, ${locality}, ${postal}, Deutschland`;
    } else {
      address = "Berlin, Deutschland";
    }

    let lat = 52.52;
    let lng = 13.4;
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
      }
    }

    const image_url = $("meta[property='og:image']").attr("content") || "";

    const description =
      $("meta[property='og:description']").attr("content") ||
      $(".text p").first().text().trim() ||
      "";

    const details = await getMarketDetails(url);

    return {
      name,
      address,
      dates: details.dates,
      opening_times: details.opening_times,
      admission: details.admission,
      description,
      image_url,
      coordinates: { lng, lat },
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

async function main() {
  if (!fs.existsSync(RAW_URLS_PATH)) {
    console.error(`Error: ${RAW_URLS_PATH} not found.`);
    process.exit(1);
  }

  const urls: string[] = JSON.parse(fs.readFileSync(RAW_URLS_PATH, "utf-8"));
  console.log(
    `Loaded ${urls.length} market URLs from markets-raw.json. Starting scrape...`,
  );

  const markets = await processMarketsSequential(urls);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(markets, null, 2));
  console.log(`Successfully wrote ${markets.length} markets to ${OUTPUT_PATH}`);

  if (failures.length > 0) {
    console.warn(`\nEncountered ${failures.length} failures:`);
    for (const f of failures) {
      console.warn(`- ${f.name} (${f.url}): ${f.error}`);
    }
  }
}

main();
