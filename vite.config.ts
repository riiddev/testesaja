import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
            if (id.includes("gsap") || id.includes("lenis") || id.includes("framer-motion")) {
              return "vendor-motion";
            }
            return "vendor";
          }
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
