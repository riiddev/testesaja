import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4173").replace(/\/+$/, "");
let browser;

before(async () => {
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
});

test("landing page renders and the main call to action opens the learning workspace", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "landing page should return HTTP 200");
  const manifestResponse = await page.request.get(baseUrl + "/manifest.webmanifest");
  assert.equal(manifestResponse.status(), 200, "PWA manifest should be served");
  const manifest = await manifestResponse.json();
  assert.equal(manifest.display, "standalone", "manifest should support an app-like installed experience");
  assert.match(await page.title(), /SinauuEnglish/i);
  assert.ok(await page.locator("#main").isVisible(), "main content should be visible");
  assert.ok(await page.locator("a[href='/belajar.html']").count() > 0, "a workspace link should exist");
  await page.locator("#account-open").waitFor({ state: "visible" });
  await page.locator("#account-open").click();
  assert.equal(await page.locator("#account-dialog").isVisible(), true, "account dialog should open from the landing page");
  assert.equal(await page.locator("#account-title").innerText().then((value) => value.length > 0), true, "account dialog should have a clear title");
  await page.locator("[data-account-close]").click();


  const themeToggle = page.locator("#theme-toggle");
  await themeToggle.click();
  assert.equal(await themeToggle.getAttribute("aria-pressed"), "true", "theme toggle should expose its changed state");

  await page.locator("a[href='/belajar.html']").first().click();
  await page.waitForURL(/\/belajar\.html$/);
  assert.ok(await page.locator("#app-main").isVisible(), "learning workspace should render");
  assert.deepEqual(pageErrors, [], "landing/navigation should not throw browser JavaScript errors");
  await page.close();
});

