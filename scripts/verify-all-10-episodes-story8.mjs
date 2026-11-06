import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";

async function verifyAllStory8Episodes() {
  console.log("=== VERIFYING ALL 10 EPISODES OF STORY 8 (FESTIVAL KOTA TUA) ===");
  const storyData = JSON.parse(fs.readFileSync("src/data/stories/story-08.json", "utf8"));
  console.log(`Story: ${storyData.title} (${storyData.titleEn})`);
  console.log(`Total Episodes loaded: ${storyData.episodes.length}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.error("BROWSER ERR:", err.message));

  await page.addInitScript(() => {
    sessionStorage.setItem("sinauu_sess_token", "test-token-all-s8");
    sessionStorage.setItem("sinau_auth_token", "test-token-all-s8");
    sessionStorage.setItem("sinau_auth_user", JSON.stringify({
      id: "user_test_all_s8",
      email: "scholar_all_s8@sinauenglish.test",
      displayName: "Penikmat Festival Lengkap",
      xp: 2500,
      coins: 1250,
      level: 14
    }));
    localStorage.setItem("sinau_local_profile", JSON.stringify({
      displayName: "Penikmat Festival Lengkap",
      xp: 2500,
      coins: 1250,
      level: 14
    }));
    // Pre-complete all episodes in dev fallback
    localStorage.setItem("sinau_story_progress_dev", JSON.stringify({
      "story-01": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-02": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-03": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-04": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-05": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-06": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-07": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "story-08": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }));
  });

  await page.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Click Story 8
  await page.locator("#story-catalog-card-story-08").click();
  await page.waitForTimeout(600);

  for (let i = 1; i <= 10; i++) {
    console.log(`Checking Episode card ${i}...`);
    const epNode = page.locator(`#episode-card-${i}`);
    await epNode.waitFor({ state: "visible", timeout: 5000 });

    const isLocked = await epNode.evaluate(el => el.classList.contains("is-locked"));
    console.log(`Episode card ${i} isLocked:`, isLocked);

    await epNode.scrollIntoViewIfNeeded();
    await epNode.click();
    await page.waitForTimeout(500);

    // Verify Modal
    const modal = page.locator("#story-runner-overlay");
    await modal.waitFor({ state: "visible", timeout: 5000 });

    // Step 1: Dialogue
    const dialogueStep = page.locator("#story-step-dialogue-content");
    await dialogueStep.waitFor({ state: "visible", timeout: 3000 });

    // Step 2: Vocab
    await page.locator("#step-btn-vocab").click();
    await page.waitForTimeout(300);
    const vocabStep = page.locator("#story-step-vocab-content");
    await vocabStep.waitFor({ state: "visible", timeout: 3000 });

    // Step 3: Quiz
    await page.locator("#step-btn-quiz").click();
    await page.waitForTimeout(300);
    const quizStep = page.locator("#story-step-quiz-content");
    await quizStep.waitFor({ state: "visible", timeout: 3000 });

    // Step 4: Summary
    await page.locator("#step-btn-summary").click();
    await page.waitForTimeout(300);
    const summaryStep = page.locator("#story-step-summary-content");
    await summaryStep.waitFor({ state: "visible", timeout: 3000 });

    // Close Runner
    await page.locator("#close-story-runner-btn").click();
    await modal.waitFor({ state: "hidden", timeout: 5000 });
    await page.waitForTimeout(400);

    console.log(`✓ Story 8 Episode ${i}: "${storyData.episodes[i - 1].title}" (All 4 steps verified)`);
  }

  await browser.close();
  console.log("=== ALL 10 EPISODES OF STORY 8 SUCCESSFULLY VERIFIED IN BROWSER! ===");
}

verifyAllStory8Episodes().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
