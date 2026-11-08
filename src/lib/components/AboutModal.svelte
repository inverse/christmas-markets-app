<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import type { Locale } from "$shared/types";
  import { messages, interpolate } from "$lib/i18n/messages";
  import Snowfall from "$lib/components/Snowfall.svelte";

  let { onClose, locale }: { onClose: () => void; locale: Locale } = $props();

  const dict = $derived(messages(locale));

  // iOS Safari never fires beforeinstallprompt, so it gets the manual hint below.
  let showIosInstall = $state(false);

  onMount(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    showIosInstall = isIos && !isStandalone;
  });

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
    aria-modal="true"
    aria-labelledby="about-title"
    class="festive-surface fairy-lights relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border-4 border-gold shadow-2xl"
  >
    <div
      class="pointer-events-none absolute -right-4 -top-3 opacity-20 rotate-12"
      aria-hidden="true"
    >
      <img src="/icons/christmas-tree-raw.svg" alt="" class="h-24 w-24" />
    </div>
    <div
      class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl"
    >
      <!-- Header -->
      <div
        class="relative flex items-center justify-between border-b border-stone-200 px-6 py-4"
      >
        <div class="flex items-center gap-2">
          <img src="/icons/logo.svg" alt="" class="h-8 w-8" />
          <h2
            id="about-title"
            class="font-display text-2xl font-bold text-ink-brand"
          >
            {dict.about}
          </h2>
        </div>
        <button
          onclick={onClose}
          aria-label={dict.closeAboutModal}
          class="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            class="h-5 w-5"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div
        class="space-y-4 overflow-y-auto p-6 text-sm text-stone-700 leading-relaxed scrollbar-thin"
      >
        <section>
          <h3 class="font-display text-base font-bold text-ink-brand mb-1">
            {dict.aboutWhyTitle}
          </h3>
          <p>
            {dict.aboutWhyBody}
          </p>
        </section>

        <section>
          <h3 class="font-display text-base font-bold text-ink-brand mb-1">
            {dict.aboutDataTitle}
          </h3>
          <p>
            {dict.aboutDataBefore}
            <a
              href="https://www.berlin.de/weihnachtsmarkt/"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-ink-brand underline hover:text-ink-gold"
            >
              {dict.aboutDataLink}
            </a>.
          </p>
          <p class="mt-2 text-xs text-stone-500">
            {dict.aboutDataNote}
          </p>
        </section>

        <section>
          <h3 class="font-display text-base font-bold text-ink-brand mb-1">
            {dict.aboutSupportTitle}
          </h3>
          <p>
            {dict.aboutSupportBody}
          </p>
        </section>

        {#if showIosInstall}
          <section>
            <h3 class="font-display text-base font-bold text-ink-brand mb-1">
              {dict.aboutIosTitle}
            </h3>
            <p>
              {dict.aboutIosBefore}
              <span
                class="inline-flex items-center gap-1 align-text-bottom font-semibold text-ink-brand"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 16V4m0 0 4 4m-4-4L8 8M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"
                  />
                </svg>
                {dict.aboutIosShare}
              </span>
              {dict.aboutIosMiddle}
              <span class="font-semibold text-ink-brand"
                >{dict.aboutIosAddToHome}</span
              >. {dict.aboutIosAfter}
            </p>
          </section>
        {/if}

        <div
          class="border-t border-stone-200 pt-3 text-xs text-stone-500 space-y-1"
        >
          <p>
            {interpolate(dict.aboutLastBuilt, { time: __BUILD_TIME__ })}
          </p>
          <p>
            {dict.aboutCreatedBy}
            <a
              href="https://malachisoord.com"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-ink-brand underline hover:text-ink-gold"
            >
              Malachi Soord
            </a>.
          </p>
          <p>
            {dict.aboutTilesBefore}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-stone-700"
            >
              OpenStreetMap
            </a>
            {dict.aboutTilesMiddle}
            <a
              href="https://leafletjs.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-stone-700"
            >
              Leaflet
            </a>.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-stone-200 bg-surface/50 p-4">
        <button
          onclick={onClose}
          class="w-full rounded-lg bg-gold py-2.5 font-bold text-on-gold shadow-sm hover:bg-gold-light transition"
        >
          {dict.aboutBackToMap}
        </button>
      </div>
    </div>
  </div>
</div>
