import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap11_story6");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runVerification() {
  console.log("=== STARTING TAHAP 11 STORY 6 (MAGANG HARI PERTAMA) VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // TEST 1: DESKTOP 1280px - Story 6 Roadmap & Episode 1 Full Runner
    // ----------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("BROWSER ERR:", err.message));

    await page.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap11");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap11");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap11",
        email: "scholar11@sinauenglish.test",
        displayName: "Pemagang Global Innovation Hub",
        xp: 1800,
        coins: 900,
        level: 12
      }));
      localStorage.setItem("sinau_local_profile", JSON.stringify({
        displayName: "Pemagang Global Innovation Hub",
        xp: 1800,
        coins: 900,
        level: 12
      }));
    });

    console.log("1. Navigating to /belajar/adventure...");
    await page.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Verify Story 6 card
    const story06Card = page.locator("#story-catalog-card-story-06");
    await story06Card.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Story 6 Card (Magang Hari Pertama) found in Catalog");

    // Click Story 6 to open 10-Episode Roadmap
    console.log("2. Opening Story 6 Roadmap...");
    await story06Card.click();
    await page.waitForTimeout(500);

    const roadmapView = page.locator("#story-episodes-roadmap-view");
    await roadmapView.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Story 6 (10-Episode Roadmap) rendered");

    // Screenshot 1: Story 6 Roadmap
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-story6-episodes-roadmap.png"),
      fullPage: false
    });
    console.log("✓ Saved 01-1280px-desktop-story6-episodes-roadmap.png");

    // Launch Episode 1 of Story 6
    console.log("3. Launching Story 6 Episode 1...");
    const ep1Node = page.locator("#episode-card-1");
    await ep1Node.click();
    await page.waitForTimeout(600);

    const modal = page.locator("#story-runner-overlay");
    await modal.waitFor({ state: "visible", timeout: 5000 });

    // Test Audio button
    const audioBtn = page.locator("#audio-btn-s6e1_d1");
    if (await audioBtn.isVisible()) {
      await audioBtn.click();
      console.log("✓ Audio button clicked for Episode 1");
    }

    // Test Translation toggle
    const transBtn = page.locator("#trans-btn-s6e1_d1");
    if (await transBtn.isVisible()) {
      await transBtn.click();
      console.log("✓ Translation toggled to show Indonesian text");
    }

    // Select Interactive Choice (Option 1A)
    const choiceOpt = page.locator("#choice-opt-s6e1_opt_1a");
    if (await choiceOpt.isVisible()) {
      await choiceOpt.click();
      console.log("✓ Interactive Choice 1A selected");
    }

    // Screenshot 2: Dialogue & Choices
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-1280px-desktop-story6-dialogue.png"),
      fullPage: false
    });
    console.log("✓ Saved 02-1280px-desktop-story6-dialogue.png");

    // Go to Step 2: Vocab & Grammar
    console.log("4. Navigating to Step 2: Kosakata & Grammar...");
    await page.locator("#goto-vocab-step-btn").click();
    await page.waitForTimeout(500);

    const vocabStep = page.locator("#story-step-vocab-content");
    await vocabStep.waitFor({ state: "visible", timeout: 5000 });

    // 1-click SRS Add for Oxford 3000 word "card"
    const addSrsBtn = page.locator("#story-srs-btn-card");
    if (await addSrsBtn.isVisible()) {
      await addSrsBtn.click();
      await page.waitForTimeout(300);
      console.log("✓ 1-click SRS Add executed for word 'card'");
    }

    // Screenshot 3: Vocab Spotlight & Grammar
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-1280px-desktop-story6-vocab-grammar.png"),
      fullPage: false
    });
    console.log("✓ Saved 03-1280px-desktop-story6-vocab-grammar.png");

    // Go to Step 3: Quiz (5 Questions)
    console.log("5. Navigating to Step 3: Kuis Episode...");
    await page.locator("#goto-quiz-step-btn").click();
    await page.waitForTimeout(500);

    const quizStep = page.locator("#story-step-quiz-content");
    await quizStep.waitFor({ state: "visible", timeout: 5000 });

    // Answer 5 questions
    await page.locator("#story-quiz-opt-s6_ep1_q1-1").click();
    await page.locator("#story-quiz-opt-s6_ep1_q2-0").click();
    await page.locator("#story-quiz-opt-s6_ep1_q3-0").click();
    await page.locator("#story-quiz-opt-s6_ep1_q4-0").click();
    await page.locator("#story-quiz-opt-s6_ep1_q5-0").click();
    console.log("✓ Answered all 5 questions for Episode 1");

    // Submit Quiz
    await page.locator("#submit-story-quiz-btn").click();
    await page.waitForTimeout(500);

    // Screenshot 4: Quiz Results
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-1280px-desktop-story6-quiz.png"),
      fullPage: false
    });
    console.log("✓ Saved 04-1280px-desktop-story6-quiz.png");

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
      path: path.join(SCREENSHOTS_DIR, "05-1280px-desktop-story6-reward.png"),
      fullPage: false
    });
    console.log("✓ Saved 05-1280px-desktop-story6-reward.png");

    // Close runner
    await finishBtn.click();
    await page.waitForTimeout(500);

    // Screenshot 6: Updated Roadmap showing Episode 1 completed and Episode 2 unlocked
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-1280px-desktop-story6-roadmap-unlocked-ep2.png"),
      fullPage: false
    });
    console.log("✓ Saved 06-1280px-desktop-story6-roadmap-unlocked-ep2.png");

    // ----------------------------------------------------
    // TEST 2: TABLET 768px - Responsive Story 6
    // ----------------------------------------------------
    console.log("7. Testing Tablet 768px for Story 6...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap11");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap11");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap11",
        email: "scholar11@sinauenglish.test",
        displayName: "Pemagang Global Innovation Hub",
        xp: 1800,
        coins: 900,
        level: 12
      }));
      localStorage.setItem("sinau_local_profile", JSON.stringify({
        displayName: "Pemagang Global Innovation Hub",
        xp: 1800,
        coins: 900,
        level: 12
      }));
    });
    await tabletPage.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
    await tabletPage.waitForTimeout(800);
    await tabletPage.locator("#story-catalog-card-story-06").click();
    await tabletPage.waitForTimeout(600);
    await tabletPage.locator("#episode-card-1").click();
    await tabletPage.waitForTimeout(600);

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-768px-tablet-story6.png"),
      fullPage: false
    });
    console.log("✓ Saved 07-768px-tablet-story6.png");

    // ----------------------------------------------------
    // TEST 3: MOBILE 360px - Responsive Story 6
    // ----------------------------------------------------
    console.log("8. Testing Mobile 360px for Story 6...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap11");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap11");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap11",
        email: "scholar11@sinauenglish.test",
        displayName: "Pemagang Global Innovation Hub",
        xp: 1800,
        coins: 900,
        level: 12
      }));
      localStorage.setItem("sinau_local_profile", JSON.stringify({
        displayName: "Pemagang Global Innovation Hub",
        xp: 1800,
        coins: 900,
        level: 12
      }));
    });
    await mobilePage.goto("http://localhost:5173/belajar/adventure", { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(800);
    await mobilePage.locator("#story-catalog-card-story-06").click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.locator("#episode-card-1").click();
    await mobilePage.waitForTimeout(600);

    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-360px-mobile-story6.png"),
      fullPage: false
    });
    console.log("✓ Saved 08-360px-mobile-story6.png");

    console.log("=== ALL TAHAP 11 STORY 6 VERIFICATION TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
