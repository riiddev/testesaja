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
  let selectedMissionId = null, currentFeedback = null, listenReady = false, initialized = false;

  function emptyProgress() {
    return { schemaVersion: 1, missionProgress: {}, skillEvidence: {}, xpLedger: {}, achievementIds: [], updatedAt: new Date().toISOString() };
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
    base.achievementIds = Array.isArray(raw.achievementIds) ? Array.from(new Set(raw.achievementIds.filter((item) => typeof item === "string"))).slice(0, 100) : [];
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      const note = $("#adventure-save-state");
      if (note) note.textContent = "Tersimpan di perangkat ini · siap disinkronkan";
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

  function renderAchievements() {
    const node = $("#adventure-achievements");
    if (!node) return;
    const all = [
      ["first-mission", "First Footsteps", "Menyelesaikan misi pertamamu."],
      ["island-clear", "Island Notes", "Menyelesaikan seluruh misi First Steps Island."]
    ];
    const items = all.filter((item) => progress.achievementIds.includes(item[0]));
    node.innerHTML = items.length ? items.map((item) =>
      '<div class="adventure-achievement"><span>✳</span><div><strong>' + item[1] + '</strong><small>' + item[2] + '</small></div></div>'
    ).join("") : "<p>Achievement akan muncul setelah ada misi yang selesai.</p>";
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
    const step = currentStep(mission, attempt);
    if (!step) { completeMission(mission, attempt); renderAll(); return; }
    const stepIndex = mission.steps.findIndex((item) => item.id === step.id);
    const progressWidth = Math.round((attempt.completedStepIds.length / mission.steps.length) * 100);
    const isChoice = ["choice", "listen", "read"].includes(step.type);
    const passage = step.passage ? '<div class="adventure-passage">' + escapeHtml(step.passage).replace(/\\n|\n/g, "<br>") + '</div>' : "";
    const listen = step.type === "listen"
      ? '<div class="adventure-listen-box"><button class="secondary-action" type="button" data-adventure-listen="' + escapeHtml(step.id) + '">▶ Dengarkan dialog</button><span>Suara memakai text-to-speech browser. Audio tidak direkam.</span>' +
        (listenReady ? '<p class="adventure-audio-transcript">' + escapeHtml(step.audioText) + '</p>' : '') + '</div>' : "";
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
    selectedMissionId = missionId; currentFeedback = null; listenReady = false;
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
    saveProgress();
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
      currentFeedback = { kind: "try-again", title: "Belum tepat. Coba lagi.", message: "Perhatikan kembali konteksnya. Kamu boleh mencoba lagi tanpa kehilangan progres." };
      renderMissionDetail();
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
    renderHeaderStats(); renderMap(); renderMissionDetail(); renderSkillProfile(); renderAchievements();
  }
  function openMission(missionId) {
    if (!curriculum || !curriculum.missions.some((item) => item.id === missionId)) return;
    selectedMissionId = missionId; currentFeedback = null; listenReady = false; renderAll();
  }
  function listenToStep() {
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    const step = mission && attempt && currentStep(mission, attempt);
    if (!step || step.type !== "listen") return;
    listenReady = true;
    if ("speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function") {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(step.audioText || "");
      utterance.lang = "en-US"; utterance.rate = 0.88; window.speechSynthesis.speak(utterance);
    }
    renderMissionDetail();
  }
  function backToMission() {
    currentFeedback = null; listenReady = false; renderMissionDetail();
  }
  function advanceStep() {
    const mission = curriculum.missions.find((item) => item.id === selectedMissionId);
    const attempt = mission && currentAttempt(mission.id);
    if (!mission || !attempt || !currentFeedback || currentFeedback.kind !== "success") return;
    currentFeedback = null; listenReady = false;
    if (attempt.completedStepIds.length >= mission.steps.length) {
      completeMission(mission, attempt); renderAll(); return;
    }
    renderMissionDetail();
  }

  function initListeners() {
    document.addEventListener("click", (event) => {
      const select = event.target.closest("[data-adventure-select]");
      if (select) { openMission(select.dataset.adventureSelect); return; }
      const start = event.target.closest("[data-adventure-start]");
      if (start) { startMission(start.dataset.adventureStart); return; }
      const answer = event.target.closest("[data-adventure-answer]");
      if (answer) { handleChoiceAnswer(answer.dataset.adventureAnswer); return; }
      if (event.target.closest("[data-adventure-listen]")) { listenToStep(); return; }
      if (event.target.closest("[data-adventure-complete-production]")) { completeProduction(); return; }
      if (event.target.closest("[data-adventure-next]")) { advanceStep(); return; }
      if (event.target.closest("[data-adventure-back]")) backToMission();
    });
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-adventure-check]")) updateProductionButton();
    });
    document.addEventListener("input", (event) => {
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
      initListeners(); renderAll();
    } catch (error) {
      const panel = $("#adventure-mission-panel");
      if (panel) panel.textContent = error.message || "Petualangan belum dapat dimuat.";
    }
  }

  window.sinauuAdventureBackup = () => cloneProgress(progress);
  window.sinauuAdventureRestore = (next) => { progress = normalizeProgress(next); renderAll(); };
  window.sinauuRenderAdventure = () => { if (curriculum) renderAll(); else void init(); };

  if (window.sinauuWorkspaceReady) void init();
  else window.addEventListener("sinauu:workspace-ready", () => void init(), { once: true });
})();