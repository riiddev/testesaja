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
    $("#matching-deck-note").textContent = vocabulary.length + " kata tersedia · " + total + " pasangan per ronde";
    $("#matching-auto").setAttribute("aria-pressed", String(autoMatch));
    $("#matching-auto").textContent = autoMatch ? "OTOMATIS · ON" : "OTOMATIS · OFF";
    $("#matching-instruction").textContent = autoMatch
      ? "Pilih satu kata bahasa Inggris di kiri, lalu pilih artinya di kanan. Pasangan diperiksa otomatis."
      : "Pilih satu kata dan satu arti, lalu tekan “Periksa pasangan”.";
    $("#matching-board").innerHTML =
      '<div class="matching-column"><div class="matching-column-label"><span>01</span> ENGLISH</div><div class="matching-choices">' +
      game.leftOrder.map(function (p, i) {
        const matched = game.matched.includes(p.id), selected = game.selectedWord === p.id, wrong = game.wrongIds.includes(p.id);
        return '<button class="matching-choice' + (matched ? ' is-matched' : '') + (selected ? ' is-selected' : '') + (wrong ? ' is-wrong' : '') +
          '" type="button" data-match-word="' + escapeHtml(p.id) + '" aria-pressed="' + String(selected) + '"' +
          (matched || game.finished ? ' disabled' : '') + '><span class="matching-index">' + String(i + 1).padStart(2,"0") + '</span><span>' + escapeHtml(p.word) + '</span>' +
          (matched ? '<span class="matching-mark" aria-hidden="true">✓</span>' : '') + '</button>';
      }).join("") + '</div></div>' +
      '<div class="matching-column"><div class="matching-column-label"><span>02</span> INDONESIA</div><div class="matching-choices">' +
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
        '<p class="eyebrow">RONDE SELESAI</p><h2>' + (game.mistakes === 0 ? "Semua pasangan tepat." : "Semua pasangan ditemukan.") + '</h2>' +
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
    const passage = '<details class="reading-passage" open><summary><span><small>READ THE TEXT</small><strong>' + escapeHtml(lessonData.passage.title) +
      '</strong></span><span class="reading-passage-toggle">−</span></summary><div class="reading-passage-body">' +
      lessonData.passage.paragraphs.map(function (paragraph, i) {return '<p><span class="passage-paragraph-number">0' + (i+1) + '</span>' + escapeHtml(paragraph) + '</p>';}).join("") +
      '<span class="reading-passage-source">' + escapeHtml(lessonData.passage.source) + '</span></div></details>';
    if (run.finished) {
      $("#reading-lesson").innerHTML =
        '<div class="reading-result"><p class="eyebrow">KETERAMPILAN SELESAI</p><span class="reading-result-number">' + String(run.sessionCorrect).padStart(2,"0") + '/' + String(questionTotal).padStart(2,"0") +
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
        (run.selected === q.answer ? 'Jawaban tepat.' : 'Belum tepat—lihat alasannya.') + '</strong><p>' + escapeHtml(q.explanation) + '</p><div class="reading-evidence"><span>BUKTI DALAM TEKS</span><p>“' + escapeHtml(q.evidence) + '”</p></div></div>' +
        '<button type="button" class="primary-action reading-check-button" data-reading-next>' +
        (run.questionIndex + 1 < questionTotal ? 'Lanjut ke soal berikutnya →' : 'Selesai & lihat catatan latihan →') + '</button>';
    } else {
      question += '<button type="button" class="primary-action reading-check-button" data-reading-check ' + (run.selected === null ? 'disabled' : '') + '>Periksa jawaban →</button>';
    }
    question += '</div>';
    $("#reading-lesson").innerHTML =
      '<div class="reading-skill-title"><div><p class="eyebrow">' + escapeHtml(skill.tag) + ' · ' + escapeHtml(skill.group === "general" ? "GENERAL INFO" : skill.group === "specific" ? "SPECIFIC INFO" : "IMPLIED INFO / HOTS") +
      '</p><h2>' + escapeHtml(skill.title) + '</h2><p class="reading-skill-subtitle">' + escapeHtml(skill.indonesian) + '</p></div><span class="reading-done-tag">' +
      (p.completed ? 'PERNAH DILATIH' : 'BELUM DILATIH') + '</span></div>' +
      '<div class="reading-definition"><p>' + escapeHtml(skill.definition) + '</p><div class="reading-strategy"><span class="eyebrow">CARA MENDEKATI SOAL</span><ol>' +
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
  init();
})();