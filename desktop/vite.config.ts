import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../front/src", import.meta.url)),
    },
  },
  root: "../front",
  base: "./",
  build: {
    outDir: "../desktop/dist",
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      "/api/makecia": {
        target: "http://localhost:3001",
        changeOrigin: false,
        timeout: 120_000,
      },
      "/api/forwarders": {
        target: "https://olmectron.github.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/forwarders/, "/forwarders"),
        timeout: 30_000,
        proxyTimeout: 30_000,
      },
    },
  },
});
