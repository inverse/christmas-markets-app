import * as chrono from "chrono-node";

export type Dates =
  | {
      raw: string;
      type: "range";
      start_date: string;
      end_date: string;
    }
  | {
      raw: string;
      type: "dates";
      dates: string[];
    };

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function expandRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  const endMs = new Date(end).setUTCHours(0, 0, 0, 0);
  while (cur.getTime() <= endMs) {
    dates.push(isoDate(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

const MONTH_NAMES = [
  ["january", "januar"],
  ["february", "februar"],
  ["march", "märz", "maerz"],
  ["april"],
  ["may", "mai"],
  ["june", "juni"],
  ["july", "juli"],
  ["august"],
  ["september"],
  ["october", "oktober"],
  ["november"],
  ["december", "dezember"],
];

function monthNumber(name: string): number {
  const n = name.toLowerCase();
  return MONTH_NAMES.findIndex((names) => names.includes(n)) + 1;
}

interface DayToken {
  days: number[];
  month: number | null;
  dayFirst: boolean;
}

// "4", "4 to 6", "4 bis 6", "4-6"
const DAYS = String.raw`(\d{1,2})(?:\s*(?:to|bis|-|–)\s*(\d{1,2}))?`;
const DAY_FIRST = new RegExp(String.raw`^${DAYS}\s+([a-zäöü]+)$`, "i");
const MONTH_FIRST = new RegExp(String.raw`^([a-zäöü]+)\s+${DAYS}$`, "i");
const BARE_DAYS = new RegExp(`^${DAYS}$`);

function dayRange(from: string, to: string | undefined): number[] {
  const start = parseInt(from, 10);
  const end = to ? parseInt(to, 10) : start;
  return Array.from(
    { length: Math.max(end - start + 1, 0) },
    (_, i) => start + i,
  );
}

// Parses English or German day lists such as
// "29 November, 6, 13 and 20 December 2026",
// "November 28 and 29, December 5, 6, 2026",
// "November 27 to 29, December 4 to 6, 11 to 13, and 18 to 20" or
// "27. bis 29. November, 04. bis 06. sowie 11. bis 13. Dezember".
// A bare day binds to the month that follows it when that month is written
// day-first ("20 December"), otherwise to the month that precedes it
// ("November 28 and 29"). Returns exact days, never a range.
function parseDayList(text: string, year: string): string[] | null {
  const parts = text
    .replace(/\d{4}/g, "")
    .replace(/(\d)\./g, "$1")
    .split(/,|\b(?:and|und|sowie)\b|as well as/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const tokens: DayToken[] = [];
  for (const p of parts) {
    const df = p.match(DAY_FIRST);
    const mf = df ? null : p.match(MONTH_FIRST);
    const bare = df || mf ? null : p.match(BARE_DAYS);
    const m = df ?? mf ?? bare;
    if (!m) return null;
    const [from, to, name] = df
      ? [df[1], df[2], df[3]]
      : mf
        ? [mf[2], mf[3], mf[1]]
        : [m[1], m[2], undefined];
    const month = name ? monthNumber(name) : null;
    const days = dayRange(from, to);
    if ((name && !month) || days.length === 0) return null;
    tokens.push({ days, month, dayFirst: !!df });
  }

  const dates = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    let month = tokens[i].month;
    if (!month) {
      const next = tokens.slice(i + 1).find((t) => t.month);
      const prev = tokens
        .slice(0, i)
        .reverse()
        .find((t) => t.month);
      month = (next?.dayFirst ? next.month : (prev ?? next)?.month) ?? null;
    }
    if (!month) return null;
    for (const day of tokens[i].days) {
      dates.add(
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
  }
  return dates.size ? [...dates].sort() : null;
}

export function parseDates(raw: string): Dates | null {
  // --- Semicolon pattern: "range; closed on date and date" ---
  if (raw.includes(";")) {
    const [rangePart, ...restParts] = raw.split(";");
    const restText = restParts.join(";");

    const closedMatch =
      restText.match(/closed\s+on\s+(.+)/i) ||
      restText.match(/geschlossen\s+am\s+(.+)/i);

    if (closedMatch) {
      // Parse the range segment (normalize en-dash only, NOT " and ")
      const rangeNorm = rangePart.trim().replace(/–/g, "-");
      const yearMatch = rangeNorm.match(/\d{4}/);
      const refYear = yearMatch
        ? parseInt(yearMatch[0], 10)
        : new Date().getFullYear();
      const referenceDate = new Date(refYear, 10, 1);

      const rangeResults = chrono.parse(rangeNorm, referenceDate);
      if (rangeResults.length === 0) return null;

      const rangeRes = rangeResults[0];
      const startDate = rangeRes.start.date();
      const endDate = rangeRes.end ? rangeRes.end.date() : startDate;
      const allDays = expandRange(startDate, endDate);

      // Parse excluded dates from "closed on <phrase>"
      // Strip parenthesised holiday names before passing to chrono
      const closedPhrase = closedMatch[1].replace(/\([^)]*\)/g, "").trim();
      // Normalize " and " to comma-separated for chrono
      const closedNorm = closedPhrase.replace(/ and /gi, " , ");
      const excludeResults = chrono.parse(closedNorm, referenceDate);
      const excluded = new Set(
        excludeResults.map((r) => isoDate(r.start.date())),
      );

      const dates = allDays.filter((d) => !excluded.has(d));
      return { raw, type: "dates", dates };
    }
  }

  // Detect if text contains a parenthesised list (Advent-style)
  const isListType = raw.includes("(") && raw.includes(")");

  if (isListType) {
    const inner = raw.match(/\((.*?)\)/)?.[1];
    const year = raw.match(/\d{4}/)?.[0];
    const list = inner && year ? parseDayList(inner, year) : null;
    if (!list) return null;
    return { raw, type: "dates", dates: list };
  }

  // "X and Y" lists exactly those days, e.g. "November 19 and December 3, 2026"
  const year = raw.match(/\d{4}/)?.[0];
  if (year && /\b(?:and|und)\b/i.test(raw)) {
    const list = parseDayList(raw, year);
    if (list) return { raw, type: "dates", dates: list };
  }

  // General range/date parsing; chrono's German parser is the fallback
  const text = raw.replace(/–/g, "-");
  const refYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const referenceDate = new Date(refYear, 10, 1);

  const english = chrono.parse(text, referenceDate);
  const parsedResults = english.length
    ? english
    : chrono.de.parse(text, referenceDate);
  if (parsedResults.length === 0) return null;

  const res = parsedResults[0];
  const start_date = isoDate(res.start.date());
  // "to February 2027" has no day: the range ends on the 1st of that month
  const end_date = !res.end
    ? start_date
    : res.end.isCertain("day")
      ? isoDate(res.end.date())
      : `${res.end.get("year")}-${String(res.end.get("month")).padStart(2, "0")}-01`;

  return { raw, type: "range", start_date, end_date };
}
