import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { parseDates, type Dates } from "../src/lib/dateParser.js";

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
};

function getDdByDtLabelSimple(
  $: cheerio.CheerioAPI,
  dl: cheerio.Cheerio<cheerio.Element>,
  label: string,
): cheerio.Cheerio<cheerio.Element> | null {
  let result: cheerio.Cheerio<cheerio.Element> | null = null;
  dl.find("dt").each((_, el) => {
    if ($(el).text().trim() === label) {
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
  image: string | null;
}

async function getMarketDetails(url: string): Promise<MarketDetails> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);
    const dl = $(".info-container-list");

    const details: MarketDetails = {
      dates: "Not found",
      opening_times: "Not found",
      admission: "Not found",
      image: null,
    };

    if (dl.length) {
      const labels = [
        { key: "dates" as const, label: "Dates" },
        { key: "opening_times" as const, label: "Opening Hours" },
        { key: "admission" as const, label: "Admission Fee" },
      ];
      for (const { key, label } of labels) {
        const dd = getDdByDtLabelSimple($, dl, label);
        if (dd) {
          const ddText = dd.text().trim();
          if (key === "dates") {
            if (DATA_MAP[ddText]) {
              details[key] = { ...DATA_MAP[ddText], raw: ddText };
            } else {
              const parsed = parseDates(ddText);
              if (!parsed) {
                console.error(`FATAL: Could not resolve dates: "${ddText}"`);
                process.exit(1);
              }
              details[key] = parsed;
            }
          } else {
            details[key] = ddText;
          }
        }
      }
    }

    // Image
    const ogImg = $('meta[property="og:image"]').attr("content");
    if (ogImg) {
      details.image = ogImg;
    } else {
      const swiperImg = $(".swiper-wrapper img").attr("src");
      if (swiperImg) {
        details.image = swiperImg;
      } else {
        const articleImg = $(".js-imageblur").attr("src");
        if (articleImg) {
          details.image = articleImg;
        }
      }
    }

    return details;
  } catch (e) {
    console.error(`Error fetching details for ${url}:`, e);
    process.exit(1);
  }
}

async function main() {
  console.log("Fetching main list...");
  const response = await fetch(GEOJSON_URL);
  const data = await response.json();

  const markets = [];

  // Process sequentially for now, similar to python
  for (const feature of data.features) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    console.log(`Fetching ${props.title}...`);
    const details = await getMarketDetails(props.url);

    let imageUrl = details.image;
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `https://www.berlin.de${imageUrl}`;
    }

    const dates = details.dates;

    markets.push({
      name: props.title,
      address: props.address,
      dates: dates,
      opening_times: details.opening_times,
      admission: details.admission,
      description: props.description || "",
      image_url: imageUrl || (props.image && props.image.url),
      coordinates: {
        lng: coords[0],
        lat: coords[1],
      },
      url: props.url,
    });
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  fs.writeFileSync(
    path.join(dataDir, "markets.json"),
    JSON.stringify(markets, null, 2),
  );
  console.log("Done.");
}

main();
