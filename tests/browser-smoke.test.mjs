import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { preview } from "vite";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4173").replace(/\/+$/, "");
let browser;
let previewServer;

before(async () => {
  try {
    const res = await fetch(baseUrl + "/");
    if (!res.ok && res.status !== 404) throw new Error();
  } catch {
    previewServer = await preview({
      preview: { port: 4173, host: "127.0.0.1", strictPort: true },
    });
  }
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  if (previewServer) {
    await new Promise((resolve) => previewServer.httpServer.close(resolve));
  }
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
  await page.locator(".side-nav [data-view-target='vocabulary']").click();
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

  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  await page.locator("#vocab-search").fill("hello");
  await page.waitForFunction(() => Boolean(document.querySelector('#vocab-list [data-select-word]')?.textContent.toLowerCase().includes("hello")));
  await page.locator('#vocab-list [data-select-word]').first().click();
  const supplementary = page.locator("#word-detail .detail-supplementary");
  assert.equal(await supplementary.count(), 1, "collocations should be available without crowding the primary word detail");
  assert.equal(await supplementary.evaluate(el => el.open), false, "supplementary context should start collapsed");
  await supplementary.locator("summary").click();
  assert.equal(await supplementary.evaluate(el => el.open), true, "learners can expand supplementary context when needed");

  await page.locator('[data-view-target="reading"]').first().click();
  await page.waitForFunction(() => (document.querySelector("#habit-library-count")?.textContent || "").includes("156"), null, { timeout: 30000 });
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
  await page.waitForFunction(() => (document.querySelector("#habit-library-count")?.textContent || "").includes("156"), null, { timeout: 30000 });
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
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak() {} } });
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
  await page.locator('[data-adventure-listen-rate="0.75"]').click();
  assert.match(await page.locator('[data-adventure-listen-rate="0.75"]').getAttribute("class"), /is-active/);
  await page.locator("[data-adventure-listen]").click();
  assert.equal(await page.locator(".adventure-audio-transcript").count(), 0, "transcript should be hidden until requested");
  await page.locator("[data-adventure-transcript]").click();
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
  assert.equal(saved?.listeningRate, 0.75, "Listening Lab playback speed should persist in Adventure progress");
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
      listeningRate: 0.75,
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
      dailyQuests: {
        "2026-10-31": {
          dateKey: "2026-10-31",
          missionId: "meet-your-new-neighbors",
          stepIds: ["word-neighbor", "grammar-article", "read-introduction"],
          completedStepIds: ["word-neighbor"],
          wrongAttempts: { "grammar-article": 1 },
          startedAt: "2026-10-31T09:50:00.000Z",
          completedAt: null,
          updatedAt: "2026-10-31T09:55:00.000Z",
        },
      },
      mistakeJournal: {
        "device-a-mistake": {
          mistakeId: "device-a-mistake", sourceType: "daily-quest", sourceId: "daily:2026-10-31",
          missionId: "meet-your-new-neighbors", stepId: "grammar-article", skill: "grammar",
          prompt: "Choose an article.", wrongAnswer: "an", correctAnswer: "a", explanation: "Use a before a consonant sound.",
          recordedAt: "2026-10-31T09:52:00.000Z", resolvedAt: null, status: "open",
        },
      },
      storyProgress: {
        "a-helpful-neighbor": {
          attempts: [{ attemptId: "story-device-a", score: 2, total: 3, passed: true, completedAt: "2026-10-31T09:59:00.000Z" }],
          bestScore: 2,
          completedAt: "2026-10-31T09:59:00.000Z",
          updatedAt: "2026-10-31T09:59:00.000Z",
        },
      },
      dialogueProgress: {
        "at-the-cafe": {
          attempts: [{ attemptId: "dialogue-device-a", score: 2, total: 3, passed: true, completedAt: "2026-10-31T09:57:00.000Z" }],
          bestScore: 2,
          completedAt: "2026-10-31T09:57:00.000Z",
          updatedAt: "2026-10-31T09:57:00.000Z",
        },
      },
      listeningProgress: {
        "missed-the-bus": {
          attempts: [{ attemptId: "listening-device-a", score: 2, total: 3, passed: true, completedAt: "2026-10-31T09:56:00.000Z" }],
          bestScore: 2,
          completedAt: "2026-10-31T09:56:00.000Z",
          updatedAt: "2026-10-31T09:56:00.000Z",
        },
      },
      pronunciationProgress: {
        "polite-help": {
          attempts: [{ attemptId: "pronunciation-device-a", completedAt: "2026-10-31T09:55:00.000Z", durationMs: 3500, voiceShare: 0.82, voicedFrames: 29, meanRms: 0.045, pauseCount: 1, pitchMedian: 180, pitchRangeSemitones: 4.2 }],
          updatedAt: "2026-10-31T09:55:00.000Z",
        },
      },
      studioSessions: [{ sessionId: "speaking:ask-directions:2026-10-31", studioType: "speaking", promptId: "ask-directions", wordCount: 0, checklistCompleted: 3, completedAt: "2026-10-31T09:58:00.000Z", updatedAt: "2026-10-31T09:58:00.000Z" }],
      achievementIds: ["first-mission"],
      updatedAt: "2026-10-31T10:00:00.000Z",
    };
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent("sinauu:local-extras-saved"));
  });
  await new Promise((resolve) => setTimeout(resolve, 1400));
  assert.equal(remoteState?.schemaVersion, 2, "the cloud envelope should be upgraded to v2");
  assert.ok(remoteState?.extras?.adventureProgress?.missionProgress?.["meet-your-new-neighbors"]?.completedAt, "the mission should be present in the mocked cloud snapshot");
  assert.equal(remoteState?.extras?.adventureProgress?.studioSessions?.[0]?.promptId, "ask-directions", "only Studio session metadata should be present in the cloud bundle");

  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  second.on("pageerror", (error) => pageErrors.push(error.message));
  await attachMockCloud(second);
  await second.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await second.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await second.waitForFunction(() => document.querySelector("#cloud-sync-badge")?.textContent.includes("Tersinkron"), null, { timeout: 15000 });
  await second.locator('[data-view-target="adventure"]').click();
  await second.waitForFunction(() => window.sinauuAdventureBackup?.().studioSessions?.some((item) => item.promptId === "ask-directions"));
  await second.locator('[data-adventure-select="a-day-around-town"]').waitFor({ state: "visible" });
  assert.match(await second.locator('[data-adventure-select="a-day-around-town"]').getAttribute("class"), /is-available/);
  const restored = await second.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.ok(restored?.missionProgress?.["meet-your-new-neighbors"]?.completedAt, "a second browser profile should restore the mission completion");
  assert.equal(restored?.xpLedger?.["first-completion:meet-your-new-neighbors"]?.amount, 40);
  assert.equal(restored?.listeningRate, 0.75, "Listening Lab speed preference should restore on the second profile");
  assert.deepEqual(restored?.dailyQuests?.["2026-10-31"]?.completedStepIds, ["word-neighbor"], "Daily Quest progress should restore on the second profile");
  assert.equal(restored?.mistakeJournal?.["device-a-mistake"]?.status, "open", "Mistake Journal entries should restore on the second profile");
  assert.equal(restored?.storyProgress?.["a-helpful-neighbor"]?.attempts?.length, 1, "the first device's story attempt should restore on the second profile");
  assert.equal(restored?.storyProgress?.["a-helpful-neighbor"]?.bestScore, 2, "the first story best score should be retained");
  assert.equal(restored?.dialogueProgress?.["at-the-cafe"]?.attempts?.length, 1, "the first device's dialogue attempt should restore on the second profile");
  assert.equal(restored?.dialogueProgress?.["at-the-cafe"]?.bestScore, 2, "the first dialogue best score should be retained");
  assert.equal(restored?.listeningProgress?.["missed-the-bus"]?.attempts?.length, 1, "the first device's Listening Lab attempt should restore on the second profile");
  assert.equal(restored?.listeningProgress?.["missed-the-bus"]?.bestScore, 2, "the first Listening Lab best score should be retained");
  assert.equal(restored?.pronunciationProgress?.["polite-help"]?.attempts?.length, 1, "the first device's Pronunciation Studio summary should restore on the second profile");
  assert.equal(restored?.pronunciationProgress?.["polite-help"]?.attempts?.[0]?.durationMs, 3500, "the first device's local pronunciation metrics should restore");

  await second.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "{}");
    const quest = snapshot.dailyQuests["2026-10-31"];
    quest.completedStepIds.push("grammar-article");
    quest.updatedAt = new Date(Date.now() + 1000).toISOString();
    const mistake = snapshot.mistakeJournal["device-a-mistake"];
    mistake.resolvedAt = new Date(Date.now() + 1000).toISOString();
    mistake.status = "resolved";
    const story = snapshot.storyProgress["a-helpful-neighbor"];
    story.attempts.push({ attemptId: "story-device-b", score: 3, total: 3, passed: true, completedAt: new Date(Date.now() + 1000).toISOString() });
    story.bestScore = 3;
    story.updatedAt = new Date(Date.now() + 1000).toISOString();
    const dialogue = snapshot.dialogueProgress["at-the-cafe"];
    dialogue.attempts.push({ attemptId: "dialogue-device-b", score: 3, total: 3, passed: true, completedAt: new Date(Date.now() + 1000).toISOString() });
    dialogue.bestScore = 3;
    dialogue.updatedAt = new Date(Date.now() + 1000).toISOString();
    const listening = snapshot.listeningProgress["missed-the-bus"];
    listening.attempts.push({ attemptId: "listening-device-b", score: 3, total: 3, passed: true, completedAt: new Date(Date.now() + 1000).toISOString() });
    listening.bestScore = 3;
    listening.updatedAt = new Date(Date.now() + 1000).toISOString();
    const pronunciation = snapshot.pronunciationProgress["polite-help"];
    pronunciation.attempts.push({ attemptId: "pronunciation-device-b", completedAt: new Date(Date.now() + 1000).toISOString(), durationMs: 4200, voiceShare: 0.75, voicedFrames: 31, meanRms: 0.052, pauseCount: 2, pitchMedian: 175, pitchRangeSemitones: 5.1 });
    pronunciation.updatedAt = new Date(Date.now() + 1000).toISOString();
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent("sinauu:local-extras-saved"));
  });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert.ok(remoteState?.extras?.adventureProgress?.dailyQuests?.["2026-10-31"]?.completedStepIds?.includes("grammar-article"), "Daily Quest completion from device B should merge into the cloud snapshot");
  assert.equal(remoteState?.extras?.adventureProgress?.mistakeJournal?.["device-a-mistake"]?.status, "resolved", "a resolved Mistake Journal entry should win during merge");
  const mergedStory = remoteState?.extras?.adventureProgress?.storyProgress?.["a-helpful-neighbor"];
  assert.equal(mergedStory?.attempts?.length, 2, "story attempts from both devices should be merged, not overwritten");
  assert.equal(mergedStory?.bestScore, 3, "the higher story score should become the merged best score");
  assert.ok(mergedStory?.completedAt, "the story completion should remain recorded after merging");
  const mergedDialogue = remoteState?.extras?.adventureProgress?.dialogueProgress?.["at-the-cafe"];
  assert.equal(mergedDialogue?.attempts?.length, 2, "dialogue attempts from both devices should be merged, not overwritten");
  assert.equal(mergedDialogue?.bestScore, 3, "the higher dialogue score should become the merged best score");
  assert.ok(mergedDialogue?.completedAt, "the dialogue completion should remain recorded after merging");
  const mergedListening = remoteState?.extras?.adventureProgress?.listeningProgress?.["missed-the-bus"];
  assert.equal(mergedListening?.attempts?.length, 2, "Listening Lab attempts from both devices should be merged, not overwritten");
  assert.equal(mergedListening?.bestScore, 3, "the higher Listening Lab score should become the merged best score");
  assert.ok(mergedListening?.completedAt, "the Listening Lab completion should remain recorded after merging");
  const mergedPronunciation = remoteState?.extras?.adventureProgress?.pronunciationProgress?.["polite-help"];
  assert.equal(mergedPronunciation?.attempts?.length, 2, "Pronunciation Studio summaries from both devices should merge, not overwrite");
  assert.ok(mergedPronunciation?.attempts?.every((attempt) => !("audioData" in attempt) && !("samples" in attempt)), "only compact pronunciation metrics may sync; no audio or waveform samples");
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
  assert.ok(mistakes[0].resolvedAt, "a correct retry should start spaced review");
  assert.equal(mistakes[0].reviewStage, 1, "the first successful recall should count as review 1 of 4");
  assert.ok(Date.parse(mistakes[0].nextReviewAt) > Date.now(), "the next recall should be scheduled in the future");
  assert.deepEqual(pageErrors, [], "mistake review should not throw browser JavaScript errors");
  await page.close();
});

test("Mistake Journal supports focused recall and spaced review intervals", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "mistake-spaced-access",
      refresh_token: "mistake-spaced-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "mistake-spaced-user", email: "mistake-spaced@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-adventure-start="meet-your-new-neighbors"]').click();
  await page.locator('[data-adventure-answer="1"]').click();

  const openRow = page.locator("#adventure-mistake-journal .adventure-mistake-row.is-open").first();
  await openRow.waitFor({ state: "visible" });
  assert.equal(await openRow.locator(".adventure-mistake-details .is-correct").isVisible(), false,
    "the answer should stay collapsed before a focused retry");
  await openRow.locator("[data-mistake-review-one]").click();
  const review = page.locator("#adventure-mistake-journal .adventure-mistake-review");
  await review.waitFor({ state: "visible" });
  assert.equal(await review.locator("[data-mistake-answer]").count(), 3);

  await review.locator('[data-mistake-answer="1"]').click();
  assert.match(await review.innerText(), /Belum tepat/);
  assert.equal(await review.locator(".adventure-mistake-review-correct").count(), 0,
    "wrong retries must not reveal a correct-answer confirmation");
  assert.equal(await review.locator(".adventure-mistake-explanation").count(), 0,
    "the explanation must stay hidden until a correct recall");
  await review.locator('[data-mistake-answer="0"]').click();
  assert.match(await review.innerText(), /Review 1\/4 berhasil/);
  const afterFirstRecall = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null");
    return Object.values(state?.mistakeJournal || {})[0];
  });
  assert.equal(afterFirstRecall.reviewStage, 1);
  assert.ok(afterFirstRecall.resolvedAt);
  assert.ok(Date.parse(afterFirstRecall.nextReviewAt) - Date.now() >= 23 * 60 * 60 * 1000,
    "first successful recall should schedule the next one about a day later");

  await page.locator("[data-mistake-review-close]").click();
  await page.locator('[data-mistake-filter="reviewing"]').click();
  const scheduledRow = page.locator("#adventure-mistake-journal .adventure-mistake-row.is-reviewing").first();
  await scheduledRow.waitFor({ state: "visible" });
  assert.equal(await scheduledRow.locator("button:disabled").count(), 1,
    "the same mistake should not be repeatable before its due date");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-mistake-filter="reviewing"]').click();
  assert.equal(await page.locator("#adventure-mistake-journal .adventure-mistake-row.is-reviewing").count(), 1,
    "review schedule should survive reload");
  assert.deepEqual(pageErrors, [], "focused spaced review should not throw browser JavaScript errors");
  await page.close();
});

