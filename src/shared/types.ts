import type { Dates } from "./dateParser";

export interface Market {
  name: string;
  address: string;
  dates: Dates;
  image_url: string;
  coordinates: { lat: number; lng: number };
  url: string;
  opening_times: string;
  admission: string;
  description: string;
}

export interface Attraction {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  image_url: string;
  description: string;
  url: string;
}
