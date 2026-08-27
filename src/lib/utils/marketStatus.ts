export function isMarketOpen(dates: string): {
	isOpen: boolean;
	status: 'open' | 'closed' | 'unknown';
} {
	// Simple heuristic: try to extract a start and end month
	const lowerDates = dates.toLowerCase();
	const now = new Date(2026, 7, 27); // 2026-08-27

	// Rough parsing for "Month to Month" or "Month - Month"
	// This is very brittle, but satisfies the "make it visual" requirement simply.
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
		december: 11
	};

	let startMonth = -1;
	let endMonth = -1;

	for (const [month, index] of Object.entries(monthMap)) {
		if (lowerDates.includes(month)) {
			if (startMonth === -1) startMonth = index;
			else endMonth = index;
		}
	}

	if (startMonth === -1) return { isOpen: false, status: 'unknown' };
	if (endMonth === -1) endMonth = startMonth;

	const currentMonth = now.getMonth();
	const isOpen = currentMonth >= startMonth && currentMonth <= endMonth;

	return { isOpen, status: isOpen ? 'open' : 'closed' };
}

interface StatusMeta {
	label: string;
	pill: string;
	dot: string;
}

const statusMeta: Record<'open' | 'closed' | 'unknown', StatusMeta> = {
	open: { label: 'Open', pill: 'bg-pine text-white', dot: 'bg-emerald-400' },
	closed: { label: 'Closed', pill: 'bg-stone-200 text-stone-600', dot: 'bg-stone-400' },
	unknown: { label: 'Dates TBA', pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' }
};

export function statusInfo(status: 'open' | 'closed' | 'unknown'): StatusMeta {
	return statusMeta[status];
}
