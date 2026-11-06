import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";

async function main() {
  console.log("Starting Vite preview server...");
  const server = await preview({
    preview: {
      port: 4173,
      host: "127.0.0.1"
    }
  });

  const baseUrl = "http://127.0.0.1:4173";
  console.log(`Preview server running at ${baseUrl}`);

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

  try {
    // 1. Landing Page
    console.log("1. Testing Landing Page...");
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    const title = await page.title();
    console.log("Title:", title);
    if (!title.includes("SinauEnglish")) errors.push("Invalid landing page title");

    // 2. Login Page
    console.log("2. Testing Login Page...");
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    const loginHeader = await page.textContent("h2");
    console.log("Login header:", loginHeader);

    // 3. Register Page
    console.log("3. Testing Register Page...");
    await page.goto(`${baseUrl}/daftar`, { waitUntil: "networkidle" });
    const registerHeader = await page.textContent("h2");
    console.log("Register header:", registerHeader);

    // 4. Workspace Overview
    console.log("4. Testing Workspace Overview...");
    await page.goto(`${baseUrl}/belajar`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // 5. Workspace Vocabulary View
    console.log("5. Testing Vocabulary View (/belajar/vocabulary)...");
    await page.goto(`${baseUrl}/belajar/vocabulary`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const vocabCards = await page.$$(".vocab-card");
    console.log(`Rendered vocab cards: ${vocabCards.length}`);
    if (vocabCards.length === 0) errors.push("No vocab cards rendered in vocabulary view.");

    // Test card click to open modal
    if (vocabCards.length > 0) {
      await vocabCards[0].click();
      await page.waitForTimeout(300);
      const modalOpen = await page.$(".modal-content");
      console.log("Vocab modal opened:", Boolean(modalOpen));
      if (!modalOpen) errors.push("Vocab modal failed to open upon card click.");
      
      // Close modal
      const closeBtn = await page.$(".modal-content button[aria-label*='Tutup']");
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // 6. Workspace Grammar View
    console.log("6. Testing Grammar View (/belajar/grammar)...");
    await page.goto(`${baseUrl}/belajar/grammar`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const grammarCards = await page.$$(".card-interactive");
    console.log(`Rendered grammar topic cards: ${grammarCards.length}`);
    if (grammarCards.length === 0) errors.push("No grammar topic cards rendered.");

    // 7. Workspace Reading View
    console.log("7. Testing Reading View (/belajar/reading)...");
    await page.goto(`${baseUrl}/belajar/reading`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const readingCards = await page.$$(".card-interactive");
    console.log(`Rendered HABIT reading cards: ${readingCards.length}`);

    // 8. Workspace Settings View
    console.log("8. Testing Settings View (/belajar/settings)...");
    await page.goto(`${baseUrl}/belajar/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const settingsHeading = await page.textContent("h2");
    console.log("Settings heading:", settingsHeading);

  } finally {
    await browser.close();
    server.httpServer.close();
  }

  console.log("\n==========================================");
  console.log(`TOTAL SPA ERRORS FOUND: ${errors.length}`);
  if (errors.length > 0) {
    console.error("Test failures:", errors);
    process.exit(1);
  } else {
    console.log("REACT SPA INTEGRATION PASSED 100%!");
    console.log("==========================================");
  }
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});

