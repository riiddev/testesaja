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


test("Adventure MVP completes the first quest, records skill evidence, and unlocks Town Square", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "adventure-local-access",
      refresh_token: "adventure-local-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "adventure-local-user", email: "adventure@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  const response = await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200);
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-world-title").waitFor({ state: "visible" });
  await page.locator('[data-adventure-start="meet-your-new-neighbors"]').click();

  const answerAndContinue = async () => {
    await page.locator('[data-adventure-answer="0"]').click();
    await page.locator('[data-adventure-next]').waitFor({ state: "visible" });
    await page.locator('[data-adventure-next]').click();
  };

  await answerAndContinue(); // Vocabulary
  await page.locator("[data-adventure-listen]").click();
  await page.locator(".adventure-audio-transcript").waitFor({ state: "visible" });
  await answerAndContinue(); // Listening
  await answerAndContinue(); // Reading
  await answerAndContinue(); // Grammar

  const speakChecks = page.locator('[data-adventure-check]');
  await speakChecks.nth(0).check();
  await speakChecks.nth(1).check();
  await speakChecks.nth(2).check();
  const speakSubmit = page.locator("[data-adventure-complete-production]");
  await speakSubmit.waitFor({ state: "visible" });
  assert.equal(await speakSubmit.isEnabled(), true, "speaking evidence needs the complete self-check");
  await speakSubmit.click();
  await page.locator("[data-adventure-next]").click();

  await page.locator("#adventure-writing").fill("Hello, my name is Rina and I live in a small house near the town square.");
  const writeChecks = page.locator('[data-adventure-check]');
  await writeChecks.nth(0).check();
  await writeChecks.nth(1).check();
  await writeChecks.nth(2).check();
  const writeSubmit = page.locator("[data-adventure-complete-production]");
  assert.equal(await writeSubmit.isEnabled(), true, "writing evidence needs enough words and a completed self-check");
  await writeSubmit.click();
  await page.locator('[data-adventure-next]').click();

  await page.locator("#adventure-mission-panel").getByText("Misi selesai.", { exact: true }).waitFor({ state: "visible" });
  assert.match(await page.locator("#adventure-xp-line").innerText(), /40 XP/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.ok(saved?.missionProgress?.["meet-your-new-neighbors"]?.completedAt, "the first mission completion should persist locally");
  assert.equal(saved?.xpLedger?.["first-completion:meet-your-new-neighbors"]?.amount, 40, "the first completion should award XP once");
  for (const skill of ["vocabulary", "listening", "reading", "grammar", "speaking", "writing"]) {
    assert.ok(saved?.skillEvidence?.[skill]?.length, "expected evidence for " + skill);
  }
  assert.equal(saved.skillEvidence.writing[0].wordCount, 16, "only a compact writing summary should be stored");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-adventure-select="a-day-around-town"]').waitFor({ state: "visible" });
  assert.match(await page.locator('[data-adventure-select="a-day-around-town"]').getAttribute("class"), /is-available/);
  assert.deepEqual(pageErrors, [], "Adventure interactions should not throw browser JavaScript errors");
  await page.close();
});

test("CloudBundle v2 Adventure progress merges across two independent browser profiles", async () => {
  let remoteState = null;
  const user = { id: "cross-device-user", email: "cross-device@example.com" };
  const session = {
    access_token: "cross-device-access",
    refresh_token: "cross-device-refresh",
    token_type: "bearer",
    expires_at: Math.floor(Date.now() / 1000) + 7200,
    user,
  };

  async function attachMockCloud(page) {
    await page.addInitScript((savedSession) => {
      localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify(savedSession));
    }, session);
    await page.route("**/api/account**", async (route) => {
      const action = new URL(route.request().url()).searchParams.get("action");
      if (action === "status") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: true }) });
      }
      if (action === "me") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.route("**/api/progress**", async (route) => {
      if (route.request().method() === "GET") {
        const rows = remoteState ? [{ user_id: user.id, state: remoteState, updated_at: remoteState.core?.updatedAt || new Date().toISOString() }] : [];
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
      }
      const body = route.request().postDataJSON();
      remoteState = Array.isArray(body) ? body[0]?.state : body?.state;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
  }

  const firstContext = await browser.newContext();
  const first = await firstContext.newPage();
  const pageErrors = [];
  first.on("pageerror", (error) => pageErrors.push(error.message));
  await attachMockCloud(first);
  await first.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await first.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await first.waitForFunction(() => document.querySelector("#cloud-sync-badge")?.textContent.includes("Tersinkron"), null, { timeout: 15000 });

  await first.evaluate(() => {
    const snapshot = {
      schemaVersion: 1,
      missionProgress: {
        "meet-your-new-neighbors": {
          completedAt: "2026-10-31T10:00:00.000Z",
          bestScore: 100,
          attempts: [{
            attemptId: "device-a-attempt",
            missionId: "meet-your-new-neighbors",
            startedAt: "2026-10-31T09:45:00.000Z",
            completedAt: "2026-10-31T10:00:00.000Z",
            completedStepIds: ["word-neighbor", "listen-greeting", "read-introduction", "grammar-article", "speak-introduction", "write-introduction"],
            stepResults: {},
            score: 100,
          }],
        },
      },
      skillEvidence: {
        vocabulary: [{ evidenceId: "a-vocab-evidence", missionId: "meet-your-new-neighbors", recordedAt: "2026-10-31T09:47:00.000Z" }],
      },
      xpLedger: {
        "first-completion:meet-your-new-neighbors": { awardId: "first-completion:meet-your-new-neighbors", amount: 40, awardedAt: "2026-10-31T10:00:00.000Z" },
      },
      achievementIds: ["first-mission"],
      updatedAt: "2026-10-31T10:00:00.000Z",
    };
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent("sinauu:local-extras-saved"));
  });
  await new Promise((resolve) => setTimeout(resolve, 1400));
  assert.equal(remoteState?.schemaVersion, 2, "the cloud envelope should be upgraded to v2");
  assert.ok(remoteState?.extras?.adventureProgress?.missionProgress?.["meet-your-new-neighbors"]?.completedAt, "the mission should be present in the mocked cloud snapshot");

  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  second.on("pageerror", (error) => pageErrors.push(error.message));
  await attachMockCloud(second);
  await second.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await second.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await second.waitForFunction(() => document.querySelector("#cloud-sync-badge")?.textContent.includes("Tersinkron"), null, { timeout: 15000 });
  await second.locator('[data-view-target="adventure"]').click();
  await second.locator('[data-adventure-select="a-day-around-town"]').waitFor({ state: "visible" });
  assert.match(await second.locator('[data-adventure-select="a-day-around-town"]').getAttribute("class"), /is-available/);
  const restored = await second.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.ok(restored?.missionProgress?.["meet-your-new-neighbors"]?.completedAt, "a second browser profile should restore the mission completion");
  assert.equal(restored?.xpLedger?.["first-completion:meet-your-new-neighbors"]?.amount, 40);
  assert.deepEqual(pageErrors, [], "cross-device merge should not throw browser JavaScript errors");
  await firstContext.close();
  await secondContext.close();
});


