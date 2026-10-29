(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const PROGRESS_KEY = "sinauu-extra-learning-v1";
  const vocabPath = "/data/vocabulary.json";
  let vocabulary = [], lessonData = null, groupId = "general", skillId = "main-idea";
  let readingRun = null, matchGame = null, autoMatch = true;
  let matchFeedback = "Pilih satu kata di kiri, lalu pilih artinya di kanan.";
  let matchFeedbackKind = "";
  let progress = loadProgress();

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      return {
        matching: Object.assign({rounds:0,totalMatches:0,totalMistakes:0,bestMistakes:null,auto:true}, saved.matching || {}),
        reading: Object.assign({}, saved.reading || {})
      };
    } catch (_) {
      return {matching:{rounds:0,totalMatches:0,totalMistakes:0,bestMistakes:null,auto:true},reading:{}};
    }
  }
  function persistProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      return true;
    } catch (_) {
      showFeedback("#matching-feedback", "Browser tidak dapat menyimpan progres tambahan. Coba aktifkan penyimpanan situs.", "error");
      return false;
    }
  }
  function showFeedback(selector, message, kind) {
    const el = $(selector);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", kind === "error");
    el.classList.toggle("is-success", kind === "success");
  }
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function meaningOf(word) {
    const accepted = Array.isArray(word.acceptedMeanings) ? word.acceptedMeanings.find(Boolean) : "";
    return String(accepted || word.meaning || "").split(/[;；]/)[0].trim();
  }
  function readingStats() {
    const skills = lessonData ? lessonData.skills : [];
    const tried = skills.filter(s => progress.reading[s.id] && progress.reading[s.id].completed).length;
    const attempts = skills.reduce((n, s) => n + ((progress.reading[s.id] && progress.reading[s.id].attempts) || 0), 0);
    const correct = skills.reduce((n, s) => n + ((progress.reading[s.id] && progress.reading[s.id].correct) || 0), 0);
    return {tried:tried, total:skills.length, attempts:attempts, correct:correct, accuracy:attempts ? Math.round(correct / attempts * 100) : null};
  }
  function prepareMatchingRound() {
    const usable = vocabulary.map(w => ({id:String(w.id || w.word),word:String(w.word || "").trim(),meaning:meaningOf(w)}))
      .filter(w => w.word && w.meaning);
    if (usable.length < 4) {
      $("#matching-board").innerHTML = '<p class="matching-loading">Kosakata dengan arti belum cukup untuk membuat ronde.</p>';
      return;
    }
    let picks = shuffle(usable).slice(0, Math.min(6, usable.length));
    let right = shuffle(picks);
    if (picks.length > 1 && right.every((p, i) => p.id === picks[i].id)) right = right.slice(1).concat(right[0]);
    matchGame = {pairs:picks,leftOrder:picks.slice(),rightOrder:right,matched:[],selectedWord:null,selectedMeaning:null,wrongIds:[],mistakes:0,finished:false};
    matchFeedback = "Pilih satu kata di kiri, lalu pilih artinya di kanan.";
    matchFeedbackKind = "";
    renderMatching();
  }
  function renderMatching() {
    if (!matchGame || !$("#matching-board")) return;
    const game = matchGame, total = game.pairs.length;
    const found = game.matched.length;
    $("#match-count").textContent = found + "/" + total;
    $("#match-mistakes").textContent = String(game.mistakes);
    $("#match-rounds").textContent = String(progress.matching.rounds || 0);
    $("#nav-matching-count").textContent = found + "/" + total;
    
    $("#matching-auto").setAttribute("aria-pressed", String(autoMatch));
    $("#matching-auto").textContent = autoMatch ? "OTOMATIS · ON" : "OTOMATIS · OFF";
    $("#matching-instruction").textContent = autoMatch
      ? "Pilih satu kata bahasa Inggris di kiri, lalu pilih artinya di kanan. Pasangan diperiksa otomatis."
      : "Pilih satu kata dan satu arti, lalu tekan “Periksa pasangan”.";
    $("#matching-board").innerHTML =
      '<div class="matching-column"><div class="matching-column-label">ENGLISH</div><div class="matching-choices">' +
      game.leftOrder.map(function (p, i) {
        const matched = game.matched.includes(p.id), selected = game.selectedWord === p.id, wrong = game.wrongIds.includes(p.id);
        return '<button class="matching-choice' + (matched ? ' is-matched' : '') + (selected ? ' is-selected' : '') + (wrong ? ' is-wrong' : '') +
          '" type="button" data-match-word="' + escapeHtml(p.id) + '" aria-pressed="' + String(selected) + '"' +
          (matched || game.finished ? ' disabled' : '') + '><span class="matching-index">' + String(i + 1).padStart(2,"0") + '</span><span>' + escapeHtml(p.word) + '</span>' +
          (matched ? '<span class="matching-mark" aria-hidden="true">✓</span>' : '') + '</button>';
      }).join("") + '</div></div>' +
      '<div class="matching-column"><div class="matching-column-label">INDONESIA</div><div class="matching-choices">' +
      game.rightOrder.map(function (p, i) {
        const matched = game.matched.includes(p.id), selected = game.selectedMeaning === p.id, wrong = game.wrongIds.includes(p.id);
        return '<button class="matching-choice matching-meaning' + (matched ? ' is-matched' : '') + (selected ? ' is-selected' : '') + (wrong ? ' is-wrong' : '') +
          '" type="button" data-match-meaning="' + escapeHtml(p.id) + '" aria-pressed="' + String(selected) + '"' +
          (matched || game.finished ? ' disabled' : '') + '><span>' + escapeHtml(p.meaning) + '</span>' +
          (matched ? '<span class="matching-mark" aria-hidden="true">✓</span>' : '') + '</button>';
      }).join("") + '</div></div>';
    const check = $("#matching-check");
    check.hidden = autoMatch || game.finished;
    check.disabled = !game.selectedWord || !game.selectedMeaning || game.finished;
    $("#matching-finish").hidden = !game.finished;
    if (game.finished) {
      const score = Math.max(0, 100 - game.mistakes * 10);
      $("#matching-finish").innerHTML =
        '<h2>' + (game.mistakes === 0 ? "Semua pasangan tepat." : "Semua pasangan ditemukan.") + '</h2>' +
        '<p>Kamu mencocokkan ' + total + ' pasangan dengan ' + game.mistakes + ' salah pasang. ' +
        (game.mistakes === 0 ? "Ronde tanpa kesalahan—bagus, lanjutkan ke set kata berikutnya." : "Coba ulang sekali lagi untuk mengurangi salah pasang.") + '</p>' +
        '<button class="primary-action" type="button" data-match-restart>Mulai ronde baru ↻</button>';
      $("#matching-instruction").textContent = "Ronde selesai. Acak kata untuk memulai lagi.";
    }
    $("#matching-feedback").textContent = matchFeedback;
    $("#matching-feedback").classList.toggle("is-success", matchFeedbackKind === "success");
    $("#matching-feedback").classList.toggle("is-error", matchFeedbackKind === "error");
  }
  function checkMatchingPair() {
    if (!matchGame || matchGame.finished || !matchGame.selectedWord || !matchGame.selectedMeaning) return;
    const wordId = matchGame.selectedWord, meaningId = matchGame.selectedMeaning;
    if (wordId === meaningId) {
      const pair = matchGame.pairs.find(p => p.id === wordId);
      if (!pair) return;
      matchGame.matched.push(wordId);
      matchGame.selectedWord = null;
      matchGame.selectedMeaning = null;
      matchGame.wrongIds = [];
      progress.matching.totalMatches = (progress.matching.totalMatches || 0) + 1;
      matchFeedback = "Tepat! “" + pair.word + "” berarti “" + pair.meaning + "”.";
      matchFeedbackKind = "success";
      if (matchGame.matched.length === matchGame.pairs.length) {
        matchGame.finished = true;
        progress.matching.rounds = (progress.matching.rounds || 0) + 1;
        progress.matching.bestMistakes = progress.matching.bestMistakes === null || progress.matching.bestMistakes === undefined
          ? matchGame.mistakes : Math.min(progress.matching.bestMistakes, matchGame.mistakes);
        matchFeedback = "Semua pasangan ditemukan. Ronde ini selesai.";
      }
      persistProgress();
      if (window.sinauuTrackExtraActivity) void window.sinauuTrackExtraActivity({type:"matching",title:pair.word,detail:"Pasangan: "+pair.meaning,correct:true});
      renderMatching();
    } else {
      matchGame.mistakes += 1;
      progress.matching.totalMistakes = (progress.matching.totalMistakes || 0) + 1;
      matchGame.wrongIds = [wordId, meaningId];
      matchFeedback = "Belum cocok. Periksa kembali makna kata, lalu coba lagi.";
      matchFeedbackKind = "error";
      persistProgress();
      if (window.sinauuTrackExtraActivity) void window.sinauuTrackExtraActivity({type:"matching",title:"Pasangan kosakata",detail:"Pasangan belum tepat",correct:false});
      renderMatching();
      if (matchGame._wrongTimer) clearTimeout(matchGame._wrongTimer);
      matchGame._wrongTimer = setTimeout(function () {
        if (!matchGame) return;
        matchGame.wrongIds = [];
        matchGame.selectedWord = null;
        matchGame.selectedMeaning = null;
        matchFeedback = "Coba pasangkan kata berikutnya.";
        matchFeedbackKind = "";
        renderMatching();
      }, 750);
    }
  }
  function renderReadingTabs() {
    if (!lessonData) return;
    $("#reading-category-tabs").innerHTML = lessonData.groups.map(function (g) {
      const active = groupId === g.id;
      return '<button type="button" role="tab" aria-selected="' + String(active) + '" class="reading-category-tab' + (active ? ' is-active' : '') +
        '" data-reading-category="' + escapeHtml(g.id) + '"><span>' + escapeHtml(g.label) + '</span><small>' + g.count + ' keterampilan</small></button>';
    }).join("");
    const group = lessonData.groups.find(g => g.id === groupId);
    $("#reading-category-count").textContent = group ? group.count + " MATERI" : "";
  }
  function startReadingSkill(id) {
    if (!lessonData) return;
    skillId = id;
    readingRun = {skillId:id,questionIndex:0,selected:null,answered:false,finished:false,sessionCorrect:0};
    renderReading();
  }
  function renderReadingSkillList() {
    const items = lessonData.skills.filter(s => s.group === groupId);
    $("#reading-skill-list").innerHTML = items.map(function (s, i) {
      const p = progress.reading[s.id] || {};
      const active = s.id === skillId;
      const done = Boolean(p.completed);
      return '<button type="button" class="reading-skill-button' + (active ? ' is-active' : '') + '" data-reading-skill="' + escapeHtml(s.id) + '">' +
        '<span class="reading-skill-number">' + String(i + 1).padStart(2,"0") + '</span><span class="reading-skill-copy"><strong>' + escapeHtml(s.title) +
        '</strong><small>' + escapeHtml(s.indonesian) + '</small></span><span class="reading-skill-state">' + (done ? '✓' : '↗') + '</span></button>';
    }).join("");
  }
  function renderReadingLesson() {
    const skill = lessonData.skills.find(s => s.id === skillId) || lessonData.skills[0];
    if (!skill) return;
    const run = readingRun && readingRun.skillId === skill.id ? readingRun : (readingRun = {skillId:skill.id,questionIndex:0,selected:null,answered:false,finished:false,sessionCorrect:0});
    const p = progress.reading[skill.id] || {attempts:0,correct:0,completed:false};
    const questionTotal = skill.questions.length;
    const passage = '<details class="reading-passage" open><summary><span><strong>' + escapeHtml(lessonData.passage.title) +
      '</strong></span><span class="reading-passage-toggle">−</span></summary><div class="reading-passage-body">' +
      lessonData.passage.paragraphs.map(function (paragraph, i) {return '<p><span class="passage-paragraph-number">0' + (i+1) + '</span>' + escapeHtml(paragraph) + '</p>';}).join("") +
      '<span class="reading-passage-source">' + escapeHtml(lessonData.passage.source) + '</span></div></details>';
    if (run.finished) {
      $("#reading-lesson").innerHTML =
        '<div class="reading-result"><span class="reading-result-number">' + String(run.sessionCorrect).padStart(2,"0") + '/' + String(questionTotal).padStart(2,"0") +
        '</span><h2>' + escapeHtml(skill.title) + '</h2><p>Kamu menjawab ' + run.sessionCorrect + ' dari ' + questionTotal + ' soal dengan benar pada sesi ini. ' +
        (run.sessionCorrect === questionTotal ? 'Jawabanmu didukung oleh bukti teks.' : 'Baca kembali pembahasan, lalu ulangi latihan untuk menguatkan strategi.') + '</p>' +
        '<div class="reading-result-actions"><button class="secondary-action" type="button" data-reading-retry>Ulangi keterampilan ↻</button><button class="primary-action" type="button" data-reading-next-skill>Lanjut ke keterampilan berikutnya →</button></div></div>';
      updateReadingStats();
      return;
    }
    const q = skill.questions[run.questionIndex];
    let question = '<div class="reading-question-block"><div class="reading-question-meta"><span>SOAL ' + String(run.questionIndex+1).padStart(2,"0") + ' / ' + String(questionTotal).padStart(2,"0") +
      '</span><span>' + escapeHtml(skill.tag) + '</span></div><h3>' + escapeHtml(q.prompt) + '</h3><div class="reading-options" role="group" aria-label="Pilihan jawaban">' +
      q.options.map(function (option, i) {
        return '<button type="button" class="reading-option' + (run.selected === i ? ' is-selected' : '') +
          (run.answered && i === q.answer ? ' is-correct' : '') + (run.answered && run.selected === i && i !== q.answer ? ' is-incorrect' : '') +
          '" data-reading-answer="' + i + '" aria-pressed="' + String(run.selected === i) + '"' + (run.answered ? ' disabled' : '') +
          '><span class="reading-option-letter">' + String.fromCharCode(65+i) + '</span><span>' + escapeHtml(option) + '</span>' +
          (run.answered && i === q.answer ? '<span class="reading-option-mark">✓</span>' : '') + '</button>';
      }).join("") + '</div>';
    if (run.answered) {
      question += '<div class="reading-answer-explanation ' + (run.selected === q.answer ? 'is-correct' : 'is-incorrect') + '"><strong>' +
        (run.selected === q.answer ? 'Jawaban tepat.' : 'Belum tepat—lihat alasannya.') + '</strong><p>' + escapeHtml(q.explanation) + '</p><div class="reading-evidence"><p>“' + escapeHtml(q.evidence) + '”</p></div></div>' +
        '<button type="button" class="primary-action reading-check-button" data-reading-next>' +
        (run.questionIndex + 1 < questionTotal ? 'Lanjut ke soal berikutnya →' : 'Selesai & lihat catatan latihan →') + '</button>';
    } else {
      question += '<button type="button" class="primary-action reading-check-button" data-reading-check ' + (run.selected === null ? 'disabled' : '') + '>Periksa jawaban →</button>';
    }
    question += '</div>';
    $("#reading-lesson").innerHTML =
      '<div class="reading-skill-title"><div><h2>' + escapeHtml(skill.title) + '</h2><p class="reading-skill-subtitle">' + escapeHtml(skill.indonesian) + '</p></div><span class="reading-done-tag">' +
      (p.completed ? 'PERNAH DILATIH' : 'BELUM DILATIH') + '</span></div>' +
      '<div class="reading-definition"><p>' + escapeHtml(skill.definition) + '</p><div class="reading-strategy"><ol>' +
      skill.strategy.map(function (step) {return '<li>' + escapeHtml(step) + '</li>';}).join("") + '</ol></div></div>' +
      passage + question;
    updateReadingStats();
  }
  function updateReadingStats() {
    const stats = readingStats();
    $("#reading-skills-done").textContent = stats.tried + "/" + stats.total;
    $("#reading-question-count").textContent = String(stats.attempts);
    $("#reading-accuracy").textContent = stats.accuracy === null ? "—" : stats.accuracy + "%";
    $("#nav-reading-count").textContent = stats.tried + "/" + stats.total;
    renderReadingTabs();
    renderReadingSkillList();
  }
  function renderReading() {
    if (!lessonData) return;
    if (!lessonData.skills.some(s => s.id === skillId && s.group === groupId)) {
      const first = lessonData.skills.find(s => s.group === groupId);
      if (first) {
        skillId = first.id;
        readingRun = {skillId:skillId,questionIndex:0,selected:null,answered:false,finished:false,sessionCorrect:0};
      }
    }
    renderReadingTabs();
    renderReadingSkillList();
    renderReadingLesson();
  }
  function checkReadingAnswer() {
    if (!readingRun || readingRun.answered || readingRun.finished || readingRun.selected === null) return;
    const skill = lessonData.skills.find(s => s.id === skillId), q = skill.questions[readingRun.questionIndex];
    const correct = readingRun.selected === q.answer;
    const record = progress.reading[skill.id] || {attempts:0,correct:0,completed:false};
    record.attempts += 1;
    if (correct) {record.correct += 1;readingRun.sessionCorrect += 1;}
    progress.reading[skill.id] = record;
    readingRun.answered = true;
    persistProgress();
    if (window.sinauuTrackExtraActivity) void window.sinauuTrackExtraActivity({type:"reading",title:skill.title,detail:"Soal "+String(readingRun.questionIndex+1)+": "+(correct ? "jawaban benar" : "jawaban perlu ditinjau"),correct:correct});
    renderReading();
  }
  function advanceReading() {
    const skill = lessonData.skills.find(s => s.id === skillId);
    if (!readingRun || !readingRun.answered || !skill) return;
    if (readingRun.questionIndex + 1 < skill.questions.length) {
      readingRun.questionIndex += 1;
      readingRun.selected = null;
      readingRun.answered = false;
    } else {
      readingRun.finished = true;
      const record = progress.reading[skill.id] || {attempts:0,correct:0,completed:false};
      record.completed = true;
      progress.reading[skill.id] = record;
      persistProgress();
    }
    renderReading();
  }
  function moveToNextSkill() {
    const current = lessonData.skills.findIndex(s => s.id === skillId);
    const next = lessonData.skills[(current + 1) % lessonData.skills.length];
    if (next) {
      groupId = next.group;
      skillId = next.id;
      readingRun = {skillId:skillId,questionIndex:0,selected:null,answered:false,finished:false,sessionCorrect:0};
      renderReading();
      const skillHeader = $("#reading-lesson");
      if (skillHeader) skillHeader.scrollIntoView({behavior:"smooth",block:"start"});
    }
  }
  function exportProgress() {
    return JSON.parse(JSON.stringify(progress));
  }

  document.addEventListener("click", function (event) {
    const viewTarget = event.target.closest("[data-view-target]");
    if (viewTarget && (viewTarget.dataset.viewTarget === "matching" || viewTarget.dataset.viewTarget === "reading")) {
      if (viewTarget.dataset.viewTarget === "matching") renderMatching();
      if (viewTarget.dataset.viewTarget === "reading") renderReading();
      return;
    }
    const word = event.target.closest("[data-match-word]");
    if (word && matchGame && !matchGame.finished) {
      if (matchGame._wrongTimer) clearTimeout(matchGame._wrongTimer);
      const id = word.dataset.matchWord;
      matchGame.wrongIds = [];
      matchGame.selectedWord = matchGame.selectedWord === id ? null : id;
      matchFeedbackKind = "";
      if (autoMatch && matchGame.selectedWord && matchGame.selectedMeaning) checkMatchingPair();
      else renderMatching();
      return;
    }
    const meaning = event.target.closest("[data-match-meaning]");
    if (meaning && matchGame && !matchGame.finished) {
      if (matchGame._wrongTimer) clearTimeout(matchGame._wrongTimer);
      const id = meaning.dataset.matchMeaning;
      matchGame.wrongIds = [];
      matchGame.selectedMeaning = matchGame.selectedMeaning === id ? null : id;
      matchFeedbackKind = "";
      if (autoMatch && matchGame.selectedWord && matchGame.selectedMeaning) checkMatchingPair();
      else renderMatching();
      return;
    }
    if (event.target.closest("#matching-auto")) {
      autoMatch = !autoMatch;
      progress.matching.auto = autoMatch;
      progress.matching = Object.assign({}, progress.matching);
      persistProgress();
      renderMatching();
      return;
    }
    if (event.target.closest("#matching-check")) {checkMatchingPair();return;}
    if (event.target.closest("#matching-new-round") || event.target.closest("[data-match-restart]")) {prepareMatchingRound();return;}
    const category = event.target.closest("[data-reading-category]");
    if (category && lessonData) {
      groupId = category.dataset.readingCategory;
      const first = lessonData.skills.find(s => s.group === groupId);
      if (first) {
        skillId = first.id;
        readingRun = {skillId:skillId,questionIndex:0,selected:null,answered:false,finished:false,sessionCorrect:0};
      }
      renderReading();
      return;
    }
    const skillButton = event.target.closest("[data-reading-skill]");
    if (skillButton && lessonData) {startReadingSkill(skillButton.dataset.readingSkill);return;}
    const option = event.target.closest("[data-reading-answer]");
    if (option && readingRun && !readingRun.answered) {
      readingRun.selected = Number(option.dataset.readingAnswer);
      renderReading();
      return;
    }
    if (event.target.closest("[data-reading-check]")) {checkReadingAnswer();return;}
    if (event.target.closest("[data-reading-next]")) {advanceReading();return;}
    if (event.target.closest("[data-reading-retry]")) {startReadingSkill(skillId);return;}
    if (event.target.closest("[data-reading-next-skill]")) {moveToNextSkill();return;}
  });

  async function init() {
    try {
      const responses = await Promise.all([fetch(vocabPath,{cache:"no-cache"}),fetch("/data/reading-lessons.json",{cache:"no-cache"})]);
      if (!responses[0].ok || !responses[1].ok) throw new Error("Paket kosakata atau materi reading tidak dapat dimuat.");
      const data = await responses[0].json();
      lessonData = await responses[1].json();
      vocabulary = (data.entries || []).filter(function (w) {return w.word && meaningOf(w);});
      autoMatch = progress.matching.auto !== false;
      prepareMatchingRound();
      renderReading();
    } catch (error) {
      const board = $("#matching-board");
      if (board) board.innerHTML = '<p class="matching-loading">Materi belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.</p>';
      const lesson = $("#reading-lesson");
      if (lesson) lesson.innerHTML = '<p class="matching-loading">Materi belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.</p>';
      console.error("Sinauu extra learning:", error);
    }
  }
  window.sinauuExtraLearningBackup = exportProgress;
  window.sinauuExtraLearningRestore = function (next) {
    if (!next || typeof next !== "object") return;
    progress = {
      matching: Object.assign({rounds:0,totalMatches:0,totalMistakes:0,bestMistakes:null,auto:true}, next.matching || {}),
      reading: Object.assign({}, next.reading || {})
    };
    autoMatch = progress.matching.auto !== false;
    persistProgress();
    if (matchGame) renderMatching();
    if (lessonData) renderReading();
  };

  // Searchable full-text library extracted from the user-provided HABIT PDF.
  const HABIT_PROGRESS_KEY = "sinauu-habit-library-v1";
  let habitLibrary = null, habitLibraryPromise = null, habitSentenceBank = [], habitPassageById = new Map();
  let habitVisibleCount = 9, activeHabitPassageId = null;
  const habitQuestionCache = new Map();
  let habitProgress = loadHabitLibraryProgress();

  function loadHabitLibraryProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(HABIT_PROGRESS_KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (_) {
      return {};
    }
  }
  function persistHabitLibraryProgress() {
    try {
      localStorage.setItem(HABIT_PROGRESS_KEY, JSON.stringify(habitProgress));
      return true;
    } catch (_) {
      const status = $("#habit-library-status");
      if (status) status.textContent = "Progres bacaan tidak bisa disimpan oleh browser ini, tetapi bacaan tetap bisa digunakan.";
      return false;
    }
  }
  function habitWordTokens(value) {
    return (String(value || "").toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)?/g) || []);
  }
  const habitStopWords = new Set(("a an the and or of to in on at for from by with without between into over under after before about as is are do does did can could will would why how what when where who which that your our their its we you they some much more less than not really all both one many each every most other very now still ever again only so up down out off back around own it these those them have has had was were be been being while although because such too however yet if then").split(/\s+/));
  function habitSentences(paragraph) {
    const matches = String(paragraph || "").match(/[^.!?]+[.!?](?:[”’"')\]]+)?(?=\s|$)/g) || [];
    return matches.map(function (s) { return s.replace(/\s+/g, " ").trim(); }).filter(function (s) {
      const count = habitWordTokens(s).length;
      return /[.!?]$/.test(s) && count >= 8 && count <= 30 && s.length >= 48 && s.length <= 185;
    });
  }
  function habitTokenSet(value) {
    return new Set(habitWordTokens(value).filter(function (w) { return !habitStopWords.has(w) && w.length > 2; }));
  }
  function habitJaccard(a, b) {
    let intersection = 0;
    a.forEach(function (word) { if (b.has(word)) intersection += 1; });
    return intersection / Math.max(1, a.size + b.size - intersection);
  }
  function buildHabitSentenceBank() {
    habitPassageById = new Map(habitLibrary.passages.map(function (passage) { return [passage.id, passage]; }));
    habitSentenceBank = [];
    habitLibrary.passages.forEach(function (passage) {
      (passage.paragraphs || []).forEach(function (paragraph, paragraphIndex) {
        habitSentences(paragraph).forEach(function (sentence) {
          habitSentenceBank.push({ passageId: passage.id, paragraphIndex: paragraphIndex, sentence: sentence });
        });
      });
    });
  }
  function getHabitQuestions(passage) {
    if (habitQuestionCache.has(passage.id)) return habitQuestionCache.get(passage.id);
    const own = habitSentenceBank.filter(function (item) { return item.passageId === passage.id; });
    const body = (passage.paragraphs || []).join(" ").toLowerCase();
    const chosen = [];
    const paragraphTargets = [0, Math.floor(((passage.paragraphs || []).length - 1) / 2), (passage.paragraphs || []).length - 1];
    paragraphTargets.forEach(function (paragraphIndex) {
      const candidates = own.filter(function (item) { return item.paragraphIndex === paragraphIndex; });
      let fact = candidates[Math.floor(candidates.length / 2)];
      if (!fact || chosen.some(function (item) { return item.sentence === fact.sentence; })) fact = own.find(function (item) { return !chosen.some(function (chosenItem) { return chosenItem.sentence === item.sentence; }); });
      if (fact) chosen.push(fact);
    });
    own.forEach(function (fact) {
      if (chosen.length < 3 && !chosen.some(function (item) { return item.sentence === fact.sentence; })) chosen.push(fact);
    });
    const questions = chosen.slice(0, 3).map(function (fact, questionIndex) {
      const targetSet = habitTokenSet(passage.title + " " + fact.sentence);
      const ranked = habitSentenceBank.filter(function (item) {
        return item.passageId !== passage.id && !body.includes(item.sentence.toLowerCase()) && item.sentence !== fact.sentence;
      }).map(function (item) {
        const sourcePassage = habitPassageById.get(item.passageId);
        return {
          item: item,
          overlap: habitJaccard(targetSet, habitTokenSet(item.sentence)),
          sameCategory: Boolean(sourcePassage && sourcePassage.category === passage.category)
        };
      }).sort(function (a, b) {
        // Prefer plausible alternatives from the same broad topic before falling back to other topics.
        if (a.sameCategory !== b.sameCategory) return a.sameCategory ? -1 : 1;
        return Math.abs(a.overlap - 0.16) - Math.abs(b.overlap - 0.16);
      });
      const distractors = [], sourceIds = new Set();
      for (const candidate of ranked) {
        if (sourceIds.has(candidate.item.passageId)) continue;
        sourceIds.add(candidate.item.passageId);
        distractors.push(candidate.item.sentence);
        if (distractors.length === 3) break;
      }
      const options = [fact.sentence].concat(distractors);
      let seed = Array.from(passage.id).reduce(function (sum, ch) { return sum + ch.charCodeAt(0); }, 0) + questionIndex * 97 + 19;
      for (let i = options.length - 1; i > 0; i--) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const j = seed % (i + 1);
        [options[i], options[j]] = [options[j], options[i]];
      }
      return {
        id: passage.id + "-detail-" + (questionIndex + 1),
        prompt: "Which statement is explicitly supported by this passage?",
        options: options,
        answer: options.indexOf(fact.sentence),
        explanation: "Pernyataan ini tercantum dalam paragraf " + (fact.paragraphIndex + 1) + " bacaan.",
        evidence: fact.sentence,
        evidenceParagraph: fact.paragraphIndex + 1
      };
    });
    habitQuestionCache.set(passage.id, questions);
    return questions;
  }
  function habitQuestionAnswer(passageId, questionId) {
    return habitProgress[passageId] && habitProgress[passageId].answers && habitProgress[passageId].answers[questionId] || null;
  }
  function habitPassageComplete(passage) {
    const questions = getHabitQuestions(passage);
    return questions.length === 3 && questions.every(function (q) { return !!habitQuestionAnswer(passage.id, q.id); });
  }
  function renderHabitLibraryList() {
    if (!habitLibrary) return;
    const list = $("#habit-library-list");
    if (!list) return;
    const query = ($("#habit-library-search")?.value || "").trim().toLowerCase();
    const category = $("#habit-library-category")?.value || "all";
    const filtered = habitLibrary.passages.filter(function (passage) {
      if (category !== "all" && passage.category !== category) return false;
      if (!query) return true;
      return passage.title.toLowerCase().includes(query) ||
        String(passage.category || "").toLowerCase().includes(query) ||
        (passage.paragraphs || []).some(function (paragraph) { return paragraph.toLowerCase().includes(query); });
    });
    const finished = habitLibrary.passages.filter(habitPassageComplete).length;
    const count = $("#habit-library-count");
    const completed = $("#habit-library-completed");
    const status = $("#habit-library-status");
    if (count) count.textContent = filtered.length + " dari " + habitLibrary.passages.length + " bacaan";
    if (completed) completed.textContent = finished + " bacaan selesai · progres tersimpan di perangkat";
    if (status) status.textContent = "Semua teks dari HABIT.pdf sudah dimasukkan. Pilih bacaan untuk membuka teks lengkap dan 3 soal pemahaman berbasis bukti.";
    const visible = filtered.slice(0, habitVisibleCount);
    list.innerHTML = visible.length ? visible.map(function (passage) {
      const finishedPassage = habitPassageComplete(passage);
      const answers = habitProgress[passage.id] && habitProgress[passage.id].answers || {};
      const correctCount = Object.values(answers).filter(function (item) { return item && item.correct; }).length;
      const excerpt = (passage.paragraphs && passage.paragraphs[0] || "").slice(0, 150);
      const active = activeHabitPassageId === passage.id;
      return '<button class="habit-reading-card' + (active ? ' is-active' : '') + '" type="button" data-habit-open="' + escapeHtml(passage.id) + '" aria-expanded="' + String(active) + '">' +
        '<span class="habit-reading-card-top"><span>' + escapeHtml(passage.category || "Bacaan") + '</span><span>' + (finishedPassage ? '✓ SELESAI' : escapeHtml(String(passage.estimatedMinutes || 2) + ' MENIT')) + '</span></span>' +
        '<strong>' + escapeHtml(passage.title) + '</strong><span class="habit-reading-excerpt">' + escapeHtml(excerpt) + (excerpt.length >= 150 ? '…' : '') + '</span>' +
        '<span class="habit-reading-card-bottom"><span>' + escapeHtml(String(passage.wordCount || 0) + ' kata · PDF hlm. ' + (passage.page || passage.sourcePageStart || '—')) + '</span><span>' + (finishedPassage ? correctCount + '/3 benar' : 'Buka bacaan ↗') + '</span></span></button>';
    }).join("") : '<p class="habit-library-empty">Tidak ada bacaan yang cocok. Coba kata kunci atau kategori lain.</p>';
    const more = $("#habit-library-more");
    if (more) {
      more.hidden = filtered.length <= visible.length;
      more.textContent = "Muat " + Math.min(9, filtered.length - visible.length) + " bacaan lainnya ↓";
    }
  }
  function renderHabitPassageDetail() {
    const detail = $("#habit-library-detail");
    const passage = habitLibrary && habitLibrary.passages.find(function (item) { return item.id === activeHabitPassageId; });
    if (!detail) return;
    if (!passage) { detail.hidden = true; detail.innerHTML = ""; return; }
    detail.hidden = false;
    const questions = getHabitQuestions(passage);
    const answers = habitProgress[passage.id] && habitProgress[passage.id].answers || {};
    const completed = questions.filter(function (q) { return !!answers[q.id]; }).length;
    const correctCount = questions.filter(function (q) { return answers[q.id] && answers[q.id].correct; }).length;
    const paragraphHtml = (passage.paragraphs || []).map(function (paragraph, index) {
      return '<p><span class="habit-paragraph-number">' + String(index + 1).padStart(2, "0") + '</span><span>' + escapeHtml(paragraph) + '</span></p>';
    }).join("");
    const questionHtml = questions.map(function (q, index) {
      const answer = answers[q.id];
      const optionHtml = q.options.map(function (option, optionIndex) {
        const selected = answer && answer.selected === optionIndex;
        const correctOption = answer && optionIndex === q.answer;
        const cls = answer ? (correctOption ? " is-correct" : (selected ? " is-wrong" : "")) : "";
        return '<label class="habit-quiz-option' + cls + '"><input type="radio" name="habit-answer-' + escapeHtml(q.id) + '" value="' + optionIndex + '"' + (selected ? ' checked' : '') + (answer ? ' disabled' : '') + '><span class="habit-quiz-letter">' + String.fromCharCode(65 + optionIndex) + '</span><span>' + escapeHtml(option) + '</span></label>';
      }).join("");
      let feedback = "";
      if (answer) {
        feedback = '<div class="habit-quiz-feedback ' + (answer.correct ? 'is-correct' : 'is-wrong') + '"><strong>' + (answer.correct ? 'Benar.' : 'Belum tepat.') + '</strong> ' + escapeHtml(q.explanation) +
          (!answer.correct ? '<p>Jawaban yang didukung teks: <em>' + escapeHtml(q.options[q.answer]) + '</em></p>' : '') + '</div>';
      }
      return '<section class="habit-question-card"><div class="habit-question-top"><span>DETAIL ' + String(index + 1).padStart(2, "0") + '</span><span>BUKTI · PARAGRAF ' + q.evidenceParagraph + '</span></div><h3>' + escapeHtml(q.prompt) + '</h3><div class="habit-quiz-options">' + optionHtml + '</div><button class="primary-action habit-quiz-submit" type="button" data-habit-check="' + escapeHtml(q.id) + '"' + (answer ? ' disabled' : '') + '>' + (answer ? 'Jawaban tercatat ✓' : 'Periksa jawaban →') + '</button>' + feedback + '</section>';
    }).join("");
    detail.innerHTML = '<div class="habit-detail-heading"><div><span class="eyebrow">' + escapeHtml(passage.category || "HABIT.PDF") + ' · BACAAN ' + String(passage.page || passage.sourcePageStart || "—") + '</span><h2>' + escapeHtml(passage.title) + '</h2><p>' + escapeHtml(String(passage.wordCount || 0) + ' kata · sekitar ' + String(passage.estimatedMinutes || 2) + ' menit') + '</p></div><button type="button" class="habit-detail-close" data-habit-close aria-label="Tutup bacaan">×</button></div>' +
      '<div class="habit-reading-progress"><span>' + (completed === 3 ? 'Latihan selesai' : completed + ' dari 3 soal dijawab') + '</span><span>' + correctCount + '/3 benar</span></div>' +
      '<details class="habit-full-passage" open><summary><span>Bacaan lengkap</span><span>−</span></summary><div class="habit-passage-body">' + paragraphHtml + '</div></details>' +
      '<div class="habit-quiz-heading"><div><span class="eyebrow">CEK PEMAHAMAN</span><h3>Temukan buktinya di teks.</h3><p>Pilih pernyataan yang memang tercantum dalam bacaan. Setiap jawaban memiliki bukti dan penjelasan.</p></div></div>' +
      '<div class="habit-quiz-grid">' + questionHtml + '</div>' +
      (completed === 3 ? '<button class="secondary-action habit-retry" type="button" data-habit-retry>Ulangi 3 soal ↻</button>' : '');
  }
  async function loadHabitLibrary() {
    if (habitLibrary) { renderHabitLibraryList(); return; }
    if (habitLibraryPromise) return habitLibraryPromise;
    const status = $("#habit-library-status");
    if (status) status.textContent = "Memuat semua bacaan dari PDF…";
    habitLibraryPromise = (async function () {
      try {
        const response = await fetch("/data/habit-reading-library.json", {cache:"no-cache"});
        if (!response.ok) throw new Error("HTTP " + response.status);
        const library = await response.json();
        if (!Array.isArray(library.passages) || !library.passages.length) throw new Error("Paket bacaan kosong.");
        habitLibrary = library;
        buildHabitSentenceBank();
        renderHabitLibraryList();
        if (status) status.textContent = library.passages.length + " bacaan dimuat · " + Number(library.extractionSummary && library.extractionSummary.wordCount || 0).toLocaleString("id-ID") + " kata dari HABIT.pdf.";
      } catch (error) {
        if (status) status.textContent = "Koleksi PDF gagal dimuat. Periksa koneksi lalu buka ulang tab Reading Comprehension.";
        console.error("Sinauu HABIT reading library:", error);
      } finally {
        habitLibraryPromise = null;
      }
    })();
    return habitLibraryPromise;
  }
  document.addEventListener("click", function (event) {
    if (event.target.closest('[data-view-target="reading"]')) { void loadHabitLibrary(); return; }
    const open = event.target.closest("[data-habit-open]");
    if (open) {
      activeHabitPassageId = open.dataset.habitOpen;
      renderHabitLibraryList();
      renderHabitPassageDetail();
      $("#habit-library-detail")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
      return;
    }
    if (event.target.closest("#habit-library-more")) {
      habitVisibleCount += 9; renderHabitLibraryList(); return;
    }
    if (event.target.closest("[data-habit-close]")) {
      activeHabitPassageId = null; renderHabitLibraryList(); renderHabitPassageDetail(); return;
    }
    const check = event.target.closest("[data-habit-check]");
    if (check && activeHabitPassageId && habitLibrary) {
      const questionId = check.dataset.habitCheck;
      const question = getHabitQuestions(habitLibrary.passages.find(function (p) { return p.id === activeHabitPassageId; })).find(function (q) { return q.id === questionId; });
      if (!question || habitQuestionAnswer(activeHabitPassageId, questionId)) return;
      const selected = $('#habit-library-detail input[name="habit-answer-' + questionId + '"]:checked');
      if (!selected) {
        const status = $("#habit-library-status");
        if (status) status.textContent = "Pilih satu pernyataan terlebih dahulu, lalu periksa jawabanmu.";
        return;
      }
      const selectedIndex = Number(selected.value);
      const correct = selectedIndex === question.answer;
      if (!habitProgress[activeHabitPassageId]) habitProgress[activeHabitPassageId] = {answers:{}};
      habitProgress[activeHabitPassageId].answers ||= {};
      habitProgress[activeHabitPassageId].answers[questionId] = {selected:selectedIndex,correct:correct,answeredAt:new Date().toISOString()};
      persistHabitLibraryProgress();
      const passage = habitLibrary.passages.find(function (p) { return p.id === activeHabitPassageId; });
      if (typeof window.sinauuTrackExtraActivity === "function") {
        window.sinauuTrackExtraActivity({type:"reading",title:passage.title,detail:"HABIT PDF · soal detail " + (question.evidenceParagraph || ""),correct:correct});
      }
      renderHabitPassageDetail();
      renderHabitLibraryList();
      return;
    }
    if (event.target.closest("[data-habit-retry]") && activeHabitPassageId) {
      delete habitProgress[activeHabitPassageId]; persistHabitLibraryProgress(); renderHabitPassageDetail(); renderHabitLibraryList(); return;
    }
  });
  $("#habit-library-search")?.addEventListener("input", function () { habitVisibleCount = 9; renderHabitLibraryList(); });
  $("#habit-library-category")?.addEventListener("change", function () { habitVisibleCount = 9; renderHabitLibraryList(); });
  init();
})();