test("Spaced Mistake Review advances 1, 3, and 7-day stages and only then marks mastery", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "mistake-interval-access",
      refresh_token: "mistake-interval-refresh",
      token_type: "bearer",
      expires_at: Math.floor(now / 1000) + 7200,
      user: { id: "mistake-interval-user", email: "mistake-interval@example.com" },
    }));
    if (!localStorage.getItem("sinauu-adventure-progress-v1")) {
      localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify({
        schemaVersion: 1,
        mistakeJournal: {
          "spaced-review-fixture": {
          mistakeId: "spaced-review-fixture",
          sourceType: "mission",
          sourceId: "fixture",
          missionId: "meet-your-new-neighbors",
          stepId: "word-neighbor",
          skill: "vocabulary",
          prompt: "Which word describes someone who lives next door to you?",
          wrongAnswer: "A passenger",
          correctAnswer: "A neighbor",
          explanation: "A neighbor lives near you.",
          recordedAt: new Date(now - 10 * 86400000).toISOString(),
          resolvedAt: new Date(now - 10 * 86400000).toISOString(),
          reviewStage: 1,
          nextReviewAt: new Date(now - 86400000).toISOString(),
          reviewHistory: [{ reviewedAt: new Date(now - 10 * 86400000).toISOString(), correct: true, stage: 1 }]
        }
      }
      }));
    }
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();

  async function answerCurrentDueMistake() {
    await page.locator('[data-mistake-filter="due"]').click();
    const row = page.locator("#adventure-mistake-journal .adventure-mistake-row.is-reviewing, #adventure-mistake-journal .adventure-mistake-row.is-open").first();
    await row.waitFor({ state: "visible" });
    await row.locator("[data-mistake-review-one]").click();
    const panel = page.locator("#adventure-mistake-journal .adventure-mistake-review");
    await panel.waitFor({ state: "visible" });
    await panel.locator('[data-mistake-answer="0"]').click();
    return page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null").mistakeJournal)[0]);
  }

  const second = await answerCurrentDueMistake();
  assert.equal(second.reviewStage, 2);
  assert.ok(Date.parse(second.nextReviewAt) - Date.now() >= 71 * 60 * 60 * 1000,
    "the second successful review should schedule roughly three days later");

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1"));
    state.mistakeJournal["spaced-review-fixture"].nextReviewAt = "2000-01-01T00:00:00.000Z";
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const third = await answerCurrentDueMistake();
  assert.equal(third.reviewStage, 3);
  assert.ok(Date.parse(third.nextReviewAt) - Date.now() >= 6 * 86400000,
    "the third successful review should schedule roughly seven days later");

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1"));
    state.mistakeJournal["spaced-review-fixture"].nextReviewAt = "2000-01-01T00:00:00.000Z";
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const mastered = await answerCurrentDueMistake();
  assert.equal(mastered.reviewStage, 4);
  assert.ok(mastered.masteredAt);
  assert.equal(mastered.nextReviewAt, null);
  assert.deepEqual(pageErrors, [], "spaced review scheduling should not throw browser JavaScript errors");
  await page.close();
});

test("Daily Quest completes three rotating challenges and awards XP only once for the local day", async () => {
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
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak() {} } });
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-daily-quest").waitFor({ state: "visible" });
  await page.locator("[data-daily-start]").click();

  for (let index = 0; index < 3; index += 1) {
    const listen = page.locator("[data-daily-listen]");
    if (await listen.count()) {
      await listen.click();
      assert.equal(await page.locator(".adventure-daily-transcript").count(), 0, "daily transcript should remain hidden at first");
      await page.locator("[data-daily-transcript]").click();
      await page.locator(".adventure-daily-transcript").waitFor({ state: "visible" });
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
  const exportedBundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.equal(exportedBundle.schemaVersion, 2, "the local backup/export bundle should use envelope v2");
  assert.ok(exportedBundle.extras.adventureProgress.dailyQuests, "Daily Quest progress should be included in CloudBundle v2");
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



test("Speaking and Writing Studios persist local drafts but export only privacy-safe session summaries", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "studio-local-access",
      refresh_token: "studio-local-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "studio-test-user", email: "studio@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-speaking-studio").waitFor({ state: "visible" });
  await page.locator('#adventure-speaking-studio [data-studio-prompt="ask-directions"]').click();
  for (let turn = 0; turn < 3; turn += 1) {
    await page.locator('#adventure-speaking-studio [data-speaking-next-turn]').click();
  }
  await page.locator('#adventure-speaking-studio [data-studio-check="0"]').check();
  await page.locator('#adventure-speaking-studio [data-studio-check="1"]').check();
  await page.locator('#adventure-speaking-studio [data-studio-check="2"]').check();
  await page.locator('#adventure-speaking-studio [data-studio-complete]').click();
  await page.locator("#adventure-writing-studio").waitFor({ state: "visible" });
  await page.locator('#adventure-writing-studio [data-studio-prompt="weekend-story"]').click();
  const privateDraft = "Last weekend I visited my cousin in town. We walked around the old market and bought some fresh fruit. After that, we had lunch together at a small café. The weather was warm, and I felt happy because we had time to talk.";
  await page.locator("#studio-writing-draft").fill(privateDraft);
  assert.match(await page.locator("#studio-writing-count").innerText(), /\d+ words/);
  const privateRevision = "Last weekend, I visited my cousin in town. First, we walked around the old market and bought some fresh fruit. Then, we had lunch together at a small café. The warm weather made the afternoon relaxing. As a result, I felt happy because we had time to talk and catch up. I would like to repeat this visit next month.";
  await page.locator("#studio-writing-revision").fill(privateRevision);
  await page.locator("#studio-writing-revision-count").waitFor();
  for (const index of [0, 1, 2]) {
    await page.locator('#adventure-writing-studio [data-studio-check="' + index + '"]').check();
  }
  await page.locator('#adventure-writing-studio [data-studio-complete]').click();

  const savedDraftKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("sinauu-adventure-studio-drafts-v1:")));
  assert.equal(savedDraftKeys.length, 1, "drafts should be stored in an account-scoped local key");
  const localBackup = await page.evaluate(() => window.sinauuAdventureBackup());
  assert.equal(localBackup.studioSessions.length, 2, "both studio sessions should be recorded");
  assert.ok(localBackup.studioSessions.some((item) => item.studioType === "writing" && item.wordCount >= 25));
  assert.ok(!JSON.stringify(localBackup).includes(privateDraft) && !JSON.stringify(localBackup).includes(privateRevision), "raw writing and revision must not be included in Adventure progress");
  const cloudBundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.ok(!JSON.stringify(cloudBundle.extras.adventureProgress).includes(privateDraft) && !JSON.stringify(cloudBundle.extras.adventureProgress).includes(privateRevision), "raw writing and revision must not enter CloudBundle");
  assert.ok(cloudBundle.extras.adventureProgress.studioSessions.length === 2, "session summaries should be included in CloudBundle");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#studio-writing-draft").waitFor({ state: "visible" });
  assert.equal(await page.locator("#studio-writing-draft").inputValue(), privateDraft, "the writing draft should survive reload locally");
  assert.deepEqual(pageErrors, [], "Studio interactions should not throw browser JavaScript errors");
  await page.close();
});


test("Adventure side panels render within three seconds while the Oxford corpus is still loading", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__adventureStartupAt = performance.now();
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "adventure-fast-start-access",
      refresh_token: "adventure-fast-start-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "adventure-fast-start-user", email: "fast-start@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  // Simulate a slow first-time download of the large Oxford corpus. Adventure does not need it.
  await page.route("**/data/oxford3000/**", async (route) => {
    if (!/\\.json\\.gz\\.b64(?:\\?|$)/.test(route.request().url())) return route.continue();
    await new Promise((resolve) => setTimeout(resolve, 4500));
    await route.continue();
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (
    document.querySelector("#adventure-daily-quest .adventure-extra-heading")
    && document.querySelector("#adventure-mistake-journal .adventure-extra-heading")
    && document.querySelector("#adventure-speaking-studio .adventure-studio-heading")
    && document.querySelector("#adventure-writing-studio .adventure-studio-heading")
  ), null, { timeout: 3000 });
  const result = await page.evaluate(() => ({
    elapsedMs: Math.round(performance.now() - window.__adventureStartupAt),
    workspaceReady: Boolean(window.sinauuWorkspaceReady),
    daily: document.querySelector("#adventure-daily-quest h3")?.textContent,
    journal: document.querySelector("#adventure-mistake-journal h3")?.textContent,
    speaking: document.querySelector("#adventure-speaking-studio h3")?.textContent,
    writing: document.querySelector("#adventure-writing-studio h3")?.textContent,
  }));
  assert.ok(result.elapsedMs <= 3000, "Adventure side panels should render within 3 seconds: " + JSON.stringify(result));
  assert.equal(result.workspaceReady, false, "Adventure must not wait for the large Oxford corpus");
  assert.match(result.daily || "", /Daily Quest/);
  assert.match(result.journal || "", /Mistake Journal/);
  assert.match(result.speaking || "", /Speaking Studio/);
  assert.match(result.writing || "", /Writing Studio/);
  assert.deepEqual(pageErrors, [], "fast Adventure startup should not throw browser JavaScript errors");
  await page.close();
});

test("Adventure workspace stays within mobile, tablet, and desktop viewport widths", async () => {
  for (const width of [390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
        access_token: "adventure-responsive-access",
        refresh_token: "adventure-responsive-refresh",
        token_type: "bearer",
        expires_at: Math.floor(Date.now() / 1000) + 7200,
        user: { id: "adventure-responsive-user", email: "responsive@example.com" },
      }));
    });
    await page.route("**/api/account**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
    });
    await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
    await page.locator('[data-view-target="adventure"]').click();
    await page.locator("#adventure-daily-quest").waitFor({ state: "visible" });
    const measurements = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      daily: document.querySelector("#adventure-daily-quest")?.getBoundingClientRect().width || 0,
      journal: document.querySelector("#adventure-mistake-journal")?.getBoundingClientRect().width || 0,
    }));
    assert.ok(measurements.document <= measurements.viewport + 1, "no horizontal document overflow at width " + width + ": " + JSON.stringify(measurements));
    assert.ok(measurements.daily > 0 && measurements.journal > 0, "both new panels should remain visible at width " + width);
    assert.ok(await page.locator("#adventure-story-library").count(), "the story shelf should mount without delaying Adventure startup");
    assert.ok(await page.locator("#adventure-everyday-english").count(), "Everyday English should mount without delaying Adventure startup");
    assert.ok(measurements.daily <= measurements.viewport && measurements.journal <= measurements.viewport, "panels should fit the viewport at width " + width);
    await page.close();
  }
});

test("Everyday Stories supports graded reading, comprehension feedback, and saved local progress", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "story-preview-access",
      refresh_token: "story-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "story-preview-user", email: "story-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-story-library .adventure-story-card").first().waitFor({ state: "visible" });
  await page.locator('[data-story-open="a-helpful-neighbor"]').click();

  assert.match(await page.locator("#adventure-story-reader").innerText(), /A Helpful Neighbor/);
  assert.match(await page.locator("#adventure-story-reader").innerText(), /watering can/i);
  assert.equal(await page.locator("[data-story-answer]").count(), 3);

  for (const answer of [0, 1, 0]) {
    await page.locator('[data-story-answer="' + answer + '"]').click();
    await page.locator(".adventure-story-feedback").waitFor({ state: "visible" });
    await page.locator("[data-story-next]").click();
  }

  await page.locator("#adventure-story-result").waitFor({ state: "visible" });
  assert.ok((await page.locator("#adventure-story-result").innerText()).includes("3/3"));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.ok(saved?.storyProgress?.["a-helpful-neighbor"]?.completedAt, "a passing story attempt should be saved");
  assert.equal(saved.storyProgress["a-helpful-neighbor"].attempts.length, 1);
  const bundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.ok(bundle.extras.adventureProgress.storyProgress["a-helpful-neighbor"], "story progress should enter the existing CloudBundle v2 snapshot");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const completedCard = page.locator('[data-story-open="a-helpful-neighbor"]');
  await completedCard.waitFor({ state: "visible" });
  assert.match(await completedCard.innerText(), /Baca lagi/);
  assert.deepEqual(pageErrors, [], "Everyday Stories should not throw browser JavaScript errors");
  await page.close();
});



test("Everyday Stories includes a B2 reading with inference-based comprehension checks", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "story-b2-preview-access",
      refresh_token: "story-b2-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "story-b2-preview-user", email: "story-b2-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();

  const storyCardButton = page.locator('[data-story-open="the-library-after-hours"]');
  const storyCard = storyCardButton.locator("xpath=ancestor::article");
  await storyCard.waitFor({ state: "visible" });
  assert.match(await storyCard.innerText(), /B2/);
  await storyCardButton.click();

  const reader = page.locator("#adventure-story-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /The Library After Hours/);
  assert.match(await reader.innerText(), /substantial/);
  assert.match(await reader.innerText(), /whereas/);
  assert.match(await reader.innerText(), /undermine/);
  assert.equal(await page.locator("[data-story-answer]").count(), 3);

  for (const answer of [1, 0, 2]) {
    await page.locator('[data-story-answer="' + answer + '"]').click();
    await page.locator(".adventure-story-feedback").waitFor({ state: "visible" });
    await page.locator("[data-story-next]").click();
  }

  const result = page.locator("#adventure-story-result");
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /3\/3/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(saved?.storyProgress?.["the-library-after-hours"]?.bestScore, 3);
  assert.ok(saved?.storyProgress?.["the-library-after-hours"]?.completedAt);
  assert.deepEqual(pageErrors, [], "B2 Everyday Stories should not throw browser JavaScript errors");
  await page.close();
});


test("Everyday English supports listening, natural responses, local progress, and Speaking Studio handoff", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "dialogue-preview-access",
      refresh_token: "dialogue-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "dialogue-preview-user", email: "dialogue-preview@example.com" },
    }));
    window.__spokenDialogueTexts = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel() {}, speak(utterance) { window.__spokenDialogueTexts.push(utterance.text); } },
    });
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const cardButton = page.locator('[data-dialogue-open="at-the-cafe"]');
  const card = cardButton.locator("xpath=ancestor::article");
  await cardButton.waitFor({ state: "visible" });
  assert.match(await card.innerText(), /A1/);
  await cardButton.click();

  const reader = page.locator("#adventure-dialogue-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /At the Café/);
  assert.equal(await page.locator("#adventure-dialogue-transcript").count(), 0, "transcript should start hidden for listening practice");
  await page.locator("[data-dialogue-listen]").click();
  const spoken = await page.evaluate(() => window.__spokenDialogueTexts);
  assert.ok(spoken.length === 1 && spoken[0].includes("Barista:"), "the browser should read the scripted conversation");
  await page.locator("[data-dialogue-transcript]").click();
  await page.locator("#adventure-dialogue-transcript").waitFor({ state: "visible" });
  assert.match(await page.locator("#adventure-dialogue-transcript").innerText(), /Could I have a cup of coffee/);
  assert.equal(await page.locator("[data-dialogue-answer]").count(), 3);

  for (const answer of [0, 1, 0]) {
    await page.locator('[data-dialogue-answer="' + answer + '"]').click();
    await page.locator(".adventure-dialogue-feedback").waitFor({ state: "visible" });
    await page.locator("[data-dialogue-next]").click();
  }

  const result = page.locator("#adventure-dialogue-result");
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /3\/3/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(saved?.dialogueProgress?.["at-the-cafe"]?.bestScore, 3);
  assert.ok(saved?.dialogueProgress?.["at-the-cafe"]?.completedAt);
  const bundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.ok(bundle.extras.adventureProgress.dialogueProgress["at-the-cafe"], "dialogue progress should be included in CloudBundle v2");

  await page.locator('[data-dialogue-speaking="at-the-cafe"]').click();
  await page.locator('#adventure-speaking-studio [data-studio-prompt="cafe-order"].is-active').waitFor({ state: "visible" });
  assert.match(await page.locator("#adventure-speaking-studio").innerText(), /Order one drink and one snack/);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(restored?.dialogueProgress?.["at-the-cafe"]?.attempts?.length, 1, "dialogue progress should survive reloading");
  assert.deepEqual(pageErrors, [], "Everyday English should not throw browser JavaScript errors");
  await page.close();
});


test("Everyday English includes a B2 discussion that evaluates evidence, alternatives, and consequences", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "b2-dialogue-preview-access",
      refresh_token: "b2-dialogue-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "b2-dialogue-preview-user", email: "b2-dialogue-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const open = page.locator('[data-dialogue-open="revising-a-project-proposal"]');
  const card = open.locator("xpath=ancestor::article");
  await open.waitFor({ state: "visible" });
  assert.match(await card.innerText(), /B2/);
  await open.click();
  const reader = page.locator("#adventure-dialogue-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /Revising a Project Proposal/);
  assert.match(await reader.innerText(), /substantial/);
  assert.equal(await page.locator("[data-dialogue-answer]").count(), 3);
  for (const answer of [0, 1, 2]) {
    await page.locator('[data-dialogue-answer="' + answer + '"]').click();
    await page.locator(".adventure-dialogue-feedback").waitFor({ state: "visible" });
    await page.locator("[data-dialogue-next]").click();
  }
  const result = page.locator("#adventure-dialogue-result");
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /3\/3/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(saved?.dialogueProgress?.["revising-a-project-proposal"]?.bestScore, 3);
  assert.ok(saved?.dialogueProgress?.["revising-a-project-proposal"]?.completedAt);
  assert.deepEqual(pageErrors, [], "B2 Everyday English should not throw browser JavaScript errors");
  await page.close();
});


