import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

/**
 * The umami tag in index.html uses Vite's `%VITE_*%` HTML substitution, which leaves the
 * placeholder verbatim when the variable is unset. The browser then requests
 * `/%VITE_ANALYTICS_ENDPOINT%/umami`, gets the SPA's HTML back, and logs a 400 plus a MIME-type
 * error on every page load. Drop the tag unless both variables are actually configured.
 */
function analyticsTag(): Plugin {
  let configured = false;
  return {
    name: "drop-unconfigured-analytics",
    configResolved(config) {
      configured = Boolean(
        config.env.VITE_ANALYTICS_ENDPOINT && config.env.VITE_ANALYTICS_WEBSITE_ID
      );
    },
    transformIndexHtml(html) {
      if (configured) return html;
      return html.replace(
        /[ \t]*<script[^>]*%VITE_ANALYTICS_ENDPOINT%[\s\S]*?<\/script>\r?\n?/,
        ""
      );
    },
  };
}

const plugins = [react(), tailwindcss(), analyticsTag()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
