import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { localeFromParam } from "$lib/i18n/locale";

/**
 * Absolute origin for social metadata. Crawlers need an absolute image URL.
 */
export const load: LayoutLoad = ({ url, params }) => {
  // /en duplicates the canonical "/" - collapse it permanently so links,
  // shares and indexed entries keep a single English URL.
  if (params.lang === "en") {
    const rest = url.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    redirect(301, `${rest}${url.search}${url.hash}`);
  }
  // SvelteKit strips the trailing slash on /de/, so the canonical German URL
  // is /de - emit it everywhere or canonical/hreflang point at a redirect.
  const localePath = params.lang === "de" ? "/de" : "/";
  return {
    origin: url.origin,
    locale: localeFromParam(params.lang),
    localePath,
  };
};
