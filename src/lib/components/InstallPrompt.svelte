<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };

  const DISMISS_KEY = "hasDismissedInstallPrompt";

  // Hidden until onMount proves otherwise, so the prerendered HTML stays empty.
  let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
  let isStandalone = $state(true);
  let dismissed = $state(true);

  const visible = $derived(
    !isStandalone && !dismissed && deferredPrompt !== null,
  );

  onMount(() => {
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as Navigator & { standalone?: boolean };
    const syncStandalone = () => {
      isStandalone = standaloneQuery.matches || nav.standalone === true;
    };
    syncStandalone();
    standaloneQuery.addEventListener("change", syncStandalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
    };

    const onInstalled = () => {
      deferredPrompt = null;
      isStandalone = true;
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // storage unavailable (private mode) - nothing to persist
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      standaloneQuery.removeEventListener("change", syncStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  });

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // storage unavailable (private mode) - nothing to persist
    }
  }

  async function install() {
    const event = deferredPrompt;
    if (!event) return;
    deferredPrompt = null;

    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "dismissed") dismissed = true;
    } catch {
      // prompt() rejects when the install can no longer be offered
    }
  }
</script>

{#if visible}
  <div
    role="region"
    aria-label="Install app"
    transition:fade={{ duration: 200 }}
    style="bottom: max(1rem, env(safe-area-inset-bottom));"
    class="festive-surface fixed left-1/2 z-[1100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-gold p-2.5 pl-4 shadow-2xl"
  >
    <div class="min-w-0 flex-1">
      <p class="font-display text-sm font-bold leading-tight text-ink-brand">
        Install app
      </p>
      <p class="mt-0.5 text-xs leading-snug text-stone-600">
        Quick access from your home screen.
      </p>
    </div>

    <button
      onclick={install}
      class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-gold px-3.5 font-display text-sm font-bold text-on-gold shadow-sm transition hover:bg-gold-light"
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
        aria-hidden="true"
      >
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" />
      </svg>
      Install
    </button>

    <button
      onclick={dismiss}
      aria-label="Dismiss install prompt"
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
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
  </div>
{/if}
