import { defineParams } from "@sveltejs/kit/params";

export const params = defineParams({
  locale: (param) => (param === "en" || param === "de" ? param : undefined),
});
