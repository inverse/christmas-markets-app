import type { Locale, Market, MarketBase, MarketLocale } from "$shared/types";
import base from "../../../data/markets.base.json";

const localeFiles = {
  en: () => import("../../../data/markets.en.json"),
  de: () => import("../../../data/markets.de.json"),
} satisfies Record<
  Locale,
  () => Promise<{ default: Record<string, MarketLocale> }>
>;

// Scraper sentinels meaning "field not published". dates_raw keeps them for
// display fidelity, so the loader normalises them to "" and consumers fall
// back to a localized message instead of leaking English on /de.
const MISSING_TEXT: Record<string, true> = {
  "Not found": true,
  "Not yet known": true,
  "Noch nicht bekannt": true,
};

// Parsed dates always come from the English scrape (markets.base.json); a
// German entry only swaps the display text. That keeps open/closed status and
// ?date filtering identical across locales even when the scraped pages drift.
export async function loadMarkets(locale: Locale): Promise<Market[]> {
  const localized = (await localeFiles[locale]()).default as Record<
    string,
    MarketLocale
  >;
  const fallback =
    locale === "en"
      ? localized
      : ((await localeFiles.en()).default as Record<string, MarketLocale>);
  const ids = new Set<string>();

  const markets = (base as MarketBase[]).map((market) => {
    if (!market.id || ids.has(market.id)) {
      throw new Error(`Missing or duplicate market id: ${market.id}`);
    }
    ids.add(market.id);
    const content = localized[market.id] ?? fallback[market.id];
    if (!content)
      throw new Error(`Missing ${locale} market content: ${market.id}`);
    const { dates_raw, ...fields } = content;
    return {
      ...market,
      ...fields,
      dates: {
        ...market.dates,
        raw: MISSING_TEXT[dates_raw] ? "" : dates_raw,
      },
    };
  });

  // Both dictionaries must stay subsets of base ids; checking only the
  // localized file would let a stale id hide in the English fallback.
  const extra = [localized, fallback]
    .flatMap(Object.keys)
    .find((id) => !ids.has(id));
  if (extra) throw new Error(`Unknown ${locale} market id: ${extra}`);
  return markets;
}
