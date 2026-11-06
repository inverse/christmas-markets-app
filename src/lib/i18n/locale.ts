import type { Locale } from "$shared/types";

/**
 * Resolves a raw route param (or any untrusted string) to a Locale.
 * The `[[lang=locale]]` matcher already restricts param values, but every
 * caller needs the same coercion for the bare "/" route where the param is
 * absent.
 */
export function localeFromParam(lang: string | undefined): Locale {
  return lang === "de" ? "de" : "en";
}
