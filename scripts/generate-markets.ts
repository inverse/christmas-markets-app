import fs from "fs";
import path from "path";
import { exec } from "child_process";
import * as cheerio from "cheerio";
import { parseDates, type Dates } from "../src/shared/dateParser.ts";

const GEOJSON_URL =
  "https://www.berlin.de/weihnachtsmarkt/suche/.x-feed/category.geojson?id=10135126&language=en_GB&_rnd=496605";

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

// Retry budget: attempts 1..6 with 2s/4s/8s/16s/32s backoff (~62s of waiting),
// extended by an explicit Retry-After when the server sends one (capped at 5 min).
const RETRY_ATTEMPTS = 6;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_DELAY_MS = 60_000;
const RETRY_MAX_RETRY_AFTER_MS = 300_000;
// 408/425/429 and 5xx are worth retrying; other 4xx (e.g. 404) never will be.
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
  if (!dl.length) {
    console.warn(`Warning: No .info-container-list found on ${url}`);
  }
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
              throw new Error(`could not resolve dates: "${ddText}"`);
            }
            details[key] = parsed;
          }
        } else {
          details[key] = ddText;
        }
      }
    }
  }

  return details;
}
interface MarketFailure {
  name: string;
  url: string;
  error: string;
}

const failures: MarketFailure[] = [];

async function processMarket(index: number, total: number, feature: unknown) {
  const label = `[${index + 1}/${total}]`;
  let name = "(unknown market)";
  let url = "";

  try {
    if (
      !feature ||
      typeof feature !== "object" ||
      !("properties" in feature) ||
      !("geometry" in feature)
    ) {
      throw new Error("invalid feature structure");
    }
    const { properties, geometry } = feature as {
      properties: {
        title: string;
        url: string;
        address: string;
        description?: string;
        image?: { url: string };
      };
      geometry: { coordinates: [number, number] };
    };

    const props = properties;
    const coords = geometry.coordinates;
    name = props.title;
    url = props.url;

    console.log(`${label} Fetching ${props.title}...`);
    const details = await getMarketDetails(props.url);

    return {
      name: props.title,
      address: props.address,
      dates: details.dates,
      opening_times: details.opening_times,
      admission: details.admission,
      description: props.description || "",
      image_url: props.image?.url ?? "",
      coordinates: {
        lng: coords[0],
        lat: coords[1],
      },
      url: props.url,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    failures.push({ name, url, error });
    console.error(`${label} FAILED ${name}: ${error}`);
    return null;
  }
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

async function processMarketsSequential(features: unknown[]) {
  const totalMarkets = features.length;
  const marketResults = [];
  // Berlin.de rate-limits aggressively; one in-flight fetch with a small
  // pause between requests avoids 429 storms entirely.
  const REQUEST_GAP_MS = 250;
  for (let i = 0; i < features.length; i++) {
    const market = await processMarket(i, totalMarkets, features[i]);
    if (market) marketResults.push(market);
    if (i < features.length - 1) await delay(REQUEST_GAP_MS);
  }
  return marketResults;
}

async function main() {
  const start = performance.now();
  console.log("Fetching main list...");

  let features: unknown[];
  try {
    const response = await fetchWithRetry(GEOJSON_URL);
    const data = (await response.json()) as { features: unknown[] };
    features = data.features;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`FAILED to fetch the market list: ${error}`);
    console.error("Nothing was written. Re-run once the feed is reachable.");
    process.exitCode = 1;
    return;
  }

  const totalMarkets = features.length;
  console.log(`Found ${totalMarkets} markets. Starting fetch...`);
  const markets = await processMarketsSequential(features);

  if (failures.length) {
    console.error(
      `\n${failures.length}/${totalMarkets} markets failed - markets.json NOT written:`,
    );
    for (const failure of failures) {
      console.error(
        `  - ${failure.name} (${failure.url || "no url"}): ${failure.error}`,
      );
    }
    console.error(
      "Re-run once the failures above are resolved, or fix the parser if the wording changed.",
    );
    process.exitCode = 1;
    return;
  }

  markets.sort((a, b) => a.name.localeCompare(b.name));

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  fs.writeFileSync(
    path.join(dataDir, "markets.json"),
    // Match Prettier's JSON output (printWidth 100 collapses short arrays onto one line)
    // so the generated file never needs a separate format pass.
    JSON.stringify(markets, null, 2) + "\n",
  );
  await exec("npx prettier --write data/markets.json");
  const end = performance.now();
  console.log(
    `Wrote ${markets.length} markets in ${((end - start) / 1000).toFixed(2)} seconds.`,
  );
}
main();
