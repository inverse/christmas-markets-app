import { describe, it, expect } from "vitest";
import { parseDates } from "./dateParser";

describe("parseDates", () => {
  it("should parse simple date ranges", () => {
    const result = parseDates("December 4–6, 2026");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("range");
    if (result!.type === "range") {
      expect(result!.start_date).toBe("2026-12-04");
      expect(result!.end_date).toBe("2026-12-06");
    }
  });

  it("should parse simple lists of dates", () => {
    const result = parseDates("Dates (December 1, 2026, December 2, 2026)");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("dates");
    if (result!.type === "dates") {
      expect(result!.dates).toEqual(["2026-12-01", "2026-12-02"]);
    }
  });

  it("should parse multi-year ranges", () => {
    const result = parseDates("November 18, 2026 until January 03, 2027");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("range");
    if (result!.type === "range") {
      expect(result!.start_date).toBe("2026-11-18");
      expect(result!.end_date).toBe("2027-01-03");
    }
  });

  it("should return null for unparseable dates", () => {
    const result = parseDates("Not a date");
    expect(result).toBeNull();
  });

  it("should parse Advent Sunday list without breaking on 'and' inside parens", () => {
    const result = parseDates(
      "On all Sundays in Advent 2026 (29 November, 6, 13 and 20 December 2026)",
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe("dates");
    if (result!.type === "dates") {
      expect(result!.dates).toEqual([
        "2026-11-29",
        "2026-12-06",
        "2026-12-13",
        "2026-12-20",
      ]);
    }
  });

  it("should parse range with closed-day exclusions", () => {
    const result = parseDates(
      "November 4 to December 23, 2026; closed on November 15 (Remembrance Day) and November 22 (All Souls' Day)",
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe("dates");
    if (result!.type === "dates") {
      expect(result!.dates).not.toContain("2026-11-15");
      expect(result!.dates).not.toContain("2026-11-22");
      expect(result!.dates).toContain("2026-11-04");
      expect(result!.dates).toContain("2026-12-23");
      // Nov 4–Dec 23 = 50 days; minus 2 excluded = 48
      expect(result!.dates).toHaveLength(48);
    }
  });

  it("should parse month-first lists spanning months with the year outside the parens", () => {
    const result = parseDates(
      "On the first three Advent weekends in 2026 (November 28 and 29, December 05, 06, 12, and 13)",
    );
    expect(result).toEqual({
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
    });
  });

  it("should parse day ranges inside a month-first list", () => {
    const result = parseDates(
      "On all Advent weekends in 2026 (November 27 to 29, December 4 to 6, 11 to 13, and 18 to 20)",
    );
    expect(result!.type).toBe("dates");
    if (result!.type === "dates") {
      expect(result!.dates).toEqual([
        "2026-11-27",
        "2026-11-28",
        "2026-11-29",
        "2026-12-04",
        "2026-12-05",
        "2026-12-06",
        "2026-12-11",
        "2026-12-12",
        "2026-12-13",
        "2026-12-18",
        "2026-12-19",
        "2026-12-20",
      ]);
    }
  });

  it("should bind day ranges to a trailing day-first month", () => {
    const result = parseDates(
      "On the second and third weekends of Advent in 2026 (4 to 6 and 11 to 13 December)",
    );
    expect(result).toMatchObject({
      type: "dates",
      dates: [
        "2026-12-04",
        "2026-12-05",
        "2026-12-06",
        "2026-12-11",
        "2026-12-12",
        "2026-12-13",
      ],
    });
  });

  it("should parse German day lists", () => {
    const result = parseDates(
      "An allen Adventswochenenden 2026 (27. bis 29. November, 04. bis 06., 11. bis 13. sowie 18. bis 20. Dezember)",
    );
    expect(result!.type).toBe("dates");
    if (result!.type === "dates") {
      expect(result!.dates).toHaveLength(12);
      expect(result!.dates[0]).toBe("2026-11-27");
      expect(result!.dates[11]).toBe("2026-12-20");
    }
  });

  it("should parse a single German date", () => {
    expect(parseDates("6. Dezember 2026")).toMatchObject({
      type: "range",
      start_date: "2026-12-06",
      end_date: "2026-12-06",
    });
  });

  it("should list exactly the two days of 'X and Y' across months", () => {
    const result = parseDates("November 19 and December 3, 2026");
    expect(result).toEqual({
      raw: "November 19 and December 3, 2026",
      type: "dates",
      dates: ["2026-11-19", "2026-12-03"],
    });
  });

  it("should end a range on the 1st when only the end month is given", () => {
    expect(parseDates("November 6, 2026 to February 2027")).toMatchObject({
      type: "range",
      start_date: "2026-11-06",
      end_date: "2027-02-01",
    });
  });
});
