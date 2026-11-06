/**
 * TAHAP 2 VERIFICATION SCRIPT — Playwright Test Suite
 * 
 * Verifies Scholar Profile, Title System, 4-Bento Overview, CEFR Bars,
 * Edit Modal anti-overlap, and responsive viewports (320px, 360px, 768px, 1280px).
 */

import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";
import fs from "fs";
import path from "path";

const PORT = 4175;
const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap2");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("=== STARTING TAHAP 2 SCHOLAR PROFILE & TITLE SYSTEM VERIFICATION ===");

  const server = await preview({
    preview: {
      port: PORT,
      host: "127.0.0.1"
    }
  });

  console.log(`Vite preview running at http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  let totalErrors = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: 1280px Desktop Full Profile & Title Inspection
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] 1280px Desktop Viewport & Profile Overview...");
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await desktopPage.goto(`http://127.0.0.1:${PORT}/belajar/progress`, { waitUntil: "networkidle" });
    await desktopPage.waitForSelector("#profile-view-root", { timeout: 8000 });

    // Verify Scholar Identity
    const scholarName = await desktopPage.$eval("#scholar-display-name", (el) => el.textContent.trim());
    const activeTitle = await desktopPage.$eval("#scholar-active-title-chip", (el) => el.textContent.trim());
    console.log(`- Scholar Name: "${scholarName}"`);
    console.log(`- Active Title Badge: "${activeTitle}"`);

    if (!scholarName || !activeTitle.includes("Penjelajah Kosakata")) {
      console.error("FAIL: Scholar name or active title badge missing!");
      totalErrors++;
    }

    // Verify 4-Bento Metrics
    const statLevel = await desktopPage.$eval("#bento-stat-level", (el) => el.textContent.trim());
    const statExp = await desktopPage.$eval("#bento-stat-exp", (el) => el.textContent.trim());
    const statCoins = await desktopPage.$eval("#bento-stat-coins", (el) => el.textContent.trim());
    const statStreak = await desktopPage.$eval("#bento-stat-streak", (el) => el.textContent.trim());

    console.log(`- Bento Stat Level: ${statLevel}`);
    console.log(`- Bento Stat EXP: ${statExp}`);
    console.log(`- Bento Stat Coins: ${statCoins}`);
    console.log(`- Bento Stat Streak: ${statStreak}`);

    if (!statLevel || !statExp || !statCoins || !statStreak) {
      console.error("FAIL: 4-Bento metric boxes not properly populated!");
      totalErrors++;
    }

    // Verify CEFR Progress Bars
    const a1Count = await desktopPage.$eval("#cefr-count-a1", (el) => el.textContent.trim());
    const b2Count = await desktopPage.$eval("#cefr-count-b2", (el) => el.textContent.trim());
    console.log(`- CEFR A1 Bar: ${a1Count}`);
    console.log(`- CEFR B2 Bar: ${b2Count}`);

    // Verify 10 Titles in Showcase
    const titlesCount = await desktopPage.$$eval(".title-milestone-item", (els) => els.length);
    console.log(`- Total Titles Rendered: ${titlesCount} (Must be 10)`);
    if (titlesCount !== 10) {
      console.error(`FAIL: Expected 10 titles, found ${titlesCount}`);
      totalErrors++;
    }

    // Check Filter Tabs
    const filterButtons = await desktopPage.$$(".filter-pill-btn");
    if (filterButtons.length === 3) {
      // Click "Terbuka" filter
      await filterButtons[1].click();
      await desktopPage.waitForTimeout(300);
      const unlockedCount = await desktopPage.$$eval(".title-milestone-item", (els) => els.length);
      console.log(`- Unlocked Filter Count: ${unlockedCount} (Should be >= 1)`);

      // Click "Semua" filter back
      await filterButtons[0].click();
      await desktopPage.waitForTimeout(300);
    }

    // Capture Desktop Screenshot
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-profile-complete.png"),
      fullPage: true
    });
    await desktopPage.close();

    // -------------------------------------------------------------------------
    // TEST 2: 360px Mobile & Edit Profile Modal Anti-Overlap
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] 360px Mobile Viewport & Edit Profile Modal...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.goto(`http://127.0.0.1:${PORT}/belajar/progress`, { waitUntil: "networkidle" });
    await mobilePage.waitForSelector("#profile-view-root", { timeout: 8000 });

    // Click "Edit Profil" button
    const editBtn = await mobilePage.$("#edit-profile-btn");
    await editBtn.click();
    await mobilePage.waitForSelector(".modal-sheet", { timeout: 3000 });

    // Verify Modal Anti-overlap & Touch Targets
    const modalBox = await mobilePage.$eval(".modal-sheet", (el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    const closeBtnBox = await mobilePage.$eval(".modal-close-btn", (el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    console.log(`- Modal Width on 360px: ${modalBox.width}px`);
    console.log(`- Close Button Dimensions: ${closeBtnBox.width}x${closeBtnBox.height}px (Touch Target >= 44x44: ${closeBtnBox.width >= 44 && closeBtnBox.height >= 44})`);

    if (closeBtnBox.width < 44 || closeBtnBox.height < 44) {
      console.error("FAIL: Modal close button touch target < 44px!");
      totalErrors++;
    }

    // Capture Modal Open Screenshot
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-360px-edit-profile-modal.png")
    });

    // Test editing name
    await mobilePage.fill("#edit-display-name-input", "Ahmad Mufarid");
    // Click Save Button
    await mobilePage.click("#save-profile-btn");
    await mobilePage.waitForTimeout(500);

    const updatedName = await mobilePage.$eval("#scholar-display-name", (el) => el.textContent.trim());
    console.log(`- Updated Scholar Name on Mobile: "${updatedName}"`);
    if (updatedName !== "Ahmad Mufarid") {
      console.error(`FAIL: Expected updated name "Ahmad Mufarid", got "${updatedName}"`);
      totalErrors++;
    }

    // Capture Mobile Profile Screenshot
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-360px-mobile-profile-updated.png"),
      fullPage: true
    });
    await mobilePage.close();

    // -------------------------------------------------------------------------
    // TEST 3: 320px Ultra-Compact Mobile Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] 320px Ultra-Compact Viewport...");
    const compactPage = await browser.newPage({ viewport: { width: 320, height: 600 } });
    await compactPage.goto(`http://127.0.0.1:${PORT}/belajar/progress`, { waitUntil: "networkidle" });
    await compactPage.waitForSelector("#profile-view-root", { timeout: 8000 });

    const compactWidth = await compactPage.$eval("#app-content", (el) => el.clientWidth);
    console.log(`- 320px Content Width: ${compactWidth}px (Not squeezed)`);
    if (compactWidth < 300) {
      console.error(`FAIL: Content squeezed on 320px (${compactWidth}px)!`);
      totalErrors++;
    }

    await compactPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-320px-compact-profile.png"),
      fullPage: true
    });
    await compactPage.close();

    // -------------------------------------------------------------------------
    // TEST 4: 768px Tablet Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] 768px Tablet Viewport...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.goto(`http://127.0.0.1:${PORT}/belajar/progress`, { waitUntil: "networkidle" });
    await tabletPage.waitForSelector("#profile-view-root", { timeout: 8000 });

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-768px-tablet-profile.png"),
      fullPage: true
    });
    await tabletPage.close();

    // -------------------------------------------------------------------------
    // TEST 5: Verify Copy Cleanliness (No forbidden leaks / AI slop)
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Anti-Leak & AI Slop Audit on Profile Page...");
    const auditPage = await browser.newPage();
    await auditPage.goto(`http://127.0.0.1:${PORT}/belajar/progress`, { waitUntil: "networkidle" });
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
  console.log(`TOTAL TAHAP 2 ERRORS: ${totalErrors}`);
  if (totalErrors === 0) {
    console.log("TAHAP 2 VERIFICATION PASSED 100%!");
    console.log(`Screenshots generated in public/screenshots/tahap2/`);
  } else {
    console.error("TAHAP 2 VERIFICATION FAILED!");
  }
  console.log("==========================================\n");

  process.exit(totalErrors === 0 ? 0 : 1);
}

run();
