<script lang="ts">
  import { fade } from "svelte/transition";

  let {
    onClose,
    daysUntilFirstMarket,
    marketCount,
    anyMarketOpen,
    allMarketsClosed,
  } = $props<{
    onClose: () => void;
    daysUntilFirstMarket?: number;
    marketCount: number;
    anyMarketOpen: boolean;
    allMarketsClosed: boolean;
  }>();

  const snowflakes = Array.from({ length: 100 }, () => ({
    left: Math.random() * 100,
    size: 10 + Math.random() * 16,
    opacity: 0.5 + Math.random() * 0.5,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    drift: Math.round((Math.random() * 2 - 1) * 60),
  }));
</script>

<div
  class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-pine-dark/80"
  transition:fade
>
  <div class="snowfall" aria-hidden="true">
    {#each snowflakes as flake, i (i)}
      <span
        class="flake"
        style="left: {flake.left}%; font-size: {flake.size}px; opacity: {flake.opacity}; animation-duration: {flake.duration}s; animation-delay: {flake.delay}s; --drift: {flake.drift}px"
        >❄️</span
      >
    {/each}
  </div>

  <div
    class="festive-surface relative w-full max-w-sm overflow-hidden rounded-2xl border-4 border-gold p-6 shadow-2xl"
  >
    <div
      class="pointer-events-none absolute -right-4 -top-3 opacity-25 rotate-12"
      aria-hidden="true"
    >
      <img src="/icons/christmas-tree-raw.svg" alt="" class="h-24 w-24" />
    </div>

    <div class="relative text-center">
      <img src="/icons/logo.svg" alt="Logo" class="mx-auto h-20 w-20" />
      <h2 class="font-display text-3xl font-bold text-pine">Welcome!</h2>
      <p class="mt-3 text-left leading-relaxed text-stone-700">
        Find Berlin's brightest Christmas markets, check the dates, and plan a
        magical festive outing.
      </p>

      {#if anyMarketOpen}
        <div
          class="mt-5 mb-4 flex items-center gap-4 rounded-xl bg-pine p-4 text-left text-white shadow-inner"
        >
          <div
            class="rounded-lg border border-gold/60 bg-pine-dark/50 px-4 py-3 text-center text-4xl"
          >
            🎉
          </div>
          <div>
            <div class="font-display text-lg font-bold">
              The season is here!
            </div>
            <div class="mt-1 text-sm text-white/75">
              Berlin is full of festive magic
            </div>
          </div>
        </div>
      {:else if allMarketsClosed}
        <div
          class="mt-5 mb-4 flex items-center gap-4 rounded-xl bg-pine-dark/20 p-4 text-left text-stone-700 shadow-inner"
        >
          <div
            class="rounded-lg border border-stone-300 bg-stone-100 px-4 py-3 text-center text-4xl"
          >
            😔
          </div>
          <div>
            <div class="font-display text-lg font-bold">
              The season has ended
            </div>
            <div class="mt-1 text-sm text-stone-600">See you next year!</div>
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
        class="w-full bg-gold text-pine font-bold py-3 rounded-lg shadow-lg hover:bg-gold-light transition"
      >
        Start exploring
      </button>
    </div>
  </div>
</div>

<style>
  .snowfall {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .flake {
    position: absolute;
    top: -3rem;
    line-height: 1;
    animation: snow-fall linear infinite;
  }

  @keyframes snow-fall {
    from {
      transform: translate3d(0, 0, 0);
    }
    to {
      transform: translate3d(var(--drift), calc(100vh + 3rem), 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .flake {
      animation: none;
    }
  }
</style>
