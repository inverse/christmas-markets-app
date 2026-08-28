export function isMarketOpen(dates: string): {
	isOpen: boolean;
	status: 'open' | 'closed' | 'unknown';
} {
	const lowerDates = dates.toLowerCase();
	const now = new Date();

	const monthMap: Record<string, number> = {
		january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
		july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
	};

	// Find all months mentioned in the dates string, preserving order of appearance
	const foundMonths = [];
	for (const month of Object.keys(monthMap)) {
		const index = lowerDates.indexOf(month);
		if (index !== -1) {
			foundMonths.push({ index: index, monthIndex: monthMap[month] });
		}
	}

	if (foundMonths.length === 0) return { isOpen: false, status: 'unknown' };

	// Sort by appearance in string to know start and end
	foundMonths.sort((a, b) => a.index - b.index);
	const startMonth = foundMonths[0].monthIndex;
	const endMonth = foundMonths[foundMonths.length - 1].monthIndex;
	const currentMonth = now.getMonth();

	let isOpen = false;
	// Handle wrap-around (e.g., Nov to Jan: start 10, end 0)
	if (startMonth > endMonth) {
		isOpen = currentMonth >= startMonth || currentMonth <= endMonth;
	} else {
		isOpen = currentMonth >= startMonth && currentMonth <= endMonth;
	}

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
