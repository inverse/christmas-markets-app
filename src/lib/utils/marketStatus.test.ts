import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Dates } from "$shared/dateParser";
import {
  isMarketOpen,
  isMarketOpenOnDate,
  getEarliestDate,
  isAllClosed,
  isValidIsoDate,
  nextMarketDate,
  seasonRange,
} from "./marketStatus";
import type { Market } from "$shared/types";

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

  it("should return open on the last day of the range at end of day", () => {
    vi.setSystemTime(new Date(2026, 11, 24, 23, 30)); // Dec 24, 2026 23:30
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-12-01",
      end_date: "2026-12-24",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return open on the first day of the range at start of day", () => {
    vi.setSystemTime(new Date(2026, 11, 1, 0, 0)); // Dec 1, 2026 00:00
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-12-01",
      end_date: "2026-12-24",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return closed the day after the range ends", () => {
    vi.setSystemTime(new Date(2026, 11, 25, 0, 30)); // Dec 25, 2026 00:30
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-12-01",
      end_date: "2026-12-24",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("closed");
  });

  it("should return upcoming on the day before the range starts", () => {
    vi.setSystemTime(new Date(2026, 10, 30, 23, 30)); // Nov 30, 2026 23:30
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-12-01",
      end_date: "2026-12-24",
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("upcoming");
  });

  it("should return open on the first date of a dates list at start of day", () => {
    vi.setSystemTime(new Date(2026, 11, 1, 0, 0)); // Dec 1, 2026 00:00
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01", "2026-12-05"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return open on the last date of a dates list at end of day", () => {
    vi.setSystemTime(new Date(2026, 11, 5, 23, 30)); // Dec 5, 2026 23:30
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01", "2026-12-05"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("open");
  });

  it("should return closed the day after the last date of a dates list", () => {
    vi.setSystemTime(new Date(2026, 11, 6, 0, 30)); // Dec 6, 2026 00:30
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01", "2026-12-05"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("closed");
  });

  it("should return upcoming before the first date of a dates list", () => {
    vi.setSystemTime(new Date(2026, 10, 30, 23, 30)); // Nov 30, 2026 23:30
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01", "2026-12-05"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("upcoming");
  });

  it("should return closed between two dates of a dates list", () => {
    vi.setSystemTime(new Date(2026, 11, 3, 12, 0)); // Dec 3, 2026 noon
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: ["2026-12-01", "2026-12-05"],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("closed");
  });

  it("should return unknown for an empty dates list", () => {
    const dates: Dates = {
      raw: "...",
      type: "dates",
      dates: [],
    };
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("unknown");
  });

  it("should return unknown for a range missing end_date", () => {
    const dates = {
      raw: "...",
      type: "range",
      start_date: "2026-12-01",
    } as unknown as Dates;
    const result = isMarketOpen(dates, new Date());
    expect(result.status).toBe("unknown");
  });
});

describe("getEarliestDate", () => {
  it("should return start_date for range type", () => {
    const dates: Dates = {
      raw: "...",
      type: "range",
      start_date: "2026-11-18",
      end_date: "2026-11-19",
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
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-11-30",
          end_date: "2026-12-01",
        },
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
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-12-01",
          end_date: "2026-12-31",
        },
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
        dates: {
          raw: "",
          type: "range",
          start_date: "2027-01-01",
          end_date: "2027-01-02",
        },
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
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-11-01",
          end_date: "2026-11-30",
        },
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

  it("should not close a market whose end_date is today (Dec 24 noon)", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-12-01",
          end_date: "2026-12-24",
        },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 24, 12, 0)); // Dec 24, 2026 noon
    expect(isAllClosed(markets, new Date())).toBe(false);
  });

  it("should close a market the day after its end_date (Dec 25)", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-12-01",
          end_date: "2026-12-24",
        },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 25, 12, 0)); // Dec 25, 2026 noon
    expect(isAllClosed(markets, new Date())).toBe(true);
  });

  it("should ignore markets with invalid dates when checking if all closed", () => {
    const markets: Market[] = [
      {
        name: "Valid Market",
        address: "",
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-01-01",
          end_date: "2026-01-02",
        },
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
    vi.setSystemTime(new Date(2026, 7, 28, 12, 0)); // Aug 28, 2026 noon (local)
    expect(isAllClosed(markets, new Date())).toBe(true);
  });

  it("should not close a dates-list market on its last date", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: {
          raw: "",
          type: "dates",
          dates: ["2026-12-01", "2026-12-24"],
        },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 24, 12, 0)); // Dec 24, 2026 noon
    expect(isAllClosed(markets, new Date())).toBe(false);
  });

  it("should close a dates-list market the day after its last date", () => {
    const markets: Market[] = [
      {
        name: "A",
        address: "",
        dates: {
          raw: "",
          type: "dates",
          dates: ["2026-12-01", "2026-12-24"],
        },
        image_url: "",
        coordinates: { lat: 0, lng: 0 },
        url: "",
        opening_times: "",
        admission: "",
        description: "",
      },
    ];
    vi.setSystemTime(new Date(2026, 11, 25, 12, 0)); // Dec 25, 2026 noon
    expect(isAllClosed(markets, new Date())).toBe(true);
  });

  it("should treat a range with no start or end date as closed", () => {
    const markets: Market[] = [
      {
        name: "A",
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
    vi.setSystemTime(new Date(2026, 11, 15)); // Dec 15
    expect(isAllClosed(markets, new Date())).toBe(true);
  });

  it("should return true for an empty markets list", () => {
    vi.setSystemTime(new Date(2026, 11, 15)); // Dec 15
    expect(isAllClosed([], new Date())).toBe(true);
  });
});

