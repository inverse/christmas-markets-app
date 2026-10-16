import type { Dates } from "$shared/dateParser";
import type { Market } from "$shared/types";

export type MarketStatus = "open" | "upcoming" | "closed" | "unknown";

// Local calendar day as YYYY-MM-DD; the single source of "today" for status checks.
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type OpenResult = { isOpen: boolean; status: MarketStatus };

// Status of a single day against an inclusive date range, compared as
// local YYYY-MM-DD strings (never Date objects, which parse as UTC midnight).
function statusFromRange(
  today: string,
  start: string,
  end: string,
): OpenResult {
  if (today >= start && today <= end) {
    return { isOpen: true, status: "open" };
  }
  return { isOpen: false, status: today < start ? "upcoming" : "closed" };
}

// Status of a single day against a list of market days; the first entry
// is treated as the season start for the "upcoming" comparison.
function statusFromDates(today: string, list: string[]): OpenResult {
  if (list.includes(today)) {
    return { isOpen: true, status: "open" };
  }
  return { isOpen: false, status: today < list[0] ? "upcoming" : "closed" };
}

// A market is past when today falls after its range end (or start, if the
// end is unknown) or after the last entry of its date list. Unparseable
// dates count as past so they never keep the drawer "open".
function isMarketPast(m: Market, today: string): boolean {
  const dates = m.dates;
  if (!dates || (dates.type !== "range" && dates.type !== "dates")) {
    return true;
  }
  if (dates.type === "range") {
    if (dates.end_date) return today > dates.end_date;
    if (dates.start_date) return today > dates.start_date;
  }
  if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
    return today > dates.dates[dates.dates.length - 1];
  }
  return true;
}

export function isAllClosed(markets: Market[], now: Date): boolean {
  const today = toIsoDate(now);
  return markets.every((m) => isMarketPast(m, today));
}

// Status of a market on a YYYY-MM-DD day. Date lists are sorted by
// parseDates, so the first entry is the season start.
export function isMarketOpenOnDate(dates: Dates, day: string): OpenResult {
  if (dates.type === "range" && dates.start_date && dates.end_date) {
    return statusFromRange(day, dates.start_date, dates.end_date);
  }
  if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
    return statusFromDates(day, dates.dates);
  }
  return { isOpen: false, status: "unknown" };
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// Days a market can open on: a range contributes its start, a date list every
// entry. Missing or malformed dates contribute none.
function marketDays(dates: Dates | null | undefined): string[] {
  if (dates?.type === "range")
    return dates.start_date ? [dates.start_date] : [];
  if (dates?.type === "dates" && Array.isArray(dates.dates)) return dates.dates;
  return [];
}

// First and last listed day of a market; a range uses its start and end.
// Missing or malformed dates yield no bounds.
function marketBounds(dates: Dates | null | undefined): {
  first: string | null;
  last: string | null;
} {
  if (dates?.type === "range") {
    return { first: dates.start_date || null, last: dates.end_date || null };
  }
  if (dates?.type === "dates" && Array.isArray(dates.dates)) {
    const list = dates.dates;
    return { first: list[0] ?? null, last: list[list.length - 1] ?? null };
  }
  return { first: null, last: null };
}

// First day strictly after `day` on which any market opens, or null.
export function nextMarketDate(markets: Market[], day: string): string | null {
  let next: string | null = null;
  for (const { dates } of markets) {
    for (const date of marketDays(dates)) {
      if (date && date > day && (next === null || date < next)) next = date;
    }
  }
  return next;
}

// Earliest opening and latest closing day across all markets, or null.
export function seasonRange(
  markets: Market[],
): { start: string; end: string } | null {
  let start: string | null = null;
  let end: string | null = null;
  for (const { dates } of markets) {
    const { first, last } = marketBounds(dates);
    if (first && (start === null || first < start)) start = first;
    if (last && (end === null || last > end)) end = last;
  }
  return start && end ? { start, end } : null;
}

export function getEarliestDate(dates: Dates): Date {
  if (dates.type === "range" && dates.start_date) {
    return new Date(dates.start_date);
  }
  if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
    return new Date(Math.min(...dates.dates.map((d) => new Date(d).getTime())));
  }

  // Fallback if no valid dates - return very far future date
  return new Date(2099, 11, 31);
}

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const statusMeta: Record<MarketStatus, StatusMeta> = {
  open: {
    label: "Open",
    color: "text-ink-brand",
    bg: "bg-ink-brand/10",
    border: "border-ink-brand",
  },
  upcoming: {
    label: "Upcoming",
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold",
  },
  closed: {
    label: "Closed",
    color: "text-stone-500",
    bg: "bg-stone-500/10",
    border: "border-stone-300",
  },
  unknown: {
    label: "Check Web",
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold",
  },
};

export function statusInfo(status: MarketStatus): StatusMeta {
  return statusMeta[status];
}
