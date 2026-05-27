// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

// Deployment target: Netlify
// The Cloudflare plugin is disabled (`cloudflare: false`). During `vite build`,
// @netlify/vite-plugin-tanstack-start writes the SSR function entry to
// .netlify/v1/functions/server.mjs — picked up automatically by Netlify CI.
//
// To revert to Cloudflare: remove `cloudflare: false`, remove the netlify plugin,
// restore server entry to `server`, and re-enable wrangler.jsonc.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [netlify()],
  },
});
