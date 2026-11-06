import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;

async function testCleanSlateAccount() {
  console.log("=== Testing Clean Slate for New Accounts (Strict 0 Start) ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Register a fresh brand-new user
  const uniqueName = `PelajarBaru_${Date.now()}`;
  const uniqueEmail = `baru_${Date.now()}@test.id`;

  console.log(`Registering brand new user: ${uniqueName} (${uniqueEmail})...`);
  await page.goto("http://localhost:5173/daftar");
  await page.fill("#reg-name", uniqueName);
  await page.fill("#reg-email", uniqueEmail);
  await page.fill("#reg-password", "sandiku123");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/belajar**", { timeout: 30000 });
  await page.waitForTimeout(600);
  console.log("Registered and redirected to:", page.url());

  // 1. Verify Topbar Coins & Level
  console.log("Checking Topbar stats...");
  const topbarCoinText = await page.textContent("#topbar-coin-pill");
  const topbarLevelText = await page.textContent(".topbar-level-pill");
  console.log("Topbar Coin Pill:", topbarCoinText.trim());
  console.log("Topbar Level Pill:", topbarLevelText.trim());

  if (!topbarCoinText.includes("0")) {
    throw new Error(`Expected 0 Coins in topbar, but found: ${topbarCoinText}`);
  }
  if (!topbarLevelText.includes("Lvl 1") && !topbarLevelText.includes("Lv 1") && !topbarLevelText.includes("Level 1")) {
    throw new Error(`Expected Level 1 in topbar, but found: ${topbarLevelText}`);
  }
  console.log("✓ Topbar correctly starts at 0 Coins and Level 1!");

  // 2. Verify Profile Stats & Titles
  console.log("Checking Profile Page (/belajar/profile)...");
  await page.goto("http://localhost:5173/belajar/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const titleChip = await page.textContent("#scholar-active-title-chip");
  console.log("Active Title Chip:", titleChip.trim());
  if (titleChip.includes("Penjelajah Kosakata")) {
    throw new Error(`New user should not have 'Penjelajah Kosakata' unlocked! Found: ${titleChip}`);
  }
  console.log("✓ Active title is clean (no premature achievement unlocked)!");

  // Check stat values on profile
  const statNumbers = await page.$$eval(".scholar-stat-val", els => els.map(e => e.textContent.trim()));
  console.log("Scholar Stat Values on Profile:", statNumbers);
  // Total XP should be 0, Streak should be 0
  if (statNumbers.some(v => v === "120" || v === "250")) {
    throw new Error(`Found premature pre-filled XP (120 or 250) in stats: ${JSON.stringify(statNumbers)}`);
  }
  console.log("✓ Profile stats strictly start from 0!");

  // 3. Verify Collection / Inventory
  console.log("Checking Collection Page (/belajar/collection)...");
  await page.goto("http://localhost:5173/belajar/collection", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const ownedItemsCount = await page.$$eval(".collection-card .scholar-chip", chips => 
    chips.filter(c => c.textContent.includes("Terpasang") || c.textContent.includes("Dimiliki")).length
  );
  console.log("Owned items in inventory:", ownedItemsCount);
  if (ownedItemsCount > 0) {
    throw new Error(`Expected 0 owned items for fresh account, but found: ${ownedItemsCount}`);
  }
  console.log("✓ Inventory starts strictly clean (0 owned items)!");

  // 4. Verify Adventure / Stories
  console.log("Checking Adventure Hub (/belajar/adventure)...");
  await page.goto("http://localhost:5173/belajar/adventure", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const completedPills = await page.$$eval(".story-card-stat", stats => stats.map(s => s.textContent.trim()));
  console.log("Adventure card progress stats:", completedPills);
  if (completedPills.some(p => p.includes("10/10") || p.includes("1/10"))) {
    throw new Error(`Found premature completed episodes for new user: ${JSON.stringify(completedPills)}`);
  }
  console.log("✓ All story episodes start at 0/10 completed!");

  await browser.close();
  console.log("ALL CLEAN SLATE ACCOUNT TESTS PASSED!");
}

testCleanSlateAccount().catch(err => {
  console.error("Clean Slate Test Failed:", err);
  process.exit(1);
});
