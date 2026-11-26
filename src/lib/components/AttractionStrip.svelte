<script lang="ts">
  // Horizontally scrolling row of affiliate tour cards for the drawer. Sits
  // above the market list so it is seen without scrolling. Every attraction
  // is shown - the data file's order is the curation - and the tall card
  // format carries a full title, one line of pitch and a visible "Tickets"
  // cue so the cards read as bookable, not decorative.
  import attractions from "../../../data/attractions.json";
  import type { Attraction, Locale } from "#shared/types";
  import { messages } from "#lib/i18n/messages";
  import { attractionText } from "#lib/i18n/attractions";
  import { gygAffiliateUrl } from "#lib/constants/getyourguide";

  let { locale }: { locale: Locale } = $props();
  const dict = $derived(messages(locale));

  const items = attractions as Attraction[];
</script>

{#if __ENABLE_GYG_ATTRACTIONS__}
  <section aria-labelledby="tours-heading">
    <div class="mb-2 flex items-end justify-between px-1">
      <h3
        id="tours-heading"
        class="font-sans text-lg font-bold tracking-tight text-ink-brand"
      >
        {dict.toursHeading}
      </h3>
      <span
        class="text-[11px] font-medium uppercase tracking-wide text-stone-400"
      >
        {dict.adDisclosure} &middot; GetYourGuide
      </span>
    </div>
    <div
      class="drag-guard -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin"
    >
      <!-- External affiliate URLs, not SvelteKit routes. -->
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      {#each items as attraction (attraction.id)}
        {@const copy = attractionText(attraction, locale)}
        <a
          href={gygAffiliateUrl(attraction.url, "drawer-strip")}
          target="_blank"
          rel="noopener nofollow sponsored"
          class="group relative block h-44 w-44 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 shadow-xs transition hover:border-gold hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          title={copy.name}
        >
          <img
            src={attraction.image_url}
            alt=""
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10"
          ></div>
          <span
            class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-pine-dark shadow"
          >
            <i class="fa-solid fa-ticket" aria-hidden="true"></i>
            {dict.tickets}
          </span>
          <span class="absolute inset-x-2 bottom-2">
            <span
              class="line-clamp-3 text-[12px] font-bold leading-snug text-white drop-shadow"
            >
              {copy.name}
            </span>
            <span
              class="mt-0.5 line-clamp-1 text-[10px] leading-tight text-white/80"
            >
              {copy.description}
            </span>
          </span>
        </a>
      {/each}
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  </section>
{/if}
