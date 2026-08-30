import type { Dates } from "$shared/dateParser";
import type { Market } from "$shared/types";

export type MarketStatus = "open" | "upcoming" | "closed" | "unknown";

export function isAllClosed(markets: Market[], now: Date): boolean {
  return markets.every((m) => {
    const dates = m.dates;
    if (!dates || (dates.type !== "range" && dates.type !== "dates")) {
      return true;
    }
    if (dates.type === "range") {
      if (dates.end_date) return now > new Date(dates.end_date);
      if (dates.start_date) return now > new Date(dates.start_date);
    }
    if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
      return now > new Date(dates.dates[dates.dates.length - 1]);
    }
    return true;
  });
}

export function isMarketOpen(
  dates: Dates,
  now: Date,
): {
  isOpen: boolean;
  status: MarketStatus;
} {
  if (dates.type === "range" && dates.start_date && dates.end_date) {
    const start = new Date(dates.start_date);
    const end = new Date(dates.end_date);
    const isOpen = now >= start && now <= end;
    if (isOpen) return { isOpen: true, status: "open" };
    return { isOpen: false, status: now < start ? "upcoming" : "closed" };
  }
  if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isOpen = dates.dates.includes(todayIso);
    if (isOpen) return { isOpen: true, status: "open" };
    return {
      isOpen: false,
      status: now < new Date(dates.dates[0]) ? "upcoming" : "closed",
    };
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
    color: "text-pine",
    bg: "bg-pine/10",
    border: "border-pine",
  },
  upcoming: {
    label: "Upcoming",
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold",
  },
  closed: {
    label: "Closed",
    color: "text-pine/50",
    bg: "bg-pine/5",
    border: "border-pine/20",
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
