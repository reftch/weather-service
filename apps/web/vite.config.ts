import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";

// Address of the Rust backend. During development the backend runs on :3000
// (see README) while Vite owns :8080; override with BACKEND_URL if needed.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  clearScreen: false,
  server: {
    // The dashboard is served on :8080 — Vite proxies the API to the backend.
    port: 8080,
    proxy: {
      // API + auth (Keycloak callback/redirect) are both served by the backend.
      // The callback URI points at :8080 and Vite forwards it to the backend so
      // the session cookie (set for localhost) is valid across the dev proxy.
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        // Disable timeouts so the long-lived SSE stream (/api/stream) is not
        // cut off by the dev proxy.
        timeout: 0,
        proxyTimeout: 0,
      },
      "/auth": {
        target: BACKEND_URL,
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
