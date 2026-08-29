import type { Dates } from "../dateParser";

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

export function isMarketOpen(dates: Dates): {
  isOpen: boolean;
  status: "open" | "upcoming" | "closed" | "unknown";
} {
  const now = new Date();

  if (dates.type === "range" && dates.start_date && dates.end_date) {
    const start = new Date(dates.start_date);
    const end = new Date(dates.end_date);
    const isOpen = now >= start && now <= end;
    if (isOpen) return { isOpen: true, status: "open" };
    return { isOpen: false, status: now < start ? "upcoming" : "closed" };
  }
  // If dates are lists, we check if today is included
  if (dates.type === "dates" && dates.dates && dates.dates.length > 0) {
    const todayIso = now.toISOString().split("T")[0];
    const isOpen = dates.dates.includes(todayIso);
    if (isOpen) return { isOpen: true, status: "open" };
    return {
      isOpen: false,
      status: now < new Date(dates.dates[0]) ? "upcoming" : "closed",
    };
  }

  return { isOpen: false, status: "unknown" };
}

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const statusMeta: Record<
  "open" | "upcoming" | "closed" | "unknown",
  StatusMeta
> = {
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

export function statusInfo(
  status: "open" | "upcoming" | "closed" | "unknown",
): StatusMeta {
  return statusMeta[status];
}
