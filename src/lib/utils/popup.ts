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

/** One labeled info line: fixed-width icon column + evenly spaced content. */
function row(icon: string, content: string): string {
  return `<div class="flex items-start gap-3 text-[13px] leading-relaxed text-stone-800">
					<i class="fa-solid ${icon} mt-1 w-4 shrink-0 text-center text-[13px] leading-none text-stone-600" aria-hidden="true"></i>
					<span class="min-w-0 flex-1">${content}</span>
				</div>`;
}

export function buildPopup(market: Market, status: MarketStatus): string {
  const statusInfoObj = statusInfo(status);
  const name = escapeHtml(market.name);
  const address = escapeHtml(market.address);
  const url = escapeHtml(market.url);
  const dates = escapeHtml(market.dates?.raw ? market.dates.raw : "Check site");
  const description =
    market.description && market.description !== "Not found"
      ? `<div class="border-b border-gold/20 pb-3 text-[13px] italic leading-relaxed text-stone-700">${escapeHtml(
          market.description,
        )}</div>`
      : "";
  const openingTimes =
    market.opening_times === "Not found"
      ? '<span class="italic text-stone-500">Opening times to be announced</span>'
      : escapeHtml(market.opening_times);
  const hasAdmission =
    market.admission &&
    !["Not found", "Not yet known"].includes(market.admission);
  const admission = hasAdmission
    ? row("fa-euro-sign", escapeHtml(market.admission))
    : "";

  return `<div class="max-h-[80vh] overflow-y-auto rounded-2xl border-4 border-gold bg-snow font-sans shadow-2xl">
				<div class="relative h-40">
					<img src="${escapeHtml(market.image_url)}" alt="${name}" loading="lazy" class="h-full w-full object-cover" />
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
					<div class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/50 text-white border border-white/20">
						${statusInfoObj.label}
					</div>
					<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${name}</h3>
				</div>
				<div class="h-1 w-full bg-gradient-to-r from-pine via-gold to-berry"></div>
				<div class="space-y-3 p-4">
					${description}
					${row("fa-location-dot", address)}
					${row("fa-calendar-days", `<span class="font-medium text-pine">${dates}</span>`)}
					${row("fa-clock", openingTimes)}
					${admission}
					<div class="grid grid-cols-2 gap-2">
						<a href="https://www.google.com/maps/dir/?api=1&destination=${market.coordinates.lat},${market.coordinates.lng}" target="_blank" rel="noopener" class="block text-center text-sm font-bold py-2.5 rounded-lg bg-pine !text-white shadow-lg transition hover:bg-pine-dark"><i class="fa-solid fa-diamond-turn-right mr-1.5" aria-hidden="true"></i>Directions</a>
						<a href="${url}" target="_blank" rel="noopener" class="block text-center text-sm font-bold py-2.5 rounded-lg bg-gold !text-pine-dark shadow-lg transition hover:bg-gold-light">View details</a>
					</div>
				</div>
			</div>`;
}
