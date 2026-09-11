<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  let { onClose } = $props<{ onClose: () => void }>();

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
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="about-title"
    class="festive-surface relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-4 border-gold shadow-2xl"
  >
    <div
      class="pointer-events-none absolute -right-4 -top-3 opacity-20 rotate-12"
      aria-hidden="true"
    >
      <img src="/icons/christmas-tree-raw.svg" alt="" class="h-24 w-24" />
    </div>

    <!-- Header -->
    <div
      class="relative flex items-center justify-between border-b border-stone-200 px-6 py-4"
    >
      <div class="flex items-center gap-2">
        <img src="/icons/logo.svg" alt="" class="h-8 w-8" />
        <h2 id="about-title" class="font-display text-2xl font-bold text-pine">
          About
        </h2>
      </div>
      <button
        onclick={onClose}
        aria-label="Close about modal"
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
        <h3 class="font-display text-base font-bold text-pine mb-1">
          Why I built this
        </h3>
        <p>
          Every winter, Berlin comes alive with dozens of Christmas markets, but
          finding out which ones are open right now, where they are, and what
          dates they run always felt harder than it should be. I built this map
          to make it simple for locals and visitors to explore the city's
          festive season and plan outings together.
        </p>
      </section>

      <section
        class="rounded-xl border border-stone-200 border-l-4 border-l-gold bg-snow p-3.5"
      >
        <h3 class="font-display text-base font-bold text-pine mb-1">
          Where the data comes from
        </h3>
        <p>
          Market details and locations come directly from the official
          <a
            href="https://www.berlin.de/weihnachtsmarkt/"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-pine underline hover:text-gold-dark"
          >
            Berlin.de Open Data portal
          </a>.
        </p>
        <p class="mt-2 text-xs text-stone-500">
          Opening hours and dates can change due to weather or organiser
          updates, so it's always a good idea to double-check official event
          pages before heading out!
        </p>
      </section>

      {#if showIosInstall}
        <section
          class="rounded-xl border border-stone-200 border-l-4 border-l-gold bg-snow p-3.5"
        >
          <h3 class="font-display text-base font-bold text-pine mb-1">
            Install on iPhone or iPad
          </h3>
          <p>
            In Safari, tap the
            <span
              class="inline-flex items-center gap-1 align-text-bottom font-semibold text-pine"
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
              Share
            </span>
            button, then choose
            <span class="font-semibold text-pine">Add to Home Screen</span>. It
            then opens full screen, just like a native app.
          </p>
        </section>
      {/if}

      <p class="text-xs text-stone-600">
        Created by
        <a
          href="https://malachisoord.com"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-pine underline hover:text-gold-dark"
        >
          Malachi Soord
        </a>.
      </p>
      <section class="border-t border-stone-200 pt-3 text-xs text-stone-500">
        Map tiles &copy;
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-stone-700"
        >
          OpenStreetMap
        </a>
        contributors, rendered with
        <a
          href="https://leafletjs.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-stone-700"
        >
          Leaflet
        </a>.
      </section>
    </div>

    <!-- Footer -->
    <div class="border-t border-stone-200 bg-snow/50 p-4">
      <button
        onclick={onClose}
        class="w-full rounded-lg bg-gold py-2.5 font-bold text-pine shadow-sm hover:bg-gold-light transition"
      >
        Back to Map
      </button>
    </div>
  </div>
</div>
