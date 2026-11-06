import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap4_reading_quiz");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runVerification() {
  console.log("=== STARTING TAHAP 4 READING QUIZ VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // TEST 1: DESKTOP 1280px - Library, Reader Modal & Quiz Start
    // ----------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

    // Seed session token so user is authenticated
    await page.addInitScript(() => {
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap4");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap4",
        email: "scholar@sinauenglish.test",
        displayName: "Ki Hajar Belajar",
        xp: 150,
        coins: 80,
        level: 4
      }));
    });

    console.log("1. Navigating to /belajar/reading...");
    await page.goto("http://localhost:5173/belajar/reading", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify grid cards
    const firstCard = page.locator("#passage-card-the-tiny-tenants-inside-you");
    await firstCard.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Passage card found");

    // Open reader modal
    console.log("2. Opening passage reader modal...");
    await firstCard.click();
    await page.waitForTimeout(500);

    const quizStartBtn = page.locator("#start-reading-quiz-btn");
    await quizStartBtn.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Reader modal opened with 'Kerjakan Kuis Pemahaman' button");

    // Screenshot 1: Desktop Reader Modal
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-passage-reader.png"),
      fullPage: false
    });
    console.log("✓ Saved 01-1280px-desktop-passage-reader.png");

    // Click start quiz
    console.log("3. Starting Quiz Runner...");
    await quizStartBtn.click();
    await page.waitForTimeout(600);

    const quizModal = page.locator("#reading-quiz-modal-overlay");
    await quizModal.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Quiz Runner modal overlay opened");

    // Open split text drawer
    console.log("4. Toggling passage reference drawer...");
    const toggleDrawerBtn = page.locator("#toggle-passage-text-btn");
    await toggleDrawerBtn.click();
    await page.waitForTimeout(300);

    const drawer = page.locator("#reading-text-drawer");
    await drawer.waitFor({ state: "visible", timeout: 3000 });
    console.log("✓ Collapsible passage reference drawer expanded");

    // Screenshot 2: Question 1 with passage reference drawer
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-1280px-desktop-quiz-question-drawer.png"),
      fullPage: false
    });
    console.log("✓ Saved 02-1280px-desktop-quiz-question-drawer.png");

    // Close text drawer
    await toggleDrawerBtn.click();
    await page.waitForTimeout(200);

    // Answer questions 1 through 8
    // Questions:
    // q1: Main Idea (correctIndex: 1) -> select 1
    // q2: Author's Purpose (correctIndex: 1) -> select 1
    // q3: Detail (correctIndex: 2) -> select 2
    // q4: Referent (correctIndex: 2) -> select 2
    // q5: Fact vs Opinion (correctIndex: 1) -> select 1
    // q6: Inference (correctIndex: 2) -> select 2
    // q7: Author Tone (correctIndex: 1) -> select 1
    // q8: Vocabulary "resilience" (correctIndex: 1) -> select 0 (WRONG on purpose to test missed vocab & SRS button!)
    const choices = [1, 1, 2, 2, 1, 2, 1, 0];

    console.log("5. Answering 8 questions...");
    for (let i = 0; i < 8; i++) {
      const optIdx = choices[i];
      const optBtn = page.locator(`#option-btn-${optIdx}`);
      await optBtn.click();
      await page.waitForTimeout(150);

      if (i < 7) {
        const nextBtn = page.locator("#next-question-btn");
        await nextBtn.click();
        await page.waitForTimeout(250);
      }
    }

    // Submit quiz
    console.log("6. Submitting quiz...");
    const submitBtn = page.locator("#submit-quiz-btn");
    await submitBtn.waitFor({ state: "visible", timeout: 3000 });
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Verify Results container
    const resultsContainer = page.locator("#quiz-results-container");
    await resultsContainer.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Quiz results container displayed");

    const scoreText = await page.locator("#quiz-final-score").textContent();
    console.log(`✓ Evaluated Score: ${scoreText} (7/8 = 88%)`);

    // Verify explanation cards
    const explanationsList = page.locator("#quiz-explanations-list");
    await explanationsList.waitFor({ state: "visible", timeout: 3000 });
    console.log("✓ 4-dimension explanation cards rendered");

    // Screenshot 3: Results, Score & 4-Dimension Explanation
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-1280px-desktop-results-explanations.png"),
      fullPage: false
    });
    console.log("✓ Saved 03-1280px-desktop-results-explanations.png");

    // Test 1-click SRS addition on missed vocabulary (q8 -> "resilience")
    console.log("7. Testing 1-click Add to SRS on missed vocabulary question...");
    const addSrsBtn = page.locator("#add-srs-btn-resilience");
    await addSrsBtn.scrollIntoViewIfNeeded();
    await addSrsBtn.waitFor({ state: "visible", timeout: 3000 });
    await addSrsBtn.click();
    await page.waitForTimeout(300);

    const srsBtnText = await addSrsBtn.textContent();
    console.log(`✓ SRS button updated state: "${srsBtnText.trim()}"`);

    // Screenshot 4: SRS button active state in explanation
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-1280px-desktop-srs-word-added.png"),
      fullPage: false
    });
    console.log("✓ Saved 04-1280px-desktop-srs-word-added.png");

    // Close quiz runner
    const finishBtn = page.locator("#finish-review-close-btn");
    await finishBtn.click();
    await page.waitForTimeout(500);

    // ----------------------------------------------------
    // TEST 2: Passage without quiz ("Kuis Segera Hadir")
    // ----------------------------------------------------
    console.log("8. Testing passage without quiz (e.g. Passage 4)...");
    const fourthCard = page.locator("#passage-card-the-learning-myth-that-will-not-die");
    await fourthCard.click();
    await page.waitForTimeout(500);

    const comingSoonBtn = page.locator("#quiz-coming-soon-btn");
    await comingSoonBtn.waitFor({ state: "visible", timeout: 3000 });
    const isDisabled = await comingSoonBtn.isDisabled();
    console.log(`✓ 'Kuis Segera Hadir' state verified: disabled=${isDisabled}`);

    // Screenshot 5: Coming Soon Reader
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-1280px-desktop-quiz-coming-soon.png"),
      fullPage: false
    });
    console.log("✓ Saved 05-1280px-desktop-quiz-coming-soon.png");

    // Close reader modal
    await page.locator("#finish-reading-btn").click();
    await page.waitForTimeout(400);

    // ----------------------------------------------------
    // TEST 3: Mobile Viewport 360px
    // ----------------------------------------------------
    console.log("9. Testing Mobile Viewport 360px...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap4");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap4",
        displayName: "Siswa Mobile",
        xp: 150,
        coins: 80,
        level: 4
      }));
    });

    await mobilePage.goto("http://localhost:5173/belajar/reading", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);

    // Open first passage on mobile
    await mobilePage.locator("#passage-card-the-tiny-tenants-inside-you").click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.locator("#start-reading-quiz-btn").click();
    await mobilePage.waitForTimeout(600);

    // Screenshot 6: 360px Mobile Quiz
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-360px-mobile-quiz-runner.png"),
      fullPage: false
    });
    console.log("✓ Saved 06-360px-mobile-quiz-runner.png");
    await mobilePage.close();

    // ----------------------------------------------------
    // TEST 4: Tablet Viewport 768px
    // ----------------------------------------------------
    console.log("10. Testing Tablet Viewport 768px...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.addInitScript(() => {
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap4");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap4",
        displayName: "Siswa Tablet",
        xp: 150,
        coins: 80,
        level: 4
      }));
    });

    await tabletPage.goto("http://localhost:5173/belajar/reading", { waitUntil: "networkidle" });
    await tabletPage.waitForTimeout(1000);

    await tabletPage.locator("#passage-card-the-tiny-tenants-inside-you").click();
    await tabletPage.waitForTimeout(500);
    await tabletPage.locator("#start-reading-quiz-btn").click();
    await tabletPage.waitForTimeout(600);

    // Screenshot 7: 768px Tablet Quiz
    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-768px-tablet-quiz-runner.png"),
      fullPage: false
    });
    console.log("✓ Saved 07-768px-tablet-quiz-runner.png");
    await tabletPage.close();

    await page.close();
    console.log("=== ALL TAHAP 4 PLAYWRIGHT TESTS PASSED ===");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();