import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Build-time feature flag for the GetYourGuide attractions layer.
// Set ENABLE_GYG_ATTRACTIONS=0 (or false/no) to exclude the layer entirely;
// anything else (including unset) keeps it enabled.
const enabled = !/^0$|^false$|^no$|^off$/i.test(
  process.env.ENABLE_GYG_ATTRACTIONS ?? "",
);

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
    }),
    tailwindcss(),
  ],
  define: {
    __ENABLE_GYG_ATTRACTIONS__: JSON.stringify(enabled),
    __BUILD_TIME__: JSON.stringify(
      new Date().toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    ),
  },
  server: {
    allowedHosts: true,
    host: true,
  },
});
