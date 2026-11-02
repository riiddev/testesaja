(() => {
  "use strict";
  const STORAGE_KEY = "sinauu-adventure-progress-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const SKILLS = [
    ["vocabulary", "Vocabulary", "Aa"], ["grammar", "Grammar", "¶"],
    ["listening", "Listening", ")))"], ["reading", "Reading", "▤"],
    ["speaking", "Speaking", "↗"], ["writing", "Writing", "✎"]
  ];
  const RANKS = [
    { name: "Seed Explorer", min: 0, next: 100, mark: "I" },
    { name: "Trail Scout", min: 100, next: 280, mark: "II" },
    { name: "Pathfinder", min: 280, next: 500, mark: "III" },
    { name: "Storyteller", min: 500, next: 800, mark: "IV" },
    { name: "Communicator", min: 800, next: 1200, mark: "V" },
    { name: "World Explorer", min: 1200, next: 1200, mark: "VI" }
  ];
  let curriculum = null;
  let progress = normalizeProgress(readStored());
  let selectedMissionId = null, currentFeedback = null, currentFeedbackStepId = null, listenReady = false, listenTranscriptVisible = false, dailyTranscriptVisible = false, selectedMistakeReviewId = null, mistakeReviewFeedback = null, mistakeReviewTranscriptVisible = false, mistakeReviewListenReady = false, initialized = false;
  let stories = [], storiesLoaded = false, storyLoadError = "", storyRun = null;
  let dialogues = [], dialoguesLoaded = false, dialogueLoadError = "", dialogueRun = null;
  let listeningExercises = [], listeningLoaded = false, listeningLoadError = "", listeningRun = null;
  let pronunciationExercises = [], pronunciationLoaded = false, pronunciationLoadError = "", pronunciationRun = null, pronunciationCapture = null;

  function emptyProgress() {
    return { schemaVersion: 1, missionProgress: {}, skillEvidence: {}, xpLedger: {}, dailyQuests: {}, mistakeJournal: {}, storyProgress: {}, dialogueProgress: {}, listeningProgress: {}, pronunciationProgress: {}, listeningRate: 0.9, achievementIds: [], studioSessions: [], updatedAt: new Date().toISOString() };
  }
  function readStored() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return value && typeof value === "object" ? value : null;
    } catch (_) { return null; }
  }
  function normalizeProgress(raw) {
    const base = emptyProgress();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
    base.missionProgress = raw.missionProgress && typeof raw.missionProgress === "object" && !Array.isArray(raw.missionProgress) ? raw.missionProgress : {};
    base.skillEvidence = raw.skillEvidence && typeof raw.skillEvidence === "object" && !Array.isArray(raw.skillEvidence) ? raw.skillEvidence : {};
    base.xpLedger = raw.xpLedger && typeof raw.xpLedger === "object" && !Array.isArray(raw.xpLedger) ? raw.xpLedger : {};
    base.dailyQuests = raw.dailyQuests && typeof raw.dailyQuests === "object" && !Array.isArray(raw.dailyQuests) ? raw.dailyQuests : {};
    base.mistakeJournal = raw.mistakeJournal && typeof raw.mistakeJournal === "object" && !Array.isArray(raw.mistakeJournal) ? raw.mistakeJournal : {};
    base.storyProgress = raw.storyProgress && typeof raw.storyProgress === "object" && !Array.isArray(raw.storyProgress) ? raw.storyProgress : {};
    for (const [storyId, entry] of Object.entries(base.storyProgress)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) { delete base.storyProgress[storyId]; continue; }
      entry.attempts = Array.isArray(entry.attempts)
        ? entry.attempts.filter((attempt) => attempt && typeof attempt.attemptId === "string" && Number.isInteger(attempt.score) && Number.isInteger(attempt.total) && typeof attempt.completedAt === "string").slice(-100)
        : [];
      entry.bestScore = entry.attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
      entry.completedAt = typeof entry.completedAt === "string" ? entry.completedAt : entry.attempts.find((attempt) => attempt.passed)?.completedAt || null;
      entry.updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt : base.updatedAt;
    }
    base.dialogueProgress = raw.dialogueProgress && typeof raw.dialogueProgress === "object" && !Array.isArray(raw.dialogueProgress) ? raw.dialogueProgress : {};
    for (const [dialogueId, entry] of Object.entries(base.dialogueProgress)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) { delete base.dialogueProgress[dialogueId]; continue; }
      entry.attempts = Array.isArray(entry.attempts)
        ? entry.attempts.filter((attempt) => attempt && typeof attempt.attemptId === "string" && Number.isInteger(attempt.score) && Number.isInteger(attempt.total) && typeof attempt.completedAt === "string").slice(-100)
        : [];
      entry.bestScore = entry.attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
      entry.completedAt = typeof entry.completedAt === "string" ? entry.completedAt : entry.attempts.find((attempt) => attempt.passed)?.completedAt || null;
      entry.updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt : base.updatedAt;
    }
    base.listeningProgress = raw.listeningProgress && typeof raw.listeningProgress === "object" && !Array.isArray(raw.listeningProgress) ? raw.listeningProgress : {};
    for (const [exerciseId, entry] of Object.entries(base.listeningProgress)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) { delete base.listeningProgress[exerciseId]; continue; }
      entry.attempts = Array.isArray(entry.attempts)
        ? entry.attempts.filter((attempt) => attempt && typeof attempt.attemptId === "string" && Number.isInteger(attempt.score) && Number.isInteger(attempt.total) && typeof attempt.completedAt === "string").slice(-100)
        : [];
      entry.bestScore = entry.attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
      entry.completedAt = typeof entry.completedAt === "string" ? entry.completedAt : entry.attempts.find((attempt) => attempt.passed)?.completedAt || null;
      entry.updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt : base.updatedAt;
    }
    base.pronunciationProgress = raw.pronunciationProgress && typeof raw.pronunciationProgress === "object" && !Array.isArray(raw.pronunciationProgress) ? raw.pronunciationProgress : {};
    for (const [phraseId, entry] of Object.entries(base.pronunciationProgress)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) { delete base.pronunciationProgress[phraseId]; continue; }
      entry.attempts = Array.isArray(entry.attempts)
        ? entry.attempts.filter((attempt) => attempt && typeof attempt.attemptId === "string" && typeof attempt.completedAt === "string" && Number.isFinite(attempt.durationMs))
          .map((attempt) => ({
            attemptId: attempt.attemptId.slice(0, 140),
            completedAt: attempt.completedAt,
            durationMs: Math.max(0, Math.min(12000, Number(attempt.durationMs) || 0)),
            voiceShare: Number.isFinite(attempt.voiceShare) ? Math.max(0, Math.min(1, Number(attempt.voiceShare))) : 0.8,
            voicedFrames: Math.max(0, Math.min(200, Math.trunc(Number(attempt.voicedFrames) || 0))),
            meanRms: Math.max(0, Math.min(1, Number(attempt.meanRms) || 0)),
            pauseCount: Math.max(0, Math.min(30, Math.trunc(Number(attempt.pauseCount) || 0))),
            pitchMedian: Number.isFinite(attempt.pitchMedian) ? Math.max(60, Math.min(400, Number(attempt.pitchMedian))) : null,
            pitchRangeSemitones: Number.isFinite(attempt.pitchRangeSemitones) ? Math.max(0, Math.min(24, Number(attempt.pitchRangeSemitones))) : null,
          })).slice(-50)
        : [];
      entry.updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt : base.updatedAt;
    }
    base.listeningRate = [0.75, 0.9, 1].includes(Number(raw.listeningRate)) ? Number(raw.listeningRate) : 0.9;
    base.achievementIds = Array.isArray(raw.achievementIds) ? Array.from(new Set(raw.achievementIds.filter((item) => typeof item === "string"))).slice(0, 100) : [];
    base.studioSessions = Array.isArray(raw.studioSessions) ? raw.studioSessions.filter((item) => item && typeof item === "object" && typeof item.sessionId === "string" && ["speaking", "writing"].includes(item.studioType) && typeof item.promptId === "string").map((item) => ({ sessionId: item.sessionId.slice(0, 140), studioType: item.studioType, promptId: item.promptId.slice(0, 80), wordCount: Math.max(0, Math.min(5000, Number(item.wordCount) || 0)), checklistCompleted: Math.max(0, Math.min(5, Number(item.checklistCompleted) || 0)), completedAt: typeof item.completedAt === "string" ? item.completedAt : base.updatedAt, updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : base.updatedAt })).slice(-500) : [];
    base.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt;
    for (const [missionId, entry] of Object.entries(base.missionProgress)) {
      if (!entry || typeof entry !== "object") { delete base.missionProgress[missionId]; continue; }
      entry.attempts = Array.isArray(entry.attempts) ? entry.attempts.filter((attempt) => attempt && typeof attempt === "object" && typeof attempt.attemptId === "string") : [];
      entry.bestScore = Number.isFinite(entry.bestScore) ? Math.max(0, Math.min(100, entry.bestScore)) : null;
      entry.completedAt = typeof entry.completedAt === "string" ? entry.completedAt : null;
    }
    for (const [skill, evidence] of Object.entries(base.skillEvidence)) {
      base.skillEvidence[skill] = Array.isArray(evidence) ? evidence.filter((item) => item && typeof item.evidenceId === "string").slice(-500) : [];
    }
    for (const [awardId, award] of Object.entries(base.xpLedger)) {
      if (!award || typeof award !== "object") delete base.xpLedger[awardId];
      else award.amount = Math.max(0, Math.min(1000, Number(award.amount) || 0));
    }
    for (const [date, quest] of Object.entries(base.dailyQuests)) {
      if (!quest || typeof quest !== "object") { delete base.dailyQuests[date]; continue; }
      quest.stepIds = Array.isArray(quest.stepIds) ? quest.stepIds.filter((id) => typeof id === "string").slice(0, 6) : [];
      quest.completedStepIds = Array.isArray(quest.completedStepIds) ? Array.from(new Set(quest.completedStepIds.filter((id) => typeof id === "string"))) : [];
      quest.wrongAttempts = quest.wrongAttempts && typeof quest.wrongAttempts === "object" ? quest.wrongAttempts : {};
    }
    for (const [mistakeId, mistake] of Object.entries(base.mistakeJournal)) {
      if (!mistake || typeof mistake !== "object" || typeof mistake.mistakeId !== "string") { delete base.mistakeJournal[mistakeId]; continue; }
      mistake.recordedAt = typeof mistake.recordedAt === "string" ? mistake.recordedAt : base.updatedAt;
      const hasReviewStage = Number.isInteger(mistake.reviewStage);
      mistake.reviewStage = hasReviewStage ? Math.max(0, Math.min(4, mistake.reviewStage)) : (mistake.resolvedAt ? 4 : 0);
      mistake.reviewHistory = Array.isArray(mistake.reviewHistory)
        ? mistake.reviewHistory.filter((entry) => entry && typeof entry.reviewedAt === "string" && typeof entry.correct === "boolean").slice(-8)
        : [];
      if (mistake.reviewStage >= 4) {
        mistake.masteredAt = typeof mistake.masteredAt === "string" ? mistake.masteredAt : (mistake.resolvedAt || mistake.recordedAt);
        mistake.resolvedAt = mistake.resolvedAt || mistake.masteredAt;
        mistake.nextReviewAt = null;
        mistake.status = "mastered";
      } else if (mistake.reviewStage > 0) {
        mistake.resolvedAt = mistake.resolvedAt || mistake.lastReviewedAt || mistake.recordedAt;
        const intervals = [1, 3, 7];
        const interval = intervals[mistake.reviewStage - 1];
        if (typeof mistake.nextReviewAt !== "string" && interval) {
          const anchor = Date.parse(mistake.lastReviewedAt || mistake.resolvedAt);
          mistake.nextReviewAt = new Date((Number.isFinite(anchor) ? anchor : Date.now()) + interval * 86400000).toISOString();
        }
        mistake.status = "reviewing";
      } else {
        mistake.resolvedAt = null;
        mistake.masteredAt = null;
        mistake.nextReviewAt = typeof mistake.nextReviewAt === "string" ? mistake.nextReviewAt : mistake.recordedAt;
        mistake.status = "open";
      }
    }
    const dailyDates = Object.keys(base.dailyQuests).sort();
    for (const oldDate of dailyDates.slice(0, Math.max(0, dailyDates.length - 90))) delete base.dailyQuests[oldDate];
    return base;
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }
  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function saveProgress() {
    progress.updatedAt = new Date().toISOString();
    try {
      if (!window.sinauuIsCloudVerified?.()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      }
      const note = $("#adventure-save-state");
      if (note) note.textContent = window.sinauuIsCloudVerified?.() ? "Tersimpan di cloud" : "Tersimpan di perangkat ini · siap disinkronkan";
      window.dispatchEvent(new CustomEvent("sinauu:local-extras-saved"));
      return true;
    } catch (_) {
      const note = $("#adventure-save-state");
      if (note) note.textContent = "Penyimpanan penuh. Ekspor backup dari halaman Progres.";
      return false;
    }
  }
  function cloneProgress(value) { return JSON.parse(JSON.stringify(value)); }
  function xpTotal() {
    return Object.values(progress.xpLedger).reduce((total, award) => total + Math.max(0, Number(award && award.amount) || 0), 0);
  }
  function rankFor(total) {
    let result = RANKS[0];
    for (const rank of RANKS) if (total >= rank.min) result = rank;
    return result;
  }
  function missionEntry(missionId) {
    const entry = progress.missionProgress[missionId];
    return entry && typeof entry === "object" ? entry : { attempts: [], bestScore: null, completedAt: null };
  }
  function missionCompleted(missionId) { return Boolean(missionEntry(missionId).completedAt); }
  function missionUnlocked(mission) { return !mission.prerequisiteId || missionCompleted(mission.prerequisiteId); }
  function latestIncompleteAttempt(missionId) {
    return (missionEntry(missionId).attempts || [])
      .filter((attempt) => !attempt.completedAt)
      .sort((a, b) => String(b.startedAt || "").localeCompare(String(a.startedAt || "")))[0] || null;
  }
  function currentAttempt(missionId) {
    const entry = missionEntry(missionId);
    return entry.attempts.find((attempt) => attempt.attemptId === entry.activeAttemptId) || latestIncompleteAttempt(missionId);
  }
  function currentStep(mission, attempt) {
    const completed = new Set(attempt.completedStepIds || []);
    return mission.steps.find((step) => !completed.has(step.id)) || null;
  }
  function evidenceCount(skill) { return (progress.skillEvidence[skill] || []).length; }

  function renderHeaderStats() {
    const total = xpTotal(), rank = rankFor(total), next = RANKS.find((item) => item.min > rank.min);
    const percent = next ? Math.max(0, Math.min(100, (total - rank.min) / Math.max(1, next.min - rank.min) * 100)) : 100;
    const completed = curriculum.missions.filter((mission) => missionCompleted(mission.id)).length;
    if ($("#adventure-rank")) $("#adventure-rank").textContent = rank.name;
    if ($("#adventure-rank-mark")) $("#adventure-rank-mark").textContent = rank.mark;
    if ($("#adventure-xp-line")) $("#adventure-xp-line").textContent = next ? total + " XP · " + (total - rank.min) + " / " + (next.min - rank.min) + " menuju " + next.name : total + " XP · peringkat tertinggi";
    if ($("#adventure-xp-bar")) $("#adventure-xp-bar").style.width = percent + "%";
    if ($("#adventure-mission-count")) $("#adventure-mission-count").textContent = completed + "/" + curriculum.missions.length;
  }

  function renderMap() {
    const node = $("#adventure-map");
    if (!node) return;
    const stops = curriculum.missions.map((mission) => {
      const completed = missionCompleted(mission.id), unlocked = missionUnlocked(mission), selected = mission.id === selectedMissionId;
      const status = completed ? "SELESAI" : unlocked ? "TERSEDIA" : "TERKUNCI";
      const cls = completed ? "is-complete" : unlocked ? "is-available" : "is-locked";
      return '<button class="adventure-stop ' + cls + (selected ? ' is-selected' : '') + '" type="button" data-adventure-select="' + escapeHtml(mission.id) + '" aria-pressed="' + selected + '">' +
        '<span class="adventure-stop-pin">' + (completed ? "✓" : String(mission.number).padStart(2, "0")) + '</span>' +
        '<span class="adventure-stop-copy"><small>' + status + ' · ' + escapeHtml(mission.level) + '</small><strong>' + escapeHtml(mission.location) + '</strong></span></button>';
    }).join("");
    node.innerHTML = '<svg class="adventure-map-route" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M80 220 C210 245 265 65 445 91 S650 252 910 112" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 10"/>' +
      '<path d="M25 260 C170 184 205 292 360 238 S650 170 810 245 S930 270 1020 212" fill="none" stroke="currentColor" stroke-width="1" opacity=".18"/>' +
      '<path d="M40 42 C170 110 222 28 340 73 S590 124 700 49 S890 26 990 75" fill="none" stroke="currentColor" stroke-width="1" opacity=".16"/></svg>' +
      stops + '<span class="adventure-map-caption">FIELD MAP / FIRST STEPS ISLAND</span>';
  }

  function renderSkillProfile() {
    const list = $("#adventure-skill-list");
    if (!list) return;
    list.innerHTML = SKILLS.map(([id, label, symbol]) => {
      const total = evidenceCount(id), width = Math.min(100, total / 3 * 100);
      return '<div class="adventure-skill-row"><span class="adventure-skill-symbol">' + symbol + '</span><span class="adventure-skill-name">' + label + '</span><span class="adventure-skill-count">' + total + '</span><span class="adventure-skill-track"><i style="width:' + width + '%"></i></span></div>';
    }).join("");
  }

  function checkAchievements() {
    const completedDays = Object.values(progress.dailyQuests).filter((quest) => quest && quest.completedAt).length;
    const resolvedMistakes = Object.values(progress.mistakeJournal).filter((mistake) => mistake && (mistake.masteredAt || Number(mistake.reviewStage) >= 4)).length;
    const allSkillsPracticed = SKILLS.every(([skill]) => evidenceCount(skill) >= 3);
    const conditions = [
      ["first-mission", curriculum.missions.some((mission) => missionCompleted(mission.id))],
      ["island-clear", curriculum.missions.every((mission) => missionCompleted(mission.id))],
      ["daily-first", completedDays >= 1],
      ["daily-seven", completedDays >= 7],
      ["mistake-five", resolvedMistakes >= 5],
      ["all-skills", allSkillsPracticed],
      ["cafe-customer", missionCompleted("a-day-at-the-cafe")]
    ];
    let changed = false;
    for (const [id, unlocked] of conditions) {
      if (unlocked && !progress.achievementIds.includes(id)) {
        progress.achievementIds.push(id);
        changed = true;
      }
    }
    if (changed) saveProgress();
  }

  function renderAchievements() {
    const node = $("#adventure-achievements");
    if (!node) return;
    const all = [
      ["first-mission", "First Footsteps", "Menyelesaikan misi pertamamu."],
      ["island-clear", "Island Notes", "Menyelesaikan seluruh misi First Steps Island."],
      ["daily-first", "Daily Explorer", "Menyelesaikan Daily Quest pertamamu."],
      ["daily-seven", "Steady Traveller", "Menyelesaikan Daily Quest pada tujuh hari berbeda."],
      ["mistake-five", "Learning from Mistakes", "Menuntaskan pengulangan terjadwal untuk lima kesalahan."],
      ["all-skills", "Six Ways to Grow", "Mengumpulkan sedikitnya tiga bukti latihan pada setiap skill."],
      ["cafe-customer", "A Polite Customer", "Menyelesaikan misi A Day at the Café."]
    ];
    const items = all.filter((item) => progress.achievementIds.includes(item[0]));
    node.innerHTML = items.length ? items.map((item) =>
      '<div class="adventure-achievement"><span>✳</span><div><strong>' + item[1] + '</strong><small>' + item[2] + '</small></div></div>'
    ).join("") : "<p>Achievement akan muncul setelah kamu menyelesaikan tantangan belajar.</p>";
    const resolved = Object.values(progress.mistakeJournal).filter((mistake) => mistake && (mistake.masteredAt || Number(mistake.reviewStage) >= 4)).length;
    const days = Object.values(progress.dailyQuests).filter((quest) => quest && quest.completedAt).length;
    node.insertAdjacentHTML("beforeend", '<p class="adventure-achievement-next">Berikutnya: ' + days + '/7 Daily Quest · ' + resolved + '/5 kesalahan diperbaiki.</p>');
  }

  function missionStatus(mission) {
    if (missionCompleted(mission.id)) return "COMPLETED";
    return missionUnlocked(mission) ? "AVAILABLE" : "LOCKED";
  }

  function renderMissionDetail() {
    const node = $("#adventure-mission-panel");
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId) || curriculum.missions[0];
    if (!mission || !node) return;
    const entry = missionEntry(mission.id), status = missionStatus(mission), attempt = currentAttempt(mission.id);
    const canStart = missionUnlocked(mission);
    const wordNames = (mission.wordRefs || []).map((id) => ({
      "a1-hello":"hello", "a1-neighbor":"neighbor", "batch-afternoon-noun":"afternoon",
      "batch-across-preposition":"across", "batch-corner-noun":"corner", "batch-bank-noun":"bank",
      "batch-cafe-noun":"café", "batch-coffee-noun":"coffee", "batch-bread-noun":"bread",
      "batch-drink-verb":"drink"
    })[id] || id);

    if (attempt && !attempt.completedAt) {
      renderStep(mission, attempt, node);
      return;
    }
    if (entry.completedAt) {
      const nextMission = curriculum.missions.some((item) => item.prerequisiteId === mission.id);
      node.innerHTML = '<div class="adventure-mission-overline"><span>MISSION ' + String(mission.number).padStart(2, "0") + ' / MAIN QUEST</span><span class="adventure-status is-complete">COMPLETED</span></div>' +
        '<h2>' + escapeHtml(mission.title) + '</h2><p class="adventure-mission-summary">' + escapeHtml(mission.summary) + '</p>' +
        '<div class="adventure-mission-meta"><span>' + escapeHtml(mission.level) + '</span><span>' + mission.estimatedMinutes + ' menit</span><span>+' + mission.xp + ' XP · sudah diberikan</span></div>' +
        '<div class="adventure-objective"><small>YOUR OBJECTIVE</small><p>' + escapeHtml(mission.objective) + '</p></div>' +
        '<div class="adventure-completion"><span class="adventure-completion-mark">✓</span><div><strong>Misi selesai.</strong><p>Latihan ini tercatat. Misi selanjutnya ' + (nextMission ? 'sudah terbuka.' : 'menjadi penutup pulau ini.') + '</p></div></div>' +
        '<div class="adventure-mission-actions"><button class="primary-action" type="button" data-adventure-start="' + escapeHtml(mission.id) + '">Ulangi latihan ↻</button></div>';
      return;
    }

    const stages = mission.steps.map((step, index) =>
      '<span class="adventure-stage"><small>' + String(index + 1).padStart(2, "0") + '</small>' + escapeHtml(step.label.split("·")[0].trim()) + '</span>'
    ).join("");
    node.innerHTML = '<div class="adventure-mission-overline"><span>MISSION ' + String(mission.number).padStart(2, "0") + ' / MAIN QUEST</span><span class="adventure-status ' + (canStart ? "is-available" : "is-locked") + '">' + status + '</span></div>' +
      '<h2>' + escapeHtml(mission.title) + '</h2><p class="adventure-mission-summary">' + escapeHtml(mission.summary) + '</p>' +
      '<div class="adventure-mission-meta"><span>' + escapeHtml(mission.level) + '</span><span>' + mission.estimatedMinutes + ' menit</span><span>+' + mission.xp + ' XP</span></div>' +
      '<div class="adventure-objective"><small>YOUR OBJECTIVE</small><p>' + escapeHtml(mission.objective) + '</p></div>' +
      '<div class="adventure-stage-list">' + stages + '</div>' +
      '<div class="adventure-words"><small>WORDS IN THIS MISSION</small>' + wordNames.map((word) => '<span>' + escapeHtml(word) + '</span>').join("") + '</div>' +
      '<div class="adventure-tool-list"><small>LANGUAGE TOOLS</small><p>' + mission.languageTools.map(escapeHtml).join(" · ") + '</p></div>' +
      (canStart
        ? '<div class="adventure-mission-actions"><button class="primary-action" type="button" data-adventure-start="' + escapeHtml(mission.id) + '">' + (attempt ? "Lanjutkan misi ↗" : "Mulai misi ↗") + '</button><span>' + (attempt ? "Progres percobaan sebelumnya akan dilanjutkan." : "Selesaikan tiap bagian dengan ritmemu.") + '</span></div>'
        : '<p class="adventure-locked-note">Selesaikan “' + escapeHtml(curriculum.missions.find((item) => item.id === mission.prerequisiteId)?.title || "misi sebelumnya") + '” untuk membuka lokasi ini.</p>');
  }

  function renderStep(mission, attempt, node) {
    const step = currentFeedback && currentFeedback.kind === "success" && currentFeedbackStepId
      ? mission.steps.find((item) => item.id === currentFeedbackStepId)
      : currentStep(mission, attempt);
    if (!step) { completeMission(mission, attempt); renderAll(); return; }
    const stepIndex = mission.steps.findIndex((item) => item.id === step.id);
    const progressWidth = Math.round((attempt.completedStepIds.length / mission.steps.length) * 100);
    const isChoice = ["choice", "listen", "read"].includes(step.type);
    const passage = step.passage ? '<div class="adventure-passage">' + escapeHtml(step.passage).replace(/\\n|\n/g, "<br>") + '</div>' : "";
    const listen = step.type === "listen"
      ? '<div class="adventure-listen-lab"><div class="adventure-listen-controls"><button class="secondary-action" type="button" data-adventure-listen="' + escapeHtml(step.id) + '">' + (listenReady ? '↻ Putar ulang' : '▶ Dengarkan dialog') + '</button>' +
        '<div class="adventure-listen-rates">' + [0.75,0.9,1].map((rate) => '<button type="button" data-adventure-listen-rate="' + rate + '" class="' + (progress.listeningRate === rate ? 'is-active' : '') + '">' + (rate === 1 ? '1×' : rate.toFixed(2).replace(/0$/, '') + '×') + '</button>').join("") + '</div></div>' +
        '<p class="adventure-listen-hint">' + (listenReady ? 'Audio siap diputar ulang. Pilih kecepatan atau buka transkrip setelah mencoba mendengar.' : 'Dengarkan dialog terlebih dahulu. Transkrip disembunyikan agar kamu bisa berlatih memahami audio.') + '</p>' +
        (listenReady ? '<button class="text-action adventure-transcript-toggle" type="button" data-adventure-transcript>' + (listenTranscriptVisible ? 'Sembunyikan transkrip' : 'Tampilkan transkrip') + '</button>' : '') +
        (listenReady && listenTranscriptVisible ? '<p class="adventure-audio-transcript">' + escapeHtml(step.audioText) + '</p>' : '') + '</div>' : "";
    const options = isChoice ? '<div class="adventure-options">' + step.options.map((option, index) =>
      '<button class="adventure-option" type="button" data-adventure-answer="' + index + '"' + (step.type === "listen" && !listenReady ? " disabled" : "") + '><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>'
    ).join("") + '</div>' : "";
    let production = "";
    if (step.type === "speak") {
      production = '<div class="adventure-production"><p class="adventure-production-prompt">' + escapeHtml(step.prompt) + '</p>' +
        '<p class="adventure-no-recording">Ucapkan dengan suaramu sendiri. Tidak ada rekaman yang dibuat atau dikirim.</p>' +
        '<div class="adventure-checklist">' + step.checklist.map((item, index) => '<label><input type="checkbox" data-adventure-check="' + index + '"><span>' + escapeHtml(item) + '</span></label>').join("") + '</div>' +
        '<button class="primary-action" type="button" data-adventure-complete-production disabled>Saya sudah mencoba berbicara ↗</button></div>';
    } else if (step.type === "write") {
      production = '<div class="adventure-production"><p class="adventure-production-prompt">' + escapeHtml(step.prompt) + '</p>' +
        '<textarea id="adventure-writing" rows="4" placeholder="' + escapeHtml(step.placeholder || "Tulis jawabanmu…") + '" aria-label="Jawaban tulisan"></textarea>' +
        '<p class="adventure-writing-count" id="adventure-writing-count">0 kata · teks tidak disimpan ke cloud</p>' +
        '<div class="adventure-checklist">' + step.checklist.map((item, index) => '<label><input type="checkbox" data-adventure-check="' + index + '"><span>' + escapeHtml(item) + '</span></label>').join("") + '</div>' +
        '<button class="primary-action" type="button" data-adventure-complete-production disabled>Simpan bukti latihan ↗</button></div>';
    }
    const feedback = currentFeedback
      ? '<div class="adventure-feedback ' + currentFeedback.kind + '" role="status"><strong>' + escapeHtml(currentFeedback.title) + '</strong><p>' + escapeHtml(currentFeedback.message) + '</p>' +
        (currentFeedback.kind === "success" ? '<button class="primary-action" type="button" data-adventure-next>' + (stepIndex === mission.steps.length - 1 ? "Selesaikan misi ↗" : "Lanjutkan ↗") + '</button>' : '') + '</div>' : "";
    node.innerHTML = '<div class="adventure-session-top"><button class="text-action" type="button" data-adventure-back>← Kembali ke misi</button><span>MISSION ' + String(mission.number).padStart(2, "0") + ' / STEP ' + (stepIndex + 1) + ' OF ' + mission.steps.length + '</span></div>' +
      '<div class="adventure-session-progress"><i style="width:' + progressWidth + '%"></i></div>' +
      '<span class="eyebrow">' + escapeHtml(step.label) + '</span><h2>' + escapeHtml(mission.title) + '</h2>' +
      passage + listen + '<h3 class="adventure-question">' + escapeHtml(step.prompt) + '</h3>' +
      options + production + feedback +
      '<p class="adventure-evidence-note">Bukti latihan disimpan sebagai ringkasan. Jawaban tulisan dan suara mentah tidak diunggah ke akun.</p>';
  }

  function startMission(missionId) {
    const mission = curriculum.missions.find((item) => item.id === missionId);
    if (!mission || !missionUnlocked(mission)) return;
    selectedMissionId = missionId; currentFeedback = null; currentFeedbackStepId = null; listenReady = false; listenTranscriptVisible = false;
    const entry = missionEntry(missionId);
    if (!progress.missionProgress[missionId]) progress.missionProgress[missionId] = entry;
    let attempt = latestIncompleteAttempt(missionId);
    if (!attempt) {
      attempt = { attemptId: makeId(), missionId, startedAt: new Date().toISOString(), completedStepIds: [], stepResults: {}, wrongAttempts: {}, completedAt: null, score: null };
      entry.attempts.push(attempt);
    }
    entry.activeAttemptId = attempt.attemptId;
    saveProgress(); renderAll();
  }

  function recordEvidence(mission, attempt, step, method, extra = {}) {
    const evidenceId = mission.id + ":" + attempt.attemptId + ":" + step.id;
    const list = progress.skillEvidence[step.skill] || (progress.skillEvidence[step.skill] = []);
    if (!list.some((item) => item.evidenceId === evidenceId)) {
      list.push({ evidenceId, missionId: mission.id, attemptId: attempt.attemptId, stepId: step.id, recordedAt: new Date().toISOString(), method, ...extra });
      if (list.length > 500) list.splice(0, list.length - 500);
    }
  }

  function markStepComplete(mission, attempt, step, method, extra = {}) {
    if (attempt.completedStepIds.includes(step.id)) return;
    attempt.completedStepIds.push(step.id);
    const wrong = Number(attempt.wrongAttempts && attempt.wrongAttempts[step.id]) || 0;
    attempt.stepResults[step.id] = { completedAt: new Date().toISOString(), firstTry: wrong === 0, attempts: wrong + 1, method };
    recordEvidence(mission, attempt, step, method, extra);
    resolveMistakes(mission.id, step.id, attempt.attemptId);
    saveProgress();
    renderMistakeJournal();
    currentFeedbackStepId = step.id;
    currentFeedback = { kind: "success", title: "Bagian ini selesai.", message: step.explanation || "Bukti latihanmu sudah dicatat. Lanjut ke langkah berikutnya." };
    renderMissionDetail(); renderSkillProfile();
  }

  function handleChoiceAnswer(answerIndex) {
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    const step = mission && attempt && currentStep(mission, attempt);
    if (!mission || !attempt || !step || !["choice", "listen", "read"].includes(step.type)) return;
    if (step.type === "listen" && !listenReady) return;
    if (Number(answerIndex) === step.answer) {
      markStepComplete(mission, attempt, step, "correct-response");
    } else {
      attempt.wrongAttempts = attempt.wrongAttempts || {};
      attempt.wrongAttempts[step.id] = (Number(attempt.wrongAttempts[step.id]) || 0) + 1;
      recordMistake({
        sourceType: "mission", sourceId: attempt.attemptId, missionId: mission.id, stepId: step.id,
        skill: step.skill, prompt: step.prompt, wrongAnswer: step.options[Number(answerIndex)],
        correctAnswer: step.options[step.answer], explanation: step.explanation || "Periksa kembali konteks sebelum mencoba lagi.",
        wrongCount: attempt.wrongAttempts[step.id]
      });
      currentFeedback = { kind: "try-again", title: "Belum tepat. Coba lagi.", message: "Perhatikan kembali konteksnya. Kesalahanmu dicatat agar bisa kamu pelajari lagi." };
      renderMissionDetail();
      renderMistakeJournal();
    }
  }

  function updateProductionButton() {
    const mission = curriculum && curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    const step = mission && attempt && currentStep(mission, attempt);
    const button = $("[data-adventure-complete-production]");
    if (!button || !step) return;
    const boxes = $$("[data-adventure-check]");
    const allChecked = boxes.length > 0 && boxes.every((box) => box.checked);
    let ready = allChecked;
    if (step.type === "write") {
      const text = ($("#adventure-writing")?.value || "").trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      ready = ready && words >= (Number(step.minWords) || 1);
      const count = $("#adventure-writing-count");
      if (count) count.textContent = words + " kata · teks tidak disimpan ke cloud";
    }
    button.disabled = !ready;
  }

  function completeProduction() {
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    const step = mission && attempt && currentStep(mission, attempt);
    if (!mission || !attempt || !step || !["speak", "write"].includes(step.type)) return;
    const boxes = $$("[data-adventure-check]");
    if (!boxes.length || !boxes.every((box) => box.checked)) return;
    let extra = { checklistCount: boxes.length };
    if (step.type === "write") {
      const text = ($("#adventure-writing")?.value || "").trim();
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
      if (wordCount < (Number(step.minWords) || 1)) return;
      extra = { ...extra, wordCount };
    }
    markStepComplete(mission, attempt, step, step.method || "self-reviewed", extra);
  }

  function completeMission(mission, attempt) {
    if (!mission || !attempt || attempt.completedAt) return;
    attempt.completedAt = new Date().toISOString();
    const choiceSteps = mission.steps.filter((step) => ["choice", "listen", "read"].includes(step.type));
    const firstTry = choiceSteps.filter((step) => attempt.stepResults[step.id] && attempt.stepResults[step.id].firstTry).length;
    attempt.score = choiceSteps.length ? Math.round(firstTry / choiceSteps.length * 100) : 100;
    const entry = missionEntry(mission.id);
    if (!progress.missionProgress[mission.id]) progress.missionProgress[mission.id] = entry;
    entry.completedAt = entry.completedAt || attempt.completedAt;
    entry.bestScore = entry.bestScore == null ? attempt.score : Math.max(entry.bestScore, attempt.score);
    entry.activeAttemptId = null;
    entry.attempts = entry.attempts.filter((item) => item.attemptId !== attempt.attemptId).concat(attempt);
    const awardId = "first-completion:" + mission.id;
    if (!progress.xpLedger[awardId]) progress.xpLedger[awardId] = { awardId, amount: mission.xp, awardedAt: attempt.completedAt, missionId: mission.id };
    if (mission.number === 1 && !progress.achievementIds.includes("first-mission")) progress.achievementIds.push("first-mission");
    if (curriculum.missions.every((item) => item.id === mission.id ? true : missionCompleted(item.id))) {
      if (!progress.achievementIds.includes("island-clear")) progress.achievementIds.push("island-clear");
    }
    currentFeedback = null; saveProgress();
  }

  function renderAll() {
    if (!curriculum) return;
    if (!selectedMissionId || !curriculum.missions.some((item) => item.id === selectedMissionId)) {
      selectedMissionId = curriculum.missions.find((mission) => missionUnlocked(mission) && !missionCompleted(mission.id))?.id || curriculum.missions[0]?.id;
    }
    checkAchievements();
    renderHeaderStats(); renderMap(); renderMissionDetail(); renderSkillProfile(); renderAchievements();
    renderDailyQuest(); renderMistakeJournal(); renderStudios(); renderStoryLibrary(); renderDialogueLibrary(); renderListeningLab(); renderPronunciationStudio();
  }
  function openMission(missionId) {
    if (!curriculum || !curriculum.missions.some((item) => item.id === missionId)) return;
    selectedMissionId = missionId; currentFeedback = null; listenReady = false; listenTranscriptVisible = false; renderAll();
  }
  const voiceManager = {
    voices: [],
    englishVoices: [],
    charMap: {},
    init() {
      try {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        this.loadPersisted();
        this.refresh();
        if ("onvoiceschanged" in window.speechSynthesis) {
          try {
            window.speechSynthesis.onvoiceschanged = () => this.refresh();
          } catch (_) {}
        }
      } catch (_) {}
    },
    loadPersisted() {
      try {
        this.charMap = JSON.parse(localStorage.getItem("sinauu-character-voices-v1") || "{}");
      } catch (_) {
        this.charMap = {};
      }
    },
    savePersisted() {
      try {
        localStorage.setItem("sinauu-character-voices-v1", JSON.stringify(this.charMap));
      } catch (_) {}
    },
    refresh() {
      try {
        if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== "function") return;
        this.voices = window.speechSynthesis.getVoices() || [];
        this.englishVoices = this.voices.filter(v => v && v.lang && v.lang.toLowerCase().startsWith("en"));
        if (!this.englishVoices.length) this.englishVoices = this.voices;
      } catch (_) {
        this.voices = [];
        this.englishVoices = [];
      }
    },
    getVoices() {
      if (!this.voices.length) this.refresh();
      return this.englishVoices.length ? this.englishVoices : this.voices;
    },
    hasSingleVoice() {
      return this.getVoices().length <= 1;
    },
    getVoiceForSpeaker(speaker, indexHint = 0) {
      const list = this.getVoices();
      if (!list.length) return null;
      if (this.charMap[speaker]) {
        const found = list.find(v => v.voiceURI === this.charMap[speaker] || v.name === this.charMap[speaker]);
        if (found) return found;
      }
      const hash = Array.from(speaker || "").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const idx = (hash + indexHint) % list.length;
      return list[idx] || list[0];
    },
    getModulationForSpeaker(speaker) {
      const isNarrator = !speaker || speaker.toLowerCase() === "narrator";
      const choice = this.charMap[speaker];
      if (choice === "style-warm") return { pitch: 0.88, rate: 0.92 };
      if (choice === "style-bright") return { pitch: 1.20, rate: 1.02 };
      if (choice === "style-calm") return { pitch: 0.95, rate: 0.85 };
      if (choice === "style-default") return { pitch: 1.0, rate: 0.95 };

      if (this.hasSingleVoice()) {
        if (isNarrator) return { pitch: 1.0, rate: 0.95 };
        const hash = Array.from(speaker || "").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const mod = hash % 3;
        if (mod === 0) return { pitch: 1.18, rate: 1.0 };
        if (mod === 1) return { pitch: 0.88, rate: 0.92 };
        return { pitch: 1.25, rate: 1.03 };
      }
      if (isNarrator) return { pitch: 1.0, rate: 0.95 };
      return { pitch: 1.05, rate: 0.98 };
    },
    setVoice(speaker, voiceURI) {
      this.charMap[speaker] = voiceURI;
      this.savePersisted();
    },
    reset() {
      this.charMap = {};
      try {
        localStorage.removeItem("sinauu-character-voices-v1");
      } catch (_) {}
    }
  };
  voiceManager.init();

  const storyNarration = {
    active: false,
    paused: false,
    storyId: null,
    sentences: [],
    currentIndex: 0,
    utterance: null
  };

  const dialogueNarration = {
    active: false,
    paused: false,
    dialogueId: null,
    lines: [],
    currentIndex: 0,
    utterance: null
  };

  function getStoryCharacters(story) {
    const chars = new Set();
    const text = (story.paragraphs || []).join(" ");
    const knownNames = ["Rina", "Maya", "Arman", "Sari", "Bima", "Rafi", "Nisa", "Alex", "Nadia", "Librarian", "Students", "Manager", "Volunteers", "Staff"];
    for (const name of knownNames) {
      if (new RegExp(`\\b${name}\\b`, "i").test(text)) {
        chars.add(name);
      }
    }
    return Array.from(chars);
  }

  function getStorySentences(story) {
    const results = [];
    let globalIndex = 0;
    const storyChars = getStoryCharacters(story);

    (story.paragraphs || []).forEach((paragraph, pIdx) => {
      const segs = paragraph.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [paragraph];
      segs.forEach((seg, sIdx) => {
        const trimmed = seg.trim();
        if (!trimmed) return;

        let speaker = "Narrator";
        if (/[“"][^”"]+[”"]/.test(trimmed)) {
          const found = storyChars.find(name => new RegExp(`\\b${name}\\b`, "i").test(trimmed));
          speaker = found || (storyChars[0] || "Character");
        }

        results.push({
          id: `story-${story.id}-p${pIdx}-s${sIdx}`,
          globalIndex: globalIndex++,
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
          text: trimmed,
          speaker: speaker
        });
      });
    });
    return results;
  }

  function stopStoryNarration() {
    storyNarration.active = false;
    storyNarration.paused = false;
    storyNarration.currentIndex = 0;
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    $$(".story-sentence").forEach(el => el.classList.remove("is-speaking-sentence"));
    renderStoryLibrary();
  }

  function pauseStoryNarration() {
    if (!storyNarration.active) return;
    storyNarration.paused = true;
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    renderStoryLibrary();
  }

  function resumeStoryNarration() {
    if (!storyNarration.active || !storyNarration.paused) return;
    storyNarration.paused = false;
    renderStoryLibrary();
    playNextStorySentence();
  }

  function startStoryNarration() {
    if (!storyRun || storyRun.stage !== "reading") return;
    const story = stories.find((item) => item.id === storyRun.storyId);
    if (!story) return;

    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      storyRun.audioUnavailable = true;
      renderStoryLibrary();
      return;
    }

    if (storyNarration.active && storyNarration.paused && storyNarration.storyId === story.id) {
      resumeStoryNarration();
      return;
    }

    stopDialogueNarration();
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();

    const sentences = getStorySentences(story);
    storyNarration.active = true;
    storyNarration.paused = false;
    storyNarration.storyId = story.id;
    storyNarration.sentences = sentences;
    storyNarration.currentIndex = 0;

    renderStoryLibrary();
    playNextStorySentence();
  }

  function playNextStorySentence() {
    if (!storyNarration.active || storyNarration.paused) return;
    if (storyNarration.currentIndex >= storyNarration.sentences.length) {
      stopStoryNarration();
      return;
    }

    const s = storyNarration.sentences[storyNarration.currentIndex];
    $$(".story-sentence").forEach(el => {
      const active = el.dataset.storySentenceId === s.id;
      el.classList.toggle("is-speaking-sentence", active);
      if (active) {
        el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      }
    });

    const voice = voiceManager.getVoiceForSpeaker(s.speaker);
    const modulation = voiceManager.getModulationForSpeaker(s.speaker);

    const utt = new SpeechSynthesisUtterance(s.text);
    if (voice) utt.voice = voice;
    utt.pitch = modulation.pitch;
    utt.rate = (progress.listeningRate || 0.9) * modulation.rate;
    utt.lang = voice ? voice.lang : "en-US";

    utt.onend = () => {
      if (!storyNarration.active || storyNarration.paused) return;
      storyNarration.currentIndex++;
      setTimeout(() => {
        if (storyNarration.active && !storyNarration.paused) {
          playNextStorySentence();
        }
      }, 260);
    };

    utt.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      storyNarration.currentIndex++;
      playNextStorySentence();
    };

    storyNarration.utterance = utt;
    if (window.speechSynthesis && typeof window.speechSynthesis.speak === "function") window.speechSynthesis.speak(utt);
  }

  function stopDialogueNarration() {
    dialogueNarration.active = false;
    dialogueNarration.paused = false;
    dialogueNarration.currentIndex = 0;
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    $$(".dialogue-sentence").forEach(el => el.classList.remove("is-speaking-sentence"));
    renderDialogueLibrary();
  }

  function pauseDialogueNarration() {
    if (!dialogueNarration.active) return;
    dialogueNarration.paused = true;
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    renderDialogueLibrary();
  }

  function resumeDialogueNarration() {
    if (!dialogueNarration.active || !dialogueNarration.paused) return;
    dialogueNarration.paused = false;
    renderDialogueLibrary();
    playNextDialogueLine();
  }

  function startDialogueNarration() {
    if (!dialogueRun || dialogueRun.stage !== "roleplay") return;
    const dialogue = dialogues.find((item) => item.id === dialogueRun.dialogueId);
    if (!dialogue) return;

    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      dialogueRun.audioUnavailable = true;
      dialogueRun.transcriptVisible = true;
      renderDialogueLibrary();
      return;
    }

    if (dialogueNarration.active && dialogueNarration.paused && dialogueNarration.dialogueId === dialogue.id) {
      resumeDialogueNarration();
      return;
    }

    stopStoryNarration();
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();

    dialogueRun.transcriptVisible = true;
    dialogueNarration.active = true;
    dialogueNarration.paused = false;
    dialogueNarration.dialogueId = dialogue.id;
    dialogueNarration.lines = dialogue.transcript;
    dialogueNarration.currentIndex = 0;

    renderDialogueLibrary();
    playNextDialogueLine();
  }

  function playNextDialogueLine() {
    if (!dialogueNarration.active || dialogueNarration.paused) return;
    if (dialogueNarration.currentIndex >= dialogueNarration.lines.length) {
      stopDialogueNarration();
      return;
    }

    const line = dialogueNarration.lines[dialogueNarration.currentIndex];
    $$(".dialogue-sentence").forEach(el => {
      const active = Number(el.dataset.dialogueLineId) === dialogueNarration.currentIndex;
      el.classList.toggle("is-speaking-sentence", active);
      if (active) {
        el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      }
    });

    const voice = voiceManager.getVoiceForSpeaker(line.speaker);
    const modulation = voiceManager.getModulationForSpeaker(line.speaker);

    const utt = new SpeechSynthesisUtterance(line.text);
    if (voice) utt.voice = voice;
    utt.pitch = modulation.pitch;
    utt.rate = (progress.listeningRate || 0.9) * modulation.rate;
    utt.lang = voice ? voice.lang : "en-US";

    utt.onend = () => {
      if (!dialogueNarration.active || dialogueNarration.paused) return;
      dialogueNarration.currentIndex++;
      setTimeout(() => {
        if (dialogueNarration.active && !dialogueNarration.paused) {
          playNextDialogueLine();
        }
      }, 300);
    };

    utt.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      dialogueNarration.currentIndex++;
      playNextDialogueLine();
    };

    dialogueNarration.utterance = utt;
    if (window.speechSynthesis && typeof window.speechSynthesis.speak === "function") window.speechSynthesis.speak(utt);
  }

  let activeVoiceModalContext = null;

  function openVoiceModal(context) {
    activeVoiceModalContext = context;
    const backdrop = $("#story-voice-modal-backdrop");
    const listEl = $("#voice-character-list");
    const alertEl = $("#voice-modal-single-alert");
    if (!backdrop || !listEl) return;

    voiceManager.refresh();
    const available = voiceManager.getVoices();
    const hasSingle = voiceManager.hasSingleVoice();

    if (alertEl) alertEl.hidden = !hasSingle;

    let characters = [];
    if (context === "story" && storyRun) {
      const story = stories.find(s => s.id === storyRun.storyId);
      characters = ["Narrator", ...(story ? getStoryCharacters(story) : [])];
    } else if (context === "dialogue" && dialogueRun) {
      const dialogue = dialogues.find(d => d.id === dialogueRun.dialogueId);
      characters = dialogue ? Array.from(new Set(dialogue.transcript.map(l => l.speaker))) : ["Barista", "You"];
    } else {
      characters = ["Narrator", "Maya", "Rina", "Barista", "You"];
    }

    listEl.innerHTML = characters.map((char, cIdx) => {
      let options = "";
      const currentChoice = voiceManager.charMap[char] || "";
      if (hasSingle) {
        const baseVoice = available[0] ? available[0].name : "Suara Bawaan Sistem";
        options = `
          <option value="style-default"${currentChoice === 'style-default' || !currentChoice ? ' selected' : ''}>${escapeHtml(baseVoice)} — Nada Standar</option>
          <option value="style-warm"${currentChoice === 'style-warm' ? ' selected' : ''}>${escapeHtml(baseVoice)} — Gaya Hangat (Pitch 0.88x)</option>
          <option value="style-bright"${currentChoice === 'style-bright' ? ' selected' : ''}>${escapeHtml(baseVoice)} — Gaya Ceria (Pitch 1.20x)</option>
          <option value="style-calm"${currentChoice === 'style-calm' ? ' selected' : ''}>${escapeHtml(baseVoice)} — Gaya Tenang (Tempo 0.85x)</option>
        `;
      } else {
        const assigned = voiceManager.getVoiceForSpeaker(char, cIdx);
        options = available.map(v => {
          const isSelected = assigned && (assigned.voiceURI === v.voiceURI || assigned.name === v.name || currentChoice === v.voiceURI || currentChoice === v.name);
          return `<option value="${escapeHtml(v.voiceURI || v.name)}"${isSelected ? ' selected' : ''}>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`;
        }).join("");
      }

      return `<div class="voice-character-card">
        <div class="voice-character-name">${escapeHtml(char)}</div>
        <select class="voice-select" data-character-voice-select="${escapeHtml(char)}" aria-label="Suara untuk ${escapeHtml(char)}">
          ${options || '<option value="">Suara Default Browser</option>'}
        </select>
        <button type="button" class="voice-preview-btn secondary-action" data-preview-voice-char="${escapeHtml(char)}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Tes
        </button>
      </div>`;
    }).join("");

    backdrop.hidden = false;
  }

  function closeVoiceModal() {
    const backdrop = $("#story-voice-modal-backdrop");
    if (backdrop) backdrop.hidden = true;
    activeVoiceModalContext = null;
  }

  function previewCharacterVoice(speaker) {
    if (!window.speechSynthesis) return;
    if (typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    const select = document.querySelector(`[data-character-voice-select="${speaker}"]`);
    const voiceURI = select ? select.value : "";
    const list = voiceManager.getVoices();
    let voice = null;
    if (voiceURI && !voiceURI.startsWith("style-")) {
      voice = list.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
    }
    if (!voice) {
      voice = voiceManager.getVoiceForSpeaker(speaker);
    }

    const prevChoice = voiceManager.charMap[speaker];
    if (voiceURI) voiceManager.charMap[speaker] = voiceURI;
    const modulation = voiceManager.getModulationForSpeaker(speaker);
    if (prevChoice) voiceManager.charMap[speaker] = prevChoice; else delete voiceManager.charMap[speaker];

    const sampleText = speaker.toLowerCase() === "narrator"
      ? "Once upon a time in a friendly neighborhood."
      : `Hello! I am ${speaker}, practicing English dialogue with you.`;

    const u = new SpeechSynthesisUtterance(sampleText);
    if (voice) u.voice = voice;
    u.pitch = modulation.pitch;
    u.rate = (progress.listeningRate || 0.9) * modulation.rate;
    u.lang = voice ? voice.lang : "en-US";
    if (typeof window.speechSynthesis.speak === "function") window.speechSynthesis.speak(u);
  }

  function saveVoiceModalSettings() {
    const selects = document.querySelectorAll("[data-character-voice-select]");
    selects.forEach(select => {
      const char = select.dataset.characterVoiceSelect;
      if (char && select.value) {
        voiceManager.setVoice(char, select.value);
      }
    });
    closeVoiceModal();
  }

  function resetVoiceModalSettings() {
    voiceManager.reset();
    openVoiceModal(activeVoiceModalContext);
  }

  function playText(text) {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") return false;
    if (typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text || "");
    const narratorVoice = voiceManager.getVoiceForSpeaker("Narrator");
    if (narratorVoice) utterance.voice = narratorVoice;
    utterance.lang = narratorVoice ? narratorVoice.lang : "en-US";
    utterance.rate = progress.listeningRate || 0.9;
    if (typeof window.speechSynthesis.speak === "function") window.speechSynthesis.speak(utterance);
    return true;
  }

  function setListeningRate(value) {
    const rate = Number(value);
    if (![0.75, 0.9, 1].includes(rate)) return;
    progress.listeningRate = rate;
    saveProgress();
    renderMissionDetail();
    renderDailyQuest();
    renderListeningLab();
  }

  function listenToStep() {
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    const step = mission && attempt && currentStep(mission, attempt);
    if (!step || step.type !== "listen") return;
    listenReady = true;
    listenTranscriptVisible = !playText(step.audioText);
    renderMissionDetail();
  }

  function toggleMissionTranscript() {
    listenTranscriptVisible = !listenTranscriptVisible;
    renderMissionDetail();
  }
  function backToMission() {
    currentFeedback = null; currentFeedbackStepId = null; listenReady = false; listenTranscriptVisible = false; renderMissionDetail();
  }
  function advanceStep() {
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    if (!mission || !attempt || !currentFeedback || currentFeedback.kind !== "success") return;
    currentFeedback = null; currentFeedbackStepId = null; listenReady = false; listenTranscriptVisible = false;
    if (attempt.completedStepIds.length >= mission.steps.length) {
      completeMission(mission, attempt); renderAll(); return;
    }
    renderMissionDetail();
  }



  let mistakeFilterValue = "open", mistakeSkillFilterValue = "all";
  let dailyListenReady = false;

  function localDateKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function dailyDefinition(dateKey = localDateKey()) {
    const dayNumber = Math.floor(Date.parse(dateKey + "T00:00:00Z") / 86400000);
    const mission = curriculum.missions[((dayNumber % curriculum.missions.length) + curriculum.missions.length) % curriculum.missions.length];
    const vocabulary = mission.steps.find((step) => step.skill === "vocabulary");
    const grammar = mission.steps.find((step) => step.skill === "grammar");
    const comprehensionSkill = dayNumber % 2 === 0 ? "listening" : "reading";
    const comprehension = mission.steps.find((step) => step.skill === comprehensionSkill)
      || mission.steps.find((step) => step.skill === "reading" || step.skill === "listening");
    return { dateKey, missionId: mission.id, missionTitle: mission.title, stepIds: [vocabulary?.id, comprehension?.id, grammar?.id].filter(Boolean) };
  }

  function dailyRecord(dateKey = localDateKey()) {
    return progress.dailyQuests[dateKey] || null;
  }

  function currentDailyStep(definition, record) {
    return definition.stepIds.find((stepId) => !record.completedStepIds.includes(stepId)) || null;
  }

  function recordMistake(input) {
    const mistakeId = input.mistakeId || [input.sourceId, input.stepId, input.wrongCount || makeId()].join(":");
    if (progress.mistakeJournal[mistakeId]) return;
    const recordedAt = input.recordedAt || new Date().toISOString();
    progress.mistakeJournal[mistakeId] = {
      mistakeId,
      sourceType: input.sourceType || "mission",
      sourceId: input.sourceId,
      missionId: input.missionId,
      topicId: input.topicId,
      wordId: input.wordId,
      passageId: input.passageId,
      questionId: input.questionId || input.stepId,
      stepId: input.stepId || input.questionId,
      skill: input.skill || "adventure",
      prompt: input.prompt || "",
      wrongAnswer: input.wrongAnswer || "Belum memilih jawaban",
      correctAnswer: input.correctAnswer || "",
      explanation: input.explanation || "",
      recordedAt,
      resolvedAt: null,
      status: "open",
      reviewStage: 0,
      nextReviewAt: recordedAt,
      reviewHistory: []
    };
    saveProgress();
  }

  const MISTAKE_REVIEW_INTERVALS = [1, 3, 7];

  function mistakeReviewStage(item) {
    return Math.max(0, Math.min(4, Math.floor(Number(item && item.reviewStage) || 0)));
  }

  function isMistakeMastered(item) {
    return Boolean(item && (item.masteredAt || mistakeReviewStage(item) >= 4));
  }

  function isMistakeDue(item, now = Date.now()) {
    if (!item || isMistakeMastered(item)) return false;
    const dueAt = Date.parse(item.nextReviewAt || item.recordedAt || "");
    return !Number.isFinite(dueAt) || dueAt <= now;
  }

  function formatMistakeReviewDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "hari ini";
    const today = localDateKey();
    const tomorrow = localDateKey(new Date(Date.now() + 86400000));
    const dateKey = localDateKey(date);
    if (dateKey === today) return "hari ini";
    if (dateKey === tomorrow) return "besok";
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  function applyMistakeReviewSuccess(item) {
    if (!item || isMistakeMastered(item) || !isMistakeDue(item)) return false;
    const now = new Date();
    const nextStage = Math.min(4, mistakeReviewStage(item) + 1);
    item.reviewStage = nextStage;
    item.resolvedAt = item.resolvedAt || now.toISOString();
    item.lastReviewedAt = now.toISOString();
    item.reviewHistory = Array.isArray(item.reviewHistory) ? item.reviewHistory : [];
    item.reviewHistory.push({ reviewedAt: now.toISOString(), correct: true, stage: nextStage });
    item.reviewHistory = item.reviewHistory.slice(-8);
    if (nextStage >= 4) {
      item.masteredAt = now.toISOString();
      item.status = "mastered";
      item.nextReviewAt = null;
    } else {
      item.masteredAt = null;
      item.status = "reviewing";
      item.nextReviewAt = new Date(now.getTime() + MISTAKE_REVIEW_INTERVALS[nextStage - 1] * 86400000).toISOString();
    }
    return true;
  }

  function resetMistakeReviewAfterWrong(item) {
    if (!item) return;
    const now = new Date().toISOString();
    item.reviewStage = 0;
    item.resolvedAt = null;
    item.masteredAt = null;
    item.status = "open";
    item.nextReviewAt = now;
    item.lastReviewedAt = now;
    item.reviewHistory = Array.isArray(item.reviewHistory) ? item.reviewHistory : [];
    item.reviewHistory.push({ reviewedAt: now, correct: false, stage: 0 });
    item.reviewHistory = item.reviewHistory.slice(-8);
  }

  function mistakeStep(item) {
    if (!item) return null;
    if (item.missionId) {
      const mission = curriculum && curriculum.missions && curriculum.missions.find((entry) => entry.id === item.missionId);
      const step = mission && mission.steps && mission.steps.find((entry) => entry.id === item.stepId);
      if (mission && step && Array.isArray(step.options) && step.options.length && Number.isInteger(step.answer)) {
        return { mission, step, sourceType: "adventure", title: mission.title };
      }
    }
    if (item.sourceType === "grammar" || item.topicId) {
      const topicId = item.topicId || item.sourceId;
      const qId = item.questionId || item.stepId;
      const topics = (typeof window.sinauuGetTopicList === "function" ? window.sinauuGetTopicList() : null) || [];
      const topic = topics.find((t) => t.id === topicId);
      if (topic && Array.isArray(topic.questions)) {
        const q = topic.questions.find((entry) => entry.id === qId);
        if (q && Array.isArray(q.options) && q.options.length && Number.isInteger(q.answer)) {
          return { topic, step: q, sourceType: "grammar", title: topic.title };
        }
      }
    }
    if (item.sourceType === "habit" || item.passageId) {
      const passageId = item.passageId || item.sourceId;
      const qId = item.questionId || item.stepId;
      const library = typeof window.sinauuGetHabitLibrary === "function" ? window.sinauuGetHabitLibrary() : null;
      const passage = library && library.passages && library.passages.find((p) => p.id === passageId);
      if (passage && typeof window.sinauuGetHabitQuestions === "function") {
        const questions = window.sinauuGetHabitQuestions(passage);
        const q = questions.find((entry) => entry.id === qId);
        if (q && Array.isArray(q.options) && q.options.length && Number.isInteger(q.answer)) {
          const stepWithPassage = {
            ...q,
            type: "read",
            passage: (passage.paragraphs || []).slice(0, 2).join("\n\n")
          };
          return { passage, step: stepWithPassage, sourceType: "habit", title: passage.title };
        }
      }
    }
    if (item.sourceType === "vocab" || item.wordId) {
      const wordId = item.wordId || item.sourceId;
      const qId = item.questionId || item.stepId;
      const words = (typeof window.sinauuGetWordList === "function" ? window.sinauuGetWordList() : null) || [];
      const word = words.find((w) => w.id === wordId);
      if (word) {
        if (typeof window.sinauuGetWordContextQuestion === "function" && qId !== "typed-meaning") {
          const q = window.sinauuGetWordContextQuestion(word, qId);
          if (q && Array.isArray(q.options) && q.options.length && Number.isInteger(q.answer)) {
            return { word, step: q, sourceType: "vocab", title: word.word };
          }
        }
        const correctMeaning = (word.acceptedMeanings && word.acceptedMeanings[0]) || (word.meaning || "").split(/[;,]/)[0].trim();
        const otherMeanings = words.filter((w) => w.id !== word.id && w.meaning).map((w) => (w.acceptedMeanings && w.acceptedMeanings[0]) || (w.meaning || "").split(/[;,]/)[0].trim());
        const uniqueOthers = Array.from(new Set(otherMeanings)).filter((m) => m && m.toLowerCase() !== correctMeaning.toLowerCase());
        const distractors = uniqueOthers.slice(0, 2);
        if (distractors.length >= 2) {
          const seed = word.id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
          const rawOptions = [correctMeaning, ...distractors];
          const shift = seed % rawOptions.length;
          const options = rawOptions.slice(shift).concat(rawOptions.slice(0, shift));
          const step = {
            id: qId || "vocab-recall",
            prompt: "Pilih arti kata yang tepat untuk: " + word.word,
            options,
            answer: options.indexOf(correctMeaning),
            explanation: "Definisi terverifikasi: " + word.meaning + (word.partOfSpeech ? " (" + word.partOfSpeech + ")" : "")
          };
          return { word, step, sourceType: "vocab", title: word.word };
        }
      }
    }
    return null;
  }

  function renderMistakeReview(item) {
    const match = mistakeStep(item);
    if (!match) return "";
    const step = match.step;
    const feedback = mistakeReviewFeedback && mistakeReviewFeedback.mistakeId === item.mistakeId ? mistakeReviewFeedback : null;
    const stageNumber = Math.min(4, mistakeReviewStage(item) + 1);
    let context = "";
    if (step.type === "read" && step.passage) {
      context = '<div class="adventure-mistake-review-context"><small>READ AGAIN · CONTEXT</small><p>' + escapeHtml(step.passage).replace(/\\n|\n/g, "<br>") + '</p></div>';
    } else if (step.type === "listen" && step.audioText) {
      context = '<div class="adventure-mistake-review-listen"><button type="button" data-mistake-listen>▶ Dengarkan dialog lagi</button>' +
        '<button type="button" data-mistake-transcript>' + (mistakeReviewTranscriptVisible ? "Sembunyikan transkrip" : "Tampilkan transkrip") + '</button>' +
        (mistakeReviewTranscriptVisible ? '<p>' + escapeHtml(step.audioText) + '</p>' : '<small>Dengarkan kembali sebelum memilih jawaban. Transkrip tersedia bila diperlukan.</small>') + '</div>';
    }
    const choices = feedback && feedback.kind === "success" ? "" : '<div class="adventure-options adventure-mistake-review-options">' +
      step.options.map((option, index) => '<button class="adventure-option" type="button" data-mistake-answer="' + index + '" data-mistake-id="' + escapeHtml(item.mistakeId) + '"' +
        (step.type === "listen" && !mistakeReviewListenReady ? " disabled" : "") + '><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>').join("") + '</div>';
    let feedbackHtml = "";
    if (feedback && feedback.kind === "success") {
      const mastered = isMistakeMastered(item);
      const next = item.nextReviewAt ? " Pengulangan berikutnya: " + formatMistakeReviewDate(item.nextReviewAt) + "." : "";
      feedbackHtml = '<div class="adventure-feedback success" role="status"><strong>' + (mastered ? "Kesalahan ini sudah kamu kuasai." : "Ingatannya berhasil dipanggil kembali.") + '</strong><p>' +
        (mastered ? "Empat kali pengulangan berhasil, termasuk setelah jeda. Catatan ini tuntas." : "Review " + item.reviewStage + "/4 berhasil." + next) + '</p>' +
        '<p class="adventure-mistake-review-correct">Jawaban tepat: ' + escapeHtml(step.options[step.answer]) + '</p><p class="adventure-mistake-explanation">' + escapeHtml(step.explanation || "") + '</p></div>';
    } else if (feedback && feedback.kind === "try-again") {
      feedbackHtml = '<div class="adventure-feedback try-again" role="status"><strong>Belum tepat. Coba sekali lagi.</strong><p>Jadwal pengulangan kembali ke tahap pertama. Perhatikan konteksnya; jawaban tepat belum ditampilkan.</p></div>';
    }
    return '<section class="adventure-mistake-review" aria-label="Latihan ulang kesalahan">' +
      '<div class="adventure-mistake-review-heading"><div><small>SPACED RETRIEVAL · REVIEW ' + stageNumber + ' / 4</small><strong>Ingat kembali, tanpa melihat kunci jawaban.</strong></div><button type="button" data-mistake-review-close>Tutup</button></div>' +
      context + '<h4>' + escapeHtml(step.prompt) + '</h4>' + choices + feedbackHtml + '</section>';
  }

  function syncExternalMistakes() {
    let changed = false;
    let core = null;
    if (typeof window.sinauuGetCoreState === "function") {
      core = window.sinauuGetCoreState();
    }
    if (!core) {
      try {
        core = JSON.parse(localStorage.getItem("sinauu-learning-state-v1") || "null");
      } catch (e) {
        core = null;
      }
    }

    if (core && core.grammarProgress && typeof core.grammarProgress === "object") {
      const topics = (typeof window.sinauuGetTopicList === "function" ? window.sinauuGetTopicList() : null) || [];
      for (const [topicId, entry] of Object.entries(core.grammarProgress)) {
        if (!entry || !entry.answers || typeof entry.answers !== "object") continue;
        const topic = topics.find((t) => t.id === topicId);
        for (const [qId, ans] of Object.entries(entry.answers)) {
          if (!ans || ans.correct !== false) continue;
          const mistakeId = "grammar:" + topicId + ":" + qId;
          if (progress.mistakeJournal[mistakeId]) continue;
          const q = topic && topic.questions ? topic.questions.find((item) => item.id === qId) : null;
          progress.mistakeJournal[mistakeId] = {
            mistakeId,
            sourceType: "grammar",
            sourceId: topicId,
            topicId,
            questionId: qId,
            stepId: qId,
            skill: "grammar",
            prompt: q ? q.prompt : ("Soal grammar: " + qId),
            wrongAnswer: ans.response ? String(ans.response) : "Jawaban salah",
            correctAnswer: q ? (Array.isArray(q.options) && Number.isInteger(q.answer) ? q.options[q.answer] : q.answer) : "",
            explanation: q ? (q.explanation || "") : "",
            recordedAt: ans.at || core.updatedAt || new Date().toISOString(),
            resolvedAt: null,
            status: "open",
            reviewStage: 0,
            nextReviewAt: ans.at || new Date().toISOString(),
            reviewHistory: []
          };
          changed = true;
        }
      }
    }

    let habitProg = null;
    try {
      habitProg = JSON.parse(localStorage.getItem("sinauu-habit-library-v1") || "null");
    } catch (e) {
      habitProg = null;
    }
    if (habitProg && typeof habitProg === "object") {
      const library = typeof window.sinauuGetHabitLibrary === "function" ? window.sinauuGetHabitLibrary() : null;
      for (const [passageId, entry] of Object.entries(habitProg)) {
        if (!entry || !entry.answers || typeof entry.answers !== "object") continue;
        const passage = library && library.passages ? library.passages.find((p) => p.id === passageId) : null;
        const questions = passage && typeof window.sinauuGetHabitQuestions === "function" ? window.sinauuGetHabitQuestions(passage) : [];
        for (const [qId, ans] of Object.entries(entry.answers)) {
          if (!ans || ans.correct !== false) continue;
          const mistakeId = "habit:" + passageId + ":" + qId;
          if (progress.mistakeJournal[mistakeId]) continue;
          const q = questions.find((item) => item.id === qId);
          progress.mistakeJournal[mistakeId] = {
            mistakeId,
            sourceType: "habit",
            sourceId: passageId,
            passageId,
            questionId: qId,
            stepId: qId,
            skill: "reading",
            prompt: q ? q.prompt : "Soal pemahaman HABIT",
            wrongAnswer: (q && q.options && q.options[ans.selected]) || ("Pilihan " + ans.selected),
            correctAnswer: (q && q.options && q.options[q.answer]) || "",
            explanation: q ? (q.explanation || (q.evidenceParagraph ? "Bukti di paragraf: " + q.evidenceParagraph : "")) : "",
            recordedAt: ans.answeredAt || new Date().toISOString(),
            resolvedAt: null,
            status: "open",
            reviewStage: 0,
            nextReviewAt: ans.answeredAt || new Date().toISOString(),
            reviewHistory: []
          };
          changed = true;
        }
      }
    }

    if (core && core.events && Array.isArray(core.events)) {
      const words = (typeof window.sinauuGetWordList === "function" ? window.sinauuGetWordList() : null) || [];
      for (const ev of core.events) {
        if (!ev || ev.correct !== false || (ev.skill !== "recall" && ev.skill !== "context")) continue;
        const wordId = ev.wordId;
        const qId = ev.questionId || (ev.skill === "recall" ? "recall" : "context");
        const mistakeId = "vocab:" + wordId + ":" + qId;
        if (progress.mistakeJournal[mistakeId]) continue;
        const word = words.find((w) => w.id === wordId);
        const isRecall = ev.skill === "recall";
        const ctx = isRecall ? null : (word && word.context && word.context.id === qId ? word.context : null);
        progress.mistakeJournal[mistakeId] = {
          mistakeId,
          sourceType: "vocab",
          sourceId: wordId,
          wordId,
          questionId: qId,
          stepId: qId,
          skill: "vocabulary",
          prompt: isRecall ? ("Tuliskan arti kata: " + (word ? word.word : (ev.word || wordId))) : (ctx ? ctx.prompt : ("Konteks kalimat untuk: " + (word ? word.word : (ev.word || wordId)))),
          wrongAnswer: ev.response ? String(ev.response) : "Jawaban salah",
          correctAnswer: isRecall ? (word ? word.meaning : "") : (ctx && ctx.options ? ctx.options[ctx.answer] : (word ? word.meaning : "")),
          explanation: isRecall ? (word ? ("Definisi terverifikasi: " + word.meaning + (word.partOfSpeech ? " (" + word.partOfSpeech + ")" : "")) : "") : (ctx ? ctx.explanation : ""),
          recordedAt: ev.at || new Date().toISOString(),
          resolvedAt: null,
          status: "open",
          reviewStage: 0,
          nextReviewAt: ev.at || new Date().toISOString(),
          reviewHistory: []
        };
        changed = true;
      }
    }

    if (changed) {
      saveProgress();
    }
  }

  function renderMistakeJournal() {
    const node = $("#adventure-mistake-journal");
    if (!node) return;
    syncExternalMistakes();
    const all = Object.values(progress.mistakeJournal).sort((a, b) => String(b.recordedAt || "").localeCompare(String(a.recordedAt || "")));
    const dueCount = all.filter((item) => isMistakeDue(item)).length;
    const openCount = all.filter((item) => !item.resolvedAt && !isMistakeMastered(item)).length;
    const reviewingCount = all.filter((item) => item.resolvedAt && !isMistakeMastered(item)).length;
    const selected = selectedMistakeReviewId ? all.find((item) => item.mistakeId === selectedMistakeReviewId) : null;
    const reviewPanel = selected && !isMistakeMastered(selected) && (isMistakeDue(selected) || (mistakeReviewFeedback && mistakeReviewFeedback.mistakeId === selected.mistakeId && mistakeReviewFeedback.kind === "success"))
      ? renderMistakeReview(selected) : "";
    const matchesFilter = (item) => {
      let matchesStatus = true;
      if (mistakeFilterValue === "open") matchesStatus = !item.resolvedAt && !isMistakeMastered(item);
      else if (mistakeFilterValue === "due") matchesStatus = isMistakeDue(item);
      else if (mistakeFilterValue === "reviewing") matchesStatus = Boolean(item.resolvedAt) && !isMistakeMastered(item);
      else if (mistakeFilterValue === "resolved") matchesStatus = Boolean(item.resolvedAt);

      let matchesSkill = true;
      if (mistakeSkillFilterValue !== "all") {
        matchesSkill = String(item.skill || "").toLowerCase() === mistakeSkillFilterValue.toLowerCase();
      }
      return matchesStatus && matchesSkill;
    };
    const visible = all.filter(matchesFilter).slice(0, 8);
    const filters = '<div class="adventure-journal-filters">' +
      [["open","Perlu dipahami"],["due","Jatuh tempo"],["reviewing","Dijadwalkan"],["resolved","Tuntas"],["all","Semua"]]
        .map(([value, label]) => '<button type="button" data-mistake-filter="' + value + '" class="' + (mistakeFilterValue === value ? "is-active" : "") + '">' + label + '</button>').join("") +
      '</div>';
    const skillFilters = '<div class="adventure-journal-filters adventure-journal-skill-filters" role="group" aria-label="Filter berdasarkan skill">' +
      [["all","Semua skill"],["grammar","Grammar"],["vocabulary","Kosakata"],["reading","Reading"],["listening","Listening"]]
        .map(([value, label]) => '<button type="button" data-mistake-skill-filter="' + value + '" class="' + (mistakeSkillFilterValue === value ? "is-active" : "") + '">' + label + '</button>').join("") +
      '</div>';
    const rows = visible.length ? visible.map((item) => {
      const mission = curriculum && curriculum.missions ? curriculum.missions.find((entry) => entry.id === item.missionId) : null;
      const match = mistakeStep(item);
      const mastered = isMistakeMastered(item);
      const due = isMistakeDue(item);
      const stateLabel = mastered ? "TUNTAS" : !item.resolvedAt ? "PERLU DIPAHAMI" : due ? "SUDAH DIPERBAIKI · JATUH TEMPO" : "SUDAH DIPERBAIKI · REVIEW TERJADWAL";
      const stage = mistakeReviewStage(item);
      const schedule = mastered ? "4/4 pengulangan berhasil" :
        (stage + "/4 berhasil · " + (due ? "tersedia untuk latihan sekarang" : "berikutnya " + formatMistakeReviewDate(item.nextReviewAt)));
      const explanation = mastered
        ? '<p class="adventure-mistake-answer is-correct"><span>Jawaban tepat</span> ' + escapeHtml(item.correctAnswer) + '</p><p class="adventure-mistake-explanation">' + escapeHtml(item.explanation) + '</p>'
        : '<details class="adventure-mistake-details"><summary>Lihat jawaban dan pembahasan</summary><p class="adventure-mistake-answer is-correct"><span>Jawaban tepat</span> ' + escapeHtml(item.correctAnswer) + '</p><p class="adventure-mistake-explanation">' + escapeHtml(item.explanation) + '</p></details>';
      let action = '<span>✓ Tuntas</span>';
      if (!mastered && match) {
        action = due
          ? '<button type="button" data-mistake-review-one="' + escapeHtml(item.mistakeId) + '">Latih lagi ↗</button>'
          : '<button type="button" disabled aria-disabled="true">Review ' + escapeHtml(formatMistakeReviewDate(item.nextReviewAt)) + '</button>';
      } else if (!mastered && !match && mission) {
        action = '<button type="button" data-mistake-review="' + escapeHtml(item.missionId) + '">Ulangi misi ↗</button>';
      }
      let sourceLink = "";
      if (item.sourceType === "grammar" || item.topicId) {
        sourceLink = '<button type="button" class="adventure-mistake-source-link" data-open-grammar-topic="' + escapeHtml(item.topicId || item.sourceId) + '">Buka materi grammar ↗</button>';
      } else if (item.sourceType === "vocab" || item.wordId) {
        sourceLink = '<button type="button" class="adventure-mistake-source-link" data-open-vocab-word="' + escapeHtml(item.wordId || item.sourceId) + '">Buka kartu kosakata ↗</button>';
      } else if (item.sourceType === "habit" || item.passageId) {
        sourceLink = '<button type="button" class="adventure-mistake-source-link" data-open-habit-passage="' + escapeHtml(item.passageId || item.sourceId) + '">Buka bacaan HABIT ↗</button>';
      } else if (item.missionId) {
        sourceLink = '<button type="button" class="adventure-mistake-source-link" data-mistake-review="' + escapeHtml(item.missionId) + '">Buka misi ↗</button>';
      }
      const sourceTitle = (match && match.title) || (mission && mission.title) || (item.sourceType === "daily-quest" ? "Daily Quest" : item.sourceType === "grammar" ? "Grammar" : item.sourceType === "habit" ? "Reading HABIT" : item.sourceType === "vocab" ? "Kosakata" : "Latihan");
      const rowClass = mastered ? "is-resolved" : item.resolvedAt ? "is-resolved is-reviewing" : "is-open";
      return '<article class="adventure-mistake-row ' + rowClass + '">' +
        '<div class="adventure-mistake-top"><span>' + escapeHtml(item.skill) + '</span><span>' + stateLabel + '</span></div>' +
        '<strong>' + escapeHtml(item.prompt) + '</strong>' +
        '<p class="adventure-mistake-answer"><span>Jawabanmu</span> ' + escapeHtml(item.wrongAnswer) + '</p>' +
        explanation +
        '<div class="adventure-mistake-progress"><span>REVIEW ' + stage + ' / 4</span><i><b style="width:' + (stage / 4 * 100) + '%"></b></i><small>' + escapeHtml(schedule) + '</small></div>' +
        '<div class="adventure-mistake-bottom"><small>' + escapeHtml(sourceTitle) + '</small>' + (sourceLink ? sourceLink : '') + action + '</div></article>';
    }).join("") : '<p class="adventure-journal-empty">' +
      (mistakeFilterValue === "due" ? "Belum ada pengulangan yang jatuh tempo. Kesalahan berikutnya akan muncul sesuai jadwal." :
        mistakeFilterValue === "reviewing" ? "Belum ada catatan yang sedang menunggu pengulangan terjadwal." :
        mistakeFilterValue === "resolved" ? "Belum ada kesalahan yang tuntas melalui seluruh tahap pengulangan." :
        mistakeFilterValue === "open" ? "Belum ada kesalahan yang perlu dipahami. Bagus, pertahankan kebiasaan memeriksa jawaban." :
        "Belum ada catatan pada filter ini.") + '</p>';
    node.innerHTML = '<div class="adventure-extra-heading"><div><span class="eyebrow">LEARN FROM IT</span><h3>Mistake Journal</h3><p>Jawaban benar belum langsung dianggap dikuasai. Kita akan mengulangnya setelah jeda 1, 3, dan 7 hari.</p></div><span class="adventure-journal-count">' + dueCount + '<small>JATUH TEMPO</small></span></div>' +
      '<p class="adventure-journal-summary">' + openCount + ' belum berhasil diingat · ' + reviewingCount + ' menunggu review.</p>' + reviewPanel + filters + skillFilters + rows;
  }

  function findMistakeRecord(id) {
    if (!id) return null;
    return progress.mistakeJournal[id] || Object.values(progress.mistakeJournal).find((x) => x && x.mistakeId === id) || null;
  }

  function updateReviewActivePanel() {
    const panel = $("#review-active-panel");
    if (!panel) return;
    const reviewView = $("#view-review");
    const isReviewVisible = reviewView && reviewView.classList.contains("is-visible");
    if (!isReviewVisible) {
      panel.innerHTML = "";
      panel.hidden = true;
      return;
    }
    const selected = selectedMistakeReviewId ? findMistakeRecord(selectedMistakeReviewId) : null;
    if (selected && !isMistakeMastered(selected) && (isMistakeDue(selected) || (mistakeReviewFeedback && mistakeReviewFeedback.mistakeId === selected.mistakeId))) {
      panel.innerHTML = renderMistakeReview(selected);
      panel.hidden = false;
    } else {
      panel.innerHTML = "";
      panel.hidden = true;
    }
  }

  function openMistakeReview(mistakeId) {
    const item = findMistakeRecord(mistakeId);
    if (!item || isMistakeMastered(item) || !isMistakeDue(item) || !mistakeStep(item)) return;
    selectedMistakeReviewId = item.mistakeId || mistakeId;
    mistakeReviewFeedback = null;
    mistakeReviewTranscriptVisible = false;
    mistakeReviewListenReady = false;
    renderMistakeJournal();
    updateReviewActivePanel();
    if (typeof window.sinauuOnMistakeReviewChanged === "function") window.sinauuOnMistakeReviewChanged();
  }

  function closeMistakeReview() {
    selectedMistakeReviewId = null;
    mistakeReviewFeedback = null;
    mistakeReviewTranscriptVisible = false;
    mistakeReviewListenReady = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    renderMistakeJournal();
    updateReviewActivePanel();
    if (typeof window.sinauuOnMistakeReviewChanged === "function") window.sinauuOnMistakeReviewChanged();
  }

  function listenToMistakeReview() {
    const item = selectedMistakeReviewId && findMistakeRecord(selectedMistakeReviewId);
    const match = item && mistakeStep(item);
    if (!match || match.step.type !== "listen") return;
    mistakeReviewListenReady = true;
    mistakeReviewTranscriptVisible = !playText(match.step.audioText);
    renderMistakeJournal();
    updateReviewActivePanel();
  }

  function toggleMistakeReviewTranscript() {
    const item = selectedMistakeReviewId && findMistakeRecord(selectedMistakeReviewId);
    const match = item && mistakeStep(item);
    if (!match || match.step.type !== "listen") return;
    mistakeReviewListenReady = true;
    mistakeReviewTranscriptVisible = !mistakeReviewTranscriptVisible;
    renderMistakeJournal();
    updateReviewActivePanel();
  }

  function answerMistakeReview(mistakeId, answerIndex) {
    const item = findMistakeRecord(mistakeId);
    const match = item && mistakeStep(item);
    if (!item || isMistakeMastered(item) || !isMistakeDue(item) || !match) return;
    const step = match.step;
    if (step.type === "listen" && !mistakeReviewListenReady) return;
    if (Number(answerIndex) === Number(step.answer)) {
      if (!applyMistakeReviewSuccess(item)) return;
      mistakeReviewFeedback = { mistakeId, kind: "success" };
      saveProgress();
      checkAchievements();
      renderMistakeJournal();
      renderSkillProfile();
      renderAchievements();
      updateReviewActivePanel();
      if (typeof window.sinauuOnMistakeReviewChanged === "function") window.sinauuOnMistakeReviewChanged();
    } else {
      resetMistakeReviewAfterWrong(item);
      mistakeReviewFeedback = { mistakeId, kind: "try-again" };
      saveProgress();
      renderMistakeJournal();
      updateReviewActivePanel();
      if (typeof window.sinauuOnMistakeReviewChanged === "function") window.sinauuOnMistakeReviewChanged();
    }
  }

  function resolveMistakes(missionId, stepId, sourceId) {
    let changed = false;
    for (const mistake of Object.values(progress.mistakeJournal)) {
      if (mistake.missionId === missionId && mistake.stepId === stepId && mistake.sourceId === sourceId && !isMistakeMastered(mistake) && isMistakeDue(mistake)) {
        changed = applyMistakeReviewSuccess(mistake) || changed;
      }
    }
    if (changed) {
      saveProgress();
      checkAchievements();
    }
  }

  function renderDailyQuest() {
    const node = $("#adventure-daily-quest");
    if (!node || !curriculum) return;
    const definition = dailyDefinition();
    const record = dailyRecord(definition.dateKey);
    const completedIds = new Set(record?.completedStepIds || []);
    const completedCount = definition.stepIds.filter((id) => completedIds.has(id)).length;
    const allDone = completedCount >= definition.stepIds.length && Boolean(record?.completedAt);
    const activeStepId = record && !allDone
      ? (record.lastFeedback?.kind === "success" && record.lastFeedbackStepId ? record.lastFeedbackStepId : currentDailyStep(definition, record))
      : null;
    const mission = curriculum.missions.find((item) => item.id === definition.missionId);
    const step = activeStepId ? mission?.steps.find((item) => item.id === activeStepId) : null;
    const startButton = '<button class="primary-action" type="button" data-daily-start>' + (record?.startedAt ? 'Lanjutkan Daily Quest ↗' : 'Mulai Daily Quest ↗') + '</button>';
    const tracker = '<div class="adventure-daily-tracker">' + definition.stepIds.map((id, index) => '<span class="' + (completedIds.has(id) ? 'is-done' : '') + '">' + (completedIds.has(id) ? '✓' : String(index + 1).padStart(2, "0")) + '</span>').join("") + '</div>';
    if (!record?.startedAt) {
      node.innerHTML = '<div class="adventure-extra-heading"><div><span class="eyebrow">A SMALL CHALLENGE FOR TODAY</span><h3>Daily Quest</h3><p>Tiga tantangan singkat untuk menjaga kemampuan tetap terpakai.</p></div><span class="adventure-daily-reward">+15 XP</span></div>' +
        '<p class="adventure-daily-context">Hari ini kamu akan berlatih dari <strong>' + escapeHtml(definition.missionTitle) + '</strong>. Misi harian dapat mengambil materi dari seluruh pulau sebagai latihan tambahan.</p>' + tracker + startButton +
        '<small class="adventure-daily-note">Satu hadiah per hari. Tidak ada penalti jika kamu melewatkan hari.</small>';
      return;
    }
    if (allDone) {
      node.innerHTML = '<div class="adventure-extra-heading"><div><span class="eyebrow">TODAY\'S JOURNEY</span><h3>Daily Quest complete.</h3><p>Tiga tantangan selesai. Latihan kecil yang konsisten tetap berarti.</p></div><span class="adventure-daily-reward">+15 XP</span></div>' +
        tracker + '<div class="adventure-daily-complete">✓ Hadiah hari ini sudah diberikan. Kamu bisa kembali besok untuk tantangan berikutnya.</div>';
      return;
    }
    const wrongCount = Number(record.wrongAttempts?.[step.id]) || 0;
    const listenMarkup = step.type === "listen"
      ? '<div class="adventure-listen-lab adventure-daily-listen"><div class="adventure-listen-controls"><button type="button" class="secondary-action" data-daily-listen>' + (dailyListenReady ? '↻ Putar ulang' : '▶ Dengarkan dialog') + '</button>' +
        '<div class="adventure-listen-rates">' + [0.75,0.9,1].map((rate) => '<button type="button" data-daily-listen-rate="' + rate + '" class="' + (progress.listeningRate === rate ? 'is-active' : '') + '">' + (rate === 1 ? '1×' : rate.toFixed(2).replace(/0$/, '') + '×') + '</button>').join("") + '</div></div>' +
        (dailyListenReady ? '<button type="button" class="text-action adventure-transcript-toggle" data-daily-transcript>' + (dailyTranscriptVisible ? 'Sembunyikan transkrip' : 'Tampilkan transkrip') + '</button>' : '<small>Dengarkan dulu sebelum menjawab. Transkrip tersembunyi.</small>') +
        (dailyListenReady && dailyTranscriptVisible ? '<p class="adventure-daily-transcript">' + escapeHtml(step.audioText) + '</p>' : '') + '</div>' : "";
    const passage = step.passage ? '<div class="adventure-passage">' + escapeHtml(step.passage).replace(/\\n|\n/g, "<br>") + '</div>' : "";
    const options = step.options.map((option, index) => '<button class="adventure-option" type="button" data-daily-answer="' + index + '"' + (step.type === "listen" && !dailyListenReady ? ' disabled' : '') + '><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>').join("");
    const feedback = record.lastFeedback ? '<div class="adventure-feedback ' + record.lastFeedback.kind + '"><strong>' + escapeHtml(record.lastFeedback.title) + '</strong><p>' + escapeHtml(record.lastFeedback.message) + '</p>' +
      (record.lastFeedback.kind === "success" ? '<button type="button" class="primary-action" data-daily-next>Lanjutkan ↗</button>' : '') + '</div>' : "";
    node.innerHTML = '<div class="adventure-extra-heading"><div><span class="eyebrow">A SMALL CHALLENGE FOR TODAY</span><h3>Daily Quest</h3><p>' + escapeHtml(definition.missionTitle) + '</p></div><span class="adventure-daily-reward">+15 XP</span></div>' +
      tracker + '<div class="adventure-daily-step-count" data-daily-mission-id="' + escapeHtml(mission.id) + '" data-daily-step-id="' + escapeHtml(step.id) + '">TANTANGAN ' + (definition.stepIds.indexOf(step.id) + 1) + ' DARI ' + definition.stepIds.length + ' · ' + escapeHtml(step.skill.toUpperCase()) + '</div>' +
      listenMarkup + passage + '<h4>' + escapeHtml(step.prompt) + '</h4><div class="adventure-options">' + options + '</div>' + feedback +
      '<small class="adventure-daily-note">Kesalahan pada latihan ini akan masuk ke Mistake Journal.</small>';
  }

  function startDailyQuest() {
    const definition = dailyDefinition();
    const existing = progress.dailyQuests[definition.dateKey];
    if (existing?.completedAt) return;
    const record = existing || {
      dateKey: definition.dateKey, missionId: definition.missionId, stepIds: definition.stepIds,
      completedStepIds: [], wrongAttempts: {}, startedAt: new Date().toISOString(), completedAt: null, lastFeedback: null
    };
    record.startedAt ||= new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    progress.dailyQuests[definition.dateKey] = record;
    dailyListenReady = false;
    dailyTranscriptVisible = false;
    saveProgress();
    renderDailyQuest();
  }

  function listenToDailyStep() {
    const definition = dailyDefinition(), record = dailyRecord(definition.dateKey);
    const stepId = record && currentDailyStep(definition, record);
    const mission = curriculum.missions.find((item) => item.id === definition.missionId);
    const step = mission?.steps.find((item) => item.id === stepId);
    if (!step || step.type !== "listen") return;
    dailyListenReady = true;
    dailyTranscriptVisible = !playText(step.audioText);
    renderDailyQuest();
  }

  function answerDailyQuest(answerIndex) {
    const definition = dailyDefinition(), record = dailyRecord(definition.dateKey);
    if (!record || record.completedAt) return;
    const stepId = currentDailyStep(definition, record);
    const mission = curriculum.missions.find((item) => item.id === definition.missionId);
    const step = mission?.steps.find((item) => item.id === stepId);
    if (!step || record.lastFeedback?.kind === "success" || (step.type === "listen" && !dailyListenReady)) return;
    if (Number(answerIndex) === step.answer) {
      record.completedStepIds = Array.from(new Set([...record.completedStepIds, step.id]));
      record.lastFeedback = { kind: "success", title: "Tepat.", message: step.explanation || "Kamu menggunakan petunjuk dengan baik." };
      record.lastFeedbackStepId = step.id;
      const evidenceId = "daily:" + definition.dateKey + ":" + step.id;
      const list = progress.skillEvidence[step.skill] || (progress.skillEvidence[step.skill] = []);
      if (!list.some((item) => item.evidenceId === evidenceId)) list.push({
        evidenceId, missionId: mission.id, sourceType: "daily-quest", recordedAt: new Date().toISOString(), method: "correct-response"
      });
      resolveMistakes(mission.id, step.id, "daily:" + definition.dateKey);
    } else {
      record.wrongAttempts[step.id] = (Number(record.wrongAttempts[step.id]) || 0) + 1;
      recordMistake({
        sourceType: "daily-quest", sourceId: "daily:" + definition.dateKey, missionId: mission.id, stepId: step.id,
        skill: step.skill, prompt: step.prompt, wrongAnswer: step.options[Number(answerIndex)],
        correctAnswer: step.options[step.answer], explanation: step.explanation,
        wrongCount: record.wrongAttempts[step.id]
      });
      record.lastFeedback = { kind: "try-again", title: "Belum tepat. Coba lagi.", message: "Baca kembali petunjuknya. Catatan ini akan menunggumu di Mistake Journal." };
    }
    record.updatedAt = new Date().toISOString();
    dailyListenReady = false;
    dailyTranscriptVisible = false;
    saveProgress();
    renderDailyQuest(); renderMistakeJournal(); renderSkillProfile();
  }

  function advanceDailyQuest() {
    const definition = dailyDefinition(), record = dailyRecord(definition.dateKey);
    if (!record || record.lastFeedback?.kind !== "success") return;
    record.lastFeedback = null;
    record.lastFeedbackStepId = null;
    record.updatedAt = new Date().toISOString();
    dailyListenReady = false;
    dailyTranscriptVisible = false;
    if (definition.stepIds.every((id) => record.completedStepIds.includes(id))) {
      record.completedAt = record.completedAt || new Date().toISOString();
      const awardId = "daily-quest:" + definition.dateKey;
      if (!progress.xpLedger[awardId]) progress.xpLedger[awardId] = {
        awardId, amount: 15, awardedAt: record.completedAt, source: "daily-quest", dateKey: definition.dateKey
      };
    }
    saveProgress();
    renderAll();
  }


  // Standalone studios: raw drafts/checklists are device-local and never enter CloudBundle.
  const STUDIO_PROMPTS = {
    speaking: [
      {
        id: "first-introduction", title: "Introduce yourself", level: "A1",
        context: "You meet a new classmate before the lesson starts.",
        prompt: "Introduce yourself, build a little connection, and ask your classmate a question.",
        starters: ["Hi, my name is …", "I enjoy … because …", "What about you?"],
        checks: ["I answered the partner's main question clearly.", "I added a relevant detail about myself.", "I responded naturally and invited the partner to continue."],
        turns: [
          { partnerLine: "Hi! I'm Alex. Is this your first class here?", prompt: "Say hello, tell Alex your name, and say whether this is your first class.", hint: "A simple greeting and one short sentence are enough.", starters: ["Hi, Alex. I'm …", "Yes, it is. / No, it isn't."] },
          { partnerLine: "Nice to meet you. What do you like doing after class?", prompt: "Share one activity you enjoy and add a little detail about it.", hint: "Mention when you do it or why you enjoy it.", starters: ["I enjoy …", "I usually do it …", "I like it because …"] },
          { partnerLine: "That sounds fun. What made you decide to learn English?", prompt: "Explain one reason for learning English, then ask Alex a question.", hint: "Connect English to a real goal, such as study, work, travel, or meeting people.", starters: ["I'm learning English because …", "What about you?"] }
        ]
      },
      {
        id: "ask-directions", title: "Ask for directions", level: "A1–A2",
        context: "You are in town and need to find the nearest bus stop.",
        prompt: "Ask for directions, clarify a landmark, and make sure you know where to go.",
        starters: ["Excuse me, could you tell me …?", "Should I turn …?", "Thank you for your help."],
        checks: ["I explained where I wanted to go.", "I asked a useful follow-up question.", "I confirmed the direction and thanked the partner."],
        turns: [
          { partnerLine: "Hello! You look like you're trying to find somewhere. Can I help?", prompt: "Ask where the nearest bus stop is.", hint: "Start politely and name the place you need.", starters: ["Excuse me, could you tell me where …?", "I'm looking for …"] },
          { partnerLine: "Of course. Walk straight for two blocks. It's beside the library.", prompt: "Check that you understood the landmark or distance.", hint: "Repeat one detail as a question to confirm it.", starters: ["So I should walk …?", "Is it next to …?"] },
          { partnerLine: "That's right. You can't miss it. Is there anything else you need?", prompt: "Ask one final practical question, then close the conversation politely.", hint: "You could ask how long the walk takes or thank the person.", starters: ["How long does it take to …?", "That's very helpful. Thank you."] }
        ]
      },
      {
        id: "cafe-order", title: "Order at a café", level: "A1–A2",
        context: "You are ordering a drink and a snack at a small café.",
        prompt: "Order politely, explain one preference, and check the price.",
        starters: ["Could I have …, please?", "Can I get it without …?", "How much is it altogether?"],
        checks: ["I placed my order politely and clearly.", "I explained a preference or made a request.", "I checked the price and closed the conversation."],
        turns: [
          { partnerLine: "Good afternoon! Welcome in. What would you like today?", prompt: "Order one drink and one snack.", hint: "You can use 'Could I have …, please?' for a polite order.", starters: ["Could I have …, please?", "I'd like … and …"] },
          { partnerLine: "Certainly. Would you like anything changed or added to your order?", prompt: "Mention one preference, such as less sugar or no ice.", hint: "Keep the request simple and polite.", starters: ["Could you make it …?", "Could I have it without …?"] },
          { partnerLine: "No problem. Your total is five dollars. Would you like a receipt?", prompt: "Respond to the total, answer the receipt question, and thank the staff member.", hint: "You can confirm the price before closing.", starters: ["That's fine, thank you.", "Yes, please. / No, thank you."] }
        ]
      },
      {
        id: "discuss-study-plan", title: "Discuss a study plan", level: "B1",
        context: "Your group needs to finish a presentation by Friday.",
        prompt: "Negotiate a fair plan, explain a scheduling constraint, and agree on next steps.",
        starters: ["I suggest that we …", "I am available …, but …", "I can review … before …"],
        checks: ["I made a clear suggestion and supported it with a reason.", "I acknowledged a constraint and responded constructively.", "I confirmed a realistic next step with the group."],
        turns: [
          { partnerLine: "We need to finish the presentation by Friday. How should we divide the work?", prompt: "Suggest a fair division of the tasks and explain why it would work.", hint: "Give a practical proposal, then connect it to the group's strengths or time.", starters: ["I suggest that we …", "That would help because …"] },
          { partnerLine: "I can prepare the slides, but I have an exam on Thursday. Could we adjust the deadline?", prompt: "Acknowledge the concern and negotiate a realistic adjustment.", hint: "Show that you heard the concern before offering an alternative.", starters: ["That makes sense. We could …", "Would it help if …?"] },
          { partnerLine: "That works for me. How about we review everything together on Friday morning?", prompt: "Confirm or refine the plan, including one concrete action.", hint: "Make the next step specific: who will do what, and by when?", starters: ["Agreed. I'll … by …", "Let's check in at …"] }
        ]
      },
      {
        id: "present-study-proposal", title: "Present a study proposal", level: "B2",
        context: "You are discussing a proposal for a quieter study zone with a student committee.",
        prompt: "Defend a proposal thoughtfully, respond to a concern, and suggest how to evaluate the result.",
        starters: ["I understand that concern. However, …", "The strongest evidence is …", "We could review the impact by …"],
        checks: ["I presented a clear position and supported it with evidence or reasoning.", "I addressed a different viewpoint fairly before responding.", "I proposed a measurable and realistic next step."],
        turns: [
          { partnerLine: "I like the idea of a quieter study zone, but how would it help students who prefer group study?", prompt: "Acknowledge the concern and explain how the proposal could serve different study needs.", hint: "Avoid treating the other view as wrong. Consider separate zones, schedules, or flexible use.", starters: ["That's a fair concern. One option is …", "The aim isn't to …, but to …"] },
          { partnerLine: "Space and funding are limited. Which changes would you prioritise first?", prompt: "Prioritise one or two changes and justify your choice.", hint: "Explain the likely benefit, cost, and what can reasonably be done first.", starters: ["I'd prioritise … because …", "A low-cost first step would be …"] },
          { partnerLine: "How would we know whether the proposal is working after one month?", prompt: "Suggest a simple way to evaluate the proposal and decide what happens next.", hint: "Choose evidence that could actually be collected, then explain how it would guide a decision.", starters: ["We could compare …", "If the results show …, we should …"] }
        ]
      }
    ],
    writing: [
      { id: "short-introduction", title: "A short introduction", level: "A1", context: "Write a short profile for a new class discussion board.", prompt: "Introduce yourself, mention an interest, and explain one goal you have for learning English.", target: "50–80 words", starters: ["My name is …", "In my free time, I …", "One of my goals is …"], checks: ["My purpose is clear from the beginning.", "I included specific details, not only general claims.", "I checked spelling, punctuation, and sentence endings."] },
      { id: "weekend-story", title: "A weekend story", level: "A1–A2", context: "Tell a friend about something you did last weekend.", prompt: "Write about one activity from your weekend. Include where you went, who was there, and how you felt.", target: "60–90 words", starters: ["Last weekend, I …", "I went there with …", "I felt … because …"], checks: ["The events follow a clear order.", "I included a place, person, or concrete detail.", "I checked past-tense verbs and punctuation."] },
      { id: "helpful-message", title: "Invite a study partner", level: "A2", context: "Send a friendly message to someone you want to study with.", prompt: "Invite a friend to study together. Suggest a time and place, then ask whether they are available.", target: "40–70 words", starters: ["Hi …, are you free …?", "We could meet at …", "Let me know what works for you."], checks: ["The invitation and purpose are easy to understand.", "I included a time and a place.", "The tone is friendly and the message has a clear closing."] },
      { id: "study-reflection", title: "Reflect on a study habit", level: "B1", context: "Write a short reflection for a student learning journal.", prompt: "Describe one study habit you changed, explain why you changed it, and reflect on the result.", target: "100–130 words", starters: ["I used to …, but …", "One reason for this change was …", "As a result, …"], checks: ["I described a clear change and its context.", "I explained the reason and result with relevant detail.", "I used linking words to make the reflection easy to follow."] },
      { id: "balanced-proposal", title: "A balanced proposal", level: "B2", context: "Write to a student committee about improving a shared study space.", prompt: "Propose one realistic improvement, acknowledge a possible drawback, and explain how the committee could evaluate the result.", target: "140–180 words", starters: ["A practical improvement would be …", "Although this may involve …, …", "Its impact could be evaluated by …"], checks: ["I made a focused proposal and supported it with reasoning.", "I acknowledged a limitation and addressed it fairly.", "I suggested a realistic way to measure the outcome."] }
    ]
  };
  const STUDIO_DRAFTS_KEY = "sinauu-adventure-studio-drafts-v1";
  let studioDrafts = null;

  function studioStorageKey() {
    try {
      const session = JSON.parse(localStorage.getItem("sinauu-cloud-session-v1") || "null");
      const userId = session && session.user && typeof session.user.id === "string" ? session.user.id : "local";
      return STUDIO_DRAFTS_KEY + ":" + encodeURIComponent(userId);
    } catch (_) { return STUDIO_DRAFTS_KEY + ":local"; }
  }
  function readStudioDrafts() {
    const empty = {
      speaking: { selectedPromptId: "first-introduction", prompts: {} },
      writing: { selectedPromptId: "short-introduction", prompts: {} }
    };
    try {
      const raw = JSON.parse(localStorage.getItem(studioStorageKey()) || "null");
      if (!raw || typeof raw !== "object") return empty;
      for (const kind of ["speaking", "writing"]) {
        const allowed = STUDIO_PROMPTS[kind];
        const saved = raw[kind] && typeof raw[kind] === "object" ? raw[kind] : {};
        empty[kind].selectedPromptId = allowed.some((item) => item.id === saved.selectedPromptId) ? saved.selectedPromptId : empty[kind].selectedPromptId;
        if (saved.prompts && typeof saved.prompts === "object") {
          for (const prompt of allowed) {
            const state = saved.prompts[prompt.id];
            if (!state || typeof state !== "object") continue;
            const hasTurnProgress = kind !== "speaking" || Number.isInteger(state.turnIndex);
            const savedPlan = kind === "writing" && state.plan && typeof state.plan === "object" && !Array.isArray(state.plan) ? state.plan : {};
            empty[kind].prompts[prompt.id] = {
              text: kind === "writing" && typeof state.text === "string" ? state.text.slice(0, 12000) : "",
              revision: kind === "writing" && typeof state.revision === "string" ? state.revision.slice(0, 12000) : "",
              plan: kind === "writing" ? {
                opening: typeof savedPlan.opening === "string" ? savedPlan.opening.slice(0, 1200) : "",
                detail: typeof savedPlan.detail === "string" ? savedPlan.detail.slice(0, 1200) : "",
                closing: typeof savedPlan.closing === "string" ? savedPlan.closing.slice(0, 1200) : ""
              } : { opening: "", detail: "", closing: "" },
              checked: kind === "speaking" && !hasTurnProgress ? [] : Array.isArray(state.checked) ? Array.from(new Set(state.checked.filter((value) => Number.isInteger(value) && value >= 0 && value < 3))) : [],
              turnIndex: kind === "speaking" && hasTurnProgress ? Math.max(0, Math.min(prompt.turns.length, state.turnIndex)) : 0,
              updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : null,
              completedAt: typeof state.completedAt === "string" ? state.completedAt : null
            };
          }
        }
      }
    } catch (_) { /* Start with an empty local draft when storage is unavailable or invalid. */ }
    return empty;
  }
  function saveStudioDrafts() {
    try {
      if (!window.sinauuIsCloudVerified?.()) {
        localStorage.setItem(studioStorageKey(), JSON.stringify(studioDrafts));
      }
      const status = $("#adventure-studio-save-state");
      if (status) status.textContent = window.sinauuIsCloudVerified?.() ? "Draft tersimpan di cloud." : "Draft tersimpan lokal di perangkat ini.";
      window.dispatchEvent(new CustomEvent("sinauu:local-extras-saved"));
    } catch (_) {
      const status = $("#adventure-studio-save-state");
      if (status) status.textContent = "Penyimpanan lokal penuh; salin draft penting ke tempat aman.";
    }
  }
  function studioState(kind, promptId) {
    const group = studioDrafts[kind];
    if (!group.prompts[promptId]) group.prompts[promptId] = { text: "", revision: "", plan: { opening: "", detail: "", closing: "" }, checked: [], turnIndex: 0 };
    if (!Number.isInteger(group.prompts[promptId].turnIndex)) group.prompts[promptId].turnIndex = 0;
    if (!group.prompts[promptId].plan || typeof group.prompts[promptId].plan !== "object") group.prompts[promptId].plan = { opening: "", detail: "", closing: "" };
    if (typeof group.prompts[promptId].revision !== "string") group.prompts[promptId].revision = "";
    return group.prompts[promptId];
  }
  function studioWordCount(value) {
    const text = String(value || "").trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }
  function writingSignals(value) {
    const text = String(value || "").trim();
    const words = studioWordCount(text);
    const sentences = text ? text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length : 0;
    const connectors = ["because", "so", "however", "first", "then", "after", "finally", "also", "although", "therefore", "for example", "as a result", "but"];
    const normalized = " " + text.toLocaleLowerCase("en").replace(/[^a-z0-9 ]+/g, " ").replace(/\\s+/g, " ") + " ";
    const found = connectors.filter((word) => normalized.includes(" " + word + " "));
    return { words, sentences, connectors: found };
  }
  function renderWritingSignals(value) {
    const signal = writingSignals(value);
    const rows = [
      ["Sentence shape", signal.sentences >= 3, signal.sentences + " sentence" + (signal.sentences === 1 ? "" : "s") + " found"],
      ["Idea connections", signal.connectors.length > 0, signal.connectors.length ? signal.connectors.slice(0, 3).join(", ") : "Try a connector such as because, however, or as a result"],
      ["Enough material", signal.words >= 25, signal.words + " words · at least 25 needed to finish"]
    ];
    return '<div class="writing-studio-signals" aria-live="polite"><span>QUICK STRUCTURE CHECK · NOT A GRAMMAR SCORE</span><ul>' + rows.map(([label, good, detail]) =>
      '<li class="' + (good ? "is-ready" : "is-pending") + '"><strong>' + (good ? "✓ " : "○ ") + label + '</strong><small>' + escapeHtml(detail) + '</small></li>'
    ).join("") + '</ul></div>';
  }
  function buildWritingOutline() {
    if (!studioDrafts) return;
    const promptId = studioDrafts.writing.selectedPromptId;
    const state = studioState("writing", promptId);
    const parts = [state.plan.opening, state.plan.detail, state.plan.closing].map((item) => String(item || "").trim()).filter(Boolean);
    if (!parts.length) return;
    state.text = parts.join(" ") + (/[.!?]$/.test(parts[parts.length - 1]) ? "" : ".");
    saveStudioDrafts();
    renderStudios();
  }

  function renderStudioPromptButtons(kind, selectedId) {
    return STUDIO_PROMPTS[kind].map((prompt) =>
      '<button type="button" class="adventure-studio-scenario' + (prompt.id === selectedId ? ' is-active' : '') + '" data-studio-kind="' + kind + '" data-studio-prompt="' + prompt.id + '" aria-pressed="' + (prompt.id === selectedId) + '">' +
        '<span>' + prompt.level + '</span><strong>' + escapeHtml(prompt.title) + '</strong></button>'
    ).join("");
  }
  function renderStudioChecklist(kind, prompt, state) {
    return '<div class="adventure-studio-checklist">' + prompt.checks.map((label, index) =>
      '<label><input type="checkbox" data-studio-kind="' + kind + '" data-studio-prompt-id="' + prompt.id + '" data-studio-check="' + index + '"' + (state.checked.includes(index) ? ' checked' : '') + '><span>' + escapeHtml(label) + '</span></label>'
    ).join("") + '</div>';
  }
  function renderStudios() {
    if (!studioDrafts) return;
    const speakingNode = $("#adventure-speaking-studio");
    if (speakingNode) {
      const group = studioDrafts.speaking;
      const prompt = STUDIO_PROMPTS.speaking.find((item) => item.id === group.selectedPromptId) || STUDIO_PROMPTS.speaking[0];
      const state = studioState("speaking", prompt.id);
      const done = progress.studioSessions.filter((item) => item.studioType === "speaking").length;
      const turns = Array.isArray(prompt.turns) ? prompt.turns : [];
      const turnIndex = Math.max(0, Math.min(turns.length, state.turnIndex || 0));
      const conversationFinished = turns.length > 0 && turnIndex >= turns.length;
      const activeTurn = turns[turnIndex];
      const conversationPanel = conversationFinished
        ? '<div class="speaking-studio-finished" role="status"><span>CONVERSATION COMPLETE</span><strong>Great work. You carried the conversation through ' + turns.length + ' turns.</strong><p>Sekarang tinjau cara kamu menjawab. Tidak ada jawaban tunggal yang harus dihafalkan.</p><button type="button" data-speaking-restart>Ulangi percakapan</button></div>'
        : activeTurn
          ? '<div class="speaking-studio-conversation" aria-live="polite">' +
            '<div class="speaking-studio-progress"><span>TURN ' + (turnIndex + 1) + ' / ' + turns.length + '</span><span>YOUR CONVERSATION</span></div>' +
            '<div class="speaking-studio-partner"><span>YOUR PARTNER SAYS</span><blockquote>' + escapeHtml(activeTurn.partnerLine) + '</blockquote><button type="button" data-speaking-play-partner>▶ Dengarkan partner</button><small id="speaking-partner-audio-note">Dengarkan, lalu jawab dengan suara sendiri. Kamu boleh memutar ulang.</small></div>' +
            '<div class="speaking-studio-response"><span>YOUR TURN</span><strong>' + escapeHtml(activeTurn.prompt) + '</strong><details><summary>Butuh sedikit bantuan?</summary><p>' + escapeHtml(activeTurn.hint) + '</p><div class="adventure-studio-phrases">' + activeTurn.starters.map((item) => '<span>' + escapeHtml(item) + '</span>').join("") + '</div></details></div>' +
            '<button type="button" class="primary-action adventure-studio-submit" data-speaking-next-turn>Saya sudah menjawab · lanjut ↗</button>' +
          '</div>'
          : '<p class="adventure-studio-instruction">Skenario ini belum memiliki giliran percakapan.</p>';
      const reflectionPanel = conversationFinished
        ? '<div class="speaking-studio-reflection"><span>SELF-REVIEW / CHECK YOUR RESPONSE</span><p>Centang dengan jujur setelah mengucapkan semua jawaban.</p>' + renderStudioChecklist("speaking", prompt, state) + '</div>'
        : '<p class="adventure-studio-instruction">Ikuti giliran partner satu per satu. Jawab dengan kalimatmu sendiri; petunjuk hanya bantuan, bukan naskah wajib.</p>';
      speakingNode.innerHTML =
        '<div class="adventure-studio-heading"><div><span class="eyebrow">SPEAKING / SAY IT YOUR WAY</span><h3>Speaking Studio</h3><p>Latihan percakapan dua arah. Suara partner dibuat oleh browser; jawabanmu tidak direkam atau dinilai otomatis.</p></div><span class="adventure-studio-count">' + done + '<small>SESI</small></span></div>' +
        '<div class="adventure-studio-scenarios">' + renderStudioPromptButtons("speaking", prompt.id) + '</div>' +
        '<div class="adventure-studio-prompt"><span>' + prompt.level + ' · SITUATION</span><p>' + escapeHtml(prompt.context) + '</p><strong>' + escapeHtml(prompt.prompt) + '</strong><div class="adventure-studio-phrases">' + prompt.starters.map((item) => '<span>' + escapeHtml(item) + '</span>').join("") + '</div></div>' +
        conversationPanel + reflectionPanel +
        '<button type="button" class="primary-action adventure-studio-submit" data-studio-kind="speaking" data-studio-complete' + (conversationFinished && state.checked.length === prompt.checks.length ? '' : ' disabled') + '>Selesaikan dan simpan sesi ↗</button>' +
        '<small class="adventure-studio-local-note">Yang disimpan ke akun hanya bukti sesi latihan dan hasil checklist. Tidak ada suara, transkrip, atau draft jawaban yang disimpan ke cloud.</small>';
    }
    const writingNode = $("#adventure-writing-studio");
    if (writingNode) {
      const group = studioDrafts.writing;
      const prompt = STUDIO_PROMPTS.writing.find((item) => item.id === group.selectedPromptId) || STUDIO_PROMPTS.writing[0];
      const state = studioState("writing", prompt.id);
      const draftWords = studioWordCount(state.text);
      const revisionWords = studioWordCount(state.revision);
      const done = progress.studioSessions.filter((item) => item.studioType === "writing").length;
      const planField = (key, label, placeholder) =>
        '<label class="writing-studio-plan-field"><span>' + label + '</span><textarea data-writing-plan="' + key + '" rows="2" maxlength="1200" placeholder="' + placeholder + '">' + escapeHtml(state.plan[key]) + '</textarea></label>';
      const readyForReview = revisionWords >= 25;
      writingNode.innerHTML =
        '<div class="adventure-studio-heading"><div><span class="eyebrow">WRITING / PLAN · DRAFT · REVISE</span><h3>Writing Studio</h3><p>Bangun ide, tulis versi pertama, lalu revisi dengan tujuan yang jelas. Tidak ada penilaian AI atau koreksi otomatis.</p></div><span class="adventure-studio-count">' + done + '<small>SESI</small></span></div>' +
        '<div class="adventure-studio-scenarios">' + renderStudioPromptButtons("writing", prompt.id) + '</div>' +
        '<div class="adventure-studio-prompt"><span>' + prompt.level + ' · TARGET ' + escapeHtml(prompt.target) + '</span><p>' + escapeHtml(prompt.context) + '</p><strong>' + escapeHtml(prompt.prompt) + '</strong><div class="adventure-studio-phrases">' + prompt.starters.map((item) => '<span>' + escapeHtml(item) + '</span>').join("") + '</div></div>' +
        '<section class="writing-studio-stage"><div class="writing-studio-stage-heading"><span>01 / PLAN</span><strong>Put your ideas in order</strong></div><p>Tidak perlu menulis kalimat sempurna. Catat inti yang ingin kamu sampaikan.</p>' +
        '<div class="writing-studio-plan-grid">' +
          planField("opening", "OPENING / MAIN IDEA", "What is the main point or situation?") +
          planField("detail", "DETAIL / EXAMPLE", "What happened, why, or what evidence supports it?") +
          planField("closing", "CLOSING / NEXT THOUGHT", "What should the reader remember or do next?") +
        '</div><button type="button" class="writing-studio-outline-button" data-writing-build-outline>Use my outline in the draft ↗</button></section>' +
        '<section class="writing-studio-stage"><div class="writing-studio-stage-heading"><span>02 / DRAFT</span><strong>Write without over-editing</strong></div>' +
        '<label class="adventure-studio-field" for="studio-writing-draft">FIRST DRAFT <span id="studio-writing-count">' + draftWords + ' words</span></label>' +
        '<textarea id="studio-writing-draft" data-studio-kind="writing" data-studio-prompt-id="' + prompt.id + '" rows="6" maxlength="12000" placeholder="Turn your outline into a complete first draft…">' + escapeHtml(state.text) + '</textarea>' +
        '<div class="adventure-studio-draft-actions"><small>Draft tersimpan lokal pada perangkat dan akun browser ini.</small><button type="button" data-studio-kind="writing" data-studio-clear>Reset latihan</button></div></section>' +
        '<section class="writing-studio-stage"><div class="writing-studio-stage-heading"><span>03 / REVISE</span><strong>Make the message clearer</strong></div><p>Periksa urutan ide, tambahkan detail yang membantu, lalu tulis ulang dengan kata-katamu sendiri.</p>' +
        '<label class="adventure-studio-field" for="studio-writing-revision">REVISED VERSION <span id="studio-writing-revision-count">' + revisionWords + ' words</span></label>' +
        '<textarea id="studio-writing-revision" data-studio-kind="writing" data-studio-prompt-id="' + prompt.id + '" rows="7" maxlength="12000" placeholder="Write your improved version here…">' + escapeHtml(state.revision) + '</textarea>' +
        renderWritingSignals(state.revision || state.text) +
        '</section>' +
        '<section class="writing-studio-reflection"><span>SELF-REVIEW / FINAL CHECK</span><p>' + (readyForReview ? "Baca ulang versi revisimu, lalu tandai semua hal yang sudah kamu periksa." : "Tulis versi revisi minimal 25 kata untuk membuka checklist refleksi.") + '</p>' +
        (readyForReview ? renderStudioChecklist("writing", prompt, state) : '<div class="writing-studio-review-locked">Checklist terbuka setelah versi revisimu mencapai minimal 25 kata.</div>') +
        '</section>' +
        '<button type="button" class="primary-action adventure-studio-submit" data-studio-kind="writing" data-studio-complete' + (readyForReview && state.checked.length === prompt.checks.length ? '' : ' disabled') + '>Selesaikan dan simpan sesi ↗</button>' +
        '<small class="adventure-studio-local-note">Kerangka, draft, dan revisi tidak masuk ke cloud, spreadsheet, atau backup akun. Hanya ringkasan sesi yang disinkronkan.</small>';
    }
  }
  function updateStudioCompleteButton(kind) {
    const node = kind === "speaking" ? $("#adventure-speaking-studio") : $("#adventure-writing-studio");
    if (!node || !studioDrafts) return;
    const promptId = studioDrafts[kind].selectedPromptId;
    const prompt = STUDIO_PROMPTS[kind].find((item) => item.id === promptId);
    const state = studioState(kind, promptId);
    const button = $("[data-studio-complete]", node);
    if (!button || !prompt) return;
    const conversationReady = kind !== "speaking" || state.turnIndex >= (prompt.turns?.length || 0);
    const ready = state.checked.length === prompt.checks.length && conversationReady && (kind !== "writing" || studioWordCount(state.revision) >= 25);
    button.disabled = !ready;
  }
  function completeStudioPractice(kind) {
    if (!studioDrafts || !["speaking", "writing"].includes(kind)) return;
    const promptId = studioDrafts[kind].selectedPromptId;
    const prompt = STUDIO_PROMPTS[kind].find((item) => item.id === promptId);
    const state = studioState(kind, promptId);
    const words = studioWordCount(kind === "writing" ? state.revision : state.text);
    if (!prompt || state.checked.length !== prompt.checks.length || (kind === "speaking" && state.turnIndex < (prompt.turns?.length || 0)) || (kind === "writing" && words < 25)) return;
    const dateKey = localDateKey();
    const sessionId = kind + ":" + promptId + ":" + dateKey;
    const now = new Date().toISOString();
    const existing = progress.studioSessions.find((item) => item.sessionId === sessionId);
    const summary = {
      sessionId, studioType: kind, promptId,
      wordCount: kind === "writing" ? words : 0,
      checklistCompleted: prompt.checks.length,
      completedAt: existing?.completedAt || now,
      updatedAt: now
    };
    if (existing) Object.assign(existing, summary);
    else progress.studioSessions.push(summary);
    progress.studioSessions = progress.studioSessions.slice(-500);
    const skill = kind === "speaking" ? "speaking" : "writing";
    const evidenceId = "studio:" + sessionId;
    const evidence = progress.skillEvidence[skill] || (progress.skillEvidence[skill] = []);
    if (!evidence.some((item) => item.evidenceId === evidenceId)) evidence.push({
      evidenceId, missionId: "studio", sourceType: "studio", promptId,
      recordedAt: now, method: "self-reviewed"
    });
    saveProgress();
    renderAll();
  }
  function selectStudioPrompt(kind, promptId) {
    if (!STUDIO_PROMPTS[kind]?.some((item) => item.id === promptId)) return;
    studioDrafts[kind].selectedPromptId = promptId;
    saveStudioDrafts();
    renderStudios();
  }
  function updateStudioChecklist(input) {
    const kind = input.dataset.studioKind, promptId = input.dataset.studioPromptId;
    if (!studioDrafts || !["speaking", "writing"].includes(kind) || !promptId) return;
    const state = studioState(kind, promptId);
    const card = kind === "speaking" ? $("#adventure-speaking-studio") : $("#adventure-writing-studio");
    state.checked = Array.from(card.querySelectorAll("[data-studio-check]:checked"), (item) => Number(item.dataset.studioCheck)).filter((value) => Number.isInteger(value));
    state.checked = Array.from(new Set(state.checked)).sort();
    state.updatedAt = new Date().toISOString();
    saveStudioDrafts();
    updateStudioCompleteButton(kind);
  }
  function updateStudioDraft(field) {
    if (!studioDrafts || !field) return;
    const promptId = field.dataset.studioPromptId || studioDrafts.writing.selectedPromptId;
    const state = studioState("writing", promptId);
    state.updatedAt = new Date().toISOString();
    if (field.matches("[data-writing-plan]")) {
      const key = field.dataset.writingPlan;
      if (["opening", "detail", "closing"].includes(key)) state.plan[key] = String(field.value || "").slice(0, 1200);
    } else if (field.id === "studio-writing-draft") {
      state.text = String(field.value || "").slice(0, 12000);
      const count = $("#studio-writing-count");
      if (count) count.textContent = studioWordCount(state.text) + " words";
    } else if (field.id === "studio-writing-revision") {
      state.revision = String(field.value || "").slice(0, 12000);
      const count = $("#studio-writing-revision-count");
      if (count) count.textContent = studioWordCount(state.revision) + " words";
      const signals = $(".writing-studio-signals");
      if (signals) signals.outerHTML = renderWritingSignals(state.revision || state.text);
      if (studioWordCount(state.revision) >= 25 && !$(".writing-studio-reflection [data-studio-check]")) {
        const prompt = STUDIO_PROMPTS.writing.find((item) => item.id === promptId);
        const review = $(".writing-studio-reflection");
        if (review && prompt) {
          const intro = review.querySelector("p");
          if (intro) intro.textContent = "Baca ulang versi revisimu, lalu tandai semua hal yang sudah kamu periksa.";
          const locked = review.querySelector(".writing-studio-review-locked");
          if (locked) locked.outerHTML = renderStudioChecklist("writing", prompt, state);
        }
      } else if (studioWordCount(state.revision) < 25) {
        state.checked = [];
        const review = $(".writing-studio-reflection");
        if (review) {
          const intro = review.querySelector("p");
          if (intro) intro.textContent = "Tulis versi revisi minimal 25 kata untuk membuka checklist refleksi.";
          const checks = review.querySelector(".adventure-studio-checklist");
          if (checks) checks.outerHTML = '<div class="writing-studio-review-locked">Checklist terbuka setelah versi revisimu mencapai minimal 25 kata.</div>';
        }
      }
    }
    saveStudioDrafts();
    updateStudioCompleteButton("writing");
  }


  function playSpeakingPartner() {
    if (!studioDrafts) return;
    const promptId = studioDrafts.speaking.selectedPromptId;
    const prompt = STUDIO_PROMPTS.speaking.find((item) => item.id === promptId);
    const state = prompt && studioState("speaking", promptId);
    const turn = prompt && prompt.turns && prompt.turns[state.turnIndex];
    if (!turn) return;
    const played = playText(turn.partnerLine);
    const note = $("#speaking-partner-audio-note", $("#adventure-speaking-studio"));
    if (note) note.textContent = played
      ? "Suara partner diputar oleh browser. Kamu boleh mendengarkan lagi sebelum menjawab."
      : "Suara browser tidak tersedia. Baca kalimat partner di atas, lalu jawab dengan suara sendiri.";
  }
  function advanceSpeakingTurn() {
    if (!studioDrafts) return;
    const promptId = studioDrafts.speaking.selectedPromptId;
    const prompt = STUDIO_PROMPTS.speaking.find((item) => item.id === promptId);
    if (!prompt || !Array.isArray(prompt.turns)) return;
    const state = studioState("speaking", promptId);
    if (state.turnIndex >= prompt.turns.length) return;
    state.turnIndex += 1;
    saveStudioDrafts();
    renderStudios();
  }
  function restartSpeakingPractice() {
    if (!studioDrafts) return;
    const promptId = studioDrafts.speaking.selectedPromptId;
    const state = studioState("speaking", promptId);
    state.turnIndex = 0;
    state.checked = [];
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
    saveStudioDrafts();
    renderStudios();
  }

  function storyEntry(storyId) {
    return progress.storyProgress[storyId] && typeof progress.storyProgress[storyId] === "object"
      ? progress.storyProgress[storyId]
      : { attempts: [], bestScore: 0, completedAt: null, updatedAt: null };
  }

  function renderStoryLibrary() {
    const node = $("#adventure-story-library");
    if (!node) return;
    if (storyRun) { renderStoryRun(node); return; }
    if (!storiesLoaded) {
      node.innerHTML = '<div class="adventure-extra-heading"><div><span class="eyebrow">READ · LISTEN · UNDERSTAND</span><h3>Everyday Stories</h3><p>Cerita pendek untuk melihat bahasa bekerja dalam situasi sehari-hari.</p></div></div><p class="adventure-story-empty">Menyiapkan koleksi cerita…</p>';
      return;
    }
    if (storyLoadError) {
      node.innerHTML = '<div class="adventure-extra-heading"><div><span class="eyebrow">READ · LISTEN · UNDERSTAND</span><h3>Everyday Stories</h3><p>Cerita pendek untuk melihat bahasa bekerja dalam situasi sehari-hari.</p></div></div><p class="adventure-story-empty">' + escapeHtml(storyLoadError) + '</p><button class="adventure-story-back" type="button" data-story-reload>Muat ulang cerita</button>';
      return;
    }
    const completed = stories.filter((story) => Boolean(storyEntry(story.id).completedAt)).length;
    const cards = stories.map((story) => {
      const entry = storyEntry(story.id);
      const done = Boolean(entry.completedAt);
      const attempts = Array.isArray(entry.attempts) ? entry.attempts.length : 0;
      const best = Number(entry.bestScore) || 0;
      return '<article class="adventure-story-card">' +
        '<div class="adventure-story-card-top"><span class="adventure-story-level">' + escapeHtml(story.level) + '</span><span class="adventure-story-status">' + (done ? 'SELESAI ✓' : attempts ? 'PERNAH DICOBA' : 'CERITA BARU') + '</span></div>' +
        '<h4>' + escapeHtml(story.title) + '</h4><p>' + escapeHtml(story.subtitle) + '</p>' +
        '<div class="adventure-story-card-meta"><span>' + escapeHtml(String(story.estimatedMinutes || 5)) + ' MENIT</span><span>' + attempts + ' percobaan' + (attempts ? ' · terbaik ' + best + '/' + (story.questions?.length || 3) : '') + '</span></div>' +
        '<button type="button" data-story-open="' + escapeHtml(story.id) + '">' + (done ? 'Baca lagi ↗' : attempts ? 'Lanjut berlatih ↗' : 'Buka cerita ↗') + '</button>' +
      '</article>';
    }).join("");
    node.innerHTML =
      '<div class="adventure-story-heading"><div><span class="eyebrow">READ · LISTEN · UNDERSTAND</span><h3>Everyday Stories</h3><p>Mulai dari cerita sederhana, amati kosakata dalam konteks, lalu jawab pertanyaan berdasarkan isi bacaan. Audio browser tersedia sebagai latihan tambahan.</p></div><span class="adventure-story-count">' + completed + '/' + stories.length + '<small>SELESAI</small></span></div>' +
      (cards ? '<div class="adventure-story-grid">' + cards + '</div>' : '<p class="adventure-story-empty">Belum ada cerita tersedia.</p>');
  }

  function renderLearningPathLinks(path) {
    if (!path || typeof path !== "object") return "";
    const actions = [];
    if (storiesLoaded && Array.isArray(stories) && stories.some((item) => item.id === path.storyId)) {
      actions.push('<button type="button" data-learning-path-link data-story-open="' + escapeHtml(path.storyId) + '">Baca cerita terkait</button>');
    }
    if (dialoguesLoaded && Array.isArray(dialogues) && dialogues.some((item) => item.id === path.dialogueId)) {
      actions.push('<button type="button" data-learning-path-link data-dialogue-open="' + escapeHtml(path.dialogueId) + '">Dengarkan dialog</button>');
    }
    if (listeningLoaded && Array.isArray(listeningExercises) && listeningExercises.some((item) => item.id === path.listeningId)) {
      actions.push('<button type="button" data-learning-path-link data-listening-open="' + escapeHtml(path.listeningId) + '">Latihan listening</button>');
    }
    if (pronunciationLoaded && Array.isArray(pronunciationExercises) && pronunciationExercises.some((item) => item.id === path.pronunciationId)) {
      actions.push('<button type="button" data-learning-path-link data-pronunciation-open="' + escapeHtml(path.pronunciationId) + '">Latihan pronunciation</button>');
    }
    if (studioDrafts && STUDIO_PROMPTS.speaking.some((item) => item.id === path.speakingPromptId)) {
      actions.push('<button type="button" data-learning-path-link data-studio-kind="speaking" data-studio-prompt="' + escapeHtml(path.speakingPromptId) + '">Lanjut ke Speaking Studio</button>');
    }
    if (studioDrafts && STUDIO_PROMPTS.writing.some((item) => item.id === path.writingPromptId)) {
      actions.push('<button type="button" data-learning-path-link data-studio-kind="writing" data-studio-prompt="' + escapeHtml(path.writingPromptId) + '">Lanjut ke Writing Studio</button>');
    }
    if (!actions.length) return "";
    return '<section class="adventure-learning-path" aria-label="Jalur belajar lanjutan"><span>LANJUTKAN JALUR BELAJAR</span><p>Hubungkan latihan ini dengan keterampilan lain.</p><div>' + actions.join("") + '</div></section>';
  }

  function renderStoryRun(node) {
    const story = stories.find((item) => item.id === storyRun.storyId);
    if (!story) { storyRun = null; renderStoryLibrary(); return; }
    if (storyRun.stage === "result") {
      const passed = Boolean(storyRun.result?.passed);
      node.innerHTML =
        '<div class="adventure-story-result" id="adventure-story-result">' +
          '<span class="adventure-story-level">' + escapeHtml(story.level) + '</span>' +
          '<div class="adventure-story-result-mark">' + (passed ? '✓' : '↻') + '</div>' +
          '<h4>' + (passed ? 'Cerita selesai dipahami.' : 'Coba baca sekali lagi.') + '</h4>' +
          '<p>Skormu <strong>' + storyRun.result.score + '/' + storyRun.result.total + '</strong>. ' +
          (passed ? 'Kamu menjawab setidaknya dua pertanyaan dengan tepat. Cerita ini tercatat sebagai selesai.' : 'Jawaban yang tepat sudah dijelaskan. Ulangi cerita untuk memperkuat pemahaman.') + '</p>' +
          '<div class="adventure-story-result-actions"><button class="adventure-story-retry" type="button" data-story-retry="' + escapeHtml(story.id) + '">Ulangi cerita ↗</button><button class="adventure-story-back" type="button" data-story-close>Kembali ke koleksi</button></div>' +
        renderLearningPathLinks(story.learningPath) +
        '</div>';
      return;
    }
    const question = story.questions[storyRun.questionIndex];
    const answered = storyRun.locked;
    const choices = question.options.map((option, index) => {
      const correct = index === question.answer;
      const chosen = index === storyRun.selectedAnswer;
      return '<button type="button" class="adventure-story-option' + (answered && correct ? ' is-correct' : '') + (answered && chosen && !correct ? ' is-wrong' : '') + '" data-story-answer="' + index + '"' + (answered ? ' disabled' : '') + '><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>';
    }).join("");
    const storySentences = getStorySentences(story);
    const paragraphs = story.paragraphs.map((paragraph, pIdx) => {
      const pSentences = storySentences.filter(s => s.paragraphIndex === pIdx);
      const inner = pSentences.map(s => {
        const wordsHtml = s.text.replace(/([A-Za-z]+(?:'[A-Za-z]+)?)/g, w => {
          const isSaved = window.sinauuIsWordSaved ? window.sinauuIsWordSaved(w.toLowerCase()) : false;
          return '<span class="context-word' + (isSaved ? ' is-saved' : '') + '" data-word="' + escapeHtml(w) + '" data-sentence="' + escapeHtml(s.text) + '" data-source="' + escapeHtml(story.title) + '" tabindex="0" role="button">' + escapeHtml(w) + '</span>';
        });
        const isSpeaking = storyNarration.active && storyNarration.currentIndex === s.globalIndex;
        return '<span class="story-sentence' + (isSpeaking ? ' is-speaking-sentence' : '') + '" data-story-sentence-id="' + s.id + '">' + wordsHtml + '</span>';
      }).join(" ");
      return '<p>' + inner + '</p>';
    }).join("");
    const vocabulary = story.focusWords.map((word) => '<span class="adventure-story-word"><strong>' + escapeHtml(word.word) + '</strong><span>' + escapeHtml(word.meaning) + '</span></span>').join("");
    const note = storyRun.audioUnavailable ? '<small>Suara browser tidak tersedia di perangkat ini. Kamu tetap bisa membaca cerita seperti biasa.</small>' : '<small>Suara dibuat oleh browser dan tidak direkam atau diunggah.</small>';
    let audioControls = '';
    if (!storyNarration.active) {
      audioControls = '<button class="primary-action adventure-story-listen" type="button" data-story-listen><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Dengarkan cerita</button>';
    } else {
      audioControls = '<button class="primary-action" type="button" data-story-pause>' + (storyNarration.paused ? '▶ Lanjutkan' : '⏸ Jeda') + '</button>' +
        '<button class="secondary-action" type="button" data-story-stop>⏹ Berhenti</button>';
    }
    audioControls += '<button class="secondary-action" type="button" data-open-voice-modal="story" title="Atur suara narator dan karakter"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Suara Karakter</button>';
    node.innerHTML =
      '<div class="adventure-story-reader" id="adventure-story-reader">' +
        '<div class="adventure-story-reader-top"><div class="adventure-story-reader-meta"><span>' + escapeHtml(story.level) + '</span><span>·</span><span>' + escapeHtml(String(story.estimatedMinutes || 5)) + ' MENIT</span></div><button class="adventure-story-back" type="button" data-story-close>← Koleksi</button></div>' +
        '<h3 class="adventure-story-title">' + escapeHtml(story.title) + '</h3><p class="adventure-story-subtitle">' + escapeHtml(story.subtitle) + '</p>' +
        '<div class="adventure-story-text">' + paragraphs + '</div>' +
        '<div class="adventure-story-audio"><div class="adventure-audio-actions">' + audioControls + '</div>' + note + '</div>' +
        '<div class="adventure-story-vocabulary">' + vocabulary + '</div>' +
        '<section class="adventure-story-quiz" aria-labelledby="adventure-story-question">' +
          '<div class="adventure-story-quiz-meta"><span>COMPREHENSION CHECK</span><span>SOAL ' + (storyRun.questionIndex + 1) + '/' + story.questions.length + '</span></div>' +
          '<div class="adventure-story-progress"><i style="width:' + Math.round((storyRun.questionIndex + 1) / story.questions.length * 100) + '%"></i></div>' +
          '<h4 id="adventure-story-question">' + escapeHtml(question.prompt) + '</h4>' +
          '<div class="adventure-story-options">' + choices + '</div>' +
          (answered ? '<div class="adventure-story-feedback' + (storyRun.isCorrect ? '' : ' is-wrong') + '" role="status"><strong>' + (storyRun.isCorrect ? 'Tepat.' : 'Belum tepat.') + '</strong>' + escapeHtml(question.explanation) + (!storyRun.isCorrect ? '<br>Jawaban: ' + escapeHtml(question.options[question.answer]) : '') + '</div>' : '') +
          (answered ? '<div class="adventure-story-actions"><button class="adventure-story-next" type="button" data-story-next>' + (storyRun.questionIndex === story.questions.length - 1 ? 'Lihat hasil →' : 'Soal berikutnya →') + '</button></div>' : '') +
        '</section>' +
      '</div>';
  }

  async function loadStories() {
    try {
      const response = await fetch("/data/adventure/stories.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Koleksi cerita belum dapat dimuat.");
      const data = await response.json();
      if (!data || data.schemaVersion !== 1 || !Array.isArray(data.stories)) throw new Error("Format Everyday Stories tidak sesuai.");
      const ids = new Set();
      stories = data.stories.filter((story) => {
        const valid = story && typeof story.id === "string" && story.id && !ids.has(story.id) &&
          typeof story.title === "string" && ["A1", "A2", "B1", "B2"].includes(story.level) &&
          Array.isArray(story.paragraphs) && story.paragraphs.length > 0 && story.paragraphs.every((item) => typeof item === "string") &&
          Array.isArray(story.focusWords) && Array.isArray(story.questions) && story.questions.length >= 3 &&
          story.questions.every((question) => question && Array.isArray(question.options) && question.options.length >= 2 && Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
        if (valid) ids.add(story.id);
        return valid;
      });
      if (stories.length !== data.stories.length) throw new Error("Sebagian cerita tidak lolos pemeriksaan struktur.");
      storiesLoaded = true;
      storyLoadError = "";
      renderStoryLibrary();
    } catch (error) {
      storiesLoaded = true;
      storyLoadError = error instanceof Error ? error.message : "Koleksi cerita belum dapat dimuat.";
      renderStoryLibrary();
    }
  }

  function openStory(storyId) {
    stopStoryNarration();
    if (!stories.some((item) => item.id === storyId)) return;
    storyRun = { storyId, stage: "reading", questionIndex: 0, answers: [], locked: false, selectedAnswer: null, isCorrect: false, audioUnavailable: false };
    renderStoryLibrary();
  }

  function answerStory(answerIndex) {
    if (!storyRun || storyRun.stage !== "reading" || storyRun.locked) return;
    const story = stories.find((item) => item.id === storyRun.storyId);
    const question = story && story.questions[storyRun.questionIndex];
    if (!question || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length) return;
    storyRun.selectedAnswer = answerIndex;
    storyRun.isCorrect = answerIndex === question.answer;
    storyRun.locked = true;
    storyRun.answers.push({ questionId: question.id, correct: storyRun.isCorrect });
    renderStoryLibrary();
  }

  function finishStory() {
    if (!storyRun || storyRun.stage !== "reading") return;
    const story = stories.find((item) => item.id === storyRun.storyId);
    if (!story || storyRun.answers.length !== story.questions.length) return;
    const score = storyRun.answers.filter((answer) => answer.correct).length;
    const total = story.questions.length;
    const passed = score >= Math.ceil(total * 2 / 3);
    const completedAt = new Date().toISOString();
    const entry = storyEntry(story.id);
    const attempt = { attemptId: makeId(), score, total, passed, completedAt };
    entry.attempts = [...(entry.attempts || []), attempt].slice(-100);
    entry.bestScore = Math.max(Number(entry.bestScore) || 0, score);
    if (passed && !entry.completedAt) entry.completedAt = completedAt;
    entry.updatedAt = completedAt;
    progress.storyProgress[story.id] = entry;
    saveProgress();
    storyRun.stage = "result";
    storyRun.result = { score, total, passed };
    renderStoryLibrary();
  }

  function advanceStory() {
    if (!storyRun || !storyRun.locked || storyRun.stage !== "reading") return;
    const story = stories.find((item) => item.id === storyRun.storyId);
    if (!story) return;
    if (storyRun.questionIndex >= story.questions.length - 1) {
      finishStory();
      return;
    }
    storyRun.questionIndex += 1;
    storyRun.locked = false;
    storyRun.selectedAnswer = null;
    storyRun.isCorrect = false;
    renderStoryLibrary();
  }

  function listenToStory() {
    if (!storyRun || storyRun.stage !== "reading") return;
    const story = stories.find((item) => item.id === storyRun.storyId);
    if (!story) return;
    storyRun.audioUnavailable = !playText(story.paragraphs.join(" "));
    renderStoryLibrary();
  }


  function listeningEntry(exerciseId) {
    return progress.listeningProgress[exerciseId] && typeof progress.listeningProgress[exerciseId] === "object"
      ? progress.listeningProgress[exerciseId]
      : { attempts: [], bestScore: 0, completedAt: null, updatedAt: null };
  }

  function renderListeningLab() {
    const node = $("#adventure-listening-lab");
    if (!node) return;
    if (listeningRun) { renderListeningRun(node); return; }
    if (!listeningLoaded) {
      node.innerHTML = '<div class="listening-lab-heading"><div><span class="eyebrow">LISTEN IN LAYERS</span><h3>Listening Lab</h3><p>Latih telinga secara bertahap: gagasan utama, detail, lalu maksud pembicara.</p></div></div><p class="listening-lab-empty">Menyiapkan latihan listening…</p>';
      return;
    }
    if (listeningLoadError) {
      node.innerHTML = '<div class="listening-lab-heading"><div><span class="eyebrow">LISTEN IN LAYERS</span><h3>Listening Lab</h3><p>Latih telinga secara bertahap: gagasan utama, detail, lalu maksud pembicara.</p></div></div><p class="listening-lab-empty">' + escapeHtml(listeningLoadError) + '</p><button class="listening-lab-button" type="button" data-listening-reload>Muat ulang latihan</button>';
      return;
    }
    const completed = listeningExercises.filter((exercise) => Boolean(listeningEntry(exercise.id).completedAt)).length;
    const cards = listeningExercises.map((exercise) => {
      const entry = listeningEntry(exercise.id);
      const done = Boolean(entry.completedAt);
      const attempts = Array.isArray(entry.attempts) ? entry.attempts.length : 0;
      const best = Number(entry.bestScore) || 0;
      return '<article class="listening-lab-card">' +
        '<div class="listening-lab-card-top"><span class="adventure-story-level">' + escapeHtml(exercise.level) + '</span><span class="adventure-story-status">' + (done ? 'SELESAI ✓' : attempts ? 'PERNAH DICOBA' : 'LATIHAN BARU') + '</span></div>' +
        '<h4>' + escapeHtml(exercise.title) + '</h4><p>' + escapeHtml(exercise.subtitle) + '</p>' +
        '<div class="listening-lab-card-meta"><span>' + escapeHtml(String(exercise.estimatedMinutes || 5)) + ' MENIT</span><span>' + attempts + ' percobaan' + (attempts ? ' · terbaik ' + best + '/' + exercise.stages.length : '') + '</span></div>' +
        '<button class="listening-lab-button" type="button" data-listening-open="' + escapeHtml(exercise.id) + '">' + (done ? 'Dengarkan lagi ↗' : attempts ? 'Lanjut berlatih ↗' : 'Mulai latihan ↗') + '</button>' +
      '</article>';
    }).join("");
    node.innerHTML =
      '<div class="listening-lab-heading"><div><span class="eyebrow">LISTEN IN LAYERS / A1–B2</span><h3>Listening Lab</h3><p>Dengarkan tanpa teks terlebih dahulu. Setelah menangkap gagasan utama, cari detail penting, lalu simpulkan maksud pembicara. Transkrip tersedia sebagai bahan evaluasi.</p></div><span class="adventure-story-count">' + completed + '/' + listeningExercises.length + '<small>SELESAI</small></span></div>' +
      (cards ? '<div class="listening-lab-grid">' + cards + '</div>' : '<p class="listening-lab-empty">Belum ada latihan tersedia.</p>');
  }

  function renderListeningRun(node) {
    const exercise = listeningExercises.find((item) => item.id === listeningRun.exerciseId);
    if (!exercise) { listeningRun = null; renderListeningLab(); return; }
    if (listeningRun.stage === "result") {
      const passed = Boolean(listeningRun.result?.passed);
      node.innerHTML =
        '<div class="listening-lab-result" id="listening-lab-result">' +
          '<span class="adventure-story-level">' + escapeHtml(exercise.level) + '</span>' +
          '<div class="adventure-story-result-mark">' + (passed ? '✓' : '↻') + '</div>' +
          '<h4>' + (passed ? 'Kamu menangkap isi percakapan.' : 'Coba dengarkan sekali lagi.') + '</h4>' +
          '<p>Jawaban tepat: <strong>' + listeningRun.result.score + '/' + listeningRun.result.total + '</strong>. ' +
          (passed ? 'Latihan ini tercatat selesai. Ulangi kapan pun untuk memperkuat pemahaman.' : 'Pelajari penjelasannya, lalu coba lagi dengan kecepatan audio yang nyaman.') + '</p>' +
          '<div class="listening-lab-result-actions"><button class="listening-lab-button" type="button" data-listening-retry="' + escapeHtml(exercise.id) + '">Ulangi latihan ↗</button><button class="listening-lab-button is-secondary" type="button" data-listening-close>Kembali ke koleksi</button></div>' +
        renderLearningPathLinks(exercise.learningPath) +
        '</div>';
      return;
    }
    const stage = exercise.stages[listeningRun.stageIndex];
    const answered = listeningRun.locked;
    const stageLabels = { gist: "GAGASAN UTAMA", detail: "DETAIL PENTING", inference: "MAKSUD PEMBICARA" };
    const stageChoices = stage.options.map((option, index) => {
      const correct = index === stage.answer;
      const chosen = index === listeningRun.selectedAnswer;
      return '<button type="button" class="listening-lab-option' + (answered && correct ? ' is-correct' : '') + (answered && chosen && !correct ? ' is-wrong' : '') + '" data-listening-answer="' + index + '"' + (answered ? ' disabled' : '') + '><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>';
    }).join("");
    const transcript = listeningRun.transcriptVisible
      ? '<div class="listening-lab-transcript" id="listening-lab-transcript">' + exercise.transcript.map((line) => '<p><strong>' + escapeHtml(line.speaker) + '</strong><span>' + escapeHtml(line.text) + '</span></p>').join("") + '</div>'
      : "";
    const vocabulary = exercise.focusWords.map((word) => '<span class="listening-lab-word"><strong>' + escapeHtml(word.word) + '</strong><span>' + escapeHtml(word.meaning) + '</span></span>').join("");
    const rateButtons = [0.75, 0.9, 1].map((rate) => '<button type="button" data-listening-rate="' + rate + '" aria-pressed="' + (Number(progress.listeningRate) === rate) + '">' + (rate === 1 ? '1×' : rate.toFixed(2).replace(/0$/, '') + '×') + '</button>').join("");
    const audioNote = listeningRun.audioUnavailable
      ? '<small>Suara browser tidak tersedia di perangkat ini. Buka transkrip untuk tetap melanjutkan latihan.</small>'
      : '<small>Audio disuarakan oleh browser; tidak ada rekaman mikrofon atau audio yang diunggah. Dengarkan dulu sebelum membuka transkrip.</small>';
    node.innerHTML =
      '<div class="listening-lab-reader" id="listening-lab-reader">' +
        '<div class="listening-lab-reader-top"><div class="adventure-story-reader-meta"><span>' + escapeHtml(exercise.level) + '</span><span>·</span><span>' + escapeHtml(String(exercise.estimatedMinutes || 5)) + ' MENIT</span></div><button class="listening-lab-button is-secondary" type="button" data-listening-close>← Koleksi</button></div>' +
        '<h3 class="listening-lab-title">' + escapeHtml(exercise.title) + '</h3><p class="listening-lab-setting">' + escapeHtml(exercise.setting) + '</p>' +
        '<div class="listening-lab-stage-top"><span>' + escapeHtml(stageLabels[stage.kind] || "LISTENING CHECK") + '</span><strong>TAHAP ' + (listeningRun.stageIndex + 1) + '/' + exercise.stages.length + '</strong></div>' +
        '<div class="adventure-story-progress"><i style="width:' + Math.round((listeningRun.stageIndex + 1) / exercise.stages.length * 100) + '%"></i></div>' +
        '<div class="listening-lab-stage-track">' + exercise.stages.map((item, index) => '<span class="' + (index < listeningRun.stageIndex ? 'is-done' : index === listeningRun.stageIndex ? 'is-active' : '') + '">' + (index + 1) + '</span>').join("") + '</div>' +
        '<div class="listening-lab-stage-label">' + escapeHtml(stage.label) + '</div>' +
        '<div class="listening-lab-player"><button class="listening-lab-play" type="button" data-listening-play>▶ Dengarkan audio</button><div class="listening-lab-speed"><span>KECEPATAN</span>' + rateButtons + '</div>' + audioNote + '</div>' +
        '<h4 class="listening-lab-question">' + escapeHtml(stage.prompt) + '</h4>' +
        '<div class="listening-lab-options">' + stageChoices + '</div>' +
        (answered ? '<div class="listening-lab-feedback' + (listeningRun.isCorrect ? '' : ' is-wrong') + '" role="status"><strong>' + (listeningRun.isCorrect ? 'Tepat.' : 'Belum tepat.') + '</strong>' + escapeHtml(stage.explanation) + (!listeningRun.isCorrect ? '<br>Jawaban: ' + escapeHtml(stage.options[stage.answer]) : '') + '</div>' : '') +
        (answered ? '<div class="listening-lab-actions"><button class="listening-lab-button" type="button" data-listening-next>' + (listeningRun.stageIndex === exercise.stages.length - 1 ? 'Lihat hasil →' : 'Tahap berikutnya →') + '</button></div>' : '') +
        '<div class="listening-lab-transcript-tools"><button class="listening-lab-transcript-toggle" type="button" data-listening-transcript>' + (listeningRun.transcriptVisible ? 'Sembunyikan transkrip' : 'Buka transkrip') + '</button><span>Gunakan setelah mencoba memahami audio.</span></div>' +
        transcript +
        '<div class="listening-lab-vocabulary">' + vocabulary + '</div>' +
      '</div>';
  }

  async function loadListeningLab() {
    try {
      const response = await fetch("/data/adventure/listening.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Koleksi Listening Lab belum dapat dimuat.");
      const data = await response.json();
      if (!data || data.schemaVersion !== 1 || !Array.isArray(data.exercises)) throw new Error("Format Listening Lab tidak sesuai.");
      const ids = new Set();
      listeningExercises = data.exercises.filter((exercise) => {
        const valid = exercise && typeof exercise.id === "string" && exercise.id && !ids.has(exercise.id) &&
          typeof exercise.title === "string" && ["A1", "A2", "B1", "B2"].includes(exercise.level) &&
          Array.isArray(exercise.transcript) && exercise.transcript.length >= 4 &&
          exercise.transcript.every((line) => line && typeof line.speaker === "string" && typeof line.text === "string") &&
          Array.isArray(exercise.focusWords) && exercise.focusWords.length >= 3 &&
          Array.isArray(exercise.stages) && exercise.stages.length === 3 &&
          exercise.stages.every((stage) => stage && typeof stage.id === "string" && ["gist", "detail", "inference"].includes(stage.kind) &&
            typeof stage.audioText === "string" && stage.audioText.trim() && typeof stage.prompt === "string" &&
            Array.isArray(stage.options) && stage.options.length >= 3 && Number.isInteger(stage.answer) &&
            stage.answer >= 0 && stage.answer < stage.options.length && typeof stage.explanation === "string");
        if (valid) ids.add(exercise.id);
        return valid;
      });
      if (listeningExercises.length !== data.exercises.length) throw new Error("Sebagian latihan tidak lolos pemeriksaan struktur.");
      listeningLoaded = true;
      listeningLoadError = "";
      renderListeningLab();
    } catch (error) {
      listeningLoaded = true;
      listeningLoadError = error instanceof Error ? error.message : "Listening Lab belum dapat dimuat.";
      renderListeningLab();
    }
  }

  function openListening(exerciseId) {
    if (!listeningExercises.some((item) => item.id === exerciseId)) return;
    listeningRun = { exerciseId, stage: "practice", stageIndex: 0, answers: [], locked: false, selectedAnswer: null, isCorrect: false, transcriptVisible: false, audioUnavailable: false };
    renderListeningLab();
  }

  function playListeningStage() {
    if (!listeningRun || listeningRun.stage !== "practice") return;
    const exercise = listeningExercises.find((item) => item.id === listeningRun.exerciseId);
    const stage = exercise && exercise.stages[listeningRun.stageIndex];
    if (!stage) return;
    listeningRun.audioUnavailable = !playText(stage.audioText);
    if (listeningRun.audioUnavailable) listeningRun.transcriptVisible = true;
    renderListeningLab();
  }

  function answerListening(answerIndex) {
    if (!listeningRun || listeningRun.stage !== "practice" || listeningRun.locked) return;
    const exercise = listeningExercises.find((item) => item.id === listeningRun.exerciseId);
    const stage = exercise && exercise.stages[listeningRun.stageIndex];
    if (!stage || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= stage.options.length) return;
    listeningRun.selectedAnswer = answerIndex;
    listeningRun.isCorrect = answerIndex === stage.answer;
    listeningRun.locked = true;
    listeningRun.answers.push({ stageId: stage.id, correct: listeningRun.isCorrect });
    renderListeningLab();
  }

  function finishListening() {
    if (!listeningRun || listeningRun.stage !== "practice") return;
    const exercise = listeningExercises.find((item) => item.id === listeningRun.exerciseId);
    if (!exercise || listeningRun.answers.length !== exercise.stages.length) return;
    const score = listeningRun.answers.filter((answer) => answer.correct).length;
    const total = exercise.stages.length;
    const passed = score >= Math.ceil(total * 2 / 3);
    const completedAt = new Date().toISOString();
    const entry = listeningEntry(exercise.id);
    const attempt = { attemptId: makeId(), score, total, passed, completedAt };
    entry.attempts = [...(entry.attempts || []), attempt].slice(-100);
    entry.bestScore = Math.max(Number(entry.bestScore) || 0, score);
    if (passed && !entry.completedAt) entry.completedAt = completedAt;
    entry.updatedAt = completedAt;
    progress.listeningProgress[exercise.id] = entry;
    saveProgress();
    listeningRun.stage = "result";
    listeningRun.result = { score, total, passed };
    renderListeningLab();
  }

  function advanceListening() {
    if (!listeningRun || !listeningRun.locked || listeningRun.stage !== "practice") return;
    const exercise = listeningExercises.find((item) => item.id === listeningRun.exerciseId);
    if (!exercise) return;
    if (listeningRun.stageIndex >= exercise.stages.length - 1) { finishListening(); return; }
    listeningRun.stageIndex += 1;
    listeningRun.locked = false;
    listeningRun.selectedAnswer = null;
    listeningRun.isCorrect = false;
    listeningRun.transcriptVisible = false;
    listeningRun.audioUnavailable = false;
    renderListeningLab();
  }


  function pronunciationEntry(phraseId) {
    return progress.pronunciationProgress[phraseId] && typeof progress.pronunciationProgress[phraseId] === "object"
      ? progress.pronunciationProgress[phraseId]
      : { attempts: [], updatedAt: null };
  }

  function renderStressedGroup(group) {
    return String(group || "").split(/(\s+)/).map((token) => {
      if (!token.trim()) return token;
      const clean = token.replace(/[.,?!;:]+$/, "");
      const stressed = /[A-Z]/.test(clean) && clean === clean.toLocaleUpperCase("en");
      const punctuation = token.slice(clean.length);
      return stressed
        ? "<strong>" + escapeHtml(clean) + "</strong>" + escapeHtml(punctuation)
        : escapeHtml(token);
    }).join("");
  }

  function pronunciationFeedback(exercise, metrics) {
    const notes = [];
    if (!metrics || metrics.voicedFrames < 3) return ["Suara belum terdeteksi dengan cukup jelas. Periksa izin mikrofon, jarak ke mikrofon, dan kebisingan sekitar, lalu coba lagi."];
    if (metrics.durationMs / 1000 < exercise.targetSeconds * 0.62) notes.push("Rekaman lebih singkat dari target latihan. Coba beri ruang pada setiap kelompok kata.");
    else if (metrics.durationMs / 1000 > exercise.targetSeconds * 1.65) notes.push("Rekaman lebih panjang dari target latihan. Coba jaga aliran kalimat tanpa mempercepat kata penting.");
    if (metrics.pauseCount >= Math.max(3, exercise.phraseGroups.length + 1)) notes.push("Ada beberapa jeda panjang. Latih pengelompokan frasa agar kata-kata dalam satu kelompok mengalir bersama.");
    else notes.push("Aliran suara terdeteksi cukup menyambung. Pertahankan batas jeda pada kelompok makna, bukan di setiap kata.");
    if (metrics.meanRms < 0.012) notes.push("Energi suara yang tertangkap relatif rendah. Coba bicara sedikit lebih jelas atau dekatkan mikrofon.");
    else if (metrics.meanRms > 0.12) notes.push("Energi suara yang tertangkap cukup tinggi. Jaga jarak mikrofon dan hindari berteriak.");
    if (Number.isFinite(metrics.pitchRangeSemitones)) {
      if (metrics.pitchRangeSemitones < 1.3) notes.push("Perubahan tinggi nada pada rekaman cukup sempit. Coba ikuti petunjuk intonasi dan contoh suara sekali lagi.");
      else if (metrics.pitchRangeSemitones > 9) notes.push("Perubahan tinggi nada cukup lebar. Pastikan penekanan tetap alami dan tidak setiap kata terdengar ditekankan.");
      else notes.push("Ada variasi tinggi nada yang terukur. Bandingkan kontur ini dengan petunjuk naik-turun pada latihan.");
    } else {
      notes.push("Kontur tinggi nada belum cukup jelas untuk dianalisis. Rekam kembali di lingkungan yang lebih tenang.");
    }
    notes.push("Ini analisis energi, jeda, tempo, dan kontur nada—bukan pemeriksaan fonem atau penilaian otomatis bahwa setiap kata sudah diucapkan benar.");
    return notes;
  }

  function renderPronunciationStudio() {
    const node = $("#adventure-pronunciation-studio");
    if (!node) return;
    if (pronunciationRun) { renderPronunciationRun(node); return; }
    if (!pronunciationLoaded) {
      node.innerHTML = '<div class="pronunciation-studio-heading"><div><span class="eyebrow">SPEAK · NOTICE · REFINE</span><h3>Pronunciation Studio</h3><p>Latih tekanan kata dan intonasi dengan contoh suara, lalu amati rekaman mikrofon secara lokal.</p></div></div><p class="pronunciation-studio-empty">Menyiapkan latihan pengucapan…</p>';
      return;
    }
    if (pronunciationLoadError) {
      node.innerHTML = '<div class="pronunciation-studio-heading"><div><span class="eyebrow">SPEAK · NOTICE · REFINE</span><h3>Pronunciation Studio</h3><p>Latih tekanan kata dan intonasi dengan contoh suara, lalu amati rekaman mikrofon secara lokal.</p></div></div><p class="pronunciation-studio-empty">' + escapeHtml(pronunciationLoadError) + '</p><button class="pronunciation-studio-button" type="button" data-pronunciation-reload>Muat ulang latihan</button>';
      return;
    }
    const completed = pronunciationExercises.filter((exercise) => pronunciationEntry(exercise.id).attempts.length > 0).length;
    const cards = pronunciationExercises.map((exercise) => {
      const entry = pronunciationEntry(exercise.id);
      const latest = entry.attempts[entry.attempts.length - 1];
      return '<article class="pronunciation-studio-card">' +
        '<div class="pronunciation-studio-card-top"><span class="adventure-story-level">' + escapeHtml(exercise.level) + '</span><span class="adventure-story-status">' + (latest ? 'PERNAH DILATIH' : 'LATIHAN BARU') + '</span></div>' +
        '<h4>' + escapeHtml(exercise.title) + '</h4><p>' + escapeHtml(exercise.category) + '</p>' +
        '<div class="pronunciation-studio-card-meta"><span>' + escapeHtml(exercise.focus) + '</span><span>' + entry.attempts.length + ' percobaan</span></div>' +
        '<button class="pronunciation-studio-button" type="button" data-pronunciation-open="' + escapeHtml(exercise.id) + '">' + (latest ? 'Lanjut berlatih ↗' : 'Mulai latihan ↗') + '</button>' +
      '</article>';
    }).join("");
    node.innerHTML =
      '<div class="pronunciation-studio-heading"><div><span class="eyebrow">SPEAK · NOTICE · REFINE / A1–B2</span><h3>Pronunciation Studio</h3><p>Amati suku kata yang perlu ditekankan, kelompok kata, dan arah intonasi. Putar contoh suara, rekam kalimatmu, lalu lihat indikator tempo, jeda, energi, serta kontur nada.</p></div><span class="adventure-story-count">' + completed + '/' + pronunciationExercises.length + '<small>PERNAH DILATIH</small></span></div>' +
      '<p class="pronunciation-studio-privacy">Mikrofon hanya dianalisis di browser selama kamu menekan rekam. Audio mentah tidak disimpan atau diunggah; hanya ringkasan metrik latihan yang disimpan.</p>' +
      (cards ? '<div class="pronunciation-studio-grid">' + cards + '</div>' : '<p class="pronunciation-studio-empty">Belum ada latihan tersedia.</p>');
  }

  function pitchContourSvg(samples) {
    const points = (samples || []).filter((item) => Number.isFinite(item.pitch)).map((item) => item.pitch);
    if (points.length < 3) return '<p class="pronunciation-studio-no-pitch">Kontur nada belum cukup terbaca pada rekaman ini.</p>';
    const sorted = [...points].sort((a, b) => a - b);
    const min = sorted[Math.floor((sorted.length - 1) * 0.1)];
    const max = sorted[Math.ceil((sorted.length - 1) * 0.9)];
    const span = Math.max(1, max - min);
    const coords = points.map((pitch, index) => {
      const x = 8 + index / Math.max(1, points.length - 1) * 304;
      const y = 60 - Math.max(0, Math.min(1, (pitch - min) / span)) * 48;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    return '<svg class="pronunciation-studio-pitch-chart" viewBox="0 0 320 72" role="img" aria-label="Kontur tinggi nada yang terukur selama rekaman"><polyline points="' + coords + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 62H312" stroke="currentColor" opacity=".2" stroke-width="1"/></svg>';
  }

  function renderPronunciationRun(node) {
    const exercise = pronunciationExercises.find((item) => item.id === pronunciationRun.exerciseId);
    if (!exercise) { pronunciationRun = null; renderPronunciationStudio(); return; }
    const entry = pronunciationEntry(exercise.id);
    const history = entry.attempts.length;
    const phraseGroups = exercise.phraseGroups.map((group) => '<span class="pronunciation-studio-phrase-group">' + renderStressedGroup(group) + '</span>').join('<span class="pronunciation-studio-group-break" aria-hidden="true">/</span>');
    const stressedWords = exercise.stressWords.map((word) => '<span>' + escapeHtml(word) + '</span>').join("");
    const tips = exercise.coaching.map((tip) => '<li>' + escapeHtml(tip) + '</li>').join("");
    const capture = pronunciationCapture;
    const requesting = Boolean(pronunciationRun.requesting);
    let body = "";
    if (pronunciationRun.metrics) {
      const metrics = pronunciationRun.metrics;
      const feedback = pronunciationRun.feedback || [];
      const seconds = (metrics.durationMs / 1000).toFixed(1);
      const voicePercent = Math.round(metrics.voiceShare * 100);
      const pitchText = Number.isFinite(metrics.pitchRangeSemitones) ? metrics.pitchRangeSemitones.toFixed(1) + " semitone" : "—";
      const feedbackHtml = feedback.map((note) => '<p>' + escapeHtml(note) + '</p>').join("");
      body =
        '<section class="pronunciation-studio-result" id="pronunciation-studio-result">' +
          '<h4>Catatan rekaman terakhir</h4>' +
          '<p class="pronunciation-studio-disclaimer">Angka di bawah menggambarkan sinyal mikrofon dan tidak menentukan benar-salahnya pelafalan.</p>' +
          '<div class="pronunciation-studio-metrics">' +
            '<div><strong>' + seconds + ' dtk</strong><span>Durasi</span></div>' +
            '<div><strong>' + voicePercent + '%</strong><span>Bagian suara terdeteksi</span></div>' +
            '<div><strong>' + metrics.pauseCount + '</strong><span>Jeda panjang</span></div>' +
            '<div><strong>' + pitchText + '</strong><span>Rentang tinggi nada</span></div>' +
          '</div>' +
          '<div class="pronunciation-studio-contour"><strong>Kontur tinggi nada</strong>' + pitchContourSvg(pronunciationRun.samples) + '<small>Perubahan nada relatif selama rekaman; bukan pembanding akurasi intonasi.</small></div>' +
          '<div class="pronunciation-studio-feedback"><strong>Hal yang bisa dicoba</strong>' + feedbackHtml + '</div>' +
          '<button class="pronunciation-studio-button" type="button" data-pronunciation-record-again>Rekam ulang ↗</button>' +
        '</section>';
    } else {
      body =
        '<section class="pronunciation-studio-recorder">' +
          '<div class="pronunciation-studio-recorder-top"><div><strong>Rekam suaramu</strong><p>Tekan mulai, ucapkan frasa dengan nyaman, lalu tekan berhenti. Maksimal 12 detik.</p></div><span class="pronunciation-studio-recorder-status" id="pronunciation-capture-status">' + (capture ? 'SEDANG MEREKAM' : requesting ? 'MENUNGGU IZIN' : 'SIAP') + '</span></div>' +
          '<div class="pronunciation-studio-meter"><i id="pronunciation-meter" style="width:' + (capture ? '10%' : '0%') + '"></i></div>' +
          '<div class="pronunciation-studio-recorder-actions"><button class="pronunciation-studio-button" type="button" data-pronunciation-toggle' + (requesting ? ' disabled' : '') + '>' + (capture ? '■ Berhenti merekam' : requesting ? 'Meminta izin mikrofon…' : '● Mulai merekam') + '</button><span id="pronunciation-record-time">' + (capture ? '00:00' : 'Mikrofon belum aktif') + '</span></div>' +
          '<p class="pronunciation-studio-capture-note" id="pronunciation-capture-note">' + escapeHtml(pronunciationRun.captureError || 'Peramban akan meminta izin mikrofon. Analisis berjalan di perangkat ini dan tidak membuat file rekaman.') + '</p>' +
        '</section>';
    }
    node.innerHTML =
      '<div class="pronunciation-studio-reader" id="pronunciation-studio-reader">' +
        '<div class="pronunciation-studio-reader-top"><div class="adventure-story-reader-meta"><span>' + escapeHtml(exercise.level) + '</span><span>·</span><span>' + escapeHtml(exercise.focus) + '</span><span>·</span><span>' + history + ' RINGKASAN TERSIMPAN</span></div><button class="pronunciation-studio-button is-secondary" type="button" data-pronunciation-close>← Koleksi</button></div>' +
        '<h3 class="pronunciation-studio-title">' + escapeHtml(exercise.title) + '</h3><p class="pronunciation-studio-meaning">' + escapeHtml(exercise.meaning) + '</p>' +
        '<div class="pronunciation-studio-target-label">SAY THIS PHRASE</div><div class="pronunciation-studio-target">' + escapeHtml(exercise.phrase) + '</div>' +
        '<div class="pronunciation-studio-reference"><button class="pronunciation-studio-button is-reference" type="button" data-pronunciation-reference>▶ Dengarkan contoh</button><span>' + (pronunciationRun.referenceUnavailable ? 'Suara contoh tidak tersedia di browser ini.' : 'Contoh suara dibuat oleh browser.') + '</span></div>' +
        '<section class="pronunciation-studio-guidance"><div><span class="eyebrow">WORD STRESS</span><strong>Kata yang perlu mendapat tekanan</strong><div class="pronunciation-studio-stress-words">' + stressedWords + '</div></div><div><span class="eyebrow">THOUGHT GROUPS</span><strong>Kelompokkan frasa</strong><div class="pronunciation-studio-phrase-groups">' + phraseGroups + '</div></div><div><span class="eyebrow">INTONATION</span><strong>' + escapeHtml(exercise.intonation.label) + '</strong><p>' + escapeHtml(exercise.intonation.description) + '</p></div><div><span class="eyebrow">CONNECTED SPEECH</span><p>' + escapeHtml(exercise.linking) + '</p></div><ul>' + tips + '</ul></section>' +
        body +
        '<p class="pronunciation-studio-privacy">Privasi: mikrofon dianalisis lokal. Tidak ada audio mentah yang disimpan, dikirim, atau diunggah. Browser tidak memeriksa fonem secara otomatis; gunakan panduan tekanan dan intonasi untuk latihan mandiri.</p>' +
        renderLearningPathLinks(exercise.learningPath) +
      '</div>';
  }

  function estimatePronunciationPitch(buffer, sampleRate) {
    let mean = 0;
    for (let i = 0; i < buffer.length; i += 1) mean += buffer[i];
    mean /= buffer.length;
    let energy = 0;
    for (let i = 0; i < buffer.length; i += 1) { const value = buffer[i] - mean; energy += value * value; }
    if (energy / buffer.length < 0.000025) return null;
    const minLag = Math.max(2, Math.floor(sampleRate / 340));
    const maxLag = Math.min(Math.floor(sampleRate / 75), Math.floor(buffer.length * 0.45));
    let bestLag = 0, bestScore = 0;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let cross = 0, left = 0, right = 0;
      for (let i = 0; i < buffer.length - lag; i += 4) {
        const a = buffer[i] - mean, b = buffer[i + lag] - mean;
        cross += a * b; left += a * a; right += b * b;
      }
      const score = cross / Math.sqrt(Math.max(1e-12, left * right));
      if (score > bestScore) { bestScore = score; bestLag = lag; }
    }
    return bestScore >= 0.32 && bestLag ? sampleRate / bestLag : null;
  }

  function summarizePronunciation(samples, durationMs) {
    const active = samples.filter((sample) => sample.rms > 0.012);
    const voiceShare = samples.length ? active.length / samples.length : 0;
    const meanRms = active.length ? active.reduce((sum, sample) => sum + sample.rms, 0) / active.length : 0;
    const pitchValues = active.map((sample) => sample.pitch).filter((pitch) => Number.isFinite(pitch));
    const sortedPitch = [...pitchValues].sort((a, b) => a - b);
    const percentile = (values, ratio) => values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * ratio))] : null;
    const lowPitch = percentile(sortedPitch, 0.1), highPitch = percentile(sortedPitch, 0.9);
    const pitchRangeSemitones = lowPitch && highPitch && highPitch > lowPitch ? 12 * Math.log2(highPitch / lowPitch) : null;
    let pauseCount = 0, previousTime = null;
    for (const sample of active) {
      if (previousTime !== null && sample.t - previousTime >= 520) pauseCount += 1;
      previousTime = sample.t;
    }
    return {
      durationMs: Math.round(durationMs),
      voiceShare: Math.max(0, Math.min(1, voiceShare)),
      voicedFrames: active.length,
      meanRms: Number(meanRms.toFixed(4)),
      pauseCount,
      pitchMedian: percentile(sortedPitch, 0.5),
      pitchRangeSemitones: Number.isFinite(pitchRangeSemitones) ? Number(pitchRangeSemitones.toFixed(2)) : null,
    };
  }

  function stopPronunciationCapture(saveAttempt = true) {
    const capture = pronunciationCapture;
    if (!capture) return;
    pronunciationCapture = null;
    if (capture.frameId) cancelAnimationFrame(capture.frameId);
    for (const track of capture.stream.getTracks()) track.stop();
    try { capture.source.disconnect(); } catch (_) {}
    try { capture.analyser.disconnect(); } catch (_) {}
    const durationMs = Math.max(0, performance.now() - capture.startedAt);
    void capture.context.close().catch(() => {});
    if (!saveAttempt || !pronunciationRun) {
      renderPronunciationStudio();
      return;
    }
    const metrics = summarizePronunciation(capture.samples, durationMs);
    const exercise = pronunciationExercises.find((item) => item.id === pronunciationRun.exerciseId);
    if (!exercise) return;
    const completedAt = new Date().toISOString();
    const attempt = { attemptId: makeId(), completedAt, ...metrics };
    const entry = pronunciationEntry(exercise.id);
    entry.attempts = [...(entry.attempts || []), attempt].slice(-50);
    entry.updatedAt = completedAt;
    progress.pronunciationProgress[exercise.id] = entry;
    saveProgress();
    pronunciationRun.metrics = metrics;
    pronunciationRun.samples = capture.samples.map((sample) => ({ t: sample.t, pitch: sample.pitch }));
    pronunciationRun.feedback = pronunciationFeedback(exercise, metrics);
    pronunciationRun.captureError = "";
    renderPronunciationStudio();
  }

  async function startPronunciationCapture() {
    if (!pronunciationRun || pronunciationCapture || pronunciationRun.requesting) return;
    const targetRun = pronunciationRun;
    targetRun.requesting = true;
    renderPronunciationStudio();
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      targetRun.requesting = false;
      targetRun.captureError = "Browser ini tidak menyediakan akses mikrofon. Kamu tetap bisa memakai contoh suara dan panduan visual.";
      renderPronunciationStudio();
      return;
    }
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) {
      targetRun.requesting = false;
      targetRun.captureError = "Analisis audio lokal tidak didukung browser ini. Contoh suara dan panduan tetap bisa digunakan.";
      renderPronunciationStudio();
      return;
    }
    let stream = null, context = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (pronunciationRun !== targetRun) { stream.getTracks().forEach((track) => track.stop()); return; }
      targetRun.requesting = false;
      context = new AudioContextType();
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.15;
      source.connect(analyser);
      pronunciationCapture = { stream, context, source, analyser, startedAt: performance.now(), lastSampleAt: 0, samples: [], frameId: 0 };
      pronunciationRun.captureError = "";
      renderPronunciationStudio();
      const buffer = new Float32Array(analyser.fftSize);
      const capture = pronunciationCapture;
      const frame = (now) => {
        if (pronunciationCapture !== capture) return;
        const elapsed = now - capture.startedAt;
        if (elapsed >= 12000) { stopPronunciationCapture(true); return; }
        if (now - capture.lastSampleAt >= 90) {
          capture.lastSampleAt = now;
          analyser.getFloatTimeDomainData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
          const rms = Math.sqrt(sum / buffer.length);
          const pitch = rms > 0.012 ? estimatePronunciationPitch(buffer, context.sampleRate) : null;
          capture.samples.push({ t: elapsed, rms, pitch });
          const meter = $("#pronunciation-meter");
          const recordTime = $("#pronunciation-record-time");
          const status = $("#pronunciation-capture-status");
          if (meter) meter.style.width = Math.min(100, rms * 500) + "%";
          if (recordTime) recordTime.textContent = "00:" + String(Math.floor(elapsed / 1000)).padStart(2, "0");
          if (status) status.textContent = "SEDANG MEREKAM";
        }
        capture.frameId = requestAnimationFrame(frame);
      };
      capture.frameId = requestAnimationFrame(frame);
    } catch (error) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (context) void context.close().catch(() => {});
      const reason = error && error.name === "NotAllowedError" ? "Izin mikrofon ditolak. Izinkan akses mikrofon dari pengaturan situs untuk memakai analisis lokal." :
        error && error.name === "NotFoundError" ? "Tidak ada mikrofon yang terdeteksi di perangkat ini." :
        "Mikrofon tidak dapat diakses. Periksa izin browser dan pastikan halaman dibuka melalui HTTPS.";
      if (pronunciationRun === targetRun) { targetRun.requesting = false; targetRun.captureError = reason; renderPronunciationStudio(); }
    }
  }

  async function loadPronunciationStudio() {
    try {
      const response = await fetch("/data/adventure/pronunciation.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Koleksi Pronunciation Studio belum dapat dimuat.");
      const data = await response.json();
      if (!data || data.schemaVersion !== 1 || !Array.isArray(data.exercises)) throw new Error("Format Pronunciation Studio tidak sesuai.");
      const ids = new Set();
      pronunciationExercises = data.exercises.filter((exercise) => {
        const valid = exercise && typeof exercise.id === "string" && exercise.id && !ids.has(exercise.id) &&
          typeof exercise.phrase === "string" && exercise.phrase.trim() && ["A1", "A2", "B1", "B2"].includes(exercise.level) &&
          Array.isArray(exercise.stressWords) && exercise.stressWords.length >= 1 &&
          Array.isArray(exercise.phraseGroups) && exercise.phraseGroups.length >= 2 &&
          exercise.intonation && typeof exercise.intonation.description === "string" &&
          Array.isArray(exercise.coaching) && exercise.coaching.length >= 2;
        if (valid) ids.add(exercise.id);
        return valid;
      });
      if (pronunciationExercises.length !== data.exercises.length) throw new Error("Sebagian latihan tidak lolos pemeriksaan struktur.");
      pronunciationLoaded = true;
      pronunciationLoadError = "";
      renderPronunciationStudio();
    } catch (error) {
      pronunciationLoaded = true;
      pronunciationLoadError = error instanceof Error ? error.message : "Pronunciation Studio belum dapat dimuat.";
      renderPronunciationStudio();
    }
  }

  function openPronunciation(exerciseId) {
    if (!pronunciationExercises.some((item) => item.id === exerciseId)) return;
    pronunciationRun = { exerciseId, referenceUnavailable: false, captureError: "", metrics: null, samples: [], feedback: [] };
    renderPronunciationStudio();
  }

  function closePronunciationStudio() {
    if (pronunciationCapture) stopPronunciationCapture(false);
    pronunciationRun = null;
    renderPronunciationStudio();
  }

  function dialogueEntry(dialogueId) {
    return progress.dialogueProgress[dialogueId] && typeof progress.dialogueProgress[dialogueId] === "object"
      ? progress.dialogueProgress[dialogueId]
      : { attempts: [], bestScore: 0, completedAt: null, updatedAt: null };
  }

  function renderDialogueLibrary() {
    const node = $("#adventure-everyday-english");
    if (!node) return;
    if (dialogueRun) { renderDialogueRun(node); return; }
    if (!dialoguesLoaded) {
      node.innerHTML = '<div class="adventure-dialogue-heading"><div><span class="eyebrow">LISTEN · RESPOND · SPEAK</span><h3>Everyday English</h3><p>Latihan percakapan dalam situasi yang sering kamu temui.</p></div></div><p class="adventure-dialogue-empty">Menyiapkan skenario dialog…</p>';
      return;
    }
    if (dialogueLoadError) {
      node.innerHTML = '<div class="adventure-dialogue-heading"><div><span class="eyebrow">LISTEN · RESPOND · SPEAK</span><h3>Everyday English</h3><p>Latihan percakapan dalam situasi yang sering kamu temui.</p></div></div><p class="adventure-dialogue-empty">' + escapeHtml(dialogueLoadError) + '</p><button class="adventure-dialogue-back" type="button" data-dialogue-reload>Muat ulang dialog</button>';
      return;
    }
    const completed = dialogues.filter((dialogue) => Boolean(dialogueEntry(dialogue.id).completedAt)).length;
    const cards = dialogues.map((dialogue) => {
      const entry = dialogueEntry(dialogue.id);
      const done = Boolean(entry.completedAt);
      const attempts = Array.isArray(entry.attempts) ? entry.attempts.length : 0;
      const best = Number(entry.bestScore) || 0;
      return '<article class="adventure-dialogue-card">' +
        '<div class="adventure-dialogue-card-top"><span class="adventure-story-level">' + escapeHtml(dialogue.level) + '</span><span class="adventure-story-status">' + (done ? 'SELESAI ✓' : attempts ? 'PERNAH DICOBA' : 'SKENARIO BARU') + '</span></div>' +
        '<h4>' + escapeHtml(dialogue.title) + '</h4><p>' + escapeHtml(dialogue.subtitle) + '</p>' +
        '<div class="adventure-dialogue-card-meta"><span>' + escapeHtml(String(dialogue.estimatedMinutes || 5)) + ' MENIT</span><span>' + attempts + ' percobaan' + (attempts ? ' · terbaik ' + best + '/' + dialogue.turns.length : '') + '</span></div>' +
        '<button type="button" data-dialogue-open="' + escapeHtml(dialogue.id) + '">' + (done ? 'Latih lagi ↗' : attempts ? 'Lanjut berlatih ↗' : 'Mulai dialog ↗') + '</button>' +
      '</article>';
    }).join("");
    node.innerHTML =
      '<div class="adventure-dialogue-heading"><div><span class="eyebrow">LISTEN · RESPOND · SPEAK</span><h3>Everyday English</h3><p>Dengarkan percakapan, amati pilihan kata, lalu pilih respons yang paling alami. Setelah itu, bawa situasinya ke Speaking Studio dan coba ucapkan dengan caramu sendiri.</p></div><span class="adventure-story-count">' + completed + '/' + dialogues.length + '<small>SELESAI</small></span></div>' +
      (cards ? '<div class="adventure-dialogue-grid">' + cards + '</div>' : '<p class="adventure-dialogue-empty">Belum ada skenario dialog tersedia.</p>');
  }

  function renderDialogueRun(node) {
    const dialogue = dialogues.find((item) => item.id === dialogueRun.dialogueId);
    if (!dialogue) { dialogueRun = null; renderDialogueLibrary(); return; }
    if (dialogueRun.stage === "result") {
      const passed = Boolean(dialogueRun.result?.passed);
      node.innerHTML =
        '<div class="adventure-dialogue-result" id="adventure-dialogue-result">' +
          '<span class="adventure-story-level">' + escapeHtml(dialogue.level) + '</span>' +
          '<div class="adventure-story-result-mark">' + (passed ? '✓' : '↻') + '</div>' +
          '<h4>' + (passed ? 'Percakapan berhasil.' : 'Ayo coba sekali lagi.') + '</h4>' +
          '<p>Respons tepat: <strong>' + dialogueRun.result.score + '/' + dialogueRun.result.total + '</strong>. ' +
          (passed ? 'Kamu sudah memilih respons yang tepat di sebagian besar giliran percakapan.' : 'Baca penjelasan setiap respons, lalu ulangi dialog untuk memperkuat ungkapan yang alami.') + '</p>' +
          '<div class="adventure-dialogue-result-actions">' +
            '<button class="adventure-dialogue-retry" type="button" data-dialogue-retry="' + escapeHtml(dialogue.id) + '">Ulangi dialog ↗</button>' +
            '<button class="adventure-dialogue-speaking" type="button" data-dialogue-speaking="' + escapeHtml(dialogue.id) + '">Lanjut ke Speaking Studio ↗</button>' +
            '<button class="adventure-dialogue-back" type="button" data-dialogue-close>Kembali ke skenario</button>' +
          '</div>' +
        renderLearningPathLinks(dialogue.learningPath) +
        '</div>';
      return;
    }
    const turn = dialogue.turns[dialogueRun.turnIndex];
    const answered = dialogueRun.locked;
    const choices = turn.options.map((option, index) => {
      const correct = index === turn.answer;
      const chosen = index === dialogueRun.selectedAnswer;
      return '<button type="button" class="adventure-dialogue-option' + (answered && correct ? ' is-correct' : '') + (answered && chosen && !correct ? ' is-wrong' : '') + '" data-dialogue-answer="' + index + '"' + (answered ? ' disabled' : '') + '><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>';
    }).join("");
    const dialogueAudioControls = '<button class="primary-action adventure-dialogue-listen" type="button" data-dialogue-listen><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Dengarkan percakapan</button>' +
      '<button class="secondary-action adventure-dialogue-transcript-toggle" type="button" data-dialogue-transcript>' + (dialogueRun.transcriptVisible ? 'Sembunyikan transkrip' : 'Lihat transkrip') + '</button>';

    const transcript = dialogueRun.transcriptVisible
      ? '<div class="adventure-dialogue-transcript" id="adventure-dialogue-transcript">' +
          dialogue.transcript.map((line, idx) => {
            const isSpeaking = dialogueNarration.active && dialogueNarration.currentIndex === idx;
            const lineWords = line.text.replace(/([A-Za-z]+(?:'[A-Za-z]+)?)/g, w => {
              const isSaved = window.sinauuIsWordSaved ? window.sinauuIsWordSaved(w.toLowerCase()) : false;
              return '<span class="context-word' + (isSaved ? ' is-saved' : '') + '" data-word="' + escapeHtml(w) + '" data-sentence="' + escapeHtml(line.text) + '" data-source="' + escapeHtml(dialogue.title) + '" tabindex="0" role="button">' + escapeHtml(w) + '</span>';
            });
            return '<p class="dialogue-sentence' + (isSpeaking ? ' is-speaking-sentence' : '') + '" data-dialogue-line-id="' + idx + '"><strong>' + escapeHtml(line.speaker) + ':</strong> <span>' + lineWords + '</span></p>';
          }).join("") +
        '</div>'
      : '';
    const audioNote = dialogueRun.audioUnavailable
      ? '<small>Audio browser tidak tersedia di perangkat ini. Kamu tetap bisa membaca transkripnya.</small>'
      : '<small>Audio dibuat oleh browser dengan kecepatan ' + (progress.listeningRate || 0.9) + '×. Suara tidak direkam atau diunggah.</small>';
    const vocabulary = dialogue.focusWords.map((word) => '<span class="adventure-dialogue-word"><strong>' + escapeHtml(word.word) + '</strong><span>' + escapeHtml(word.meaning) + '</span></span>').join("");
    node.innerHTML =
      '<div class="adventure-dialogue-reader" id="adventure-dialogue-reader">' +
        '<div class="adventure-dialogue-reader-top"><div class="adventure-story-reader-meta"><span>' + escapeHtml(dialogue.level) + '</span><span>·</span><span>' + escapeHtml(String(dialogue.estimatedMinutes || 5)) + ' MENIT</span></div><button class="adventure-dialogue-back" type="button" data-dialogue-close>← Skenario</button></div>' +
        '<h3 class="adventure-dialogue-title">' + escapeHtml(dialogue.title) + '</h3><p class="adventure-dialogue-setting">' + escapeHtml(dialogue.setting) + '</p>' +
        '<div class="adventure-dialogue-audio"><div class="adventure-audio-actions">' + dialogueAudioControls + '</div>' + audioNote + '</div>' +
        transcript +
        '<div class="adventure-dialogue-vocabulary">' + vocabulary + '</div>' +
        '<section class="adventure-dialogue-quiz" aria-labelledby="adventure-dialogue-question">' +
          '<div class="adventure-dialogue-quiz-meta"><span>YOUR TURN / PILIH RESPONS</span><span>GILIRAN ' + (dialogueRun.turnIndex + 1) + '/' + dialogue.turns.length + '</span></div>' +
          '<div class="adventure-story-progress"><i style="width:' + Math.round((dialogueRun.turnIndex + 1) / dialogue.turns.length * 100) + '%"></i></div>' +
          '<div class="adventure-dialogue-partner-line"><span>' + escapeHtml(dialogue.transcript.find((line) => line.text.includes(turn.partnerLine))?.speaker || 'PARTNER') + '</span><p>' + escapeHtml(turn.partnerLine) + '</p></div>' +
          '<h4 id="adventure-dialogue-question">' + escapeHtml(turn.prompt) + '</h4>' +
          '<div class="adventure-dialogue-options">' + choices + '</div>' +
          (answered ? '<div class="adventure-dialogue-feedback' + (dialogueRun.isCorrect ? '' : ' is-wrong') + '" role="status"><strong>' + (dialogueRun.isCorrect ? 'Respons alami.' : 'Belum tepat.') + '</strong>' + escapeHtml(turn.explanation) + (!dialogueRun.isCorrect ? '<br>Respons yang disarankan: ' + escapeHtml(turn.response) : '') + '</div>' : '') +
          (answered ? '<div class="adventure-dialogue-actions"><button class="adventure-dialogue-next" type="button" data-dialogue-next>' + (dialogueRun.turnIndex === dialogue.turns.length - 1 ? 'Lihat hasil →' : 'Giliran berikutnya →') + '</button></div>' : '') +
        '</section>' +
      '</div>';
  }

  async function loadDialogues() {
    try {
      const response = await fetch("/data/adventure/dialogues.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Skenario Everyday English belum dapat dimuat.");
      const data = await response.json();
      if (!data || data.schemaVersion !== 1 || !Array.isArray(data.dialogues)) throw new Error("Format Everyday English tidak sesuai.");
      const ids = new Set();
      dialogues = data.dialogues.filter((dialogue) => {
        const valid = dialogue && typeof dialogue.id === "string" && dialogue.id && !ids.has(dialogue.id) &&
          typeof dialogue.title === "string" && ["A1", "A2", "B1", "B2"].includes(dialogue.level) &&
          Array.isArray(dialogue.transcript) && dialogue.transcript.length >= 4 &&
          dialogue.transcript.every((line) => line && typeof line.speaker === "string" && typeof line.text === "string") &&
          Array.isArray(dialogue.focusWords) && Array.isArray(dialogue.turns) && dialogue.turns.length >= 3 &&
          typeof dialogue.speakingPromptId === "string" &&
          dialogue.turns.every((turn) => turn && typeof turn.id === "string" && typeof turn.prompt === "string" &&
            typeof turn.partnerLine === "string" && Array.isArray(turn.options) && turn.options.length >= 2 &&
            Number.isInteger(turn.answer) && turn.answer >= 0 && turn.answer < turn.options.length);
        if (valid) ids.add(dialogue.id);
        return valid;
      });
      if (dialogues.length !== data.dialogues.length) throw new Error("Sebagian skenario tidak lolos pemeriksaan struktur.");
      dialoguesLoaded = true;
      dialogueLoadError = "";
      renderDialogueLibrary();
    } catch (error) {
      dialoguesLoaded = true;
      dialogueLoadError = error instanceof Error ? error.message : "Skenario Everyday English belum dapat dimuat.";
      renderDialogueLibrary();
    }
  }

  function openDialogue(dialogueId) {
    stopDialogueNarration();
    if (!dialogues.some((item) => item.id === dialogueId)) return;
    window.sinauuOpenPracticeModule?.("listening");
    dialogueRun = { dialogueId, stage: "roleplay", turnIndex: 0, answers: [], locked: false, selectedAnswer: null, isCorrect: false, transcriptVisible: false, audioUnavailable: false };
    renderDialogueLibrary();
  }

  function listenToDialogue() {
    if (!dialogueRun || dialogueRun.stage !== "roleplay") return;
    const dialogue = dialogues.find((item) => item.id === dialogueRun.dialogueId);
    if (!dialogue) return;
    const script = dialogue.transcript.map((line) => line.speaker + ": " + line.text).join(" ");
    dialogueRun.audioUnavailable = !playText(script);
    if (dialogueRun.audioUnavailable) dialogueRun.transcriptVisible = true;
    renderDialogueLibrary();
  }

  function answerDialogue(answerIndex) {
    if (!dialogueRun || dialogueRun.stage !== "roleplay" || dialogueRun.locked) return;
    const dialogue = dialogues.find((item) => item.id === dialogueRun.dialogueId);
    const turn = dialogue && dialogue.turns[dialogueRun.turnIndex];
    if (!turn || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= turn.options.length) return;
    dialogueRun.selectedAnswer = answerIndex;
    dialogueRun.isCorrect = answerIndex === turn.answer;
    dialogueRun.locked = true;
    dialogueRun.answers.push({ turnId: turn.id, correct: dialogueRun.isCorrect });
    renderDialogueLibrary();
  }

  function finishDialogue() {
    if (!dialogueRun || dialogueRun.stage !== "roleplay") return;
    const dialogue = dialogues.find((item) => item.id === dialogueRun.dialogueId);
    if (!dialogue || dialogueRun.answers.length !== dialogue.turns.length) return;
    const score = dialogueRun.answers.filter((answer) => answer.correct).length;
    const total = dialogue.turns.length;
    const passed = score >= Math.ceil(total * 2 / 3);
    const completedAt = new Date().toISOString();
    const entry = dialogueEntry(dialogue.id);
    const attempt = { attemptId: makeId(), score, total, passed, completedAt };
    entry.attempts = [...(entry.attempts || []), attempt].slice(-100);
    entry.bestScore = Math.max(Number(entry.bestScore) || 0, score);
    if (passed && !entry.completedAt) entry.completedAt = completedAt;
    entry.updatedAt = completedAt;
    progress.dialogueProgress[dialogue.id] = entry;
    saveProgress();
    dialogueRun.stage = "result";
    dialogueRun.result = { score, total, passed };
    renderDialogueLibrary();
  }

  function advanceDialogue() {
    if (!dialogueRun || !dialogueRun.locked || dialogueRun.stage !== "roleplay") return;
    const dialogue = dialogues.find((item) => item.id === dialogueRun.dialogueId);
    if (!dialogue) return;
    if (dialogueRun.turnIndex >= dialogue.turns.length - 1) {
      finishDialogue();
      return;
    }
    dialogueRun.turnIndex += 1;
    dialogueRun.locked = false;
    dialogueRun.selectedAnswer = null;
    dialogueRun.isCorrect = false;
    renderDialogueLibrary();
  }

  function openSpeakingFromDialogue(dialogueId) {
    const dialogue = dialogues.find((item) => item.id === dialogueId);
    if (!dialogue || !studioDrafts) return;
    dialogueRun = null;
    renderDialogueLibrary();
    window.sinauuOpenPracticeModule?.("speaking");
    selectStudioPrompt("speaking", dialogue.speakingPromptId);
    $("#adventure-speaking-studio")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function initListeners() {
    document.addEventListener("click", (event) => {
      const viewTarget = event.target.closest("[data-view-target]");
      if (viewTarget && viewTarget.dataset.viewTarget !== "adventure" && pronunciationCapture) {
        stopPronunciationCapture(false);
        pronunciationRun = null;
      }
      const select = event.target.closest("[data-adventure-select]");
      if (select) { openMission(select.dataset.adventureSelect); return; }
      const start = event.target.closest("[data-adventure-start]");
      if (start) { startMission(start.dataset.adventureStart); return; }
      const answer = event.target.closest("[data-adventure-answer]");
      if (answer) { handleChoiceAnswer(answer.dataset.adventureAnswer); return; }
      if (event.target.closest("[data-adventure-listen]")) { listenToStep(); return; }
      const missionRate = event.target.closest("[data-adventure-listen-rate]");
      if (missionRate) { setListeningRate(missionRate.dataset.adventureListenRate); return; }
      if (event.target.closest("[data-adventure-transcript]")) { toggleMissionTranscript(); return; }
      if (event.target.closest("[data-adventure-complete-production]")) { completeProduction(); return; }
      if (event.target.closest("[data-adventure-next]")) { advanceStep(); return; }
      if (event.target.closest("[data-adventure-back]")) { backToMission(); return; }
      const dailyStart = event.target.closest("[data-daily-start]");
      if (dailyStart) { startDailyQuest(); return; }
      const dailyAnswer = event.target.closest("[data-daily-answer]");
      if (dailyAnswer) { answerDailyQuest(dailyAnswer.dataset.dailyAnswer); return; }
      if (event.target.closest("[data-daily-listen]")) { listenToDailyStep(); return; }
      const dailyRate = event.target.closest("[data-daily-listen-rate]");
      if (dailyRate) { setListeningRate(dailyRate.dataset.dailyListenRate); return; }
      if (event.target.closest("[data-daily-transcript]")) { dailyTranscriptVisible = !dailyTranscriptVisible; renderDailyQuest(); return; }
      if (event.target.closest("[data-daily-next]")) { advanceDailyQuest(); return; }
      const focusedReview = event.target.closest("[data-mistake-review-one]");
      if (focusedReview) { openMistakeReview(focusedReview.dataset.mistakeReviewOne); return; }
      if (event.target.closest("[data-mistake-review-close]")) { closeMistakeReview(); return; }
      const focusedAnswer = event.target.closest("[data-mistake-answer]");
      if (focusedAnswer) { answerMistakeReview(focusedAnswer.dataset.mistakeId, focusedAnswer.dataset.mistakeAnswer); return; }
      if (event.target.closest("[data-mistake-listen]")) { listenToMistakeReview(); return; }
      if (event.target.closest("[data-mistake-transcript]")) { toggleMistakeReviewTranscript(); return; }
      const mistakeReview = event.target.closest("[data-mistake-review]");
      if (mistakeReview) { startMission(mistakeReview.dataset.mistakeReview); return; }
      const mistakeFilter = event.target.closest("[data-mistake-filter]");
      if (mistakeFilter) { mistakeFilterValue = mistakeFilter.dataset.mistakeFilter; renderMistakeJournal(); return; }
      const mistakeSkillFilter = event.target.closest("[data-mistake-skill-filter]");
      if (mistakeSkillFilter) { mistakeSkillFilterValue = mistakeSkillFilter.dataset.mistakeSkillFilter; renderMistakeJournal(); return; }
      const storyOpen = event.target.closest("[data-story-open]");
      if (storyOpen) { window.sinauuOpenPracticeModule?.("reading-stories"); openStory(storyOpen.dataset.storyOpen); return; }
      if (event.target.closest("[data-story-close]")) { stopStoryNarration(); storyRun = null; renderStoryLibrary(); return; }
      if (event.target.closest("[data-story-reload]")) { storyLoadError = ""; storiesLoaded = false; renderStoryLibrary(); void loadStories(); return; }
      const storyAnswer = event.target.closest("[data-story-answer]");
      if (storyAnswer) { answerStory(Number(storyAnswer.dataset.storyAnswer)); return; }
      if (event.target.closest("[data-story-next]")) { advanceStory(); return; }
      const storyRetry = event.target.closest("[data-story-retry]");
      if (storyRetry) { window.sinauuOpenPracticeModule?.("reading-stories"); openStory(storyRetry.dataset.storyRetry); return; }
      if (event.target.closest("[data-story-listen]")) { startStoryNarration(); return; }
      if (event.target.closest("[data-story-pause]")) { if (storyNarration.paused) resumeStoryNarration(); else pauseStoryNarration(); return; }
      if (event.target.closest("[data-story-stop]")) { stopStoryNarration(); return; }
      const dialogueOpen = event.target.closest("[data-dialogue-open]");
      if (dialogueOpen) { window.sinauuOpenPracticeModule?.("listening"); openDialogue(dialogueOpen.dataset.dialogueOpen); return; }
      if (event.target.closest("[data-dialogue-close]")) { stopDialogueNarration(); dialogueRun = null; renderDialogueLibrary(); return; }
      if (event.target.closest("[data-dialogue-reload]")) { dialogueLoadError = ""; dialoguesLoaded = false; renderDialogueLibrary(); void loadDialogues(); return; }
      const dialogueAnswer = event.target.closest("[data-dialogue-answer]");
      if (dialogueAnswer) { answerDialogue(Number(dialogueAnswer.dataset.dialogueAnswer)); return; }
      if (event.target.closest("[data-dialogue-next]")) { advanceDialogue(); return; }
      const dialogueRetry = event.target.closest("[data-dialogue-retry]");
      if (dialogueRetry) { window.sinauuOpenPracticeModule?.("listening"); openDialogue(dialogueRetry.dataset.dialogueRetry); return; }
      if (event.target.closest("[data-dialogue-listen]")) { listenToDialogue(); return; }
      if (event.target.closest("[data-dialogue-pause]")) { if (dialogueNarration.paused) resumeDialogueNarration(); else pauseDialogueNarration(); return; }
      if (event.target.closest("[data-dialogue-stop]")) { stopDialogueNarration(); return; }
      if (event.target.closest("[data-dialogue-transcript]")) { if (dialogueRun) { dialogueRun.transcriptVisible = !dialogueRun.transcriptVisible; renderDialogueLibrary(); } return; }
      const openVoiceBtn = event.target.closest("[data-open-voice-modal]");
      if (openVoiceBtn) { openVoiceModal(openVoiceBtn.dataset.openVoiceModal); return; }
      if (event.target.closest("#voice-modal-close")) { closeVoiceModal(); return; }
      const previewVoiceBtn = event.target.closest("[data-preview-voice-char]");
      if (previewVoiceBtn) { previewCharacterVoice(previewVoiceBtn.dataset.previewVoiceChar); return; }
      if (event.target.closest("#voice-modal-save")) { saveVoiceModalSettings(); return; }
      if (event.target.closest("#voice-modal-reset")) { resetVoiceModalSettings(); return; }
      const dialogueSpeaking = event.target.closest("[data-dialogue-speaking]");
      if (dialogueSpeaking) { window.sinauuOpenPracticeModule?.("speaking"); openSpeakingFromDialogue(dialogueSpeaking.dataset.dialogueSpeaking); return; }
      const listeningOpen = event.target.closest("[data-listening-open]");
      if (listeningOpen) { window.sinauuOpenPracticeModule?.("listening"); openListening(listeningOpen.dataset.listeningOpen); return; }
      if (event.target.closest("[data-listening-close]")) { listeningRun = null; renderListeningLab(); return; }
      if (event.target.closest("[data-listening-reload]")) { listeningLoadError = ""; listeningLoaded = false; renderListeningLab(); void loadListeningLab(); return; }
      if (event.target.closest("[data-listening-play]")) { playListeningStage(); return; }
      const listeningRate = event.target.closest("[data-listening-rate]");
      if (listeningRate) { setListeningRate(listeningRate.dataset.listeningRate); return; }
      if (event.target.closest("[data-listening-transcript]")) { if (listeningRun) { listeningRun.transcriptVisible = !listeningRun.transcriptVisible; renderListeningLab(); } return; }
      const listeningAnswer = event.target.closest("[data-listening-answer]");
      if (listeningAnswer) { answerListening(Number(listeningAnswer.dataset.listeningAnswer)); return; }
      if (event.target.closest("[data-listening-next]")) { advanceListening(); return; }
      const listeningRetry = event.target.closest("[data-listening-retry]");
      if (listeningRetry) { window.sinauuOpenPracticeModule?.("listening"); openListening(listeningRetry.dataset.listeningRetry); return; }
      const pronunciationOpen = event.target.closest("[data-pronunciation-open]");
      if (pronunciationOpen) { window.sinauuOpenPracticeModule?.("pronunciation"); openPronunciation(pronunciationOpen.dataset.pronunciationOpen); return; }
      if (event.target.closest("[data-pronunciation-close]")) { closePronunciationStudio(); return; }
      if (event.target.closest("[data-pronunciation-reload]")) { pronunciationLoadError = ""; pronunciationLoaded = false; renderPronunciationStudio(); void loadPronunciationStudio(); return; }
      if (event.target.closest("[data-pronunciation-reference]")) {
        if (pronunciationRun) { const exercise = pronunciationExercises.find((item) => item.id === pronunciationRun.exerciseId); if (exercise) pronunciationRun.referenceUnavailable = !playText(exercise.phrase); renderPronunciationStudio(); }
        return;
      }
      if (event.target.closest("[data-pronunciation-toggle]")) { if (pronunciationCapture) stopPronunciationCapture(true); else void startPronunciationCapture(); return; }
      if (event.target.closest("[data-pronunciation-record-again]")) { pronunciationRun.metrics = null; pronunciationRun.samples = []; pronunciationRun.feedback = []; pronunciationRun.captureError = ""; renderPronunciationStudio(); return; }
      if (event.target.closest("[data-speaking-play-partner]")) { playSpeakingPartner(); return; }
      if (event.target.closest("[data-speaking-next-turn]")) { advanceSpeakingTurn(); return; }
      if (event.target.closest("[data-speaking-restart]")) { restartSpeakingPractice(); return; }
      if (event.target.closest("[data-writing-build-outline]")) { buildWritingOutline(); return; }
      const studioPrompt = event.target.closest("[data-studio-prompt]");
      if (studioPrompt) {
        if (studioPrompt.dataset.studioKind) window.sinauuOpenPracticeModule?.(studioPrompt.dataset.studioKind);
        selectStudioPrompt(studioPrompt.dataset.studioKind, studioPrompt.dataset.studioPrompt);
        return;
      }
      const studioComplete = event.target.closest("[data-studio-complete]");
      if (studioComplete) { completeStudioPractice(studioComplete.dataset.studioKind); return; }
      const studioClear = event.target.closest("[data-studio-clear]");
      if (studioClear && studioDrafts) { const state = studioState("writing", studioDrafts.writing.selectedPromptId); state.text = ""; state.revision = ""; state.plan = { opening: "", detail: "", closing: "" }; state.checked = []; saveStudioDrafts(); renderStudios(); return; }
    });
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-adventure-check]")) updateProductionButton();
      if (event.target.matches("[data-studio-check]")) updateStudioChecklist(event.target);
    });
    document.addEventListener("input", (event) => {
      if (event.target.matches("#studio-writing-draft, #studio-writing-revision, [data-writing-plan]")) updateStudioDraft(event.target);
      if (event.target.matches("#adventure-writing")) updateProductionButton();
    });
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    try {
      const response = await fetch("/data/adventure/missions.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Konten misi belum dapat dimuat.");
      curriculum = await response.json();
      if (!curriculum || curriculum.schemaVersion !== 1 || !Array.isArray(curriculum.missions) || curriculum.missions.length !== 3) {
        throw new Error("Struktur konten petualangan tidak sesuai.");
      }
      selectedMissionId = curriculum.missions.find((mission) => missionUnlocked(mission) && !missionCompleted(mission.id))?.id || curriculum.missions[0].id;
      studioDrafts = readStudioDrafts();
      initListeners(); renderAll();
      void loadStories();
      void loadDialogues();
      void loadListeningLab();
      void loadPronunciationStudio();
    } catch (error) {
      const panel = $("#adventure-mission-panel");
      if (panel) panel.textContent = error.message || "Petualangan belum dapat dimuat.";
    }
  }

  document.addEventListener("visibilitychange", () => { if (document.hidden && pronunciationCapture) stopPronunciationCapture(false); });
  window.addEventListener("pagehide", () => { if (pronunciationCapture) stopPronunciationCapture(false); });
  window.addEventListener("sinauu:local-state-saved", () => { syncExternalMistakes(); renderMistakeJournal(); });
  window.addEventListener("sinauu:local-extras-saved", () => { syncExternalMistakes(); renderMistakeJournal(); });
  window.addEventListener("sinauu:workspace-ready", () => { syncExternalMistakes(); renderMistakeJournal(); });
  window.sinauuAdventureBackup = () => cloneProgress(progress);
  window.sinauuAdventureRestore = (next) => { progress = normalizeProgress(next); syncExternalMistakes(); renderAll(); updateReviewActivePanel(); };
  window.sinauuStudioDraftsBackup = () => studioDrafts || readStudioDrafts();
  window.sinauuStudioDraftsRestore = (next) => { if (!next || typeof next !== "object") return; studioDrafts = next; if (typeof renderStudios === "function") renderStudios(); };
  window.sinauuRenderAdventure = () => { syncExternalMistakes(); if (curriculum) renderAll(); else void init(); updateReviewActivePanel(); };
  window.sinauuRecordMistake = recordMistake;
  window.sinauuSyncMistakes = syncExternalMistakes;
  window.sinauuGetMistakeJournal = () => progress.mistakeJournal;
  window.sinauuGetMistakeRecord = (id) => findMistakeRecord(id);
  window.sinauuOpenMistakeReview = (id) => { openMistakeReview(id); };
  window.sinauuCloseMistakeReview = () => { closeMistakeReview(); };
  window.sinauuIsMistakeDue = (item, now) => isMistakeDue(item, now);
  window.sinauuIsMistakeMastered = (item) => isMistakeMastered(item);
  window.sinauuRenderMistakeReviewHtml = (item) => renderMistakeReview(item);
  window.sinauuUpdateReviewActivePanel = () => updateReviewActivePanel();

  // Adventure uses only its own small curriculum and local extras. Do not wait for
  // the large Oxford corpus before showing Daily Quest, Mistake Journal, or Studios.
  void init();
})();