test("Listening Lab teaches gist, detail, and inference with optional transcript, saved speed, and local progress", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "listening-preview-access",
      refresh_token: "listening-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "listening-preview-user", email: "listening-preview@example.com" },
    }));
    window.__spokenListeningTexts = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel() {}, speak(utterance) { window.__spokenListeningTexts.push(utterance.text); } },
    });
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();

  const listeningCards = page.locator("#adventure-listening-lab .listening-lab-card");
  await listeningCards.first().waitFor({ state: "visible" });
  assert.equal(await listeningCards.count(), 8, "Listening Lab should contain eight graded exercises");
  const open = page.locator('[data-listening-open="missed-the-bus"]');
  const card = open.locator("xpath=ancestor::article");
  await open.waitFor({ state: "visible" });
  assert.match(await card.innerText(), /A1/);
  await open.click();

  const reader = page.locator("#listening-lab-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /Missed the Bus/);
  assert.match(await reader.innerText(), /TAHAP 1\/3/);
  assert.equal(await page.locator("#listening-lab-transcript").count(), 0, "transcript should start hidden");

  await page.locator("[data-listening-play]").click();
  const spoken = await page.evaluate(() => window.__spokenListeningTexts);
  assert.ok(spoken.length === 1 && spoken[0].includes("Mia:"), "the browser should read only the current listening stage");
  await page.locator('[data-listening-rate="0.75"]').click();
  assert.equal(await page.locator('[data-listening-rate="0.75"]').getAttribute("aria-pressed"), "true");
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(saved?.listeningRate, 0.75, "Listening Lab playback speed should persist");

  await page.locator("[data-listening-transcript]").click();
  await page.locator("#listening-lab-transcript").waitFor({ state: "visible" });
  assert.match(await page.locator("#listening-lab-transcript").innerText(), /I usually take the early bus/);

  for (const [index, answer] of [0, 1, 1].entries()) {
    await page.locator('[data-listening-answer="' + answer + '"]').click();
    await page.locator(".listening-lab-feedback").waitFor({ state: "visible" });
    if (index < 2) {
      await page.locator("[data-listening-next]").click();
      assert.match(await reader.innerText(), new RegExp("TAHAP " + (index + 2) + "/3"));
    } else {
      await page.locator("[data-listening-next]").click();
    }
  }

  const result = page.locator("#listening-lab-result");
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /3\/3/);
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  assert.equal(saved?.listeningProgress?.["missed-the-bus"]?.bestScore, 3);
  assert.ok(saved?.listeningProgress?.["missed-the-bus"]?.completedAt);
  const bundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.ok(bundle.extras.adventureProgress.listeningProgress["missed-the-bus"], "Listening Lab progress should be included in CloudBundle v2");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const restoredCard = page.locator('[data-listening-open="missed-the-bus"]').locator("xpath=ancestor::article");
  await restoredCard.waitFor({ state: "visible" });
  assert.match(await restoredCard.innerText(), /SELESAI/);
  assert.deepEqual(pageErrors, [], "Listening Lab should not throw browser JavaScript errors");
  await page.close();
});


test("Listening Lab B2 exercise asks learners to distinguish contrast and infer a recommendation", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "listening-b2-preview-access",
      refresh_token: "listening-b2-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "listening-b2-preview-user", email: "listening-b2-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const open = page.locator('[data-listening-open="reviewing-a-study-proposal"]');
  const card = open.locator("xpath=ancestor::article");
  await open.waitFor({ state: "visible" });
  assert.match(await card.innerText(), /B2/);
  await open.click();
  const reader = page.locator("#listening-lab-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /Reviewing a Study-Space Proposal/);
  await page.locator('[data-listening-answer="0"]').click();
  await page.locator("[data-listening-next]").click();
  assert.match(await reader.innerText(), /Listen for a contrast/);
  await page.locator('[data-listening-answer="0"]').click();
  await page.locator("[data-listening-next]").click();
  await page.locator('[data-listening-answer="1"]').click();
  await page.locator("[data-listening-next]").click();
  assert.match(await page.locator("#listening-lab-result").innerText(), /3\/3/);
  assert.deepEqual(pageErrors, [], "B2 Listening Lab should not throw browser JavaScript errors");
  await page.close();
});


test("Listening Lab keeps the exercise usable when browser speech synthesis is unavailable", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "listening-fallback-preview-access",
      refresh_token: "listening-fallback-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "listening-fallback-preview-user", email: "listening-fallback-preview@example.com" },
    }));
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    window.SpeechSynthesisUtterance = undefined;
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-listening-open="booking-a-study-room"]').click();
  await page.locator("#listening-lab-reader").waitFor({ state: "visible" });
  await page.locator("[data-listening-play]").click();
  await page.locator("#listening-lab-transcript").waitFor({ state: "visible" });
  assert.match(await page.locator(".listening-lab-player").innerText(), /tidak tersedia/i);
  assert.match(await page.locator("#listening-lab-transcript").innerText(), /study room/);
  assert.deepEqual(pageErrors, [], "speech-synthesis fallback should not throw browser JavaScript errors");
  await page.close();
});


test("Pronunciation Studio analyses microphone signal locally and stores only compact metrics", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  const writeRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method())) writeRequests.push(request.url());
  });
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "pronunciation-preview-access",
      refresh_token: "pronunciation-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "pronunciation-preview-user", email: "pronunciation-preview@example.com" },
    }));
    window.__pronunciationReference = [];
    window.__micTrackStopped = false;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel() {}, speak(utterance) { window.__pronunciationReference.push(utterance.text); } },
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop() { window.__micTrackStopped = true; } }],
        }),
      },
    });
    class FakeAnalyser {
      constructor() { this.fftSize = 2048; this.smoothingTimeConstant = 0; }
      connect() {}
      disconnect() {}
      getFloatTimeDomainData(target) {
        for (let index = 0; index < target.length; index += 1) {
          target[index] = Math.sin(2 * Math.PI * 180 * index / 48000) * 0.08;
        }
      }
    }
    window.AudioContext = class {
      constructor() { this.sampleRate = 48000; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createAnalyser() { return new FakeAnalyser(); }
      async resume() {}
      async close() {}
    };
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();

  const open = page.locator('[data-pronunciation-open="polite-help"]');
  const card = open.locator("xpath=ancestor::article");
  await open.waitFor({ state: "visible" });
  assert.match(await card.innerText(), /A1/);
  await open.click();
  const reader = page.locator("#pronunciation-studio-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /Could you help me, please/);
  assert.match(await reader.innerText(), /HELP/);
  assert.match(await reader.innerText(), /PLEASE/);
  await page.locator("[data-pronunciation-reference]").click();
  assert.deepEqual(await page.evaluate(() => window.__pronunciationReference), ["Could you help me, please?"]);

  const writesBeforeRecording = writeRequests.length;
  await page.locator("[data-pronunciation-toggle]").click();
  await page.locator("#pronunciation-capture-status").getByText("SEDANG MEREKAM", { exact: true }).waitFor();
  await page.waitForTimeout(1100);
  await page.locator("[data-pronunciation-toggle]").click();
  const result = page.locator("#pronunciation-studio-result");
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /Durasi/);
  assert.match(await result.innerText(), /Kontur tinggi nada/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  const attempts = saved?.pronunciationProgress?.["polite-help"]?.attempts || [];
  assert.equal(attempts.length, 1, "one compact practice attempt should be stored");
  assert.ok(attempts[0].durationMs >= 900, "recording duration should be measured");
  assert.ok(attempts[0].voicedFrames > 0, "local signal analysis should detect voice activity");
  assert.ok(attempts[0].voiceShare > 0, "voice activity ratio should be available");
  assert.ok(!("samples" in attempts[0]) && !("audioData" in attempts[0]) && !("recording" in attempts[0]), "raw audio and waveform samples must not be persisted");
  assert.ok(await page.evaluate(() => window.__micTrackStopped), "the microphone track should stop after recording");
  assert.equal(writeRequests.length, writesBeforeRecording, "recording should not send a POST, PUT, or PATCH request");
  const bundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.ok(bundle.extras.adventureProgress.pronunciationProgress["polite-help"], "only the summary should be included in CloudBundle v2");
  assert.deepEqual(pageErrors, [], "local microphone analysis should not throw browser JavaScript errors");
  await page.close();
});


test("Pronunciation Studio handles denied microphone access without breaking the phrase guide", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "pronunciation-denied-access",
      refresh_token: "pronunciation-denied-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "pronunciation-denied-user", email: "pronunciation-denied@example.com" },
    }));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => { const error = new Error("Permission denied"); error.name = "NotAllowedError"; throw error; } },
    });
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-pronunciation-open="weigh-the-benefits"]').click();
  await page.locator("[data-pronunciation-toggle]").click();
  await page.locator("#pronunciation-capture-note").getByText(/Izin mikrofon ditolak/i).waitFor();
  assert.match(await page.locator("#pronunciation-studio-reader").innerText(), /long-term benefits/);
  assert.deepEqual(pageErrors, [], "denied microphone access should not break the phrase guide");
  await page.close();
});


test("Pronunciation Studio includes B2 guidance for contrast and long sentence rhythm", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "pronunciation-b2-access",
      refresh_token: "pronunciation-b2-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "pronunciation-b2-user", email: "pronunciation-b2@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-pronunciation-open="proposal-evidence"]').click();
  const reader = page.locator("#pronunciation-studio-reader");
  await reader.waitFor({ state: "visible" });
  assert.match(await reader.innerText(), /although the evidence remains limited/i);
  assert.match(await reader.innerText(), /CONTRAST AND THOUGHT GROUPS/i);
  assert.match(await reader.innerText(), /PROMISING/);
  assert.match(await reader.innerText(), /EVIDENCE/);
  assert.match(await reader.innerText(), /LIMITED/);
  assert.deepEqual(pageErrors, [], "B2 Pronunciation Studio should not throw browser JavaScript errors");
  await page.close();
});


test("Speaking Studio guides an open conversation, keeps turn progress local, and stores only a self-review summary", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "speaking-preview-access",
      refresh_token: "speaking-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "speaking-preview-user", email: "speaking-preview@example.com" },
    }));
    window.__speakingPartnerLines = [];
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel() {}, speak(utterance) { window.__speakingPartnerLines.push(utterance.text); } },
    });
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();

  const studio = page.locator("#adventure-speaking-studio");
  await studio.getByText("Speaking Studio", { exact: true }).waitFor();
  assert.match(await studio.innerText(), /YOUR PARTNER SAYS/);
  assert.match(await studio.innerText(), /Is this your first class here/);
  await studio.locator("[data-speaking-play-partner]").click();
  assert.deepEqual(await page.evaluate(() => window.__speakingPartnerLines), ["Hi! I'm Alex. Is this your first class here?"]);

  await studio.locator("[data-speaking-next-turn]").click();
  assert.match(await studio.innerText(), /TURN 2 \/ 3/);
  assert.match(await studio.innerText(), /What do you like doing after class/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  assert.match(await studio.innerText(), /TURN 2 \/ 3/, "the current conversation turn should survive a reload");

  await studio.locator("[data-speaking-next-turn]").click();
  assert.match(await studio.innerText(), /TURN 3 \/ 3/);
  await studio.locator("[data-speaking-next-turn]").click();
  assert.match(await studio.innerText(), /CONVERSATION COMPLETE/);
  assert.equal(await studio.locator("[data-studio-check]").count(), 3);
  const complete = studio.locator("[data-studio-complete]");
  assert.equal(await complete.isDisabled(), true, "self-review is required before saving a session");
  for (let index = 0; index < 3; index += 1) {
    await studio.locator('[data-studio-check="' + index + '"]').check();
  }
  assert.equal(await complete.isDisabled(), false);
  await complete.click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "null"));
  const session = saved?.studioSessions?.find((item) => item.studioType === "speaking" && item.promptId === "first-introduction");
  assert.ok(session, "a completed speaking session should be recorded");
  assert.equal(session.wordCount, 0);
  assert.equal(session.checklistCompleted, 3);
  assert.ok(!("text" in session) && !("transcript" in session) && !("audioData" in session), "session metadata must not contain an answer transcript or audio");
  const cloudBundle = await page.evaluate(() => window.sinauuExportLocalBundle());
  const cloudSessions = cloudBundle?.extras?.adventureProgress?.studioSessions || [];
  const cloudSession = cloudSessions.find((item) => item.studioType === "speaking" && item.promptId === "first-introduction");
  assert.ok(cloudSession, "the compact session summary should be included in CloudBundle v2");
  assert.ok(!("text" in cloudSession) && !("transcript" in cloudSession) && !("audioData" in cloudSession));
  assert.deepEqual(pageErrors, [], "Speaking Studio should not throw browser JavaScript errors");
  await page.close();
});


test("Speaking Studio includes a B2 discussion with counterarguments and an evidence-based follow-up", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "speaking-b2-preview-access",
      refresh_token: "speaking-b2-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "speaking-b2-preview-user", email: "speaking-b2-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const studio = page.locator("#adventure-speaking-studio");
  await studio.locator('[data-studio-prompt="present-study-proposal"]').click();
  assert.match(await studio.innerText(), /B2/);
  assert.match(await studio.innerText(), /students who prefer group study/);
  await studio.locator("[data-speaking-next-turn]").click();
  assert.match(await studio.innerText(), /Which changes would you prioritise first/);
  await studio.locator("[data-speaking-next-turn]").click();
  assert.match(await studio.innerText(), /How would we know whether the proposal is working/);
  assert.deepEqual(pageErrors, [], "B2 Speaking Studio scenario should not throw browser JavaScript errors");
  await page.close();
});


test("Writing Studio guides planning, drafting, revision, reflection, and keeps all raw text local", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "writing-preview-access",
      refresh_token: "writing-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "writing-preview-user", email: "writing-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();

  const studio = page.locator("#adventure-writing-studio");
  await studio.getByText("Writing Studio", { exact: true }).waitFor();
  await studio.locator('[data-studio-prompt="weekend-story"]').click();
  await studio.locator('[data-writing-plan="opening"]').fill("Last Saturday, I visited the city library with my cousin.");
  await studio.locator('[data-writing-plan="detail"]').fill("We chose two novels and studied together because the reading room was quiet.");
  await studio.locator('[data-writing-plan="closing"]').fill("I felt refreshed and want to go there again.");
  await studio.locator("[data-writing-build-outline]").click();
  const draft = "Last Saturday, I visited the city library with my cousin. We chose two novels and studied together because the reading room was quiet. I felt refreshed and want to go there again.";
  assert.equal(await studio.locator("#studio-writing-draft").inputValue(), draft, "the outline should provide an editable first draft");

  const revised = "Last Saturday, I visited the city library with my cousin. First, we explored the reading room and chose two interesting novels. Then, we studied together because the quiet space helped us focus. As a result, I felt refreshed and more motivated to read. I would like to return next weekend.";
  await studio.locator("#studio-writing-draft").fill(draft);
  await studio.locator("#studio-writing-revision").fill(revised);
  assert.match(await studio.locator("#studio-writing-revision-count").innerText(), /\d+ words/);
  assert.match(await studio.locator(".writing-studio-signals").innerText(), /Idea connections/);
  assert.equal(await studio.locator("[data-studio-check]").count(), 3, "the self-review checklist should open after a substantial revision");
  const complete = studio.locator("[data-studio-complete]");
  assert.equal(await complete.isDisabled(), true, "all reflection checks are required");
  for (let index = 0; index < 3; index += 1) await studio.locator('[data-studio-check="' + index + '"]').check();
  assert.equal(await complete.isDisabled(), false);
  await complete.click();

  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-adventure-studio-drafts-v1:" + encodeURIComponent("writing-preview-user")) || "null"));
  assert.equal(raw.writing.prompts["weekend-story"].revision, revised, "the revised draft should remain available locally");
  assert.equal(raw.writing.prompts["weekend-story"].plan.detail, "We chose two novels and studied together because the reading room was quiet.");
  const backup = await page.evaluate(() => window.sinauuAdventureBackup());
  const session = backup.studioSessions.find((item) => item.studioType === "writing" && item.promptId === "weekend-story");
  assert.ok(session && session.wordCount >= 25, "the completed session should count the revised version");
  assert.ok(!JSON.stringify(backup).includes(draft) && !JSON.stringify(backup).includes(revised), "raw writing must stay out of Adventure progress");
  const cloud = await page.evaluate(() => window.sinauuExportLocalBundle());
  assert.ok(!JSON.stringify(cloud.extras.adventureProgress).includes(draft) && !JSON.stringify(cloud.extras.adventureProgress).includes(revised), "raw writing must stay out of CloudBundle");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#studio-writing-revision").waitFor({ state: "visible" });
  assert.equal(await page.locator("#studio-writing-draft").inputValue(), draft);
  assert.equal(await page.locator("#studio-writing-revision").inputValue(), revised);
  assert.deepEqual(pageErrors, [], "Writing Studio should not throw browser JavaScript errors");
  await page.close();
});


