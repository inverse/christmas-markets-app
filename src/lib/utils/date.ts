import { writable } from "svelte/store";

export const simulatedDate = writable<Date | null>(null);

// Initialize simulation from storage; call from onMount.
export function initDateSimulation() {
  const saved = localStorage.getItem("simulatedDate");
  if (saved) simulatedDate.set(new Date(saved));
}

export function setSimulatedDate(date: Date | null) {
  simulatedDate.set(date);
  if (date) localStorage.setItem("simulatedDate", date.toISOString());
  else localStorage.removeItem("simulatedDate");
}
