/**
 * Browserless SPA route smoke test.
 *
 * Verifies that the built Vite SPA serves its entry document for the public
 * and workspace routes and that every JS/CSS asset referenced by index.html
 * is reachable. This is an HTTP smoke test, not a substitute for interactive
 * browser or physical-device visual testing.
 */

import assert from "node:assert/strict";
import { preview } from "vite";

const ROUTES = Object.freeze([
  "/",
  "/login",
  "/daftar",
  "/belajar",
  "/belajar/vocabulary",
  "/belajar/grammar",
  "/belajar/reading",
  "/belajar/settings",
  "/belajar/history"
]);

async function main() {
  const server = await preview({
    preview: {
      host: "127.0.0.1",
      port: 0,
      strictPort: true
    }
  });

  try {
    const address = server.httpServer.address();
    assert.ok(address && typeof address === "object", "Vite preview server must be listening");
    const baseUrl = "http://127.0.0.1:" + address.port;

    let entryHtml = "";

    for (const route of ROUTES) {
      const response = await fetch(baseUrl + route, { redirect: "manual" });
      assert.equal(response.status, 200, route + " must return HTTP 200");

      const contentType = response.headers.get("content-type") || "";
      assert.match(contentType, /text\/html/i, route + " must serve the SPA HTML document");

      const html = await response.text();
      assert.match(html, /<div[^>]+id=["']root["']/, route + " must contain the React root mount");
      assert.match(html, /SinauEnglish/i, route + " must contain the SinauEnglish document title");

      if (route === "/") entryHtml = html;
      console.log("[OK] " + route + " -> HTTP 200");
    }

    const assets = [...entryHtml.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)]
      .map((match) => match[1]);
    const uniqueAssets = [...new Set(assets)];

    assert.ok(
      uniqueAssets.some((asset) => /\.js(?:$|\?)/.test(asset)),
      "index.html must reference a JavaScript application bundle"
    );
    assert.ok(
      uniqueAssets.some((asset) => /\.css(?:$|\?)/.test(asset)),
      "index.html must reference a CSS stylesheet"
    );

    for (const asset of uniqueAssets) {
      const response = await fetch(baseUrl + asset, { redirect: "manual" });
      assert.equal(response.status, 200, "Referenced build asset must be reachable: " + asset);
      console.log("[OK] asset " + asset);
    }

    const manifestResponse = await fetch(baseUrl + "/manifest.json");
    assert.equal(manifestResponse.status, 200, "PWA manifest must be reachable");
    const manifest = await manifestResponse.json();
    assert.ok(manifest.name || manifest.short_name, "PWA manifest must include an app name");

    console.log(
      "SPA ROUTE SMOKE PASSED: " +
      ROUTES.length +
      " routes, " +
      uniqueAssets.length +
      " build assets, and PWA manifest verified."
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.httpServer.close((error) => error ? reject(error) : resolve());
    });
  }
}

main().catch((error) => {
  console.error("SPA ROUTE SMOKE FAILED:", error?.message || "Unexpected error");
  process.exitCode = 1;
});