test("Writing Studio includes B1 and B2 tasks with appropriate targets and reflection", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "writing-b2-preview-access",
      refresh_token: "writing-b2-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "writing-b2-preview-user", email: "writing-b2-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const studio = page.locator("#adventure-writing-studio");
  await studio.locator('[data-studio-prompt="study-reflection"]').click();
  assert.match(await studio.innerText(), /B1/);
  await studio.locator('[data-studio-prompt="balanced-proposal"]').click();
  assert.match(await studio.innerText(), /B2/);
  assert.match(await studio.innerText(), /acknowledge a possible drawback/i);
  assert.deepEqual(pageErrors, [], "B2 Writing Studio task should not throw browser JavaScript errors");
  await page.close();
});


test("Daily study plan adapts to due vocabulary, a weak grammar topic, and an in-progress Adventure quest", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const nowIso = now.toISOString();
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "study-plan-access",
      refresh_token: "study-plan-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "study-plan-user", email: "study-plan@example.com" },
    }));
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify({
      schemaVersion: 1,
      dailyQuests: {
        [today]: {
          dateKey: today,
          missionId: "meet-your-new-neighbors",
          stepIds: ["word-neighbor", "listen-greeting", "grammar-article"],
          completedStepIds: ["word-neighbor"],
          wrongAttempts: {},
          startedAt: nowIso,
          completedAt: null,
          updatedAt: nowIso,
        },
      },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "old-attempt" }],
          skillEvidence: { recall: true, context: true, production: true },
          firstSeenDate: yesterday,
          studiedDates: [yesterday],
          nextReviewAt: new Date(now.getTime() - 3600000).toISOString(),
          reviewSuccesses: 0,
          reviewDates: [],
          reviewHistory: [{ date: today, at: now.toISOString(), correct: true, sessionId: "review-today" }],
          weak: true,
          consecutiveErrors: 2,
        },
      },
      favorites: [],
      grammarProgress: {
        "present-simple": {
          attempts: 10,
          correct: 2,
          answers: { "present-simple-q1": { correct: false, response: "wrong", at: now.toISOString() } },
          history: [],
        },
      },
      events: [],
      history: [{
        id: "today-review",
        at: now.toISOString(),
        date: today,
        type: "vocabulary",
        title: "hello",
        detail: "Review arti",
        correct: true,
        wordId: "a1-hello",
        skill: "recall",
        mode: "review",
      }],
      updatedAt: now.toISOString(),
    };
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("sinauu-local-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("state")) request.result.createObjectStore("state", { keyPath: "key" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("state", "readwrite");
        transaction.objectStore("state").put({ key: "main", value: state });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    });
  });

  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));
  assert.equal(await page.locator("#home-study-plan-count").innerText(), "1/3",
    "the due-word review should count as completed from saved review history");
  const wordStep = page.locator("#home-study-plan-steps .home-study-plan-step").nth(0);
  assert.match(await wordStep.getAttribute("class"), /is-complete/);
  assert.equal(await wordStep.locator("h3").innerText(), "Ingat kembali · hello");
  const grammarStep = page.locator("#home-study-plan-steps .home-study-plan-step").nth(1);
  assert.match(await grammarStep.locator("h3").innerText(), /Present simple/i,
    "the lowest-accuracy grammar topic should be recommended first");
  assert.equal(await grammarStep.locator("[data-plan-topic]").getAttribute("data-plan-topic"), "present-simple");
  assert.ok((await page.locator("#home-study-plan-steps .home-study-plan-step").nth(2).innerText()).includes("1/3 tantangan"));
  assert.match(await page.locator("[data-plan-adventure]").innerText(), /Lanjutkan quest/);

  await grammarStep.locator("[data-plan-topic]").click();
  await page.locator("#view-grammar.is-visible").waitFor({ state: "visible" });
  assert.match(await page.locator("#lesson-panel").innerText(), /Present simple/i);
  await page.locator('[data-view-target="overview"]').first().click();
  await page.locator("[data-plan-adventure]").click();
  await page.locator("#view-adventure.is-visible").waitFor({ state: "visible" });
  await page.locator("#adventure-daily-quest .adventure-extra-heading").waitFor({ state: "visible" });
  assert.deepEqual(pageErrors, [], "adaptive study plan navigation should not throw browser JavaScript errors");
  await page.close();
});

test("Daily study plan starts with a new word when no vocabulary review is due", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "study-plan-new-word-access",
      refresh_token: "study-plan-new-word-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "study-plan-new-word-user", email: "new-word@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  const action = page.locator("#home-study-plan-steps .home-study-plan-step").first().locator("[data-plan-vocabulary]");
  await action.waitFor({ state: "visible" });
  assert.equal(await action.getAttribute("data-plan-mode"), "learn");
  const selectedWordId = await action.getAttribute("data-plan-vocabulary");
  assert.ok(selectedWordId, "a study-ready new word should be suggested");
  await action.click();
  await page.locator("#view-study.is-visible").waitFor({ state: "visible" });
  assert.ok((await page.locator("#study-container h1").innerText()).length > 0,
    "the plan should open the three-stage word learning session");
  assert.deepEqual(pageErrors, [], "new-word study plan should not throw browser JavaScript errors");
  await page.close();
});


test("Placement Check adapts to a learner's answers and saves a local estimate", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "placement-preview-access",
      refresh_token: "placement-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "placement-preview-user", email: "placement-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  await page.locator("#placement-teaser-action").click();
  await page.locator("#view-placement.is-visible").waitFor({ state: "visible" });
  await page.locator("#placement-start").click();

  const answers = [1, 1, 1, 1, 0];
  for (let index = 0; index < answers.length; index += 1) {
    await page.locator('[data-placement-answer="' + answers[index] + '"]').click();
    await page.locator("#placement-feedback").waitFor({ state: "visible" });
    if (index === 1) assert.match(await page.locator("#placement-feedback").innerText(), /borrow/i,
      "a wrong answer should reveal the correct choice after the attempt");
    await page.locator("#placement-next").click();
  }

  await page.locator("#placement-result").waitFor({ state: "visible" });
  assert.equal(await page.locator("#placement-result-level").innerText(), "A1");
  assert.equal(await page.locator("#placement-score").innerText(), "2/5");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sinauu-placement-check-v1") || "null"));
  assert.equal(saved?.level, "A1");
  assert.equal(saved?.total, 5);
  assert.equal(saved?.correct, 2);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  assert.match(await page.locator("#placement-teaser-summary").innerText(), /A1/);
  await page.locator("#placement-teaser-action").click();
  await page.locator("#placement-result").waitFor({ state: "visible" });
  assert.equal(await page.locator("#placement-result-level").innerText(), "A1");
  assert.deepEqual(pageErrors, [], "Placement Check should not throw browser JavaScript errors");
  await page.close();
});

test("Placement Check progresses through all four bands when answers are consistently correct", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "placement-preview-access",
      refresh_token: "placement-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "placement-preview-user", email: "placement-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  await page.locator("#placement-teaser-action").click();
  await page.locator("#placement-start").click();
  const correctAnswers = [1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0];
  for (const answer of correctAnswers) {
    await page.locator('[data-placement-answer="' + answer + '"]').click();
    await page.locator("#placement-next").click();
  }

  await page.locator("#placement-result").waitFor({ state: "visible" });
  assert.equal(await page.locator("#placement-result-level").innerText(), "B2");
  assert.equal(await page.locator("#placement-score").innerText(), "20/20");
  assert.equal(await page.locator("#placement-level-breakdown .placement-level-row").count(), 4);
  assert.deepEqual(pageErrors, [], "the full adaptive assessment should not throw browser JavaScript errors");
  await page.close();
});

test("Placement Check ignores malformed saved results and starts with a clean assessment", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "placement-corrupt-access",
      refresh_token: "placement-corrupt-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "placement-corrupt-user", email: "placement-corrupt@example.com" },
    }));
    localStorage.setItem("sinauu-placement-check-v1", JSON.stringify({
      level: "B2", correct: 20, total: 20, levelScores: [], categoryScores: [], completedAt: "not-a-date",
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator("#placement-teaser-action").click();
  await page.locator("#placement-intro").waitFor({ state: "visible" });
  await page.locator("#placement-start").click();
  await page.locator("#placement-quiz").waitFor({ state: "visible" });
  assert.ok((await page.locator("#placement-question").innerText()).length > 0);
  assert.deepEqual(pageErrors, [], "corrupt placement storage should not break the workspace");
  await page.close();
});



test("Grammar curriculum covers A1-B2 with the expanded topic bank", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "grammar-expanded-access",
      refresh_token: "grammar-expanded-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "grammar-expanded-user", email: "grammar-expanded@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="grammar"]').first().click();
  await page.locator("#view-grammar.is-visible").waitFor({ state: "visible" });
  const topicCodes = await page.locator("#grammar-topic-list .topic-code").allInnerTexts();
  assert.equal(topicCodes.length, 19);
  for (const [level, expected] of [["A1", 6], ["A2", 6], ["B1", 4], ["B2", 3]]) {
    assert.equal(topicCodes.filter((value) => value === level).length, expected, level + " lesson coverage changed");
  }
  const measurements = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(measurements.document <= measurements.viewport + 1, "Grammar view should not overflow at 390px");
  assert.deepEqual(pageErrors, [], "expanded Grammar view should not throw browser JavaScript errors");
  await page.close();
});



test("Everyday Stories result links the learner to related listening, dialogue, pronunciation, speaking, and writing", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "learning-path-access",
      refresh_token: "learning-path-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "learning-path-user", email: "learning-path@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-story-open="a-rainy-morning"]').waitFor({ state: "visible" });
  await page.locator('[data-story-open="a-rainy-morning"]').click();
  for (const answer of [0, 0, 0]) {
    await page.locator('[data-story-answer="' + answer + '"]').click();
    await page.locator(".adventure-story-feedback").waitFor({ state: "visible" });
    await page.locator("[data-story-next]").click();
  }
  const result = page.locator("#adventure-story-result");
  await result.waitFor({ state: "visible" });
  const links = result.locator("[data-learning-path-link]");
  await page.waitForFunction(() => document.querySelectorAll("#adventure-story-result [data-learning-path-link]").length >= 6);
  await links.first().waitFor({ state: "visible" });
  const labels = (await links.allInnerTexts()).join(" | ");
  assert.match(labels, /Baca cerita terkait|Dengarkan dialog|Latihan listening|Latihan pronunciation/);
  assert.ok(labels.includes("Lanjut ke Speaking Studio"));
  assert.ok(labels.includes("Lanjut ke Writing Studio"));
  const measurements = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    path: document.querySelector(".adventure-learning-path")?.getBoundingClientRect().width || 0,
  }));
  assert.ok(measurements.path > 0 && measurements.document <= measurements.viewport + 1,
    "the cross-skill handoff should fit a 390px screen");
  const dialogueLink = result.locator('[data-dialogue-open="at-the-cafe"]');
  await dialogueLink.focus();
  await dialogueLink.press("Enter");
  await page.locator("#adventure-dialogue-reader").waitFor({ state: "visible" });
  assert.match(await page.locator("#adventure-dialogue-reader").innerText(), /At the Café/);
  assert.deepEqual(pageErrors, [], "cross-skill handoff should not throw browser JavaScript errors");
  await page.close();
});



test("Pronunciation Studio contains four guided phrases at every CEFR band", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "pronunciation-level-access",
      refresh_token: "pronunciation-level-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "pronunciation-level-user", email: "pronunciation-level@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  const cards = page.locator("#adventure-pronunciation-studio [data-pronunciation-open]");
  await cards.first().waitFor({ state: "visible" });
  assert.equal(await cards.count(), 16);
  const levels = await page.locator("#adventure-pronunciation-studio .adventure-story-level").allInnerTexts();
  for (const level of ["A1", "A2", "B1", "B2"]) {
    assert.equal(levels.filter((value) => value === level).length, 4, level + " pronunciation coverage changed");
  }
  await page.locator('[data-pronunciation-open="clear-instructions"]').click();
  await page.locator("#pronunciation-studio-reader").waitFor({ state: "visible" });
  assert.ok(await page.locator("#pronunciation-studio-reader .adventure-learning-path [data-learning-path-link]").count() >= 4);
  assert.deepEqual(pageErrors, [], "Pronunciation Studio should not throw browser JavaScript errors");
  await page.close();
});



test("JSON backup restores previously saved vocabulary and grammar progress", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "backup-restore-access",
      refresh_token: "backup-restore-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "backup-restore-user", email: "backup-restore@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  await page.locator("#view-vocabulary [data-view-target='grammar']").click();
  const topicButtons = page.locator("#grammar-topic-list .topic-button");
  await topicButtons.first().waitFor({ state: "visible" });
  await topicButtons.first().click();
  await page.locator("#lesson-panel .lesson-answer").first().click();
  await page.locator("#lesson-panel .lesson-feedback").waitFor({ state: "visible" });
  assert.match(await topicButtons.first().innerText(), /1\/3 soal dicoba/);

  await page.locator('[data-view-target="progress"]').first().click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-backup").click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  assert.ok(backupPath, "backup export should create a JSON download");
  const backupBytes = await readFile(backupPath);

  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  await page.locator("#view-vocabulary [data-view-target='grammar']").click();
  await topicButtons.nth(1).click();
  await page.locator("#lesson-panel .lesson-answer").first().click();
  await page.locator("#lesson-panel .lesson-feedback").waitFor({ state: "visible" });
  assert.match(await topicButtons.nth(1).innerText(), /1\/3 soal dicoba/);

  await page.locator("[data-view-target=\"progress\"]").first().click();
  await page.locator("#import-backup").setInputFiles({
    name: "sinauuenglish-backup.json",
    mimeType: "application/json",
    buffer: backupBytes,
  });
  await page.waitForFunction(() => document.querySelector("#backup-status")?.textContent.includes("berhasil dipulihkan"));
  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  await page.locator("#view-vocabulary [data-view-target='grammar']").click();
  assert.match(await topicButtons.first().innerText(), /1\/3 soal dicoba/,
    "progress included in the exported backup should be restored");
  assert.match(await topicButtons.nth(1).innerText(), /0\/3 soal dicoba/,
    "progress created after the backup should be replaced by the older backup state");
  assert.deepEqual(pageErrors, [], "backup restoration should not throw browser JavaScript errors");
  await page.close();
});


