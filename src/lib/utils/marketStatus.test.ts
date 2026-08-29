import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isMarketOpen, getFirstMentionedMonth } from "./marketStatus";

describe("isMarketOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 28)); // Aug 28, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return upcoming for a future date (November)", () => {
    const result = isMarketOpen("November 18, 2026 until January 03, 2027");
    expect(result.status).toBe("upcoming");
  });

  it("should return open for a current date (August)", () => {
    const result = isMarketOpen("August 01, 2026 until August 30, 2026");
    expect(result.status).toBe("open");
  });

  it("should return open for a market currently in season (December)", () => {
    vi.setSystemTime(new Date(2026, 11, 15));
    const result = isMarketOpen("November 18, 2026 until January 03, 2027");
    expect(result.status).toBe("open");
  });

  it("should return closed after a market season", () => {
    vi.setSystemTime(new Date(2027, 1, 15));
    const result = isMarketOpen("November 18, 2026 until January 03, 2027");
    expect(result.status).toBe("closed");
  });

  it("should return unknown for dates without month names", () => {
    const result = isMarketOpen("Not found");
    expect(result.status).toBe("unknown");
  });
});

describe("getFirstMentionedMonth", () => {
  it("should return the correct month index for a simple date", () => {
    expect(getFirstMentionedMonth("December 5 and 6, 2026")).toBe(11);
  });

  it("should find the earliest month in a range", () => {
    expect(
      getFirstMentionedMonth("November 18, 2026 until January 03, 2027"),
    ).toBe(10);
  });

  it("should return the first mentioned month even if out of chronological order", () => {
    expect(getFirstMentionedMonth("Starts in November, ends in October")).toBe(
      10,
    );
  });

  it("should return null if no month found", () => {
    expect(getFirstMentionedMonth("Dates TBA")).toBeNull();
  });
});
