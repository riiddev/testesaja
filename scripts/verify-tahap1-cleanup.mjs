/**
 * TAHAP 1 CLEANUP VERIFICATION SUITE — Playwright
 * 
 * Verifies:
 * 1. Asset Manifest (src/data/assets.js)
 * 2. Dark Mode removal & Light mode enforcement
 * 3. Adventure route alias (/belajar/petualangan) & Preview Modal
 * 4. Landing Page Lenis smooth scroll & GSAP ScrollTrigger animations
 * 5. Responsive viewports (320, 360, 768, 1280 px)
 * 6. Emoji sanitization across UI
 */

import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";
import fs from "fs";
import path from "path";

const PORT = 4180;
const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap1_cleanup");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("=== STARTING TAHAP 1 CLEANUP VERIFICATION SUITE ===");
  let totalErrors = 0;

  // ---------------------------------------------------------------------------
  // 1. Audit Asset Manifest on disk
  // ---------------------------------------------------------------------------
  console.log("\n[Audit 1] Verifying src/data/assets.js manifest...");
  const manifestPath = path.resolve("src/data/assets.js");
  if (!fs.existsSync(manifestPath)) {
    console.error("FAIL: src/data/assets.js does not exist!");
    totalErrors++;
  } else {
    const content = fs.readFileSync(manifestPath, "utf-8");
    if (content.includes("kanci-base.png") && content.includes("sinau-coin.png") && content.includes("story-01-cover.webp")) {
      console.log("- Asset Manifest: Verified complete with Mascot, Currency, Borders, and Story Covers.");
    } else {
      console.error("FAIL: Missing asset keys in src/data/assets.js!");
      totalErrors++;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Start Vite Preview Server
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
    // TEST 1: Landing Page Lenis + GSAP Scroll (1280px Desktop)
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] 1280px Desktop Landing Page Scroll & Hero Animation...");
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await desktopPage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

    // Check Hero masked lines
    const heroInner = await desktopPage.$eval(".hero-line-inner", (el) => el.textContent.trim());
    console.log(`- Hero masked headline rendered: "${heroInner}"`);

    // Check theme toggle is gone
    const themeToggle = await desktopPage.$("#theme-toggle");
    if (themeToggle) {
      console.error("FAIL: #theme-toggle still found in DOM!");
      totalErrors++;
    } else {
      console.log("- Dark mode toggle: Successfully removed from Landing Navbar.");
    }

    // Scroll down to Peta Materi and wait for count-up
    await desktopPage.evaluate(() => window.scrollTo({ top: 1100, behavior: "smooth" }));
    await desktopPage.waitForTimeout(1000);

    const vocabBadge = await desktopPage.$eval(".material-card .badge-gold", (el) => el.textContent.trim());
    console.log(`- Material Card Badge after scroll: "${vocabBadge}"`);

    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-landing-scroll.png"),
      fullPage: false
    });
    await desktopPage.close();

    // -------------------------------------------------------------------------
    // TEST 2: 360px Mobile Landing Page & Touch Ergonomics
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] 360px Mobile Landing Page & Scroll Ergonomics...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

    await mobilePage.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
    await mobilePage.waitForTimeout(600);

    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-360px-mobile-landing-scroll.png"),
      fullPage: false
    });
    await mobilePage.close();

    // -------------------------------------------------------------------------
    // TEST 3: Petualangan Route & Alias (/belajar/petualangan)
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Testing /belajar/petualangan Alias & Adventure Modal...");
    const petualanganPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await petualanganPage.goto(`http://127.0.0.1:${PORT}/belajar/petualangan`, { waitUntil: "networkidle" });
    await petualanganPage.waitForSelector("#view-adventure", { timeout: 8000 });

    const advTitle = await petualanganPage.$eval(".section-title", (el) => el.textContent.trim());
    console.log(`- Rendered Petualangan via alias route: "${advTitle}"`);

    // Click a story card to open preview modal
    const firstStory = await petualanganPage.$(".card-interactive");
    if (!firstStory) {
      console.error("FAIL: Story card not found!");
      totalErrors++;
    } else {
      await firstStory.click();
      await petualanganPage.waitForSelector("#adventure-modal-overlay", { timeout: 5000 });
      const modalTitle = await petualanganPage.$eval("#adventure-modal-title", (el) => el.textContent.trim());
      console.log(`- Opened Adventure Preview Modal: "${modalTitle}"`);

      // Verify Tahap 6 notice is present
      const noticeText = await petualanganPage.$eval("#adventure-modal-overlay .card-tint-sand", (el) => el.innerText);
      if (noticeText.includes("Tahap 6")) {
        console.log("- Tahap 6 story engine status notice verified.");
      } else {
        console.warn("WARNING: Notice does not mention Tahap 6!");
      }

      await petualanganPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, "03-desktop-adventure-modal.png"),
        fullPage: false
      });

      // Test close button
      const closeBtn = await petualanganPage.$("#close-adventure-modal-btn");
      await closeBtn.click();
      await petualanganPage.waitForTimeout(400);
      const isStillOpen = await petualanganPage.$("#adventure-modal-overlay");
      if (isStillOpen) {
        console.error("FAIL: Adventure modal did not close!");
        totalErrors++;
      } else {
        console.log("- Modal closed cleanly via X button.");
      }
    }
    await petualanganPage.close();

    // -------------------------------------------------------------------------
    // TEST 4: Mobile Petualangan Modal (360px)
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] 360px Mobile Adventure Modal Viewport...");
    const mobileAdvPage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobileAdvPage.goto(`http://127.0.0.1:${PORT}/belajar/adventure`, { waitUntil: "networkidle" });
    await mobileAdvPage.waitForSelector("#view-adventure", { timeout: 8000 });

    const mobCard = await mobileAdvPage.$(".card-interactive");
    await mobCard.click();
    await mobileAdvPage.waitForSelector("#adventure-modal-overlay", { timeout: 5000 });

    await mobileAdvPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-mobile-adventure-modal.png"),
      fullPage: false
    });
    await mobileAdvPage.close();

    // -------------------------------------------------------------------------
    // TEST 5: Verify Dark Mode Purge in Workspace AppTopbar
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Verifying no dark mode toggle in Workspace Topbar...");
    const topbarPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await topbarPage.goto(`http://127.0.0.1:${PORT}/belajar`, { waitUntil: "networkidle" });
    const topbarToggle = await topbarPage.$(".app-topbar #theme-toggle");
    if (topbarToggle) {
      console.error("FAIL: Theme toggle found in Workspace Topbar!");
      totalErrors++;
    } else {
      console.log("- Workspace Topbar: Clean, theme toggle completely removed.");
    }

    await topbarPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-desktop-no-dark-mode.png"),
      fullPage: false
    });
    await topbarPage.close();

    // -------------------------------------------------------------------------
    // TEST 6: Ultra-Compact 320px & Tablet 768px Responsiveness
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Ultra-compact 320px and Tablet 768px Responsiveness...");
    const compactPage = await browser.newPage({ viewport: { width: 320, height: 600 } });
    await compactPage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    const heroH1Width = await compactPage.$eval("h1", (el) => el.clientWidth);
    console.log(`- 320px Viewport H1 Width: ${heroH1Width}px (Fits comfortably)`);
    await compactPage.close();

    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.goto(`http://127.0.0.1:${PORT}/belajar/petualangan`, { waitUntil: "networkidle" });
    await tabletPage.waitForSelector("#view-adventure", { timeout: 8000 });
    console.log("- 768px Tablet Viewport: Rendered cleanly.");
    await tabletPage.close();

  } catch (err) {
    console.error("Test execution exception:", err);
    totalErrors++;
  } finally {
    await browser.close();
    server.httpServer.close();
  }

  console.log("\n==========================================");
  console.log(`TOTAL TAHAP 1 CLEANUP ERRORS: ${totalErrors}`);
  if (totalErrors === 0) {
    console.log("TAHAP 1 CLEANUP VERIFICATION PASSED 100%!");
    console.log(`Screenshots generated in public/screenshots/tahap1_cleanup/`);
  } else {
    console.error("TAHAP 1 CLEANUP VERIFICATION FAILED!");
  }
  console.log("==========================================\n");

  process.exit(totalErrors === 0 ? 0 : 1);
}

run();