test("workspace IA keeps five primary destinations, keyboard tabs, and a reachable Adventure route", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "ia-preview-access",
      refresh_token: "ia-preview-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "ia-preview-user", email: "ia-preview@example.com" },
    }));
  });
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  const primaryLabels = await page.locator(".side-nav .side-link").evaluateAll((nodes) =>
    nodes.map((node) => node.querySelectorAll("span")[1]?.textContent.trim())
  );
  assert.deepEqual(primaryLabels, ["Beranda", "Belajar", "Bacaan", "Review", "Progres"]);
  assert.equal(await page.locator(".side-nav [data-view-target='adventure']").count(), 0);
  assert.equal(await page.locator(".side-nav .side-link[aria-current='page']").getAttribute("data-view-target"), "overview");
  assert.equal(await page.locator("#home-primary-label").innerText(), "Mulai sesi pertama");
  await page.locator("#home-primary-action").click();
  assert.equal(await page.locator("#view-study").isVisible(), true,
    "a new learner should be taken directly into their first guided session");
  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  assert.equal(await page.locator(".side-nav").evaluate(el => getComputedStyle(el).position), "fixed",
    "the primary navigation should remain thumb-reachable at the bottom on mobile");

  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  assert.equal(await page.locator("#view-vocabulary").isVisible(), true);
  await page.locator("#vocab-search").fill("hello");
  await page.waitForFunction(() => Boolean(document.querySelector("#vocab-list [data-select-word]")));
  const firstWord = page.locator("#vocab-list [data-select-word]").first();
  const firstWordId = await firstWord.getAttribute("data-select-word");
  await firstWord.click();
  assert.equal(await page.locator("#vocab-layout").evaluate(el => el.classList.contains("is-detail-open")), true);
  assert.equal(await page.locator("#vocab-list").isVisible(), false);
  await page.locator("#word-detail [data-vocab-back]").click();
  assert.equal(await page.locator("#vocab-layout").evaluate(el => el.classList.contains("is-detail-open")), false);
  assert.equal(await page.locator("#vocab-list").isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.selectWord), firstWordId,
    "closing a word detail should restore focus to the selected vocabulary row");
  await page.locator("#view-vocabulary [data-view-target='grammar']").click();
  assert.equal(await page.locator("#view-grammar").isVisible(), true);
  assert.equal(await page.locator(".side-nav .side-link[aria-current='page']").getAttribute("data-view-target"), "vocabulary");
  assert.equal(await page.locator("#view-grammar .grammar-layout").evaluate(el => el.classList.contains("is-detail-open")), false);
  await page.locator(".side-nav [data-view-target='overview']").click();
  assert.equal(await page.locator("#home-primary-action").getAttribute("data-home-action"), "active-study",
    "an unfinished session should be resumable from the home CTA");
  await page.locator(".side-nav [data-view-target='vocabulary']").click();
  await page.locator("#view-vocabulary [data-view-target='grammar']").click();
  await page.locator("#grammar-topic-list [data-topic-id]").first().click();
  assert.equal(await page.locator("#view-grammar .grammar-layout").evaluate(el => el.classList.contains("is-detail-open")), true);
  await page.locator("#lesson-panel .lesson-answer").first().click();
  await page.locator("#lesson-panel .lesson-feedback").waitFor({state:"visible"});
  await page.locator("[data-grammar-back]").click();
  assert.equal(await page.locator("#view-grammar .grammar-layout").evaluate(el => el.classList.contains("is-detail-open")), false);
  await page.locator(".side-nav [data-view-target='overview']").click();
  assert.equal(await page.locator("#home-primary-label").innerText(), "Lanjutkan belajar",
    "a learner with saved activity should see the continue-learning CTA");

  await page.locator(".side-nav [data-view-target='reading']").click();
  assert.equal(await page.locator("#habit-library-section").isVisible(), true);
  assert.equal(await page.locator("#reading-skills-section").isVisible(), false);
  await page.waitForFunction(() => (document.querySelector("#habit-library-count")?.textContent || "").includes("156"));
  const firstHabit = page.locator("#habit-library-list [data-habit-open]").first();
  await firstHabit.click();
  assert.equal(await page.locator("#habit-library-section").evaluate(el => el.classList.contains("is-detail-open")), true);
  assert.equal(await page.locator("#habit-library-list").isVisible(), false);
  assert.equal(await page.locator("#habit-library-detail").isVisible(), true);
  const firstHabitId = await firstHabit.getAttribute("data-habit-open");
  await page.locator("#habit-library-detail [data-habit-back]").click();
  assert.equal(await page.locator("#habit-library-section").evaluate(el => el.classList.contains("is-detail-open")), false);
  assert.equal(await page.locator("#habit-library-list").isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.habitOpen), firstHabitId,
    "returning from HABIT detail should restore focus to its passage card");
  assert.equal(await page.locator("#reading-skills-section").isVisible(), false);
  const skillsTab = page.locator("#reading-mode-skills-tab");
  await skillsTab.press("ArrowLeft");
  assert.equal(await page.locator("#reading-mode-habit-tab").getAttribute("aria-selected"), "true");
  await skillsTab.click();
  assert.equal(await page.locator("#habit-library-section").isVisible(), false);
  assert.equal(await page.locator("#reading-skills-section").isVisible(), true);
  assert.equal(await page.locator("#reading-mode-skills-tab").getAttribute("aria-selected"), "true");
  const firstSkill = page.locator("#reading-skill-list [data-reading-skill]").first();
  await firstSkill.click();
  assert.equal(await page.locator("#reading-skills-section").evaluate(el => el.classList.contains("is-detail-open")), true);
  await page.locator("#reading-lesson [data-reading-back]").click();
  assert.equal(await page.locator("#reading-skills-section").evaluate(el => el.classList.contains("is-detail-open")), false);

  await page.locator(".side-nav [data-view-target='progress']").click();
  assert.equal(await page.locator("#progress-words-tried").count(), 1);
  assert.equal(await page.locator("#progress-grammar-tried").count(), 1);
  assert.equal(await page.locator("#progress-reading-tried").count(), 1);
  assert.equal(await page.locator(".progress-history-details").evaluate(el => el.open), false);
  assert.equal(await page.locator("#export-backup").isVisible(), true);

  await page.locator(".side-nav [data-view-target='overview']").click();
  await page.locator("#home-adventure-link").click();
  assert.equal(await page.locator("#view-adventure").isVisible(), true);
  assert.equal(await page.locator(".side-nav .side-link[aria-current='page']").getAttribute("data-view-target"), "overview");

  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `the workspace should not overflow horizontally at ${width}px`);
  }
  assert.deepEqual(pageErrors, [], "workspace navigation should not throw browser JavaScript errors");
  await page.close();
});

test("Skill Passport presents an honest empty state for a completely new learner", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("sinauu-local-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "new-user-token",
      refresh_token: "new-user-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "new-learner-user", email: "new@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='progress']").click();

  const passport = page.locator("#skill-passport-section");
  assert.equal(await passport.count(), 1, "Skill Passport section should exist in Progress");
  assert.equal(await passport.isVisible(), true, "Skill Passport should be visible");

  // Empty state in insight card
  const emptyState = page.locator("#passport-insight-card .passport-empty-state");
  assert.equal(await emptyState.count(), 1, "insight card should render the empty state for new learners");
  assert.match(await emptyState.innerText(), /Paspor Kemampuan masih menunggu/i);
  const emptyAction = emptyState.locator("button[data-passport-target='vocabulary']");
  assert.equal(await emptyAction.count(), 1, "empty state should guide the learner to vocabulary");

  // 7 skill cards
  const cards = page.locator("#passport-skills-grid .passport-skill-card");
  assert.equal(await cards.count(), 7, "Skill Passport should present exactly seven skills");

  const skillIds = await cards.evaluateAll((list) => list.map((el) => el.dataset.skillId));
  assert.deepEqual(skillIds, ["vocabulary", "grammar", "reading", "listening", "speaking", "writing", "pronunciation"]);

  for (let i = 0; i < 7; i++) {
    const card = cards.nth(i);
    const statusPill = card.locator(".passport-status-pill");
    assert.match(await statusPill.innerText(), /Belum dimulai/i);
    assert.equal(await statusPill.evaluate((el) => el.classList.contains("status-not-started")), true);
  }

  assert.deepEqual(pageErrors, [], "new learner progress should not throw JavaScript errors");
  await page.close();
});

test("Skill Passport reports evidence for learners with vocabulary and grammar history", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("sinauu-local-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "vocab-grammar-token",
      refresh_token: "vocab-grammar-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "vocab-grammar-user", email: "vg@example.com" },
    }));

    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "word-1": { attempts: [{ mode: "learn", at: new Date().toISOString() }], studiedDates: [new Date().toISOString().slice(0, 10)], reviewHistory: [{ correct: true, at: new Date().toISOString() }] },
        "word-2": { attempts: [{ mode: "learn", at: new Date().toISOString() }], studiedDates: [new Date().toISOString().slice(0, 10)], reviewHistory: [{ correct: true, at: new Date().toISOString() }] },
        "word-3": { attempts: [{ mode: "learn", at: new Date().toISOString() }], studiedDates: [new Date().toISOString().slice(0, 10)] }
      },
      grammarProgress: {
        "present-simple": { attempts: 4, correct: 3, answers: { "q1": { correct: true, at: new Date().toISOString() } } },
        "past-simple": { attempts: 2, correct: 2, answers: { "q2": { correct: true, at: new Date().toISOString() } } }
      },
      history: [
        { type: "vocabulary", title: "Word 1", at: new Date().toISOString() },
        { type: "grammar", title: "Present Simple", at: new Date().toISOString() }
      ],
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify(state));

    await new Promise((resolve, reject) => {
      const request = indexedDB.open("sinauu-local-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("state")) request.result.createObjectStore("state", { keyPath: "key" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("state", "readwrite");
        transaction.objectStore("state").put({ key: "main", value: state });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    });
  });

  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='progress']").click();

  const vocabCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='vocabulary']");
  assert.equal(await vocabCard.count(), 1);
  const vocabText = await vocabCard.innerText();
  assert.match(vocabText, /3 kata dipelajari/);
  assert.match(vocabText, /100%/); // review accuracy

  const grammarCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='grammar']");
  assert.equal(await grammarCard.count(), 1);
  const grammarText = await grammarCard.innerText();
  assert.match(grammarText, /2 topik dicoba/);
  assert.match(grammarText, /83%|84%/); // 5/6 = 83%

  // The other 5 skills should be Not started
  for (const skillId of ["reading", "listening", "speaking", "writing", "pronunciation"]) {
    const card = page.locator(`#passport-skills-grid .passport-skill-card[data-skill-id='${skillId}']`);
    const statusPill = card.locator(".passport-status-pill");
    assert.match(await statusPill.innerText(), /Belum dimulai/i);
  }

  // Insight card should compare active skills honestly
  const insightCard = page.locator("#passport-insight-card");
  assert.match(await insightCard.innerText(), /FOKUS TERBANYAK/i);
  assert.match(await insightCard.innerText(), /PERLU DILATIH/i);

  assert.deepEqual(pageErrors, [], "vocab/grammar progress should not throw JavaScript errors");
  await page.close();
});

test("Skill Passport aggregates evidence across all seven skills without fabricated metrics", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("sinauu-local-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "all-skills-token",
      refresh_token: "all-skills-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "all-skills-user", email: "allskills@example.com" },
    }));

    const now = new Date().toISOString();
    // 1 & 2: Core State (vocab + grammar)
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "apple": { attempts: [{ at: now }], studiedDates: [now.slice(0, 10)], reviewHistory: [{ correct: true, at: now }] },
        "book": { attempts: [{ at: now }], studiedDates: [now.slice(0, 10)], reviewHistory: [{ correct: false, at: now }] },
        "chair": { attempts: [{ at: now }], studiedDates: [now.slice(0, 10)], reviewHistory: [{ correct: true, at: now }] }
      },
      grammarProgress: {
        "present-simple": { attempts: 5, correct: 4, answers: { "q1": { correct: true, at: now } } }
      },
      history: [{ type: "vocabulary", title: "apple", at: now }],
      updatedAt: now
    };
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify(core));

    await new Promise((resolve, reject) => {
      const request = indexedDB.open("sinauu-local-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("state")) request.result.createObjectStore("state", { keyPath: "key" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("state", "readwrite");
        transaction.objectStore("state").put({ key: "main", value: core });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    });

    // 3: Extra Learning (matching + reading skills)
    const extraLearning = {
      matching: { rounds: 2, totalMatches: 12, totalMistakes: 3 },
      reading: {
        "main-idea": { attempts: 3, correct: 2, completed: true }
      }
    };
    localStorage.setItem("sinauu-extra-learning-v1", JSON.stringify(extraLearning));

    // 3: Habit Library
    const habitProgress = {
      "passage-1": {
        answers: {
          "q1": { selected: 0, correct: true, answeredAt: now },
          "q2": { selected: 1, correct: true, answeredAt: now },
          "q3": { selected: 2, correct: false, answeredAt: now }
        }
      }
    };
    localStorage.setItem("sinauu-habit-library-v1", JSON.stringify(habitProgress));

    // 4, 5, 6, 7: Adventure Progress (listening, speaking, writing, pronunciation)
    const adventureProgress = {
      schemaVersion: 1,
      storyProgress: {
        "first-day": { attempts: [{ attemptId: "a1", score: 2, total: 3, passed: true, completedAt: now }], bestScore: 2, completedAt: now }
      },
      listeningProgress: {
        "airport-arrival": { attempts: [{ attemptId: "l1", score: 3, total: 3, passed: true, completedAt: now }], bestScore: 3, completedAt: now }
      },
      dialogueProgress: {
        "cafe-order": { attempts: [{ attemptId: "d1", score: 2, total: 2, passed: true, completedAt: now }], bestScore: 2, completedAt: now }
      },
      pronunciationProgress: {
        "phrase-1": { attempts: [{ attemptId: "p1", completedAt: now, durationMs: 4200 }] },
        "phrase-2": { attempts: [{ attemptId: "p2", completedAt: now, durationMs: 3800 }] }
      },
      studioSessions: [
        { sessionId: "s-1", studioType: "speaking", promptId: "intro", wordCount: 45, checklistCompleted: 3, completedAt: now },
        { sessionId: "w-1", studioType: "writing", promptId: "email", wordCount: 88, checklistCompleted: 4, completedAt: now }
      ],
      skillEvidence: {},
      updatedAt: now
    };
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(adventureProgress));
  });

  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='progress']").click();

  const passport = page.locator("#skill-passport-section");
  assert.equal(await passport.isVisible(), true);

  // Check 7 cards are active
  const cards = page.locator("#passport-skills-grid .passport-skill-card");
  assert.equal(await cards.count(), 7);

  // Check Speaking card: NO invented score
  const speakingCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='speaking']");
  const speakingText = await speakingCard.innerText();
  assert.match(speakingText, /sesi berbicara selesai/);
  assert.match(speakingText, /Evaluasi refleksi mandiri, tanpa skor otomatis/);
  assert.match(speakingText, /3 kriteria checklist self-review terpenuhi/);

  // Check Writing card: NO invented score, reports actual words
  const writingCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='writing']");
  const writingText = await writingCard.innerText();
  assert.match(writingText, /1 sesi tulisan selesai/);
  assert.match(writingText, /88 kata disusun/);
  assert.match(writingText, /Evaluasi refleksi mandiri, tanpa skor otomatis/);

  // Check Pronunciation card: reports actual duration and phrases, NO automated percentage
  const pronCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='pronunciation']");
  const pronText = await pronCard.innerText();
  assert.match(pronText, /2 frasa dipraktikkan/);
  assert.match(pronText, /8 detik total rekaman/);
  assert.match(pronText, /Analisis audio lokal, tanpa skor persentase otomatis/);

  // Check Listening card: reports Listening Lab score
  const listeningCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='listening']");
  const listeningText = await listeningCard.innerText();
  assert.match(listeningText, /100%/);
  assert.match(listeningText, /1 latihan audio selesai/);

  // Check Reading card: reports completed reading activities
  const readingCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='reading']");
  const readingText = await readingCard.innerText();
  assert.match(readingText, /3 aktivitas bacaan selesai/); // skill + habit + story
  assert.match(readingText, /pemahaman teks/);

  // Check Insight card
  const insightCard = page.locator("#passport-insight-card");
  assert.match(await insightCard.innerText(), /FOKUS TERBANYAK/i);
  assert.match(await insightCard.innerText(), /PERLU DILATIH/i);
  assert.match(await insightCard.innerText(), /LANGKAH BERIKUTNYA/i);

  // Test action navigation from a card
  await readingCard.locator(".passport-card-action").click();
  assert.equal(await page.locator("#view-reading").isVisible(), true, "clicking card action should navigate to the module");

  // Return to progress and check responsive layout
  await page.locator(".side-nav [data-view-target='progress']").click();
  for (const width of [360, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `Skill Passport should not overflow horizontally at ${width}px`);
  }

  assert.deepEqual(pageErrors, [], "all-skills progress should not throw JavaScript errors");
  await page.close();
});

test("Skill Passport safely handles malformed and older legacy schema records", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("sinauu-local-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "corrupt-test-token",
      refresh_token: "corrupt-test-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "corrupt-user", email: "corrupt@example.com" },
    }));

    // Corrupted state entries
    const corruptCore = {
      schemaVersion: 1,
      settings: { theme: "light" },
      wordProgress: {
        "broken-1": null,
        "broken-2": "invalid-string",
        "broken-3": { attempts: "not-an-array", reviewHistory: null }
      },
      grammarProgress: {
        "broken-topic": null
      },
      history: [null, undefined, { type: null }]
    };
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify(corruptCore));

    const corruptAdventure = {
      schemaVersion: 1,
      pronunciationProgress: { "p1": { attempts: [{ durationMs: "not-a-number", completedAt: null }] } },
      studioSessions: [null, { studioType: "speaking", checklistCompleted: "NaN" }]
    };
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(corruptAdventure));
  });

  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='progress']").click();

  const cards = page.locator("#passport-skills-grid .passport-skill-card");
  assert.equal(await cards.count(), 7, "passport should render 7 cards despite corrupted records");

  const passportData = await page.evaluate(() => window.sinauuGetSkillPassport?.());
  assert.ok(passportData, "aggregation layer should return valid data structure");
  assert.equal(passportData.skills.length, 7);

  assert.deepEqual(pageErrors, [], "corrupt records should be sanitized without throwing JavaScript errors");
  await page.close();
});

