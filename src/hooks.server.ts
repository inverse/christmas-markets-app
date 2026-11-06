import type { Handle } from "@sveltejs/kit";
import { localeFromParam } from "$lib/i18n/locale";

export const handle: Handle = async ({ event, resolve }) => {
  const locale = localeFromParam(event.params.lang);
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('<html lang="en">', `<html lang="${locale}">`),
  });
};
