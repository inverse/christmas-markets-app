<script lang="ts">
  // Ambient snow layer. Deterministic per-flake values keep SSR markup and the
  // hydrated client identical; reduced-motion users get static flakes.
  const FLAKES = 60;
  const flakes = Array.from({ length: FLAKES }, (_, i) => {
    const duration = 7 + ((i * 29) % 80) / 10;
    return {
      left: ((i * 2654435761) % 1000) / 10,
      size: 2.5 + ((i * 97) % 40) / 10,
      opacity: 0.35 + ((i * 53) % 50) / 100,
      // Delay within [0, duration) so flakes distribute through the whole fall
      // instead of bunching near the top of the cycle.
      delay: -(((i * 61) % 100) / 100) * duration,
      duration,
      drift: (((i * 37) % 120) - 60) * 0.6,
    };
  });
</script>

<div class="snowfall" aria-hidden="true">
  {#each flakes as flake, i (i)}
    <span
      class="flake"
      style="left: {flake.left}%; width: {flake.size}px; height: {flake.size}px; opacity: {flake.opacity}; animation-duration: {flake.duration}s; animation-delay: {flake.delay}s; --drift: {flake.drift}px"
    ></span>
  {/each}
</div>
