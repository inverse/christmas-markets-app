/**
 * GetYourGuide Partner Program constants.
 * Single source of truth for the affiliate partner ID and tracking params,
 * used by the drawer tours strip and the map attractions layer.
 */
export const GYG_PARTNER_ID = "QZJ0CS7";
export const GYG_UTM_MEDIUM = "online_publisher";

/** Where an affiliate link is shown; sent as utm_campaign to compare placements. */
export type GygPlacement = "drawer-strip" | "map-pin";

/** How many attractions the drawer strip shows. */
export const GYG_STRIP_COUNT = 4;

/**
 * Deterministic daily rotation: the same ids serve all day, then change.
 * Seeded by UTC date so the pick survives reloads and stays consistent
 * across a visitor's session.
 */
export function pickDailyFeatured<T>(ids: readonly T[], date: Date): T[] {
  const seed =
    date.getUTCFullYear() * 10000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate();
  let state = seed || 1;
  const rand = () => {
    // Numerical Recipes LCG.
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, GYG_STRIP_COUNT);
}

/** Appends affiliate tracking params to a base GetYourGuide URL. */
export function gygAffiliateUrl(
  baseUrl: string,
  placement: GygPlacement,
): string {
  const u = new URL(baseUrl);
  u.searchParams.set("partner_id", GYG_PARTNER_ID);
  u.searchParams.set("utm_medium", GYG_UTM_MEDIUM);
  u.searchParams.set("utm_campaign", placement);
  return u.toString();
}
