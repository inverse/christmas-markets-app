<script lang="ts">
  import { fade } from "svelte/transition";

  let { onClose, daysUntilFirstMarket, marketCount } = $props<{
    onClose: () => void;
    daysUntilFirstMarket?: number;
    marketCount: number;
  }>();
</script>

<div
  class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-pine-dark/80"
  transition:fade
>
  <div
    class="festive-surface relative w-full max-w-sm overflow-hidden rounded-2xl border-4 border-gold p-6 shadow-2xl"
  >
    <div
      class="pointer-events-none absolute -right-4 -top-3 opacity-25"
      aria-hidden="true"
    >
      <img
        src="/icons/christmas-tree-raw.svg"
        alt=""
        class="h-20 w-24 rotate-12"
      />
    </div>

    <div class="relative text-center">
      <img
        src="/icons/christmas-tree-raw.svg"
        alt=""
        class="mx-auto mb-3 h-16 w-20 object-contain"
      />
      <p
        class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-berry"
      >
        Berlin in winter
      </p>
      <h2 class="font-display text-3xl font-bold text-pine">Welcome!</h2>
      <p class="mt-3 text-left leading-relaxed text-stone-700">
        Find Berlin's brightest Christmas markets, check the dates, and plan a
        magical festive outing.
      </p>

      {#if daysUntilFirstMarket !== undefined}
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
              days
            </div>
          </div>
          <div>
            <div class="font-display text-lg font-bold">
              The season is nearly here
            </div>
            <div class="mt-1 text-sm text-white/75">
              until the first market opens
            </div>
          </div>
        </div>
      {/if}

      <p class="mb-5 text-sm font-semibold text-pine-light">
        Explore {marketCount} festive markets across Berlin
      </p>
      <button
        onclick={onClose}
        class="w-full rounded-lg bg-gold py-3 font-bold text-pine shadow-sm transition hover:bg-gold-dark"
      >
        Start exploring
      </button>
    </div>
  </div>
</div>
