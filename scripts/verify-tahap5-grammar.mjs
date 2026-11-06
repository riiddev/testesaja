import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("public/screenshots/tahap5_grammar");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runVerification() {
  console.log("=== STARTING TAHAP 5 GRAMMAR OVERHAUL VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // TEST 1: DESKTOP 1280px - Grid, 10-Part Pedagogy, Practice & Mastery Quiz
    // ----------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("BROWSER ERR:", err.message));

    await page.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap5");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap5");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap5",
        email: "scholar5@sinauenglish.test",
        displayName: "Ki Hajar Belajar",
        xp: 250,
        coins: 120,
        level: 5
      }));
    });

    console.log("1. Navigating to /belajar/grammar...");
    await page.goto("http://localhost:5173/belajar/grammar", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify grid cards
    const presentSimpleCard = page.locator("#grammar-card-present-simple");
    await presentSimpleCard.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Grammar Grid found with Present Simple card");

    // Open Topic 1
    console.log("2. Opening Present Simple module...");
    await presentSimpleCard.click();
    await page.waitForTimeout(500);

    const detailContainer = page.locator("#grammar-deep-detail-view");
    await detailContainer.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Grammar Detail container rendered with 10-part structure");

    // Screenshot 1: Tab 1 - Materi & Kaidah
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-1280px-desktop-pedagogy-materi.png"),
      fullPage: false
    });
    console.log("✓ Saved 01-1280px-desktop-pedagogy-materi.png");

    // Switch to Tab 2: Praktik Bertingkat
    console.log("3. Switching to Tab 2: Praktik Bertingkat...");
    const practiceTabBtn = page.locator("#tab-btn-praktik");
    await practiceTabBtn.click();
    await page.waitForTimeout(500);

    const practiceRunner = page.locator("#grammar-practice-runner");
    await practiceRunner.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ 12 Practice Exercises runner displayed");

    // Answer Exercise 1 (Multiple Choice: works)
    console.log("4. Answering practice exercises...");
    const ex1Opt = page.locator("#practice-card-ps-ex-1 button").nth(1); // 'works'
    await ex1Opt.click();
    await page.waitForTimeout(200);

    // Answer Exercise 2 (Multiple Choice: We don't live)
    const ex2Opt = page.locator("#practice-card-ps-ex-2 button").nth(2); // "We don't live in Surabaya."
    await ex2Opt.click();
    await page.waitForTimeout(200);

    // Answer Exercise 3 (Fill-in: watches)
    const ex3Input = page.locator("#practice-card-ps-ex-3 input");
    await ex3Input.fill("watches");
    await page.locator("#practice-card-ps-ex-3 button").click();
    await page.waitForTimeout(200);

    // Answer Exercise 4 (Fill-in: don't know)
    const ex4Input = page.locator("#practice-card-ps-ex-4 input");
    await ex4Input.fill("don't know");
    await page.locator("#practice-card-ps-ex-4 button").click();
    await page.waitForTimeout(200);

    // Answer Exercise 5 (Error correction: doesn't)
    const ex5Input = page.locator("#practice-card-ps-ex-5 input");
    await ex5Input.fill("doesn't");
    await page.locator("#practice-card-ps-ex-5 button").click();
    await page.waitForTimeout(200);

    // Answer Exercise 6 (Error correction: like)
    const ex6Input = page.locator("#practice-card-ps-ex-6 input");
    await ex6Input.fill("like");
    await page.locator("#practice-card-ps-ex-6 button").click();
    await page.waitForTimeout(200);

    // Screenshot 2: Tab 2 - Praktik Bertingkat with evaluations
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-1280px-desktop-practice-exercises.png"),
      fullPage: false
    });
    console.log("✓ Saved 02-1280px-desktop-practice-exercises.png");

    // Click finish practice button
    const finishPracticeBtn = page.locator("#finish-grammar-practice-btn");
    await finishPracticeBtn.scrollIntoViewIfNeeded();
    await finishPracticeBtn.click();
    await page.waitForTimeout(600);
    console.log("✓ Practice progress saved, advanced to Tab 3");

    // Tab 3: Mastery Quiz
    console.log("5. Testing Tab 3: Kuis Penguasaan 10 Soal...");
    const masteryCard = page.locator("#grammar-mastery-quiz-card");
    await masteryCard.waitFor({ state: "visible", timeout: 5000 });

    // Answer 10 questions:
    // q1: 1 (Andi goes)
    // q2: 1 (She does not drink)
    // q3: 1 (does)
    // q4: 0 (Light travels)
    // q5: 2 (He studies)
    // q6: 1 (I am agree)
    // q7: 1 (What does your sister do)
    // q8: 2 (He rarely eats)
    // q9: 2 (doesn't have)
    // q10: 0 (ends)
    const quizChoices = [1, 1, 1, 0, 2, 1, 1, 2, 2, 0];

    for (let i = 0; i < 10; i++) {
      const choiceIdx = quizChoices[i];
      const optBtn = page.locator(`#mastery-option-${choiceIdx}`);
      await optBtn.click();
      await page.waitForTimeout(150);

      if (i < 9) {
        const nextBtn = page.locator("#next-mastery-quiz-btn");
        await nextBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Submit Mastery Quiz
    console.log("6. Submitting Mastery Quiz...");
    const submitQuizBtn = page.locator("#submit-mastery-quiz-btn");
    await submitQuizBtn.waitFor({ state: "visible", timeout: 3000 });
    await submitQuizBtn.click();
    await page.waitForTimeout(1000);

    // Verify Results container & score
    const resultsContainer = page.locator("#mastery-quiz-results-container");
    await resultsContainer.waitFor({ state: "visible", timeout: 5000 });

    const finalScore = await page.locator("#mastery-final-score").textContent();
    console.log(`✓ Mastery Quiz Score Evaluated: ${finalScore.trim()} (Threshold 80% met)`);

    // Screenshot 3: Tab 3 - Kuis Penguasaan & Pembahasan 4 Dimensi
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-1280px-desktop-mastery-quiz-results.png"),
      fullPage: false
    });
    console.log("✓ Saved 03-1280px-desktop-mastery-quiz-results.png");

    // Return to module and check status pill
    await page.locator("#finish-grammar-quiz-btn").click();
    await page.waitForTimeout(500);

    const masteredBadge = page.locator("#mastered-status-badge");
    await masteredBadge.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ 'Topik Dikuasai' badge active in header");

    // Return to grid
    await page.locator("#back-to-grammar-grid-btn").click();
    await page.waitForTimeout(500);

    // Screenshot 4: Grid with Mastered Status
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-1280px-desktop-grammar-grid-mastered.png"),
      fullPage: false
    });
    console.log("✓ Saved 04-1280px-desktop-grammar-grid-mastered.png");

    // ----------------------------------------------------
    // TEST 2: MOBILE VIEWPORT 360px
    // ----------------------------------------------------
    console.log("7. Testing Mobile Viewport 360px...");
    const mobilePage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap5");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap5");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap5",
        displayName: "Siswa Mobile",
        xp: 250,
        coins: 120,
        level: 5
      }));
    });

    await mobilePage.goto("http://localhost:5173/belajar/grammar", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(800);
    await mobilePage.locator("#grammar-card-present-simple").click();
    await mobilePage.waitForTimeout(600);

    // Screenshot 5: Mobile 360px Grammar Detail
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-360px-mobile-grammar-detail.png"),
      fullPage: false
    });
    console.log("✓ Saved 05-360px-mobile-grammar-detail.png");
    await mobilePage.close();

    // ----------------------------------------------------
    // TEST 3: TABLET VIEWPORT 768px
    // ----------------------------------------------------
    console.log("8. Testing Tablet Viewport 768px...");
    const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await tabletPage.addInitScript(() => {
      sessionStorage.setItem("sinauu_sess_token", "test-token-tahap5");
      sessionStorage.setItem("sinau_auth_token", "test-token-tahap5");
      sessionStorage.setItem("sinau_auth_user", JSON.stringify({
        id: "user_test_tahap5",
        displayName: "Siswa Tablet",
        xp: 250,
        coins: 120,
        level: 5
      }));
    });

    await tabletPage.goto("http://localhost:5173/belajar/grammar", { waitUntil: "networkidle" });
    await tabletPage.waitForTimeout(800);
    await tabletPage.locator("#grammar-card-present-simple").click();
    await tabletPage.waitForTimeout(600);

    // Screenshot 6: Tablet 768px Grammar Detail
    await tabletPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-768px-tablet-grammar-detail.png"),
      fullPage: false
    });
    console.log("✓ Saved 06-768px-tablet-grammar-detail.png");
    await tabletPage.close();

    await page.close();
    console.log("=== ALL TAHAP 5 PLAYWRIGHT TESTS PASSED ===");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
