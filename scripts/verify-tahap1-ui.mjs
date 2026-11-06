import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import { preview } from "vite";
import fs from "fs";
import path from "path";

async function runVerification() {
  console.log("=== STARTING TAHAP 1 VISUAL & ACCESSIBILITY VERIFICATION ===");

  const server = await preview({
    preview: {
      port: 4174,
      host: "127.0.0.1"
    }
  });

  const baseUrl = "http://127.0.0.1:4174";
  console.log(`Vite preview running at ${baseUrl}`);

  const screenshotsDir = path.resolve("public/screenshots/tahap1");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    // -------------------------------------------------------------
    // 1. Viewport 320px (Small Mobile / iPhone SE)
    // -------------------------------------------------------------
    console.log("\n[Test 1] 320px Viewport Verification...");
    const ctx320 = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const page320 = await ctx320.newPage();
    await page320.goto(`${baseUrl}/belajar`, { waitUntil: "networkidle" });

    // Verify sidebar is closed by default and not squeezing content
    const sidebar320 = await page320.$("#app-sidebar");
    const sidebarBox320 = await sidebar320.boundingBox();
    const contentBox320 = await page320.$eval("#app-content", el => el.getBoundingClientRect().width);

    console.log(`- 320px Content Width: ${contentBox320}px (Must be ~320px, not squeezed)`);
    if (contentBox320 < 300) errors.push("320px content is squeezed!");

    await page320.screenshot({ path: path.join(screenshotsDir, "01-320px-content-fullwidth.png") });

    // Open Drawer via hamburger
    await page320.click("#mobile-menu-btn");
    await page320.waitForTimeout(300);

    const isDrawerOpen320 = await page320.$eval("#app-sidebar", el => el.classList.contains("is-open"));
    console.log(`- 320px Drawer Open State: ${isDrawerOpen320}`);
    if (!isDrawerOpen320) errors.push("Drawer failed to open on 320px!");

    await page320.screenshot({ path: path.join(screenshotsDir, "02-320px-drawer-overlay.png") });

    // Close via close button
    await page320.click(".sidebar-close-btn");
    await page320.waitForTimeout(300);
    const isClosedAfterClick = await page320.$eval("#app-sidebar", el => !el.classList.contains("is-open"));
    console.log(`- 320px Drawer Closed via Close Button: ${isClosedAfterClick}`);
    if (!isClosedAfterClick) errors.push("Drawer failed to close via close button!");
    await ctx320.close();

    // -------------------------------------------------------------
    // 2. Viewport 360px (Standard Mobile) & Vocab Modal Verification
    // -------------------------------------------------------------
    console.log("\n[Test 2] 360px Viewport & Modal Anti-Overlap Verification...");
    const ctx360 = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page360 = await ctx360.newPage();
    await page360.goto(`${baseUrl}/belajar/vocabulary`, { waitUntil: "networkidle" });

    // Open first vocab card
    const firstCard = await page360.waitForSelector(".vocab-card");
    await firstCard.click();
    await page360.waitForSelector("#modal-sheet", { state: "visible" });

    // Check modal buttons
    const closeBtn = await page360.$("#modal-close-btn");
    const audioBtn = await page360.$(".modal-header-bar button.btn-secondary.btn-icon");

    const closeBox = await closeBtn.boundingBox();
    const audioBox = await audioBtn.boundingBox();

    console.log(`- Close Button Dimensions: ${closeBox.width}x${closeBox.height} px (min 44x44 requirement: ${closeBox.width >= 44 && closeBox.height >= 44})`);
    console.log(`- Audio Button Dimensions: ${audioBox.width}x${audioBox.height} px (min 44x44 requirement: ${audioBox.width >= 44 && audioBox.height >= 44})`);

    // Verify NO OVERLAP
    const isOverlapping = !(
      closeBox.x + closeBox.width <= audioBox.x ||
      audioBox.x + audioBox.width <= closeBox.x ||
      closeBox.y + closeBox.height <= audioBox.y ||
      audioBox.y + audioBox.height <= closeBox.y
    );
    console.log(`- Buttons Overlapping: ${isOverlapping} (MUST BE FALSE!)`);
    if (isOverlapping) errors.push("Modal close button and audio button are still overlapping!");

    // Verify distance between buttons
    const gap = Math.abs(closeBox.x - (audioBox.x + audioBox.width));
    console.log(`- Horizontal Gap Between Audio & Close Buttons: ${gap.toFixed(1)} px`);

    // Verify bottom button has NO emoji
    const studyBtnText = await page360.$eval("#modal-sheet .btn-primary", el => el.textContent.trim());
    console.log(`- Study Button Text: "${studyBtnText}"`);
    if (studyBtnText.includes("⚡") || studyBtnText.includes("🔥")) errors.push("Study button still contains emoji!");

    await page360.screenshot({ path: path.join(screenshotsDir, "03-360px-vocab-modal-clean.png") });

    // Test Escape key closes modal
    await page360.keyboard.press("Escape");
    await page360.waitForTimeout(300);
    const modalVisible = await page360.$eval("#modal-overlay", el => el ? true : false).catch(() => false);
    console.log(`- Modal Closed via Escape: ${!modalVisible}`);
    if (modalVisible) errors.push("Modal failed to close on Escape key!");
    await ctx360.close();

    // -------------------------------------------------------------
    // 3. Viewport 768px (Tablet Portrait / iPad)
    // -------------------------------------------------------------
    console.log("\n[Test 3] 768px Viewport Verification...");
    const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page768 = await ctx768.newPage();
    await page768.goto(`${baseUrl}/belajar`, { waitUntil: "networkidle" });

    const contentBox768 = await page768.$eval("#app-content", el => el.getBoundingClientRect().width);
    console.log(`- 768px Content Width: ${contentBox768}px (Full tablet width)`);

    // Open Drawer
    await page768.click("#mobile-menu-btn");
    await page768.waitForTimeout(300);
    await page768.screenshot({ path: path.join(screenshotsDir, "04-768px-tablet-drawer-open.png") });

    // Close via backdrop click
    await page768.click(".sidebar-backdrop", { position: { x: 500, y: 300 } });
    await page768.waitForTimeout(300);
    const isClosedBackdrop = await page768.$eval("#app-sidebar", el => !el.classList.contains("is-open"));
    console.log(`- 768px Drawer Closed via Backdrop Click: ${isClosedBackdrop}`);
    if (!isClosedBackdrop) errors.push("Drawer failed to close via backdrop click on 768px!");
    await ctx768.close();

    // -------------------------------------------------------------
    // 4. Viewport 1280px (Desktop / Laptop)
    // -------------------------------------------------------------
    console.log("\n[Test 4] 1280px Desktop Sidebar & Collapse Verification...");
    const ctx1280 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page1280 = await ctx1280.newPage();
    await page1280.goto(`${baseUrl}/belajar`, { waitUntil: "networkidle" });

    // Hamburger button should NOT be visible on desktop
    const hamburgerDisplay = await page1280.$eval("#mobile-menu-btn", el => window.getComputedStyle(el).display);
    console.log(`- Desktop Hamburger Display: ${hamburgerDisplay} (Must be 'none')`);
    if (hamburgerDisplay !== "none") errors.push("Hamburger button should be hidden on desktop!");

    // Sidebar should be permanent 260px wide
    const sidebarWidth = await page1280.$eval("#app-sidebar", el => el.getBoundingClientRect().width);
    console.log(`- Desktop Sidebar Initial Width: ${sidebarWidth}px (Target ~260px)`);

    await page1280.screenshot({ path: path.join(screenshotsDir, "05-1280px-desktop-sidebar-expanded.png") });

    // Click collapse button
    await page1280.click(".sidebar-collapse-btn");
    await page1280.waitForTimeout(350);

    const collapsedWidth = await page1280.$eval("#app-sidebar", el => el.getBoundingClientRect().width);
    console.log(`- Desktop Sidebar Collapsed Width: ${collapsedWidth}px (Target ~74px)`);
    if (collapsedWidth > 80) errors.push("Desktop sidebar failed to collapse to icon-only mode!");

    await page1280.screenshot({ path: path.join(screenshotsDir, "06-1280px-desktop-sidebar-collapsed.png") });

    // Click again to re-expand
    await page1280.click(".sidebar-collapse-btn");
    await page1280.waitForTimeout(350);
    const reExpandedWidth = await page1280.$eval("#app-sidebar", el => el.getBoundingClientRect().width);
    console.log(`- Desktop Sidebar Re-expanded Width: ${reExpandedWidth}px`);

    await ctx1280.close();

  } catch (err) {
    console.error("FATAL ERROR DURING TAHAP 1 VERIFICATION:", err);
    errors.push(err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n==========================================");
  console.log(`TOTAL TAHAP 1 ERRORS: ${errors.length}`);
  if (errors.length > 0) {
    console.error("ERRORS:", errors);
    process.exit(1);
  } else {
    console.log("TAHAP 1 VERIFICATION PASSED 100%!");
    console.log("Screenshots generated in public/screenshots/tahap1/");
    console.log("==========================================");
  }
}

runVerification();

