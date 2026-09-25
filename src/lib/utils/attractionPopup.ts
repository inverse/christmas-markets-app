import { escapeHtml } from "./popup";

/**
 * Compact "attraction card" for GetYourGuide markers: same visual language as
 * the market popups (photo header, gold accent, bold CTA), affiliate-linked.
 */
export function buildAttractionPopup(attraction: {
  name: string;
  image_url: string;
  description: string;
  url: string;
}): string {
  const name = escapeHtml(attraction.name);
  const description = escapeHtml(attraction.description);
  const image = escapeHtml(attraction.image_url);
  const url = escapeHtml(attraction.url);

  return `<div class="max-h-[80vh] overflow-y-auto rounded-2xl border-4 border-gold bg-surface font-sans shadow-2xl">
				<div class="relative h-40">
					<img src="${image}" alt="${name}" loading="lazy" class="h-full w-full object-cover" />
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
					<div class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/50 text-white border border-white/20">
						Ad &middot; GetYourGuide
					</div>
					<h3 class="absolute bottom-3 left-3 right-10 text-white font-display text-lg font-bold leading-tight drop-shadow line-clamp-2">${name}</h3>
				</div>
				<div class="h-1 w-full bg-gradient-to-r from-pine via-gold to-berry"></div>
				<div class="space-y-3 p-4">
					<div class="text-[13px] italic leading-relaxed text-stone-700">${description}</div>
					<a href="${url}" target="_blank" rel="noopener nofollow sponsored" class="block text-center text-sm font-bold py-2.5 rounded-lg bg-gold !text-pine-dark shadow-lg transition hover:bg-gold-light"><i class="fa-solid fa-ticket mr-1.5" aria-hidden="true"></i>Book activities</a>
				</div>
			</div>`;
}
