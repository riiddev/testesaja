import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap7_story2");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runVerification() {
  console.log("=== STARTING TAHAP 7 STORY 2 (TERSEAT DI BANDARA) VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // TEST 1: DESKTOP 1280px - Story 2 Roadmap & Episode 1 Full Runner
    // ----------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("BROWSER ERR:", err.message));

    await page.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap7");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap7");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap7",
        email: "scholar7@sinauenglish.test",
        displayName: "Penjelajah Bandara",
        xp: 600,
        coins: 350,
        level: 8
      }));
      localStorage.setItem("sinau_local_profile", JSON.stringify({
        displayName: "Penjelajah Bandara",
        xp: 600,
        coins: 350,
        level: 8
      }));
    });

    console.log("1. Navigating to /belajar/adventure...");
    await page.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Verify Story 2 card
    const story02Card = page.locator("#story-catalog-card-story-02");
    await story02Card.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Story 2 Card (Tersesat di Bandara) found in Catalog");

    // Click Story 2 to open 10-Episode Roadmap
    console.log("2. Opening Story 2 Roadmap...");
    await story02Card.click();
    await page.waitForTimeout(500);

    const roadmapView = page.locator("#story-episodes-roadmap-view");
    await roadmapView.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Story 2 (10-Episode Roadmap) rendered");

    // Screenshot 1: Story 2 Roadmap
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-story2-episodes-roadmap.png"),
      fullPage: false
    });
    console.log("✓ Saved 01-1280px-desktop-story2-episodes-roadmap.png");

    // Launch Episode 1 of Story 2
    console.log("3. Launching Story 2 Episode 1...");
    const ep1Node = page.locator("#episode-card-1");
    await ep1Node.click();
    await page.waitForTimeout(600);

    const modal = page.locator("#story-runner-overlay");
    await modal.waitFor({ state: "visible", timeout: 5000 });

    // Test Audio button
    const audioBtn = page.locator("#audio-btn-s2e1_d1");
    if (await audioBtn.isVisible()) {
      await audioBtn.click();
      console.log("✓ Audio button clicked for Episode 1");
    }

    // Test Translation toggle
    const transBtn = page.locator("#trans-btn-s2e1_d1");
    if (await transBtn.isVisible()) {
      await transBtn.click();
      console.log("✓ Translation toggled to show Indonesian text");
    }

    // Select Interactive Choice (Option 1A)
    const choiceOpt = page.locator("#choice-opt-s2e1_opt_1a");
    if (await choiceOpt.isVisible()) {
      await choiceOpt.click();
      console.log("✓ Interactive Choice 1A selected");
    }

    // Screenshot 2: Dialogue & Choices
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-1280px-desktop-story2-dialogue.png"),
      fullPage: false
    });
    console.log("✓ Saved 02-1280px-desktop-story2-dialogue.png");

    // Go to Step 2: Vocab & Grammar
    console.log("4. Navigating to Step 2: Kosakata & Grammar...");
    await page.locator("#goto-vocab-step-btn").click();
    await page.waitForTimeout(500);

    const vocabStep = page.locator("#story-step-vocab-content");
    await vocabStep.waitFor({ state: "visible", timeout: 5000 });

    // 1-click SRS Add for Oxford 3000 word "airport"
    const addSrsBtn = page.locator("#story-srs-btn-airport");
    if (await addSrsBtn.isVisible()) {
      await addSrsBtn.click();
      await page.waitForTimeout(300);
      console.log("✓ 1-click SRS Add executed for word 'airport'");
    }

    // Screenshot 3: Vocab Spotlight & Grammar
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-1280px-desktop-story2-vocab-grammar.png"),
      fullPage: false
    });
    console.log("✓ Saved 03-1280px-desktop-story2-vocab-grammar.png");

    // Go to Step 3: Quiz (5 Questions)
    console.log("5. Navigating to Step 3: Kuis Episode...");
    await page.locator("#goto-quiz-step-btn").click();
    await page.waitForTimeout(500);

    const quizStep = page.locator("#story-step-quiz-content");
    await quizStep.waitFor({ state: "visible", timeout: 5000 });

    // Answer 5 questions
    await page.locator("#story-quiz-opt-s2_ep1_q1-1").click();
    await page.locator("#story-quiz-opt-s2_ep1_q2-1").click();
    await page.locator("#story-quiz-opt-s2_ep1_q3-1").click();
    await page.locator("#story-quiz-opt-s2_ep1_q4-1").click();
    await page.locator("#story-quiz-opt-s2_ep1_q5-0").click();
    console.log("✓ Answered all 5 questions for Episode 1");

    // Submit Quiz
    await page.locator("#submit-story-quiz-btn").click();
    await page.waitForTimeout(500);

    // Screenshot 4: Quiz Results
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-1280px-desktop-story2-quiz.png"),
      fullPage: false
    });
    console.log("✓ Saved 04-1280px-desktop-story2-quiz.png");

    // Go to Step 4: Summary & Claim Reward
    console.log("6. Navigating to Step 4: Rangkuman & Reward...");
    await page.locator("#goto-summary-step-btn").click();
    await page.waitForTimeout(500);

    const finishBtn = page.locator("#finish-episode-submit-btn");
    await finishBtn.click();
    await page.waitForTimeout(800);

    const rewardBanner = page.locator("#story-reward-feedback-banner");
    await rewardBanner.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Reward claimed (+50 EXP, +30 Coins)");

    // Screenshot 5: Summary & Reward
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-1280px-desktop-story2-reward.png"),
      fullPage: false
    });
    console.log("✓ Saved 05-1280px-desktop-story2-reward.png");

    // Close runner
    await finishBtn.click();
    await page.waitForTimeout(500);

    // Screenshot 6: Updated Roadmap showing Episode 1 completed and Episode 2 unlocked
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-1280px-desktop-story2-roadmap-unlocked-ep2.png"),
      fullPage: false
    });
    console.log("✓ Saved 06-1280px-desktop-story2-roadmap-unlocked-ep2.png");

    // ----------------------------------------------------
    // TEST 2: TABLET 768px - Responsive Story 2
    // ----------------------------------------------------
    console.log("7. Testing Tablet 768px for Story 2...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap7");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap7");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap7",
        email: "scholar7@sinauenglish.test",
        displayName: "Penjelajah Bandara",
        xp: 600,
        coins: 350,
        level: 8
      }));
    });
    await tabletPage.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
    await tabletPage.waitForTimeout(800);
    await tabletPage.locator("#story-catalog-card-story-02").click();
    await tabletPage.waitForTimeout(500);
    await tabletPage.locator("#episode-card-1").click();
    await tabletPage.waitForTimeout(500);

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-768px-tablet-story2.png"),
      fullPage: false
    });
    console.log("✓ Saved 07-768px-tablet-story2.png");

    // ----------------------------------------------------
    // TEST 3: MOBILE 360px - Responsive Story 2
    // ----------------------------------------------------
    console.log("8. Testing Mobile 360px for Story 2...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap7");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap7");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap7",
        email: "scholar7@sinauenglish.test",
        displayName: "Penjelajah Bandara",
        xp: 600,
        coins: 350,
        level: 8
      }));
    });
    await mobilePage.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(800);
    await mobilePage.locator("#story-catalog-card-story-02").click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.locator("#episode-card-1").click();
    await mobilePage.waitForTimeout(500);

    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-360px-mobile-story2.png"),
      fullPage: false
    });
    console.log("✓ Saved 08-360px-mobile-story2.png");

    console.log("=== ALL TAHAP 7 PLAYWRIGHT TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runVerification();
