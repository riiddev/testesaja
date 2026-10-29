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

test("landing CTA opens login and registration screens without sending credentials", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "landing page should return HTTP 200");
  assert.match(await page.title(), /SinauuEnglish/i);
  assert.ok(await page.locator("#main").isVisible(), "main content should be visible");
  assert.ok(await page.locator("a[href='/login.html']").count() > 0, "landing page should link to login");

  const themeToggle = page.locator("#theme-toggle");
  await themeToggle.click();
  assert.equal(await themeToggle.getAttribute("aria-pressed"), "true", "theme toggle should expose its changed state");

  await page.locator("a[href='/login.html']").first().click();
  await page.waitForURL((url) => url.pathname === "/login.html");
  assert.ok(await page.locator("#auth-card").isVisible(), "login screen should render");
  assert.ok(await page.locator("#signin-form").isVisible(), "sign-in form should be visible by default");

  await page.locator("[data-mode='signup']").click();
  assert.equal(await page.locator("#signup-form").isVisible(), true, "registration form should open");
  await page.locator("#signup-email").fill("test@example.com");
  await page.locator("#signup-password").fill("example-password-123");
  await page.locator("#signup-password-confirm").fill("example-password-123");
  await page.locator("#signup-form button[type='submit']").click();
  assert.match(await page.locator("#auth-notice").innerText(), /belum aktif|tidak dikirim|tidak disimpan/i);
  assert.equal(await page.url().endsWith("/login.html"), true, "form should not fake a successful login or redirect");

  assert.deepEqual(pageErrors, [], "landing/login interactions should not throw browser JavaScript errors");
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
  assert.deepEqual(pageErrors, [], "workspace interactions should not throw browser JavaScript errors");
  await page.close();
});
