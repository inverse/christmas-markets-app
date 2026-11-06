import { describe, expect, it } from "vitest";
import marketsDe from "../../../data/markets.de.json";
import { loadMarkets } from "./markets";

describe("loadMarkets", () => {
  it("loads English fields and falls back when German market text is not present", async () => {
    const [english, german] = await Promise.all([
      loadMarkets("en"),
      loadMarkets("de"),
    ]);

    expect(english.length).toBeGreaterThan(0);
    expect(new Set(english.map((market) => market.id)).size).toBe(
      english.length,
    );
    expect(english[0].name).toBeTruthy();
    expect(english[0].dates.raw).toBeTruthy();
    expect(new URL(english[0].url).hostname).toBeTruthy();
    const deIds = new Set(Object.keys(marketsDe));
    expect(
      german
        .filter((market) => !deIds.has(market.id))
        .map(({ id, name }) => ({ id, name })),
    ).toEqual(
      english
        .filter((en) => !deIds.has(en.id))
        .map(({ id, name }) => ({ id, name })),
    );
  });

  it("uses German market text when present", async () => {
    const [english, german] = await Promise.all([
      loadMarkets("en"),
      loadMarkets("de"),
    ]);
    // Assert against the de dictionary itself, not a specific market: any id
    // present in markets.de.json must deliver its own text on /de.
    const id = Object.keys(marketsDe)[0];
    const market = german.find((m) => m.id === id)!;
    const content = (marketsDe as Record<string, { name: string }>)[id];
    expect(market.name).toBe(content.name);
    expect(market.dates.raw).toBeTruthy();

    // Parsed dates drive open/closed and ?date, and always come from the
    // English base scrape - German load only swaps the display raw text.
    const englishMarket = english.find((m) => m.id === id)!;
    // raw is per-locale display text; the parsed shape must match.
    expect({ ...market.dates, raw: "" }).toEqual({
      ...englishMarket.dates,
      raw: "",
    });
  });
});
