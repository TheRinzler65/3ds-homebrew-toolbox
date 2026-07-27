import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Tout /api/* → backend local (port 3001)
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: false,
        timeout: 120_000,
      },
    },
  },
});
