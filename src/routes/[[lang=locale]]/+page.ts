import type { PageLoad } from "./$types";
import { loadMarkets } from "$lib/data/markets";
import { localeFromParam } from "$lib/i18n/locale";

export const load: PageLoad = async ({ params }) => {
  const locale = localeFromParam(params.lang);
  return { locale, markets: await loadMarkets(locale) };
};
