import { describe, expect, it } from "vitest";
import type { Market } from "$shared/types";
import {
  boundingBox,
  findNearestMarket,
  haversineDistance,
  locationErrorMessage,
} from "./findMe";

function makeMarket(name: string, lat: number, lng: number): Market {
  return {
    name,
    address: "Test address",
    dates: {
      raw: "raw",
      type: "range",
      start_date: "2026-11-20",
      end_date: "2026-12-23",
    },
    image_url: "/img.jpg",
    coordinates: { lat, lng },
    url: "https://example.com",
    opening_times: "10:00-20:00",
    admission: "Free",
    description: "A market",
  };
}

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(
      haversineDistance({ lat: 48.13, lng: 11.57 }, { lat: 48.13, lng: 11.57 }),
    ).toBe(0);
  });

  it("measures one degree of latitude at the equator as about 111.2 km", () => {
    const d = haversineDistance({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it("is symmetric", () => {
    const a = { lat: 48.1375, lng: 11.575 };
    const b = { lat: 50.9375, lng: 6.9603 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 6);
  });
});

describe("findNearestMarket", () => {
  const markets = [
    makeMarket("Munich", 48.1375, 11.575),
    makeMarket("Nuremberg", 49.4521, 11.0767),
    makeMarket("Cologne", 50.9375, 6.9603),
  ];

  it("returns null for an empty market list", () => {
    expect(findNearestMarket({ lat: 48, lng: 11 }, [])).toBeNull();
  });

  it("picks the closest market and reports the distance", () => {
    const user = { lat: 49.2, lng: 11.3 };
    const nearest = findNearestMarket(user, markets);
    expect(nearest).not.toBeNull();
    expect(nearest!.market.name).toBe("Nuremberg");
    const expected = haversineDistance(user, { lat: 49.4521, lng: 11.0767 });
    expect(nearest!.distanceMeters).toBeCloseTo(expected, 6);
  });

  it("breaks ties by keeping the first market", () => {
    const dup = [
      makeMarket("A", 48.1375, 11.575),
      makeMarket("B", 48.1375, 11.575),
    ];
    expect(
      findNearestMarket({ lat: 48.1375, lng: 11.575 }, dup)!.market.name,
    ).toBe("A");
  });
});

describe("boundingBox", () => {
  it("returns null for an empty list", () => {
    expect(boundingBox([])).toBeNull();
  });

  it("covers two points regardless of order", () => {
    const box = boundingBox([
      { lat: 50.9, lng: 6.96 },
      { lat: 48.13, lng: 11.57 },
    ]);
    expect(box).toEqual({ south: 48.13, west: 6.96, north: 50.9, east: 11.57 });
  });

  it("collapses to a point for a single location (zero diameter)", () => {
    const box = boundingBox([{ lat: 48.13, lng: 11.57 }]);
    expect(box).toEqual({
      south: 48.13,
      west: 11.57,
      north: 48.13,
      east: 11.57,
    });
  });

  it("keeps the minimal box when the second point is inside on one axis", () => {
    const box = boundingBox([
      { lat: 48, lng: 11 },
      { lat: 48, lng: 12 },
    ]);
    expect(box).toEqual({ south: 48, west: 11, north: 48, east: 12 });
  });
});

describe("locationErrorMessage", () => {
  it("maps permission denied to a friendly notice", () => {
    expect(locationErrorMessage(1, "User denied geolocation")).toContain(
      "denied",
    );
  });

  it("maps position unavailable to a friendly notice", () => {
    expect(locationErrorMessage(2, "unavailable")).toContain("unavailable");
  });

  it("maps timeout to a friendly notice", () => {
    expect(locationErrorMessage(3, "timed out")).toContain("timed out");
  });

  it("falls back to the raw message for unknown codes", () => {
    expect(locationErrorMessage(99, "Something odd")).toBe(
      "Could not get your location: Something odd",
    );
  });
});
