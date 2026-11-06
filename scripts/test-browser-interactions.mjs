import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;

async function main() {
  console.log("Launching browser to test full interaction suite...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", (err) => {
    console.error("PAGE ERROR:", err.message);
    errors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("CONSOLE ERROR:", msg.text());
      errors.push(msg.text());
    }
  });

  // 1. Visit landing page
  console.log("Testing landing page: http://localhost:5173/");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  const landingTitle = await page.title();
  console.log("Landing page loaded:", landingTitle);

  // Test theme toggle on landing page
  const themeToggle = await page.$("#theme-toggle");
  if (themeToggle) {
    await themeToggle.click();
    console.log("Landing theme toggled to dark");
    await themeToggle.click();
    console.log("Landing theme toggled back to light");
  }

  // 2. Visit workspace
  console.log("Navigating to workspace: http://localhost:5173/belajar.html");
  await page.goto("http://localhost:5173/belajar.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Test each sidebar navigation view
  const views = ["overview", "vocabulary", "study", "grammar", "reading", "adventure", "review", "progress", "settings"];
  for (const view of views) {
    console.log(`Switching to view: ${view}`);
    const navItem = await page.$(`.sidebar-link[data-view="${view}"]`);
    if (navItem) {
      await navItem.click();
      await page.waitForTimeout(300);
      const activeSection = await page.$(`#view-${view}`);
      const isVisible = activeSection ? await activeSection.isVisible() : false;
      if (!isVisible) {
        errors.push(`View ${view} is not visible after clicking nav item.`);
      }
    } else {
      errors.push(`Sidebar link for view ${view} not found.`);
    }
  }

  // 3. Deep test on Vocabulary view
  console.log("Deep testing Vocabulary view...");
  await page.click(`.sidebar-link[data-view="vocabulary"]`);
  await page.waitForTimeout(600);

  // Filter A2
  const filterA2 = await page.$('.chip[data-level="A2"]');
  if (filterA2) {
    await filterA2.click();
    await page.waitForTimeout(400);
    console.log("Filtered by A2");
  }

  // Search word
  const searchInput = await page.$("#vocab-search");
  if (searchInput) {
    await searchInput.fill("book");
    await page.waitForTimeout(400);
    console.log("Searched for 'book'");
  }

  // Click first card to open modal
  const firstCard = await page.$(".vocab-card");
  if (firstCard) {
    await firstCard.click();
    await page.waitForTimeout(400);
    const modal = await page.$("#modal-overlay");
    const isModalOpen = modal ? await modal.evaluate(el => el.classList.contains("is-open")) : false;
    console.log("Vocab modal opened:", isModalOpen);
    if (!isModalOpen) errors.push("Vocab modal failed to open upon card click.");
    
    // Close modal
    const closeBtn = await page.$("#modal-close-btn");
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(200);
      const isStillOpen = await modal.evaluate(el => el.classList.contains("is-open"));
      console.log("Vocab modal closed cleanly:", !isStillOpen);
    }
  }

  // 4. Deep test Grammar view
  console.log("Deep testing Grammar view...");
  await page.click(`.sidebar-link[data-view="grammar"]`);
  await page.waitForTimeout(400);
  const firstTopicCard = await page.$("#grammar-grid .card");
  if (firstTopicCard) {
    await firstTopicCard.click();
    await page.waitForTimeout(400);
    console.log("Selected first grammar topic card");
  }

  // 5. Deep test Quiz from Grammar view
  console.log("Deep testing Quiz flow...");
  const startQuizBtn = await page.$("#btn-start-grammar-quiz");
  if (startQuizBtn) {
    await startQuizBtn.click();
    await page.waitForTimeout(400);
    console.log("Started Quiz for topic");
    const quizOption = await page.$(".quiz-opt-btn");
    if (quizOption) {
      await quizOption.click();
      await page.waitForTimeout(300);
      console.log("Answered first quiz option");
    }
  }

  // 6. Deep test Reading view
  console.log("Deep testing Reading view...");
  await page.click(`.sidebar-link[data-view="reading"]`);
  await page.waitForTimeout(400);
  const firstReadingItem = await page.$("#reading-passages-list .card");
  if (firstReadingItem) {
    await firstReadingItem.click();
    await page.waitForTimeout(300);
    console.log("Selected first reading passage");
    const modalDone = await page.$("#modal-reading-done");
    if (modalDone) {
      await modalDone.click();
      await page.waitForTimeout(200);
      console.log("Completed reading passage and closed modal");
    }
  }

  // 7. Test Theme toggle in workspace
  console.log("Testing theme toggle in workspace...");
  const wsThemeToggle = await page.$("#theme-toggle");
  if (wsThemeToggle) {
    await wsThemeToggle.click();
    await page.waitForTimeout(200);
    const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    console.log("Workspace dark theme active:", htmlTheme === "dark");
    await wsThemeToggle.click();
    await page.waitForTimeout(200);
  }

  // 8. Mobile view navigation test
  console.log("Testing Mobile navigation at 375x667...");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(300);
  const mobileToggle = await page.$("#mobile-menu-btn");
  if (mobileToggle) {
    await mobileToggle.click();
    await page.waitForTimeout(200);
    const sidebarOpen = await page.evaluate(() => document.getElementById("app-sidebar")?.classList.contains("is-open"));
    console.log("Mobile sidebar opened:", sidebarOpen);
  }

  await browser.close();

  console.log("\n==========================================");
  console.log(`TOTAL INTERACTION ERRORS FOUND: ${errors.length}`);
  if (errors.length > 0) {
    console.error("Errors encountered:", errors);
    process.exit(1);
  } else {
    console.log("ALL INTERACTION & BROWSER CHECKS PASSED WITH 0 ERRORS!");
    console.log("==========================================");
  }
}

main().catch(err => {
  console.error("Execution error:", err);
  process.exit(1);
});
