import { writable, get, type Readable } from "svelte/store";
import { browser } from "$app/environment";
import markets from "../../data/markets.json";
import { slugify } from "./slug";
import type { Map } from "leaflet";

export const mapStore = writable<Map | null>(null);

const selectedName = writable<string | null>(null);
const menuIsOpen = writable(false);
const aboutIsOpen = writable(false);
const welcomeIsOpen = writable(false);

/** Drawer visibility, kept in sync with the `#menu` hash. */
export const menuOpen: Readable<boolean> = { subscribe: menuIsOpen.subscribe };

/** About modal visibility, kept in sync with the `#about` hash. */
export const aboutOpen: Readable<boolean> = {
  subscribe: aboutIsOpen.subscribe,
};

/** Welcome modal visibility, kept in sync with the `#welcome` hash. */
export const welcomeOpen: Readable<boolean> = {
  subscribe: welcomeIsOpen.subscribe,
};

type View = "menu" | "market" | "about" | "welcome";

const MARKER = "cmView";
const MENU_HASH = "#menu";
const ABOUT_HASH = "#about";
const WELCOME_HASH = "#welcome";
const MARKET_PREFIX = "#market=";
const VIEWS: View[] = ["menu", "market", "about", "welcome"];

function currentView(): View | null {
  if (!browser) return null;
  const state = window.history.state as Record<string, unknown> | null;
  const view = state?.[MARKER] as View | undefined;
  return view !== undefined && VIEWS.includes(view) ? view : null;
}

function hashFor(view: View, name: string | null): string {
  switch (view) {
    case "menu":
      return MENU_HASH;
    case "about":
      return ABOUT_HASH;
    case "welcome":
      return WELCOME_HASH;
    case "market":
      return MARKET_PREFIX + slugify(name ?? "");
  }
}

// Write a view to the hash. When the current entry already represents the same
// view (e.g. switching marker A -> B) it is replaced, so Back never lands on a
// stale entry; otherwise a new entry is pushed. Never pushes a duplicate.
// `replace` forces the replace even for a different view - see openAbout.
function pushView(view: View, name: string | null = null, replace = false) {
  if (!browser) return;
  const hash = hashFor(view, name);
  if (window.location.hash === hash) return;
  const url = window.location.pathname + window.location.search + hash;
  // Merge instead of clobbering: SvelteKit keeps its own bookkeeping in
  // history.state, so it must survive our writes.
  const state = { ...window.history.state, [MARKER]: view };
  if (replace || currentView() === view) {
    window.history.replaceState(state, "", url);
  } else {
    window.history.pushState(state, "", url);
  }
}

// Drop the current view. Rewind when the current entry is ours, otherwise
// replace so a deep-linked URL is never exited out of the app.
function clearView() {
  if (!browser || window.location.hash === "") return;
  if (currentView() !== null) {
    window.history.back();
  } else {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
  }
}

function syncFromHash() {
  if (!browser) return;
  const hash = window.location.hash;
  menuIsOpen.set(hash === MENU_HASH);
  aboutIsOpen.set(hash === ABOUT_HASH);
  welcomeIsOpen.set(hash === WELCOME_HASH);
  if (!hash.startsWith(MARKET_PREFIX)) {
    selectedName.set(null);
    return;
  }
  // Slug resolves back to the display name via the market list.
  let slug: string | null = null;
  try {
    slug = decodeURIComponent(hash.slice(MARKET_PREFIX.length));
  } catch {
    // malformed escape sequence - treated as an unknown slug below
  }
  const name = slug ? nameBySlug[slug] : undefined;
  if (name === undefined) {
    // Stale link, typo or malformed escape: drop the dead hash rather than
    // leaving a #market= entry that selects nothing.
    selectedName.set(null);
    clearView();
    return;
  }
  selectedName.set(name);
}

const nameBySlug: Record<string, string> = Object.fromEntries(
  markets.map((market) => [slugify(market.name), market.name]),
);

/** Selected market name, kept in sync with `#market=<slug>`. */
export const selectedMarket = {
  subscribe: selectedName.subscribe,
  set(name: string | null) {
    selectedName.set(name);
    if (name === null) {
      // Closing a popup is a transient UI action, not navigation: strip the
      // hash in place instead of history.back(), which would land on whatever
      // preceded the market view (e.g. re-opening the menu).
      if (window.location.hash.startsWith(MARKET_PREFIX)) {
        window.history.replaceState(
          { ...window.history.state, [MARKER]: null },
          "",
          window.location.pathname + window.location.search,
        );
      } else if (currentView() === "market") {
        clearView();
      }
    } else {
      menuIsOpen.set(false);
      pushView("market", name);
    }
  },
};

export function openMenu() {
  menuIsOpen.set(true);
  selectedName.set(null);
  pushView("menu");
}

export function closeMenu() {
  if (!get(menuIsOpen)) return;
  menuIsOpen.set(false);
  if (currentView() === "menu") clearView();
}

// The drawer is a transient overlay over the map, not a page. A modal opened
// from it takes over the drawer's history entry instead of stacking on top, so
// dismissing the modal returns to the map rather than re-opening the menu.
export function openAbout() {
  const fromDrawer = currentView() === "menu";
  menuIsOpen.set(false);
  welcomeIsOpen.set(false);
  selectedName.set(null);
  aboutIsOpen.set(true);
  pushView("about", null, fromDrawer);
}

export function closeAbout() {
  if (!get(aboutIsOpen)) return;
  aboutIsOpen.set(false);
  if (currentView() === "about") clearView();
}

export function openWelcome() {
  const fromDrawer = currentView() === "menu";
  menuIsOpen.set(false);
  aboutIsOpen.set(false);
  selectedName.set(null);
  welcomeIsOpen.set(true);
  pushView("welcome", null, fromDrawer);
}

export function closeWelcome() {
  if (!get(welcomeIsOpen)) return;
  welcomeIsOpen.set(false);
  if (currentView() === "welcome") clearView();
}

if (browser) {
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("popstate", syncFromHash);
  syncFromHash();
}
