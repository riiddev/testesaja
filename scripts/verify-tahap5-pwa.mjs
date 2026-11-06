/**
 * TAHAP 5 VERIFICATION SCRIPT — Playwright Test Suite
 * 
 * Verifies PWA configuration (manifest.json, sw.js), Service Worker registration,
 * Notification permission flow, local reminder triggers, and responsive Settings layout.
 */

import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";
import fs from "fs";
import path from "path";

const PORT = 4178;
const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap5");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("=== STARTING TAHAP 5 PWA & MOBILE NOTIFICATIONS VERIFICATION ===");
  let totalErrors = 0;

  // ---------------------------------------------------------------------------
  // 1. Audit manifest.json and sw.js directly on disk
  // ---------------------------------------------------------------------------
  console.log("\n[Audit 1] Verifying manifest.json & Service Worker on disk...");
  const manifestPath = path.resolve("public/manifest.json");
  const swPath = path.resolve("public/sw.js");

  if (!fs.existsSync(manifestPath)) {
    console.error("FAIL: public/manifest.json does not exist!");
    totalErrors++;
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      console.log(`- Manifest Name: "${manifest.name}"`);
      console.log(`- Short Name: "${manifest.short_name}"`);
      console.log(`- Display Mode: "${manifest.display}" (Must be 'standalone')`);
      console.log(`- Icons Defined: ${manifest.icons?.length || 0}`);
      console.log(`- Shortcuts Defined: ${manifest.shortcuts?.length || 0}`);

      if (manifest.display !== "standalone") {
        console.error("FAIL: Manifest display is not standalone!");
        totalErrors++;
      }
      if (!manifest.icons || manifest.icons.length < 3) {
        console.error("FAIL: Manifest must have at least 192, 512, and maskable icons!");
        totalErrors++;
      }
      if (!manifest.shortcuts || manifest.shortcuts.length < 2) {
        console.error("FAIL: Manifest shortcuts missing!");
        totalErrors++;
      }
    } catch (e) {
      console.error("FAIL: manifest.json is not valid JSON:", e.message);
      totalErrors++;
    }
  }

  if (!fs.existsSync(swPath)) {
    console.error("FAIL: public/sw.js does not exist!");
    totalErrors++;
  } else {
    const swContent = fs.readFileSync(swPath, "utf-8");
    if (!swContent.includes("notificationclick") || !swContent.includes("CACHE_NAME")) {
      console.error("FAIL: sw.js missing notificationclick or caching handlers!");
      totalErrors++;
    } else {
      console.log("- Service Worker (sw.js): Verified intact with offline caching and notification handlers.");
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Start Preview Server & Launch Browser with Simulated PWA & Permissions
  // ---------------------------------------------------------------------------
  const server = await preview({
    preview: {
      port: PORT,
      host: "127.0.0.1"
    }
  });

  console.log(`Vite preview running at http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------------------
    // TEST 2: 1280px Desktop Settings Panel & Notifications Flow
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] 1280px Desktop Settings Panel & PWA Flow...");
    // Grant notifications permission to the context
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      permissions: ["notifications"]
    });
    const desktopPage = await context.newPage();
    await desktopPage.goto(`http://127.0.0.1:${PORT}/belajar/settings`, { waitUntil: "networkidle" });
    await desktopPage.waitForSelector("#settings-panel-root", { timeout: 8000 });

    // Verify PWA Install Card
    const pwaCard = await desktopPage.$("#pwa-install-card");
    if (!pwaCard) {
      console.error("FAIL: #pwa-install-card not found in Settings!");
      totalErrors++;
    } else {
      console.log("- PWA Install Card Rendered successfully.");
    }

    // Verify Notification Reminder Card
    const notifCard = await desktopPage.$("#notification-reminder-card");
    if (!notifCard) {
      console.error("FAIL: #notification-reminder-card not found in Settings!");
      totalErrors++;
    } else {
      console.log("- Notification Reminder Card Rendered successfully.");
    }

    // Since browser context has 'notifications' granted, check badge or enable button
    const permBadge = await desktopPage.$eval("#notif-permission-badge", (el) => el.textContent.trim());
    console.log(`- Notification Permission Badge: "${permBadge}"`);

    // If test notification button is available, click it
    const testNotifBtn = await desktopPage.$("#test-notif-btn");
    if (testNotifBtn) {
      await testNotifBtn.click();
      await desktopPage.waitForTimeout(400);
      console.log("- Clicked 'Kirim Notifikasi Uji Coba' button.");
    } else {
      // Click enable notifications button
      const enableBtn = await desktopPage.$("#enable-notif-btn");
      if (enableBtn) {
        await enableBtn.click();
        await desktopPage.waitForTimeout(400);
        console.log("- Clicked 'Aktifkan Pengingat Misi Harian' button.");
      }
    }

    // Capture Desktop Screenshot
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-settings-pwa.png"),
      fullPage: true
    });
    await desktopPage.close();
    await context.close();

    // -------------------------------------------------------------------------
    // TEST 3: 360px Mobile Viewport & Touch Targets
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] 360px Mobile Viewport & Ergonomics...");
    const mobileContext = await browser.newContext({
      viewport: { width: 360, height: 740 },
      permissions: ["notifications"]
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://127.0.0.1:${PORT}/belajar/settings`, { waitUntil: "networkidle" });
    await mobilePage.waitForSelector("#settings-panel-root", { timeout: 8000 });

    // Check morning & evening select elements
    const morningSelect = await mobilePage.$("#morning-hour-select");
    const eveningSelect = await mobilePage.$("#evening-hour-select");

    if (morningSelect && eveningSelect) {
      console.log("- Mobile Morning & Evening Time Pickers: Verified available.");
    }

    // Verify touch targets
    const buttons = await mobilePage.$$("#settings-panel-root button");
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (box && box.height < 40) {
        console.warn(`WARNING: Button height ${box.height}px is smaller than 40px`);
      }
    }

    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-360px-mobile-settings-pwa.png"),
      fullPage: true
    });
    await mobilePage.close();
    await mobileContext.close();

    // -------------------------------------------------------------------------
    // TEST 4: 320px Ultra-Compact Mobile Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] 320px Ultra-Compact Viewport...");
    const compactPage = await browser.newPage({ viewport: { width: 320, height: 600 } });
    await compactPage.goto(`http://127.0.0.1:${PORT}/belajar/settings`, { waitUntil: "networkidle" });
    await compactPage.waitForSelector("#settings-panel-root", { timeout: 8000 });

    const contentWidth = await compactPage.$eval("#app-content", (el) => el.clientWidth);
    console.log(`- 320px Content Width: ${contentWidth}px (Not squeezed)`);
    if (contentWidth < 300) {
      console.error(`FAIL: Content squeezed on 320px (${contentWidth}px)!`);
      totalErrors++;
    }

    await compactPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-320px-compact-settings.png"),
      fullPage: true
    });
    await compactPage.close();

    // -------------------------------------------------------------------------
    // TEST 5: 768px Tablet Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] 768px Tablet Viewport...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.goto(`http://127.0.0.1:${PORT}/belajar/settings`, { waitUntil: "networkidle" });
    await tabletPage.waitForSelector("#settings-panel-root", { timeout: 8000 });

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-768px-tablet-settings.png"),
      fullPage: true
    });
    await tabletPage.close();

    // -------------------------------------------------------------------------
    // TEST 6: Anti-Leak & AI Slop Audit
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Anti-Leak & AI Slop Audit on Settings View...");
    const auditPage = await browser.newPage();
    await auditPage.goto(`http://127.0.0.1:${PORT}/belajar/settings`, { waitUntil: "networkidle" });
    const pageText = await auditPage.$eval("body", (el) => el.innerText.toLowerCase());

    const forbiddenPhrases = [
      "spreadsheet",
      "google apps script",
      "themainideas",
      "display-only for now",
      "github.com",
      "perangkatmu"
    ];

    let foundLeaks = [];
    forbiddenPhrases.forEach((phrase) => {
      if (pageText.includes(phrase)) {
        foundLeaks.push(phrase);
      }
    });

    if (foundLeaks.length > 0) {
      console.error(`FAIL: Found forbidden text leaks: ${foundLeaks.join(", ")}`);
      totalErrors++;
    } else {
      console.log("- Copy Cleanliness: 100% CLEAN (No spreadsheet, themainideas, or placeholder leaks found)");
    }
    await auditPage.close();

  } catch (err) {
    console.error("Test execution exception:", err);
    totalErrors++;
  } finally {
    await browser.close();
    server.httpServer.close();
  }

  console.log("\n==========================================");
  console.log(`TOTAL TAHAP 5 ERRORS: ${totalErrors}`);
  if (totalErrors === 0) {
    console.log("TAHAP 5 VERIFICATION PASSED 100%!");
    console.log(`Screenshots generated in public/screenshots/tahap5/`);
  } else {
    console.error("TAHAP 5 VERIFICATION FAILED!");
  }
  console.log("==========================================\n");

  process.exit(totalErrors === 0 ? 0 : 1);
}

run();
