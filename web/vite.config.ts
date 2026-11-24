import path from "node:path";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Same "@/..." import style as our Next.js apps.
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Playwright specs run with `pnpm e2e`, not Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
