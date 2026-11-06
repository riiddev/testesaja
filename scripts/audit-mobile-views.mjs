import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = "C:/Users/MyBook Hype AMD/.gemini/antigravity/brain/5bbc49be-3ac4-4d0d-afeb-2d565f0b6dc6/mobile_audit_screenshots";

async function auditMobile() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  console.log("=== Auditing Mobile Views (360x780) ===");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
  });
  const page = await context.newPage();

  const auditResults = [];

  async function checkPage(url, name, actions) {
    console.log(`Checking ${name} (${url})...`);
    await page.goto(`http://localhost:5173${url}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    if (actions) {
      await actions(page);
    }

    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const hasHorizontalScroll = docWidth > winWidth;

      const elements = Array.from(document.querySelectorAll("*"));
      const overflowing = [];
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > winWidth + 2) {
          overflowing.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: rect.right,
            width: rect.width
          });
        }
      }
      return { docWidth, winWidth, hasHorizontalScroll, overflowing: overflowing.slice(0, 5) };
    });

    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath });

    auditResults.push({
      page: name,
      url,
      ...overflowInfo,
      screenshot: screenshotPath
    });
  }

  // 1. Landing Page
  await checkPage("/", "01-mobile-landing");

  // 2. Login Page
  await checkPage("/login", "02-mobile-login");

  // Login for authenticated routes
  await page.fill("#login-email", "budi@sinau.com");
  await page.fill("#login-password", "password123");
  await page.click("button[type='submit']");
  await page.waitForTimeout(1000);

  // 3. Workspace / Beranda
  await checkPage("/belajar", "03-mobile-dashboard");

  // 4. Adventure Hub
  await checkPage("/belajar/adventure", "04-mobile-adventure-hub");

  // Open Story 1 Roadmap
  await checkPage("/belajar/adventure", "05-mobile-story-roadmap", async (p) => {
    const card = p.locator("#story-catalog-card-story-01");
    if (await card.count() > 0) {
      await card.click();
      await p.waitForSelector("#story-episodes-roadmap-view", { timeout: 6000 });
      await p.waitForTimeout(500);
    }
  });

  // Open Episode 1 Runner
  await checkPage("/belajar/adventure", "06-mobile-story-runner", async (p) => {
    const card = p.locator("#story-catalog-card-story-01");
    if (await card.count() > 0) {
      await card.click();
      await p.waitForSelector(".episode-node-card", { timeout: 6000 });
      await p.locator(".episode-node-card").first().click();
      await p.waitForSelector(".story-runner-modal", { timeout: 6000 });
      await p.waitForTimeout(500);
    }
  });

  // 5. Collection View
  await checkPage("/belajar/collection", "07-mobile-collection");

  // 6. Vocabulary
  await checkPage("/belajar/vocabulary", "08-mobile-vocabulary");

  // 7. Grammar
  await checkPage("/belajar/grammar", "09-mobile-grammar");

  // 8. HABIT Reading
  await checkPage("/belajar/reading", "10-mobile-reading");

  // 9. Profile
  await checkPage("/belajar/profile", "11-mobile-profile");

  fs.writeFileSync(path.join(SCREENSHOT_DIR, "audit-results.json"), JSON.stringify(auditResults, null, 2));
  console.log("\n=== Mobile Audit Finished ===");
  console.log(JSON.stringify(auditResults.map(r => ({ page: r.page, hasHorizontalScroll: r.hasHorizontalScroll, docWidth: r.docWidth })), null, 2));

  await browser.close();
}

auditMobile().catch(console.error);
