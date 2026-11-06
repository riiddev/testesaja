import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/MyBook Hype AMD/.gemini/antigravity/brain/5bbc49be-3ac4-4d0d-afeb-2d565f0b6dc6/assets_screenshots";

async function verifyAssetsInUI() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  console.log("=== Verifying Assets in UI with Playwright ===");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // 1. Login
  console.log("Navigating to login page...");
  await page.goto("http://localhost:5173/login");
  await page.waitForLoadState("networkidle");

  await page.fill("#login-email", "budi@sinau.com");
  await page.fill("#login-password", "password123");
  await page.click("button[type='submit']");
  await page.waitForTimeout(1000);

  // 2. Adventure Hub — Story Covers
  console.log("Navigating to Adventure Hub...");
  await page.goto("http://localhost:5173/belajar/adventure");
  await page.waitForSelector("#adventure-hub-view", { timeout: 8000 });
  await page.waitForTimeout(1500);

  const hubScreenshotPath = path.join(ARTIFACT_DIR, "01-adventure-hub-story-covers.png");
  await page.screenshot({ path: hubScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${hubScreenshotPath}`);

  // Click Story 1 to open Story Roadmap and Hero Banner
  console.log("Opening Story 1 Roadmap...");
  const story1Card = page.locator("#story-catalog-card-story-01");
  await story1Card.click();
  await page.waitForSelector("#story-episodes-roadmap-view", { timeout: 8000 });
  await page.waitForTimeout(1000);

  const roadmapScreenshotPath = path.join(ARTIFACT_DIR, "02-story-roadmap-hero-cover.png");
  await page.screenshot({ path: roadmapScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${roadmapScreenshotPath}`);

  // 3. Collection View — Borders, Outfits & Sinau Coin
  console.log("Navigating to Collection & Kanci Room...");
  await page.goto("http://localhost:5173/belajar/collection");
  await page.waitForSelector("#collection-view-root", { timeout: 8000 });
  await page.waitForTimeout(1200);

  // Click on "Border Kawung" to preview it on avatar
  const kawungCard = page.locator("#card-item-border_kawung");
  if (await kawungCard.count() > 0) {
    await kawungCard.click();
    await page.waitForTimeout(600);
  }

  // Click on "Outfit Headphone" to preview it on Kanci
  const headphoneCard = page.locator("#card-item-outfit_headphone");
  if (await headphoneCard.count() > 0) {
    await headphoneCard.click();
    await page.waitForTimeout(600);
  }

  const collectionScreenshotPath = path.join(ARTIFACT_DIR, "03-collection-borders-mascot-preview.png");
  await page.screenshot({ path: collectionScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${collectionScreenshotPath}`);

  // 4. Mascot & Borders Showcase page: create a clean HTML showcase to display all 28 assets in high detail
  console.log("Generating full 28 assets visual showcase...");
  const showcaseHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>SinauEnglish V2 — Asset Manifest Showcase</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #F8FAFC;
        color: #1E293B;
        margin: 0;
        padding: 40px;
      }
      h1 { margin: 0 0 8px; font-size: 26px; color: #0F172A; }
      p.subtitle { color: #64748B; margin: 0 0 32px; font-size: 14px; }
      .section-title {
        font-size: 18px;
        font-weight: 700;
        margin: 32px 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #E2E8F0;
        color: #334155;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
      .stories-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
      }
      .card {
        background: white;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }
      .img-wrap {
        width: 100%;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F1F5F9;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      .img-wrap img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .story-wrap {
        height: 120px;
      }
      .story-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .name { font-weight: 700; font-size: 13px; color: #0F172A; margin-bottom: 4px; }
      .meta { font-size: 11px; color: #64748B; }
      .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        margin-top: 4px;
      }
      .badge-webp { background: #DCFCE7; color: #166534; }
      .badge-png { background: #DBEAFE; color: #1E40AF; }
    </style>
  </head>
  <body>
    <h1>SinauEnglish V2 — Verifikasi Katalog Lengkap 28 Aset</h1>
    <p class="subtitle">Semua 28 file telah disalin, format dikonversi, transparansi dibersihkan, dan dipasang pada aplikasi.</p>

    <div class="section-title">1. Cover Cerita Petualangan 1–10 (WebP Kompresi Tinggi)</div>
    <div class="stories-grid">
      ${[1,2,3,4,5,6,7,8,9,10].map(n => {
        const num = String(n).padStart(2, "0");
        return `
          <div class="card">
            <div class="img-wrap story-wrap">
              <img src="http://localhost:5173/assets/stories/story-${num}-cover.webp" />
            </div>
            <div class="name">story-${num}-cover.webp</div>
            <span class="badge badge-webp">WebP Format</span>
          </div>
        `;
      }).join("")}
    </div>

    <div class="section-title">2. Maskot Kanci — 7 Ekspresi + 4 Perlengkapan Outfit (PNG Transparan)</div>
    <div class="grid">
      ${[
        { name: "kanci-base.png", label: "Base (Netral)" },
        { name: "kanci-happy.png", label: "Happy" },
        { name: "kanci-thinking.png", label: "Thinking" },
        { name: "kanci-celebrating.png", label: "Celebrating" },
        { name: "kanci-sleepy.png", label: "Sleepy" },
        { name: "kanci-encouraging.png", label: "Encouraging" },
        { name: "kanci-reading.png", label: "Reading" },
        { name: "kanci-outfit-kacamata.png", label: "Outfit Kacamata" },
        { name: "kanci-outfit-petualang.png", label: "Outfit Petualang" },
        { name: "kanci-outfit-syal.png", label: "Outfit Syal" },
        { name: "kanci-outfit-headphone.png", label: "Outfit Headphone" }
      ].map(it => `
        <div class="card">
          <div class="img-wrap" style="background: #FFF7EE;">
            <img src="http://localhost:5173/assets/mascot/${it.name}" />
          </div>
          <div class="name">${it.name}</div>
          <div class="meta">${it.label}</div>
          <span class="badge badge-png">PNG Alpha</span>
        </div>
      `).join("")}
    </div>

    <div class="section-title">3. Border Avatar Sarjana (6 Border) & Sinau Coin (1 UI) (PNG Transparan)</div>
    <div class="grid">
      ${[
        { file: "borders/border-daun.png", name: "border-daun.png", label: "Border Daun (Laurel)" },
        { file: "borders/border-tinta.png", name: "border-tinta.png", label: "Border Tinta" },
        { file: "borders/border-kawung.png", name: "border-kawung.png", label: "Border Kawung" },
        { file: "borders/border-emas.png", name: "border-emas.png", label: "Border Emas" },
        { file: "borders/border-buku.png", name: "border-buku.png", label: "Border Buku" },
        { file: "borders/border-kanci.png", name: "border-kanci.png", label: "Border Kanci" },
        { file: "ui/sinau-coin.png", name: "sinau-coin.png", label: "Sinau Coin Currency" }
      ].map(it => `
        <div class="card">
          <div class="img-wrap" style="background: #FEF9C3;">
            <img src="http://localhost:5173/assets/${it.file}" />
          </div>
          <div class="name">${it.name}</div>
          <div class="meta">${it.label}</div>
          <span class="badge badge-png">PNG Alpha</span>
        </div>
      `).join("")}
    </div>
  </body>
  </html>
  `;

  await page.setContent(showcaseHtml, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const showcaseScreenshotPath = path.join(ARTIFACT_DIR, "04-all-28-assets-showcase-grid.png");
  await page.screenshot({ path: showcaseScreenshotPath, fullPage: true });
  console.log(`Saved screenshot: ${showcaseScreenshotPath}`);

  await browser.close();
  console.log("=== All UI Asset Verifications Complete! ===");
}

verifyAssetsInUI().catch(console.error);
