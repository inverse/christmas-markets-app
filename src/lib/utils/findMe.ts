import type { Market } from "$shared/types";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NearestResult {
  market: Market;
  distanceMeters: number;
}

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance in meters between two coordinates (haversine). */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Closest market to the user position, or null when there is no data. */
export function findNearestMarket(
  user: LatLng,
  markets: Market[],
): NearestResult | null {
  let best: NearestResult | null = null;
  for (const market of markets) {
    const distanceMeters = haversineDistance(user, market.coordinates);
    if (!best || distanceMeters < best.distanceMeters) {
      best = { market, distanceMeters };
    }
  }
  return best;
}

/** Minimal axis-aligned box covering the points; corners coincide for a single point. */
export function boundingBox(points: LatLng[]): BBox | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  };
}

/** Friendly notice for a geolocation failure, falling back to the raw message. */
export function locationErrorMessage(
  code: number,
  fallbackMessage: string,
): string {
  switch (code) {
    case 1:
      return "Location access was denied. Enable it in your browser settings to use find-me.";
    case 2:
      return "Your location is currently unavailable. Check your device signal and try again.";
    case 3:
      return "Getting your location timed out. Please try again.";
    default:
      return `Could not get your location: ${fallbackMessage}`;
  }
}
