import { describe, it, expect } from "vitest";
import { parseDates } from "./dateParser";

describe("parseDates", () => {
  it("should parse simple date ranges", () => {
    const result = parseDates("December 4–6, 2026");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("range");
    expect(result!.start_date).toBe("2026-12-04");
    expect(result!.end_date).toBe("2026-12-06");
  });

  it("should parse simple lists of dates", () => {
    const result = parseDates("Dates (December 1, 2026, December 2, 2026)");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("dates");
    expect(result!.dates).toEqual(["2026-12-01", "2026-12-02"]);
  });

  it("should parse multi-year ranges", () => {
    const result = parseDates("November 18, 2026 until January 03, 2027");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("range");
    expect(result!.start_date).toBe("2026-11-18");
    expect(result!.end_date).toBe("2027-01-03");
  });

  it("should return null for unparseable dates", () => {
    const result = parseDates("Not a date");
    expect(result).toBeNull();
  });
});
