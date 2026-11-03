(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  root.classList.add("js-enabled");
  const DB = "sinauu-local-v1", STORE = "state", KEY = "main", FALLBACK = "sinauu-learning-state-v1";
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "UNCLASSIFIED"];
  const LABELS = { A1:"Fondasi", A2:"Sehari-hari", B1:"Intermediate", B2:"Upper-intermediate", C1:"Advanced", UNCLASSIFIED:"Belum diklasifikasikan" };
  const INTERVALS = [1, 3, 8, 16, 30];
  const PLACEMENT_BANDS = ["A1", "A2", "B1", "B2"];
  const PLACEMENT_RESULT_KEY = "sinauu-placement-check-v1";
  const PLACEMENT_BANK = [
    {id:"a1-grammar-1",level:"A1",category:"grammar",prompt:"Mira ___ English every evening.",context:"",options:["study","studies","is study"],answer:1,explanation:"Untuk he, she, atau it pada present simple, kata kerja positif mendapat akhiran -s atau -es."},
    {id:"a1-vocabulary-1",level:"A1",category:"vocabulary",prompt:"You need a dictionary for a few minutes. What do you ask?",context:"",options:["Can I borrow your dictionary?","Can I lend your dictionary?","Can I owe your dictionary?"],answer:0,explanation:"Borrow berarti menerima atau meminjam sesuatu dari orang lain untuk sementara. Lend berarti meminjamkan."},
    {id:"a1-grammar-2",level:"A1",category:"grammar",prompt:"There ___ two pens on the desk.",context:"",options:["is","are","be"],answer:1,explanation:"Gunakan are untuk noun jamak, seperti two pens."},
    {id:"a1-reading-1",level:"A1",category:"reading",prompt:"How does Nina travel to school?",context:"Nina leaves home at seven. She takes the bus and arrives at school at half past seven.",options:["By bus","On foot","By train"],answer:0,explanation:"Teks menyebutkan secara langsung bahwa Nina naik bus ke sekolah."},
    {id:"a1-vocabulary-2",level:"A1",category:"vocabulary",prompt:"The lights are on, so the room is ___.",context:"",options:["quiet","bright","narrow"],answer:1,explanation:"Bright berarti terang atau memiliki banyak cahaya."},

    {id:"a2-grammar-1",level:"A2",category:"grammar",prompt:"We ___ the museum last weekend.",context:"",options:["visit","visited","visiting"],answer:1,explanation:"Last weekend menunjukkan waktu lampau. Gunakan bentuk past simple: visited."},
    {id:"a2-vocabulary-1",level:"A2",category:"vocabulary",prompt:"The train did not arrive on time. It was ___.",context:"",options:["delayed","lately","latest"],answer:0,explanation:"Delayed berarti terlambat atau mengalami penundaan."},
    {id:"a2-grammar-2",level:"A2",category:"grammar",prompt:"How ___ sugar do you put in your tea?",context:"",options:["many","much","few"],answer:1,explanation:"Sugar adalah uncountable noun, jadi gunakan much untuk menanyakan jumlahnya."},
    {id:"a2-reading-1",level:"A2",category:"reading",prompt:"Why did Rafi arrive late?",context:"Rafi planned to cycle to class. Heavy rain started just before he left, so he waited for a bus. The bus arrived fifteen minutes later than expected.",options:["He waited for a bus after the rain started.","He forgot where his class was.","He stopped to buy a bicycle."],answer:0,explanation:"Hujan membuat Rafi tidak jadi bersepeda. Ia menunggu bus, dan bus itu datang terlambat."},
    {id:"a2-vocabulary-2",level:"A2",category:"vocabulary",prompt:"Please ___ the form with your name and address.",context:"",options:["complete","attend","borrow"],answer:0,explanation:"Complete a form berarti mengisi formulir sampai selesai."},

    {id:"b1-grammar-1",level:"B1",category:"grammar",prompt:"I ___ this article twice, so I can explain its main idea.",context:"",options:["read","have read","was reading"],answer:1,explanation:"Present perfect menghubungkan pengalaman atau tindakan sebelumnya dengan keadaan sekarang."},
    {id:"b1-vocabulary-1",level:"B1",category:"vocabulary",prompt:"Although the task looked difficult, it was ___ once we divided it into smaller steps.",context:"",options:["manageable","accidental","temporary"],answer:0,explanation:"Manageable berarti masih dapat ditangani atau diselesaikan dengan cara yang tepat."},
    {id:"b1-grammar-2",level:"B1",category:"grammar",prompt:"If I had more free time, I ___ a volunteer group.",context:"",options:["joined","would join","will join"],answer:1,explanation:"Second conditional menggunakan would + base verb untuk situasi hipotetis saat ini atau masa depan."},
    {id:"b1-reading-1",level:"B1",category:"reading",prompt:"What is the main reason for the library's new schedule?",context:"The city library has extended its weekday opening hours. Staff noticed that many commuters arrived after six in the evening. The change is intended to give them access to books and study spaces without requiring a weekend visit.",options:["To reduce the number of books borrowed.","To support people who finish work late.","To replace the library's weekend service."],answer:1,explanation:"Perubahan jadwal dibuat agar para komuter yang selesai bekerja pada sore hari tetap dapat menggunakan perpustakaan."},
    {id:"b1-vocabulary-2",level:"B1",category:"vocabulary",prompt:"The event went ___ despite the heavy rain.",context:"",options:["ahead","around","out"],answer:0,explanation:"Go ahead berarti tetap dilaksanakan atau dilanjutkan meskipun ada hambatan."},

    {id:"b2-grammar-1",level:"B2",category:"grammar",prompt:"No sooner ___ the meeting than the fire alarm sounded.",context:"",options:["had we started","we had started","did we start"],answer:0,explanation:"No sooner di awal kalimat memicu inversion: auxiliary had diikuti subject, lalu past participle."},
    {id:"b2-vocabulary-1",level:"B2",category:"vocabulary",prompt:"The explanation seemed plausible, but the evidence was too ___ to support a firm conclusion.",context:"",options:["limited","inevitable","ordinary"],answer:0,explanation:"Limited berarti terbatas. Bukti yang terbatas belum cukup untuk mendukung kesimpulan yang kuat."},
    {id:"b2-grammar-2",level:"B2",category:"grammar",prompt:"The committee recommended that the proposal ___ revised before publication.",context:"",options:["be","is","was"],answer:0,explanation:"Dalam pola formal recommend that, bentuk subjunctive memakai base form be."},
    {id:"b2-reading-1",level:"B2",category:"reading",prompt:"What trade-off does the passage describe?",context:"A company introduced a hybrid-work policy after employees asked for more flexibility. An internal survey found higher satisfaction, but some cross-team handoffs became slower. The company kept the flexible schedule while introducing shared office days for teams that depend on frequent coordination.",options:["Lower satisfaction in exchange for fewer meetings.","More flexibility, but some coordination becomes harder.","Less flexibility, with no change to collaboration."],answer:1,explanation:"Kebijakan meningkatkan kepuasan melalui fleksibilitas, tetapi koordinasi antartim menjadi lebih lambat."},
    {id:"b2-vocabulary-2",level:"B2",category:"vocabulary",prompt:"The report was criticized for having ___ the benefits while ignoring the costs.",context:"",options:["overstated","postponed","inherited"],answer:0,explanation:"Overstate berarti menyatakan sesuatu secara berlebihan, misalnya menggambarkan manfaat lebih besar daripada kenyataannya."}
  ];
  let words = [], topics = [], state, db = null, storageMode = "loading";
  let placementRun = null;
  let placementResult = readPlacementResult();

  function readPlacementResult() {
    if (state && state.placementResult) return state.placementResult;
    try {
      const saved = JSON.parse(localStorage.getItem(PLACEMENT_RESULT_KEY) || "null");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
      const validCount = (correct, total, max) =>
        Number.isInteger(correct) && Number.isInteger(total) && total > 0 && total <= max && correct >= 0 && correct <= total;
      if (!PLACEMENT_BANDS.includes(saved.level) ||
          !validCount(saved.correct, saved.total, 20) ||
          typeof saved.completedAt !== "string" || !Number.isFinite(Date.parse(saved.completedAt)) ||
          !Array.isArray(saved.levelScores) || saved.levelScores.length < 1 || saved.levelScores.length > 4 ||
          !Array.isArray(saved.categoryScores) || saved.categoryScores.length < 1 || saved.categoryScores.length > 3) return null;
      const expectedBands = PLACEMENT_BANDS.slice(0, saved.levelScores.length);
      if (!saved.levelScores.every((item, index) =>
          item && item.level === expectedBands[index] && validCount(item.correct, item.total, 5))) return null;
      const allowedCategories = ["vocabulary", "grammar", "reading"];
      if (!saved.categoryScores.every(item =>
          item && allowedCategories.includes(item.category) &&
          typeof item.label === "string" && item.label.trim().length > 0 &&
          validCount(item.correct, item.total, 20))) return null;
      const summedCorrect = saved.levelScores.reduce((sum, item) => sum + item.correct, 0);
      const summedTotal = saved.levelScores.reduce((sum, item) => sum + item.total, 0);
      if (summedCorrect !== saved.correct || summedTotal !== saved.total) return null;
      const highestPassed = saved.levelScores.filter(item => item.correct >= 3).at(-1)?.level || "A1";
      if (saved.level !== highestPassed) return null;
      return saved;
    } catch (_) { return null; }
  }
  function renderPlacementTeaser() {
    const summary = $("#placement-teaser-summary");
    const action = $("#placement-teaser-action");
    if (!summary || !action) return;
    if (placementResult) {
      summary.textContent = "Hasil terakhirmu: perkiraan " + placementResult.level + ", dengan " + placementResult.correct + " dari " + placementResult.total + " jawaban tepat. Tes bisa diulang kapan saja.";
      action.textContent = "Lihat hasil ↗";
    } else {
      summary.textContent = "Cek perkiraan level awalmu melalui kosakata, grammar, dan pemahaman konteks.";
      action.textContent = "Cek level awal ↗";
    }
  }
  function showPlacementPanel(panelId) {
    ["placement-intro","placement-quiz","placement-result"].forEach(id => {
      const node = $("#"+id);
      if (node) node.hidden = id !== panelId;
    });
  }
  function renderPlacementView() {
    if (placementRun) return;
    if (placementResult) {
      renderPlacementResult();
      return;
    }
    showPlacementPanel("placement-intro");
  }
  function startPlacement() {
    placementRun = {levelIndex:0,questionIndex:0,answers:[],locked:false};
    showPlacementPanel("placement-quiz");
    renderPlacementQuestion();
  }
  function currentPlacementQuestion() {
    if (!placementRun) return null;
    return PLACEMENT_BANK.filter(item => item.level === PLACEMENT_BANDS[placementRun.levelIndex])[placementRun.questionIndex] || null;
  }
  function renderPlacementQuestion() {
    const question = currentPlacementQuestion();
    if (!question) return;
    const level = PLACEMENT_BANDS[placementRun.levelIndex];
    const globalNumber = placementRun.levelIndex * 5 + placementRun.questionIndex + 1;
    $("#placement-step-label").textContent = "BAGIAN " + (placementRun.levelIndex + 1) + " · " + level;
    $("#placement-counter").textContent = "SOAL " + globalNumber + "/20";
    $("#placement-kind").textContent = question.category === "vocabulary" ? "VOCABULARY" : question.category === "grammar" ? "GRAMMAR" : "READING";
    $("#placement-question").textContent = question.prompt;
    const context = $("#placement-context");
    context.textContent = question.context || "";
    context.hidden = !question.context;
    const progress = $("#placement-progress");
    const progressValue = Math.round(globalNumber / PLACEMENT_BANK.length * 100);
    progress.setAttribute("aria-valuenow", String(globalNumber));
    $("#placement-progress-bar").style.width = progressValue + "%";
    $("#placement-options").innerHTML = question.options.map((option,index) =>
      '<button type="button" class="placement-option" data-placement-answer="' + index + '"><span class="placement-option-letter">' + String.fromCharCode(65 + index) + '</span><span>' + esc(option) + '</span></button>'
    ).join("");
    const feedback = $("#placement-feedback");
    feedback.hidden = true;
    feedback.className = "placement-feedback";
    feedback.textContent = "";
    $("#placement-next").hidden = true;
    $("#placement-next").textContent = placementRun.questionIndex === 4 ? "Selesaikan bagian →" : "Soal berikutnya →";
  }
  function answerPlacementQuestion(answerIndex) {
    const question = currentPlacementQuestion();
    if (!question || placementRun.locked || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length) return;
    const isCorrect = answerIndex === question.answer;
    placementRun.locked = true;
    placementRun.answers.push({level:question.level,category:question.category,correct:isCorrect});
    $$("#placement-options [data-placement-answer]").forEach(button => {
      const index = Number(button.dataset.placementAnswer);
      button.disabled = true;
      if (index === question.answer) button.classList.add("is-correct");
      if (index === answerIndex && !isCorrect) button.classList.add("is-incorrect");
      button.setAttribute("aria-pressed", String(index === answerIndex));
    });
    const feedback = $("#placement-feedback");
    feedback.hidden = false;
    feedback.classList.add(isCorrect ? "is-correct" : "is-incorrect");
    feedback.innerHTML = '<strong>' + (isCorrect ? "Tepat." : "Belum tepat.") + '</strong><p>' + esc(question.explanation) + '</p>' +
      (isCorrect ? "" : '<p class="placement-correct-answer">Jawaban yang tepat: ' + esc(question.options[question.answer]) + '</p>');
    $("#placement-next").hidden = false;
  }
  function advancePlacement() {
    if (!placementRun || !placementRun.locked) return;
    if (placementRun.questionIndex < 4) {
      placementRun.questionIndex += 1;
      placementRun.locked = false;
      renderPlacementQuestion();
      return;
    }
    const level = PLACEMENT_BANDS[placementRun.levelIndex];
    const score = placementRun.answers.filter(item => item.level === level && item.correct).length;
    if (score < 3 || placementRun.levelIndex === PLACEMENT_BANDS.length - 1) {
      finishPlacement();
      return;
    }
    placementRun.levelIndex += 1;
    placementRun.questionIndex = 0;
    placementRun.locked = false;
    renderPlacementQuestion();
  }
  function finishPlacement() {
    if (!placementRun) return;
    const levelScores = PLACEMENT_BANDS.slice(0,placementRun.levelIndex + 1).map(level => ({
      level,
      correct:placementRun.answers.filter(item => item.level === level && item.correct).length,
      total:placementRun.answers.filter(item => item.level === level).length
    }));
    const passed = levelScores.filter(item => item.correct >= 3);
    const categoryLabels = {vocabulary:"Kosakata",grammar:"Grammar",reading:"Pemahaman bacaan"};
    const categoryScores = ["vocabulary","grammar","reading"].map(category => {
      const items = placementRun.answers.filter(item => item.category === category);
      return {category,label:categoryLabels[category],correct:items.filter(item => item.correct).length,total:items.length};
    }).filter(item => item.total > 0);
    const estimatedLevel = passed.length ? passed[passed.length - 1].level : "A1";
    const lastBand = levelScores[levelScores.length - 1];
    const allBandsPassed = levelScores.length === PLACEMENT_BANDS.length && lastBand.correct >= 3;
    let summary;
    if (allBandsPassed) {
      summary = "Jawabanmu cukup konsisten hingga B2. Gunakan hasil ini sebagai titik awal, lalu lanjutkan latihan pada konteks yang lebih beragam.";
    } else if (passed.length) {
      summary = "Fondasi " + estimatedLevel + " mulai terlihat. Bagian " + lastBand.level + " masih perlu diperkuat sebelum kamu melangkah lebih jauh.";
    } else {
      summary = "Mulai dari materi A1 terlebih dahulu. Bangun kebiasaan memahami kata, menyusun kalimat sederhana, dan membaca konteks pendek.";
    }
    const weakAreas = categoryScores.filter(item => item.correct / item.total < 0.6).map(item => item.label);
    placementResult = {
      level:estimatedLevel,
      correct:placementRun.answers.filter(item => item.correct).length,
      total:placementRun.answers.length,
      levelScores,
      categoryScores,
      completedAt:new Date().toISOString()
    };
    if (state) state.placementResult = placementResult;
    if (!window.sinauuIsCloudVerified?.()) {
      try { localStorage.setItem(PLACEMENT_RESULT_KEY,JSON.stringify(placementResult)); } catch (_) { /* Keep the result for this visit. */ }
    }
    void save();
    placementRun = null;
    $("#placement-result-level").textContent = estimatedLevel;
    $("#placement-score").textContent = placementResult.correct + "/" + placementResult.total;
    $("#placement-result-title").textContent = passed.length ? "Perkiraan kemampuanmu: " + estimatedLevel : "Mulai dari fondasi A1.";
    $("#placement-result-summary").textContent = summary;
    $("#placement-level-breakdown").innerHTML = levelScores.map(item =>
      '<div class="placement-level-row"><span>' + item.level + '</span><strong>' + item.correct + '/' + item.total + '</strong><small>' + (item.correct >= 3 ? "Cukup kuat untuk lanjut" : "Perlu diperkuat") + '</small></div>'
    ).join("");
    $("#placement-category-breakdown").innerHTML = categoryScores.map(item =>
      '<div class="placement-category-row"><span>' + item.label + '</span><strong>' + item.correct + '/' + item.total + '</strong></div>'
    ).join("");
    $("#placement-focus-note").textContent = weakAreas.length
      ? "Bagian yang bisa kamu latih lebih dulu: " + weakAreas.join(", ") + ". Hasil per kategori berasal dari jumlah soal yang terbatas, jadi gunakan sebagai petunjuk, bukan label kemampuan tetap."
      : "Belum terlihat satu area yang tertinggal jauh. Pertahankan latihan kosakata, grammar, dan bacaan secara seimbang.";
    $("#placement-result-date").textContent = "Diselesaikan " + new Intl.DateTimeFormat("id-ID",{dateStyle:"long"}).format(new Date(placementResult.completedAt)) + " · Tersimpan di perangkat ini";
    showPlacementPanel("placement-result");
    renderPlacementTeaser();
  }
  function renderPlacementResult() {
    if (!placementResult) {
      showPlacementPanel("placement-intro");
      return;
    }
    $("#placement-result-level").textContent = placementResult.level;
    $("#placement-score").textContent = placementResult.correct + "/" + placementResult.total;
    const latest = placementResult.levelScores[placementResult.levelScores.length - 1];
    const passed = placementResult.levelScores.filter(item => item.correct >= 3);
    const allBandsPassed = placementResult.levelScores.length === PLACEMENT_BANDS.length && latest.level === "B2" && latest.correct >= 3;
    $("#placement-result-title").textContent = passed.length ? "Perkiraan kemampuanmu: " + placementResult.level : "Mulai dari fondasi A1.";
    $("#placement-result-summary").textContent = allBandsPassed
      ? "Jawabanmu cukup konsisten hingga B2. Gunakan hasil ini sebagai titik awal, lalu lanjutkan latihan pada konteks yang lebih beragam."
      : passed.length
        ? "Fondasi " + placementResult.level + " mulai terlihat. Bagian " + latest.level + " masih perlu diperkuat sebelum kamu melangkah lebih jauh."
        : "Mulai dari materi A1 terlebih dahulu. Bangun kebiasaan memahami kata, menyusun kalimat sederhana, dan membaca konteks pendek.";
    $("#placement-level-breakdown").innerHTML = placementResult.levelScores.map(item =>
      '<div class="placement-level-row"><span>' + item.level + '</span><strong>' + item.correct + '/' + item.total + '</strong><small>' + (item.correct >= 3 ? "Cukup kuat untuk lanjut" : "Perlu diperkuat") + '</small></div>'
    ).join("");
    $("#placement-category-breakdown").innerHTML = placementResult.categoryScores.map(item =>
      '<div class="placement-category-row"><span>' + item.label + '</span><strong>' + item.correct + '/' + item.total + '</strong></div>'
    ).join("");
    const weakAreas = placementResult.categoryScores.filter(item => item.correct / item.total < 0.6).map(item => item.label);
    $("#placement-focus-note").textContent = weakAreas.length
      ? "Bagian yang bisa kamu latih lebih dulu: " + weakAreas.join(", ") + ". Hasil per kategori berasal dari jumlah soal yang terbatas, jadi gunakan sebagai petunjuk, bukan label kemampuan tetap."
      : "Belum terlihat satu area yang tertinggal jauh. Pertahankan latihan kosakata, grammar, dan bacaan secara seimbang.";
    $("#placement-result-date").textContent = "Diselesaikan " + new Intl.DateTimeFormat("id-ID",{dateStyle:"long"}).format(new Date(placementResult.completedAt)) + " · Tersimpan di perangkat ini";
    showPlacementPanel("placement-result");
  }

  let view = "overview", selectedWord = null, activeStudy = null, activeTopic = null, listLimit = 100, vocabDetailOpen = false, grammarDetailOpen = false, cloudApplying = false;
  let reviewFilterTab = "due", reviewSkillFilter = "all";
  const grammarUI = {};

  function freshState() {
    return { schemaVersion:1, settings:{ theme:"light", dailyGoal:10 }, wordProgress:{}, favorites:[], grammarProgress:{}, events:[], history:[], updatedAt:new Date().toISOString() };
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  }
  function norm(v) {
    return String(v == null ? "" : v).toLocaleLowerCase("id-ID").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘'".,!?;:()[\]{}]/g, " ").replace(/\s+/g, " ").trim();
  }
  function dayKey(date = new Date()) { return date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0"); }
  function dateFromDay(day) { return day ? new Date(day + "T12:00:00") : null; }
  function dayDistance(from, to) {
    const a = dateFromDay(from), b = dateFromDay(to);
    return a && b && !Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) ? Math.floor((b-a)/86400000) : 0;
  }
  function plusDays(date, days) { const d = new Date(date); d.setDate(d.getDate()+days); return d; }
  function fmtDate(d, opts) {
    if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", opts || { day:"2-digit", month:"short" }).format(d);
  }
  function uid() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8); }
  function toast(message) {
    const node = $("#toast"); if (!node) return;
    node.textContent = message; node.classList.add("is-visible");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("is-visible"), 3000);
  }
  function labelStorage() {
    const el = $("#storage-indicator"); if (!el) return;
    el.classList.toggle("is-fallback", storageMode !== "indexedDB" && storageMode !== "cloud");
    $("span", el).textContent = storageMode === "cloud" ? "Tersimpan di cloud"
      : storageMode === "memory" ? "Tersimpan di memori"
      : storageMode === "waiting" ? "Menunggu sinkronisasi"
      : storageMode === "syncing" ? "Menyinkronkan…"
      : storageMode === "offline" ? "Offline · Menunggu internet"
      : storageMode === "conflict" ? "Konflik revisi"
      : storageMode === "error" ? "Gagal menyimpan"
      : storageMode === "indexedDB" ? "Tersimpan di perangkat"
      : storageMode === "localStorage" ? "Penyimpanan cadangan"
      : "Penyimpanan terbatas";
  }
  function openDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("IndexedDB tidak tersedia"));
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath:"key" }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Gagal membuka penyimpanan"));
    });
  }
  function readDB(database) {
    return new Promise((resolve,reject) => {
      const req = database.transaction(STORE,"readonly").objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  }
  function writeDB(database, value) {
    return new Promise((resolve,reject) => {
      const tx = database.transaction(STORE,"readwrite");
      tx.objectStore(STORE).put({key:KEY,value});
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
  function sanitize(raw) {
    if (!raw || typeof raw !== "object" || raw.schemaVersion !== 1) throw new Error("Versi backup tidak dikenali. Data saat ini tidak diubah.");
    const s = freshState(), settings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
    s.settings.theme = settings.theme === "dark" ? "dark" : "light";
    s.settings.dailyGoal = [5,10,15,20].includes(Number(settings.dailyGoal)) ? Number(settings.dailyGoal) : 10;
    s.wordProgress = {};
    if (raw.wordProgress && typeof raw.wordProgress === "object" && !Array.isArray(raw.wordProgress)) {
      for (const [k, v] of Object.entries(raw.wordProgress)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          s.wordProgress[k] = v;
        }
      }
    }
    s.favorites = Array.isArray(raw.favorites) ? raw.favorites.filter(x => typeof x === "string").slice(0,10000) : [];
    s.grammarProgress = {};
    if (raw.grammarProgress && typeof raw.grammarProgress === "object" && !Array.isArray(raw.grammarProgress)) {
      for (const [k, v] of Object.entries(raw.grammarProgress)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          s.grammarProgress[k] = v;
        }
      }
    }
    s.events = Array.isArray(raw.events) ? raw.events.filter(x => x && typeof x === "object").slice(-5000) : [];
    s.history = Array.isArray(raw.history) ? raw.history.filter(x => x && typeof x === "object").slice(-1000) : [];
    s.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString();
    return s;
  }
  async function loadState() {
    const hasSession = (() => {
      try {
        const s = JSON.parse(localStorage.getItem("sinauu-cloud-session-v1") || "null");
        return Boolean(s && s.access_token);
      } catch { return false; }
    })();

    try {
      db = await openDB();
      let raw = await readDB(db);
      if (!raw) {
        try {
          const fb = localStorage.getItem(FALLBACK);
          if (fb) {
            raw = JSON.parse(fb);
            await writeDB(db, sanitize(raw));
          }
        } catch (_) {}
      }
      state = raw ? sanitize(raw) : freshState();
      storageMode = hasSession ? (navigator.onLine ? "syncing" : "offline") : "indexedDB";
      if (!raw && !hasSession) await writeDB(db, state);
    } catch (_) {
      db = null;
      try {
        const raw = localStorage.getItem(FALLBACK);
        state = raw ? sanitize(JSON.parse(raw)) : freshState();
        storageMode = hasSession ? (navigator.onLine ? "syncing" : "offline") : "localStorage";
        if (!raw && !hasSession) localStorage.setItem(FALLBACK, JSON.stringify(state));
      } catch (_) {
        storageMode = "unavailable"; state = freshState();
      }
    }
    root.dataset.theme = state.settings.theme; labelStorage();
  }
  function readExtraSnapshots() {
    const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) { return {}; } };
    const locAdv = read("sinauu-adventure-progress-v1");
    const memAdv = window.sinauuAdventureBackup?.() || {};
    const adv = Object.assign({}, memAdv, locAdv);
    if (locAdv.missionProgress || memAdv.missionProgress) {
      adv.missionProgress = Object.assign({}, memAdv.missionProgress, locAdv.missionProgress);
    }
    if (locAdv.dialogueProgress || memAdv.dialogueProgress) {
      adv.dialogueProgress = Object.assign({}, memAdv.dialogueProgress, locAdv.dialogueProgress);
    }
    if (locAdv.listeningProgress || memAdv.listeningProgress) {
      adv.listeningProgress = Object.assign({}, memAdv.listeningProgress, locAdv.listeningProgress);
    }
    if (locAdv.pronunciationProgress || memAdv.pronunciationProgress) {
      adv.pronunciationProgress = Object.assign({}, memAdv.pronunciationProgress, locAdv.pronunciationProgress);
    }
    if (locAdv.storyProgress || memAdv.storyProgress) {
      adv.storyProgress = Object.assign({}, memAdv.storyProgress, locAdv.storyProgress);
    }
    if (locAdv.dailyQuests || memAdv.dailyQuests) {
      adv.dailyQuests = Object.assign({}, memAdv.dailyQuests, locAdv.dailyQuests);
    }
    if (locAdv.mistakeJournal || memAdv.mistakeJournal) {
      adv.mistakeJournal = Object.assign({}, memAdv.mistakeJournal, locAdv.mistakeJournal);
    }
    if (locAdv.xpLedger || memAdv.xpLedger) {
      adv.xpLedger = Object.assign({}, memAdv.xpLedger, locAdv.xpLedger);
    }
    if (locAdv.listeningRate != null) {
      adv.listeningRate = locAdv.listeningRate;
    }
    if (locAdv.studioSessions?.length) {
      adv.studioSessions = locAdv.studioSessions;
    }

    const locExtra = read("sinauu-extra-learning-v1");
    const memExtra = window.sinauuExtraLearningBackup?.() || {};
    const locHabit = read("sinauu-habit-library-v1");
    const memHabit = window.sinauuHabitLibraryBackup?.() || {};
    const locDrafts = read("sinauu-adventure-studio-drafts-v1:local");
    const memDrafts = window.sinauuStudioDraftsBackup?.() || {};

    return {
      extraLearning: Object.assign({}, memExtra, locExtra),
      habitProgress: Object.assign({}, memHabit, locHabit),
      adventureProgress: adv,
      studioDrafts: Object.assign({}, memDrafts, locDrafts)
    };
  }
  function notifyCloudState() {
    if (cloudApplying || !state) return;
    window.dispatchEvent(new CustomEvent("sinauu:local-state-saved", { detail:{schemaVersion:1,core:state,extras:readExtraSnapshots()} }));
  }
  async function save() {
    state.updatedAt = new Date().toISOString();
    let stored = false;
    if (window.sinauuIsCloudVerified?.()) {
      stored = true;
      storageMode = navigator.onLine ? "memory" : "offline";
      labelStorage();
    } else {
      try {
        if (db) {
          await writeDB(db, state);
          labelStorage();
          stored = true;
        } else {
          localStorage.setItem(FALLBACK, JSON.stringify(state));
          storageMode = "localStorage";
          labelStorage();
          stored = true;
        }
      } catch (_) {
        try {
          localStorage.setItem(FALLBACK, JSON.stringify(state));
          storageMode = "localStorage";
          labelStorage();
          stored = true;
        } catch (_) {
          storageMode = "unavailable"; labelStorage(); toast("Browser tidak dapat menyimpan progres. Coba ekspor backup.");
        }
      }
    }
    if (stored) notifyCloudState();
    return stored;
  }
  async function loadGzipBase64(path) {
    const response=await fetch(path,{cache:"no-cache"});
    if(!response.ok)throw new Error("Korpus Oxford tidak bisa dimuat ("+path+").");
    if(!("DecompressionStream" in window))throw new Error("Browser ini belum mendukung pembacaan korpus terkompresi. Coba browser yang lebih baru.");
    const encoded=(await response.text()).trim(),binary=atob(encoded),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  }
  function canStudyWord(w){return !!(w && (w.studyReady || state?.wordProgress?.[w.id]?.savedContext) && w.meaning && (w.example || state?.wordProgress?.[w.id]?.savedContext));}
  async function loadDatasets() {
    const SESSION_DATASET_KEY = "sinauu_parsed_datasets_v2";
    try {
      const cached = sessionStorage.getItem(SESSION_DATASET_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.words) && parsed.words.length > 500 && Array.isArray(parsed.topics)) {
          words = parsed.words;
          topics = parsed.topics;
          return;
        }
      }
    } catch (_) {}

    const paths=["A1","A2","B1","B2","UNCLASSIFIED"].map(level=>"/data/oxford3000/"+level+".json.gz.b64");
    const requests=await Promise.all([
      fetch("/data/vocabulary.json"),
      fetch("/data/grammar.json"),
      ...paths.map(loadGzipBase64),
      loadGzipBase64("/data/oxford3000/editorial-overrides.json.gz.b64")
    ]);
    if(!requests[0].ok||!requests[1].ok)throw new Error("Dataset kosakata dasar atau grammar tidak bisa dimuat.");
    const vd=await requests[0].json(),gd=await requests[1].json(),corpora=requests.slice(2,7),editorial=requests[7];
    if(!Array.isArray(vd.entries)||!Array.isArray(gd.topics)||corpora.some(c=>!Array.isArray(c.entries))||!Array.isArray(editorial.entries))throw new Error("Bentuk dataset tidak sesuai skema.");
    // The compressed editorial bundle contains high-frequency A1/A2 entries added to the original starter set.
    vd.entries=editorial.entries.concat(vd.entries);
    const merged=new Map();
    for(const corpus of corpora)for(const entry of corpus.entries)merged.set(norm(entry.word),Object.assign({},entry,{isOxford3000:true}));
    for(const entry of vd.entries){
      const key=norm(entry.word),sourceEntry=merged.get(key),curatedReady=Boolean(entry.meaning&&entry.example&&entry.translation);
      const mergedEntry=sourceEntry
        ?Object.assign({},sourceEntry,entry,{level:sourceEntry.level,source:sourceEntry.source,isOxford3000:true,studyReady:curatedReady,translationStatus:entry.translationStatus||"curated",contentStatus:entry.contentStatus|| (curatedReady?"curated-complete":sourceEntry.contentStatus)})
        :Object.assign({},entry,{isOxford3000:false,studyReady:curatedReady,translationStatus:entry.translationStatus||"curated",contentStatus:entry.contentStatus|| (curatedReady?"curated-complete":"needs-content"),source:{name:"SinauuEnglish curated starter",note:"Entry starter independen, bukan bagian dari hitungan Oxford 3000."}});
      merged.set(key,mergedEntry);
    }
    words=Array.from(merged.values());topics=gd.topics;
    const ids=new Set(),lemmas=new Set();
    for(const w of words){
      w.partOfSpeech ||= "unclassified";w.topics ||= [];w.forms ||= [];w.collocations ||= [];w.acceptedMeanings ||= [];
      if(!w.acceptedMeanings.length&&w.meaning)w.acceptedMeanings=w.meaning.split(/[;；]/).map(x=>x.trim()).filter(Boolean);
      if(!w.id||!w.word||ids.has(w.id)||lemmas.has(norm(w.word)))throw new Error("Audit dataset gagal: ID atau headword duplikat.");
      ids.add(w.id);lemmas.add(norm(w.word));
    }
    try {
      sessionStorage.setItem(SESSION_DATASET_KEY, JSON.stringify({ words, topics }));
    } catch (_) {}
  }
  function ensureWordEntryInList(id, p) {
    if (!id || !Array.isArray(words)) return;
    const cleanId = String(id).trim().toLowerCase();
    const found = words.find(w => w.id === id || norm(w.word) === norm(cleanId));
    if (!found) {
      const lemma = p?.savedContext?.originalWord || id;
      const meaning = p?.savedContext?.meaning || lemma;
      const example = p?.savedContext?.sentence || "";
      words.push({
        id: id,
        word: lemma,
        level: "B2",
        partOfSpeech: p?.savedContext?.pos || "unclassified",
        meaning: meaning,
        example: example,
        translation: meaning,
        phonetic: p?.savedContext?.phonetic || "",
        isOxford3000: false,
        studyReady: true,
        contentStatus: "curated-complete",
        source: { name: p?.savedContext?.sourceTitle || "Kamus Kontekstual", note: "Kosakata dari bacaan kontekstual" }
      });
    } else if (p?.savedContext?.meaning && (!found.meaning || found.meaning === found.word)) {
      found.meaning = p.savedContext.meaning;
      found.translation = p.savedContext.meaning;
    }
  }
  function ensureProgress(id) {
    if (!state.wordProgress[id]) state.wordProgress[id] = { attempts:[], skillEvidence:{recall:false,context:false,production:false}, firstSeenDate:null, studiedDates:[], nextReviewAt:null, reviewSuccesses:0, reviewDates:[], reviewHistory:[], contextQuestionIds:[], consecutiveErrors:0, weak:false, masteredAt:null };
    const p = state.wordProgress[id];
    p.attempts ||= []; p.skillEvidence ||= {recall:false,context:false,production:false}; p.studiedDates ||= []; p.reviewDates ||= []; p.reviewHistory ||= []; p.contextQuestionIds ||= [];
    return p;
  }
  function masteryGate(p) {
    return !!(p && p.skillEvidence && p.skillEvidence.recall && p.skillEvidence.context && p.skillEvidence.production &&
      p.reviewSuccesses >= 3 && p.reviewDates.length >= 3 && dayDistance(p.firstSeenDate,p.reviewDates[p.reviewDates.length-1]) >= 12 &&
      p.studiedDates.length >= 4 && !p.weak);
  }
  const statusInfo = {
    new:{label:"BARU",cls:"status-new"}, learning:{label:"BELAJAR",cls:"status-learning"},
    due:{label:"REVIEW",cls:"status-due"}, weak:{label:"LEMAH",cls:"status-weak"}, mastered:{label:"MASTERED",cls:"status-mastered"}
  };
  function statusOf(w) {
    const p = state.wordProgress[w.id];
    if (!p || !p.attempts || !p.attempts.length) return "new";
    if (p.weak) return "weak";
    if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= Date.now()) return "due";
    if (masteryGate(p)) return "mastered";
    return "learning";
  }
  function dueWords() { return words.filter(w => canStudyWord(w) && ["due","weak"].includes(statusOf(w)) && state.wordProgress[w.id].nextReviewAt && new Date(state.wordProgress[w.id].nextReviewAt).getTime() <= Date.now()); }
  function pushHistory(item) {
    state.history.unshift(Object.assign({id:uid(),at:new Date().toISOString(),date:dayKey()},item));
    if (state.history.length > 1000) state.history.length = 1000;
  }
  function activityToday() { return state.history.filter(x => x.date === dayKey()).length; }
  let activePracticeModule = null;

  function openPracticeModule(moduleId) {
    closeMobileDrawer?.();
    closeContextualVocab?.();
    if (["vocabulary", "grammar", "reading"].includes(moduleId)) {
      setView(moduleId);
      return;
    }
    view = "practice";
    activePracticeModule = moduleId;
    $$(".view").forEach(el => el.classList.toggle("is-visible", el.dataset.view === "practice"));
    $$(".side-link").forEach(el => {
      const active = el.dataset.viewTarget === "practice";
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });

    const hubHome = $("#practice-hub-home");
    const panel = $("#practice-module-panel");
    const kicker = $("#practice-module-kicker");
    const title = $("#practice-module-title");

    if (hubHome) hubHome.hidden = true;
    if (panel) panel.hidden = false;

    $$(".practice-submodule").forEach(el => {
      el.hidden = el.dataset.practiceSubmodule !== moduleId;
    });

    const meta = {
      "speaking": { kicker: "BERBICARA", title: "Speaking Studio" },
      "writing": { kicker: "MENULIS", title: "Writing Studio" },
      "reading-stories": { kicker: "BACAAN", title: "Everyday Stories" },
      "listening": { kicker: "MENYIMAK", title: "Listening Lab & Everyday English" },
      "pronunciation": { kicker: "PENGUCAPAN", title: "Pronunciation Studio" }
    };
    if (meta[moduleId]) {
      if (kicker) kicker.textContent = meta[moduleId].kicker;
      if (title) title.textContent = meta[moduleId].title;
    }
    const topbarCurrent = $("#topbar-current");
    if (topbarCurrent) topbarCurrent.textContent = "Latihan · " + (meta[moduleId]?.title || "Modul");

    window.sinauuRenderAdventure?.();
    if (window.sinauMotionScrollToTop) window.sinauMotionScrollToTop();
    else window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }

  function closePracticeModule() {
    activePracticeModule = null;
    setView("practice");
  }

  let practiceSearchQuery = "";
  let practiceActiveFilter = "all";

  function renderPracticeHub() {
    const grid = $("#practice-modules-grid");
    if (!grid || !state) return;
    const extras = readExtraSnapshots();
    const extraLearn = extras.extraLearning || {};
    const adv = extras.adventureProgress || {};

    const vocabCount = words.filter(w => statusOf(w) !== "new").length;
    const masteredCount = words.filter(w => statusOf(w) === "mastered").length;
    const dueCount = dueWords().length;

    const topicsTried = topics.filter(t => Object.keys((state.grammarProgress[t.id] && state.grammarProgress[t.id].answers) || {}).length > 0).length;

    const habitDone = Object.values(window.sinauuExtraLearningBackup?.().reading || {}).filter(r => r && r.completed).length;
    const storiesDone = Object.values(adv.storyProgress || {}).filter(s => s && s.completed).length;

    const listeningDone = Object.values(adv.listeningLabProgress || {}).filter(l => l && l.completed).length +
      Object.values(adv.everydayEnglishProgress || {}).filter(d => d && d.completed).length;

    const speakingSessions = (adv.studioSessions || []).filter(s => s.studioType === "speaking").length;
    const writingSessions = (adv.studioSessions || []).filter(s => s.studioType === "writing").length;
    const pronunciationDone = Object.values(adv.pronunciationProgress || {}).filter(p => p && p.completed).length;

    const modules = [
      {
        id: "vocabulary",
        category: "core",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
        kicker: "KOSAKATA · OXFORD 3000",
        title: "Kosakata",
        desc: "3000+ kata penting dengan makna kontekstual, contoh kalimat, dan kolokasi.",
        statVal: vocabCount > 0 ? (masteredCount + " mastered · " + dueCount + " review") : "Belum mulai",
        statNote: vocabCount > 0 ? (vocabCount + " kata dicoba") : "Mulai sesi pertama",
        actionText: "Buka Kosakata →"
      },
      {
        id: "grammar",
        category: "core",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
        kicker: "TATA BAHASA · A1–B2",
        title: "Tata Bahasa",
        desc: "Aturan pola kalimat, rumus praktis, kesalahan umum, dan latihan soal terarah.",
        statVal: topicsTried + "/" + topics.length,
        statNote: "topik sudah dicoba",
        actionText: "Buka Tata Bahasa →"
      },
      {
        id: "reading",
        category: "comprehension",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>',
        kicker: "PEMAHAMAN BACAAN",
        title: "Pemahaman Bacaan",
        desc: "156 bacaan HABIT dan 8 cerita bertingkat dengan analisis dan pertanyaan teks.",
        statVal: (habitDone + storiesDone) + " bacaan & cerita",
        statNote: habitDone + " HABIT · " + storiesDone + " cerita",
        actionText: "Buka Koleksi HABIT →",
        subAction: { id: "reading-stories", text: "Buka Cerita ↗" }
      },
      {
        id: "listening",
        category: "comprehension",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
        kicker: "MENYIMAK & DIALOG",
        title: "Menyimak",
        desc: "Listening Lab audio comprehension dan Everyday English percakapan dua arah.",
        statVal: listeningDone + " aktivitas selesai",
        statNote: "Audio, transkrip, & dialog",
        actionText: "Buka Menyimak →"
      },
      {
        id: "speaking",
        category: "production",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        kicker: "PERCAKAPAN DUA ARAH",
        title: "Berbicara",
        desc: "Speaking Studio: simulasi dialog kontekstual dengan panduan dan checklist mandiri.",
        statVal: speakingSessions + " sesi selesai",
        statNote: "Lokal & tanpa rekam suara",
        actionText: "Buka Speaking Studio →"
      },
      {
        id: "writing",
        category: "production",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="2" x2="22" y2="6"/><path d="m7.5 20.5 9-9L13 8l-9 9 1 4z"/></svg>',
        kicker: "MENULIS & REVISI",
        title: "Menulis",
        desc: "Writing Studio: panduan menyusun paragraf, revisi terarah, dan autosave draft lokal.",
        statVal: writingSessions + " sesi selesai",
        statNote: "Draft tersimpan lokal",
        actionText: "Buka Writing Studio →"
      },
      {
        id: "pronunciation",
        category: "production",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
        kicker: "FONETIK & INTONASI",
        title: "Pengucapan",
        desc: "Pronunciation Studio: 16 aktivitas fonetik bertingkat dengan analisis mikrofon lokal.",
        statVal: pronunciationDone + "/16 aktivitas selesai",
        statNote: "Umpan balik lokal browser",
        actionText: "Buka Pronunciation Studio →"
      }
    ];

    let filtered = modules;
    if (practiceActiveFilter && practiceActiveFilter !== "all") {
      filtered = filtered.filter(m => m.category === practiceActiveFilter);
    }
    if (practiceSearchQuery) {
      const q = practiceSearchQuery.toLowerCase();
      filtered = filtered.filter(m => m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.kicker.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="practice-empty-search"><p>Tidak ada modul latihan yang cocok dengan pencarian.</p><button type="button" class="secondary-action" id="practice-empty-reset" style="margin-top:10px;">Tampilkan Semua Modul</button></div>';
      return;
    }

    grid.innerHTML = filtered.map(m => {
      const subBtn = m.subAction
        ? '<button type="button" class="secondary-action practice-open-sub-btn" data-open-practice="' + esc(m.subAction.id) + '">' + esc(m.subAction.text) + '</button>'
        : '';
      return '<article class="practice-card">' +
        '<div class="practice-card-top">' +
          '<span class="practice-card-icon">' + m.icon + '</span>' +
          '<div><span class="practice-card-kicker">' + esc(m.kicker) + '</span><h3 class="practice-card-title">' + esc(m.title) + '</h3></div>' +
        '</div>' +
        '<p class="practice-card-desc">' + esc(m.desc) + '</p>' +
        '<div class="practice-card-stat"><strong>' + esc(m.statVal) + '</strong><span>' + esc(m.statNote) + '</span></div>' +
        '<div class="practice-card-actions">' +
          '<button type="button" class="primary-action practice-open-btn" data-open-practice="' + esc(m.id) + '">' + esc(m.actionText) + '</button>' +
          subBtn +
        '</div>' +
      '</article>';
    }).join("");
  }

  function setView(next) {
    closeMobileDrawer?.();
    closeContextualVocab?.();
    if (["speaking", "writing", "listening", "pronunciation", "reading-stories"].includes(next)) {
      openPracticeModule(next);
      return;
    }
    if (next === "practice") {
      activePracticeModule = null;
      const hubHome = $("#practice-hub-home");
      const panel = $("#practice-module-panel");
      if (panel) panel.hidden = true;
      if (hubHome) hubHome.hidden = false;
      $$(".practice-submodule").forEach(el => { el.hidden = true; });
    }
    if (!$('#view-' + next)) return;
    view = next;
    $$(".view").forEach(el => el.classList.toggle("is-visible",el.dataset.view === next));
    const activeTopView = [
      "practice", "vocabulary", "grammar", "matching", "study", "reading",
      "speaking", "writing", "listening", "pronunciation", "reading-stories"
    ].includes(next)
      ? "practice"
      : ["placement"].includes(next)
        ? "overview"
        : next;
    $$(".side-link").forEach(el => {
      const active = el.dataset.viewTarget === activeTopView;
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    $$(".learning-tab").forEach(el => {
      const active = el.dataset.viewTarget === next;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-selected", String(active));
      el.setAttribute("tabindex", active ? "0" : "-1");
    });
    const topbarLabels = {
      overview: "Beranda",
      adventure: "Petualangan",
      practice: "Hub Latihan",
      vocabulary: "Latihan · Kosakata",
      grammar: "Latihan · Tata Bahasa",
      matching: "Latihan · Matching",
      study: "Latihan · Sesi Kosakata",
      reading: "Latihan · Pemahaman Bacaan",
      listening: "Latihan · Menyimak",
      speaking: "Latihan · Speaking Studio",
      writing: "Latihan · Writing Studio",
      pronunciation: "Latihan · Pronunciation Studio",
      "reading-stories": "Latihan · Everyday Stories",
      review: "Review",
      placement: "Beranda · Cek level",
      progress: "Progres"
    };
    const topbarCurrent = $("#topbar-current");
    if (topbarCurrent) topbarCurrent.textContent = topbarLabels[next] || "Ruang belajar";
    if (next === "overview") renderOverview();
    if (next === "practice") renderPracticeHub();
    if (next === "vocabulary") renderVocabulary();
    if (next === "grammar") renderGrammar();
    if (next === "reading") window.sinauuLoadHabitLibrary?.();
    if (next === "review") renderReview();
    else window.sinauuUpdateReviewActivePanel?.();
    if (next === "placement") renderPlacementView();
    if (next === "progress") renderProgress();
    if (next === "adventure") window.sinauuRenderAdventure?.();
    if (window.sinauMotionScrollToTop) window.sinauMotionScrollToTop();
    else window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }
  async function setTheme(theme) {
    root.dataset.theme = theme;
    state.settings.theme = theme;
    const button = $("#theme-toggle");
    button.setAttribute("aria-pressed",String(theme === "dark"));
    button.setAttribute("aria-label",theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap");
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#202720" : "#f5f3eb";
    await save();
  }
  function renderDate() {
    const now = new Date();
    $("#date-day").textContent = String(now.getDate()).padStart(2,"0");
    $("#date-month").textContent = fmtDate(now,{month:"short",year:"numeric"}).toUpperCase();
  }
  function levelStats() {
    const result = {};
    LEVELS.forEach(l => result[l] = {total:0,mastered:0,learning:0,due:0,weak:0,fresh:0});
    words.forEach(w => { const b = result[w.level]; if(!b)return; b.total++; const s=statusOf(w); if(s==="mastered")b.mastered++; else if(s==="learning")b.learning++; else if(s==="due")b.due++; else if(s==="weak")b.weak++; else b.fresh++; });
    return result;
  }
  function levelRow(level,b,detailed) {
    const pct = b.total ? Math.round(b.mastered/b.total*100) : 0;
    const details = b.total + " kata tersedia · " + b.learning + " learning · " + b.due + " review · " + b.weak + " weak";
    return '<div class="level-progress-row"><span class="level-progress-code">'+level+'</span><div class="level-progress-main"><strong>'+esc(LABELS[level])+'<span>'+pct+'%</span></strong><div class="progress-track"><span style="width:'+pct+'%"></span></div>'+(detailed?'<p style="margin:7px 0 0;color:var(--muted);font-size:.62rem">'+esc(details)+'</p>':"")+'</div><span class="level-progress-count">'+b.mastered+'/'+b.total+'</span></div>';
  }
  function isReturningLearner(today) {
    if (!state) return false;
    const todayStr = String(today);
    const hasTodayActivity = state.history.some(item => (item.date || (item.at ? item.at.slice(0, 10) : null)) === todayStr) ||
      state.events.some(item => (item.date || (item.at ? item.at.slice(0, 10) : null)) === todayStr);
    if (hasTodayActivity) return false;

    const dates = [
      ...state.history.filter(Boolean).map(item => (typeof item.date === "string" ? item.date : (typeof item.at === "string" ? item.at.slice(0, 10) : null))),
      ...state.events.filter(Boolean).map(item => (typeof item.date === "string" ? item.date : (typeof item.at === "string" ? item.at.slice(0, 10) : null))),
      ...Object.values(state.wordProgress || {}).filter(p => p && typeof p === "object").flatMap(p => [
        ...(Array.isArray(p.studiedDates) ? p.studiedDates : []),
        ...(Array.isArray(p.reviewDates) ? p.reviewDates : []),
        ...(Array.isArray(p.attempts) ? p.attempts.filter(a => a && typeof a === "object").map(a => typeof a.at === "string" ? a.at.slice(0, 10) : null) : [])
      ]),
      ...Object.values(state.grammarProgress || {}).filter(p => p && typeof p === "object").flatMap(p => [
        ...(p.answers && typeof p.answers === "object" ? Object.values(p.answers).filter(a => a && typeof a === "object").map(a => typeof a.at === "string" ? a.at.slice(0, 10) : null) : [])
      ])
    ].filter(Boolean).filter(d => typeof d === "string" && d < todayStr).sort();
    if (!dates.length) return false;
    const last = dates[dates.length - 1];
    const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(last).getTime()) / 86400000);
    return diffDays >= 3;
  }

  function getPlanVocabularyTask(today) {
    const returning = isReturningLearner(today);
    const existing = state.history.slice().reverse().find(item =>
      item.date === today && item.type === "vocabulary" && item.wordId
    );
    let word = existing ? words.find(item => item.id === existing.wordId) : null;
    let mode = existing && existing.mode === "review" ? "review" : "learn";

    if (!word) {
      const due = dueWords().slice().filter(canStudyWord).sort((a,b) =>
        new Date(state.wordProgress[a.id].nextReviewAt) - new Date(state.wordProgress[b.id].nextReviewAt)
      );
      if (due.length) {
        word = due[0];
        mode = "review";
      } else {
        const weak = words.filter(item => {
          if (!canStudyWord(item)) return false;
          const p = state.wordProgress[item.id];
          if (!p) return false;
          return Boolean(p.weak || (p.consecutiveErrors || 0) >= 2);
        });
        if (weak.length) {
          word = weak[0];
          mode = "review";
        } else {
          const targetLevel = placementResult?.level;
          word = (targetLevel ? words.find(item => canStudyWord(item) && statusOf(item) === "new" && item.level === targetLevel) : null)
            || words.find(item => canStudyWord(item) && statusOf(item) === "new")
            || words.find(item => canStudyWord(item) && state.favorites.includes(item.id))
            || words.find(item => canStudyWord(item) && statusOf(item) !== "mastered")
            || words.find(canStudyWord);
          mode = "learn";
        }
      }
    }

    if (!word) return { word:null, mode:"learn", done:false, category:"01 · INGAT KEMBALI", duration:"5 MENIT", title:"Kosakata siap dijelajahi", description:"Pilih satu kata yang menarik untuk mulai berlatih." };
    const p = state.wordProgress[word.id] || {};
    let done = false;
    if (mode === "review") {
      done = (p.reviewHistory || []).some(item => item.date === today) ||
        state.history.some(item => item.date === today && item.wordId === word.id && item.mode === "review");
    } else {
      const skills = new Set(state.events
        .filter(item => item.wordId === word.id && item.date === today)
        .map(item => item.skill));
      done = ["recall","context","production"].every(skill => skills.has(skill)) ||
        state.history.some(item => item.date === today && item.wordId === word.id && item.mode === "learn");
    }

    let description = "";
    if (done) {
      description = mode === "review"
        ? "Review kata ini sudah selesai hari ini. Jadwal berikutnya tercatat di perangkat."
        : "Kata ini sudah dipelajari hari ini melalui arti, konteks, dan penggunaan.";
    } else if (mode === "review") {
      description = returning
        ? "Selamat datang kembali! Satu kata sudah waktunya diulang untuk menyegarkan ingatan sebelum materi baru."
        : (p.weak || (p.consecutiveErrors || 0) >= 2)
          ? "Kata ini tercatat mengalami kesalahan sebelumnya. Ulangi kembali arti dan contoh kalimatnya."
          : "Satu kata sudah waktunya diulang. Coba ingat makna dan penggunaannya.";
    } else {
      description = returning
        ? "Selamat datang kembali! Mulai langkah kecil hari ini dengan mempelajari satu kata baru."
        : "Belum ada review yang jatuh tempo. Pelajari satu kata baru melalui arti, konteks, dan penggunaan.";
    }

    return {
      type: "word",
      word, mode, done,
      category: "01 · INGAT KEMBALI",
      duration: "5 MENIT",
      title: mode === "review" ? "Ingat kembali · " + word.word : "Pelajari kata · " + word.word,
      description
    };
  }

  function getPlanGrammarTask(today) {
    const previous = state.history.slice().reverse().find(item =>
      item.date === today && item.type === "grammar" && item.topicId
    );
    const candidates = topics.map((topic, topicIndex) => {
      const p = state.grammarProgress[topic.id] || {};
      const unique = Object.keys(p.answers || {}).length;
      const attempts = Number(p.attempts) || 0;
      const correct = Number(p.correct) || 0;
      const wrong = attempts - correct;
      const accuracy = attempts ? correct / attempts : 1;
      const coverage = unique / Math.max(1, topic.questions.length);
      const isWeak = attempts >= 2 && (accuracy < 0.70 || wrong >= 2);
      const priority = isWeak ? 0 : unique < topic.questions.length ? 1 : 2;
      const score = priority === 0 ? accuracy : priority === 1 ? coverage : accuracy;
      return { topic, topicIndex, attempts, correct, wrong, accuracy, unique, isWeak, priority, score };
    });
    const levelOrder = { "A1": 0, "A2": 1, "B1": 2, "B2": 3 };
    candidates.sort((a,b) =>
      a.priority - b.priority ||
      a.score - b.score ||
      ((levelOrder[a.topic.level] ?? 9) - (levelOrder[b.topic.level] ?? 9)) ||
      (a.topicIndex - b.topicIndex)
    );
    const chosen = previous
      ? candidates.find(item => item.topic.id === previous.topicId)
      : candidates[0];
    const item = chosen || candidates[0];
    if (!item) return { topic:null, done:false, category:"02 · PAHAMI POLA", duration:"5 MENIT", title:"Grammar", description:"Materi grammar belum tersedia." };
    const done = state.history.some(entry =>
      entry.date === today && entry.type === "grammar" && entry.topicId === item.topic.id
    );
    let description = "Belum pernah dicoba. Mulai dari penjelasan dan latihan dasar.";
    if (done) {
      description = "Latihan pola kalimat sudah diselesaikan hari ini. Kamu bisa membuka kembali kapan saja.";
    } else if (item.attempts > 0 && item.accuracy < 0.7) {
      description = "Akurasi sebelumnya " + Math.round(item.accuracy * 100) + "%. " +
        (item.wrong >= 2 ? "Tercatat " + item.wrong + " kesalahan. " : "") +
        "Kembali ke konsep ini dan periksa alasannya.";
    } else if (item.unique > 0) {
      description = item.unique + "/" + item.topic.questions.length + " soal unik sudah dicoba. Lanjutkan bagian yang belum selesai.";
    }
    return {
      type: "grammar",
      topic: item.topic,
      topicId: item.topic.id,
      done,
      isWeak: item.isWeak,
      category: "02 · PAHAMI POLA",
      duration: "5 MENIT",
      title: item.topic.title,
      description
    };
  }

  function getPlanAdventureTask(today) {
    let snapshot = {};
    try {
      snapshot = window.sinauuAdventureBackup?.()
        || JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "{}");
    } catch (_) { snapshot = {}; }
    const quest = snapshot.dailyQuests && snapshot.dailyQuests[today];
    const total = Array.isArray(quest?.stepIds) ? quest.stepIds.length : 3;
    const completed = Array.isArray(quest?.completedStepIds) ? quest.completedStepIds.length : 0;
    const done = Boolean(quest?.completedAt);
    const started = Boolean(quest?.startedAt);
    return {
      type: "adventure",
      done,
      started,
      category: "03 · GUNAKAN BAHASA",
      duration: "5 MENIT",
      title: "Daily Quest · First Steps Island",
      progress: quest ? Math.min(completed,total) + "/" + total + " tantangan" : "3 tantangan singkat",
      description: done
        ? "Daily Quest hari ini sudah selesai. Istirahat juga bagian dari belajar."
        : started
          ? "Kamu sudah memulai. Lanjutkan " + Math.min(completed,total) + " dari " + total + " tantangan."
          : "Gunakan kosakata dan grammar dalam tiga tantangan singkat di First Steps Island."
    };
  }

  function getAdaptiveStudyPlan(today) {
    const vocabStep = getPlanVocabularyTask(today);
    const grammarStep = getPlanGrammarTask(today);
    const adventureStep = getPlanAdventureTask(today);

    // Adaptive skill balance check using Weekly Learning Insights & corpus progress:
    const extras = readExtraSnapshots();
    const extraLearn = extras.extraLearning || {};
    const adv = extras.adventureProgress || {};
    const vocabCount = Math.max(
      words.filter(w => statusOf(w) !== "new").length,
      Object.values(state.wordProgress || {}).filter(p => (p.attempts || []).length > 0 || (p.studiedDates || []).length > 0).length
    );
    const readingSkillsAttempted = Object.values(extraLearn.reading || {}).filter(r => (r.attempts || 0) > 0).length;
    const habitPassagesAttempted = Object.keys(extras.habitProgress || {}).length;
    const storiesAttempted = Object.values(adv.storyProgress || {}).filter(s => (s.attempts || 0) > 0).length;
    const totalReadingCount = readingSkillsAttempted + habitPassagesAttempted + storiesAttempted;

    let step2 = grammarStep;
    if (!grammarStep.isWeak && vocabCount >= 5 && totalReadingCount < 2) {
      const storyKeys = Object.keys(adv.storyProgress || {});
      const readingDone = storyKeys.some(k => adv.storyProgress[k]?.lastAttemptAt?.slice(0, 10) === today) ||
        state.history.some(h => h.date === today && (h.type === "reading" || h.skill === "reading"));
      step2 = {
        type: "reading",
        sectionId: "adventure-story-library",
        actionLabel: "Buka cerita ↗",
        done: readingDone,
        category: "02 · LATIH PEMAHAMAN TEKS",
        duration: "5 MENIT",
        title: "Latihan bacaan · Everyday Stories",
        description: "Kosakatamu berkembang aktif (" + vocabCount + " kata dicoba), tetapi pemahaman membaca belum banyak dilatih minggu ini. Coba bacaan kontekstual ini."
      };
    } else if (!grammarStep.isWeak && step2 === grammarStep && typeof computeWeeklyInsights === "function") {
      const weekly = computeWeeklyInsights(state, extras, words, topics);
      if (weekly && !weekly.emptyState && weekly.current.activeDays.size >= 2) {
        const listeningPracticed = weekly.current.skills.listening.completed > 0 || weekly.current.skills.listening.attempts > 0;
        if (!listeningPracticed) {
          step2 = {
            type: "adventure",
            sectionId: "adventure-listening-lab",
            actionLabel: "Buka Listening Lab ↗",
            done: false,
            category: "02 · LATIH MENYIMAK (MINGGUAN)",
            duration: "5 MENIT",
            title: "Latihan audio · Listening Lab",
            description: "Berdasarkan evaluasi mingguan: Keterampilan menyimak belum sempat dilatih dalam 7 hari terakhir. Dengarkan rekaman singkat di Listening Lab."
          };
        }
      }
    }

    return [vocabStep, step2, adventureStep];
  }

  function renderStudyPlan() {
    const node = $("#home-study-plan-steps");
    if (!node || !state) return;
    const today = dayKey();
    const steps = getAdaptiveStudyPlan(today);
    const doneCount = steps.filter(item => item.done).length;
    const count = $("#home-study-plan-count");
    const bar = $("#home-study-plan-bar");
    if (count) count.textContent = doneCount + "/3";
    if (bar) bar.style.width = Math.round(doneCount / 3 * 100) + "%";

    node.innerHTML = steps.map((step, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      const metaCategory = step.category || (num + " · REKOMENDASI");
      const duration = step.duration || "5 MENIT";
      let actionBtn = "";
      if (step.actionHtml) {
        actionBtn = step.actionHtml;
      } else if (step.type === "word" && step.word) {
        actionBtn = '<button type="button" class="home-study-plan-action" data-plan-vocabulary="' + esc(step.word.id) + '" data-plan-mode="' + step.mode + '"' + (step.done ? ' disabled' : '') + '>' +
          (step.done ? 'Selesai ✓' : step.mode === "review" ? 'Mulai review ↗' : 'Mulai belajar ↗') + '</button>';
      } else if (step.type === "grammar" && step.topic) {
        actionBtn = '<button type="button" class="home-study-plan-action" data-plan-topic="' + esc(step.topic.id) + '"' + (step.done ? ' disabled' : '') + '>' +
          (step.done ? 'Selesai ✓' : 'Buka latihan ↗') + '</button>';
      } else if (step.type === "adventure") {
        actionBtn = '<button type="button" class="home-study-plan-action" data-plan-adventure' + (step.done ? ' disabled' : '') + '>' +
          (step.done ? 'Selesai ✓' : step.started ? 'Lanjutkan quest ↗' : 'Mulai Daily Quest ↗') + '</button>';
      } else if (step.type === "reading") {
        actionBtn = step.sectionId
          ? '<button type="button" class="home-study-plan-action" data-plan-adventure-section="' + esc(step.sectionId) + '"' + (step.done ? ' disabled' : '') + '>' +
            (step.done ? 'Selesai ✓' : (step.actionLabel || 'Buka cerita ↗')) + '</button>'
          : '<button type="button" class="home-study-plan-action" data-plan-reading' + (step.done ? ' disabled' : '') + '>' +
            (step.done ? 'Selesai ✓' : 'Buka bacaan ↗') + '</button>';
      } else if (step.sectionId) {
        actionBtn = '<button type="button" class="home-study-plan-action" data-plan-adventure-section="' + esc(step.sectionId) + '"' + (step.done ? ' disabled' : '') + '>' +
          (step.done ? 'Selesai ✓' : (step.actionLabel || 'Buka aktivitas ↗')) + '</button>';
      } else {
        actionBtn = '<button type="button" class="home-study-plan-action" data-view-target="vocabulary">Jelajahi materi ↗</button>';
      }

      const progressHtml = step.progress && (!step.done || step.started)
        ? '<small class="home-study-plan-quest-progress">' + esc(step.progress) + '</small>'
        : '';

      return '<article class="home-study-plan-step' + (step.done ? ' is-complete' : '') + '">' +
        '<div class="home-study-plan-step-meta"><span>' + esc(metaCategory) + '</span><small>' + esc(duration) + '</small></div>' +
        '<h3>' + esc(step.title) + '</h3><p>' + esc(step.description) + '</p>' +
        progressHtml +
        actionBtn +
      '</article>';
    }).join("");
  }

  function renderHomePrimaryAction() {
    const button = $("#home-primary-action");
    const label = $("#home-primary-label");
    if (!button || !label || !state) return;
    const today = dayKey();
    const steps = getAdaptiveStudyPlan(today);
    const hasProgress = state.history.length > 0 ||
      state.events.length > 0 ||
      Object.keys(state.wordProgress).length > 0 ||
      Object.values(state.grammarProgress).some(item => Number(item.attempts) > 0);

    let action = {type:"vocabulary"};
    if (activeStudy && activeStudy.stage < 3) action = {type:"active-study"};
    else {
      const pending = steps.find(s => !s.done);
      if (pending) {
        if (pending.word?.id) action = {type:"word", wordId:pending.word.id, mode:pending.mode};
        else if (pending.topic?.id) action = {type:"grammar", topicId:pending.topic.id};
        else if (pending.sectionId) action = {type:"adventure-section", sectionId:pending.sectionId};
        else if (pending.type === "reading") action = {type:"reading"};
        else if (pending.type === "adventure") action = {type:"adventure"};
        else action = {type: pending.type || "adventure"};
      } else {
        const firstWord = steps.find(s => s.word?.id);
        if (firstWord) action = {type:"word", wordId:firstWord.word.id, mode:firstWord.mode};
        else action = {type:"adventure"};
      }
    }

    button.dataset.homeAction = action.type;
    if (action.wordId) button.dataset.homeWord = action.wordId;
    else delete button.dataset.homeWord;
    if (action.mode) button.dataset.homeMode = action.mode;
    else delete button.dataset.homeMode;
    if (action.topicId) button.dataset.homeTopic = action.topicId;
    else delete button.dataset.homeTopic;
    if (action.sectionId) button.dataset.homeSection = action.sectionId;
    else delete button.dataset.homeSection;

    label.textContent = hasProgress ? "Lanjutkan belajar" : "Mulai sesi pertama";
    button.setAttribute("aria-label", hasProgress ? "Lanjutkan belajar dari rekomendasi berikutnya" : "Mulai sesi belajar pertamamu");
  }

  function renderOverview() {
    const stats = levelStats(), mastered = words.filter(w=>statusOf(w)==="mastered").length, due=dueWords().length, activities=activityToday(), goal=Number(state.settings.dailyGoal)||10;
    $("#metric-mastered").textContent=mastered;
    $("#metric-mastered-note").textContent=mastered?"Memenuhi kriteria skill dan review berjeda.":"Belum ada kata yang memenuhi kriteria mastery.";
    $("#metric-due").textContent=due; $("#metric-today").textContent=activities;
    $("#goal-summary").textContent=activities+" dari "+goal+" aktivitas";
    const pct=Math.min(100,Math.round(activities/goal*100)); $("#goal-percent").textContent=pct+"%"; $("#goal-bar").style.width=pct+"%";
    $("#goal-note").textContent=activities>=goal?"Target harian tercapai. Review tetap mengikuti jadwal.":"Target adalah pengingat, bukan syarat mastery.";
    $("#review-task-note").textContent=due?due+" kata menunggu review.":"Belum ada kata yang jatuh tempo.";
    $("#nav-word-count").textContent=words.length; $("#nav-grammar-count").textContent=topics.length; $("#nav-review-count").textContent=due;
    $("#overview-levels").innerHTML=LEVELS.map(l=>levelRow(l,stats[l],false)).join("");
    const suggestions=[];
    dueWords().slice(0,2).forEach(w=>suggestions.push({type:"REVIEW",title:w.word,description:w.meaning,wordId:w.id}));
    topics.filter(t=>!(state.grammarProgress[t.id]&&state.grammarProgress[t.id].attempts)).slice(0,2).forEach(t=>suggestions.push({type:"GRAMMAR",title:t.title,description:t.summary,topicId:t.id}));
    words.filter(w=>canStudyWord(w)&&statusOf(w)==="new").slice(0,3).forEach(w=>suggestions.push({type:"WORD",title:w.word,description:w.meaning,wordId:w.id}));
    $("#resume-list").innerHTML=suggestions.slice(0,4).map(x=>'<div class="resume-item"><div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p></div><button class="resume-action" type="button" '+(x.wordId?'data-study-word="'+esc(x.wordId)+'"':'data-open-topic="'+esc(x.topicId)+'"')+'>Mulai ↗</button></div>').join("") || '<div class="empty-state">Materi yang tersedia sudah pernah dicoba. Pilih topik lain.</div>';
    renderHomePrimaryAction();
    renderPlacementTeaser();
    renderStudyPlan();

    // Render Home Player Rank & XP:
    try {
      const advSnapshot = window.sinauuAdventureBackup?.() || JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1") || "{}");
      const xp = Number(advSnapshot.playerXp) || 0;
      const rankData = [
        { title: "Seed Explorer", min: 0, next: 100 },
        { title: "Trail Scout", min: 100, next: 250 },
        { title: "Island Ranger", min: 250, next: 500 },
        { title: "Harbor Guide", min: 500, next: 850 },
        { title: "Summit Scholar", min: 850, next: null }
      ];
      const curRank = [...rankData].reverse().find(r => xp >= r.min) || rankData[0];
      const rankIdx = rankData.indexOf(curRank) + 1;
      const nextRank = rankData[rankIdx];
      const avatarEl = $("#home-rank-avatar");
      if (avatarEl) avatarEl.textContent = ["I", "II", "III", "IV", "V"][rankIdx - 1] || "I";
      const rankEl = $("#home-player-rank");
      if (rankEl) rankEl.textContent = curRank.title;
      const xpLineEl = $("#home-player-xp-line");
      const xpFillEl = $("#home-player-xp-fill");
      if (nextRank) {
        const span = nextRank.min - curRank.min;
        const prog = xp - curRank.min;
        const pct = Math.min(100, Math.max(0, Math.round((prog / span) * 100)));
        if (xpLineEl) xpLineEl.textContent = xp + " XP · " + prog + " / " + span + " menuju " + nextRank.title;
        if (xpFillEl) xpFillEl.style.width = pct + "%";
      } else {
        if (xpLineEl) xpLineEl.textContent = xp + " XP · Rank Maksimal";
        if (xpFillEl) xpFillEl.style.width = "100%";
      }

      // Render Home Daily Quest:
      const today = dayKey();
      const quest = advSnapshot.dailyQuests && advSnapshot.dailyQuests[today];
      const qTotal = Array.isArray(quest?.stepIds) ? quest.stepIds.length : 3;
      const qDone = Array.isArray(quest?.completedStepIds) ? quest.completedStepIds.length : 0;
      const questCountEl = $("#home-quest-count");
      if (questCountEl) {
        questCountEl.textContent = quest?.completedAt
          ? "Selesai · Semua tantangan tuntas"
          : Math.min(qDone, qTotal) + "/" + qTotal + " tantangan selesai";
      }

      // Render Home 7 Skills compact summary:
      const skillsRow = $("#home-skills-row");
      if (skillsRow) {
        const extras = readExtraSnapshots();
        const advExtras = extras.adventureProgress || {};
        const vTried = words.filter(w => statusOf(w) !== "new").length;
        const gTried = topics.filter(t => Object.keys((state.grammarProgress[t.id] && state.grammarProgress[t.id].answers) || {}).length > 0).length;
        const rDone = Object.values(window.sinauuExtraLearningBackup?.().reading || {}).filter(r => r && r.completed).length +
          Object.values(advExtras.storyProgress || {}).filter(s => s && s.completed).length;
        const lDone = Object.values(advExtras.listeningLabProgress || {}).filter(l => l && l.completed).length +
          Object.values(advExtras.everydayEnglishProgress || {}).filter(d => d && d.completed).length;
        const sSess = (advExtras.studioSessions || []).filter(s => s.studioType === "speaking").length;
        const wSess = (advExtras.studioSessions || []).filter(s => s.studioType === "writing").length;
        const pDone = Object.values(advExtras.pronunciationProgress || {}).filter(p => p && p.completed).length;

        const skillBadges = [
          { name: "Kosakata", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>', val: vTried + " kata", target: "vocabulary" },
          { name: "Tata Bahasa", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>', val: gTried + " topik", target: "grammar" },
          { name: "Bacaan", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>', val: rDone + " selesai", target: "reading" },
          { name: "Menyimak", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>', val: lDone + " selesai", target: "listening" },
          { name: "Berbicara", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', val: sSess + " sesi", target: "speaking" },
          { name: "Menulis", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><line x1="18" y1="2" x2="22" y2="6"/><path d="m7.5 20.5 9-9L13 8l-9 9 1 4z"/></svg>', val: wSess + " sesi", target: "writing" },
          { name: "Pengucapan", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>', val: pDone + " selesai", target: "pronunciation" }
        ];

        skillsRow.innerHTML = skillBadges.map(b =>
          '<button type="button" class="home-skill-pill" data-home-skill="' + esc(b.target) + '">' +
            '<div class="home-skill-pill-top"><span class="home-skill-pill-sym">' + b.icon + '</span><span class="home-skill-pill-arrow">↗</span></div>' +
            '<div class="home-skill-pill-name">' + esc(b.name) + '</div>' +
            '<div class="home-skill-pill-val">' + esc(b.val) + '</div>' +
          '</button>'
        ).join("");
      }
    } catch (_) {}
  }
  function renderVocabulary(resetList=true) {
    if(resetList)listLimit=100;
    const topicSelect=$("#topic-filter"),old=topicSelect.value;
    const topicOptions=Array.from(new Set(words.flatMap(w=>w.topics||[]))).sort();
    topicSelect.innerHTML='<option value="all">Semua topik</option>'+topicOptions.map(t=>'<option value="'+esc(t)+'">'+esc(t.replace(/-/g," "))+'</option>').join("");
    if(topicOptions.includes(old))topicSelect.value=old;
    const q=norm($("#vocab-search").value),level=$("#level-filter").value,topic=topicSelect.value,fav=$("#favorites-only").checked;
    const filtered=words.filter(w=>{
      const searchable=norm([w.word,w.meaning,w.example,w.translation,w.definitionEn,w.partOfSpeech,...(w.acceptedMeanings||[]),...(w.topics||[])].join(" "));
      return (!q||searchable.includes(q))&&(level==="all"||w.level===level)&&(topic==="all"||(w.topics||[]).includes(topic))&&(!fav||state.favorites.includes(w.id));
    }).sort((a,b)=>{const rank=w=>!q?0:norm(w.word)===q?0:norm(w.word).startsWith(q)?1:2;return rank(a)-rank(b)||(LEVELS.indexOf(a.level)<0?99:LEVELS.indexOf(a.level))-(LEVELS.indexOf(b.level)<0?99:LEVELS.indexOf(b.level))||a.word.localeCompare(b.word);});
    $("#vocab-result-count").textContent=filtered.length.toLocaleString("id-ID")+" dari "+words.length.toLocaleString("id-ID")+" kata";
    $("#vocab-empty").hidden=filtered.length!==0;
    const shown=filtered.slice(0,listLimit);
    $("#vocab-list").innerHTML=shown.map(w=>{
      const ready=canStudyWord(w),si=ready?statusInfo[statusOf(w)]:{label:"BELUM SIAP",cls:"status-incomplete"};
      return '<button class="vocab-row '+(selectedWord===w.id?"is-selected":"")+'" data-select-word="'+esc(w.id)+'" type="button"><span class="word-level">'+esc(w.level||"—")+'</span><span class="word-row-main"><strong>'+esc(w.word)+(state.favorites.includes(w.id)?" ★":"")+'</strong><small>'+esc(w.meaning||(w.definitionEn?"Arti Indonesia belum tersedia":"Konten sedang dilengkapi"))+'</small></span><span class="word-row-status '+si.cls+'">'+si.label+'</span></button>';
    }).join("");
    const more=$("#vocab-load-more");more.hidden=shown.length>=filtered.length;
    $("#vocab-layout")?.classList.toggle("is-detail-open",vocabDetailOpen);
    $("#view-vocabulary")?.classList.toggle("is-detail-view",vocabDetailOpen);
    more.textContent="Tampilkan "+Math.min(100,filtered.length-shown.length)+" kata berikutnya ↓ · "+(filtered.length-shown.length).toLocaleString("id-ID")+" tersisa";
    if(selectedWord&&words.some(w=>w.id===selectedWord))renderWordDetail(selectedWord);
    else if(shown.length){selectedWord=shown[0].id;renderWordDetail(selectedWord);$$(".vocab-row").forEach(b=>b.classList.toggle("is-selected",b.dataset.selectWord===selectedWord));}
    else $("#word-detail").innerHTML='<div class="detail-empty"><span class="detail-empty-mark">Aa</span><h2>Belum ada hasil</h2><p>Coba ubah kata pencarian atau filter.</p></div>';
  }
  function renderWordDetail(id) {
    const w=words.find(x=>x.id===id);if(!w)return;
    const p=state.wordProgress[id],evidence=(p&&p.skillEvidence)||{},ready=canStudyWord(w),si=ready?statusInfo[statusOf(w)]:{label:"BELUM SIAP",cls:"status-incomplete"};
    const exampleHtml=w.example?'<div class="detail-example"><p>'+esc(w.example)+'</p>'+(w.translation?'<p class="translation">'+esc(w.translation)+'</p>':'<p class="translation">Terjemahan contoh belum tersedia.</p>')+'</div>':'<p class="study-unavailable">Contoh penggunaan belum tersedia. Kata ini masih dapat dicari, tetapi belum bisa dilatih.</p>';
    const hasUnreviewedContext=(w.contextVariants||[]).some(v=>v.translation&&v.translationStatus&&v.translationStatus!=="human-reviewed"&&v.translationStatus!=="curated");
    const noteHtml=!ready?'<div class="content-status-note">Entri ini termasuk daftar headword sumber, tetapi materi latihannya belum lengkap. Sesi belajar baru dibuka setelah arti dan contoh penggunaan dapat dipakai.</div>':(w.translationStatus==="machine-generated-unreviewed"?'<div class="content-status-note">Terjemahan contoh berasal dari korpus kamus atau terjemahan mesin dan belum ditinjau satu per satu.</div>':(w.translationStatus==="assistant-curated-draft"?'<div class="content-status-note">Arti dan terjemahan ini sudah dikurasi sebagai draf editorial SinauuEnglish, tetapi belum diverifikasi secara independen oleh penutur manusia.</div>':(hasUnreviewedContext?'<div class="content-status-note">Beberapa contoh tambahan dan terjemahannya berasal dari korpus kamus atau draf editorial yang belum diverifikasi satu per satu.</div>':"")));
    const variants=(w.contextVariants||[]).slice(0,3);
    const supplementaryParts=[];
    if(variants.length)supplementaryParts.push('<div><p class="detail-section-label">CONTOH TAMBAHAN</p><div class="detail-note">'+variants.map(v=>'<p>'+esc(v.sentence)+(v.translation?'<br><span>'+esc(v.translation)+'</span>':'')+'</p>').join("")+'</div></div>');
    if(w.collocations&&w.collocations.length)supplementaryParts.push('<div><p class="detail-section-label">COLLOCATIONS</p><div class="collocation-list">'+w.collocations.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div></div>');
    const supplementaryHtml=supplementaryParts.length?'<details class="detail-supplementary"><summary>Contoh tambahan & collocations <small>'+supplementaryParts.length+' bagian</small></summary><div class="detail-supplementary-content">'+supplementaryParts.join("")+'</div></details>':"";
    const defHtml=w.definitionEn?'<p class="detail-section-label">ENGLISH DEFINITION · REFERENCE</p><p class="definition-note">'+esc(w.definitionEn)+'</p>':"";
    $("#word-detail").innerHTML='<button class="mobile-detail-back" type="button" data-vocab-back>← Kembali ke daftar</button><div class="detail-meta"><span>'+esc(w.level||"Belum diklasifikasikan")+' / '+esc((w.partOfSpeech||"unclassified").toUpperCase())+'</span><span class="'+si.cls+'">'+si.label+'</span></div>'+
      '<div class="detail-word-row"><h2>'+esc(w.word)+'<span>.</span></h2><button class="audio-button" id="detail-speak" type="button" aria-label="Dengarkan '+esc(w.word)+'">♪</button></div>'+
      '<p class="detail-pronunciation">'+esc(w.ipa||"IPA belum tersedia")+(w.forms&&w.forms.length?" · "+esc(w.forms.map(x=>x.form||x.label).join(" · ")):"")+'</p>'+
      '<p class="detail-meaning">'+esc(w.meaning||"Arti Bahasa Indonesia belum tersedia.")+'</p>'+defHtml+'<p class="detail-section-label">CONTOH PENGGUNAAN</p>'+exampleHtml+supplementaryHtml+
      (w.commonMistake?'<p class="detail-section-label">CATATAN PENGGUNAAN</p><p class="detail-note">'+esc(w.commonMistake)+'</p>':"")+noteHtml+
      '<div class="evidence-mini"><p class="detail-section-label">BUKTI BELAJAR</p><div class="evidence-lines">'+
      '<span class="'+(evidence.recall?"done":"")+'">'+(evidence.recall?"✓":"○")+' Recall arti</span><span class="'+(evidence.context?"done":"")+'">'+(evidence.context?"✓":"○")+' Konteks</span><span class="'+(evidence.production?"done":"")+'">'+(evidence.production?"✓":"○")+' Penggunaan aktif</span><span class="'+((p&&p.reviewSuccesses>=3)?"done":"")+'">'+((p&&p.reviewSuccesses)||0)+'/3 review berjeda</span></div></div>'+
      '<div class="detail-actions"><button class="primary-action" type="button" data-start-word="'+esc(w.id)+'" '+(ready?"":"disabled")+'>'+(ready?"Latih kata ini ↗":"Materi belum siap")+'</button><button class="secondary-action" type="button" data-favorite-word="'+esc(w.id)+'">'+(state.favorites.includes(w.id)?"★ Tersimpan":"☆ Simpan kata")+'</button></div>'+
      '<p class="detail-footnote">Mastery membutuhkan bukti recall, konteks, produksi, dan tiga review terpisah yang mencakup minimal 12 hari.</p>';
    $("#detail-speak").addEventListener("click",()=>speak(w.word));
  }
  function speak(text) {
    if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){toast("Browser belum mendukung pemutaran ucapan.");return;}
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=.82;u.onerror=()=>toast("Audio tidak dapat diputar pada browser ini.");speechSynthesis.speak(u);
  }
  function wordForms(w){return [w.word,...(w.forms||[]).map(x=>x.form)].map(norm).filter(Boolean);}
  function startStudy(id,mode) {
    const w=words.find(x=>x.id===id);if(!w)return;
    if(!canStudyWord(w)){toast("Materi kata ini belum lengkap; sesi latihan belum dibuka.");return;}
    ensureProgress(id);selectedWord=id;
    activeStudy={wordId:id,mode:mode||"learn",stage:0,result:null,stepResults:[],sessionId:uid(),currentContext:null};
    
    setView("study");renderStudy();
  }
  function contextQuestion(w,p) {
    const tried=new Set(p.contextQuestionIds||[]),original=w.context;
    if(original&&original.id&&original.prompt&&Array.isArray(original.options)&&Number.isInteger(original.answer)&&!tried.has(original.id))
      return {id:original.id,prompt:original.prompt,options:original.options,answer:original.answer,explanation:original.explanation||"Perhatikan makna kata di dalam konteks."};
    const next=(w.contextVariants||[]).find(v=>v.id&&v.sentence&&!tried.has(v.id));
    const sentence=(next&&next.sentence)||w.example||"",id=(next&&next.id)||w.id+"-example-context";
    const correct=(w.acceptedMeanings||[]).find(Boolean)||(w.meaning||"").split(/[;；]/)[0].trim();
    const seed=w.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0)+tried.size;
    const correctAliases=new Set([correct,...(w.acceptedMeanings||[])].map(norm).filter(Boolean));
    const candidateRows=words.filter(x=>x.id!==w.id&&x.meaning).map(x=>{
      const meaning=(x.acceptedMeanings||[]).find(Boolean)||(x.meaning||"").split(/[;；]/)[0].trim();
      return {id:x.id,meaning:meaning,level:x.level,pos:(x.partOfSpeech||"").split(/[\\/,]/).map(norm).filter(Boolean),topics:x.topics||[]};
    }).filter(x=>x.meaning&&!correctAliases.has(norm(x.meaning)));
    const unique=Array.from(new Map(candidateRows.map(x=>[norm(x.meaning),x])).values());
    const targetPos=new Set((w.partOfSpeech||"").split(/[\\/,]/).map(norm).filter(Boolean));
    const targetTopics=new Set(w.topics||[]);
    const similarity=x=>(x.level===w.level?4:0)+(x.pos.some(pos=>targetPos.has(pos))?3:0)+(x.topics.some(topic=>targetTopics.has(topic))?2:0)-Math.min(2,Math.abs(x.meaning.length-correct.length)/20);
    const stableRank=x=>{let hash=(seed>>>0)+2166136261;for(let i=0;i<x.id.length;i++)hash=Math.imul(hash^x.id.charCodeAt(i),16777619)>>>0;return hash;};
    const ranked=unique.sort((a,b)=>similarity(b)-similarity(a)||stableRank(a)-stableRank(b));
    const distractors=[];
    for(const candidate of ranked){if(!distractors.some(item=>norm(item)===norm(candidate.meaning)))distractors.push(candidate.meaning);if(distractors.length===2)break;}
    const options=[correct,...distractors],shift=seed%Math.max(1,options.length),ordered=options.slice(shift).concat(options.slice(0,shift));
    return {id,prompt:'Dalam kalimat “'+sentence+'”, arti kata “'+w.word+'” paling dekat dengan…',options:ordered,answer:ordered.findIndex(x=>norm(x)===norm(correct)),explanation:"Gunakan arti kata dan konteks kalimat untuk memilih jawaban."+(w.commonMistake?" "+w.commonMistake:"")};
  }
  function confidenceMarkup(){return '<label class="confidence-field"><span>SEBERAPA YAKIN?</span><select id="study-confidence"><option value="high">Yakin</option><option value="medium" selected>Agak yakin</option><option value="guess">Menebak</option></select></label>';}
  function renderStudy() {
    if(!activeStudy)return setView("vocabulary");
    const w=words.find(x=>x.id===activeStudy.wordId),p=ensureProgress(w.id),i=activeStudy.stage;
    const stages=["Recall arti","Pahami konteks","Gunakan sendiri"];
    if(i>=3){finishStudy();return;}
    let body="";
    if(activeStudy.result){
      const r=activeStudy.result;
      body='<div class="study-feedback '+(r.correct?"":"wrong")+'"><strong>'+(r.correct?"Jawaban tercatat.":"Belum tepat.")+'</strong><br>'+esc(r.feedback)+'</div>'+
        (!r.correct?'<p class="study-correction">Jawaban yang diharapkan: <strong>'+esc(r.expected||"lihat penjelasan")+'</strong></p>':"")+
        '<p class="study-small-note">Keyakinan dan hasil tersimpan. Keterampilan yang gagal perlu diuji lagi di sesi berikutnya.</p><button class="primary-action study-submit" id="study-next" type="button">'+(i===2?"Selesai dan lihat hasil":"Lanjut ke langkah berikutnya")+' →</button>';
    }else if(i===0){
      body='<p class="study-prompt">Apa arti kata ini? Tulis dari ingatanmu sendiri tanpa membuka catatan.</p><form id="recall-form"><label class="study-select-label" for="recall-answer">ARTI DALAM BAHASA INDONESIA</label><input class="study-input" id="recall-answer" autocomplete="off" placeholder="Tulis artinya…" required>'+confidenceMarkup()+'<button class="primary-action study-submit" type="submit">Periksa jawaban →</button></form>';
    }else if(i===1){
      const q=contextQuestion(w,p);activeStudy.currentContext=q;
      body='<p class="study-prompt">'+esc(q.prompt)+'</p><form id="context-form"><div class="study-options">'+q.options.map((o,n)=>'<label class="study-option-label"><input type="radio" name="context-answer" value="'+n+'" required><span>'+String.fromCharCode(65+n)+'</span><span>'+esc(o)+'</span></label>').join("")+'</div>'+confidenceMarkup()+'<button class="primary-action study-submit" type="submit">Periksa konteks →</button></form>';
    }else{
      body='<p class="study-prompt">Buat kalimat bahasa Inggris sendiri menggunakan <strong>'+esc(w.word)+'</strong> atau bentuk katanya yang sesuai.</p><form id="production-form"><label class="study-select-label" for="production-answer">KALIMATMU</label><textarea class="study-input production-input" id="production-answer" rows="3" placeholder="Write your own sentence…" required></textarea>'+confidenceMarkup()+'<div class="production-rubric"><label><input type="checkbox" id="production-self-check" required><span>Sudah kuperiksa: kalimat memiliki subjek dan kata kerja, memakai kata target dengan tepat, serta sesuai dengan makna yang ingin kusampaikan.</span></label></div><p class="study-small-note">Pemeriksaan otomatis hanya mengecek panjang kalimat dan keberadaan kata target. Ketepatan makna dan grammar tetap perlu kamu refleksikan sendiri.</p><button class="primary-action study-submit" type="submit">Catat latihan →</button></form>';
    }
    const pct=((i+(activeStudy.result?1:0))/3)*100;
    $("#study-container").innerHTML='<div class="study-step-meta"><span>'+esc(w.level)+' / '+stages[i].toUpperCase()+'</span><span>LANGKAH '+(i+1)+' DARI 3</span></div><div class="study-step-track"><span style="width:'+pct+'%"></span></div><article class="study-card"><h1>'+esc(w.word)+'<em>.</em></h1><p class="study-ipa">'+esc(w.ipa||"Pronunciation not provided")+'</p>'+body+'</article>';
    bindStudy(w,i);
  }
  function bindStudy(w,i) {
    $("#recall-form")?.addEventListener("submit",async e=>{
      e.preventDefault();const answer=$("#recall-answer").value.trim(),accepted=w.acceptedMeanings||[w.meaning],correct=accepted.some(x=>norm(x)===norm(answer));
      await recordAttempt(w,"recall",correct,answer,"typed-meaning",$("#study-confidence").value,null);
      activeStudy.stepResults[i]=correct;activeStudy.result={correct,expected:accepted[0],feedback:correct?"Arti yang ditulis cocok dengan jawaban yang diterima. Bukti recall tercatat.":"Jawaban belum cocok dengan arti yang divalidasi. Recall perlu dibuktikan lagi."};renderStudy();
    });
    $("#context-form")?.addEventListener("submit",async e=>{
      e.preventDefault();const selected=$("input[name='context-answer']:checked",e.currentTarget);if(!selected)return;
      const q=activeStudy.currentContext,n=Number(selected.value),correct=n===q.answer;
      await recordAttempt(w,"context",correct,q.options[n],q.id,$("#study-confidence").value,q.id);
      activeStudy.stepResults[i]=correct;activeStudy.result={correct,expected:q.options[q.answer],feedback:q.explanation+(correct?" Jawaban tepat pada konteks ini.":" Coba perhatikan maknanya lagi pada konteks lain.")};renderStudy();
    });
    $("#production-form")?.addEventListener("submit",async e=>{
      e.preventDefault();const answer=$("#production-answer").value.trim(),normalized=norm(answer),list=normalized.split(" ").filter(Boolean);
      const includes=wordForms(w).some(f=>(" "+normalized+" ").includes(" "+f+" "));
      const checked=$("#production-self-check").checked,correct=list.length>=4&&includes&&checked;
      const feedback=correct?"Pemeriksaan dasar lolos dan self-check dicatat. Ini bukan penilaian semantik otomatis; makna dan grammar tetap perlu diperiksa sendiri.":!includes?"Kalimat perlu memuat kata target atau bentuk kata yang tercantum.":list.length<4?"Kembangkan kalimat menjadi sedikitnya empat kata agar konteksnya terlihat.":"Periksa kembali kalimatmu dan centang self-check setelah yakin.";
      await recordAttempt(w,"production",correct,answer,"typed-production-self-check",$("#study-confidence").value,null);
      activeStudy.stepResults[i]=correct;activeStudy.result={correct,expected:w.word+" / word form",feedback};renderStudy();
    });
    $("#study-next")?.addEventListener("click",()=>{activeStudy.stage++;activeStudy.result=null;renderStudy();});
  }
  async function recordAttempt(w,skill,correct,response,questionId,confidence,contextId) {
    const p=ensureProgress(w.id),now=new Date(),date=dayKey(now);
    p.firstSeenDate ||= date;p.lastStudiedAt=now.toISOString();
    if(!p.studiedDates.includes(date))p.studiedDates.push(date);
    if(!p.nextReviewAt)p.nextReviewAt=plusDays(now,1).toISOString();
    const event={id:uid(),wordId:w.id,word:w.word,skill,correct,response:String(response).slice(0,500),questionId,contextQuestionId:contextId,mode:activeStudy.mode,confidence,at:now.toISOString(),date,sessionId:activeStudy.sessionId};
    p.attempts.push(event);if(p.attempts.length>250)p.attempts=p.attempts.slice(-250);
    state.events.push(event);if(state.events.length>5000)state.events=state.events.slice(-5000);
    if(skill==="context"){
      const isNew=!p.contextQuestionIds.includes(questionId);if(isNew)p.contextQuestionIds.push(questionId);
      if(correct&&isNew)p.skillEvidence.context=true;
      if(!correct)p.skillEvidence.context=false;
    }else p.skillEvidence[skill]=correct;
    if(correct)p.consecutiveErrors=0;else{p.consecutiveErrors=(p.consecutiveErrors||0)+1;if(p.consecutiveErrors>=2||activeStudy.mode==="review")p.weak=true;}
    if(activeStudy.mode==="review"&&!correct)activeStudy.reviewFailed=true;
    pushHistory({type:"vocabulary",title:w.word,detail:""});
    const last=state.history[0];last.detail=({recall:"Recall arti",context:"Pengenalan konteks",production:"Penggunaan aktif"})[skill]+(correct?" · benar":" · perlu dilatih");last.correct=correct;last.wordId=w.id;last.skill=skill;last.mode=activeStudy.mode;
    if(!correct && (skill === "recall" || skill === "context") && typeof window.sinauuRecordMistake === "function"){
      const isRecall=skill==="recall";
      const ctx=isRecall?null:(w.context&&w.context.id===questionId?w.context:null);
      window.sinauuRecordMistake({
        sourceType: "vocab",
        sourceId: w.id,
        wordId: w.id,
        questionId: questionId,
        skill: "vocabulary",
        prompt: isRecall?("Tuliskan arti kata: "+w.word):(ctx?ctx.prompt:("Konteks kalimat untuk: "+w.word)),
        wrongAnswer: String(response),
        correctAnswer: isRecall?w.meaning:(ctx&&ctx.options?ctx.options[ctx.answer]:(w.meaning||"")),
        explanation: isRecall?("Definisi terverifikasi: "+w.meaning+(w.partOfSpeech?" ("+w.partOfSpeech+")":"")):(ctx?ctx.explanation:""),
        mistakeId: "vocab:" + w.id + ":" + questionId
      });
    }
    await save();
  }
  async function finishStudy() {
    const w=words.find(x=>x.id===activeStudy.wordId),p=ensureProgress(w.id);
    const passed=activeStudy.stepResults.length===3&&activeStudy.stepResults.every(Boolean);
    let message="Sesi tercatat. Review berikutnya mengikuti jadwal di perangkat.";
    if(activeStudy.mode==="review"){
      const now=new Date(),date=dayKey(now);
      p.reviewHistory.push({date,at:now.toISOString(),correct:passed,sessionId:activeStudy.sessionId});if(p.reviewHistory.length>150)p.reviewHistory=p.reviewHistory.slice(-150);
      if(passed){
        p.reviewSuccesses=(p.reviewSuccesses||0)+1;if(!p.reviewDates.includes(date))p.reviewDates.push(date);
        p.weak=false;p.consecutiveErrors=0;p.nextReviewAt=plusDays(now,INTERVALS[Math.min(p.reviewSuccesses-1,INTERVALS.length-1)]).toISOString();
        message=masteryGate(p)?"Kriteria mastery terpenuhi: tiga skill, tiga review berjeda, empat hari belajar, dan jarak minimal 12 hari.":"Review berhasil "+p.reviewSuccesses+"/3. Mastery masih menunggu semua skill serta jeda hari.";
      }else{p.reviewSuccesses=0;p.reviewDates=[];p.weak=true;p.nextReviewAt=plusDays(now,1).toISOString();message="Ada langkah yang belum berhasil. Rangkaian retensi diulang; histori tetap disimpan.";}
    }
    await save();renderOverview();
    activeStudy.stage=3;
    const si=statusInfo[statusOf(w)];
    $("#study-container").innerHTML='<article class="study-card study-complete"><span class="study-complete-mark">'+(passed?"✓":"↻")+'</span><h1>'+(passed?"Sesi selesai.":"Masih ada yang perlu dilatih.")+'</h1><p>'+esc(message)+'</p><div class="study-evidence-summary"><span class="'+(p.skillEvidence.recall?"done":"")+'">'+(p.skillEvidence.recall?"✓":"○")+' Recall arti</span><span class="'+(p.skillEvidence.context?"done":"")+'">'+(p.skillEvidence.context?"✓":"○")+' Konteks berbeda</span><span class="'+(p.skillEvidence.production?"done":"")+'">'+(p.skillEvidence.production?"✓":"○")+' Produksi + self-check</span><span>'+(p.reviewSuccesses||0)+'/3 review berjeda</span></div><p class="study-small-note">Status sekarang: <strong>'+si.label+'</strong>. Jawaban benar dalam satu sesi tidak langsung memberi mastery.</p><div class="study-complete-actions"><button class="primary-action" id="study-another" type="button">Pilih kata lain ↗</button><button class="secondary-action" id="study-review" type="button">Lihat jadwal review</button></div></article>';
    $("#study-another").addEventListener("click",()=>setView("vocabulary"));$("#study-review").addEventListener("click",()=>setView("review"));
  }
  function renderGrammar() {
    $("#grammar-count").textContent=topics.length+" topik";$("#nav-grammar-count").textContent=topics.length;
    $("#grammar-topic-list").innerHTML=topics.map(t=>{
      const p=state.grammarProgress[t.id],n=Object.keys((p&&p.answers)||{}).length;
      return '<button class="topic-button '+(activeTopic===t.id?"is-active":"")+'" data-topic-id="'+esc(t.id)+'" type="button"><span class="topic-code">'+esc(t.level)+'</span><span><strong>'+esc(t.title)+'</strong><small>'+n+'/'+t.questions.length+' soal dicoba</small></span></button>';
    }).join("");
    if(!activeTopic||!topics.some(t=>t.id===activeTopic))activeTopic=topics[0]?.id;
    $("#view-grammar .grammar-layout")?.classList.toggle("is-detail-open",grammarDetailOpen);
    $("#view-grammar")?.classList.toggle("is-detail-view",grammarDetailOpen);
    if(activeTopic)renderLesson(activeTopic);
  }
  function renderLesson(id) {
    const t=topics.find(x=>x.id===id);if(!t)return;
    activeTopic=id;$$(".topic-button").forEach(b=>b.classList.toggle("is-active",b.dataset.topicId===id));
    const ui=grammarUI[id]||(grammarUI[id]={index:0,result:null,sessionCorrect:0});
    const p=state.grammarProgress[id]||{attempts:0,correct:0,answers:{}},unique=Object.keys(p.answers||{}).length;
    const patterns=t.patterns.map(x=>'<div class="pattern-item"><strong>'+esc(x.label)+'</strong><pre>'+esc(x.pattern)+'</pre></div>').join("");
    const examples=t.examples.map(x=>'<div class="lesson-example"><strong>'+esc(x.en)+'</strong><span>'+esc(x.id)+'</span></div>').join("");
    const mistakes=t.mistakes.map(x=>'<div class="mistake-item"><div class="wrong">'+esc(x.wrong)+'</div><div class="right">'+esc(x.right)+'</div><p>'+esc(x.why)+'</p></div>').join("");
    $("#lesson-panel").innerHTML='<button class="mobile-detail-back grammar-detail-back" type="button" data-grammar-back>← Kembali ke daftar topik</button><div class="lesson-head-meta"><span>'+esc(t.level)+' / '+esc(t.category.toUpperCase())+'</span><span>'+t.estimatedMinutes+' MENIT</span></div><h2>'+esc(t.title)+'</h2><p class="lesson-summary">'+esc(t.summary)+'</p><div class="lesson-body"><h3>Penjelasan</h3><p>'+esc(t.explanation)+'</p><h3>Pola kalimat</h3><div class="pattern-list">'+patterns+'</div><h3>Contoh dan terjemahan</h3><div class="lesson-examples">'+examples+'</div><h3>Kesalahan yang sering terjadi</h3><div class="mistake-list">'+mistakes+'</div><div class="checkpoint"><strong>Checkpoint.</strong> '+esc(t.checkpoint)+'</div></div><div class="lesson-quiz"><div class="lesson-quiz-heading"><h3>Latihan khusus topik ini</h3><span>'+unique+'/'+t.questions.length+' soal unik dicoba</span></div><div id="lesson-question-container">'+lessonQuestion(t,ui)+'</div><p class="lesson-progress-note">Akurasi semua percobaan: '+(p.attempts?p.correct+"/"+p.attempts+" benar ("+Math.round(p.correct/p.attempts*100)+"%)":"belum ada percobaan")+'. Ini bukan status mastery grammar.</p></div>';
    bindGrammar(t);
  }
  function lessonQuestion(t,ui) {
    if(ui.index>=t.questions.length)return '<div class="quiz-end"><h3>'+ui.sessionCorrect+'/'+t.questions.length+' benar pada sesi ini.</h3><p>Jawaban tersimpan. Kamu bisa mengulang topik; percobaan sebelumnya tetap ada.</p><button type="button" class="secondary-action" id="restart-topic">Ulangi topik ↻</button></div>';
    const q=t.questions[ui.index],input=q.type==="typed"
      ?'<form id="grammar-answer-form"><label class="study-select-label" for="grammar-typed-answer">JAWABAN SINGKAT</label><input class="study-input" id="grammar-typed-answer" required autocomplete="off" placeholder="Ketik jawaban…"><button class="primary-action study-submit" type="submit">Periksa jawaban →</button></form>'
      :'<div class="lesson-answers">'+q.options.map((o,n)=>'<button type="button" class="lesson-answer" data-grammar-choice="'+n+'"><span>'+String.fromCharCode(65+n)+'</span><span>'+esc(o)+'</span></button>').join("")+'</div>';
    const r=ui.result;
    return '<div class="lesson-question"><small>SOAL '+(ui.index+1)+' / '+t.questions.length+' · '+(q.type==="typed"?"TYPED ANSWER":"MULTIPLE CHOICE")+'</small>'+esc(q.prompt)+'</div>'+
      (r?'<div class="lesson-feedback '+(r.correct?"":"wrong")+'"><strong>'+(r.correct?"Benar.":"Belum tepat.")+'</strong> '+esc(r.explanation)+(!r.correct?"<br><span>Jawaban diterima: "+esc(r.expected)+"</span>":"")+'</div><div class="lesson-quiz-actions"><p>Jawaban tercatat di progres topik.</p><button type="button" id="grammar-next">'+(ui.index===t.questions.length-1?"Selesaikan sesi":"Soal berikutnya →")+'</button></div>':input);
  }
  function bindGrammar(t) {
    const ui=grammarUI[t.id];
    $$(".lesson-answer").forEach(b=>b.addEventListener("click",async()=>{
      if(ui.result)return;const q=t.questions[ui.index],n=Number(b.dataset.grammarChoice),correct=n===q.answer;
      await recordGrammar(t,q,correct,q.options[n],q.options[q.answer]);if(correct)ui.sessionCorrect++;
      ui.result={correct,explanation:q.explanation,expected:q.options[q.answer]};renderLesson(t.id);renderTopicList();
    }));
    $("#grammar-answer-form")?.addEventListener("submit",async e=>{
      e.preventDefault();if(ui.result)return;const q=t.questions[ui.index],ans=$("#grammar-typed-answer").value.trim(),accepted=q.accepted||[],correct=accepted.some(x=>norm(x)===norm(ans));
      await recordGrammar(t,q,correct,ans,accepted.join(" / "));if(correct)ui.sessionCorrect++;
      ui.result={correct,explanation:q.explanation,expected:accepted.join(" / ")};renderLesson(t.id);renderTopicList();
    });
    $("#grammar-next")?.addEventListener("click",()=>{ui.index++;ui.result=null;renderLesson(t.id);renderTopicList();});
    $("#restart-topic")?.addEventListener("click",()=>{ui.index=0;ui.result=null;ui.sessionCorrect=0;renderLesson(t.id);});
  }
  function renderTopicList() {
    const el=$("#grammar-topic-list");
    if(!el)return;
    el.innerHTML=topics.map(t=>{const p=state.grammarProgress[t.id],n=Object.keys((p&&p.answers)||{}).length;return '<button class="topic-button '+(activeTopic===t.id?"is-active":"")+'" data-topic-id="'+esc(t.id)+'" type="button"><span class="topic-code">'+esc(t.level)+'</span><span><strong>'+esc(t.title)+'</strong><small>'+n+'/'+t.questions.length+' soal dicoba</small></span></button>';}).join("");
  }
  async function recordGrammar(t,q,correct,response,expected) {
    state.grammarProgress[t.id] ||= {attempts:0,correct:0,answers:{},history:[]};
    const p=state.grammarProgress[t.id];p.attempts++;if(correct)p.correct++;
    p.answers ||= {};p.answers[q.id]={correct,response:String(response).slice(0,500),at:new Date().toISOString()};
    p.history ||= [];p.history.push({questionId:q.id,correct,at:new Date().toISOString()});if(p.history.length>250)p.history=p.history.slice(-250);
    pushHistory({type:"grammar",title:t.title,detail:"Soal: "+q.id,correct,topicId:t.id,questionId:q.id});
    if(!correct && typeof window.sinauuRecordMistake === "function"){
      window.sinauuRecordMistake({
        sourceType: "grammar",
        sourceId: t.id,
        topicId: t.id,
        questionId: q.id,
        skill: "grammar",
        prompt: q.prompt,
        wrongAnswer: String(response),
        correctAnswer: expected || (Array.isArray(q.options) && Number.isInteger(q.answer) ? q.options[q.answer] : q.answer),
        explanation: q.explanation || "",
        mistakeId: "grammar:" + t.id + ":" + q.id
      });
    }
    await save();
  }
  function formatUpcomingDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diffDays <= 1) return "Besok (" + fmtDate(d, { day: "numeric", month: "short" }) + ")";
    return fmtDate(d, { day: "numeric", month: "short", year: "numeric" });
  }

  function getUnifiedReviewQueue(coreState, extras, wordList, topicList, habitLibrary, now = Date.now()) {
    const core = coreState || {};
    const wordProg = (core.wordProgress && typeof core.wordProgress === "object") ? core.wordProgress : {};
    const wordsArr = Array.isArray(wordList) ? wordList : [];
    const topicsArr = Array.isArray(topicList) ? topicList : [];
    const adv = (extras && extras.adventureProgress && typeof extras.adventureProgress === "object") ? extras.adventureProgress : {};
    const mistakeJournal = (adv.mistakeJournal && typeof adv.mistakeJournal === "object") ? adv.mistakeJournal : {};

    const nowDate = new Date(now);
    const nowMs = nowDate.getTime();
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

    const items = [];
    const completedItems = [];

    // 1. Vocabulary
    for (const w of wordsArr) {
      if (!w || !w.id || !canStudyWord(w)) continue;
      const p = wordProg[w.id];
      if (!p) continue;

      const status = statusOf(w);
      const nextReviewTime = p.nextReviewAt ? Date.parse(p.nextReviewAt) : NaN;
      const isDue = Number.isFinite(nextReviewTime) && nextReviewTime <= nowMs;
      const isWeak = Boolean(p.weak);

      if (status !== "mastered" && (isDue || isWeak)) {
        let category = "dueToday";
        let delayDays = 0;

        if (isDue) {
          if (nextReviewTime < todayStart) {
            category = "overdue";
            delayDays = Math.max(1, Math.floor((todayStart - nextReviewTime) / 86400000));
          } else {
            category = "dueToday";
          }
        } else if (isWeak) {
          category = "needsPractice";
        }

        const stage = Math.max(0, Math.min(3, Math.floor(Number(p.reviewSuccesses) || 0)));
        const maxStage = 3;

        let reason = "";
        if (p.savedContext) {
          reason = `Disimpan dari "${p.savedContext.sourceTitle || 'bacaan'}" (${category === "overdue" ? `terlambat ${delayDays} hari` : 'siap review berkala'}).`;
        } else if (category === "overdue") {
          reason = `Terlambat ${delayDays} hari dari jadwal review berkala.`;
        } else if (isWeak) {
          reason = "Ada kesalahan pada sesi latihan sebelumnya; perlu pemantapan.";
        } else if (stage === 0) {
          reason = "Review retensi tahap 1/3 (jeda 1 hari setelah dipelajari).";
        } else if (stage === 1) {
          reason = "Review retensi tahap 2/3 (jeda 3 hari penguatan).";
        } else {
          reason = "Review retensi tahap 3/3 (jeda 7 hari retensi jangka panjang).";
        }

        let consequence = "";
        if (isWeak) {
          consequence = "Review benar akan membersihkan label kata lemah.";
        } else if (stage >= 2) {
          consequence = "Jika 3 skill, 4 hari aktif, dan rentang 12 hari terpenuhi, kata berstatus Mastered.";
        } else if (stage === 1) {
          consequence = "Review benar akan menjadwalkan review tahap 3/3 dengan jeda 7 hari.";
        } else {
          consequence = "Review benar akan menjadwalkan review tahap 2/3 dengan jeda 3 hari.";
        }

        let urgencyScore = 0;
        if (category === "overdue") {
          urgencyScore = 3000000000000 - nextReviewTime;
        } else if (category === "dueToday") {
          urgencyScore = 2000000000000 - nextReviewTime;
        } else {
          urgencyScore = 1000000000000 - (Number.isFinite(nextReviewTime) ? nextReviewTime : 0);
        }

        items.push({
          id: `vocab:${w.id}`,
          type: "vocabulary",
          wordId: w.id,
          skill: "vocabulary",
          skillLabel: "Kosakata",
          level: w.level ? w.level.toUpperCase() : "A1",
          title: w.word,
          subtitle: (w.partOfSpeech ? `[${w.partOfSpeech}] ` : "") + (w.meaning || ""),
          category,
          delayDays,
          dueAt: p.nextReviewAt || null,
          stage,
          maxStage,
          reason,
          consequence,
          urgencyScore,
          sourceLinkLabel: "Buka kamus kata ↗",
          sourceTarget: "vocabulary",
          raw: { word: w, progress: p }
        });
      }

      if (Array.isArray(p.reviewHistory)) {
        for (const entry of p.reviewHistory) {
          if (!entry || !entry.correct || !entry.at) continue;
          const entryTime = Date.parse(entry.at);
          if (Number.isFinite(entryTime)) {
            completedItems.push({
              id: `completed:vocab:${w.id}:${entry.at}`,
              type: "vocabulary",
              wordId: w.id,
              skill: "vocabulary",
              skillLabel: "Kosakata",
              level: w.level ? w.level.toUpperCase() : "A1",
              title: w.word,
              subtitle: w.meaning || "",
              category: "completed",
              stage: Math.min(3, p.reviewSuccesses || 1),
              maxStage: 3,
              completedAt: entry.at,
              timestamp: entryTime,
              reason: "Review kosakata berhasil dipanggil kembali.",
              consequence: status === "mastered" ? "Kata telah tuntas dikuasai (Mastered)." : "Jeda berikutnya dijadwalkan."
            });
          }
        }
      }
    }

    // 2. Mistake Journal items
    for (const m of Object.values(mistakeJournal)) {
      if (!m || !m.mistakeId || typeof m.mistakeId !== "string") continue;

      const isMastered = Boolean(m.masteredAt || (Number(m.reviewStage) >= 4));
      const stage = Math.max(0, Math.min(4, Math.floor(Number(m.reviewStage) || 0)));
      const maxStage = 4;

      let skillKey = "adventure";
      let skillLabel = "Petualangan";
      if (m.sourceType === "grammar" || m.topicId || (m.mistakeId && m.mistakeId.startsWith("grammar:"))) {
        skillKey = "grammar";
        skillLabel = "Tata Bahasa";
      } else if (m.sourceType === "habit" || m.passageId || (m.mistakeId && m.mistakeId.startsWith("habit:"))) {
        skillKey = "reading";
        skillLabel = "Pemahaman Bacaan";
      } else if (m.sourceType === "vocab" || m.wordId || (m.mistakeId && m.mistakeId.startsWith("vocab:"))) {
        skillKey = "vocabulary";
        skillLabel = "Kosakata";
      } else if (String(m.skill).toLowerCase() === "listening") {
        skillKey = "listening";
        skillLabel = "Menyimak";
      } else if (String(m.skill).toLowerCase() === "reading") {
        skillKey = "reading";
        skillLabel = "Pemahaman Bacaan";
      }

      const reviewDueTime = Date.parse(m.nextReviewAt || m.recordedAt || "");
      const isDue = !isMastered && (!Number.isFinite(reviewDueTime) || reviewDueTime <= nowMs);

      if (!isMastered) {
        let category = "dueToday";
        let delayDays = 0;

        if (isDue) {
          if (Number.isFinite(reviewDueTime) && reviewDueTime < todayStart) {
            category = "overdue";
            delayDays = Math.max(1, Math.floor((todayStart - reviewDueTime) / 86400000));
          } else {
            category = "dueToday";
          }
        } else if (stage === 0 || !m.resolvedAt) {
          category = "needsPractice";
        } else {
          category = "scheduledFuture";
        }

        if (category === "overdue" || category === "dueToday" || category === "needsPractice") {
          let reason = "";
          if (category === "overdue") {
            reason = `Terlambat ${delayDays} hari dari jadwal pengulangan bertahap.`;
          } else if (stage === 0 || !m.resolvedAt) {
            reason = "Belum diperbaiki setelah kesalahan awal; perlu pemantapan tanpa kunci.";
          } else if (stage === 1) {
            reason = "Review retensi tahap 2/4 (jeda 1 hari pemanggilan ulang).";
          } else if (stage === 2) {
            reason = "Review retensi tahap 3/4 (jeda 3 hari penguatan).";
          } else {
            reason = "Review retensi tahap 4/4 (jeda 7 hari penguasaan permanen).";
          }

          let consequence = "";
          if (stage >= 3) {
            consequence = "Jawaban tepat akan menuntaskan (master) catatan kesalahan ini secara permanen.";
          } else if (stage === 2) {
            consequence = "Jawaban tepat akan memajukan ke tahap 4/4 dengan jeda 7 hari.";
          } else if (stage === 1) {
            consequence = "Jawaban tepat akan memajukan ke tahap 3/4 dengan jeda 3 hari.";
          } else {
            consequence = "Jawaban tepat akan menjadwalkan review tahap 2/4 dengan jeda 1 hari.";
          }

          let urgencyScore = 0;
          if (category === "overdue") {
            urgencyScore = 3000000000000 - (Number.isFinite(reviewDueTime) ? reviewDueTime : 0);
          } else if (category === "dueToday") {
            urgencyScore = 2000000000000 - (Number.isFinite(reviewDueTime) ? reviewDueTime : 0);
          } else {
            urgencyScore = 1000000000000 - Date.parse(m.recordedAt || "");
          }

          let sourceTitle = m.sourceTitle || m.title || "Latihan Terkait";
          if (skillKey === "grammar") {
            const topicId = m.topicId || (m.mistakeId.split(":")[1]);
            const t = topicsArr.find(entry => entry.id === topicId);
            if (t) sourceTitle = t.title;
          }

          items.push({
            id: `mistake:${m.mistakeId}`,
            type: "mistake",
            mistakeId: m.mistakeId,
            skill: skillKey,
            skillLabel,
            level: m.level || null,
            title: m.prompt ? (m.prompt.length > 70 ? m.prompt.slice(0, 68) + "…" : m.prompt) : sourceTitle,
            subtitle: `Sumber: ${sourceTitle} · Jawaban sebelumnya: ${m.wrongAnswer || "—"}`,
            category,
            delayDays,
            dueAt: m.nextReviewAt || null,
            stage,
            maxStage,
            reason,
            consequence,
            urgencyScore,
            sourceLinkLabel: "Buka sumber latihan ↗",
            sourceTarget: skillKey,
            raw: m
          });
        }
      }

      if (Array.isArray(m.reviewHistory)) {
        for (const entry of m.reviewHistory) {
          if (!entry || !entry.correct || !entry.reviewedAt) continue;
          const entryTime = Date.parse(entry.reviewedAt);
          if (Number.isFinite(entryTime)) {
            completedItems.push({
              id: `completed:mistake:${m.mistakeId}:${entry.reviewedAt}`,
              type: "mistake",
              mistakeId: m.mistakeId,
              skill: skillKey,
              skillLabel,
              level: m.level || null,
              title: m.prompt || "Review kesalahan",
              subtitle: `Jawaban tepat dipanggil kembali pada tahap ${entry.stage || stage} / 4`,
              category: "completed",
              stage: entry.stage || stage,
              maxStage: 4,
              completedAt: entry.reviewedAt,
              timestamp: entryTime,
              reason: "Pengulangan Spaced Retrieval berhasil dijawab dengan tepat.",
              consequence: entry.stage >= 4 ? "Catatan kesalahan tuntas (Mastered)." : "Jadwal jeda berikutnya diperbarui."
            });
          }
        }
      }
    }

    items.sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return String(a.id).localeCompare(String(b.id));
    });

    completedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const overdueCount = items.filter(x => x.category === "overdue").length;
    const todayCount = items.filter(x => x.category === "dueToday").length;
    const practiceCount = items.filter(x => x.category === "needsPractice").length;
    const totalDue = overdueCount + todayCount;

    const focusedSession = items.slice(0, 5);

    return {
      items,
      completedItems: completedItems.slice(0, 15),
      focusedSession,
      counts: {
        totalDue,
        overdue: overdueCount,
        today: todayCount,
        practice: practiceCount,
        completed: completedItems.length
      }
    };
  }

  function renderReview() {
    const queue = getUnifiedReviewQueue(state, readExtraSnapshots(), words, topics, null);
    const counts = queue.counts;

    const dueTotal = $("#review-due-total");
    if (dueTotal) dueTotal.textContent = counts.totalDue;
    const overdueTotal = $("#review-overdue-total");
    if (overdueTotal) overdueTotal.textContent = counts.overdue;
    const todayTotal = $("#review-today-total");
    if (todayTotal) todayTotal.textContent = counts.today;
    const practiceTotal = $("#review-practice-total");
    if (practiceTotal) practiceTotal.textContent = counts.practice;
    const successTotal = $("#review-success-total");
    if (successTotal) successTotal.textContent = counts.completed;
    const navCount = $("#nav-review-count");
    if (navCount) navCount.textContent = counts.totalDue;

    const tabDue = $("#review-tab-due-count");
    if (tabDue) tabDue.textContent = counts.totalDue;
    const tabOverdue = $("#review-tab-overdue-count");
    if (tabOverdue) tabOverdue.textContent = counts.overdue;
    const tabToday = $("#review-tab-today-count");
    if (tabToday) tabToday.textContent = counts.today;
    const tabPractice = $("#review-tab-practice-count");
    if (tabPractice) tabPractice.textContent = counts.practice;
    const tabCompleted = $("#review-tab-completed-count");
    if (tabCompleted) tabCompleted.textContent = counts.completed;

    $$(".review-filter-btn").forEach(btn => {
      const active = btn.dataset.reviewFilter === reviewFilterTab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    $$(".review-skill-pill").forEach(pill => {
      const active = pill.dataset.reviewSkill === reviewSkillFilter;
      pill.classList.toggle("is-active", active);
    });

    const focusCard = $("#review-focus-card");
    if (focusCard) {
      if (queue.focusedSession.length > 0 && reviewFilterTab !== "completed") {
        focusCard.hidden = false;
        const focusTitle = $("#review-focus-title");
        if (focusTitle) focusTitle.textContent = `${queue.focusedSession.length} Materi Prioritas`;
        const focusDesc = $("#review-focus-desc");
        if (focusDesc) {
          const overdueNum = queue.focusedSession.filter(x => x.category === "overdue").length;
          focusDesc.textContent = overdueNum > 0
            ? `${overdueNum} materi terlambat diprioritaskan di awal sesi agar ingatan tidak pudar.`
            : "Materi teratas dipilih agar sesi belajarmu tetap terarah dan tidak membebani.";
        }
        const focusPills = $("#review-focus-pills");
        if (focusPills) {
          focusPills.innerHTML = queue.focusedSession.map(item => `
            <span class="review-focus-pill">
              <strong>${esc(item.title)}</strong>
              <small>${esc(item.skillLabel)} · ${esc(item.category === 'overdue' ? 'Terlambat' : item.category === 'dueToday' ? 'Hari Ini' : 'Pemantapan')}</small>
            </span>
          `).join("");
        }
      } else {
        focusCard.hidden = true;
      }
    }

    window.sinauuUpdateReviewActivePanel?.();

    let sourceList = [];
    if (reviewFilterTab === "due") {
      sourceList = queue.items.filter(x => x.category === "overdue" || x.category === "dueToday");
    } else if (reviewFilterTab === "overdue") {
      sourceList = queue.items.filter(x => x.category === "overdue");
    } else if (reviewFilterTab === "today") {
      sourceList = queue.items.filter(x => x.category === "dueToday");
    } else if (reviewFilterTab === "practice") {
      sourceList = queue.items.filter(x => x.category === "needsPractice");
    } else if (reviewFilterTab === "completed") {
      sourceList = queue.completedItems;
    }

    if (reviewSkillFilter !== "all") {
      sourceList = sourceList.filter(x => x.skill === reviewSkillFilter);
    }

    const reviewList = $("#review-list");
    if (!reviewList) return;

    if (!sourceList.length) {
      if (reviewFilterTab === "completed") {
        reviewList.innerHTML = `<div class="review-empty">
          <h2>Belum ada review yang baru selesai.</h2>
          <p>Selesaikan review pada antrean Jatuh Tempo untuk membangun riwayat pengulangan berkala di perangkat ini.</p>
          <div class="review-empty-actions">
            <button class="primary-action" type="button" data-review-filter="due">Buka antrean jatuh tempo →</button>
          </div>
        </div>`;
      } else if (counts.totalDue > 0 || counts.practice > 0) {
        reviewList.innerHTML = `<div class="review-empty">
          <h2>Tidak ada materi pada kategori ini.</h2>
          <p>Pilih kategori atau filter kemampuan lain untuk melihat materi yang memerlukan review.</p>
          <div class="review-empty-actions">
            <button class="primary-action" type="button" data-review-filter="due">Lihat semua jatuh tempo (${counts.totalDue}) →</button>
          </div>
        </div>`;
      } else {
        let earliestUpcoming = null;
        for (const w of words) {
          const p = state.wordProgress[w.id];
          if (p && p.nextReviewAt) {
            const t = Date.parse(p.nextReviewAt);
            if (Number.isFinite(t) && t > Date.now() && (!earliestUpcoming || t < earliestUpcoming)) earliestUpcoming = t;
          }
        }
        const extras = readExtraSnapshots();
        const mistakes = extras.adventureProgress?.mistakeJournal || {};
        for (const m of Object.values(mistakes)) {
          if (m && m.nextReviewAt && !window.sinauuIsMistakeMastered?.(m)) {
            const t = Date.parse(m.nextReviewAt);
            if (Number.isFinite(t) && t > Date.now() && (!earliestUpcoming || t < earliestUpcoming)) earliestUpcoming = t;
          }
        }

        if (earliestUpcoming) {
          const formattedDate = formatUpcomingDate(new Date(earliestUpcoming).toISOString());
          reviewList.innerHTML = `<div class="review-empty">
            <h2>Belum ada review yang jatuh tempo.</h2>
            <p>Semua materi review saat ini masih dalam masa jeda ingatan. Jadwal review terdekat berikutnya: <strong>${esc(formattedDate)}</strong>. Jadwal memakai hari yang benar-benar berlalu; membuka halaman berulang kali tidak mempercepatnya.</p>
            <div class="review-empty-actions">
              <button class="primary-action" type="button" data-view-target="vocabulary">Pelajari kata baru ↗</button>
            </div>
          </div>`;
        } else {
          reviewList.innerHTML = `<div class="review-empty">
            <h2>Belum ada review yang jatuh tempo.</h2>
            <p>Setelah kamu mempelajari kata atau menyelesaikan misi, sistem Spaced Retrieval akan menjadwalkan review di sini secara otomatis. Jadwal memakai hari yang benar-benar berlalu; membuka halaman berulang kali tidak mempercepatnya.</p>
            <div class="review-empty-actions">
              <button class="primary-action" type="button" data-view-target="vocabulary">Pelajari kata baru ↗</button>
            </div>
          </div>`;
        }
      }
    } else {
      reviewList.innerHTML = sourceList.map(item => {
        const cardCls = item.category === "overdue" ? "is-overdue" :
          item.category === "dueToday" ? "is-due-today" :
          item.category === "needsPractice" ? "is-practice" : "is-completed";
        const urgencyCls = item.category === "overdue" ? "review-urgency-overdue" :
          item.category === "dueToday" ? "review-urgency-today" :
          item.category === "needsPractice" ? "review-urgency-practice" : "review-urgency-completed";
        const urgencyLabel = item.category === "overdue" ? `TERLAMBAT ${item.delayDays > 0 ? item.delayDays + ' HARI' : ''}`.trim() :
          item.category === "dueToday" ? "JATUH HARI INI" :
          item.category === "needsPractice" ? "PERLU PEMANTAPAN" : "SELESAI";
        const stagePercent = Math.min(100, Math.round((item.stage / item.maxStage) * 100));

        return `<article class="review-queue-card ${cardCls}" data-review-item-id="${esc(item.id)}">
          <div class="review-card-top">
            <div class="review-card-meta">
              <span class="review-skill-badge review-skill-${esc(item.skill)}">${esc(item.skillLabel)}</span>
              ${item.level ? `<span class="review-level-badge">${esc(item.level)}</span>` : ""}
              <span class="review-urgency-badge ${urgencyCls}">${esc(urgencyLabel)}</span>
            </div>
            <div class="review-card-stage">
              <span class="review-stage-text">Tahap ${item.stage} / ${item.maxStage}</span>
              <span class="review-stage-meter" aria-hidden="true"><i style="width:${stagePercent}%"></i></span>
            </div>
          </div>
          <div class="review-card-main">
            <h3 class="review-card-title">${esc(item.title)}</h3>
            ${item.subtitle ? `<p class="review-card-subtitle">${esc(item.subtitle)}</p>` : ""}
          </div>
          <div class="review-card-qa-grid">
            <div class="review-qa-cell review-qa-reason">
              <span class="review-qa-label">MENGAPA JATUH TEMPO?</span>
              <p class="review-qa-text">${esc(item.reason)}</p>
            </div>
            <div class="review-qa-cell review-qa-consequence">
              <span class="review-qa-label">DAMPAK JIKA SELESAI:</span>
              <p class="review-qa-text">${esc(item.consequence)}</p>
            </div>
          </div>
          <div class="review-card-actions">
            <div>
              ${item.type === "vocabulary" ? `<button class="review-source-link" type="button" data-review-open-source="vocab:${esc(item.wordId)}">Buka kamus kata ↗</button>` :
                item.type === "mistake" ? `<button class="review-source-link" type="button" data-review-open-source="mistake:${esc(item.mistakeId)}">${esc(item.sourceLinkLabel || "Buka materi asal ↗")}</button>` : ""}
            </div>
            <div>
              ${item.category === "completed" ? `<span class="review-urgency-badge review-urgency-completed">✓ Selesai direview</span>` :
                item.type === "vocabulary" ? `<button class="review-action-btn" type="button" data-review-word="${esc(item.wordId)}">Mulai review →</button>` :
                `<button class="review-action-btn" type="button" data-review-mistake="${esc(item.mistakeId)}">Mulai review →</button>`}
            </div>
          </div>
        </article>`;
      }).join("");
    }
  }
  function aggregateSkillPassport(coreState, extras, wordList, topicList) {
    const core = coreState || {};
    const wordProg = core.wordProgress && typeof core.wordProgress === "object" ? core.wordProgress : {};
    const grammarProg = core.grammarProgress && typeof core.grammarProgress === "object" ? core.grammarProgress : {};
    const history = Array.isArray(core.history) ? core.history : [];

    const extraLearning = (extras && extras.extraLearning && typeof extras.extraLearning === "object") ? extras.extraLearning : {};
    const habitProg = (extras && extras.habitProgress && typeof extras.habitProgress === "object") ? extras.habitProgress : {};
    const adventureProg = (extras && extras.adventureProgress && typeof extras.adventureProgress === "object") ? extras.adventureProgress : {};

    const studioSessions = Array.isArray(adventureProg.studioSessions) ? adventureProg.studioSessions : [];
    const skillEvidence = (adventureProg.skillEvidence && typeof adventureProg.skillEvidence === "object") ? adventureProg.skillEvidence : {};

    function cleanDate(val) {
      if (!val) return null;
      const d = new Date(val);
      return !isNaN(d.getTime()) ? d : null;
    }
    function latestDate(dates) {
      let max = null;
      for (const item of dates) {
        const d = cleanDate(item);
        if (d && (!max || d.getTime() > max.getTime())) max = d;
      }
      return max ? max.toISOString() : null;
    }
    function formatLastPracticed(iso) {
      if (!iso) return "Belum pernah";
      const d = cleanDate(iso);
      if (!d) return "Belum pernah";
      return fmtDate(d, { day: "numeric", month: "short", year: "numeric" }) + " · " +
        new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(d);
    }
    function distinctDays(dates) {
      const set = new Set();
      for (const item of dates) {
        const d = cleanDate(item);
        if (d) set.add(d.toISOString().slice(0, 10));
      }
      return set.size;
    }

    // 1. VOCABULARY
    const vocabDates = [];
    let vocabWordsPracticed = 0;
    let vocabTotalAttempts = 0;
    let vocabMasteredCount = 0;
    let vocabReviewAttempts = 0;
    let vocabReviewCorrect = 0;

    const allWordKeys = new Set(Object.keys(wordProg));
    if (Array.isArray(wordList)) {
      for (const w of wordList) {
        if (w && w.id) allWordKeys.add(w.id);
      }
    }

    for (const key of allWordKeys) {
      const p = wordProg[key];
      if (!p || typeof p !== "object") continue;
      const attemptsCount = Array.isArray(p.attempts) ? p.attempts.length : 0;
      const isPracticed = attemptsCount > 0 || (Array.isArray(p.studiedDates) && p.studiedDates.length > 0) || p.firstSeenDate || (Array.isArray(p.reviewDates) && p.reviewDates.length > 0);
      if (isPracticed) vocabWordsPracticed++;
      vocabTotalAttempts += attemptsCount;
      if (masteryGate(p) || p.masteredAt) vocabMasteredCount++;
      if (Array.isArray(p.reviewHistory)) {
        vocabReviewAttempts += p.reviewHistory.length;
        vocabReviewCorrect += p.reviewHistory.filter(r => r && r.correct).length;
        p.reviewHistory.forEach(r => { if (r && r.at) vocabDates.push(r.at); });
      }
      if (p.lastSeenAt) vocabDates.push(p.lastSeenAt);
      if (Array.isArray(p.studiedDates)) p.studiedDates.forEach(d => { if (d) vocabDates.push(d); });
    }

    const matching = extraLearning.matching || {};
    const matchingMatches = Number(matching.totalMatches) || 0;
    const matchingMistakes = Number(matching.totalMistakes) || 0;
    const matchingAttempts = matchingMatches + matchingMistakes;
    vocabTotalAttempts += matchingAttempts;
    vocabReviewAttempts += matchingAttempts;
    vocabReviewCorrect += matchingMatches;

    const vocabEv = Array.isArray(skillEvidence.vocabulary) ? skillEvidence.vocabulary : [];
    vocabTotalAttempts += vocabEv.length;
    vocabEv.forEach(e => { if (e && e.recordedAt) vocabDates.push(e.recordedAt); });

    history.filter(h => h && ["vocabulary", "matching"].includes(h.type)).forEach(h => {
      if (h.at) vocabDates.push(h.at);
    });

    const vocabDays = distinctDays(vocabDates);
    const vocabStatus = (vocabWordsPracticed === 0 && vocabTotalAttempts === 0)
      ? "not-started"
      : (vocabWordsPracticed >= 10 || vocabMasteredCount >= 1 || vocabDays >= 2)
        ? "consistent"
        : "practicing";

    const vocabStatusReason = vocabStatus === "not-started"
      ? "Belum ada kata yang dipelajari atau direview."
      : vocabStatus === "consistent"
        ? "Telah mempelajari ≥10 kata atau memiliki catatan latihan bertahap."
        : "Telah memulai latihan kosakata awal.";

    const vocabAccuracy = vocabReviewAttempts > 0
      ? {
          percentage: Math.round((vocabReviewCorrect / vocabReviewAttempts) * 100),
          correct: vocabReviewCorrect,
          total: vocabReviewAttempts,
          note: "Akurasi review berkala & matching"
        }
      : null;

    const vocabEntry = {
      id: "vocabulary",
      title: "Kosakata (Vocabulary)",
      shortName: "Kosakata",
      symbol: "Aa",
      status: vocabStatus,
      statusLabel: vocabStatus === "not-started" ? "Belum dimulai" : vocabStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: vocabStatusReason,
      attemptsCount: vocabTotalAttempts,
      completedCount: vocabWordsPracticed,
      completedLabel: vocabWordsPracticed + " kata dipelajari",
      accuracy: vocabAccuracy,
      accuracyNote: "Hanya dinilai saat sesi review & matching",
      mastery: {
        count: vocabMasteredCount,
        label: vocabMasteredCount > 0 ? (vocabMasteredCount + " kata mastered (lulus kriteria review berjeda)") : "0 kata mastered (butuh 3 review sukses & interval 12 hari)"
      },
      lastPracticedAt: latestDate(vocabDates),
      lastPracticedLabel: formatLastPracticed(latestDate(vocabDates)),
      evidenceDetails: [
        vocabWordsPracticed + " kata dipelajari di korpus",
        vocabReviewAttempts + " soal review & matching dikerjakan",
        vocabDays + " hari aktif tercatat"
      ],
      primaryAction: {
        label: "Latih Kosakata ↗",
        viewTarget: dueWords().length > 0 ? "review" : "vocabulary"
      }
    };

    // 2. GRAMMAR
    const grammarDates = [];
    let grammarTopicsAttempted = 0;
    let grammarTotalAttempts = 0;
    let grammarTotalCorrect = 0;

    const allTopicKeys = new Set(Object.keys(grammarProg));
    if (Array.isArray(topicList)) {
      for (const t of topicList) {
        if (t && t.id) allTopicKeys.add(t.id);
      }
    }

    for (const key of allTopicKeys) {
      const p = grammarProg[key];
      if (!p || typeof p !== "object") continue;
      const att = Number(p.attempts) || 0;
      const cor = Number(p.correct) || 0;
      const answersCount = p.answers && typeof p.answers === "object" ? Object.keys(p.answers).length : 0;
      if (att > 0 || answersCount > 0) grammarTopicsAttempted++;
      grammarTotalAttempts += att;
      grammarTotalCorrect += cor;
      if (p.answers && typeof p.answers === "object") {
        Object.values(p.answers).forEach(a => { if (a && a.at) grammarDates.push(a.at); });
      }
      if (Array.isArray(p.history)) {
        p.history.forEach(h => { if (h && h.at) grammarDates.push(h.at); });
      }
    }

    const grammarEv = Array.isArray(skillEvidence.grammar) ? skillEvidence.grammar : [];
    grammarTotalAttempts += grammarEv.length;
    grammarEv.forEach(e => { if (e && e.recordedAt) grammarDates.push(e.recordedAt); });

    history.filter(h => h && h.type === "grammar").forEach(h => {
      if (h.at) grammarDates.push(h.at);
    });

    const grammarDays = distinctDays(grammarDates);
    const grammarStatus = (grammarTotalAttempts === 0)
      ? "not-started"
      : ((grammarTopicsAttempted >= 2 && grammarTotalAttempts >= 6) || grammarDays >= 2)
        ? "consistent"
        : "practicing";

    const grammarStatusReason = grammarStatus === "not-started"
      ? "Belum ada soal grammar yang dicoba."
      : grammarStatus === "consistent"
        ? "Telah menyelesaikan latihan di minimal 2 topik grammar."
        : "Telah menjawab latihan soal grammar.";

    const grammarAccuracy = grammarTotalAttempts > 0
      ? {
          percentage: Math.round((grammarTotalCorrect / grammarTotalAttempts) * 100),
          correct: grammarTotalCorrect,
          total: grammarTotalAttempts,
          note: "Akurasi soal latihan grammar"
        }
      : null;

    const grammarEntry = {
      id: "grammar",
      title: "Tata Bahasa (Grammar)",
      shortName: "Grammar",
      symbol: "¶",
      status: grammarStatus,
      statusLabel: grammarStatus === "not-started" ? "Belum dimulai" : grammarStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: grammarStatusReason,
      attemptsCount: grammarTotalAttempts,
      completedCount: grammarTopicsAttempted,
      completedLabel: grammarTopicsAttempted + " topik dicoba",
      accuracy: grammarAccuracy,
      accuracyNote: "Dihitung dari jawaban soal topik grammar",
      mastery: null,
      lastPracticedAt: latestDate(grammarDates),
      lastPracticedLabel: formatLastPracticed(latestDate(grammarDates)),
      evidenceDetails: [
        grammarTopicsAttempted + " topik tata bahasa dipraktikkan",
        grammarTotalAttempts + " butir latihan dijawab (" + grammarTotalCorrect + " tepat)",
        grammarDays + " hari aktif tercatat"
      ],
      primaryAction: {
        label: "Pelajari Grammar ↗",
        viewTarget: "grammar"
      }
    };

    // 3. READING
    const readingDates = [];
    let readingCompletedCount = 0;
    let readingAttemptsCount = 0;
    let readingCorrectCount = 0;

    const readingSkills = extraLearning.reading && typeof extraLearning.reading === "object" ? extraLearning.reading : {};
    Object.values(readingSkills).forEach(s => {
      if (!s || typeof s !== "object") return;
      const att = Number(s.attempts) || 0;
      const cor = Number(s.correct) || 0;
      readingAttemptsCount += att;
      readingCorrectCount += cor;
      if (s.completed) readingCompletedCount++;
    });

    Object.values(habitProg).forEach(p => {
      if (!p || typeof p !== "object" || !p.answers) return;
      const answers = Object.values(p.answers);
      answers.forEach(a => {
        if (!a || typeof a !== "object") return;
        readingAttemptsCount++;
        if (a.correct) readingCorrectCount++;
        if (a.answeredAt) readingDates.push(a.answeredAt);
      });
      if (answers.length >= 3) readingCompletedCount++;
    });

    const storyProg = adventureProg.storyProgress && typeof adventureProg.storyProgress === "object" ? adventureProg.storyProgress : {};
    Object.values(storyProg).forEach(s => {
      if (!s || typeof s !== "object") return;
      if (Array.isArray(s.attempts)) {
        s.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          const tot = Number(a.total) || 1;
          const sco = Number(a.score) || 0;
          readingAttemptsCount += tot;
          readingCorrectCount += sco;
          if (a.completedAt) readingDates.push(a.completedAt);
        });
      }
      if (s.completedAt || (Array.isArray(s.attempts) && s.attempts.some(a => a && a.passed))) {
        readingCompletedCount++;
      }
      if (s.updatedAt) readingDates.push(s.updatedAt);
    });

    const readingEv = Array.isArray(skillEvidence.reading) ? skillEvidence.reading : [];
    readingAttemptsCount += readingEv.length;
    readingEv.forEach(e => { if (e && e.recordedAt) readingDates.push(e.recordedAt); });

    history.filter(h => h && h.type === "reading").forEach(h => {
      if (h.at) readingDates.push(h.at);
    });

    const readingDays = distinctDays(readingDates);
    const readingStatus = (readingAttemptsCount === 0 && readingCompletedCount === 0)
      ? "not-started"
      : (readingCompletedCount >= 2 || readingDays >= 2)
        ? "consistent"
        : "practicing";

    const readingStatusReason = readingStatus === "not-started"
      ? "Belum ada bacaan HABIT, skill, atau cerita yang diselesaikan."
      : readingStatus === "consistent"
        ? "Telah menyelesaikan minimal 2 aktivitas bacaan atau berlatih berkala."
        : "Telah memulai latihan pemahaman bacaan.";

    const readingAccuracy = readingAttemptsCount > 0
      ? {
          percentage: Math.round((readingCorrectCount / readingAttemptsCount) * 100),
          correct: readingCorrectCount,
          total: readingAttemptsCount,
          note: "Akurasi soal pemahaman teks (HABIT, Skills, Stories)"
        }
      : null;

    const readingEntry = {
      id: "reading",
      title: "Membaca (Reading)",
      shortName: "Reading",
      symbol: "▤",
      status: readingStatus,
      statusLabel: readingStatus === "not-started" ? "Belum dimulai" : readingStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: readingStatusReason,
      attemptsCount: readingAttemptsCount,
      completedCount: readingCompletedCount,
      completedLabel: readingCompletedCount + " aktivitas bacaan selesai",
      accuracy: readingAccuracy,
      accuracyNote: "Dihitung dari soal pemahaman teks",
      mastery: null,
      lastPracticedAt: latestDate(readingDates),
      lastPracticedLabel: formatLastPracticed(latestDate(readingDates)),
      evidenceDetails: [
        readingCompletedCount + " bacaan selesai (HABIT, Stories, Reading Skills)",
        readingAttemptsCount + " butir pemahaman dijawab (" + readingCorrectCount + " tepat)",
        readingDays + " hari aktif tercatat"
      ],
      primaryAction: {
        label: "Buka Bacaan ↗",
        viewTarget: "reading"
      }
    };

    // 4. LISTENING
    const listeningDates = [];
    let listeningCompletedCount = 0;
    let listeningAttemptsCount = 0;
    let listeningTotalScore = 0;
    let listeningTotalPossible = 0;

    const listeningProg = adventureProg.listeningProgress && typeof adventureProg.listeningProgress === "object" ? adventureProg.listeningProgress : {};
    Object.values(listeningProg).forEach(e => {
      if (!e || typeof e !== "object") return;
      if (Array.isArray(e.attempts)) {
        e.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          listeningAttemptsCount++;
          listeningTotalScore += (Number(a.score) || 0);
          listeningTotalPossible += (Number(a.total) || 0);
          if (a.completedAt) listeningDates.push(a.completedAt);
        });
      }
      if (e.completedAt || (Array.isArray(e.attempts) && e.attempts.some(a => a && a.passed))) {
        listeningCompletedCount++;
      }
      if (e.updatedAt) listeningDates.push(e.updatedAt);
    });

    const listeningEv = Array.isArray(skillEvidence.listening) ? skillEvidence.listening : [];
    listeningAttemptsCount += listeningEv.length;
    listeningEv.forEach(ev => { if (ev && ev.recordedAt) listeningDates.push(ev.recordedAt); });

    const listeningDays = distinctDays(listeningDates);
    const listeningStatus = (listeningAttemptsCount === 0 && listeningCompletedCount === 0)
      ? "not-started"
      : (listeningCompletedCount >= 2 || listeningDays >= 2)
        ? "consistent"
        : "practicing";

    const listeningStatusReason = listeningStatus === "not-started"
      ? "Belum ada latihan Listening Lab atau audio yang dicoba."
      : listeningStatus === "consistent"
        ? "Telah menyelesaikan minimal 2 latihan Listening Lab."
        : "Telah mencoba latihan menyimak.";

    const listeningAccuracy = listeningTotalPossible > 0
      ? {
          percentage: Math.round((listeningTotalScore / listeningTotalPossible) * 100),
          correct: listeningTotalScore,
          total: listeningTotalPossible,
          note: "Akurasi tahap Listening Lab"
        }
      : null;

    const listeningEntry = {
      id: "listening",
      title: "Menyimak (Listening)",
      shortName: "Listening",
      symbol: ")))",
      status: listeningStatus,
      statusLabel: listeningStatus === "not-started" ? "Belum dimulai" : listeningStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: listeningStatusReason,
      attemptsCount: listeningAttemptsCount,
      completedCount: listeningCompletedCount,
      completedLabel: listeningCompletedCount + " latihan audio selesai",
      accuracy: listeningAccuracy,
      accuracyNote: "Dihitung dari soal Listening Lab",
      mastery: null,
      lastPracticedAt: latestDate(listeningDates),
      lastPracticedLabel: formatLastPracticed(latestDate(listeningDates)),
      evidenceDetails: [
        listeningCompletedCount + " latihan Listening Lab selesai",
        listeningAttemptsCount + " percobaan menyimak tercatat",
        listeningDays + " hari aktif tercatat"
      ],
      primaryAction: {
        label: "Buka Listening Lab ↗",
        viewTarget: "listening"
      }
    };

    // 5. SPEAKING
    const speakingDates = [];
    let speakingCompletedCount = 0;
    let speakingAttemptsCount = 0;
    let speakingChecklistTotal = 0;

    const speakingSessions = studioSessions.filter(s => s && s.studioType === "speaking");
    speakingSessions.forEach(s => {
      speakingAttemptsCount++;
      speakingCompletedCount++;
      speakingChecklistTotal += (Number(s.checklistCompleted) || 0);
      if (s.completedAt) speakingDates.push(s.completedAt);
      if (s.updatedAt) speakingDates.push(s.updatedAt);
    });

    const dialogueProg = adventureProg.dialogueProgress && typeof adventureProg.dialogueProgress === "object" ? adventureProg.dialogueProgress : {};
    Object.values(dialogueProg).forEach(d => {
      if (!d || typeof d !== "object") return;
      if (Array.isArray(d.attempts)) {
        d.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          speakingAttemptsCount++;
          if (a.completedAt) speakingDates.push(a.completedAt);
        });
      }
      if (d.completedAt || (Array.isArray(d.attempts) && d.attempts.some(a => a && a.passed))) {
        speakingCompletedCount++;
      }
      if (d.updatedAt) speakingDates.push(d.updatedAt);
    });

    const speakingEv = Array.isArray(skillEvidence.speaking) ? skillEvidence.speaking : [];
    speakingAttemptsCount += speakingEv.length;
    speakingEv.forEach(ev => { if (ev && ev.recordedAt) speakingDates.push(ev.recordedAt); });

    const speakingDays = distinctDays(speakingDates);
    const speakingStatus = (speakingAttemptsCount === 0 && speakingCompletedCount === 0)
      ? "not-started"
      : (speakingCompletedCount >= 2 || speakingDays >= 2)
        ? "consistent"
        : "practicing";

    const speakingStatusReason = speakingStatus === "not-started"
      ? "Belum ada sesi Speaking Studio atau percakapan yang dicoba."
      : speakingStatus === "consistent"
        ? "Telah menyelesaikan minimal 2 sesi berbicara atau percakapan."
        : "Telah mencoba sesi berbicara/roleplay.";

    const speakingEntry = {
      id: "speaking",
      title: "Berbicara (Speaking)",
      shortName: "Speaking",
      symbol: "↗",
      status: speakingStatus,
      statusLabel: speakingStatus === "not-started" ? "Belum dimulai" : speakingStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: speakingStatusReason,
      attemptsCount: speakingAttemptsCount,
      completedCount: speakingCompletedCount,
      completedLabel: speakingCompletedCount + " sesi berbicara selesai",
      accuracy: null,
      accuracyNote: "Evaluasi refleksi mandiri, tanpa skor otomatis",
      mastery: null,
      lastPracticedAt: latestDate(speakingDates),
      lastPracticedLabel: formatLastPracticed(latestDate(speakingDates)),
      evidenceDetails: [
        speakingSessions.length + " sesi Speaking Studio mandiri",
        speakingChecklistTotal + " kriteria checklist self-review terpenuhi",
        speakingDays + " hari aktif tercatat"
      ],
      primaryAction: {
        label: "Buka Speaking Studio ↗",
        viewTarget: "speaking"
      }
    };

    // 6. WRITING
    const writingDates = [];
    let writingCompletedCount = 0;
    let writingAttemptsCount = 0;
    let writingWordsTotal = 0;
    let writingChecklistTotal = 0;

    const writingSessions = studioSessions.filter(s => s && s.studioType === "writing");
    writingSessions.forEach(s => {
      writingAttemptsCount++;
      writingCompletedCount++;
      writingWordsTotal += (Number(s.wordCount) || 0);
      writingChecklistTotal += (Number(s.checklistCompleted) || 0);
      if (s.completedAt) writingDates.push(s.completedAt);
      if (s.updatedAt) writingDates.push(s.updatedAt);
    });

    const writingEv = Array.isArray(skillEvidence.writing) ? skillEvidence.writing : [];
    writingAttemptsCount += writingEv.length;
    writingEv.forEach(ev => { if (ev && ev.recordedAt) writingDates.push(ev.recordedAt); });

    const writingDays = distinctDays(writingDates);
    const writingStatus = (writingAttemptsCount === 0 && writingCompletedCount === 0)
      ? "not-started"
      : (writingCompletedCount >= 2 || writingDays >= 2)
        ? "consistent"
        : "practicing";

    const writingStatusReason = writingStatus === "not-started"
      ? "Belum ada sesi Writing Studio yang diselesaikan."
      : writingStatus === "consistent"
        ? "Telah menyelesaikan minimal 2 sesi menulis dengan refleksi."
        : "Telah membuat draft tulisan dan refleksi awal.";

    const writingEntry = {
      id: "writing",
      title: "Menulis (Writing)",
      shortName: "Writing",
      symbol: "✎",
      status: writingStatus,
      statusLabel: writingStatus === "not-started" ? "Belum dimulai" : writingStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: writingStatusReason,
      attemptsCount: writingAttemptsCount,
      completedCount: writingCompletedCount,
      completedLabel: writingCompletedCount + " sesi tulisan selesai",
      accuracy: null,
      accuracyNote: "Evaluasi refleksi mandiri, tanpa skor otomatis",
      mastery: null,
      lastPracticedAt: latestDate(writingDates),
      lastPracticedLabel: formatLastPracticed(latestDate(writingDates)),
      evidenceDetails: [
        writingSessions.length + " sesi Writing Studio selesai",
        writingWordsTotal + " kata disusun dalam sesi tersimpan",
        writingChecklistTotal + " kriteria checklist self-review terpenuhi"
      ],
      primaryAction: {
        label: "Buka Writing Studio ↗",
        viewTarget: "writing"
      }
    };

    // 7. PRONUNCIATION
    const pronDates = [];
    let pronPhrasesPracticed = 0;
    let pronTotalAttempts = 0;
    let pronTotalDurationMs = 0;

    const pronProg = adventureProg.pronunciationProgress && typeof adventureProg.pronunciationProgress === "object" ? adventureProg.pronunciationProgress : {};
    Object.values(pronProg).forEach(p => {
      if (!p || typeof p !== "object") return;
      const attempts = Array.isArray(p.attempts) ? p.attempts : [];
      if (attempts.length > 0) pronPhrasesPracticed++;
      attempts.forEach(a => {
        if (!a || typeof a !== "object") return;
        pronTotalAttempts++;
        pronTotalDurationMs += (Number(a.durationMs) || 0);
        if (a.completedAt) pronDates.push(a.completedAt);
      });
      if (p.updatedAt) pronDates.push(p.updatedAt);
    });

    const pronDays = distinctDays(pronDates);
    const pronStatus = (pronTotalAttempts === 0)
      ? "not-started"
      : (pronPhrasesPracticed >= 3 || pronTotalAttempts >= 5 || pronDays >= 2)
        ? "consistent"
        : "practicing";

    const pronStatusReason = pronStatus === "not-started"
      ? "Belum ada rekaman artikulasi frasa yang dicatat."
      : pronStatus === "consistent"
        ? "Telah melatih ≥3 frasa pengucapan secara berkala."
        : "Telah merekam latihan artikulasi frasa.";

    const pronSeconds = Math.round(pronTotalDurationMs / 1000);
    const pronDurationFormatted = pronSeconds >= 60
      ? (Math.floor(pronSeconds / 60) + " m " + (pronSeconds % 60) + " d")
      : (pronSeconds + " detik");

    const pronEntry = {
      id: "pronunciation",
      title: "Pengucapan (Pronunciation)",
      shortName: "Pronunciation",
      symbol: "Pr",
      status: pronStatus,
      statusLabel: pronStatus === "not-started" ? "Belum dimulai" : pronStatus === "consistent" ? "Konsisten" : "Sedang berlatih",
      statusReason: pronStatusReason,
      attemptsCount: pronTotalAttempts,
      completedCount: pronPhrasesPracticed,
      completedLabel: pronPhrasesPracticed + " frasa dipraktikkan",
      accuracy: null,
      accuracyNote: "Analisis audio lokal, tanpa skor persentase otomatis",
      mastery: null,
      lastPracticedAt: latestDate(pronDates),
      lastPracticedLabel: formatLastPracticed(latestDate(pronDates)),
      evidenceDetails: [
        pronPhrasesPracticed + " frasa pengucapan dicoba",
        pronTotalAttempts + " rekaman latihan artikulasi (" + pronDurationFormatted + " total rekaman)",
        pronDays + " hari aktif tercatat"
      ],
      primaryAction: {
        label: "Buka Pronunciation Studio ↗",
        viewTarget: "pronunciation"
      }
    };

    const skills = [vocabEntry, grammarEntry, readingEntry, listeningEntry, speakingEntry, writingEntry, pronEntry];

    // Compute Overall Insight
    const activeSkills = skills.filter(s => s.status !== "not-started" || s.attemptsCount > 0 || s.completedCount > 0);
    let insight = null;

    if (activeSkills.length === 0) {
      insight = {
        emptyState: true,
        mostPracticed: null,
        leastPracticed: null,
        insufficientDataReason: null,
        nextAction: {
          text: "Mulai sesi kosakata pertamamu untuk meletakkan fondasi kata dasar dalam konteks.",
          target: "vocabulary",
          label: "Mulai Kosakata ↗"
        }
      };
    } else if (activeSkills.length === 1) {
      const active = activeSkills[0];
      const nextSkill = skills.find(s => s.id !== active.id && s.id !== "pronunciation") || skills[1];
      insight = {
        emptyState: false,
        mostPracticed: {
          name: active.title,
          detail: active.completedLabel + " · " + active.attemptsCount + " percobaan"
        },
        leastPracticed: null,
        insufficientDataReason: "Data perbandingan belum cukup: baru 1 dari 7 keterampilan yang aktif. Latih minimal satu keterampilan lain (misalnya Grammar atau Bacaan) untuk melihat peta keseimbangan belajar.",
        nextAction: {
          text: "Seimbangkan latihanmu dengan mulai mempelajari " + nextSkill.shortName + ".",
          target: nextSkill.primaryAction.viewTarget,
          label: nextSkill.primaryAction.label
        }
      };
    } else {
      const sorted = activeSkills.slice().sort((a, b) => {
        const scoreA = a.completedCount * 3 + a.attemptsCount;
        const scoreB = b.completedCount * 3 + b.attemptsCount;
        return scoreB - scoreA;
      });
      const top = sorted[0];
      const least = sorted[sorted.length - 1];

      let nextAction = null;
      const dueCount = typeof dueWords === "function" ? dueWords().length : 0;
      if (dueCount > 0) {
        nextAction = {
          text: "Ada " + dueCount + " kata yang jatuh tempo untuk direview hari ini agar retensi memori tetap kuat.",
          target: "review",
          label: "Mulai Review ↗"
        };
      } else {
        const unstarted = skills.find(s => s.status === "not-started");
        if (unstarted) {
          nextAction = {
            text: "Coba keterampilan " + unstarted.shortName + " untuk memperluas variasi kemampuan komunikasimu.",
            target: unstarted.primaryAction.viewTarget,
            label: unstarted.primaryAction.label
          };
        } else {
          nextAction = {
            text: "Fokuskan latihan berikutnya pada " + least.shortName + " agar perkembangan belajarmu merata di semua aspek.",
            target: least.primaryAction.viewTarget,
            label: least.primaryAction.label
          };
        }
      }

      insight = {
        emptyState: false,
        mostPracticed: {
          name: top.title,
          detail: top.completedLabel + " · " + top.attemptsCount + " percobaan"
        },
        leastPracticed: {
          name: least.title,
          detail: least.completedLabel + " · " + least.attemptsCount + " percobaan"
        },
        insufficientDataReason: null,
        nextAction: nextAction
      };
    }

    return {
      skills,
      insight,
      totalActiveSkills: activeSkills.length,
      updatedAt: new Date().toISOString()
    };
  }

  function computeWeeklyInsights(currentState, extras = {}, allWords = [], allTopics = [], refDate = new Date()) {
    const ref = (refDate instanceof Date && !isNaN(refDate.getTime())) ? refDate : (typeof refDate === "string" && !isNaN(new Date(refDate).getTime())) ? new Date(refDate) : new Date();
    const st = currentState || {};
    const extraLearning = extras.extraLearning || {};
    const habitProg = extras.habitProgress || {};
    const adventureProg = extras.adventureProgress || {};
    const studioSessions = Array.isArray(adventureProg.studioSessions) ? adventureProg.studioSessions : [];
    const skillEvidence = adventureProg.skillEvidence && typeof adventureProg.skillEvidence === "object" ? adventureProg.skillEvidence : {};
    const mistakeJournal = adventureProg.mistakeJournal && typeof adventureProg.mistakeJournal === "object" ? adventureProg.mistakeJournal : {};

    function toDayKey(val) {
      if (!val) return null;
      if (typeof val === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
      }
      if (typeof val === "number") {
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
      }
      if (val instanceof Date && !isNaN(val.getTime())) {
        return [val.getFullYear(), String(val.getMonth() + 1).padStart(2, "0"), String(val.getDate()).padStart(2, "0")].join("-");
      }
      return null;
    }

    // Build rolling 7-day windows
    const currentDayKeys = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ref.getTime() - i * 86400000);
      currentDayKeys.push(toDayKey(d));
    }
    const prevDayKeys = [];
    for (let i = 7; i < 14; i++) {
      const d = new Date(ref.getTime() - i * 86400000);
      prevDayKeys.push(toDayKey(d));
    }
    const currentSet = new Set(currentDayKeys.filter(Boolean));
    const prevSet = new Set(prevDayKeys.filter(Boolean));

    function createPeriodBucket() {
      return {
        activeDays: new Set(),
        totalActivities: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        skills: {
          vocabulary: { id: "vocabulary", name: "Kosakata", symbol: "Aa", completed: 0, attempts: 0, correct: 0, questionTotal: 0, accuracy: null, target: "vocabulary" },
          grammar: { id: "grammar", name: "Tata Bahasa", symbol: "¶", completed: 0, attempts: 0, correct: 0, questionTotal: 0, accuracy: null, target: "grammar" },
          reading: { id: "reading", name: "Membaca", symbol: "▤", completed: 0, attempts: 0, correct: 0, questionTotal: 0, accuracy: null, target: "reading" },
          listening: { id: "listening", name: "Menyimak", symbol: ")))", completed: 0, attempts: 0, correct: 0, questionTotal: 0, accuracy: null, target: "adventure", sectionId: "adventure-listening-lab" },
          speaking: { id: "speaking", name: "Berbicara", symbol: "↗", completed: 0, attempts: 0, correct: null, questionTotal: 0, accuracy: null, target: "adventure", sectionId: "adventure-speaking-studio" },
          writing: { id: "writing", name: "Menulis", symbol: "✎", completed: 0, attempts: 0, correct: null, questionTotal: 0, accuracy: null, target: "adventure", sectionId: "adventure-writing-studio" },
          pronunciation: { id: "pronunciation", name: "Pengucapan", symbol: "Pr", completed: 0, attempts: 0, correct: null, questionTotal: 0, accuracy: null, target: "adventure", sectionId: "adventure-pronunciation-studio" }
        },
        reviews: {
          vocabReviews: 0,
          vocabReviewsCorrect: 0,
          mistakeReviews: 0,
          mistakesResolved: 0,
          totalReviews: 0
        }
      };
    }

    const current = createPeriodBucket();
    const previous = createPeriodBucket();

    // 1. Vocabulary
    const wordProgress = st.wordProgress && typeof st.wordProgress === "object" ? st.wordProgress : {};
    Object.values(wordProgress).forEach(p => {
      if (!p || typeof p !== "object") return;
      if (Array.isArray(p.attempts)) {
        p.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          const k = toDayKey(a.at || a.date);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.vocabulary.attempts++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.vocabulary.attempts++;
          }
        });
      }
      if (Array.isArray(p.reviewHistory)) {
        p.reviewHistory.forEach(r => {
          if (!r || typeof r !== "object") return;
          const k = toDayKey(r.at || r.date);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.vocabulary.attempts++;
            current.skills.vocabulary.questionTotal++;
            current.totalQuestions++;
            current.reviews.vocabReviews++;
            if (r.correct) {
              current.skills.vocabulary.correct++;
              current.totalCorrect++;
              current.reviews.vocabReviewsCorrect++;
            }
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.vocabulary.attempts++;
            previous.skills.vocabulary.questionTotal++;
            previous.totalQuestions++;
            previous.reviews.vocabReviews++;
            if (r.correct) {
              previous.skills.vocabulary.correct++;
              previous.totalCorrect++;
              previous.reviews.vocabReviewsCorrect++;
            }
          }
        });
      }
      if (Array.isArray(p.studiedDates)) {
        p.studiedDates.forEach(d => {
          const k = toDayKey(d);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.vocabulary.completed++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.vocabulary.completed++;
          }
        });
      }
    });

    // 2. Grammar
    const grammarProg = st.grammarProgress && typeof st.grammarProgress === "object" ? st.grammarProgress : {};
    const currGrammarTopics = new Set();
    const prevGrammarTopics = new Set();
    Object.keys(grammarProg).forEach(topicId => {
      const p = grammarProg[topicId];
      if (!p || typeof p !== "object") return;
      if (p.answers && typeof p.answers === "object") {
        Object.values(p.answers).forEach(a => {
          if (!a || typeof a !== "object") return;
          const k = toDayKey(a.at);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.grammar.attempts++;
            current.skills.grammar.questionTotal++;
            current.totalQuestions++;
            currGrammarTopics.add(topicId);
            if (a.correct) {
              current.skills.grammar.correct++;
              current.totalCorrect++;
            }
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.grammar.attempts++;
            previous.skills.grammar.questionTotal++;
            previous.totalQuestions++;
            prevGrammarTopics.add(topicId);
            if (a.correct) {
              previous.skills.grammar.correct++;
              previous.totalCorrect++;
            }
          }
        });
      }
      if (Array.isArray(p.history)) {
        p.history.forEach(h => {
          if (!h || typeof h !== "object") return;
          const k = toDayKey(h.at);
          if (currentSet.has(k)) current.activeDays.add(k);
          else if (prevSet.has(k)) previous.activeDays.add(k);
        });
      }
    });
    current.skills.grammar.completed = currGrammarTopics.size;
    previous.skills.grammar.completed = prevGrammarTopics.size;

    // 3. Reading
    Object.values(habitProg).forEach(p => {
      if (!p || typeof p !== "object" || !p.answers) return;
      let currAnswers = 0;
      let prevAnswers = 0;
      Object.values(p.answers).forEach(a => {
        if (!a || typeof a !== "object") return;
        const k = toDayKey(a.answeredAt);
        if (currentSet.has(k)) {
          current.activeDays.add(k);
          current.skills.reading.attempts++;
          current.skills.reading.questionTotal++;
          current.totalQuestions++;
          currAnswers++;
          if (a.correct) {
            current.skills.reading.correct++;
            current.totalCorrect++;
          }
        } else if (prevSet.has(k)) {
          previous.activeDays.add(k);
          previous.skills.reading.attempts++;
          previous.skills.reading.questionTotal++;
          previous.totalQuestions++;
          prevAnswers++;
          if (a.correct) {
            previous.skills.reading.correct++;
            previous.totalCorrect++;
          }
        }
      });
      if (currAnswers >= 3) current.skills.reading.completed++;
      if (prevAnswers >= 3) previous.skills.reading.completed++;
    });

    const storyProg = adventureProg.storyProgress && typeof adventureProg.storyProgress === "object" ? adventureProg.storyProgress : {};
    Object.values(storyProg).forEach(s => {
      if (!s || typeof s !== "object") return;
      if (Array.isArray(s.attempts)) {
        s.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          const k = toDayKey(a.completedAt);
          const tot = Number(a.total) || 1;
          const sco = Number(a.score) || 0;
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.reading.attempts += tot;
            current.skills.reading.questionTotal += tot;
            current.totalQuestions += tot;
            current.skills.reading.correct += sco;
            current.totalCorrect += sco;
            if (a.passed) current.skills.reading.completed++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.reading.attempts += tot;
            previous.skills.reading.questionTotal += tot;
            previous.totalQuestions += tot;
            previous.skills.reading.correct += sco;
            previous.totalCorrect += sco;
            if (a.passed) previous.skills.reading.completed++;
          }
        });
      }
    });

    const readingSkills = extraLearning.reading && typeof extraLearning.reading === "object" ? extraLearning.reading : {};
    Object.values(readingSkills).forEach(r => {
      if (!r || typeof r !== "object") return;
      const k = toDayKey(r.lastAttempt);
      const att = Number(r.attempts) || 0;
      const cor = Number(r.correct) || 0;
      if (currentSet.has(k)) {
        current.activeDays.add(k);
        if (r.completed) current.skills.reading.completed++;
        current.skills.reading.attempts += att;
        current.skills.reading.questionTotal += att;
        current.totalQuestions += att;
        current.skills.reading.correct += cor;
        current.totalCorrect += cor;
      } else if (prevSet.has(k)) {
        previous.activeDays.add(k);
        if (r.completed) previous.skills.reading.completed++;
        previous.skills.reading.attempts += att;
        previous.skills.reading.questionTotal += att;
        previous.totalQuestions += att;
        previous.skills.reading.correct += cor;
        previous.totalCorrect += cor;
      }
    });

    // 4. Listening
    const listeningProg = adventureProg.listeningProgress && typeof adventureProg.listeningProgress === "object" ? adventureProg.listeningProgress : {};
    Object.values(listeningProg).forEach(e => {
      if (!e || typeof e !== "object") return;
      if (Array.isArray(e.attempts)) {
        e.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          const k = toDayKey(a.completedAt);
          const tot = Number(a.total) || 1;
          const sco = Number(a.score) || 0;
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.listening.attempts += tot;
            current.skills.listening.questionTotal += tot;
            current.totalQuestions += tot;
            current.skills.listening.correct += sco;
            current.totalCorrect += sco;
            if (a.passed) current.skills.listening.completed++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.listening.attempts += tot;
            previous.skills.listening.questionTotal += tot;
            previous.totalQuestions += tot;
            previous.skills.listening.correct += sco;
            previous.totalCorrect += sco;
            if (a.passed) previous.skills.listening.completed++;
          }
        });
      }
    });

    // 5. Speaking
    studioSessions.filter(s => s && s.studioType === "speaking").forEach(s => {
      const k = toDayKey(s.completedAt || s.updatedAt);
      if (currentSet.has(k)) {
        current.activeDays.add(k);
        current.skills.speaking.completed++;
        current.skills.speaking.attempts++;
      } else if (prevSet.has(k)) {
        previous.activeDays.add(k);
        previous.skills.speaking.completed++;
        previous.skills.speaking.attempts++;
      }
    });
    const dialogueProg = adventureProg.dialogueProgress && typeof adventureProg.dialogueProgress === "object" ? adventureProg.dialogueProgress : {};
    Object.values(dialogueProg).forEach(d => {
      if (!d || typeof d !== "object") return;
      if (Array.isArray(d.attempts)) {
        d.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          const k = toDayKey(a.completedAt);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.speaking.attempts++;
            if (a.passed) current.skills.speaking.completed++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.speaking.attempts++;
            if (a.passed) previous.skills.speaking.completed++;
          }
        });
      }
    });

    // 6. Writing
    studioSessions.filter(s => s && s.studioType === "writing").forEach(s => {
      const k = toDayKey(s.completedAt || s.updatedAt);
      if (currentSet.has(k)) {
        current.activeDays.add(k);
        current.skills.writing.completed++;
        current.skills.writing.attempts++;
      } else if (prevSet.has(k)) {
        previous.activeDays.add(k);
        previous.skills.writing.completed++;
        previous.skills.writing.attempts++;
      }
    });

    // 7. Pronunciation
    const pronProg = adventureProg.pronunciationProgress && typeof adventureProg.pronunciationProgress === "object" ? adventureProg.pronunciationProgress : {};
    Object.values(pronProg).forEach(p => {
      if (!p || typeof p !== "object") return;
      if (Array.isArray(p.attempts)) {
        let currPhraseAtt = 0;
        let prevPhraseAtt = 0;
        p.attempts.forEach(a => {
          if (!a || typeof a !== "object") return;
          const k = toDayKey(a.completedAt);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.skills.pronunciation.attempts++;
            currPhraseAtt++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.skills.pronunciation.attempts++;
            prevPhraseAtt++;
          }
        });
        if (currPhraseAtt > 0) current.skills.pronunciation.completed++;
        if (prevPhraseAtt > 0) previous.skills.pronunciation.completed++;
      }
    });

    // 8. Mistake Journal Retrieval Reviews
    Object.values(mistakeJournal).forEach(m => {
      if (!m || typeof m !== "object") return;
      if (Array.isArray(m.reviewHistory)) {
        m.reviewHistory.forEach(h => {
          if (!h || typeof h !== "object") return;
          const k = toDayKey(h.reviewedAt);
          if (currentSet.has(k)) {
            current.activeDays.add(k);
            current.reviews.mistakeReviews++;
            if (h.correct) current.reviews.mistakesResolved++;
          } else if (prevSet.has(k)) {
            previous.activeDays.add(k);
            previous.reviews.mistakeReviews++;
            if (h.correct) previous.reviews.mistakesResolved++;
          }
        });
      }
    });

    // History and Events scan for active days
    if (Array.isArray(st.history)) {
      st.history.forEach(h => {
        if (!h || typeof h !== "object") return;
        const k = toDayKey(h.at || h.date);
        if (currentSet.has(k)) current.activeDays.add(k);
        else if (prevSet.has(k)) previous.activeDays.add(k);
      });
    }

    // Totals
    current.activeDaysCount = current.activeDays.size;
    previous.activeDaysCount = previous.activeDays.size;
    current.activeDaysList = Array.from(current.activeDays);
    previous.activeDaysList = Array.from(previous.activeDays);
    current.totalActivities = Object.values(current.skills).reduce((acc, s) => acc + s.completed, 0);
    previous.totalActivities = Object.values(previous.skills).reduce((acc, s) => acc + s.completed, 0);
    current.reviews.totalReviews = current.reviews.vocabReviews + current.reviews.mistakeReviews;
    previous.reviews.totalReviews = previous.reviews.vocabReviews + previous.reviews.mistakeReviews;

    // Per-skill accuracy calculations
    Object.values(current.skills).forEach(s => {
      if (s.questionTotal > 0) {
        s.accuracy = {
          percentage: Math.round((s.correct / s.questionTotal) * 100),
          correct: s.correct,
          total: s.questionTotal
        };
      }
    });
    Object.values(previous.skills).forEach(s => {
      if (s.questionTotal > 0) {
        s.accuracy = {
          percentage: Math.round((s.correct / s.questionTotal) * 100),
          correct: s.correct,
          total: s.questionTotal
        };
      }
    });

    if (current.totalQuestions > 0) {
      current.accuracy = {
        percentage: Math.round((current.totalCorrect / current.totalQuestions) * 100),
        correct: current.totalCorrect,
        total: current.totalQuestions
      };
    } else {
      current.accuracy = null;
    }

    if (previous.totalQuestions > 0) {
      previous.accuracy = {
        percentage: Math.round((previous.totalCorrect / previous.totalQuestions) * 100),
        correct: previous.totalCorrect,
        total: previous.totalQuestions
      };
    } else {
      previous.accuracy = null;
    }

    const currentStartDate = new Date(ref.getTime() - 6 * 86400000);
    const prevStartDate = new Date(ref.getTime() - 13 * 86400000);
    const prevEndDate = new Date(ref.getTime() - 7 * 86400000);

    const currentRangeLabel = fmtDate(currentStartDate, { day: "2-digit", month: "short" }) + " – " + fmtDate(ref, { day: "2-digit", month: "short", year: "numeric" });
    const prevRangeLabel = fmtDate(prevStartDate, { day: "2-digit", month: "short" }) + " – " + fmtDate(prevEndDate, { day: "2-digit", month: "short", year: "numeric" });

    current.dateRangeLabel = currentRangeLabel;
    previous.dateRangeLabel = prevRangeLabel;

    const activeDaysDiff = current.activeDays.size - previous.activeDays.size;
    let activeDaysComparison = "";
    if (previous.activeDays.size === 0) {
      activeDaysComparison = current.activeDays.size > 0 ? (current.activeDays.size + " hari aktif (minggu sebelumnya belum ada)") : "Belum aktif";
    } else if (activeDaysDiff > 0) {
      activeDaysComparison = "+" + activeDaysDiff + " hari dibanding minggu lalu";
    } else if (activeDaysDiff < 0) {
      activeDaysComparison = activeDaysDiff + " hari dibanding minggu lalu";
    } else {
      activeDaysComparison = "Sama seperti minggu lalu";
    }

    const activitiesDiff = current.totalActivities - previous.totalActivities;
    let activitiesComparison = "";
    if (previous.totalActivities === 0) {
      activitiesComparison = current.totalActivities > 0 ? (current.totalActivities + " selesai (minggu sebelumnya belum ada)") : "Belum ada aktivitas";
    } else if (activitiesDiff > 0) {
      activitiesComparison = "+" + activitiesDiff + " aktivitas dibanding minggu lalu";
    } else if (activitiesDiff < 0) {
      activitiesComparison = activitiesDiff + " aktivitas dibanding minggu lalu";
    } else {
      activitiesComparison = "Sama seperti minggu lalu";
    }

    const hasFairAccuracyComparison = current.totalQuestions >= 5 && previous.totalQuestions >= 5;
    let accuracyComparison = "";
    if (hasFairAccuracyComparison) {
      const diff = current.accuracy.percentage - previous.accuracy.percentage;
      accuracyComparison = (diff >= 0 ? "+" : "") + diff + "% (" + current.accuracy.percentage + "% vs " + previous.accuracy.percentage + "%)";
    } else if (current.totalQuestions >= 5) {
      accuracyComparison = current.accuracy.percentage + "% (" + current.totalCorrect + "/" + current.totalQuestions + " soal tepat)";
    } else if (current.totalQuestions > 0) {
      accuracyComparison = current.totalCorrect + "/" + current.totalQuestions + " soal tepat (data belum cukup untuk tren)";
    } else {
      accuracyComparison = "Belum ada butir soal objektif";
    }

    const emptyState = current.activeDays.size === 0 && current.totalActivities === 0;
    const singleDayState = current.activeDays.size === 1;

    let narrative = "";
    if (emptyState) {
      narrative = "Belum ada aktivitas belajar dalam 7 hari terakhir.";
    } else if (singleDayState) {
      narrative = "Kamu aktif belajar di 1 hari minggu ini dengan " + current.totalActivities + " aktivitas selesai. Teruskan ritmemu agar tren mingguan dapat dipantau secara adil.";
    } else {
      const practicedSkillCount = Object.values(current.skills).filter(s => s.completed > 0 || s.attempts > 0).length;
      narrative = "Kamu aktif berlatih di " + current.activeDays.size + " dari 7 hari dengan " + current.totalActivities + " aktivitas selesai di " + practicedSkillCount + " keterampilan berbeda.";
    }

    let mostPracticed = null;
    let leastPracticed = null;

    if (!emptyState) {
      const activeSkillList = Object.values(current.skills).filter(s => s.completed > 0 || s.attempts > 0);
      if (activeSkillList.length > 0) {
        activeSkillList.sort((a, b) => (b.completed * 2 + b.attempts) - (a.completed * 2 + a.attempts));
        const top = activeSkillList[0];
        mostPracticed = {
          id: top.id,
          name: top.name,
          symbol: top.symbol,
          count: top.completed,
          attempts: top.attempts,
          detail: top.completed + " aktivitas selesai · " + top.attempts + " percobaan"
        };
      }

      const unpracticedSkills = Object.values(current.skills).filter(s => s.completed === 0 && s.attempts === 0);
      if (unpracticedSkills.length > 0) {
        const lp = unpracticedSkills[0];
        leastPracticed = {
          id: lp.id,
          name: lp.name,
          symbol: lp.symbol,
          count: 0,
          attempts: 0,
          detail: "Belum dilatih dalam 7 hari terakhir",
          isUnpracticed: true,
          target: lp.target,
          sectionId: lp.sectionId
        };
      } else if (activeSkillList.length > 1) {
        const lp = activeSkillList[activeSkillList.length - 1];
        leastPracticed = {
          id: lp.id,
          name: lp.name,
          symbol: lp.symbol,
          count: lp.completed,
          attempts: lp.attempts,
          detail: lp.completed + " aktivitas selesai",
          isUnpracticed: false,
          target: lp.target,
          sectionId: lp.sectionId
        };
      }
    }

    const recommendations = [];
    const dueCount = typeof dueWords === "function" ? dueWords().length : 0;
    const mistakeCount = Object.values(mistakeJournal).filter(m => {
      if (!m || typeof m !== "object") return false;
      if (typeof window.sinauuIsMistakeDue === "function") return window.sinauuIsMistakeDue(m);
      return m.nextReviewAt && new Date(m.nextReviewAt).getTime() <= ref.getTime();
    }).length;

    if (dueCount > 0 || mistakeCount > 0) {
      const totalDue = dueCount + mistakeCount;
      recommendations.push({
        id: "rec-review",
        title: "Tuntaskan " + totalDue + " Materi di Review Queue",
        desc: "Terdapat materi kosakata dan pengulangan kesalahan yang sudah jatuh tempo. Menyelesaikannya menjaga retensi memori jangka panjang.",
        actionLabel: "Buka Review Queue ↗",
        target: "review"
      });
    }

    if (leastPracticed && leastPracticed.isUnpracticed && recommendations.length < 2) {
      let viewTarget = leastPracticed.target || "vocabulary";
      recommendations.push({
        id: "rec-neglected",
        title: "Beri Perhatian pada " + leastPracticed.name,
        desc: "Keterampilan " + leastPracticed.name + " belum sempat dilatih dalam 7 hari terakhir. Melatihnya minggu depan menjaga keseimbangan belajar.",
        actionLabel: "Latih " + leastPracticed.name + " ↗",
        target: viewTarget,
        sectionId: leastPracticed.sectionId
      });
    }

    if (recommendations.length < 2) {
      recommendations.push({
        id: "rec-continue",
        title: "Lanjutkan Materi Baru di Petualangan",
        desc: "Ritme belajarmu stabil. Teruskan dengan menyelesaikan tantangan Daily Quest atau pelajari kata baru di korpus.",
        actionLabel: "Buka Petualangan ↗",
        target: "adventure"
      });
    }

    return {
      emptyState,
      singleDayState,
      current,
      previous,
      comparisons: {
        activeDaysDiff,
        activeDaysComparison,
        activitiesDiff,
        activitiesComparison,
        hasFairAccuracyComparison,
        accuracyComparison
      },
      narrative,
      mostPracticed,
      leastPracticed,
      recommendations
    };
  }

  function renderWeeklyInsights() {
    const cardEl = $("#weekly-insights-card");
    if (!cardEl) return;
    const extras = readExtraSnapshots();
    const weekly = computeWeeklyInsights(state, extras, words, topics);
    window.sinauuWeeklyInsightsData = weekly;

    if (weekly.emptyState) {
      cardEl.innerHTML = '<div class="weekly-empty-state">' +
        '<div class="weekly-empty-copy">' +
          '<span class="weekly-empty-kicker">BELUM ADA AKTIVITAS MINGGUAN</span>' +
          '<h3>Belum ada aktivitas belajar dalam 7 hari terakhir.</h3>' +
          '<p>Begitu kamu menyelesaikan sesi kosakata, latihan grammar, bacaan, atau petualangan, tinjauan mingguan akan memetakan konsistensi dan perkembangan belajarmu secara otomatis.</p>' +
        '</div>' +
        '<div class="weekly-empty-action">' +
          '<button type="button" class="primary-action" data-weekly-target="vocabulary">Mulai Latihan Pertama ↗</button>' +
        '</div>' +
      '</div>';
      return;
    }

    const current = weekly.current;
    const previous = weekly.previous;
    const comp = weekly.comparisons;

    const headerHtml = '<div class="weekly-header-bar">' +
      '<span class="weekly-range-pill">' + esc(current.dateRangeLabel) + '</span>' +
      '<p class="weekly-narrative">' + esc(weekly.narrative) + '</p>' +
    '</div>';

    const accDisplay = current.accuracy
      ? current.accuracy.percentage + '% <small>(' + current.accuracy.correct + '/' + current.accuracy.total + ' tepat)</small>'
      : '<span class="metric-na">— <small>Belum ada butir soal objektif</small></span>';

    const metricsHtml = '<div class="weekly-metric-grid">' +
      '<div class="weekly-metric-item">' +
        '<span class="weekly-metric-title">Hari Aktif</span>' +
        '<span class="weekly-metric-value" id="weekly-active-days">' + current.activeDays.size + ' <small>/ 7 hari</small></span>' +
        '<span class="weekly-metric-comparison ' + (comp.activeDaysDiff > 0 ? 'trend-up' : comp.activeDaysDiff < 0 ? 'trend-down' : '') + '">' + esc(comp.activeDaysComparison) + '</span>' +
      '</div>' +
      '<div class="weekly-metric-item">' +
        '<span class="weekly-metric-title">Aktivitas Selesai</span>' +
        '<span class="weekly-metric-value" id="weekly-total-activities">' + current.totalActivities + '</span>' +
        '<span class="weekly-metric-comparison ' + (comp.activitiesDiff > 0 ? 'trend-up' : comp.activitiesDiff < 0 ? 'trend-down' : '') + '">' + esc(comp.activitiesComparison) + '</span>' +
      '</div>' +
      '<div class="weekly-metric-item">' +
        '<span class="weekly-metric-title">Review & Perbaikan</span>' +
        '<span class="weekly-metric-value" id="weekly-total-reviews">' + current.reviews.totalReviews + '</span>' +
        '<span class="weekly-metric-comparison">' + current.reviews.vocabReviews + ' review kata · ' + current.reviews.mistakesResolved + ' perbaikan</span>' +
      '</div>' +
      '<div class="weekly-metric-item">' +
        '<span class="weekly-metric-title">Akurasi Soal Objektif</span>' +
        '<span class="weekly-metric-value" id="weekly-accuracy-value">' + accDisplay + '</span>' +
        '<span class="weekly-metric-comparison ' + (comp.hasFairAccuracyComparison && current.accuracy && previous.accuracy && current.accuracy.percentage > previous.accuracy.percentage ? 'trend-up' : '') + '">' + esc(comp.accuracyComparison) + '</span>' +
      '</div>' +
    '</div>';

    const skillRows = Object.values(current.skills).map(s => {
      const prevSkill = previous.skills[s.id] || { completed: 0, attempts: 0 };
      const diff = s.completed - prevSkill.completed;
      let changeText = "";
      if (s.completed === 0 && s.attempts === 0) {
        changeText = '<span style="color:var(--muted)">Belum dilatih minggu ini</span>';
      } else if (prevSkill.completed === 0 && prevSkill.attempts === 0) {
        changeText = '<span style="color:var(--sage-deep);font-weight:600">Baru dilatih minggu ini</span>';
      } else if (diff > 0) {
        changeText = '<span style="color:var(--sage-deep);font-weight:600">+' + diff + ' dibanding mgg lalu</span>';
      } else if (diff < 0) {
        changeText = '<span style="color:var(--rust)">' + diff + ' dibanding mgg lalu</span>';
      } else {
        changeText = '<span>Sama seperti mgg lalu</span>';
      }

      let accText = "—";
      if (s.id === "speaking" || s.id === "writing") {
        accText = '<span style="font-style:italic;color:var(--muted)">Refleksi mandiri</span>';
      } else if (s.id === "pronunciation") {
        accText = '<span style="font-style:italic;color:var(--muted)">Analisis audio lokal</span>';
      } else if (s.accuracy) {
        accText = '<strong>' + s.accuracy.percentage + '%</strong> <small>(' + s.accuracy.correct + '/' + s.accuracy.total + ')</small>';
      } else {
        accText = '<span style="color:var(--muted)">—</span>';
      }

      return '<tr>' +
        '<td><div class="weekly-skill-cell"><span class="weekly-skill-symbol">' + esc(s.symbol) + '</span><span>' + esc(s.name) + '</span></div></td>' +
        '<td><strong>' + s.completed + '</strong></td>' +
        '<td>' + s.attempts + '</td>' +
        '<td>' + accText + '</td>' +
        '<td>' + changeText + '</td>' +
      '</tr>';
    }).join("");

    const breakdownHtml = '<div class="weekly-breakdown-box">' +
      '<div class="weekly-box-title">Aktivitas per Keterampilan (7 Hari Terakhir)</div>' +
      '<table class="weekly-skills-table" aria-label="Rincian aktivitas mingguan per kemampuan">' +
        '<thead>' +
          '<tr>' +
            '<th>Kemampuan</th>' +
            '<th>Aktivitas</th>' +
            '<th>Percobaan</th>' +
            '<th>Akurasi / Bukti</th>' +
            '<th>Perubahan vs Mgg Lalu</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + skillRows + '</tbody>' +
      '</table>' +
    '</div>';

    const highlightsHtml = '<div class="weekly-highlights-grid">' +
      '<div class="weekly-highlight-item">' +
        '<span class="weekly-highlight-label">Fokus Terbanyak Minggu Ini</span>' +
        '<strong class="weekly-highlight-val" id="weekly-most-practiced">' + (weekly.mostPracticed ? esc(weekly.mostPracticed.name) : '—') + '</strong>' +
        '<p class="weekly-highlight-desc">' + (weekly.mostPracticed ? esc(weekly.mostPracticed.detail) : 'Belum ada aktivitas.') + '</p>' +
      '</div>' +
      '<div class="weekly-highlight-item">' +
        '<span class="weekly-highlight-label">Perlu Diperhatikan</span>' +
        '<strong class="weekly-highlight-val" id="weekly-least-practiced">' + (weekly.leastPracticed ? esc(weekly.leastPracticed.name) : '—') + '</strong>' +
        '<p class="weekly-highlight-desc">' + (weekly.leastPracticed ? esc(weekly.leastPracticed.detail) : 'Belum ada data.') + '</p>' +
      '</div>' +
    '</div>';

    const recsHtml = '<div class="weekly-recommendations">' +
      '<div class="weekly-recommendations-title">Rekomendasi Terarah untuk Minggu Depan</div>' +
      '<div class="weekly-recommendation-list">' +
        weekly.recommendations.map(r => (
          '<div class="weekly-rec-card">' +
            '<div class="weekly-rec-text">' +
              '<span class="weekly-rec-title">' + esc(r.title) + '</span>' +
              '<span class="weekly-rec-desc">' + esc(r.desc) + '</span>' +
            '</div>' +
            '<button type="button" class="secondary-action weekly-rec-btn" data-weekly-target="' + esc(r.target) + '"' + (r.sectionId ? ' data-weekly-section="' + esc(r.sectionId) + '"' : '') + '>' + esc(r.actionLabel) + '</button>' +
          '</div>'
        )).join("") +
      '</div>' +
    '</div>';

    cardEl.innerHTML = headerHtml + metricsHtml + breakdownHtml + highlightsHtml + recsHtml;
  }

  function renderSkillPassport() {
    const passportContainer = $("#skill-passport-section");
    if (!passportContainer) return;
    const extras = readExtraSnapshots();
    const passport = aggregateSkillPassport(state, extras, words, topics);
    window.sinauuSkillPassportData = passport;

    const insightEl = $("#passport-insight-card");
    const gridEl = $("#passport-skills-grid");
    if (!insightEl || !gridEl) return;

    if (passport.insight.emptyState) {
      insightEl.innerHTML = '<div class="passport-empty-state">' +
        '<div class="passport-empty-copy">' +
          '<span class="passport-empty-kicker">MEMULAI PERJALANAN</span>' +
          '<h3>Paspor Kemampuan masih menunggu langkah pertamamu.</h3>' +
          '<p>Setiap bukti latihan dari kosakata, grammar, bacaan, menyimak, berbicara, menulis, hingga artikulasi akan tercatat di sini secara transparan. Tidak ada skor buatan atau tebakan algoritma.</p>' +
        '</div>' +
        '<div class="passport-empty-action">' +
          '<button type="button" class="primary-action" data-passport-target="' + esc(passport.insight.nextAction.target) + '">' + esc(passport.insight.nextAction.label) + '</button>' +
        '</div>' +
      '</div>';
    } else {
      insightEl.innerHTML = '<div class="passport-insight-grid">' +
        '<div class="passport-insight-col">' +
          '<span class="passport-insight-label">FOKUS TERBANYAK</span>' +
          '<strong class="passport-insight-highlight">' + esc(passport.insight.mostPracticed.name) + '</strong>' +
          '<p class="passport-insight-desc">' + esc(passport.insight.mostPracticed.detail) + '</p>' +
        '</div>' +
        '<div class="passport-insight-col">' +
          '<span class="passport-insight-label">PERLU DILATIH</span>' +
          (passport.insight.leastPracticed ? (
            '<strong class="passport-insight-highlight">' + esc(passport.insight.leastPracticed.name) + '</strong>' +
            '<p class="passport-insight-desc">' + esc(passport.insight.leastPracticed.detail) + '</p>'
          ) : (
            '<strong class="passport-insight-highlight passport-insufficient-data">Data Belum Cukup</strong>' +
            '<p class="passport-insight-desc">' + esc(passport.insight.insufficientDataReason) + '</p>'
          )) +
        '</div>' +
        '<div class="passport-insight-col passport-insight-action-col">' +
          '<span class="passport-insight-label">LANGKAH BERIKUTNYA</span>' +
          '<p class="passport-insight-action-text">' + esc(passport.insight.nextAction.text) + '</p>' +
          '<button type="button" class="secondary-action passport-next-btn" data-passport-target="' + esc(passport.insight.nextAction.target) + '">' + esc(passport.insight.nextAction.label) + '</button>' +
        '</div>' +
      '</div>';
    }

    gridEl.innerHTML = passport.skills.map(s => {
      const accuracyHtml = s.accuracy
        ? '<strong>' + s.accuracy.percentage + '%</strong> <small>(' + s.accuracy.correct + '/' + s.accuracy.total + ' tepat · ' + esc(s.accuracy.note) + ')</small>'
        : '<span class="metric-na">— <small>' + esc(s.accuracyNote) + '</small></span>';

      const masteryHtml = s.mastery
        ? '<strong>' + s.mastery.count + ' kata</strong> <small>' + esc(s.mastery.label) + '</small>'
        : '<span class="metric-na">— <small>Tidak didefinisikan modul</small></span>';

      const evidenceHtml = s.evidenceDetails && s.evidenceDetails.length
        ? '<div class="passport-evidence-box"><span class="passport-evidence-label">Bukti Rekaman:</span><ul class="passport-evidence-list">' +
            s.evidenceDetails.map(d => '<li>' + esc(d) + '</li>').join("") +
          '</ul></div>'
        : '';

      return '<article class="passport-skill-card" data-skill-id="' + esc(s.id) + '">' +
        '<div class="passport-skill-header">' +
          '<div class="passport-skill-title-group">' +
            '<span class="passport-skill-symbol" aria-hidden="true">' + esc(s.symbol) + '</span>' +
            '<div><h3 class="passport-skill-name">' + esc(s.title) + '</h3><span class="passport-skill-sub">' + esc(s.shortName) + '</span></div>' +
          '</div>' +
          '<span class="passport-status-pill status-' + esc(s.status) + '">' + esc(s.statusLabel) + '</span>' +
        '</div>' +
        '<p class="passport-status-reason">' + esc(s.statusReason) + '</p>' +
        '<div class="passport-metrics-table">' +
          '<div class="passport-metric-row"><span class="metric-key">Aktivitas Selesai</span><span class="metric-val"><strong>' + esc(s.completedLabel) + '</strong></span></div>' +
          '<div class="passport-metric-row"><span class="metric-key">Total Percobaan</span><span class="metric-val">' + s.attemptsCount + ' percobaan</span></div>' +
          '<div class="passport-metric-row"><span class="metric-key">Akurasi Soal</span><span class="metric-val">' + accuracyHtml + '</span></div>' +
          '<div class="passport-metric-row"><span class="metric-key">Status Mastery</span><span class="metric-val">' + masteryHtml + '</span></div>' +
          '<div class="passport-metric-row"><span class="metric-key">Terakhir Dilatih</span><span class="metric-val">' + esc(s.lastPracticedLabel) + '</span></div>' +
        '</div>' +
        evidenceHtml +
        '<div class="passport-card-footer">' +
          '<button type="button" class="plain-action passport-card-action" data-passport-target="' + esc(s.primaryAction.viewTarget) + '">' + esc(s.primaryAction.label) + '</button>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function renderProgress() {
    const stats=levelStats();
    $("#progress-words-tried").textContent=String(words.filter(w=>statusOf(w)!=="new").length);
    $("#progress-grammar-tried").textContent=String(topics.filter(topic=>Object.keys((state.grammarProgress[topic.id]&&state.grammarProgress[topic.id].answers)||{}).length>0).length);
    const readingRecords=window.sinauuExtraLearningBackup?.().reading||{};
    $("#progress-reading-tried").textContent=String(Object.values(readingRecords).filter(record=>Number(record.attempts||0)>0).length);
    $("#progress-levels").innerHTML=LEVELS.map(l=>levelRow(l,stats[l],true)).join("");
    $("#grammar-progress-list").innerHTML=topics.map(t=>{
      const p=state.grammarProgress[t.id]||{attempts:0,correct:0,answers:{}},n=Object.keys(p.answers||{}).length,score=p.attempts?Math.round(p.correct/p.attempts*100):null;
      return '<div class="grammar-progress-row"><span class="topic-code">'+esc(t.level)+'</span><div><strong>'+esc(t.title)+'</strong><p>'+n+'/'+t.questions.length+' soal unik dicoba · '+p.attempts+' percobaan total</p></div><span class="grammar-score">'+(score===null?"Belum dicoba":score+"% akurasi")+'</span></div>';
    }).join("");
    const history=state.history.slice(0,18);
    $("#history-list").innerHTML=history.length?history.map(x=>{
      const atDate = x && (x.at || x.date) ? new Date(x.at || x.date) : null;
      const validDate = atDate && !Number.isNaN(atDate.getTime());
      const timeLabel = validDate
        ? (fmtDate(atDate,{day:"2-digit",month:"short"})+' · '+new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(atDate))
        : "-";
      return '<div class="history-row"><time>'+esc(timeLabel)+'</time><div><strong>'+esc((x.type==="vocabulary"?"Kosakata: ":x.type==="grammar"?"Grammar: ":x.type==="matching"?"Matching: ":x.type==="reading"?"Reading: ":"Aktivitas: ")+(x.title||""))+'</strong><small>'+esc(x.detail||"")+'</small></div><span class="history-result">'+(x.correct===true?"BENAR":x.correct===false?"PERLU ULANG":"")+'</span></div>';
    }).join(""):'<div class="empty-state">Belum ada aktivitas. Latihan pertamamu akan tercatat di sini.</div>';
    renderWeeklyInsights();
    renderSkillPassport();
  }
  function exportBackup() {
    const extras=readExtraSnapshots();
    const backup=Object.assign({product:"SinauuEnglish",exportedAt:new Date().toISOString()},state,{
      extraLearning:extras.extraLearning,
      habitProgress:extras.habitProgress,
      adventureProgress:extras.adventureProgress,
      studioDrafts:extras.studioDrafts
    });
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="sinauuenglish-backup-"+dayKey()+".json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    $("#backup-status").textContent="Backup dibuat dari progres inti, latihan, petualangan, dan draft studio.";
  }
  async function importBackup(file) {
    if(!file)return;
    try {
      if(file.size>10*1024*1024)throw new Error("Ukuran backup maksimal 10 MB.");
      const parsed=JSON.parse(await file.text());
      if(parsed.product&&parsed.product!=="SinauuEnglish")throw new Error("File bukan backup SinauuEnglish.");
      const safe=sanitize(parsed);
      if(!confirm("Pulihkan backup? Progres saat ini akan diganti."))return;
      state=safe;
      const backupExtras=[
        ["extraLearning","sinauu-extra-learning-v1",window.sinauuExtraLearningRestore],
        ["habitProgress","sinauu-habit-library-v1",window.sinauuHabitLibraryRestore],
        ["adventureProgress","sinauu-adventure-progress-v1",window.sinauuAdventureRestore]
      ];
      for(const [field,key,restore] of backupExtras){
        if(parsed[field]&&typeof parsed[field]==="object"){
          if (!window.sinauuIsCloudVerified?.()) {
            localStorage.setItem(key,JSON.stringify(parsed[field]));
          }
          restore?.(parsed[field]);
        }
      }
      if (parsed.studioDrafts && typeof parsed.studioDrafts === "object") {
        window.sinauuStudioDraftsRestore?.(parsed.studioDrafts);
      }
      root.dataset.theme=state.settings.theme;await save();
      renderDate();renderOverview();renderVocabulary();renderGrammar();renderReview();renderProgress();window.sinauuRenderAdventure?.();
      $("#backup-status").textContent="Backup berhasil dipulihkan.";toast("Progres berhasil dipulihkan.");
    }catch(e){$("#backup-status").textContent=e.message||"JSON tidak valid.";}
    finally{$("#import-backup").value="";}
  }
  function closeMobileDrawer() {
    const sidebar = $("#app-sidebar") || $(".sidebar");
    const backdrop = $("#nav-backdrop");
    const menuToggle = $("#mobile-menu-toggle");
    if (sidebar) sidebar.classList.remove("is-drawer-open");
    if (backdrop) backdrop.hidden = true;
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  }

  function openMobileDrawer() {
    const sidebar = $("#app-sidebar") || $(".sidebar");
    const backdrop = $("#nav-backdrop");
    const menuToggle = $("#mobile-menu-toggle");
    if (sidebar) sidebar.classList.add("is-drawer-open");
    if (backdrop) backdrop.hidden = false;
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
  }

  function toggleMobileDrawer() {
    const sidebar = $("#app-sidebar") || $(".sidebar");
    if (sidebar && sidebar.classList.contains("is-drawer-open")) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  }

  function toggleSidebarCollapse() {
    const isCollapsed = document.body.classList.toggle("sidebar-collapsed");
    try {
      localStorage.setItem("sinauu-sidebar-collapsed", isCollapsed ? "true" : "false");
    } catch (_) {}
    const btn = $("#sidebar-collapse-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", String(!isCollapsed));
      btn.setAttribute("title", isCollapsed ? "Perbesar bilah samping" : "Kecilkan bilah samping");
    }
  }

  function normalizeWord(raw) {
    return String(raw || "").toLowerCase().replace(/[^a-z'-]/g, "").replace(/^[-']+|[-']+$/g, "");
  }

  function findWordEntry(rawWord, wordList) {
    const list = wordList || words || [];
    if (!list.length) return null;
    const clean = normalizeWord(rawWord);
    if (!clean) return null;

    let found = list.find(w => w.word && w.word.toLowerCase() === clean);
    if (found) return { entry: found, lemma: found.word, original: rawWord };

    found = list.find(w => Array.isArray(w.forms) && w.forms.some(f => f.form && f.form.toLowerCase() === clean));
    if (found) return { entry: found, lemma: found.word, original: rawWord };

    const candidates = [];
    if (clean.endsWith("ing")) {
      const base = clean.slice(0, -3);
      candidates.push(base, base + "e");
      if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) candidates.push(base.slice(0, -1));
      if (clean.endsWith("ying")) candidates.push(clean.slice(0, -4) + "ie");
    }
    if (clean.endsWith("ed")) {
      const base = clean.slice(0, -2);
      candidates.push(base, clean.slice(0, -1));
      if (clean.endsWith("ied")) candidates.push(clean.slice(0, -3) + "y");
      if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) candidates.push(base.slice(0, -1));
    }
    if (clean.endsWith("ies")) candidates.push(clean.slice(0, -3) + "y");
    else if (clean.endsWith("ves")) candidates.push(clean.slice(0, -3) + "f", clean.slice(0, -3) + "fe");
    else if (clean.endsWith("es")) candidates.push(clean.slice(0, -2), clean.slice(0, -1));
    else if (clean.endsWith("s") && !clean.endsWith("ss")) candidates.push(clean.slice(0, -1));

    if (clean.endsWith("est")) {
      const base = clean.slice(0, -3);
      candidates.push(base, base + "e");
      if (clean.endsWith("iest")) candidates.push(clean.slice(0, -4) + "y");
    } else if (clean.endsWith("er")) {
      const base = clean.slice(0, -2);
      candidates.push(base, base + "e");
      if (clean.endsWith("ier")) candidates.push(clean.slice(0, -3) + "y");
    }
    if (clean.endsWith("ly")) {
      candidates.push(clean.slice(0, -2));
      if (clean.endsWith("ily")) candidates.push(clean.slice(0, -3) + "y");
    }

    for (const cand of candidates) {
      found = list.find(w => w.word && w.word.toLowerCase() === cand);
      if (found) return { entry: found, lemma: found.word, original: rawWord };
      found = list.find(w => Array.isArray(w.forms) && w.forms.some(f => f.form && f.form.toLowerCase() === cand));
      if (found) return { entry: found, lemma: found.word, original: rawWord };
    }

    return { entry: null, lemma: clean, original: rawWord };
  }

  let activeVocabTarget = null;
  let activeVocabData = null;

  function isContextualWordSaved(wordId) {
    if (!state || !state.wordProgress || !wordId) return false;
    const p = state.wordProgress[wordId];
    return Boolean(p && (p.savedContext || (Array.isArray(p.studiedDates) && p.studiedDates.length) || (Array.isArray(p.attempts) && p.attempts.length)));
  }

  function updateSaveButtonState(wordId) {
    const saveBtn = $("#vocab-popover-save");
    const saveLabel = $("#vocab-popover-save-label");
    if (!saveBtn || !saveLabel) return;
    const isSaved = isContextualWordSaved(wordId);
    saveBtn.classList.toggle("is-saved", isSaved);
    if (isSaved) {
      saveLabel.textContent = "Tersimpan di Kosakata ✓";
    } else {
      saveLabel.textContent = "Simpan ke Kosakata Saya +";
    }
  }

  let activeExternalDictLookup = null;

  async function fetchExternalDefinition(rawWord) {
    const clean = String(rawWord || "").trim().toLowerCase();
    if (!clean) return null;
    const cacheKey = "sinauu-external-dict-cache-v1";
    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    } catch (_) { cache = {}; }

    if (cache[clean]) {
      return cache[clean];
    }

    let phonetic = "";
    let pos = "noun";
    let definitionEn = "";
    let translation = "";

    try {
      const hasTimeout = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function";
      const dictPromise = fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(clean), {
        signal: hasTimeout ? AbortSignal.timeout(3000) : undefined
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const transPromise = fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(clean) + "&langpair=en|id", {
        signal: hasTimeout ? AbortSignal.timeout(3000) : undefined
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [dictData, transData] = await Promise.all([dictPromise, transPromise]);

      if (Array.isArray(dictData) && dictData[0]) {
        const item = dictData[0];
        phonetic = item.phonetic || item.phonetics?.find(p => p.text)?.text || "";
        const m = item.meanings?.[0];
        if (m) {
          pos = m.partOfSpeech || pos;
          definitionEn = m.definitions?.[0]?.definition || "";
        }
      }

      if (transData && transData.responseData && transData.responseData.translatedText) {
        const rawTrans = transData.responseData.translatedText.trim();
        if (rawTrans.toLowerCase() !== clean && !rawTrans.startsWith("MYMEMORY WARNING")) {
          translation = rawTrans;
        }
      }
    } catch (_) {}

    const result = {
      lemma: clean,
      phonetic: phonetic,
      partOfSpeech: pos,
      definitionEn: definitionEn,
      translation: translation || definitionEn || clean,
      source: "Kamus Eksternal"
    };

    try {
      cache[clean] = result;
      const keys = Object.keys(cache);
      if (keys.length > 200) delete cache[keys[0]];
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (_) {}

    return result;
  }

  function openContextualVocab({ word, sentence, sourceTitle, targetElement }) {
    const popover = $("#contextual-vocab-popover");
    if (!popover) return;

    const result = findWordEntry(word, words);
    const entry = result.entry;
    const lemma = result.lemma || word;
    activeVocabTarget = targetElement;
    activeVocabData = { word, sentence, sourceTitle, entry, lemma };

    const wordId = entry ? entry.id : lemma;

    $("#vocab-popover-lemma").textContent = lemma;
    $("#vocab-popover-level").textContent = entry ? (entry.level || "A1") : "KATA";
    $("#vocab-popover-pos").textContent = entry ? (entry.partOfSpeech || "unclassified") : "";

    const sourceEl = $("#vocab-popover-source");
    const phoneticEl = $("#vocab-popover-phonetic");
    const customWrap = $("#vocab-popover-custom-wrap");
    const customInput = $("#vocab-custom-meaning-input");
    const meaningEl = $("#vocab-popover-meaning");
    const expEl = $("#vocab-popover-explanation");

    const existingProg = state?.wordProgress?.[wordId];
    const existingCtx = existingProg?.savedContext;

    if (sourceEl) {
      sourceEl.textContent = entry ? (entry.isOxford3000 ? "Oxford 3000" : (entry.source?.name || "Sinauu")) : "Kamus Eksternal";
    }

    if (phoneticEl) {
      phoneticEl.textContent = entry?.phonetic || existingCtx?.phonetic || "";
    }

    if (entry) {
      if (customWrap) customWrap.hidden = true;
      meaningEl.textContent = entry.meaning || lemma;
      expEl.textContent = entry.definitionEn || "";
      expEl.hidden = !entry.definitionEn;
    } else {
      // Word outside Oxford 3000 (e.g. "quantum")
      if (customWrap) customWrap.hidden = false;
      if (customInput) customInput.value = existingCtx?.meaning || "";

      if (existingCtx && existingCtx.meaning) {
        meaningEl.textContent = existingCtx.meaning;
        expEl.textContent = existingCtx.definitionEn || "";
        expEl.hidden = !existingCtx.definitionEn;
        if (sourceEl) sourceEl.textContent = "Kamus Tersimpan";
      } else {
        meaningEl.textContent = "Mencari definisi…";
        expEl.textContent = "";
        expEl.hidden = true;

        const currentLemma = lemma;
        activeExternalDictLookup = currentLemma;
        fetchExternalDefinition(lemma).then(ext => {
          if (activeExternalDictLookup !== currentLemma) return;
          if (ext) {
            activeVocabData.pos = ext.partOfSpeech;
            activeVocabData.phonetic = ext.phonetic;
            activeVocabData.customMeaning = ext.translation;
            if ($("#vocab-popover-lemma")?.textContent === currentLemma) {
              $("#vocab-popover-pos").textContent = ext.partOfSpeech;
              if (phoneticEl) phoneticEl.textContent = ext.phonetic;
              if (meaningEl) meaningEl.textContent = ext.translation || ext.definitionEn || currentLemma;
              if (expEl && ext.definitionEn) {
                expEl.textContent = ext.definitionEn;
                expEl.hidden = false;
              }
              if (customInput && !customInput.value) {
                customInput.value = ext.translation || "";
              }
            }
          }
        });
      }
    }

    const sentenceEl = $("#vocab-popover-sentence");
    if (sentence) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, "gi");
      sentenceEl.innerHTML = esc(sentence).replace(regex, "<mark>$1</mark>");
    } else {
      sentenceEl.textContent = "—";
    }

    const exBox = $("#vocab-popover-example-box");
    if (entry && entry.example) {
      exBox.hidden = false;
      $("#vocab-popover-example-en").textContent = entry.example;
      $("#vocab-popover-example-id").textContent = entry.translation || "";
    } else {
      exBox.hidden = true;
    }

    const colBox = $("#vocab-popover-collocations");
    if (entry && Array.isArray(entry.collocations) && entry.collocations.length > 0) {
      colBox.hidden = false;
      colBox.innerHTML = entry.collocations.slice(0, 4).map(c => '<span class="vocab-collocation-chip">' + esc(c) + '</span>').join("");
    } else {
      colBox.hidden = true;
      colBox.innerHTML = "";
    }

    updateSaveButtonState(wordId);

    const audioBtn = $("#vocab-popover-audio");
    if (audioBtn) {
      audioBtn.onclick = () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(lemma);
          u.lang = "en-US";
          u.rate = 0.9;
          window.speechSynthesis.speak(u);
        }
      };
    }

    popover.hidden = false;
    positionPopover(popover, targetElement);
  }

  function positionPopover(popover, targetElement) {
    if (window.innerWidth <= 760) return;
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const margin = 12;

    let left = rect.left + rect.width / 2 - popRect.width / 2;
    left = Math.max(margin, Math.min(window.innerWidth - popRect.width - margin, left));

    let top = rect.bottom + 8;
    if (top + popRect.height > window.innerHeight - margin) {
      top = rect.top - popRect.height - 8;
    }
    top = Math.max(margin, top);

    popover.style.left = Math.round(left) + "px";
    popover.style.top = Math.round(top) + "px";
  }

  function closeContextualVocab() {
    const popover = $("#contextual-vocab-popover");
    if (popover) popover.hidden = true;
    activeVocabTarget = null;
    activeVocabData = null;
  }

  async function saveContextualWord({ wordId, originalWord, sentence, sourceTitle, customMeaning }) {
    if (!state || !wordId) return false;
    const p = ensureProgress(wordId);
    const now = new Date();
    const today = dayKey(now);
    p.firstSeenDate ||= today;
    if (!p.studiedDates.includes(today)) p.studiedDates.push(today);
    const customInpVal = $("#vocab-custom-meaning-input")?.value?.trim();
    const meaning = customMeaning || customInpVal || activeVocabData?.customMeaning || activeVocabData?.entry?.meaning || p.savedContext?.meaning || originalWord || wordId;
    p.savedContext = {
      originalWord: originalWord || p.savedContext?.originalWord || wordId,
      sentence: sentence || p.savedContext?.sentence || "",
      sourceTitle: sourceTitle || p.savedContext?.sourceTitle || "",
      savedAt: now.toISOString(),
      meaning: meaning,
      pos: activeVocabData?.entry?.partOfSpeech || activeVocabData?.pos || p.savedContext?.pos || "unclassified",
      phonetic: activeVocabData?.entry?.phonetic || activeVocabData?.phonetic || p.savedContext?.phonetic || ""
    };
    ensureWordEntryInList(wordId, p);
    p.encounteredCount = (p.encounteredCount || 0) + 1;
    if (!p.nextReviewAt) {
      p.nextReviewAt = now.toISOString();
    }
    pushHistory({
      type: "vocab-contextual",
      skill: "vocab",
      wordId: wordId,
      originalWord: originalWord,
      context: sentence,
      source: sourceTitle
    });
    await save();
    if (activeVocabTarget) {
      activeVocabTarget.classList.add("is-saved");
    }
    updateSaveButtonState(wordId);
    toast(`"${originalWord || wordId}" disimpan ke kosakata dan antrean review.`);
    return true;
  }

  async function removeContextualWord(wordId) {
    if (!state || !state.wordProgress || !state.wordProgress[wordId]) return false;
    delete state.wordProgress[wordId].savedContext;
    await save();
    if (activeVocabTarget) {
      activeVocabTarget.classList.remove("is-saved");
    }
    updateSaveButtonState(wordId);
    toast("Kata dihapus dari simpanan.");
    return true;
  }

  function bindEvents() {
    window.addEventListener("sinauu:local-extras-saved",()=>{
      if(state && view==="overview")renderStudyPlan();
      if(state && view==="progress")renderProgress();
    });
    document.addEventListener("click",async e=>{
      // Sidebar Collapse & Mobile Drawer
      if (e.target.closest("#sidebar-collapse-toggle")) { toggleSidebarCollapse(); return; }
      if (e.target.closest("#mobile-menu-toggle")) { toggleMobileDrawer(); return; }
      if (e.target.closest("#sidebar-close-btn, #nav-backdrop")) { closeMobileDrawer(); return; }

      // Practice Hub Search & Filter
      if (e.target.closest("#practice-empty-reset")) {
        practiceSearchQuery = "";
        practiceActiveFilter = "all";
        const inp = $("#practice-search");
        if (inp) inp.value = "";
        const clr = $("#practice-search-clear");
        if (clr) clr.hidden = true;
        $$(".practice-pill").forEach(p => p.classList.toggle("is-active", p.dataset.practiceFilter === "all"));
        renderPracticeHub();
        return;
      }
      const practicePill = e.target.closest("[data-practice-filter]");
      if (practicePill) {
        practiceActiveFilter = practicePill.dataset.practiceFilter;
        $$(".practice-pill").forEach(p => p.classList.toggle("is-active", p === practicePill));
        renderPracticeHub();
        return;
      }
      if (e.target.closest("#practice-search-clear")) {
        practiceSearchQuery = "";
        const inp = $("#practice-search");
        if (inp) inp.value = "";
        const clr = $("#practice-search-clear");
        if (clr) clr.hidden = true;
        renderPracticeHub();
        return;
      }

      // Contextual Vocabulary
      const contextWord = e.target.closest(".context-word");
      if (contextWord) {
        const word = contextWord.dataset.word || contextWord.textContent.trim();
        const sentence = contextWord.dataset.sentence || contextWord.closest(".story-sentence, .dialogue-sentence, p")?.textContent?.trim() || "";
        const source = contextWord.dataset.source || "";
        openContextualVocab({ word, sentence, sourceTitle: source, targetElement: contextWord });
        return;
      }
      if (e.target.closest("#vocab-popover-close")) {
        closeContextualVocab();
        return;
      }
      if (e.target.closest("#vocab-popover-save")) {
        if (activeVocabData) {
          const wordId = activeVocabData.entry ? activeVocabData.entry.id : activeVocabData.lemma;
          if (isContextualWordSaved(wordId)) {
            await removeContextualWord(wordId);
          } else {
            await saveContextualWord({
              wordId,
              originalWord: activeVocabData.word,
              sentence: activeVocabData.sentence,
              sourceTitle: activeVocabData.sourceTitle,
              customMeaning: $("#vocab-custom-meaning-input")?.value?.trim() || ""
            });
          }
        }
        return;
      }
      if (!e.target.closest("#contextual-vocab-popover, .context-word")) {
        closeContextualVocab();
      }

      const readingModeBtn=e.target.closest("[data-reading-mode]");
      if(readingModeBtn){
        const mode=readingModeBtn.dataset.readingMode==="skills"?"skills":"habit";
        $$(".reading-mode-button").forEach(button=>{
          const active=button.dataset.readingMode===mode;
          button.classList.toggle("is-active",active);
          button.setAttribute("aria-selected",String(active));
          button.setAttribute("tabindex",active?"0":"-1");
        });
        const habit=$("#habit-library-section"),skills=$("#reading-skills-section");
        if(habit)habit.hidden=mode!=="habit";
        if(skills)skills.hidden=mode!=="skills";
        return;
      }
      const vocabBack=e.target.closest("[data-vocab-back]");
      if(vocabBack){
        const returnToWordId=selectedWord;
        vocabDetailOpen=false;
        renderVocabulary(false);
        $$("#vocab-list [data-select-word]").find(button=>button.dataset.selectWord===returnToWordId)?.focus();
        return;
      }
      const placementStart=e.target.closest("#placement-start");
      if(placementStart){startPlacement();return;}
      const placementAnswer=e.target.closest("[data-placement-answer]");
      if(placementAnswer){answerPlacementQuestion(Number(placementAnswer.dataset.placementAnswer));return;}
      if(e.target.closest("#placement-next")){advancePlacement();return;}
      if(e.target.closest("#placement-retake")){startPlacement();return;}
      const homePrimary=e.target.closest("#home-primary-action");
      if(homePrimary){
        const action=homePrimary.dataset.homeAction;
        if(action==="active-study"&&activeStudy){setView("study");renderStudy();return;}
        if(action==="word"&&homePrimary.dataset.homeWord){startStudy(homePrimary.dataset.homeWord,homePrimary.dataset.homeMode||"learn");return;}
        if(action==="grammar"&&homePrimary.dataset.homeTopic){activeTopic=homePrimary.dataset.homeTopic;grammarDetailOpen=true;setView("grammar");return;}
        if(action==="reading"){setView("reading");return;}
        if(action==="adventure-section"&&homePrimary.dataset.homeSection){
          const sec = homePrimary.dataset.homeSection;
          if (sec === "adventure-story-library") openPracticeModule("reading-stories");
          else if (sec === "adventure-listening-lab") openPracticeModule("listening");
          else if (sec === "adventure-speaking-studio") openPracticeModule("speaking");
          else if (sec === "adventure-writing-studio") openPracticeModule("writing");
          else if (sec === "adventure-pronunciation-studio") openPracticeModule("pronunciation");
          else {
            setView("adventure");
            $("#"+sec)?.scrollIntoView({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
          }
          return;
        }
        if(action==="adventure"){
          setView("adventure");
          $("#adventure-daily-quest")?.scrollIntoView({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
          return;
        }
        setView("vocabulary");
        return;
      }
      const openPracticeBtn=e.target.closest("[data-open-practice],[data-home-skill],[data-portal-practice]");
      if(openPracticeBtn){
        openPracticeModule(openPracticeBtn.dataset.openPractice || openPracticeBtn.dataset.homeSkill || openPracticeBtn.dataset.portalPractice);
        return;
      }
      if(e.target.closest("[data-open-practice-hub]")){
        setView("practice");
        return;
      }
      const practiceBackBtn=e.target.closest("[data-practice-back],[data-hub-back]");
      if(practiceBackBtn){
        closePracticeModule();
        return;
      }
      const planVocabulary=e.target.closest("[data-plan-vocabulary]");
      if(planVocabulary){startStudy(planVocabulary.dataset.planVocabulary,planVocabulary.dataset.planMode||"learn");return;}
      const planTopic=e.target.closest("[data-plan-topic]");
      if(planTopic){activeTopic=planTopic.dataset.planTopic;grammarDetailOpen=true;setView("grammar");return;}
      if(e.target.closest("[data-plan-adventure]")){
        setView("adventure");
        $("#adventure-daily-quest")?.scrollIntoView({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
        return;
      }
      const planReading=e.target.closest("[data-plan-reading]");
      if(planReading){setView("reading");return;}
      const planAdvSection=e.target.closest("[data-plan-adventure-section]");
      if(planAdvSection){
        const secId=planAdvSection.dataset.planAdventureSection;
        if (secId === "adventure-story-library") openPracticeModule("reading-stories");
        else if (secId === "adventure-listening-lab") openPracticeModule("listening");
        else if (secId === "adventure-speaking-studio") openPracticeModule("speaking");
        else if (secId === "adventure-writing-studio") openPracticeModule("writing");
        else if (secId === "adventure-pronunciation-studio") openPracticeModule("pronunciation");
        else {
          setView("adventure");
          $("#"+secId)?.scrollIntoView({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
        }
        return;
      }
      const weeklyBtn=e.target.closest("[data-weekly-target]");
      if(weeklyBtn){
        const targetView = weeklyBtn.dataset.weeklyTarget;
        const targetSec = weeklyBtn.dataset.weeklySection;
        if (targetSec === "adventure-story-library") { openPracticeModule("reading-stories"); return; }
        if (targetSec === "adventure-listening-lab") { openPracticeModule("listening"); return; }
        if (targetSec === "adventure-speaking-studio") { openPracticeModule("speaking"); return; }
        if (targetSec === "adventure-writing-studio") { openPracticeModule("writing"); return; }
        if (targetSec === "adventure-pronunciation-studio") { openPracticeModule("pronunciation"); return; }
        setView(targetView);
        if(targetSec){
          $("#"+targetSec)?.scrollIntoView({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
        }
        return;
      }
      const openAdvBtn=e.target.closest("[data-open-adventure],#home-adventure-link");
      if(openAdvBtn){setView("adventure");return;}
      const passportBtn=e.target.closest("[data-passport-target]");
      if(passportBtn){setView(passportBtn.dataset.passportTarget);return;}
      const viewBtn=e.target.closest("[data-view-target]");
      if(viewBtn){setView(viewBtn.dataset.viewTarget);return;}
      const wordBtn=e.target.closest("[data-select-word]");
      if(wordBtn){selectedWord=wordBtn.dataset.selectWord;vocabDetailOpen=true;renderVocabulary(false);return;}
      const studyBtn=e.target.closest("[data-start-word],[data-study-word]");
      if(studyBtn){startStudy(studyBtn.dataset.startWord||studyBtn.dataset.studyWord,"learn");return;}
      const fav=e.target.closest("[data-favorite-word]");
      if(fav){const id=fav.dataset.favoriteWord;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):state.favorites.concat(id);await save();renderVocabulary(false);toast(state.favorites.includes(id)?"Kata disimpan ke favorit.":"Kata dihapus dari favorit.");return;}
      const topic=e.target.closest("[data-topic-id]");
      if(e.target.closest("[data-grammar-back]")){
        grammarDetailOpen=false;
        renderGrammar();
        $$("#grammar-topic-list [data-topic-id]").find(button=>button.dataset.topicId===activeTopic)?.focus();
        return;
      }
      if(topic){activeTopic=topic.dataset.topicId;grammarDetailOpen=true;renderGrammar();return;}
      const openTopic=e.target.closest("[data-open-topic]");
      if(openTopic){activeTopic=openTopic.dataset.openTopic;grammarDetailOpen=true;setView("grammar");return;}
      const openGrammar=e.target.closest("[data-open-grammar-topic]");
      if(openGrammar){activeTopic=openGrammar.dataset.openGrammarTopic;grammarDetailOpen=true;setView("grammar");renderGrammar();return;}
      const openWord=e.target.closest("[data-open-vocab-word]");
      if(openWord){selectedWord=openWord.dataset.openVocabWord;vocabDetailOpen=true;setView("vocabulary");renderVocabulary(false);return;}
      const openHabit=e.target.closest("[data-open-habit-passage]");
      if(openHabit){setView("reading");if(typeof window.sinauuOpenHabitPassage==="function"){window.sinauuOpenHabitPassage(openHabit.dataset.openHabitPassage);}return;}
      const review=e.target.closest("[data-review-word]");
      if(review){startStudy(review.dataset.reviewWord,"review");return;}
      const reviewFilter=e.target.closest("[data-review-filter]");
      if(reviewFilter){reviewFilterTab=reviewFilter.dataset.reviewFilter;renderReview();return;}
      const reviewSkill=e.target.closest("[data-review-skill]");
      if(reviewSkill){reviewSkillFilter=reviewSkill.dataset.reviewSkill;renderReview();return;}
      const startFocus=e.target.closest("#review-start-focus");
      if(startFocus){
        const queue=getUnifiedReviewQueue(state,readExtraSnapshots(),words,topics,null);
        const first=queue.focusedSession&&queue.focusedSession[0];
        if(first){
          if(first.type==="vocabulary"){startStudy(first.wordId,"review");}
          else if(first.type==="mistake"){
            window.sinauuOpenMistakeReview?.(first.mistakeId);
            window.sinauuUpdateReviewActivePanel?.();
            $("#review-active-panel")?.scrollIntoView({behavior:"smooth",block:"nearest"});
          }
        }
        return;
      }
      const reviewMistake=e.target.closest("[data-review-mistake]");
      if(reviewMistake){
        window.sinauuOpenMistakeReview?.(reviewMistake.dataset.reviewMistake);
        window.sinauuUpdateReviewActivePanel?.();
        $("#review-active-panel")?.scrollIntoView({behavior:"smooth",block:"nearest"});
        return;
      }
      const openSource=e.target.closest("[data-review-open-source]");
      if(openSource){
        const itemId=openSource.dataset.reviewOpenSource;
        if(itemId.startsWith("vocab:")){
          selectedWord=itemId.replace("vocab:","");
          vocabDetailOpen=true;
          setView("vocabulary");
          renderVocabulary(false);
          return;
        }else if(itemId.startsWith("mistake:")){
          const mistakeId=itemId.replace("mistake:","");
          const item=window.sinauuGetMistakeRecord?.(mistakeId);
          if(item){
            if(item.sourceType==="grammar"||item.topicId){
              const topicId=item.topicId||(item.mistakeId.split(":")[1]);
              if(topicId){activeTopic=topicId;grammarDetailOpen=true;setView("grammar");renderGrammar();return;}
            }else if(item.sourceType==="habit"||item.passageId){
              const passageId=item.passageId||(item.mistakeId.split(":")[1]);
              setView("reading");
              if(typeof window.sinauuOpenHabitPassage==="function"){window.sinauuOpenHabitPassage(passageId);}
              return;
            }else if(item.sourceType==="vocab"||item.wordId){
              const wordId=item.wordId||(item.mistakeId.split(":")[1]);
              if(wordId){selectedWord=wordId;vocabDetailOpen=true;setView("vocabulary");renderVocabulary(false);return;}
            }
          }
          setView("adventure");
          window.sinauuRenderAdventure?.();
          return;
        }
      }
    });
    $("#practice-search")?.addEventListener("input",(e)=>{
      practiceSearchQuery = e.target.value.trim();
      const clr = $("#practice-search-clear");
      if (clr) clr.hidden = !practiceSearchQuery;
      renderPracticeHub();
    });
    $("#vocab-search").addEventListener("input",()=>{vocabDetailOpen=false;renderVocabulary();});
    $("#vocab-load-more").addEventListener("click",()=>{listLimit+=100;renderVocabulary(false);});
    $("#level-filter").addEventListener("change",()=>{vocabDetailOpen=false;renderVocabulary();});
    $("#topic-filter").addEventListener("change",()=>{vocabDetailOpen=false;renderVocabulary();});
    $("#favorites-only").addEventListener("change",()=>{vocabDetailOpen=false;renderVocabulary();});
    $("#theme-toggle").addEventListener("click",()=>setTheme(root.dataset.theme==="dark"?"light":"dark"));
    $("#edit-goal").addEventListener("click",()=>{$("#daily-goal-input").value=String(state.settings.dailyGoal||10);$("#goal-dialog").showModal();});
    $("#goal-form").addEventListener("submit",async e=>{e.preventDefault();state.settings.dailyGoal=Number($("#daily-goal-input").value)||10;await save();$("#goal-dialog").close();renderOverview();toast("Target harian diperbarui.");});
    $("#export-backup").addEventListener("click",exportBackup);
    $("#import-backup").addEventListener("change",e=>void importBackup(e.target.files&&e.target.files[0]));
    $("#exit-study").addEventListener("click",()=>setView(activeStudy&&activeStudy.mode==="review"?"review":"vocabulary"));
    $("#speak-word")?.addEventListener("click",()=>speak("notice"));
    document.addEventListener("keydown",e=>{
      if (e.key === "Escape") {
        closeMobileDrawer();
        closeContextualVocab();
        $("#goal-dialog")?.close();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        toggleSidebarCollapse();
      }
      const tab=e.target.closest(".learning-subnav [role='tab'], #reading-mode-switch [role='tab']");
      if(tab && ["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){
        const group=tab.closest(".learning-subnav, #reading-mode-switch");
        const tabs=Array.from(group.querySelectorAll("[role='tab']:not([disabled])"));
        const current=tabs.indexOf(tab);
        if(tabs.length && current>=0){
          const nextIndex=e.key==="Home"?0:e.key==="End"?tabs.length-1:(current+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
          e.preventDefault();
          tabs[nextIndex].focus();
          tabs[nextIndex].click();
        }
        return;
      }
      if(e.key==="/"&&view==="vocabulary"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){e.preventDefault();$("#vocab-search").focus();}
    });
    window.addEventListener("sinauu:open-topic",(e)=>{
      if(e.detail?.topicId){activeTopic=e.detail.topicId;grammarDetailOpen=true;setView("grammar");renderGrammar();}
    });
    window.addEventListener("sinauu:open-word",(e)=>{
      if(e.detail?.wordId){selectedWord=e.detail.wordId;vocabDetailOpen=true;setView("vocabulary");renderVocabulary(false);}
    });
    window.addEventListener("sinauu:open-habit",(e)=>{
      if(e.detail?.passageId){setView("reading");if(typeof window.sinauuOpenHabitPassage==="function"){window.sinauuOpenHabitPassage(e.detail.passageId);}}
    });
  }
  async function init() {
    bindEvents();renderDate();
    const mascot = $("#app-loading-mascot");
    let mascotTimer = null;
    if (mascot) {
      mascot.hidden = false;
      mascotTimer = setTimeout(() => {
        if (mascot) mascot.hidden = true;
      }, 3000);
    }
    try {
      const savedCollapse = localStorage.getItem("sinauu-sidebar-collapsed");
      if (savedCollapse === "true") {
        document.body.classList.add("sidebar-collapsed");
        const btn = $("#sidebar-collapse-toggle");
        if (btn) {
          btn.setAttribute("aria-expanded", "false");
          btn.setAttribute("title", "Perbesar bilah samping");
        }
      }
      await loadDatasets();await loadState();
      for (const [wId, p] of Object.entries(state.wordProgress || {})) {
        if (p && p.savedContext) ensureWordEntryInList(wId, p);
      }
      await setTheme(state.settings.theme);
      renderDate();renderOverview();renderVocabulary();renderGrammar();renderReview();renderProgress();
      if (mascotTimer) clearTimeout(mascotTimer);
      if (mascot) mascot.hidden = true;
      window.sinauuExportLocalBundle = () => ({schemaVersion:2,core:state,extras:readExtraSnapshots()});
      window.sinauuGetSkillPassport = () => aggregateSkillPassport(state, readExtraSnapshots(), words, topics);
      window.sinauuComputeWeeklyInsights = (refDate) => computeWeeklyInsights(state, readExtraSnapshots(), words, topics, refDate);
      window.sinauuRenderWeeklyInsights = () => renderWeeklyInsights();
      window.sinauuGetAdaptiveStudyPlan = (today) => getAdaptiveStudyPlan(today || dayKey());
      window.sinauuGetUnifiedReviewQueue = (now) => getUnifiedReviewQueue(state, readExtraSnapshots(), words, topics, null, now);
      window.sinauuRenderReview = () => renderReview();
      window.sinauuOpenPracticeModule = (moduleId) => openPracticeModule(moduleId);
      window.sinauuClosePracticeModule = () => closePracticeModule();
      window.sinauuRenderPracticeHub = () => renderPracticeHub();
      window.sinauuGetWordList = () => words;
      window.sinauuGetTopicList = () => topics;
      window.sinauuGetCoreState = () => state;
      window.sinauuFindWordEntry = (rawWord) => findWordEntry(rawWord, words);
      window.sinauuOpenContextualVocab = openContextualVocab;
      window.sinauuCloseContextualVocab = closeContextualVocab;
      window.sinauuSaveContextualWord = saveContextualWord;
      window.sinauuRemoveContextualWord = removeContextualWord;
      window.sinauuIsWordSaved = isContextualWordSaved;
      window.sinauuToggleSidebarCollapse = toggleSidebarCollapse;
      window.sinauuToggleMobileDrawer = toggleMobileDrawer;
      window.sinauuCloseMobileDrawer = closeMobileDrawer;
      window.sinauuGetWordContextQuestion = (word, qId) => {
        if(!word)return null;
        if(word.context&&word.context.id===qId)return word.context;
        const p=ensureProgress(word.id);
        return contextQuestion(word,p);
      };
      window.sinauuApplyCloudBundle = async (bundle) => {
        if (!bundle || !bundle.core || !state) return;
        cloudApplying = true;
        try {
          state = sanitize(bundle.core);
          for (const [wId, p] of Object.entries(state.wordProgress || {})) {
            if (p && p.savedContext) ensureWordEntryInList(wId, p);
          }
          if (bundle.core && bundle.core.placementResult) {
            placementResult = bundle.core.placementResult;
            state.placementResult = placementResult;
            renderPlacementTeaser();
          }
          const extras = bundle.extras || {};
          if (!window.sinauuIsCloudVerified?.()) {
            localStorage.setItem("sinauu-extra-learning-v1", JSON.stringify(extras.extraLearning || {}));
            localStorage.setItem("sinauu-habit-library-v1", JSON.stringify(extras.habitProgress || {}));
            localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(extras.adventureProgress || {}));
            if (db) await writeDB(db, state);
            try { localStorage.setItem(FALLBACK, JSON.stringify(state)); } catch (_) {}
          } else {
            storageMode = "cloud";
            labelStorage();
          }
          await setTheme(state.settings.theme);
          window.sinauuExtraLearningRestore?.(extras.extraLearning || {});
          window.sinauuHabitLibraryRestore?.(extras.habitProgress || {});
          window.sinauuAdventureRestore?.(extras.adventureProgress || {});
          if (extras.studioDrafts && typeof extras.studioDrafts === "object") {
            window.sinauuStudioDraftsRestore?.(extras.studioDrafts);
          }
          renderDate();renderOverview();renderVocabulary();renderGrammar();renderReview();renderProgress();window.sinauuRenderAdventure?.();
        } finally { cloudApplying = false; }
      };
      window.sinauuWorkspaceReady = true;
      const initialHash = window.location.hash.replace(/^#/, "");
      if (initialHash && ["overview", "adventure", "practice", "vocabulary", "grammar", "reading", "review", "progress", "placement", "speaking", "writing", "listening", "pronunciation"].includes(initialHash)) {
        setView(initialHash);
      }
      window.dispatchEvent(new CustomEvent("sinauu:workspace-ready"));
      const stale=Object.keys(state.wordProgress).filter(id=>!words.some(w=>w.id===id));
      if(stale.length)toast(stale.length+" catatan kata lama tersimpan tetapi tidak ada dalam korpus versi ini.");
    } catch(e) {
      $("#load-error").hidden=false;$("#load-error").textContent="Ruang belajar gagal dimuat: "+(e.message||"kesalahan tidak diketahui")+" Periksa folder data/ lalu muat ulang.";
      console.error(e);
    }
  }
  window.sinauuTrackExtraActivity = async function(item) {
    if (!state || !item) return;
    const type = item.type === "matching" ? "matching" : "reading";
    pushHistory({
      type:type,
      title:String(item.title || (type === "matching" ? "Pasangan kosakata" : "Pemahaman teks")).slice(0,120),
      detail:String(item.detail || "Latihan tambahan").slice(0,300),
      correct:item.correct === true ? true : item.correct === false ? false : null
    });
    await save();
    renderOverview();
    renderProgress();
  };
  window.sinauuOnMistakeReviewChanged = () => {
    if (view === "review") renderReview();
  };
  window.addEventListener("sinauu:local-extras-saved", () => {
    if (view === "review") renderReview();
  });
  window.addEventListener("sinauu:cloud-sync-success", () => {
    storageMode = "cloud";
    labelStorage();
  });
  window.addEventListener("sinauu:cloud-sync-waiting", () => {
    if (window.sinauuIsCloudVerified?.()) {
      storageMode = "waiting";
      labelStorage();
    }
  });
  window.addEventListener("sinauu:cloud-sync-syncing", () => {
    storageMode = "syncing";
    labelStorage();
  });
  window.addEventListener("sinauu:cloud-sync-conflict", () => {
    storageMode = "conflict";
    labelStorage();
  });
  window.addEventListener("sinauu:cloud-sync-error", () => {
    storageMode = "error";
    labelStorage();
  });
  window.addEventListener("sinauu:cloud-sync-offline", () => {
    storageMode = "offline";
    labelStorage();
  });
  init();
})();

/* Keep the new dashboard rail in sync with the existing learning state renderer. */
(() => {
  const syncDashboardSummary = () => {
    const copyText = (sourceId, targetId) => {
      const source = document.getElementById(sourceId);
      const target = document.getElementById(targetId);
      if (source && target) target.textContent = source.textContent;
    };
    copyText("metric-mastered", "rail-mastered");
    copyText("metric-due", "rail-due");
    copyText("metric-today", "rail-today");

    const rawPercent = document.getElementById("goal-percent")?.textContent || "0%";
    const percent = Math.max(0, Math.min(100, Number.parseInt(rawPercent, 10) || 0));
    const label = document.getElementById("dashboard-progress-value");
    const ring = document.getElementById("dashboard-progress-ring");
    if (label) label.textContent = percent + "%";
    if (ring) ring.style.background = `conic-gradient(var(--sage-deep) ${percent * 3.6}deg, #dfe3d9 0deg)`;
  };
  syncDashboardSummary();
  const sources = ["metric-mastered", "metric-due", "metric-today", "goal-percent"];
  const observer = new MutationObserver(syncDashboardSummary);
  sources.forEach((id) => {
    const node = document.getElementById(id);
    if (node) observer.observe(node, { childList: true, characterData: true, subtree: true });
  });
  window.addEventListener("pageshow", syncDashboardSummary);
})();
