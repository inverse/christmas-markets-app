import type { Dates } from "./dateParser";

type WithoutRaw<T> = T extends { raw: string } ? Omit<T, "raw"> : never;

export type Locale = "en" | "de";

export type MarketBase = {
  id: string;
  dates: WithoutRaw<Dates>;
  image_url: string;
  coordinates: { lat: number; lng: number };
  coordinates_approximate?: boolean;
};

export interface MarketLocale {
  name: string;
  address: string;
  dates_raw: string;
  url: string;
  opening_times: string | null;
  admission: string | null;
  description: string;
}

export interface Market extends Omit<MarketLocale, "dates_raw"> {
  id: string;
  dates: Dates;
  image_url: string;
  coordinates: { lat: number; lng: number };
  coordinates_approximate?: boolean;
}

export interface Attraction {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  image_url: string;
  description: string;
  url: string;
}
