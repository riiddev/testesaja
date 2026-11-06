import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = "C:/Users/MyBook Hype AMD/.gemini/antigravity/brain/5bbc49be-3ac4-4d0d-afeb-2d565f0b6dc6/reminder_screenshots";
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function testReminderNotification() {
  console.log("=== Testing Reminder Notifications & Floating Banner ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile phone viewport (iPhone 14)
    permissions: ["notifications"]
  });
  const page = await context.newPage();

  // 1. Register & Login first so we are authenticated
  console.log("Step 1: Logging in via dev session...");
  await page.goto("http://localhost:5173/daftar");
  await page.fill("#reg-name", "Citra Lestari");
  await page.fill("#reg-email", `citra_${Date.now()}@test.id`);
  await page.fill("#reg-password", "citra123");
  await page.click('button[type="submit"]');
  
  // Wait for auth to complete and land on /belajar
  await page.waitForURL("**/belajar**", { timeout: 15000 });
  console.log("Logged in successfully, landed at:", page.url());

  // 2. Go to Settings page
  console.log("Step 2: Navigating to Settings page...");
  await page.goto("http://localhost:5173/belajar/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // 3. Test In-App Notification Trigger
  console.log("Step 3: Triggering Test Notification...");
  await page.waitForSelector("#test-notif-btn");
  await page.click("#test-notif-btn");
  await page.waitForTimeout(600);

  // Check if floating banner exists and is visible
  const banner = await page.$("#in-app-study-reminder");
  if (!banner) {
    throw new Error("Floating banner #in-app-study-reminder was not found!");
  }
  const isVisible = await banner.isVisible();
  console.log("Floating Banner Visible:", isVisible);
  if (!isVisible) {
    throw new Error("Floating banner is not visible!");
  }

  // Screenshot floating banner on mobile
  const shotPath = path.join(SCREENSHOT_DIR, "mobile-floating-reminder-banner.png");
  await page.screenshot({ path: shotPath });
  console.log(`Saved screenshot to ${shotPath}`);

  // Test dismiss
  console.log("Step 4: Testing banner dismissal...");
  await page.click('#in-app-study-reminder button[aria-label="Tutup pengingat"]');
  await page.waitForTimeout(400);

  const isBannerGone = await page.$("#in-app-study-reminder");
  console.log("Banner successfully dismissed:", isBannerGone === null);

  // Step 5: Test Scheduled Auto-trigger
  console.log("Step 5: Testing scheduled timer trigger...");
  await page.evaluate(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentHHMM = `${hh}:${mm}`;
    // Set reminderConfig to current HH:mm
    localStorage.setItem("sinau_pwa_settings", JSON.stringify({
      enabled: true,
      morningHour: currentHHMM,
      eveningHour: "23:59"
    }));
    // Remove last fired slot
    localStorage.removeItem("sinau_last_reminder_slot");
  });

  // Reload to let timer check immediately
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const autoBanner = await page.$("#in-app-study-reminder");
  if (!autoBanner) {
    throw new Error("Auto scheduled reminder banner did not trigger at matching HH:mm!");
  }
  console.log("✓ Auto scheduled reminder banner triggered at matching HH:mm successfully!");

  const autoShotPath = path.join(SCREENSHOT_DIR, "auto-scheduled-reminder-triggered.png");
  await page.screenshot({ path: autoShotPath });
  console.log(`Saved screenshot to ${autoShotPath}`);

  await browser.close();
  console.log("ALL REMINDER NOTIFICATION TESTS PASSED!");
}

testReminderNotification().catch(err => {
  console.error("Reminder Test Failed:", err);
  process.exit(1);
});
