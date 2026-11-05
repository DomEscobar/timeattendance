import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "modern",
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "../dist", emptyOutDir: true },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
