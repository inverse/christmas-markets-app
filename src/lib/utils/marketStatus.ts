import type { Dates } from "$shared/dateParser";
import type { Market } from "$shared/types";

export type MarketStatus = "open" | "upcoming" | "closed" | "unknown";

function toIso(d: Date): string {
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
  const today = toIso(now);
  return markets.every((m) => isMarketPast(m, today));
}

export function isMarketOpen(dates: Dates, now: Date): OpenResult {
  const today = toIso(now);
  if (dates.type === "range" && dates.start_date && dates.end_date) {
    return statusFromRange(today, dates.start_date, dates.end_date);
  }
  if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
    return statusFromDates(today, dates.dates);
  }
  return { isOpen: false, status: "unknown" };
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
