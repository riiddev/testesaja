import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
import fs from "fs";
const { chromium } = pkg;

async function runTest() {
  console.log("=== TEST INTERACTIVE WIDGET SUITE ON MOBILE & TABLET ===");

  if (!fs.existsSync("widgets_screenshots")) {
    fs.mkdirSync("widgets_screenshots", { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // TEST 1: MOBILE VIEWPORT (360x780)
  console.log("--- Testing on Mobile (360x780) ---");
  const mobileContext = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });
  await mobilePage.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("sinauu_sess_token", "dev-token-widgets");
    localStorage.setItem("sinau_story_progress_dev", JSON.stringify({ "story-01": [1, 2] }));
  });

  await mobilePage.goto("http://localhost:5173/belajar/overview", { waitUntil: "networkidle" });
  await mobilePage.waitForSelector("#widget-deck-container", { timeout: 10000 });
  console.log("1. Mobile: Widget Deck mounted.");

  // Check all 5 widgets present
  const w1 = await mobilePage.$("#widget-word-of-day");
  const w2 = await mobilePage.$("#widget-streak-level");
  const w3 = await mobilePage.$("#widget-kanci-tips");
  const w4 = await mobilePage.$("#widget-quick-srs");
  const w5 = await mobilePage.$("#widget-story-progress");

  if (!w1 || !w2 || !w3 || !w4 || !w5) {
    throw new Error("One or more widgets missing on initial render!");
  }
  console.log("2. Mobile: All 5 widgets rendered successfully.");

  // Check no horizontal document scroll on 360px viewport
  const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
  console.log(`3. Mobile: doc scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
  if (scrollWidth > clientWidth) {
    throw new Error(`Horizontal scroll detected on mobile! ${scrollWidth} > ${clientWidth}`);
  }

  await mobilePage.screenshot({ path: "widgets_screenshots/mobile-360-widgets-overview.png", fullPage: false });

  // Test Collapse/Expand
  console.log("Testing collapse toggle...");
  await mobilePage.click("#toggle-widget-collapse-btn");
  await mobilePage.waitForTimeout(300);
  const gridVisible = await mobilePage.$("#widgets-grid");
  if (gridVisible) {
    throw new Error("Widgets grid should be hidden when collapsed!");
  }
  console.log("4. Mobile: Collapse toggle successfully hid widgets.");

  // Expand again
  await mobilePage.click("#toggle-widget-collapse-btn");
  await mobilePage.waitForTimeout(300);
  const gridBack = await mobilePage.$("#widgets-grid");
  if (!gridBack) {
    throw new Error("Widgets grid should be restored when un-collapsed!");
  }
  console.log("5. Mobile: Expand toggle successfully restored widgets.");

  // Test Modal Configuration ("Atur Pilihan Widget")
  console.log("Opening widget config modal...");
  await mobilePage.click("#open-widget-config-btn");
  await mobilePage.waitForSelector("#widget-config-modal", { timeout: 5000 });
  await mobilePage.screenshot({ path: "widgets_screenshots/mobile-widget-config-modal.png" });

  // Toggle off word_of_day
  await mobilePage.click("#widget-toggle-row-word_of_day");
  await mobilePage.waitForTimeout(200);
  // Click Selesai
  await mobilePage.click("#save-widget-config-btn");
  await mobilePage.waitForTimeout(300);

  // Verify word_of_day is no longer in grid
  const w1After = await mobilePage.$("#widget-word-of-day");
  if (w1After) {
    throw new Error("word_of_day widget should be hidden after toggling off!");
  }
  console.log("6. Mobile: Successfully toggled off widget and persisted preference.");

  await mobileContext.close();

  // TEST 2: TABLET LANDSCAPE (1024x768)
  console.log("--- Testing on Tablet Landscape (1024x768) ---");
  const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const tabletPage = await tabletContext.newPage();

  await tabletPage.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });
  await tabletPage.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("sinauu_sess_token", "dev-token-widgets");
    localStorage.setItem("sinau_story_progress_dev", JSON.stringify({ "story-01": [1, 2, 3] }));
  });

  await tabletPage.goto("http://localhost:5173/belajar/overview", { waitUntil: "networkidle" });
  await tabletPage.waitForSelector("#widget-deck-container", { timeout: 10000 });

  // Test interactive actions:
  // Kanci tip rotation
  const tip1Text = await tabletPage.$eval("#widget-kanci-tips h5", el => el.textContent.trim());
  await tabletPage.click("#widget-kanci-tips button");
  await tabletPage.waitForTimeout(200);
  const tip2Text = await tabletPage.$eval("#widget-kanci-tips h5", el => el.textContent.trim());
  console.log(`7. Tablet: Kanci Tip rotated from "${tip1Text}" to "${tip2Text}".`);
  if (tip1Text === tip2Text) {
    throw new Error("Kanci Tip did not rotate on click!");
  }

  // Word of the day SRS button
  const srsBtnText = await tabletPage.$eval("#widget-word-of-day .widget-card-footer button", el => el.textContent.trim());
  console.log("8. Tablet: Word of Day button initial text:", srsBtnText);
  await tabletPage.click("#widget-word-of-day .widget-card-footer button");
  await tabletPage.waitForTimeout(200);
  const srsBtnAfter = await tabletPage.$eval("#widget-word-of-day .widget-card-footer button", el => el.textContent.trim());
  console.log("9. Tablet: Word of Day button text after click:", srsBtnAfter);
  if (!srsBtnAfter.includes("Masuk SRS")) {
    throw new Error("SRS button did not update to Masuk SRS!");
  }

  // Check no horizontal document scroll on tablet
  const tScrollWidth = await tabletPage.evaluate(() => document.documentElement.scrollWidth);
  const tClientWidth = await tabletPage.evaluate(() => document.documentElement.clientWidth);
  console.log(`10. Tablet: doc scrollWidth=${tScrollWidth}, clientWidth=${tClientWidth}`);
  if (tScrollWidth > tClientWidth) {
    throw new Error(`Horizontal scroll detected on tablet! ${tScrollWidth} > ${tClientWidth}`);
  }

  await tabletPage.screenshot({ path: "widgets_screenshots/tablet-landscape-widgets.png", fullPage: false });

  await tabletContext.close();
  await browser.close();

  console.log("=== ALL WIDGET SUITE TESTS PASSED SUCCESSFULLY! ===");
}

runTest().catch((err) => {
  console.error("Widget test failed:", err);
  process.exit(1);
});

