import type { LayoutLoad } from "./$types";

/**
 * Absolute origin for social metadata.
 *
 * `og:image` must be an absolute URL: crawlers fetch the image out of band and
 * have no base URL to resolve a relative one against, so a bare
 * "/icons/og-image.png" silently yields no preview card. Deriving it from the
 * request keeps dev tunnels and any future domain correct without a rebuild.
 */
export const load: LayoutLoad = ({ url }) => {
  return {
    origin: url.origin,
  };
};
