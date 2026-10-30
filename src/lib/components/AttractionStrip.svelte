<script lang="ts">
  // Compact, horizontally scrolling row of affiliate tour cards for the
  // drawer. Sits above the market list so it is seen without scrolling.
  import attractions from "../../../data/attractions.json";
  import type { Attraction } from "$shared/types";
  import {
    GYG_DRAWER_FEATURED_IDS,
    gygAffiliateUrl,
  } from "$lib/constants/getyourguide";

  const byId = new Map(
    (attractions as Attraction[]).map((attraction) => [
      attraction.id,
      attraction,
    ]),
  );
  const featured = GYG_DRAWER_FEATURED_IDS.flatMap((id) => byId.get(id) ?? []);
</script>

{#if __ENABLE_GYG_ATTRACTIONS__ && featured.length > 0}
  <section aria-labelledby="tours-heading">
    <div class="mb-2 flex items-end justify-between px-1">
      <h3 id="tours-heading" class="font-display font-bold text-ink-brand">
        Tours &amp; experiences
      </h3>
      <span
        class="text-[11px] font-medium uppercase tracking-wide text-stone-400"
        >Ad &middot; GetYourGuide</span
      >
    </div>
    <div
      class="drag-guard -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin"
    >
      <!-- External affiliate URLs, not SvelteKit routes. -->
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      {#each featured as attraction (attraction.id)}
        <a
          href={gygAffiliateUrl(attraction.url, "drawer-strip")}
          target="_blank"
          rel="noopener nofollow sponsored"
          class="group relative block h-24 w-36 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 shadow-xs transition hover:border-gold hover:shadow-md"
        >
          <img
            src={attraction.image_url}
            alt=""
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          ></div>
          <span
            class="absolute inset-x-2 bottom-1.5 line-clamp-2 text-[11px] font-bold leading-tight text-white drop-shadow"
          >
            {attraction.name}
          </span>
        </a>
      {/each}
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  </section>
{/if}
