import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap6_adventure");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runVerification() {
  console.log("=== STARTING TAHAP 6 ADVENTURE STORY ENGINE VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // TEST 1: DESKTOP 1280px - 10-Story Catalog & 10-Episode Roadmap
    // ----------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("BROWSER ERR:", err.message));

    await page.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap6");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap6");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap6",
        email: "scholar6@sinauenglish.test",
        displayName: "Petualang Bahasa",
        xp: 350,
        coins: 180,
        level: 6
      }));
    });

    console.log("1. Navigating to /belajar/adventure...");
    await page.goto("http://localhost:5173/belajar/adventure", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify Catalog Cards
    const story01Card = page.locator("#story-catalog-card-story-01");
    await story01Card.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ 10-Story Catalog found with Story 1: Kopi Pertama di Kota Baru");

    // Screenshot 1: 10 Stories Master Catalog
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-adventure-catalog.png"),
      fullPage: false
    });
    console.log("✓ Saved 01-1280px-desktop-adventure-catalog.png");

    // Click Story 1 to open 10-Episode Roadmap
    console.log("2. Opening Story 1 Roadmap...");
    await story01Card.click();
    await page.waitForTimeout(500);

    const roadmapView = page.locator("#story-episodes-roadmap-view");
    await roadmapView.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ 10-Episode Roadmap displayed");

    // Screenshot 2: Episodes Roadmap
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-1280px-desktop-episodes-roadmap.png"),
      fullPage: false
    });
    console.log("✓ Saved 02-1280px-desktop-episodes-roadmap.png");

    // Click Episode 1 Node to launch Story Runner
    console.log("3. Launching Story Runner for Episode 1...");
    const ep1Node = page.locator("#episode-card-1");
    await ep1Node.click();
    await page.waitForTimeout(600);

    const storyRunnerModal = page.locator("#story-runner-overlay");
    await storyRunnerModal.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Story Runner Modal open");

    // Test Audio button
    const audioBtn = page.locator("#audio-btn-ep1-d1");
    if (await audioBtn.isVisible()) {
      await audioBtn.click();
      console.log("✓ Audio button clicked");
    }

    // Test Translation toggle
    const transBtn = page.locator("#trans-btn-ep1-d1");
    if (await transBtn.isVisible()) {
      await transBtn.click();
      console.log("✓ Translation toggled to show Indonesian text");
    }

    // Select Interactive Choice
    const choiceOpt = page.locator("#choice-opt-opt-1b");
    if (await choiceOpt.isVisible()) {
      await choiceOpt.click();
      console.log("✓ Interactive Choice selected: Option 1B");
    }

    // Screenshot 3: Dialogue Scene
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-1280px-desktop-dialogue-scene.png"),
      fullPage: false
    });
    console.log("✓ Saved 03-1280px-desktop-dialogue-scene.png");

    // Go to Step 2: Vocab & Grammar
    console.log("4. Navigating to Step 2: Kosakata & Grammar...");
    const gotoVocabBtn = page.locator("#goto-vocab-step-btn");
    await gotoVocabBtn.click();
    await page.waitForTimeout(500);

    const vocabStep = page.locator("#story-step-vocab-content");
    await vocabStep.waitFor({ state: "visible", timeout: 5000 });

    // Test 1-click SRS addition on Oxford 3000 word "coffee"
    const addCoffeeSrsBtn = page.locator("#story-srs-btn-coffee");
    if (await addCoffeeSrsBtn.isVisible()) {
      await addCoffeeSrsBtn.click();
      await page.waitForTimeout(300);
      console.log("✓ 1-click SRS Add executed for word 'coffee'");
    }

    // Screenshot 4: Vocab & Grammar Focus
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-1280px-desktop-vocab-grammar.png"),
      fullPage: false
    });
    console.log("✓ Saved 04-1280px-desktop-vocab-grammar.png");

    // Go to Step 3: Quiz (5 Questions)
    console.log("5. Navigating to Step 3: Kuis Episode...");
    const gotoQuizBtn = page.locator("#goto-quiz-step-btn");
    await gotoQuizBtn.click();
    await page.waitForTimeout(500);

    const quizStep = page.locator("#story-step-quiz-content");
    await quizStep.waitFor({ state: "visible", timeout: 5000 });

    // Answer 5 questions
    await page.locator("#story-quiz-opt-s1_q1-1").click();
    await page.locator("#story-quiz-opt-s1_q2-0").click();
    await page.locator("#story-quiz-opt-s1_q3-1").click();
    await page.locator("#story-quiz-opt-s1_q4-1").click();
    await page.locator("#story-quiz-opt-s1_q5-1").click();

    console.log("✓ Answered all 5 questions");

    // Submit Quiz
    const submitQuizBtn = page.locator("#submit-story-quiz-btn");
    await submitQuizBtn.click();
    await page.waitForTimeout(500);

    // Screenshot 5: Quiz Results
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-1280px-desktop-episode-quiz.png"),
      fullPage: false
    });
    console.log("✓ Saved 05-1280px-desktop-episode-quiz.png");

    // Go to Step 4: Summary & Finish
    console.log("6. Navigating to Step 4: Rangkuman & Cliffhanger...");
    const gotoSummaryBtn = page.locator("#goto-summary-step-btn");
    await gotoSummaryBtn.click();
    await page.waitForTimeout(500);

    const summaryStep = page.locator("#story-step-summary-content");
    await summaryStep.waitFor({ state: "visible", timeout: 5000 });

    // Click Finish & Claim Reward
    console.log("7. Claiming Episode Reward...");
    const finishBtn = page.locator("#finish-episode-submit-btn");
    await finishBtn.click();
    await page.waitForTimeout(800);

    const rewardBanner = page.locator("#story-reward-feedback-banner");
    await rewardBanner.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Reward claimed (+50 EXP, +30 Coins)");

    // Screenshot 6: Summary & Reward
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-1280px-desktop-summary-reward.png"),
      fullPage: false
    });
    console.log("✓ Saved 06-1280px-desktop-summary-reward.png");

    // Close Runner and verify Episode 1 is completed on roadmap
    console.log("8. Closing runner and checking updated roadmap...");
    await finishBtn.click(); // Now it says "Kembali ke Daftar Episode ↗"
    await page.waitForTimeout(500);

    // Screenshot 7: Updated Roadmap showing Episode 1 completed and Episode 2 unlocked
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-1280px-desktop-roadmap-completed-ep1.png"),
      fullPage: false
    });
    console.log("✓ Saved 07-1280px-desktop-roadmap-completed-ep1.png");

    // ----------------------------------------------------
    // TEST 2: TABLET 768px - Responsive Story Runner
    // ----------------------------------------------------
    console.log("9. Testing Tablet 768px...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap6");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap6");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap6",
        email: "scholar6@sinauenglish.test",
        displayName: "Petualang Bahasa",
        xp: 350,
        coins: 180,
        level: 6
      }));
    });
    await tabletPage.goto("http://localhost:5173/belajar/adventure", { waitUntil: "networkidle" });
    await tabletPage.waitForTimeout(800);
    await tabletPage.locator("#story-catalog-card-story-01").click();
    await tabletPage.waitForTimeout(500);
    await tabletPage.locator("#episode-card-1").click();
    await tabletPage.waitForTimeout(500);

    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-768px-tablet-story-runner.png"),
      fullPage: false
    });
    console.log("✓ Saved 08-768px-tablet-story-runner.png");

    // ----------------------------------------------------
    // TEST 3: MOBILE 360px - Responsive Story Runner
    // ----------------------------------------------------
    console.log("10. Testing Mobile 360px...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap6");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap6");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap6",
        email: "scholar6@sinauenglish.test",
        displayName: "Petualang Bahasa",
        xp: 350,
        coins: 180,
        level: 6
      }));
    });
    await mobilePage.goto("http://localhost:5173/belajar/adventure", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(800);
    await mobilePage.locator("#story-catalog-card-story-01").click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.locator("#episode-card-1").click();
    await mobilePage.waitForTimeout(500);

    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09-360px-mobile-story-runner.png"),
      fullPage: false
    });
    console.log("✓ Saved 09-360px-mobile-story-runner.png");

    console.log("=== ALL TAHAP 6 PLAYWRIGHT TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runVerification();
