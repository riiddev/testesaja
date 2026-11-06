import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;

async function runTest() {
  console.log("=== TEST SEQUENTIAL STORY PROGRESSION ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on("console", msg => console.log("PAGE CONSOLE:", msg.text()));

  // Load origin first to set storage
  await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });

  // Clear story progress in localStorage and inject mock user auth in sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("sinauu_sess_token", "dev-token-seq");
    localStorage.setItem("sinau_story_progress_dev", JSON.stringify({}));
  });

  await page.goto("http://localhost:5173/belajar/adventure", { waitUntil: "networkidle" });
  await page.waitForSelector("#adventure-hub-view", { timeout: 10000 });
  await page.waitForTimeout(500);

  // Verify Stat: Cerita Terbuka should be "1 / 10"
  const statUnlocked = await page.$eval("#stat-stories-unlocked", el => el.textContent.trim());
  console.log("1. Stat Cerita Terbuka (Initial):", statUnlocked);
  if (statUnlocked !== "1 / 10") {
    throw new Error(`Expected 1 / 10 but got ${statUnlocked}`);
  }

  // Verify Story 1 is unlocked, Story 2 is locked
  const card1LockText = await page.$eval("#story-catalog-card-story-01 .story-lock-status-badge", el => el.textContent.trim());
  const card2LockText = await page.$eval("#story-catalog-card-story-02 .story-lock-status-badge", el => el.textContent.trim());
  console.log("2. Card 1 Status:", card1LockText);
  console.log("3. Card 2 Status:", card2LockText);

  if (!card1LockText.includes("Terbuka")) {
    throw new Error("Story 1 should be Terbuka!");
  }
  if (!card2LockText.includes("Cerita 1")) {
    throw new Error("Story 2 should require Cerita 1!");
  }

  // Try clicking Story 2: should NOT open roadmap
  await page.click("#story-catalog-card-story-02");
  await page.waitForTimeout(400);
  const isRoadmapOpen = await page.$("#story-episodes-roadmap-view");
  if (isRoadmapOpen) {
    throw new Error("Story 2 roadmap opened despite being locked!");
  }
  console.log("4. Successfully blocked click on locked Story 2.");

  // Test Step 2: Set Story 1 with 9 episodes completed (not 10)
  await page.evaluate(() => {
    localStorage.setItem("sinau_story_progress_dev", JSON.stringify({
      "story-01": [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#adventure-hub-view", { timeout: 10000 });
  await page.waitForTimeout(1000);

  const statUnlocked9 = await page.$eval("#stat-stories-unlocked", el => el.textContent.trim());
  const card2LockText9 = await page.$eval("#story-catalog-card-story-02 .story-lock-status-badge", el => el.textContent.trim());
  console.log("5. With 9 episodes completed in Story 1, Cerita Terbuka:", statUnlocked9);
  console.log("6. Card 2 Status with 9/10:", card2LockText9);
  if (statUnlocked9 !== "1 / 10" || !card2LockText9.includes("Cerita 1")) {
    throw new Error("Story 2 should remain locked when only 9/10 episodes completed!");
  }

  // Test Step 3: Complete all 10 episodes of Story 1
  await page.evaluate(() => {
    localStorage.setItem("sinau_story_progress_dev", JSON.stringify({
      "story-01": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#adventure-hub-view", { timeout: 10000 });
  await page.waitForTimeout(1000);

  const statUnlocked10 = await page.$eval("#stat-stories-unlocked", el => el.textContent.trim());
  const card1LockText10 = await page.$eval("#story-catalog-card-story-01 .story-lock-status-badge", el => el.textContent.trim());
  const card2LockText10 = await page.$eval("#story-catalog-card-story-02 .story-lock-status-badge", el => el.textContent.trim());
  console.log("7. With 10 episodes completed, Cerita Terbuka:", statUnlocked10);
  console.log("8. Card 1 Status with 10/10:", card1LockText10);
  console.log("9. Card 2 Status with Story 1 10/10:", card2LockText10);

  if (statUnlocked10 !== "2 / 10") {
    throw new Error(`Expected 2 / 10 stories unlocked, got ${statUnlocked10}`);
  }
  if (!card1LockText10.includes("Tamat")) {
    throw new Error("Story 1 should show Tamat (10/10)!");
  }
  if (!card2LockText10.includes("Terbuka")) {
    throw new Error("Story 2 should now be Terbuka!");
  }

  // Open Story 1 roadmap and verify completion banner + Next Story button
  await page.click("#story-catalog-card-story-01");
  await page.waitForSelector("#story-completion-banner", { timeout: 10000 });
  console.log("10. Found celebration banner in Story 1 roadmap.");

  // Click "Lanjut ke Cerita 2" button
  console.log("Clicking #go-to-next-story-btn...");
  await page.click("#go-to-next-story-btn");
  await page.waitForTimeout(1000);

  // Check what is currently visible
  const currentHero = await page.$(".story-hero-banner h2");
  if (!currentHero) {
    console.log("Could not find .story-hero-banner h2. Capturing screenshot...");
    await page.screenshot({ path: "scripts/story_debug.png" });
    const bodyText = await page.$eval("#adventure-hub-view", el => el.innerText.slice(0, 300));
    console.log("Current text in view:", bodyText);
    throw new Error("Hero banner not found after clicking next story!");
  }

  const heroTitle = await currentHero.textContent();
  console.log("11. Navigated to Next Story:", heroTitle.trim());
  if (!heroTitle.includes("Tersesat di Bandara")) {
    throw new Error(`Expected to navigate to Story 2 (Tersesat di Bandara), got ${heroTitle}`);
  }

  console.log("=== ALL SEQUENTIAL STORY PROGRESSION TESTS PASSED! ===");
  await browser.close();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