test("vocabulary search returns a matching word and reading practice saves an answer", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "learning workspace should return HTTP 200");

  await page.waitForFunction(() => {
    const counter = document.querySelector("#vocab-result-count");
    return Boolean(counter && counter.textContent.includes("dari"));
  }, null, { timeout: 20000 });
  await page.locator('#view-overview .home-primary-action[data-view-target="vocabulary"]').click();
  await page.locator("#vocab-search").fill("abandon");
  await page.waitForFunction(() => {
    const row = document.querySelector("#vocab-list [data-select-word]");
    return Boolean(row && row.textContent.toLowerCase().includes("abandon"));
  }, null, { timeout: 15000 });
  const firstVocabularyRow = page.locator("#vocab-list [data-select-word]").first();
  assert.match((await firstVocabularyRow.innerText()).toLowerCase(), /abandon/);
  await firstVocabularyRow.click();
  assert.match((await page.locator("#word-detail").innerText()).toLowerCase(), /abandon/);

  // Exercise the generated context question for an imported entry that has no hand-authored context options.
  await page.locator("#word-detail [data-start-word]").click();
  await page.locator("#recall-answer").fill("meninggalkan");
  await page.locator("#recall-form button[type='submit']").click();
  await page.locator("#study-next").waitFor({ state: "visible" });
  await page.locator("#study-next").click();
  const contextOptions = page.locator("#context-form .study-option-label");
  assert.equal(await contextOptions.count(), 3, "context practice should render three answer choices");
  const choiceTexts = await contextOptions.allInnerTexts();
  assert.equal(new Set(choiceTexts.map((text) => text.trim())).size, 3, "context choices should be distinct");
  await contextOptions.first().locator("input").check();
  await page.locator("#context-form button[type='submit']").click();
  await page.locator("#study-next").waitFor({ state: "visible" });

  await page.locator('[data-view-target="reading"]').first().click();
  await page.waitForFunction(() => (document.querySelector("#habit-library-count")?.textContent || "").includes("156"), null, { timeout: 20000 });
  await page.locator('[data-reading-mode="skills"]').click();
  assert.equal(await page.locator("#habit-library-section").isVisible(), false, "HABIT library should be hidden while reading skills are active");
  assert.equal(await page.locator("#reading-skills-section").isVisible(), true, "reading skills should be the only active reading collection");
  await page.locator('[data-reading-mode="habit"]').click();
  assert.equal(await page.locator("#habit-library-section").isVisible(), true, "switching back should reveal the HABIT library");
  assert.equal(await page.locator("#reading-skills-section").isVisible(), false, "reading skills should be hidden when HABIT is active");
  await page.locator("#habit-library-search").fill("The Tiny Tenants Inside You");
  await page.waitForFunction(() => (document.querySelector("#habit-library-count")?.textContent || "").startsWith("1 dari 156"), null, { timeout: 10000 });
  const passageCard = page.locator('[data-habit-open="the-tiny-tenants-inside-you"]');
  assert.equal(await passageCard.count(), 1, "title search should locate the expected passage");
  await passageCard.click();

  const detail = page.locator("#habit-library-detail");
  await detail.waitFor({ state: "visible" });
  assert.match(await detail.innerText(), /The Tiny Tenants Inside You/);
  assert.equal(await detail.locator(".habit-question-card").count(), 3, "each reading should expose three questions");

  await detail.locator('input[type="radio"]').first().check();
  await detail.locator("[data-habit-check]").first().click();
  assert.equal(await detail.locator(".habit-quiz-feedback").count(), 1, "checking an answer should show feedback");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-view-target="reading"]').first().click();
  await page.waitForFunction(() => (document.querySelector("#habit-library-count")?.textContent || "").includes("156"), null, { timeout: 20000 });
  await page.locator("#habit-library-search").fill("The Tiny Tenants Inside You");
  await page.locator('[data-habit-open="the-tiny-tenants-inside-you"]').click();
  await page.locator("#habit-library-detail").waitFor({ state: "visible" });
  assert.equal(await page.locator("#habit-library-detail .habit-quiz-feedback").count(), 1, "reading answers should persist after reloading the page");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator("#habit-library-detail [data-habit-back]").isVisible(), true, "mobile reading detail should have a clear back action");
  assert.equal(await page.locator("#habit-library-list").isVisible(), false, "the passage list should be hidden while reading a passage on mobile");
  await page.locator("#habit-library-detail [data-habit-back]").click();
  assert.equal(await page.locator("#habit-library-list").isVisible(), true, "the passage list should return when tapping back");

  assert.deepEqual(pageErrors, [], "workspace interactions should not throw browser JavaScript errors");
  await page.close();
});

test("mobile workspace uses bottom navigation and opens a focused vocabulary detail", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const response = await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200);
  await page.waitForFunction(() => {
    const counter = document.querySelector("#vocab-result-count");
    return Boolean(counter && counter.textContent.includes("dari"));
  }, null, { timeout: 20000 });
  const navPosition = await page.locator(".side-nav").evaluate((el) => getComputedStyle(el).position);
  assert.equal(navPosition, "fixed", "mobile navigation should stay reachable at the bottom");
  await page.locator("#view-overview .home-primary-action[data-view-target='vocabulary']").click();
  assert.equal(await page.locator("#word-detail").evaluate((el) => getComputedStyle(el).display), "none", "the word detail should not stack under the word list before selection");
  await page.locator("#vocab-search").fill("abandon");
  const row = page.locator("#vocab-list [data-select-word]").first();
  await row.waitFor({ state: "visible" });
  await row.click();
  assert.equal(await page.locator("#word-detail").evaluate((el) => getComputedStyle(el).display), "block", "selecting a word should open a focused detail view");
  assert.equal(await page.locator("#word-detail .mobile-detail-back").isVisible(), true, "mobile detail should offer a clear back action");
  await page.locator("#word-detail .mobile-detail-back").click();
  assert.equal(await page.locator("#word-detail").evaluate((el) => getComputedStyle(el).display), "none", "the detail view should close when returning to the word list");
  assert.equal(await page.locator("#vocab-list").isVisible(), true, "the word list should return");
  assert.deepEqual(pageErrors, [], "mobile navigation should not throw browser JavaScript errors");
  await page.close();
});