test("Skill Passport updates dynamically upon CloudBundle v2 restore", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("sinauu-local-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "restore-test-token",
      refresh_token: "restore-test-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "restore-user", email: "restore@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='progress']").click();

  // Initially empty
  const emptyAction = page.locator("#passport-insight-card .passport-empty-state");
  assert.equal(await emptyAction.count(), 1);

  // Restore CloudBundle v2 with cross-device data
  await page.evaluate(async () => {
    const now = new Date().toISOString();
    const bundle = {
      schemaVersion: 2,
      core: {
        schemaVersion: 1,
        settings: { theme: "light", dailyGoal: 10 },
        wordProgress: {
          "restored-word": { attempts: [{ at: now }], studiedDates: [now.slice(0, 10)], reviewHistory: [{ correct: true, at: now }] }
        },
        grammarProgress: {
          "topic-alpha": { attempts: 3, correct: 3, answers: { "q1": { correct: true, at: now } } }
        },
        history: [],
        updatedAt: now
      },
      extras: {
        extraLearning: {
          matching: { rounds: 1, totalMatches: 6, totalMistakes: 1 }
        },
        habitProgress: {},
        adventureProgress: {
          schemaVersion: 1,
          studioSessions: [
            { sessionId: "s-restored", studioType: "speaking", promptId: "greeting", wordCount: 25, checklistCompleted: 3, completedAt: now }
          ]
        }
      }
    };
    await window.sinauuApplyCloudBundle(bundle);
  });

  // Re-verify that Skill Passport updated
  const vocabCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='vocabulary']");
  assert.match(await vocabCard.innerText(), /1 kata dipelajari/);

  const speakingCard = page.locator("#passport-skills-grid .passport-skill-card[data-skill-id='speaking']");
  assert.match(await speakingCard.innerText(), /1 sesi berbicara selesai/);

  const insight = page.locator("#passport-insight-card");
  assert.equal(await insight.locator(".passport-empty-state").count(), 0, "empty state should be replaced once bundle is applied");
  assert.match(await insight.innerText(), /FOKUS TERBANYAK/i);

  assert.deepEqual(pageErrors, [], "cloud bundle restore should not throw JavaScript errors");
  await page.close();
});

test("Adaptive study plan recommends balanced beginner activities for a brand-new learner", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("sinauu-local-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "new-learner-token",
      refresh_token: "new-learner-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "new-learner", email: "new@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  assert.equal(await page.locator("#home-study-plan-count").innerText(), "0/3");
  const steps = page.locator("#home-study-plan-steps .home-study-plan-step");
  assert.equal(await steps.count(), 3);

  // Step 1: Vocabulary foundation
  const step0 = steps.nth(0);
  assert.match(await step0.locator("h3").innerText(), /Pelajari kata/i);
  assert.match(await step0.locator(".home-study-plan-step-meta").innerText(), /01 · INGAT KEMBALI/);
  assert.equal(await step0.locator("[data-plan-vocabulary]").count(), 1);

  // Step 2: Grammar foundation
  const step1 = steps.nth(1);
  assert.match(await step1.locator(".home-study-plan-step-meta").innerText(), /02 · PAHAMI POLA/);
  assert.match(await step1.locator("h3").innerText(), /Present simple/i);
  assert.equal(await step1.locator("[data-plan-topic]").count(), 1);

  // Step 3: Adventure Daily Quest
  const step2 = steps.nth(2);
  assert.match(await step2.locator(".home-study-plan-step-meta").innerText(), /03 · GUNAKAN BAHASA/);
  assert.match(await step2.locator("h3").innerText(), /Daily Quest/i);
  assert.equal(await step2.locator("[data-plan-adventure]").count(), 1);

  assert.deepEqual(pageErrors, [], "new learner adaptive study plan should not throw errors");
  await page.close();
});

test("Adaptive study plan prioritizes overdue vocabulary review with transparent spaced repetition explanation", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    const overdueTime = new Date(now.getTime() - 3600000).toISOString();
    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-1" }],
          skillEvidence: { recall: true, context: true, production: true },
          firstSeenDate: yesterday,
          studiedDates: [yesterday],
          nextReviewAt: overdueTime,
          reviewSuccesses: 1,
          reviewDates: [yesterday],
          reviewHistory: [{ date: yesterday, at: overdueTime, correct: true }],
          weak: false,
        }
      },
      grammarProgress: {},
      favorites: [],
      events: [],
      history: [{
        id: "hist-1",
        date: yesterday,
        at: overdueTime,
        type: "vocabulary",
        title: "hello",
        wordId: "a1-hello",
        mode: "review"
      }],
      updatedAt: overdueTime
    };
    await new Promise((resolve) => {
      const req = indexedDB.open("sinauu-local-v1", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("state", { keyPath: "key" });
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put({ key: "main", value: state });
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "overdue-token",
      refresh_token: "overdue-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "overdue-user", email: "overdue@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  const step0 = page.locator("#home-study-plan-steps .home-study-plan-step").nth(0);
  assert.equal(await step0.locator("h3").innerText(), "Ingat kembali · hello");
  assert.match(await step0.locator("p").innerText(), /jadwal|waktunya diulang/i);
  assert.match(await step0.locator("[data-plan-vocabulary]").innerText(), /Mulai review/i);

  // Clicking review opens study container in review mode
  await step0.locator("[data-plan-vocabulary]").click();
  await page.locator("#study-container h1").waitFor({ state: "visible" });
  assert.deepEqual(pageErrors, [], "overdue review action should open study container without errors");
  await page.close();
});

test("Adaptive study plan prioritizes repeated grammar mistakes with conservative evidence thresholds", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    const now = new Date().toISOString();
    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {},
      grammarProgress: {
        "past-simple": {
          attempts: 6,
          correct: 1,
          answers: {
            "past-simple-q1": { correct: false, at: now },
            "past-simple-q2": { correct: false, at: now }
          },
          history: []
        },
        // Single attempt with wrong answer: should NOT be prioritized due to conservative threshold
        "present-continuous": {
          attempts: 1,
          correct: 0,
          answers: {
            "present-continuous-q1": { correct: false, at: now }
          },
          history: []
        }
      },
      favorites: [],
      events: [],
      history: [],
      updatedAt: now
    };
    await new Promise((resolve) => {
      const req = indexedDB.open("sinauu-local-v1", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("state", { keyPath: "key" });
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put({ key: "main", value: state });
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "grammar-mistakes-token",
      refresh_token: "grammar-mistakes-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "grammar-user", email: "grammar@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  const grammarStep = page.locator("#home-study-plan-steps .home-study-plan-step").nth(1);
  assert.match(await grammarStep.locator("h3").innerText(), /Past simple/i);
  assert.equal(await grammarStep.locator("[data-plan-topic]").getAttribute("data-plan-topic"), "past-simple");
  const desc = await grammarStep.locator("p").innerText();
  assert.match(desc, /Akurasi sebelumnya 17%/);
  assert.match(desc, /kesulitan|kesalahan/i);

  await grammarStep.locator("[data-plan-topic]").click();
  await page.locator("#view-grammar.is-visible").waitFor({ state: "visible" });
  assert.match(await page.locator("#lesson-panel").innerText(), /Past simple/i);

  assert.deepEqual(pageErrors, [], "grammar mistake plan should navigate smoothly without errors");
  await page.close();
});

test("Adaptive study plan adapts to recommend reading when vocabulary activity is strong but reading practice is scarce", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    const now = new Date().toISOString();
    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-world": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-friend": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-family": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-school": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-water": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-happy": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] },
        "a1-learn": { attempts: [{ at: now }], studiedDates: ["2026-11-01"] }
      },
      grammarProgress: {
        "present-simple": { attempts: 4, correct: 4, answers: {} }
      },
      favorites: [],
      events: [],
      history: [],
      updatedAt: now
    };
    await new Promise((resolve) => {
      const req = indexedDB.open("sinauu-local-v1", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("state", { keyPath: "key" });
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put({ key: "main", value: state });
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "reading-adapt-token",
      refresh_token: "reading-adapt-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "reading-user", email: "reading@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  // Step 2 should adapt to reading!
  const step1 = page.locator("#home-study-plan-steps .home-study-plan-step").nth(1);
  assert.match(await step1.locator(".home-study-plan-step-meta").innerText(), /LATIH PEMAHAMAN TEKS/);
  assert.match(await step1.locator("h3").innerText(), /Everyday Stories|Latihan bacaan/i);
  assert.match(await step1.locator("p").innerText(), /Kosakatamu berkembang aktif/i);

  const actionBtn = step1.locator("[data-plan-adventure-section='adventure-story-library']");
  assert.equal(await actionBtn.count(), 1);
  await actionBtn.click();
  await page.locator("#view-adventure.is-visible").waitFor({ state: "visible" });
  await page.locator("#adventure-story-library").waitFor({ state: "visible" });

  assert.deepEqual(pageErrors, [], "reading recommendation should navigate smoothly without errors");
  await page.close();
});

test("Adaptive study plan provides gentle re-engagement messaging for returning learners after absence", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    const tenDaysAgoDate = tenDaysAgo.slice(0, 10);
    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ at: tenDaysAgo }],
          skillEvidence: { recall: true, context: true, production: true },
          firstSeenDate: tenDaysAgoDate,
          studiedDates: [tenDaysAgoDate],
          nextReviewAt: tenDaysAgo,
          reviewSuccesses: 1,
          reviewDates: [tenDaysAgoDate],
          reviewHistory: [{ date: tenDaysAgoDate, at: tenDaysAgo, correct: true }]
        }
      },
      grammarProgress: {},
      favorites: [],
      events: [],
      history: [{
        id: "old-hist",
        date: tenDaysAgoDate,
        at: tenDaysAgo,
        type: "vocabulary",
        title: "hello",
        wordId: "a1-hello",
        mode: "learn"
      }],
      updatedAt: tenDaysAgo
    };
    await new Promise((resolve) => {
      const req = indexedDB.open("sinauu-local-v1", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("state", { keyPath: "key" });
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put({ key: "main", value: state });
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "returning-token",
      refresh_token: "returning-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "returning-user", email: "returning@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  const step0 = page.locator("#home-study-plan-steps .home-study-plan-step").nth(0);
  assert.match(await step0.locator("p").innerText(), /Selamat datang kembali!/i);

  assert.deepEqual(pageErrors, [], "returning learner plan should not throw errors");
  await page.close();
});

test("Adaptive study plan preserves task continuity, marks completed steps, and maintains deterministic state on reload", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const nowIso = now.toISOString();
    const state = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ at: nowIso }],
          skillEvidence: { recall: true, context: true, production: true },
          firstSeenDate: today,
          studiedDates: [today],
          nextReviewAt: new Date(now.getTime() + 86400000).toISOString(),
          reviewSuccesses: 1,
          reviewDates: [today],
          reviewHistory: [{ date: today, at: nowIso, correct: true }]
        }
      },
      grammarProgress: {},
      favorites: [],
      events: [],
      history: [{
        id: "today-vocab-review",
        date: today,
        at: nowIso,
        type: "vocabulary",
        title: "hello",
        wordId: "a1-hello",
        mode: "review",
        correct: true
      }],
      updatedAt: nowIso
    };
    await new Promise((resolve) => {
      const req = indexedDB.open("sinauu-local-v1", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("state", { keyPath: "key" });
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put({ key: "main", value: state });
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "reload-token",
      refresh_token: "reload-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "reload-user", email: "reload@example.com" },
    }));
  });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  assert.equal(await page.locator("#home-study-plan-count").innerText(), "1/3");
  const step0FirstLoad = await page.locator("#home-study-plan-steps .home-study-plan-step").nth(0).locator("h3").innerText();
  const step1FirstLoad = await page.locator("#home-study-plan-steps .home-study-plan-step").nth(1).locator("h3").innerText();
  const step2FirstLoad = await page.locator("#home-study-plan-steps .home-study-plan-step").nth(2).locator("h3").innerText();

  // Reload page to verify stability and determinism
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.waitForFunction(() => document.querySelector("#home-study-plan-steps .home-study-plan-step"));

  assert.equal(await page.locator("#home-study-plan-count").innerText(), "1/3");
  const step0SecondLoad = await page.locator("#home-study-plan-steps .home-study-plan-step").nth(0).locator("h3").innerText();
  const step1SecondLoad = await page.locator("#home-study-plan-steps .home-study-plan-step").nth(1).locator("h3").innerText();
  const step2SecondLoad = await page.locator("#home-study-plan-steps .home-study-plan-step").nth(2).locator("h3").innerText();

  assert.equal(step0FirstLoad, step0SecondLoad, "step 1 should be identical on reload");
  assert.equal(step1FirstLoad, step1SecondLoad, "step 2 should be identical on reload");
  assert.equal(step2FirstLoad, step2SecondLoad, "step 3 should be identical on reload");

  // Verify completed step styling
  const step0 = page.locator("#home-study-plan-steps .home-study-plan-step").nth(0);
  assert.match(await step0.getAttribute("class"), /is-complete/);
  assert.match(await step0.locator("button").innerText(), /Selesai ✓/);
  assert.ok(await step0.locator("button").isDisabled());

  assert.deepEqual(pageErrors, [], "plan reload should maintain stability without errors");
  await page.close();
});

test("Universal Mistake Journal maps grammar, vocab, and habit reading mistakes with retry, filters, and honest module handling", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  const now = new Date().toISOString();
  await page.addInitScript(() => {
    const timestamp = new Date().toISOString();
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "universal-mistake-access",
      refresh_token: "universal-mistake-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "universal-mistake-user", email: "mistake@example.com" },
    }));

    // 1. Core State with Grammar mistake and Vocab mistake
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-1", wordId: "a1-hello", skill: "recall", correct: false, response: "selamat tinggal", at: timestamp }],
          studiedDates: [timestamp.slice(0, 10)],
          reviewHistory: [],
          weak: true
        }
      },
      grammarProgress: {
        "present-simple": {
          attempts: 2,
          correct: 1,
          answers: {
            "ps-1": { correct: false, response: "walks", at: timestamp }
          },
          history: [{ questionId: "ps-1", correct: false, at: timestamp }]
        }
      },
      events: [
        { id: "ev-1", wordId: "a1-hello", word: "hello", skill: "recall", correct: false, response: "selamat tinggal", questionId: "typed-meaning", at: timestamp }
      ],
      history: [
        { type: "grammar", title: "Present Simple", detail: "Soal: ps-1", correct: false, topicId: "present-simple", questionId: "ps-1" },
        { type: "vocabulary", title: "hello", detail: "Recall arti • perlu dilatih", correct: false, wordId: "a1-hello" }
      ],
      updatedAt: timestamp
    };
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify(core));

    // 2. Extra Learning & HABIT Reading with a mistake
    const habitProgress = {
      "habit-passage-1": {
        answers: {
          "habit-passage-1-detail-1": { selected: 1, correct: false, answeredAt: timestamp }
        }
      }
    };
    localStorage.setItem("sinauu-habit-library-v1", JSON.stringify(habitProgress));

    // 3. Adventure with existing adventure mistake and modules without question-level evidence
    const adventureProgress = {
      schemaVersion: 1,
      mistakeJournal: {
        "adv-mistake-1": {
          mistakeId: "adv-mistake-1",
          sourceType: "mission",
          sourceId: "meet-your-new-neighbors",
          missionId: "meet-your-new-neighbors",
          stepId: "word-neighbor",
          skill: "vocabulary",
          prompt: "Which word describes someone who lives next door to you?",
          wrongAnswer: "A passenger",
          correctAnswer: "A neighbor",
          explanation: "A neighbor lives near you.",
          recordedAt: timestamp,
          resolvedAt: null,
          status: "open",
          reviewStage: 0,
          nextReviewAt: timestamp,
          reviewHistory: []
        }
      },
      // Modules with only aggregate stats
      storyProgress: {
        "first-day": { attempts: [{ attemptId: "s1", score: 2, total: 3, passed: true, completedAt: timestamp }], bestScore: 2, completedAt: timestamp }
      },
      listeningProgress: {
        "airport-arrival": { attempts: [{ attemptId: "l1", score: 2, total: 3, passed: true, completedAt: timestamp }], bestScore: 2, completedAt: timestamp }
      },
      studioSessions: [
        { sessionId: "spk-1", studioType: "speaking", promptId: "intro", wordCount: 40, checklistCompleted: 3, completedAt: timestamp },
        { sessionId: "wrt-1", studioType: "writing", promptId: "email", wordCount: 65, checklistCompleted: 3, completedAt: timestamp }
      ],
      pronunciationProgress: {
        "phrase-1": { attempts: [{ attemptId: "pr-1", completedAt: timestamp, durationMs: 3400 }] }
      },
      updatedAt: timestamp
    };
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(adventureProgress));
  });

  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  // Navigate to Adventure tab
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-mistake-journal").waitFor({ state: "visible" });

  // 1. Verify rows exist for grammar, vocab, habit, and adventure
  const rows = page.locator("#adventure-mistake-journal .adventure-mistake-row");
  const rowCount = await rows.count();
  assert.ok(rowCount >= 4, `expected at least 4 mistakes (adventure, grammar, habit, vocab), found ${rowCount}`);

  // Check that modules without question-level evidence do NOT create fake mistake rows
  const journalText = await page.locator("#adventure-mistake-journal").innerText();
  assert.ok(!journalText.includes("first-day"), "Everyday Stories without question-level mistake evidence must not appear in Mistake Journal");
  assert.ok(!journalText.includes("airport-arrival"), "Listening Lab without question-level mistake evidence must not appear in Mistake Journal");

  // 2. Skill filtering: Grammar filter
  await page.locator('[data-mistake-skill-filter="grammar"]').click();
  const grammarRows = page.locator("#adventure-mistake-journal .adventure-mistake-row");
  assert.equal(await grammarRows.count(), 1, "grammar skill filter should show exactly 1 grammar mistake");
  assert.match(await grammarRows.first().innerText(), /grammar/i);
  assert.match(await grammarRows.first().innerText(), /present-simple|Present simple|grammar-article|Soal grammar/i);

  // 3. Context Reopen Action for Grammar
  const grammarReopen = grammarRows.first().locator("[data-open-grammar-topic]");
  assert.ok(await grammarReopen.isVisible(), "grammar mistake row must have an action to reopen grammar topic");
  await grammarReopen.click();
  // Expect view to switch to grammar lesson
  await page.waitForFunction(() => document.querySelector("#view-grammar") && !document.querySelector("#view-grammar").hidden);
  assert.match(await page.locator("#lesson-panel h2").innerText(), /Present simple/i);

  // 4. Return to Adventure & test Vocab filter and Reopen Action
  await page.locator('.side-link[data-view-target="overview"]').click();
  await page.locator('#home-adventure-link').click();
  await page.locator('[data-mistake-skill-filter="vocabulary"]').click();
  const vocabRows = page.locator("#adventure-mistake-journal .adventure-mistake-row");
  assert.ok((await vocabRows.count()) >= 1, "vocabulary skill filter should show vocabulary mistakes");
  const vocabReopen = page.locator("#adventure-mistake-journal [data-open-vocab-word='a1-hello']");
  if (await vocabReopen.isVisible()) {
    await vocabReopen.click();
    await page.waitForFunction(() => document.querySelector("#view-vocabulary") && !document.querySelector("#view-vocabulary").hidden);
    assert.match(await page.locator("#word-detail").innerText(), /hello/i);
    await page.locator('.side-link[data-view-target="overview"]').click();
    await page.locator('#home-adventure-link').click();
  }

  // 5. Test targeted retry on a due mistake
  await page.locator('[data-mistake-skill-filter="all"]').click();
  await page.locator('[data-mistake-filter="all"]').click();
  const retryBtn = page.locator("#adventure-mistake-journal [data-mistake-review-one]").first();
  await retryBtn.waitFor({ state: "visible" });
  await retryBtn.click();

  const reviewPanel = page.locator("#adventure-mistake-journal .adventure-mistake-review");
  await reviewPanel.waitFor({ state: "visible" });
  assert.match(await reviewPanel.innerText(), /SPACED RETRIEVAL/i);

  // Close review panel
  await page.locator("[data-mistake-review-close]").click();

  // 6. Deduplication: repeated sync should not create duplicate entries
  await page.evaluate(() => {
    if (typeof window.sinauuSyncMistakes === "function") {
      window.sinauuSyncMistakes();
      window.sinauuSyncMistakes();
    }
  });
  const afterRepeatedSyncCount = await page.locator("#adventure-mistake-journal .adventure-mistake-row").count();
  assert.equal(afterRepeatedSyncCount, rowCount, "repeated sync calls must not duplicate entries");

  assert.deepEqual(pageErrors, [], "Universal Mistake Journal should operate without console errors");
  await page.close();
});

