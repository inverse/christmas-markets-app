<script lang="ts">
  // GetYourGuide affiliate city widget (Partner Program).
  // Script is injected once, on first render; the placeholder div is what
  // the widget script scans for and hydrates into an iframe.

  import { onMount } from "svelte";

  const GYG_WIDGET_SRC = "https://widget.getyourguide.com/v2/widget.js";

  onMount(() => {
    if (document.querySelector(`script[src^='${GYG_WIDGET_SRC}']`)) return;
    const script = document.createElement("script");
    script.src = GYG_WIDGET_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
</script>

<div
  data-gyg-href="https://widget.getyourguide.com/default/city.frame"
  data-gyg-location-id="17"
  data-gyg-locale-code="en-US"
  data-gyg-widget="city"
  data-gyg-partner-id="QZJ0CS7"
  data-testid="gyg-ad-widget"
>
  <!-- Reserved height until the widget iframe hydrates (no CLS) -->
  <div class="min-h-[150px]"></div>
</div>
