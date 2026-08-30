import { writable, get } from "svelte/store";
import { browser } from "$app/environment";

export const simulatedDate = writable<Date | null>(null);

// Restore a persisted simulated date at import time, before first render.
if (browser) {
  const saved = localStorage.getItem("simulatedDate");
  if (saved) simulatedDate.set(new Date(saved));
}

export function setSimulatedDate(date: Date | null) {
  simulatedDate.set(date);
  if (browser) {
    if (date) localStorage.setItem("simulatedDate", date.toISOString());
    else localStorage.removeItem("simulatedDate");
  }
}

export function getCurrentDate(): Date {
  return get(simulatedDate) || new Date();
}
