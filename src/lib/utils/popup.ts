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

  return `<div class="max-h-[80vh] overflow-y-auto rounded-2xl border-4 border-gold bg-surface font-sans shadow-2xl">
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
        ${row("fa-calendar-days", `<span class="font-medium text-ink-brand">${dates}</span>`)}
					${row("fa-clock", openingTimes)}
					${admission}
					<div class="grid grid-cols-2 gap-2">
						<a href="https://www.google.com/maps/dir/?api=1&destination=${market.coordinates.lat},${market.coordinates.lng}" target="_blank" rel="noopener" class="block text-center text-sm font-bold py-2.5 rounded-lg bg-pine !text-white shadow-lg transition hover:bg-pine-dark"><i class="fa-solid fa-diamond-turn-right mr-1.5" aria-hidden="true"></i>Directions</a>
						<a href="${url}" target="_blank" rel="noopener" class="block text-center text-sm font-bold py-2.5 rounded-lg bg-gold !text-pine-dark shadow-lg transition hover:bg-gold-light">View details</a>
					</div>
				</div>
			</div>`;
}

export interface NearestMarket {
  name: string;
  distanceMeters: number;
}

function formatDistance(meters: number): string {
  return meters < 950
    ? `${Math.round(meters / 10) * 10} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

/** Compact "you are here" card for the blue star marker: same chrome language
    as the market popups, with the locator accent and no photo header. */
export function buildUserPopup(nearest: NearestMarket | null): string {
  const nearestLine = nearest
    ? `Nearest market: <span class="font-semibold text-ink-brand">${escapeHtml(nearest.name)}</span> &middot; ${formatDistance(nearest.distanceMeters)}`
    : "No market data loaded yet.";

  return `<div class="rounded-2xl border-2 border-locator/70 bg-surface font-sans shadow-2xl ring-4 ring-locator/15">
				<div class="flex items-center gap-3 py-3 pl-4 pr-11">
					<span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-locator bg-locator/10">
						<svg viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-locator" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
					</span>
					<div class="min-w-0">
						<h3 class="font-display text-base font-bold leading-tight text-ink-brand">You are here</h3>
						<p class="mt-1 text-[12px] leading-snug text-stone-600">${nearestLine}</p>
					</div>
				</div>
			</div>`;
}
