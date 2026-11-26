/**
 * GetYourGuide Partner Program constants.
 * Single source of truth for the affiliate partner ID and tracking params,
 * used by the drawer tours strip and the map attractions layer.
 */
export const GYG_PARTNER_ID = "QZJ0CS7";
export const GYG_UTM_MEDIUM = "online_publisher";

/** Where an affiliate link is shown; sent as utm_campaign to compare placements. */
export type GygPlacement = "drawer-strip" | "map-pin";

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
