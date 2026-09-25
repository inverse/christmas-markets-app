import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Build-time feature flag for the GetYourGuide attractions layer.
// Set ENABLE_GYG_ATTRACTIONS=0 (or false/no) to exclude the layer entirely;
// anything else (including unset) keeps it enabled.
const enabled = !/^0$|^false$|^no$|^off$/i.test(
  process.env.ENABLE_GYG_ATTRACTIONS ?? "",
);

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  define: {
    __ENABLE_GYG_ATTRACTIONS__: JSON.stringify(enabled),
  },
  server: {
    allowedHosts: true,
    host: true,
  },
});
