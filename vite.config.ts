import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [react()],

  build: {
    // Reporting and holiday data are optional, lazy-loaded features. Keep the
    // warning threshold just above their current largest generated chunk so
    // the CI still reports meaningful future bundle growth.
    chunkSizeWarningLimit: 1500,
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
