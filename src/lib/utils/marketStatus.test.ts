import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Dates } from "../dateParser";
import { isMarketOpen, getEarliestDate, isAllClosed } from "./marketStatus";
import type { Market } from "../types";

describe("isMarketOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return upcoming for a future date (November)", () => {
    vi.setSystemTime(new Date(2026, 7, 28)); // Aug 28, 2026
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
      end_date: "2027-01-03",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("upcoming");
  });

  it("should return open for a current date (August)", () => {
    vi.setSystemTime(new Date(2026, 7, 28)); // Aug 28, 2026
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-08-01",
      end_date: "2026-09-01",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return open for a market currently in season (December)", () => {
    vi.setSystemTime(new Date(2026, 11, 1)); // Dec 1, 2026
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01", "2026-12-02"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return closed after a market season", () => {
    vi.setSystemTime(new Date(2027, 0, 4)); // Jan 4, 2027
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
      end_date: "2027-01-03",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("closed");
  });

  it("should return unknown for unexpected date structure", () => {
    const dates = {
      raw: "...",
      type: "unknown",
    } as unknown as Dates;
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("unknown");
  });

  it("should handle Dates object (range type)", () => {
    vi.setSystemTime(new Date(2026, 7, 28));
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-08-01",
      end_date: "2026-09-01",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should handle Dates object (dates list type)", () => {
    vi.setSystemTime(new Date(2026, 7, 28));
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-08-28"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return upcoming for future Dates object", () => {
    vi.setSystemTime(new Date(2026, 7, 28));
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("upcoming");
  });
});

describe("getEarliestDate", () => {
  it("should return start_date for range type", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
    };
    const result = getEarliestDate(dates);
    expect(result.toISOString().split("T")[0]).toBe("2026-11-18");
  });

  it("should return earliest date for dates list type", () => {
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-05", "2026-12-01"],
    };
    const result = getEarliestDate(dates);
    expect(result.toISOString().split("T")[0]).toBe("2026-12-01");
  });
});

describe("isAllClosed", () => {
  it("should return false if at least one market is open", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: { raw: "", type: "range", end_date: "2026-12-01" },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
      {
        name: "B",
        address: "",
        dates: { raw: "", type: "range", end_date: "2026-12-31" },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 15)); // Dec 15
    expect(isAllClosed(markets, new Date())).toBe(false);
  });

  it("should return false if at least one market is upcoming", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: { raw: "", type: "range", start_date: "2027-01-01" },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 15)); // Dec 15
    expect(isAllClosed(markets, new Date())).toBe(false);
  });

  it("should return true if all markets are closed", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: { raw: "", type: "range", end_date: "2026-11-30" },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 1));
    expect(isAllClosed(markets, new Date())).toBe(true);
  });

  it("should ignore markets with invalid dates when checking if all closed", () => {
    const markets: Market[] = [
      {
        name: "Valid Market",
        address: "",
        dates: { raw: "", type: "range", end_date: "2026-01-01" },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
      {
        name: "Invalid Market",
        address: "",
        dates: { raw: "", type: "range" } as unknown as Dates,
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date("2026-08-28T12:00:00Z"));
    expect(isAllClosed(markets, new Date())).toBe(true);
  });
});
