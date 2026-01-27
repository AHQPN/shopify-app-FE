import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 3000),
    allowedHosts: true,
    cors: true,
    proxy: {
      "/api": {
        target: process.env.SPRING_API_URL || "http://localhost:8080",
        changeOrigin: true,
        // Không rewrite path, giữ nguyên /api
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
}) satisfies UserConfig;
