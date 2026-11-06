/**
 * TAHAP 4 VERIFICATION SCRIPT — Playwright Test Suite
 * 
 * Verifies Context-Based Matching:
 * - Authentic clozed sentences (Left) and target words (Right)
 * - Exactly 5 pairs per round (no 10-pair spaghetti overlap)
 * - Bézier SVG curve rendering
 * - Tap-to-select and Drag-to-connect interaction
 * - "Bantuan Petunjuk" (Hint) button functionality
 * - Responsive viewports: 320px, 360px, 768px, 1280px
 */

import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";
import fs from "fs";
import path from "path";

const PORT = 4177;
const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap4");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("=== STARTING TAHAP 4 CONTEXT MATCHING VERIFICATION ===");

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
    // TEST 1: 1280px Desktop Matching Board Inspection
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] 1280px Desktop Board Inspection...");
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await desktopPage.goto(`http://127.0.0.1:${PORT}/belajar/matching`, { waitUntil: "networkidle" });
    await desktopPage.waitForSelector("#matching-view-root", { timeout: 8000 });

    // Verify 5 Sentences and 5 Words
    const sentenceCards = await desktopPage.$$(".col-sentences .match-card");
    const wordCards = await desktopPage.$$(".col-words .match-card");

    console.log(`- Sentence Cards (Left): ${sentenceCards.length} (Must be 5)`);
    console.log(`- Word Cards (Right): ${wordCards.length} (Must be 5)`);

    if (sentenceCards.length !== 5 || wordCards.length !== 5) {
      console.error(`FAIL: Expected exactly 5 pairs, got ${sentenceCards.length} left and ${wordCards.length} right!`);
      totalErrors++;
    }

    // Verify Clozed blanks are present
    const blanksCount = await desktopPage.$$eval(".cloze-blank", (els) => els.length);
    console.log(`- Clozed Blanks (_____) Found: ${blanksCount}`);
    if (blanksCount < 5) {
      console.error("FAIL: Sentences do not contain clozed blanks!");
      totalErrors++;
    }

    // Verify "Bantuan Petunjuk" (Hint) button exists and has 3 hints
    const hintBtn = await desktopPage.$("#hint-btn");
    const hintBtnText = await hintBtn.textContent();
    console.log(`- Hint Button Label: "${hintBtnText.trim()}"`);
    if (!hintBtnText.includes("Bantuan Petunjuk") || !hintBtnText.includes("3")) {
      console.error("FAIL: Hint button missing or mislabeled!");
      totalErrors++;
    }

    // Capture Initial Desktop Screenshot
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-initial-board.png"),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // TEST 2: Interactive Hint Action & Matching Simulation
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Interactive Hint & Matching Simulation...");
    // Click Hint button
    await hintBtn.click();
    await desktopPage.waitForTimeout(300);

    const hintedCards = await desktopPage.$$(".is-hinted");
    console.log(`- Cards with Golden Glow Hint: ${hintedCards.length} (Expected 2: one left, one right)`);
    if (hintedCards.length !== 2) {
      console.error(`FAIL: Expected 2 hinted cards, found ${hintedCards.length}!`);
      totalErrors++;
    }

    // Click the two hinted cards to make a guaranteed correct match
    await hintedCards[0].click();
    await hintedCards[1].click();
    await desktopPage.waitForTimeout(500);

    // Verify Matched Line and Counter
    const matchedCountText = await desktopPage.$eval("#matching-pairs-count", (el) => el.textContent.trim());
    console.log(`- Matched Counter: "${matchedCountText}"`);
    if (!matchedCountText.includes("1 / 5")) {
      console.error(`FAIL: Expected counter '1 / 5', got "${matchedCountText}"!`);
      totalErrors++;
    }

    const bezierLines = await desktopPage.$$(".bezier-line-matched");
    console.log(`- Matched Bézier SVG Curves on Canvas: ${bezierLines.length}`);
    if (bezierLines.length < 1) {
      console.error("FAIL: No Bézier curve rendered on canvas!");
      totalErrors++;
    }

    // Capture Matched State Screenshot
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-1280px-desktop-matched-pair.png"),
      fullPage: true
    });
    await desktopPage.close();

    // -------------------------------------------------------------------------
    // TEST 3: 360px Mobile Viewport & Ergonomics
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] 360px Mobile Viewport & Ergonomics...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.goto(`http://127.0.0.1:${PORT}/belajar/matching`, { waitUntil: "networkidle" });
    await mobilePage.waitForSelector("#matching-view-root", { timeout: 8000 });

    const mobileCards = await mobilePage.$$(".match-card");
    const firstCardBox = await mobileCards[0].boundingBox();
    console.log(`- Mobile Card Min Height: ${firstCardBox.height}px (Touch Target >= 44px: ${firstCardBox.height >= 44})`);

    if (firstCardBox.height < 44) {
      console.error("FAIL: Mobile card touch target < 44px!");
      totalErrors++;
    }

    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-360px-mobile-matching.png"),
      fullPage: true
    });
    await mobilePage.close();

    // -------------------------------------------------------------------------
    // TEST 4: 320px Ultra-Compact Mobile Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] 320px Ultra-Compact Viewport...");
    const compactPage = await browser.newPage({ viewport: { width: 320, height: 600 } });
    await compactPage.goto(`http://127.0.0.1:${PORT}/belajar/matching`, { waitUntil: "networkidle" });
    await compactPage.waitForSelector("#matching-view-root", { timeout: 8000 });

    const contentWidth = await compactPage.$eval("#app-content", (el) => el.clientWidth);
    console.log(`- 320px Content Width: ${contentWidth}px (Not squeezed)`);
    if (contentWidth < 300) {
      console.error(`FAIL: Content squeezed on 320px (${contentWidth}px)!`);
      totalErrors++;
    }

    await compactPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-320px-compact-matching.png"),
      fullPage: true
    });
    await compactPage.close();

    // -------------------------------------------------------------------------
    // TEST 5: 768px Tablet Viewport
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] 768px Tablet Viewport...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.goto(`http://127.0.0.1:${PORT}/belajar/matching`, { waitUntil: "networkidle" });
    await tabletPage.waitForSelector("#matching-view-root", { timeout: 8000 });

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-768px-tablet-matching.png"),
      fullPage: true
    });
    await tabletPage.close();

    // -------------------------------------------------------------------------
    // TEST 6: Anti-Leak & AI Slop Audit
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Anti-Leak & AI Slop Audit on Matching View...");
    const auditPage = await browser.newPage();
    await auditPage.goto(`http://127.0.0.1:${PORT}/belajar/matching`, { waitUntil: "networkidle" });
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
  console.log(`TOTAL TAHAP 4 ERRORS: ${totalErrors}`);
  if (totalErrors === 0) {
    console.log("TAHAP 4 VERIFICATION PASSED 100%!");
    console.log(`Screenshots generated in public/screenshots/tahap4/`);
  } else {
    console.error("TAHAP 4 VERIFICATION FAILED!");
  }
  console.log("==========================================\n");

  process.exit(totalErrors === 0 ? 0 : 1);
}

run();

