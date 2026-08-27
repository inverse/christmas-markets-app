import { writable } from 'svelte/store';
import type { Map } from 'leaflet';

export const mapStore = writable<Map | null>(null);
export const selectedMarket = writable<string | null>(null);
