import { statusInfo, type MarketStatus } from "./marketStatus";
import type { Market } from "$shared/types";

function escapeHtml(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPopup(market: Market, status: MarketStatus): string {
  const statusInfoObj = statusInfo(status);
  const name = escapeHtml(market.name);
  const address = escapeHtml(market.address);
  const datesRaw = market.dates?.raw
    ? escapeHtml(market.dates.raw)
    : "Check site";
  const url = escapeHtml(market.url);
  const description =
    market.description && market.description !== "Not found"
      ? `<div class="text-[13px] text-stone-600 mb-2 leading-relaxed italic border-b border-gold/20 pb-2">
									${escapeHtml(market.description)}
								</div>`
      : "";
  const openingTimes =
    market.opening_times === "Not found"
      ? '<span class="italic text-stone-400">Opening times to be announced</span>'
      : escapeHtml(market.opening_times);
  const admission =
    market.admission !== "Not found"
      ? `<div class="flex items-start gap-2 text-[13px] text-stone-700">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 1 7H6"/></svg>
									<span>${escapeHtml(market.admission)}</span>
								</div>`
      : "";

  return `
					<div class="w-[300px] bg-snow overflow-hidden font-sans border border-gold/40 rounded-xl">
						<div class="relative h-40">
							<img src="${escapeHtml(market.image_url)}" alt="${name}" loading="lazy" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusInfoObj.bg} ${statusInfoObj.color} border ${statusInfoObj.border}">
                ${statusInfoObj.label}
              </div>
							<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${name}</h3>
						</div>
						<div class="h-1 w-full bg-gradient-to-r from-pine via-gold to-berry"></div>
						<div class="p-4 space-y-2.5 bg-snow">
							${description}
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
								<span>${address}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
								<span class="font-medium text-pine">${datesRaw}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 flex-shrink-0 text-berry"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
								<span>${openingTimes}</span>
							</div>
							${admission}
							<a href="${url}" target="_blank" class="block text-center text-sm font-bold py-2.5 rounded-lg border border-gold/70">View details</a>
						</div>
					</div>
				`;
}