test("Mistake Journal records a wrong answer and marks it fixed after a correct retry", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "adventure-local-access",
      refresh_token: "adventure-local-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "adventure-local-user", email: "adventure@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-mistake-journal").waitFor({ state: "visible" });
  await page.locator('[data-adventure-start="meet-your-new-neighbors"]').click();

  await page.locator('[data-adventure-answer="1"]').click();
  await page.locator("#adventure-mistake-journal .adventure-mistake-row.is-open").waitFor({ state: "visible" });
  assert.equal(await page.locator("#adventure-mistake-journal .adventure-mistake-row.is-open").count(), 1);
  assert.match(await page.locator("#adventure-mistake-journal").innerText(), /Jawabanmu/);

  await page.locator('[data-adventure-answer="0"]').click();
  await page.locator('[data-adventure-next]').waitFor({ state: "visible" });
  await page.locator('[data-mistake-filter="resolved"]').click();
  await page.locator("#adventure-mistake-journal .adventure-mistake-row.is-resolved").waitFor({ state: "visible" });
  assert.match(await page.locator("#adventure-mistake-journal").innerText(), /SUDAH DIPERBAIKI/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  const mistakes = Object.values(saved?.mistakeJournal || {});
  assert.equal(mistakes.length, 1, "a wrong answer should create one journal entry");
  assert.ok(mistakes[0].resolvedAt, "a correct retry should resolve the journal entry");
  assert.deepEqual(pageErrors, [], "mistake review should not throw browser JavaScript errors");
  await page.close();
});

test("Daily Quest completes three rotating challenges and awards XP only once for the local day", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-daily-quest").waitFor({ state: "visible" });
  await page.locator("[data-daily-start]").click();

  for (let index = 0; index < 3; index += 1) {
    const listen = page.locator("[data-daily-listen]");
    if (await listen.count()) {
      await listen.click();
      await page.locator(".adventure-daily-listen p").waitFor({ state: "visible" });
    }
    const answerIndex = await page.evaluate(async () => {
      const current = document.querySelector("[data-daily-step-id]");
      const missionId = current?.getAttribute("data-daily-mission-id");
      const stepId = current?.getAttribute("data-daily-step-id");
      const data = await fetch("/data/adventure/missions.json").then((response) => response.json());
      const mission = data.missions.find((item) => item.id === missionId);
      const step = mission?.steps.find((item) => item.id === stepId);
      return step?.answer;
    });
    assert.ok(Number.isInteger(answerIndex), "the current daily challenge should map to a valid authored answer");
    await page.locator('[data-daily-answer="' + answerIndex + '"]').click();
    await page.locator("[data-daily-next]").waitFor({ state: "visible" });
    await page.locator("[data-daily-next]").click();
  }

  await page.locator("#adventure-daily-quest").getByText("Daily Quest complete.", { exact: true }).waitFor({ state: "visible" });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  const questDates = Object.keys(saved?.dailyQuests || {});
  assert.equal(questDates.length, 1, "the current day should have one quest record");
  assert.ok(saved.dailyQuests[questDates[0]].completedAt, "the daily quest should be marked complete");
  const dailyAwards = Object.entries(saved.xpLedger || {}).filter(([id]) => id.startsWith("daily-quest:"));
  assert.equal(dailyAwards.length, 1, "a completed daily quest should create one unique daily award");
  assert.equal(dailyAwards[0][1].amount, 15, "the daily quest should award 15 XP");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-daily-quest").getByText("Daily Quest complete.", { exact: true }).waitFor({ state: "visible" });
  const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(Object.keys(afterReload.xpLedger).filter((id) => id.startsWith("daily-quest:")).length, 1);
  assert.deepEqual(pageErrors, [], "daily quest interactions should not throw browser JavaScript errors");
  await page.close();
});
