import * as chrono from "chrono-node";

export interface Dates {
  raw: string;
  type: "range" | "dates";
  start_date?: string | null;
  end_date?: string | null;
  dates?: string[];
}

export function parseDates(text: string): Dates | null {
  // Normalization: replace en-dash and " and " with hyphens
  text = text.replace(/–/g, "-").replace(/ and /gi, "-");

  // Extract year from text to use as a reference for chrono
  const yearMatch = text.match(/\d{4}/);
  const refYear = yearMatch
    ? parseInt(yearMatch[0], 10)
    : new Date().getFullYear();
  const referenceDate = new Date(refYear, 0, 1);

  // Detect type based on parentheses
  const isListType = text.includes("(") && text.includes(")");
  const listMatch = text.match(/\((.*?)\)/);

  // Parse the relevant part of the text
  const textToParse = isListType && listMatch ? listMatch[1] : text;
  const parsedResults = chrono.parse(textToParse, referenceDate);

  if (isListType) {
    // Extract all dates found in the string as absolute ISO dates
    const dateList = parsedResults.map(
      (res) => res.start.date().toISOString().split("T")[0],
    );

    // Remove duplicates
    const uniqueDates = Array.from(new Set(dateList)).sort();

    if (uniqueDates.length === 0) return null;

    return {
      raw: text,
      type: "dates",
      dates: uniqueDates,
    };
  }

  // Fallback to range parsing
  if (parsedResults.length > 0) {
    const res = parsedResults[0];
    const start_date = res.start.date().toISOString().split("T")[0];
    const end_date = res.end
      ? res.end.date().toISOString().split("T")[0]
      : start_date;

    return {
      raw: text,
      type: "range",
      start_date,
      end_date,
    };
  }

  return null;
}
