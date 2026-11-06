import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function vercelApiDevPlugin(): Plugin {
  return {
    name: "vercel-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          return next();
        }

        try {
          const cleanUrl = req.url.split("?")[0];
          const relativePath = cleanUrl.replace(/^\/api\//, "");
          const fullPath = path.resolve(process.cwd(), "api", `${relativePath}.js`);

          const module = await server.ssrLoadModule(fullPath);
          if (module?.default && typeof module.default === "function") {
            await module.default(req, res);
          } else {
            next();
          }
        } catch (err: any) {
          console.error("[Vite API Dev] Error:", err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "SERVER_ERROR", error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
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
