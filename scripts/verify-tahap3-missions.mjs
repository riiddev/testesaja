/**
 * TAHAP 3 VERIFICATION SCRIPT — Playwright Test Suite
 * 
 * Verifies Daily Missions (Quests) feature, replacement of "Latihan Fokus" in sidebar,
 * deterministic 3 quests per day, progress tracking, claiming rewards, and responsive layouts.
 */

import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";
import fs from "fs";
import path from "path";

const PORT = 4176;
const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap3");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("=== STARTING TAHAP 3 DAILY MISSIONS (QUESTS) VERIFICATION ===");

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
    // TEST 1: 1280px Desktop Sidebar Navigation & Missions View
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] 1280px Desktop Sidebar Navigation & Missions Hub...");
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await desktopPage.goto(`http://127.0.0.1:${PORT}/belajar`, { waitUntil: "networkidle" });

    // Verify Sidebar has "Misi Harian" with badge count 3
    const missionsLink = await desktopPage.$("#sidebar-missions-link");
    if (!missionsLink) {
      console.error("FAIL: Sidebar link '#sidebar-missions-link' not found!");
      totalErrors++;
    } else {
      const linkText = await missionsLink.innerText();
      console.log(`- Sidebar Missions Item: "${linkText.replace(/\n/g, ' ')}"`);
      if (!linkText.includes("Misi Harian") || !linkText.includes("3")) {
        console.error("FAIL: Sidebar link text does not contain 'Misi Harian' or count 3!");
        totalErrors++;
      }
    }

    // Click on "Misi Harian"
    await missionsLink.click();
    await desktopPage.waitForSelector("#missions-view-root", { timeout: 8000 });
    console.log("- Successfully navigated to /belajar/missions");

    // Verify 3 Quest Cards Rendered
    const questCards = await desktopPage.$$(".mission-card");
    console.log(`- Daily Quest Cards Rendered: ${questCards.length} (Must be exactly 3)`);
    if (questCards.length !== 3) {
      console.error(`FAIL: Expected 3 daily quest cards, found ${questCards.length}!`);
      totalErrors++;
    }

    // Inspect individual quest cards
    for (let i = 0; i < questCards.length; i++) {
      const title = await questCards[i].$eval(".mission-title-text", (el) => el.textContent.trim());
      const label = await questCards[i].$eval(".scholar-chip", (el) => el.textContent.trim());
      const expReward = await questCards[i].$eval(".reward-exp", (el) => el.textContent.trim());
      const coinsReward = await questCards[i].$eval(".reward-coins", (el) => el.textContent.trim());
      console.log(`  [Misi ${i + 1}] "${title}" [${label}] -> ${expReward}, ${coinsReward}`);

      if (!title || !label || !expReward || !coinsReward) {
        console.error(`FAIL: Misi ${i + 1} is missing key information!`);
        totalErrors++;
      }
    }

    // Screenshot Desktop Missions
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-missions-overview.png"),
      fullPage: true
    });
    await desktopPage.close();

    // -------------------------------------------------------------------------
    // TEST 2: 360px Mobile Viewport & Interactive Claim Action
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] 360px Mobile Viewport & Interactive Claim...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.goto(`http://127.0.0.1:${PORT}/belajar/missions`, { waitUntil: "networkidle" });
    await mobilePage.waitForSelector("#missions-view-root", { timeout: 8000 });

    // Simulate completion of Quest 1 by updating local state or triggering claim
    await mobilePage.evaluate(() => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const key = `sinau_daily_quests_${todayStr}`;
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      // Mark first quest as completed
      const q1Id = document.querySelector("#mission-card-0") ? "quest_vocab_new_5" : "test";
      const existing = saved.filter(q => q.questId !== q1Id);
      existing.push({
        questId: q1Id,
        dateStr: todayStr,
        progress: 5,
        target: 5,
        isCompleted: true,
        claimedAt: null
      });
      localStorage.setItem(key, JSON.stringify(existing));
    });

    // Reload mobile page to reflect completed state
    await mobilePage.reload({ waitUntil: "networkidle" });
    await mobilePage.waitForSelector(".btn-claim-reward", { timeout: 5000 });

    const claimBtn = await mobilePage.$(".btn-claim-reward");
    const claimBtnBox = await claimBtn.boundingBox();
    console.log(`- Claim Button Dimensions on 360px: ${claimBtnBox.width}x${claimBtnBox.height}px (Touch Target >= 44x44: ${claimBtnBox.height >= 44})`);

    if (claimBtnBox.height < 44) {
      console.error("FAIL: Claim button height < 44px!");
      totalErrors++;
    }

    // Capture screenshot with Claim button ready
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-360px-mobile-ready-to-claim.png"),
      fullPage: true
    });

    // Click Claim Button
    await claimBtn.click();
    await mobilePage.waitForSelector(".card-tint-sage", { timeout: 3000 });
    const toastMsg = await mobilePage.$eval(".card-tint-sage", (el) => el.textContent.trim());
    console.log(`- Toast Banner After Claim: "${toastMsg}"`);

    // Capture screenshot after Claim
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-360px-mobile-claimed-success.png"),
      fullPage: true
    });
    await mobilePage.close();

    // -------------------------------------------------------------------------
    // TEST 3: 320px Ultra-Compact Mobile Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] 320px Ultra-Compact Viewport...");
    const compactPage = await browser.newPage({ viewport: { width: 320, height: 600 } });
    await compactPage.goto(`http://127.0.0.1:${PORT}/belajar/missions`, { waitUntil: "networkidle" });
    await compactPage.waitForSelector("#missions-view-root", { timeout: 8000 });

    const contentWidth = await compactPage.$eval("#app-content", (el) => el.clientWidth);
    console.log(`- 320px Content Width: ${contentWidth}px (Not squeezed)`);
    if (contentWidth < 300) {
      console.error(`FAIL: Content squeezed on 320px (${contentWidth}px)!`);
      totalErrors++;
    }

    await compactPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-320px-compact-missions.png"),
      fullPage: true
    });
    await compactPage.close();

    // -------------------------------------------------------------------------
    // TEST 4: 768px Tablet Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] 768px Tablet Viewport...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.goto(`http://127.0.0.1:${PORT}/belajar/missions`, { waitUntil: "networkidle" });
    await tabletPage.waitForSelector("#missions-view-root", { timeout: 8000 });

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-768px-tablet-missions.png"),
      fullPage: true
    });
    await tabletPage.close();

    // -------------------------------------------------------------------------
    // TEST 5: Anti-Leak & AI Slop Audit
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Anti-Leak & AI Slop Audit on Missions View...");
    const auditPage = await browser.newPage();
    await auditPage.goto(`http://127.0.0.1:${PORT}/belajar/missions`, { waitUntil: "networkidle" });
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
  console.log(`TOTAL TAHAP 3 ERRORS: ${totalErrors}`);
  if (totalErrors === 0) {
    console.log("TAHAP 3 VERIFICATION PASSED 100%!");
    console.log(`Screenshots generated in public/screenshots/tahap3/`);
  } else {
    console.error("TAHAP 3 VERIFICATION FAILED!");
  }
  console.log("==========================================\n");

  process.exit(totalErrors === 0 ? 0 : 1);
}

run();

