import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { execSync } from "node:child_process";

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const distDir = resolve("dist");
const rootDir = resolve(".");

const server = createServer((req, res) => {
  let url = req.url.split("?")[0];
  if (url === "/") url = "/index.html";

  let filePath = join(distDir, url);
  if (!existsSync(filePath)) {
    filePath = join(rootDir, url);
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end("Not Found: " + url);
  }
});

server.listen(4175, () => {
  console.log("Server for Lighthouse listening on http://localhost:4175");
  try {
    const cmd = `npx.cmd lighthouse http://localhost:4175/index.html --only-categories=performance,accessibility --output=json --output-path=docs/lighthouse-mobile-report.json --chrome-flags="--headless" --form-factor=mobile --screenEmulation.disabled`;
    console.log("Running lighthouse audit...");
    execSync(cmd, { stdio: "inherit" });

    if (existsSync("docs/lighthouse-mobile-report.json")) {
      const report = JSON.parse(readFileSync("docs/lighthouse-mobile-report.json", "utf8"));
      const perfScore = Math.round((report.categories.performance.score || 0) * 100);
      const a11yScore = Math.round((report.categories.accessibility.score || 0) * 100);

      const summary = {
        url: "http://localhost:4175/index.html",
        formFactor: "mobile",
        performance: perfScore,
        accessibility: a11yScore,
        targetMet: perfScore >= 90 && a11yScore >= 90
      };

      writeFileSync("docs/lighthouse-summary.json", JSON.stringify(summary, null, 2));
      console.log("Lighthouse Summary:\n", JSON.stringify(summary, null, 2));
    }
  } catch (err) {
    console.error("Lighthouse execution error:", err.message);
  } finally {
    server.close();
  }
});

