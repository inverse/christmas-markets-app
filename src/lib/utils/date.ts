import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const simulatedDate = writable<Date | null>(null);

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
  let date: Date | null = null;
  simulatedDate.subscribe((v) => (date = v))();
  return date || new Date();
}
export function initDateSimulation() {
  if (browser) {
    const saved = localStorage.getItem("simulatedDate");
    if (saved) simulatedDate.set(new Date(saved));
  }
}
