import { writable, get } from "svelte/store";
import { browser } from "$app/environment";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const THEME_COLOR = { light: "#2c5e1a", dark: "#0b1512" };

let initialized = false;

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode)
  }
}

/** Whether night mode is on. Seeded from the class the pre-paint script in
    app.html already put on <html>, so the first render and the paint agree. */
export const isDark = writable(
  browser && document.documentElement.classList.contains("dark"),
);

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? THEME_COLOR.dark : THEME_COLOR.light);
  isDark.set(dark);
}

/** Follow the OS while the visitor has not picked a side themselves. */
export function initTheme() {
  if (!browser || initialized) return;
  initialized = true;
  isDark.set(document.documentElement.classList.contains("dark"));
  window.matchMedia(DARK_QUERY).addEventListener("change", (event) => {
    if (readStored() === null) apply(event.matches);
  });
}

export function toggleTheme() {
  const dark = !get(isDark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // storage blocked: the choice just will not outlive the session
  }
  apply(dark);
}
