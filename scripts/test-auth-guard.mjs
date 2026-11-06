import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;

async function testAuthGuard() {
  console.log("=== Testing Mandatory Account Creation & Auth Guard ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Direct navigation to /belajar unauthenticated
  console.log("Test 1: Navigating to /belajar without login...");
  await page.goto("http://localhost:5173/belajar", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const url1 = page.url();
  console.log("Current URL after /belajar:", url1);
  if (!url1.includes("/daftar")) {
    throw new Error(`Expected redirect to /daftar, but got ${url1}`);
  }
  console.log("✓ Redirected to /daftar correctly!");

  // Test 2: Direct navigation to /belajar/vocabulary unauthenticated
  console.log("Test 2: Navigating to /belajar/vocabulary without login...");
  await page.goto("http://localhost:5173/belajar/vocabulary", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const url2 = page.url();
  console.log("Current URL after /belajar/vocabulary:", url2);
  if (!url2.includes("/daftar")) {
    throw new Error(`Expected redirect to /daftar, but got ${url2}`);
  }
  console.log("✓ Redirected to /daftar correctly!");

  // Test 3: Registering a user
  console.log("Test 3: Registering new user...");
  await page.fill("#reg-name", "Budi Santoso");
  await page.fill("#reg-email", `budi_${Date.now()}@test.id`);
  await page.fill("#reg-password", "rahasia123");
  await page.click('button[type="submit"]');

  await page.waitForNavigation().catch(() => {});
  await page.waitForTimeout(1000);

  const url3 = page.url();
  console.log("Current URL after registration:", url3);
  if (!url3.includes("/belajar")) {
    throw new Error(`Expected navigation to /belajar after registration, but got ${url3}`);
  }
  console.log("✓ Successfully registered and granted access to learning space!");

  await browser.close();
  console.log("ALL AUTH GUARD TESTS PASSED!");
}

testAuthGuard().catch(err => {
  console.error("Auth Guard Test Failed:", err);
  process.exit(1);
});