describe("isMarketOpenOnDate", () => {
  const range: Dates = {
    raw: "",
    type: "range",
    start_date: "2026-12-01",
    end_date: "2026-12-24",
  };
  const listed: Dates = {
    raw: "",
    type: "dates",
    dates: ["2026-11-29", "2026-12-20"],
  };

  it("treats range boundaries as inclusive", () => {
    expect(isMarketOpenOnDate(range, "2026-11-30").status).toBe("upcoming");
    expect(isMarketOpenOnDate(range, "2026-12-01").status).toBe("open");
    expect(isMarketOpenOnDate(range, "2026-12-24").status).toBe("open");
    expect(isMarketOpenOnDate(range, "2026-12-25").status).toBe("closed");
  });

  it("is open only on listed days", () => {
    expect(isMarketOpenOnDate(listed, "2026-11-28").status).toBe("upcoming");
    expect(isMarketOpenOnDate(listed, "2026-12-20").status).toBe("open");
    expect(isMarketOpenOnDate(listed, "2026-12-19").status).toBe("closed");
  });
});

describe("isValidIsoDate", () => {
  it("accepts real calendar days only", () => {
    expect(isValidIsoDate("2026-12-31")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2026-12-1")).toBe(false);
    expect(isValidIsoDate("all")).toBe(false);
  });

  it("accepts well-formed days and rejects malformed or impossible ones", () => {
    expect(isValidIsoDate("2026-12-01")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-1-01")).toBe(false);
    expect(isValidIsoDate("abc")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });
});

describe("season planning", () => {
  const markets = [
    {
      name: "Listed",
      dates: { raw: "", type: "dates", dates: ["2026-11-29", "2026-12-20"] },
    },
    {
      name: "Range",
      dates: {
        raw: "",
        type: "range",
        start_date: "2026-12-05",
        end_date: "2027-01-03",
      },
    },
  ] as Market[];

  it("finds the next opening strictly after the day", () => {
    expect(nextMarketDate(markets, "2026-12-01")).toBe("2026-12-05");
    expect(nextMarketDate(markets, "2026-12-05")).toBe("2026-12-20");
    expect(nextMarketDate(markets, "2026-12-20")).toBeNull();
  });

  it("spans the earliest opening to the latest closing", () => {
    expect(seasonRange(markets)).toEqual({
      start: "2026-11-29",
      end: "2027-01-03",
    });
    expect(seasonRange([])).toBeNull();
  });

  it("returns null for nextMarketDate when no markets are given", () => {
    expect(nextMarketDate([], "2026-12-01")).toBeNull();
  });

  it("uses only the start of a range for nextMarketDate", () => {
    const range = [
      {
        name: "Range",
        dates: {
          raw: "",
          type: "range",
          start_date: "2026-12-05",
          end_date: "2027-01-03",
        },
      },
    ] as Market[];
    expect(nextMarketDate(range, "2026-11-01")).toBe("2026-12-05");
    expect(nextMarketDate(range, "2026-12-05")).toBeNull();
  });

  it("ignores markets with missing dates without throwing", () => {
    const withMissing = [
      { name: "Null dates", dates: null },
      { name: "Undefined dates" },
      ...markets,
    ] as unknown as Market[];
    expect(nextMarketDate(withMissing, "2026-12-01")).toBe("2026-12-05");
    expect(seasonRange(withMissing)).toEqual({
      start: "2026-11-29",
      end: "2027-01-03",
    });
  });

  it("returns null for seasonRange when no market has dates", () => {
    const undated = [
      { name: "Null dates", dates: null },
      { name: "Undefined dates" },
    ] as unknown as Market[];
    expect(seasonRange(undated)).toBeNull();
  });
});