test("Universal Mistake Journal handles malformed legacy records, mobile viewports, and targeted recall retention across reloads", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    const now = new Date().toISOString();
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "robust-journal-access",
      refresh_token: "robust-journal-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "robust-journal-user", email: "robust@example.com" },
    }));

    // Seed malformed and older legacy records
    const adventureProgress = {
      schemaVersion: 1,
      mistakeJournal: {
        "legacy-incomplete": {
          mistakeId: "legacy-incomplete",
          sourceType: "mission",
          recordedAt: "invalid-date",
        },
        "grammar-due-item": {
          mistakeId: "grammar:present-simple:ps-1",
          sourceType: "grammar",
          sourceId: "present-simple",
          topicId: "present-simple",
          questionId: "ps-1",
          skill: "grammar",
          prompt: "Choose the correct sentence.",
          wrongAnswer: "He walk to class every day.",
          correctAnswer: "He walks to class every day.",
          explanation: "He adalah subjek orang ketiga tunggal, jadi kata kerja positif memakai -s: walks.",
          recordedAt: new Date(Date.now() - 86400000).toISOString(),
          resolvedAt: null,
          status: "open",
          reviewStage: 0,
          nextReviewAt: new Date(Date.now() - 3600000).toISOString(),
          reviewHistory: []
        }
      },
      updatedAt: now
    };
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(adventureProgress));
  });

  // Test mobile viewport (360x640)
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(baseUrl + "/belajar.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  await page.locator('[data-view-target="adventure"]').click();
  await page.locator("#adventure-mistake-journal").waitFor({ state: "visible" });

  // 1. Verify malformed records did not crash rendering
  assert.ok(await page.locator("#adventure-mistake-journal").isVisible());
  const measurements = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    journalWidth: document.querySelector("#adventure-mistake-journal")?.getBoundingClientRect().width || 0,
  }));
  assert.ok(measurements.scrollWidth <= measurements.viewport + 1, "journal must not cause horizontal viewport overflow on 360px mobile");

  // 2. Perform targeted review on the grammar due item
  const retryBtn = page.locator("#adventure-mistake-journal [data-mistake-review-one]").first();
  await retryBtn.waitFor({ state: "visible" });
  await retryBtn.click();

  const reviewPanel = page.locator("#adventure-mistake-journal .adventure-mistake-review");
  await reviewPanel.waitFor({ state: "visible" });
  assert.equal(await reviewPanel.locator("[data-mistake-answer]").count(), 3);

  // Pick wrong option first
  await reviewPanel.locator('[data-mistake-answer="0"]').click();
  assert.match(await reviewPanel.innerText(), /Belum tepat/i);

  // Pick correct option (option 1: "He walks to class every day.")
  await reviewPanel.locator('[data-mistake-answer="1"]').click();
  assert.match(await reviewPanel.innerText(), /Review 1\/4 berhasil/i);

  // 3. Close panel and verify status updated to reviewing
  await page.locator("[data-mistake-review-close]").click();
  await page.locator('[data-mistake-filter="reviewing"]').click();
  assert.equal(await page.locator("#adventure-mistake-journal .adventure-mistake-row.is-reviewing").count(), 1);

  // 4. Reload page and verify spaced review stage survives
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="adventure"]').click();
  await page.locator('[data-mistake-filter="reviewing"]').click();
  const reloadedReviewingRow = page.locator("#adventure-mistake-journal .adventure-mistake-row.is-reviewing");
  assert.equal(await reloadedReviewingRow.count(), 1, "reviewStage 1 must persist across page reload");
  assert.match(await reloadedReviewingRow.first().innerText(), /REVIEW 1 \/ 4/i);

  assert.deepEqual(pageErrors, [], "Universal Mistake Journal must not throw errors during mobile rendering and Spaced Retrieval");
  await page.close();
});

test("Unified Review Queue aggregates overdue vocabulary, due today vocabulary, and spaced mistake journal items with honest empty states", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  // 1. Test clean / empty learner state
  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "review-queue-access",
      refresh_token: "review-queue-refresh",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "review-queue-user", email: "review@example.com" },
    }));
  });

  await page.goto(`${baseUrl}/belajar.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  // Navigate to Review view
  await page.locator('[data-view-target="review"]').click();
  const reviewView = page.locator("#view-review");
  await reviewView.waitFor({ state: "visible" });

  // In empty state, review list displays honest empty message and metric totals are 0
  assert.equal(await page.locator("#review-due-total").innerText(), "0");
  assert.equal(await page.locator("#review-success-total").innerText(), "0");
  assert.match(await page.locator("#review-list").innerText(), /Belum ada review yang jatuh tempo/i);

  // 2. Populate records with overdue vocab, due today vocab, weak word, and due grammar mistake via CloudBundle apply
  const now = Date.now();
  const overdueIso = new Date(now - 3 * 86400000).toISOString();
  const todayDueIso = new Date(now - 2 * 3600000).toISOString();
  const timestamp = new Date(now).toISOString();

  await page.evaluate(({ overdueIso, todayDueIso, timestamp }) => {
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-hello", at: overdueIso, correct: true }],
          nextReviewAt: overdueIso,
          reviewSuccesses: 1,
          reviewDates: ["2026-10-28"],
          reviewHistory: [{ date: "2026-10-28", at: overdueIso, correct: true }],
          weak: false,
          skillEvidence: { recall: true, context: true, production: false }
        },
        "a1-usually": {
          attempts: [{ id: "att-usually", at: todayDueIso, correct: true }],
          nextReviewAt: todayDueIso,
          reviewSuccesses: 0,
          reviewDates: [],
          reviewHistory: [],
          weak: false,
          skillEvidence: { recall: true, context: false, production: false }
        },
        "a1-enough": {
          attempts: [{ id: "att-enough", at: timestamp, correct: false }],
          nextReviewAt: null,
          reviewSuccesses: 0,
          reviewDates: [],
          reviewHistory: [],
          weak: true,
          skillEvidence: { recall: false, context: false, production: false }
        }
      },
      grammarProgress: {},
      events: [],
      history: [],
      updatedAt: timestamp
    };

    const adventure = {
      schemaVersion: 1,
      mistakeJournal: {
        "grammar:present-simple:ps-1": {
          mistakeId: "grammar:present-simple:ps-1",
          sourceType: "grammar",
          topicId: "present-simple",
          stepId: "ps-1",
          skill: "Grammar",
          level: "A1",
          prompt: "Pilih kalimat yang menggunakan present simple dengan benar.",
          wrongAnswer: "walks",
          correctAnswer: "He walks to class every day.",
          explanation: "Subjek tunggal membutuhkan kata kerja berakhiran -s.",
          recordedAt: overdueIso,
          resolvedAt: overdueIso,
          nextReviewAt: overdueIso,
          reviewStage: 1,
          reviewHistory: [{ reviewedAt: overdueIso, correct: true, stage: 1 }]
        }
      },
      updatedAt: timestamp
    };
    window.sinauuApplyCloudBundle({ core, extras: { adventureProgress: adventure } });
  }, { overdueIso, todayDueIso, timestamp });

  await page.locator('[data-view-target="review"]').click();
  await reviewView.waitFor({ state: "visible" });

  // 3. Verify aggregated metric cards
  // Total due = 2 overdue (hello + grammar mistake) + 1 today (usually) = 3
  assert.equal(await page.locator("#review-due-total").innerText(), "3");
  assert.equal(await page.locator("#review-overdue-total").innerText(), "2");
  assert.equal(await page.locator("#review-today-total").innerText(), "1");
  assert.equal(await page.locator("#review-practice-total").innerText(), "1");
  assert.equal(await page.locator("#nav-review-count").innerText(), "3");

  assert.deepEqual(pageErrors, [], "Unified Review Queue empty state and metric counters must load without errors");
  await page.close();
});

test("Unified Review Queue provides deterministic prioritization, manageable focused session, category and skill filtering, and transparent explanations", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  const now = Date.now();
  const overdueIso = new Date(now - 4 * 86400000).toISOString();
  const todayDueIso = new Date(now - 1 * 3600000).toISOString();
  const timestamp = new Date(now).toISOString();

  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "review-queue-access-2",
      refresh_token: "review-queue-refresh-2",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "review-queue-user-2", email: "review2@example.com" },
    }));
  });

  await page.goto(`${baseUrl}/belajar.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  await page.evaluate(({ overdueIso, todayDueIso, timestamp }) => {
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-hello-2", at: overdueIso, correct: true }],
          nextReviewAt: overdueIso,
          reviewSuccesses: 1,
          reviewDates: ["2026-10-27"],
          reviewHistory: [{ date: "2026-10-27", at: overdueIso, correct: true }],
          weak: false,
          skillEvidence: { recall: true, context: true, production: false }
        },
        "a1-usually": {
          attempts: [{ id: "att-usually-2", at: todayDueIso, correct: true }],
          nextReviewAt: todayDueIso,
          reviewSuccesses: 0,
          reviewDates: [],
          reviewHistory: [],
          weak: false,
          skillEvidence: { recall: true, context: false, production: false }
        },
        "a1-enough": {
          attempts: [{ id: "att-enough-2", at: timestamp, correct: false }],
          nextReviewAt: null,
          reviewSuccesses: 0,
          reviewDates: [],
          reviewHistory: [],
          weak: true,
          skillEvidence: { recall: false, context: false, production: false }
        }
      },
      grammarProgress: {},
      events: [],
      history: [],
      updatedAt: timestamp
    };

    const adventure = {
      schemaVersion: 1,
      mistakeJournal: {
        "grammar:present-simple:ps-1": {
          mistakeId: "grammar:present-simple:ps-1",
          sourceType: "grammar",
          topicId: "present-simple",
          stepId: "ps-1",
          skill: "Grammar",
          level: "A1",
          prompt: "Pilih kalimat yang menggunakan present simple dengan benar.",
          wrongAnswer: "walks",
          correctAnswer: "He walks to class every day.",
          explanation: "Subjek tunggal membutuhkan kata kerja berakhiran -s.",
          recordedAt: overdueIso,
          resolvedAt: overdueIso,
          nextReviewAt: overdueIso,
          reviewStage: 1,
          reviewHistory: [{ reviewedAt: overdueIso, correct: true, stage: 1 }]
        }
      },
      updatedAt: timestamp
    };
    window.sinauuApplyCloudBundle({ core, extras: { adventureProgress: adventure } });
  }, { overdueIso, todayDueIso, timestamp });

  await page.locator('[data-view-target="review"]').click();

  // 1. Focused session card is displayed with capped items
  const focusCard = page.locator("#review-focus-card");
  await focusCard.waitFor({ state: "visible" });
  assert.match(await focusCard.locator("#review-focus-title").innerText(), /Materi Prioritas/i);
  assert.ok(await focusCard.locator("#review-focus-pills .review-focus-pill").count() >= 2);

  // 2. Check cards in active queue
  const queueCards = page.locator("#review-list .review-queue-card");
  assert.equal(await queueCards.count(), 3, "default 'due' tab shows overdue and due today items");

  // The first cards must be overdue (deterministic prioritization)
  assert.ok(await queueCards.nth(0).evaluate(el => el.classList.contains("is-overdue")), "first card should be overdue");

  // Verify the 3 key questions are answered on each card:
  const firstCard = queueCards.first();
  assert.ok(await firstCard.locator(".review-card-title").isVisible(), "must answer: what to review");
  assert.ok(await firstCard.locator(".review-qa-reason .review-qa-text").isVisible(), "must answer: why is it due");
  assert.match(await firstCard.locator(".review-qa-reason .review-qa-text").innerText(), /Terlambat/i);
  assert.ok(await firstCard.locator(".review-qa-consequence .review-qa-text").isVisible(), "must answer: what will happen when completed");

  // 3. Category filtering
  // Click 'Terlambat' tab
  await page.locator('[data-review-filter="overdue"]').click();
  const overdueCards = page.locator("#review-list .review-queue-card");
  assert.equal(await overdueCards.count(), 2);

  // Click 'Hari Ini' tab
  await page.locator('[data-review-filter="today"]').click();
  const todayCards = page.locator("#review-list .review-queue-card");
  assert.equal(await todayCards.count(), 1);
  assert.match(await todayCards.first().locator(".review-card-title").innerText(), /usually/i);

  // Click 'Perlu Pemantapan' tab
  await page.locator('[data-review-filter="practice"]').click();
  const practiceCards = page.locator("#review-list .review-queue-card");
  assert.equal(await practiceCards.count(), 1);
  assert.match(await practiceCards.first().locator(".review-card-title").innerText(), /enough/i);

  // 4. Skill filtering
  // Reset to due filter, filter by Grammar
  await page.locator('[data-review-filter="due"]').click();
  await page.locator('[data-review-skill="grammar"]').click();
  const grammarCards = page.locator("#review-list .review-queue-card");
  assert.equal(await grammarCards.count(), 1);
  assert.match(await grammarCards.first().locator(".review-skill-badge").innerText(), /Tata Bahasa|Grammar/i);

  // Reset to all skills
  await page.locator('[data-review-skill="all"]').click();
  assert.equal(await page.locator("#review-list .review-queue-card").count(), 3);

  assert.deepEqual(pageErrors, [], "Unified Review Queue filtering and explanations must execute without errors");
  await page.close();
});

