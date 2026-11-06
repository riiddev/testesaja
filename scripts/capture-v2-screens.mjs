import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname, join } from "node:path";

// Simple local static server to serve dist/
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".b64": "text/plain",
  ".gz": "application/gzip"
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

server.listen(4173, async () => {
  console.log("Static server running on http://localhost:4173");
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Landing
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://localhost:4173/index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/screenshots/v2-desktop-home.png", fullPage: false });
  await page.screenshot({ path: "docs/screenshots/v2-desktop-home-full.png", fullPage: true });
  console.log("Captured v2-desktop-home");

  // 2. Mobile Landing
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/screenshots/v2-mobile-home.png", fullPage: false });
  console.log("Captured v2-mobile-home");

  // 3. Desktop Belajar Workspace
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("http://localhost:4173/belajar.html#overview", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/screenshots/v2-workspace-overview.png", fullPage: false });
  console.log("Captured v2-workspace-overview");

  // 4. Vocabulary View
  await page.click('button[data-view="vocabulary"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/screenshots/v2-workspace-vocabulary.png", fullPage: false });
  console.log("Captured v2-workspace-vocabulary");

  // 5. Grammar View
  await page.click('button[data-view="grammar"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/screenshots/v2-workspace-grammar.png", fullPage: false });
  console.log("Captured v2-workspace-grammar");

  // 6. Settings View
  await page.click('button[data-view="settings"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/screenshots/v2-workspace-settings.png", fullPage: false });
  console.log("Captured v2-workspace-settings");

  await browser.close();
  server.close();
  console.log("All screenshots captured successfully!");
});
