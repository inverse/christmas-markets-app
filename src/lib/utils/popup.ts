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
  const hasAdmission =
    market.admission &&
    !["Not found", "Not yet known"].includes(market.admission);
  const admission = hasAdmission
    ? `<div class="flex items-start gap-2 text-[13px] text-stone-700">
									<i class="fa-solid fa-euro-sign fa-fw text-berry"></i>
									<span>${escapeHtml(market.admission)}</span>
								</div>`
    : "";

  return `
					<div class="w-[300px] bg-snow overflow-hidden font-sans border border-gold/40 rounded-xl">
						<div class="relative h-40">
							<img src="${escapeHtml(market.image_url)}" alt="${name}" loading="lazy" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/50 text-white border border-white/20">
                ${statusInfoObj.label}
              </div>
							<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${name}</h3>
						</div>
						<div class="h-1 w-full bg-gradient-to-r from-pine via-gold to-berry"></div>
						<div class="p-4 space-y-2.5 bg-snow">
							${description}
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
                <i class="fa-solid fa-location-dot fa-fw text-stone-400"></i>
								<span>${address}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
                <i class="fa-solid fa-calendar-days fa-fw text-stone-400"></i>
								<span class="font-medium text-pine">${datesRaw}</span>
							</div>
							<div class="flex items-start gap-2 text-[13px] text-stone-700">
                <i class="fa-solid fa-clock fa-fw text-stone-400"></i>
								<span>${openingTimes}</span>
							</div>
							${admission}
							<a href="${url}" target="_blank" class="block text-center text-sm font-bold py-2.5 rounded-lg bg-pine text-white hover:bg-pine-dark transition">View details</a>
						</div>
					</div>
				`;
}