test("Unified Review Queue allows in-place mistake retrieval and direct vocab study without false mastery, and persists across reload", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  const now = Date.now();
  const overdueIso = new Date(now - 3 * 86400000).toISOString();
  const timestamp = new Date(now).toISOString();

  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "review-queue-access-3",
      refresh_token: "review-queue-refresh-3",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "review-queue-user-3", email: "review3@example.com" },
    }));
  });

  await page.goto(`${baseUrl}/belajar.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  await page.evaluate(({ overdueIso, timestamp }) => {
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-hello-3", at: overdueIso, correct: true }],
          nextReviewAt: overdueIso,
          reviewSuccesses: 1,
          reviewDates: ["2026-10-27"],
          reviewHistory: [{ date: "2026-10-27", at: overdueIso, correct: true }],
          weak: false,
          skillEvidence: { recall: true, context: true, production: false }
        }
      },
      grammarProgress: {},
      events: [],
      history: [],
      updatedAt: timestamp
    };

    const adventure = {
      schemaVersion: 1,
      mistakeJournal: {
        "grammar:present-simple:ps-1": {
          mistakeId: "grammar:present-simple:ps-1",
          sourceType: "grammar",
          topicId: "present-simple",
          stepId: "ps-1",
          skill: "Grammar",
          level: "A1",
          prompt: "Pilih kalimat yang menggunakan present simple dengan benar.",
          wrongAnswer: "walks",
          correctAnswer: "He walks to class every day.",
          explanation: "Subjek tunggal membutuhkan kata kerja berakhiran -s.",
          recordedAt: overdueIso,
          resolvedAt: overdueIso,
          nextReviewAt: overdueIso,
          reviewStage: 1,
          reviewHistory: [{ reviewedAt: overdueIso, correct: true, stage: 1 }]
        }
      },
      updatedAt: timestamp
    };
    window.sinauuApplyCloudBundle({ core, extras: { adventureProgress: adventure } });
  }, { overdueIso, timestamp });

  await page.locator('[data-view-target="review"]').click();

  // 1. In-place mistake review
  const mistakeActionBtn = page.locator('#review-list [data-review-mistake="grammar:present-simple:ps-1"]');
  await mistakeActionBtn.waitFor({ state: "visible" });
  await mistakeActionBtn.click();

  // Active panel renders in-place inside #view-review
  const activePanel = page.locator("#review-active-panel .adventure-mistake-review");
  await activePanel.waitFor({ state: "visible" });

  // Pick incorrect answer first (index 0)
  await activePanel.locator('[data-mistake-answer="0"]').click();
  assert.match(await activePanel.innerText(), /Belum tepat/i);

  // Pick correct answer (index 1: "He walks to class every day.")
  // Since wrong answer reset stage to 0, correct retry advances it to 1
  await activePanel.locator('[data-mistake-answer="1"]').click();
  assert.match(await activePanel.innerText(), /Review 1\/4 berhasil/i);

  // Close in-place review card
  await activePanel.locator("[data-mistake-review-close]").click();
  await page.waitForFunction(() => document.getElementById("review-active-panel")?.hidden === true);

  // 2. Reload and verify reviewStage 1 persists
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator('[data-view-target="review"]').click();

  const mistakeStage = await page.evaluate(() => {
    const journal = window.sinauuGetMistakeJournal?.() || {};
    return journal["grammar:present-simple:ps-1"]?.reviewStage;
  });
  assert.equal(mistakeStage, 1, "reviewStage 1 after reset and retry must persist in storage across page reload");

  // Verify false mastery is NOT granted (stage 1 of 4 is not mastered)
  const isMastered = await page.evaluate(() => {
    const journal = window.sinauuGetMistakeJournal?.() || {};
    const item = journal["grammar:present-simple:ps-1"];
    return window.sinauuIsMistakeMastered?.(item);
  });
  assert.equal(isMastered, false, "intermediate spaced review stage must NOT grant false mastery");

  // 3. Verify 'Buka materi asal' context navigation
  const openSourceBtn = page.locator('#review-list [data-review-open-source="vocab:a1-hello"]');
  await openSourceBtn.waitFor({ state: "visible" });
  await openSourceBtn.click();
  await page.locator("#view-vocabulary").waitFor({ state: "visible" });
  assert.equal(await page.locator("#view-vocabulary").isVisible(), true);

  assert.deepEqual(pageErrors, [], "In-place mistake review and source navigation must execute cleanly without errors");
  await page.close();
});

test("Weekly Learning Insights presents an honest empty state for a new learner and an honest single-day state", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "weekly-preview-access-1",
      refresh_token: "weekly-preview-refresh-1",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "weekly-preview-user-1", email: "weekly1@example.com" },
    }));
  });

  await page.goto(`${baseUrl}/belajar.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  // 1. Open Progress view - empty state
  await page.locator(".side-nav [data-view-target='progress']").click();
  const weeklySection = page.locator("#weekly-insights-section");
  await weeklySection.waitFor({ state: "visible" });

  const emptyState = weeklySection.locator(".weekly-empty-state");
  await emptyState.waitFor({ state: "visible" });
  assert.match(await emptyState.locator(".weekly-empty-kicker").innerText(), /BELUM ADA AKTIVITAS MINGGUAN/i);
  assert.match(await emptyState.locator("h3").innerText(), /Belum ada aktivitas belajar/i);

  // Click CTA to start first practice
  const emptyCta = emptyState.locator('[data-weekly-target="vocabulary"]');
  await emptyCta.click();
  await page.locator("#view-vocabulary.is-visible").waitFor({ state: "visible" });

  // 2. Single-day learner
  const now = Date.now();
  const todayIso = new Date(now).toISOString();
  const today = todayIso.slice(0, 10);

  await page.evaluate(async ({ today, todayIso }) => {
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-1", at: todayIso, correct: true }],
          studiedDates: [today],
          reviewHistory: [{ at: todayIso, date: today, correct: true }],
          nextReviewAt: null
        }
      },
      grammarProgress: {
        "present-simple": {
          attempts: 2,
          correct: 2,
          answers: {
            "ps-1": { correct: true, at: todayIso }
          }
        }
      },
      events: [],
      history: [{
        id: "hist-1",
        date: today,
        at: todayIso,
        type: "vocabulary",
        title: "hello",
        correct: true
      }],
      updatedAt: todayIso
    };
    await window.sinauuApplyCloudBundle({ core, extras: {} });
  }, { today, todayIso });

  await page.locator(".side-nav [data-view-target='progress']").click();
  await weeklySection.waitFor({ state: "visible" });

  // Active days card shows 1 / 7 hari
  const activeDaysVal = weeklySection.locator("#weekly-active-days");
  await activeDaysVal.waitFor({ state: "visible" });
  assert.match(await activeDaysVal.innerText(), /1/);
  assert.match(await activeDaysVal.innerText(), /7 hari/);

  // Narrative notes single active day honestly without false trends
  const narrative = weeklySection.locator(".weekly-narrative");
  assert.match(await narrative.innerText(), /1 hari/i);

  assert.deepEqual(pageErrors, [], "Weekly Learning Insights empty state and single-day state must execute without browser errors");
  await page.close();
});

test("Weekly Learning Insights aggregates multi-skill activity, computes fair week-over-week comparisons, accuracy trends, and honest disclosures", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  const now = Date.now();
  const dayMs = 86400000;
  // Current week timestamps: days 0, 1, 2, 4 prior
  const d0 = new Date(now).toISOString();
  const d1 = new Date(now - 1 * dayMs).toISOString();
  const d2 = new Date(now - 2 * dayMs).toISOString();
  const d4 = new Date(now - 4 * dayMs).toISOString();

  // Previous week timestamps: days 8, 10 prior
  const d8 = new Date(now - 8 * dayMs).toISOString();
  const d10 = new Date(now - 10 * dayMs).toISOString();

  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "weekly-preview-access-2",
      refresh_token: "weekly-preview-refresh-2",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "weekly-preview-user-2", email: "weekly2@example.com" },
    }));
  });

  await page.goto(`${baseUrl}/belajar.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  await page.evaluate(async ({ d0, d1, d2, d4, d8, d10 }) => {
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [{ id: "att-hello-1", at: d0, correct: true }],
          studiedDates: [d0.slice(0, 10)],
          reviewHistory: [
            { id: "rh-1", at: d0, date: d0.slice(0, 10), correct: true },
            { id: "rh-2", at: d1, date: d1.slice(0, 10), correct: true }
          ]
        },
        "a1-usually": {
          attempts: [{ id: "att-usually-1", at: d2, correct: true }],
          studiedDates: [d2.slice(0, 10)],
          reviewHistory: [{ id: "rh-3", at: d2, date: d2.slice(0, 10), correct: false }]
        },
        "a1-enough": {
          attempts: [{ id: "att-enough-old", at: d8, correct: true }],
          studiedDates: [d8.slice(0, 10)],
          reviewHistory: [{ id: "rh-4", at: d8, date: d8.slice(0, 10), correct: true }]
        }
      },
      grammarProgress: {
        "present-simple": {
          attempts: 6,
          correct: 5,
          answers: {
            "ps-1": { correct: true, at: d1 },
            "ps-2": { correct: true, at: d1 },
            "ps-3": { correct: false, at: d2 },
            "ps-4": { correct: true, at: d4 }
          }
        },
        "past-simple": {
          attempts: 5,
          correct: 3,
          answers: {
            "pst-1": { correct: true, at: d8 },
            "pst-2": { correct: false, at: d8 },
            "pst-3": { correct: false, at: d10 },
            "pst-4": { correct: true, at: d10 }
          }
        }
      },
      events: [],
      history: [],
      updatedAt: d0
    };

    const extras = {
      habitProgress: {
        "habit-page-1": {
          answers: {
            "q1": { correct: true, answeredAt: d0 },
            "q2": { correct: true, answeredAt: d0 },
            "q3": { correct: true, answeredAt: d0 }
          }
        }
      },
      adventureProgress: {
        schemaVersion: 1,
        studioSessions: [
          {
            studioType: "speaking",
            promptId: "ordering-cafe",
            completedAt: d1,
            checklistCompleted: 3
          }
        ],
        pronunciationProgress: {
          "phrase-1": {
            attempts: [{ completedAt: d4, durationMs: 4200, matchCount: 5 }]
          }
        },
        mistakeJournal: {
          "grammar:present-simple:ps-3": {
            mistakeId: "grammar:present-simple:ps-3",
            sourceType: "grammar",
            topicId: "present-simple",
            stepId: "ps-3",
            reviewHistory: [{ reviewedAt: d0, correct: true, stage: 1 }]
          }
        }
      }
    };

    await window.sinauuApplyCloudBundle({ core, extras });
  }, { d0, d1, d2, d4, d8, d10 });

  await page.locator(".side-nav [data-view-target='progress']").click();
  const weeklySection = page.locator("#weekly-insights-section");
  await weeklySection.waitFor({ state: "visible" });

  // 1. Metric grid checks
  // Active days: 4 days in current week (d0, d1, d2, d4) vs 2 in previous week (d8, d10)
  const activeDaysEl = weeklySection.locator("#weekly-active-days");
  assert.match(await activeDaysEl.innerText(), /4/);
  assert.match(await weeklySection.locator(".weekly-metric-item").nth(0).innerText(), /\+2 hari dibanding minggu lalu/i);

  // Activities & Reviews
  const totalReviewsEl = weeklySection.locator("#weekly-total-reviews");
  // 3 vocab reviews + 1 mistake journal review = 4
  assert.equal(await totalReviewsEl.innerText(), "4");

  // Accuracy Trend: both current and previous have >= 5 objective questions
  const accuracyEl = weeklySection.locator("#weekly-accuracy-value");
  assert.match(await accuracyEl.innerText(), /%/);
  const accuracyCompEl = weeklySection.locator(".weekly-metric-item").nth(3).locator(".weekly-metric-comparison");
  assert.match(await accuracyCompEl.innerText(), /%/);

  // 2. Skill breakdown table checks
  const table = weeklySection.locator(".weekly-skills-table");
  assert.equal(await table.locator("tbody tr").count(), 7, "must list all 7 core skills");

  // Check honest disclosure for Speaking & Pronunciation
  assert.match(await table.innerText(), /Refleksi mandiri/i);
  assert.match(await table.innerText(), /Analisis audio lokal/i);

  // 3. Highlights
  const mostPracticed = weeklySection.locator("#weekly-most-practiced");
  assert.ok((await mostPracticed.innerText()).length > 0);
  const leastPracticed = weeklySection.locator("#weekly-least-practiced");
  assert.ok((await leastPracticed.innerText()).length > 0);

  // 4. Actionable recommendations
  const recList = weeklySection.locator(".weekly-recommendation-list .weekly-rec-card");
  assert.ok(await recList.count() >= 1);
  const recBtn = recList.first().locator(".weekly-rec-btn");
  assert.ok(await recBtn.isVisible());

  assert.deepEqual(pageErrors, [], "Multi-skill Weekly Learning Insights aggregation must execute cleanly without browser errors");
  await page.close();
});

test("Weekly Learning Insights connects to Adaptive Study Plan, handles malformed timestamps, and persists across reload", async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/account**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
  });

  const now = Date.now();
  const todayIso = new Date(now).toISOString();
  const yesterdayIso = new Date(now - 86400000).toISOString();

  await page.addInitScript(() => {
    localStorage.setItem("sinauu-cloud-session-v1", JSON.stringify({
      access_token: "weekly-preview-access-3",
      refresh_token: "weekly-preview-refresh-3",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      user: { id: "weekly-preview-user-3", email: "weekly3@example.com" },
    }));
  });

  await page.goto(`${baseUrl}/belajar.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));

  // 1. Inject state with malformed timestamps and neglected listening skill
  await page.evaluate(async ({ todayIso, yesterdayIso }) => {
    const core = {
      schemaVersion: 1,
      settings: { theme: "light", dailyGoal: 10 },
      wordProgress: {
        "a1-hello": {
          attempts: [
            { id: "att-good", at: todayIso, correct: true },
            { id: "att-malformed-1", at: "not-a-valid-date", correct: true },
            { id: "att-malformed-2", at: null, correct: false },
            { id: "att-malformed-3", at: "", correct: false }
          ],
          studiedDates: [todayIso.slice(0, 10)],
          reviewHistory: [{ at: todayIso, date: todayIso.slice(0, 10), correct: true }]
        },
        "a1-usually": {
          attempts: [{ id: "att-u", at: yesterdayIso, correct: true }],
          studiedDates: [yesterdayIso.slice(0, 10)],
          reviewHistory: [{ at: yesterdayIso, date: yesterdayIso.slice(0, 10), correct: true }]
        }
      },
      grammarProgress: {
        "present-simple": {
          attempts: 4,
          correct: 4,
          answers: {
            "ps-1": { correct: true, at: todayIso },
            "ps-2": { correct: true, at: yesterdayIso },
            "ps-bad": { correct: true, at: "invalid-timestamp" }
          }
        }
      },
      events: [{ at: "corrupted", type: "unknown" }],
      history: [],
      updatedAt: todayIso
    };

    const extras = {
      extraLearning: {
        reading: {
          "sk-1": { lastAttempt: todayIso, completed: true, attempts: 2, correct: 2 }
        }
      },
      adventureProgress: {
        schemaVersion: 1,
        listeningProgress: {} // Neglected listening!
      }
    };

    await window.sinauuApplyCloudBundle({ core, extras });
  }, { todayIso, yesterdayIso });

  // 2. Check that malformed timestamps did not break computation
  const weeklyData = await page.evaluate(() => window.sinauuComputeWeeklyInsights?.());
  assert.ok(weeklyData, "computeWeeklyInsights must return valid result despite malformed timestamps");
  assert.equal(weeklyData.current.activeDaysCount, 2, "only valid days should count as active days");

  // 3. Verify Adaptive Study Plan adapts based on weekly insights (recommends listening because reading & vocab were active)
  await page.locator(".side-nav [data-view-target='overview']").click();
  const planSteps = page.locator("#home-study-plan-steps .home-study-plan-step");
  await planSteps.first().waitFor({ state: "visible" });
  assert.equal(await planSteps.count(), 3);

  const step2Text = await planSteps.nth(1).innerText();
  assert.match(step2Text, /Listening Lab|Menyimak/i, "adaptive study plan should recommend listening when neglected in weekly review");

  // 4. Persistence across reload
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sinauuWorkspaceReady));
  await page.locator(".side-nav [data-view-target='progress']").click();

  const persistedActiveDays = await page.locator("#weekly-insights-section #weekly-active-days").innerText();
  assert.match(persistedActiveDays, /2/);

  // 5. Mobile viewport accessibility
  await page.setViewportSize({ width: 375, height: 667 });
  const weeklySection = page.locator("#weekly-insights-section");
  await weeklySection.waitFor({ state: "visible" });
  assert.ok(await weeklySection.locator(".weekly-metric-grid").isVisible());
  assert.ok(await weeklySection.locator(".weekly-skills-table").isVisible());

  assert.deepEqual(pageErrors, [], "Adaptive study plan connection, timestamp safety, and mobile layout must execute without errors");
  await page.close();
});
