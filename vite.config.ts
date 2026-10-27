import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": rootDir } },
  publicDir: resolve(rootDir, "public"),
  server: { port: 5173, strictPort: true },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: {
      home: resolve(rootDir, "index.html"),
      belajar: resolve(rootDir, "belajar.html"),
      liquidNavbar: resolve(rootDir, "liquid-navbar.html"),
    }},
  },
});
