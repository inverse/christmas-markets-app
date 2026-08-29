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
