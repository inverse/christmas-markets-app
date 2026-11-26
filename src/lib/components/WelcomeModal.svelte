<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import type { Locale } from "#shared/types";
  import { messages, interpolate } from "#lib/i18n/messages";
  import Snowfall from "#lib/components/Snowfall.svelte";
  import { containFocus } from "#lib/actions/containFocus";

  let {
    onClose,
    locale,
    daysUntilFirstMarket,
    marketCount,
    anyMarketOpen,
    allMarketsClosed,
  }: {
    onClose: () => void;
    locale: Locale;
    daysUntilFirstMarket?: number;
    marketCount: number;
    anyMarketOpen: boolean;
    allMarketsClosed: boolean;
  } = $props();

  const dict = $derived(messages(locale));

  // Keep the card's entrance animation off for reduced-motion users; the
  // overlay fade matches the other modals.
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-pine-dark/80"
  transition:fade
  role="presentation"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
>
  <Snowfall />

  <div
    role="dialog"
    tabindex="-1"
    use:containFocus
    aria-modal="true"
    aria-labelledby="welcome-title"
    class="festive-surface fairy-lights relative w-full max-w-sm rounded-2xl border-4 border-gold shadow-2xl"
    in:fly={reduceMotion ? { duration: 0 } : { y: 24, duration: 350 }}
  >
    <button
      onclick={onClose}
      aria-label={dict.welcomeCloseModal}
      class="absolute right-3 top-3 z-10 rounded-full bg-surface/90 p-1 text-stone-400 shadow hover:text-stone-700 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        class="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>

    <div
      class="relative max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-2xl p-6 scrollbar-thin"
    >
      <div
        class="pointer-events-none absolute -left-4 -top-3 opacity-25 -rotate-12"
        aria-hidden="true"
      >
        <img src="/icons/christmas-tree-raw.svg" alt="" class="h-24 w-24" />
      </div>

      <div class="relative text-center">
        <img src="/icons/logo.svg" alt="Logo" class="mx-auto h-20 w-20" />
        <h2
          id="welcome-title"
          class="font-display text-3xl font-bold text-ink-brand"
        >
          {dict.welcomeTitle}
        </h2>
        <p class="mt-3 text-left leading-relaxed text-stone-700">
          {dict.welcomeIntro}
        </p>

        <ul class="mt-4 space-y-2.5 text-left text-sm text-stone-700">
          <li class="flex items-center gap-3">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-pine"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
                />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span>{dict.welcomeHintOpen}</span>
          </li>
          <li class="flex items-center gap-3">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-pine"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </span>
            <span>{dict.welcomeHintPlan}</span>
          </li>
          <li class="flex items-center gap-3">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-pine"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="m9 9 5 12 1.8-5.2L21 14Z" />
                <path d="M7.2 2.2 8 5.1" />
                <path d="m5.1 8-2.9-.8" />
                <path d="M14 4.1 12 6" />
                <path d="m6 12-1.9 2" />
              </svg>
            </span>
            <span>{dict.welcomeHintTap}</span>
          </li>
        </ul>

        {#if anyMarketOpen}
          <div
            class="mt-5 mb-4 flex items-center gap-4 rounded-xl bg-pine p-4 text-left text-white shadow-inner"
          >
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-gold/60 bg-pine-dark/50 text-gold-light"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-8 w-8"
              >
                <path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
            </div>
            <div>
              <div class="font-display text-lg font-bold">
                {dict.welcomeSeasonHere}
              </div>
              <div class="mt-1 text-sm text-white/75">
                {dict.welcomeSeasonHereHint}
              </div>
            </div>
          </div>
        {:else if allMarketsClosed}
          <div
            class="mt-5 mb-4 flex items-center gap-4 rounded-xl bg-pine-dark/20 p-4 text-left text-stone-700 shadow-inner"
          >
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-stone-100 text-stone-500"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-8 w-8"
              >
                <path d="m10 20-1.25-2.5L6 18" />
                <path d="M10 4 8.75 6.5 6 6" />
                <path d="m14 20 1.25-2.5L18 18" />
                <path d="m14 4 1.25 2.5L18 6" />
                <path d="m17 21-3-6h-4" />
                <path d="m17 3-3 6 1.5 3" />
                <path d="M2 12h6.5L10 9" />
                <path d="m20 10-1.5 2 1.5 2" />
                <path d="M22 12h-6.5L14 15" />
                <path d="m4 10 1.5 2L4 14" />
                <path d="m7 21 3-6-1.5-3" />
                <path d="m7 3 3 6h4" />
              </svg>
            </div>
            <div>
              <div class="font-display text-lg font-bold">
                {dict.welcomeSeasonEnded}
              </div>
              <div class="mt-1 text-sm text-stone-600">
                {dict.welcomeSeeYouNextYear}
              </div>
            </div>
          </div>
        {:else if daysUntilFirstMarket !== undefined}
          <div
            class="mt-5 mb-4 flex items-center gap-4 rounded-xl bg-pine p-4 text-left text-white shadow-inner"
          >
            <div
              class="min-w-20 rounded-lg border border-gold/60 bg-pine-dark/50 px-3 py-2 text-center"
            >
              <div
                class="font-display text-4xl font-bold leading-none text-gold-light"
              >
                {daysUntilFirstMarket}
              </div>
              <div
                class="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75"
              >
                {dict.welcomeDays}
              </div>
            </div>
            <div>
              <div class="font-display text-lg font-bold">
                {dict.welcomeSeasonNearlyHere}
              </div>
              <div class="mt-1 text-sm text-white/75">
                {dict.welcomeUntilFirstMarket}
              </div>
            </div>
          </div>
        {/if}

        <p class="mb-5 text-sm font-semibold text-ink-brand">
          {interpolate(dict.welcomeExploreCount, {
            count: String(marketCount),
          })}
        </p>
        <button
          onclick={onClose}
          class="w-full bg-gold text-on-gold font-bold py-3 rounded-lg shadow-lg hover:bg-gold-light transition"
        >
          {dict.welcomeStartExploring}
        </button>
      </div>
    </div>
  </div>
</div>
