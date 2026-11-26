import type { Action } from "svelte/action";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Focus containment for modal surfaces (dialogs, the drawer). Moves focus
 * into the element on mount - the element itself when it is focusable via
 * tabindex="-1", so screen readers announce its accessible name and start
 * reading from the top - cycles Tab/Shift+Tab inside it, and on teardown
 * returns focus to whatever opened it.
 *
 * Why not a <dialog>: the surfaces animate in/out with Svelte transitions
 * and one (the drawer) is non-modal - the map stays interactive behind it.
 * What is trapped here is the keyboard tab order, not pointer input.
 */
// Instances coordinate through this module-level state: when the drawer
// closes by opening a modal, the drawer outlives the handoff for a few
// hundred ms and its teardown must NOT yank focus back out of the modal
// that already owns it. Only the trap that currently holds focus may
// restore it, and a superseded trap hands its invoker down so focus can
// keep unwinding the chain (modal <- drawer <- menu button) when the
// surface on top closes.
let activeTrap: HTMLElement | null = null;
let fallbackInvoker: HTMLElement | null = null;

export const containFocus: Action<HTMLElement> = (node) => {
  // Captured now, not on teardown: by then the browser has often already
  // dropped focus to <body>, and the invoker is the element the user
  // actually expects to land back on.
  const invoker =
    document.activeElement instanceof HTMLElement &&
    !node.contains(document.activeElement)
      ? document.activeElement
      : null;

  if (node.tabIndex >= 0 || node.hasAttribute("tabindex")) {
    node.focus();
  } else {
    node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
  }
  activeTrap = node;

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Tab") return;
    const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const escaped = active === null || !node.contains(active);
    if (event.shiftKey && (active === first || active === node || escaped)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || escaped)) {
      event.preventDefault();
      first.focus();
    }
  }
  node.addEventListener("keydown", onKeydown);

  return {
    destroy() {
      node.removeEventListener("keydown", onKeydown);
      if (activeTrap !== node) {
        // Another surface owns focus already; pass our invoker down the
        // chain. Our own DOM is about to unmount, so read invoker now.
        if (invoker?.isConnected) fallbackInvoker = invoker;
        return;
      }
      activeTrap = null;
      const target = invoker?.isConnected
        ? invoker
        : fallbackInvoker?.isConnected
          ? fallbackInvoker
          : null;
      fallbackInvoker = null;
      // With the whole chain dead, focus stays on <body> - the honest
      // fallback when there is nothing meaningful to return to.
      target?.focus();
    },
  };
};
