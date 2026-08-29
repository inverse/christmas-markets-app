export function getFirstMentionedMonth(dates: string): number | null {
  const lowerDates = dates.toLowerCase();
  const foundMonths = getFoundMonths(lowerDates);
  if (foundMonths.length === 0) return null;
  foundMonths.sort((a, b) => a.index - b.index);
  return foundMonths[0].monthIndex;
}

function getFoundMonths(lowerDates: string) {
  const monthMap: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  const foundMonths = [];
  for (const month of Object.keys(monthMap)) {
    const index = lowerDates.indexOf(month);
    if (index !== -1) {
      foundMonths.push({ index: index, monthIndex: monthMap[month] });
    }
  }
  return foundMonths;
}

export function isMarketOpen(dates: string): {
  isOpen: boolean;
  status: "open" | "upcoming" | "closed" | "unknown";
} {
  const now = new Date();
  const foundMonths = getFoundMonths(dates.toLowerCase());

  if (foundMonths.length === 0) return { isOpen: false, status: "unknown" };

  foundMonths.sort((a, b) => a.index - b.index);
  const startMonth = foundMonths[0].monthIndex;
  const endMonth = foundMonths[foundMonths.length - 1].monthIndex;
  const currentMonth = now.getMonth();

  const isOpen =
    startMonth > endMonth
      ? currentMonth >= startMonth || currentMonth <= endMonth
      : currentMonth >= startMonth && currentMonth <= endMonth;

  if (isOpen) return { isOpen: true, status: "open" };

  const isUpcoming =
    currentMonth < startMonth &&
    (currentMonth >= 7 || currentMonth >= startMonth - 3);
  return { isOpen: false, status: isUpcoming ? "upcoming" : "closed" };
}

interface StatusMeta {
  label: string;
  pill: string;
  dot: string;
  accent: string;
}

const statusMeta: Record<
  "open" | "upcoming" | "closed" | "unknown",
  StatusMeta
> = {
  open: {
    label: "Open now",
    pill: "bg-pine text-white",
    dot: "bg-emerald-400",
    accent: "border-l-pine",
  },
  upcoming: {
    label: "Upcoming",
    pill: "bg-gold-light text-pine",
    dot: "bg-gold-dark",
    accent: "border-l-gold",
  },
  closed: {
    label: "Closed",
    pill: "bg-stone-200 text-stone-600",
    dot: "bg-stone-400",
    accent: "border-l-stone-300",
  },
  unknown: {
    label: "Dates TBA",
    pill: "bg-amber-100 text-amber-800",
    dot: "bg-amber-400",
    accent: "border-l-amber-400",
  },
};

export function statusInfo(
  status: "open" | "upcoming" | "closed" | "unknown",
): StatusMeta {
  return statusMeta[status];
}
