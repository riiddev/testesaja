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

test("landing CTA sends new visitors to login and a successful mocked signup opens the workspace", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const fakeSession = {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 7200,
    expires_at: Math.floor(Date.now() / 1000) + 7200,
    user: { id: "browser-test-user", email: "test@example.com" },
  };
  await page.route("**/api/account**", async (route) => {
    const action = new URL(route.request().url()).searchParams.get("action");
    if (action === "status") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: true }) });
    if (action === "signup" || action === "login") return route.fulfill({ status: action === "signup" ? 201 : 200, contentType: "application/json", body: JSON.stringify(fakeSession) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/api/progress**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: route.request().method() === "GET" ? "[]" : JSON.stringify({ ok: true }) });
  });

  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "landing page should return HTTP 200");
  assert.match(await page.title(), /SinauuEnglish/i);
  assert.ok(await page.locator("#main").isVisible(), "main content should be visible");
  assert.ok(await page.locator("a[href='/belajar.html']").count() > 0, "landing page should link to the guarded learning workspace");
  const themeToggle = page.locator("#theme-toggle");
  await themeToggle.click();
  assert.equal(await themeToggle.getAttribute("aria-pressed"), "true");
  await page.locator("a[href='/belajar.html']").first().click();
  await page.waitForURL((url) => url.pathname === "/login.html");
  assert.ok(await page.locator("#signin-form").isVisible());
  await page.locator("[data-mode='signup']").click();
  await page.locator("#signup-email").fill("test@example.com");
  await page.locator("#signup-password").fill("example-password-123");
  await page.locator("#signup-password-confirm").fill("example-password-123");
  await page.locator("#signup-form button[type='submit']").click();
  await page.waitForURL((url) => url.pathname === "/belajar.html");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-cloud-session-v1") || "null"));
  assert.equal(stored?.user?.email, "test@example.com");
  assert.equal(stored?.user?.id, "browser-test-user");
  assert.equal(stored?.password, undefined, "the saved session must not contain the password");
  assert.deepEqual(pageErrors, [], "landing/auth interactions should not throw browser JavaScript errors");
  await page.close();
});

test("returning visitors with a saved session bypass the login screen", async () => {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "existing-access-token",
      refresh_token: "existing-refresh-token",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "returning-user", email: "returning@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    const action = new URL(route.request().url()).searchParams.get("action");
    if (action === "status") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: true }) });
    if (action === "me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "returning-user", email: "returning@example.com" }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/api/progress**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: route.request().method() === "GET" ? "[]" : JSON.stringify({ ok: true }) });
  });

  await page.goto(baseUrl + "/login.html", { waitUntil: "domcontentloaded" });
  await page.waitForURL((url) => url.pathname === "/belajar.html");
  assert.equal(await page.locator("#signin-form").count(), 0, "returning user must not be shown the login form");
  await page.close();
});

test("the installable app manifest permits landscape and portrait orientation", async () => {
  const page = await browser.newPage();
  const response = await page.goto(baseUrl + "/manifest.webmanifest", { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "manifest should be served");
  const manifest = await response.json();
  assert.equal(manifest.orientation, "any", "the app should not lock tablets to portrait");
  assert.equal(manifest.start_url, "/belajar.html");
  await page.close();
});

test("direct access to the learning workspace redirects unsigned visitors to login", async () => {
  const page = await browser.newPage();
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  const response = await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  assert.ok(response, "workspace navigation should return a document response");
  await page.waitForURL((url) => url.pathname === "/login.html");
  assert.equal(new URL(page.url()).searchParams.get("next"), "/belajar.html");
  await page.close();
});

test("vocabulary search returns a matching word and reading practice saves an answer", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  const homeResponse = await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(homeResponse?.status(), 200);
  await page.evaluate(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "local-test-token",
      refresh_token: "local-test-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "workspace-test-user", email: "workspace@example.com" },
    }));
  });

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
