import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Dates } from "../dateParser";
import { isMarketOpen, getEarliestDate } from "./marketStatus";

describe("isMarketOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 28)); // Aug 28, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return upcoming for a future date (November)", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
      end_date: "2027-01-03",
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("upcoming");
  });

  it("should return open for a current date (August)", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-08-01",
      end_date: "2026-08-30",
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("open");
  });

  it("should return open for a market currently in season (December)", () => {
    vi.setSystemTime(new Date(2026, 11, 15));
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
      end_date: "2027-01-03",
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("open");
  });

  it("should return closed after a market season", () => {
    vi.setSystemTime(new Date(2027, 1, 15));
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
      end_date: "2027-01-03",
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("closed");
  });

  it("should return unknown for unexpected date structure", () => {
    // This case now hits the "unknown" fallback if dates are not valid
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: null,
      end_date: null,
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("unknown");
  });

  it("should handle Dates object (range type)", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-08-01",
      end_date: "2026-08-30",
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("open");
  });

  it("should handle Dates object (dates list type)", () => {
    const today = new Date().toISOString().split("T")[0];
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: [today],
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("open");
  });

  it("should return upcoming for future Dates object", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-12-01",
      end_date: "2026-12-31",
    };
    const result = isMarketOpen(dates);
    expect(result.status).toBe("upcoming");
  });
});

describe("getEarliestDate", () => {
  it("should return start_date for range type", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-08-01",
      end_date: "2026-08-30",
    };
    const result = getEarliestDate(dates);
    expect(result.toISOString().split("T")[0]).toBe("2026-08-01");
  });

  it("should return earliest date for dates list type", () => {
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-09-01", "2026-08-28"],
    };
    const result = getEarliestDate(dates);
    expect(result.toISOString().split("T")[0]).toBe("2026-08-28");
  });
});
