import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("slugifies real market names", () => {
    expect(slugify("Pankow Advent Market at Heynhöfe")).toBe(
      "pankow-advent-market-at-heynhoefe",
    );
  });

  it("transliterates umlauts and apostrophes", () => {
    expect(slugify("Christmas Market at Späth'sche Baumschulen")).toBe(
      "christmas-market-at-spaeth-sche-baumschulen",
    );
  });

  it("collapses punctuation and trims dashes", () => {
    expect(slugify("Wein-Nachtsmarkt at Ludwig-Beck-Platz")).toBe(
      "wein-nachtsmarkt-at-ludwig-beck-platz",
    );
    expect(slugify("  --Weird  Name!!  ")).toBe("weird-name");
  });
});
