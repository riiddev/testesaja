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
  let words = [], topics = [], state, db = null, storageMode = "loading";
  let view = "overview", selectedWord = null, activeStudy = null, activeTopic = null, listLimit = 100;
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
  function fmtDate(d, opts) { return new Intl.DateTimeFormat("id-ID", opts || { day:"2-digit", month:"short" }).format(d); }
  function uid() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8); }
  function toast(message) {
    const node = $("#toast"); if (!node) return;
    node.textContent = message; node.classList.add("is-visible");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("is-visible"), 3000);
  }
  function labelStorage() {
    const el = $("#storage-indicator"); if (!el) return;
    el.classList.toggle("is-fallback", storageMode !== "indexedDB");
    $("span", el).textContent = storageMode === "indexedDB" ? "Tersimpan di perangkat" : storageMode === "localStorage" ? "Penyimpanan cadangan" : "Penyimpanan terbatas";
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
    s.wordProgress = raw.wordProgress && typeof raw.wordProgress === "object" && !Array.isArray(raw.wordProgress) ? raw.wordProgress : {};
    s.favorites = Array.isArray(raw.favorites) ? raw.favorites.filter(x => typeof x === "string").slice(0,10000) : [];
    s.grammarProgress = raw.grammarProgress && typeof raw.grammarProgress === "object" && !Array.isArray(raw.grammarProgress) ? raw.grammarProgress : {};
    s.events = Array.isArray(raw.events) ? raw.events.filter(x => x && typeof x === "object").slice(-5000) : [];
    s.history = Array.isArray(raw.history) ? raw.history.filter(x => x && typeof x === "object").slice(-1000) : [];
    s.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString();
    return s;
  }
  async function loadState() {
    try {
      db = await openDB();
      const raw = await readDB(db);
      state = raw ? sanitize(raw) : freshState();
      storageMode = "indexedDB";
      if (!raw) await writeDB(db, state);
    } catch (_) {
      db = null; storageMode = "localStorage";
      try {
        const raw = localStorage.getItem(FALLBACK);
        state = raw ? sanitize(JSON.parse(raw)) : freshState();
        if (!raw) localStorage.setItem(FALLBACK, JSON.stringify(state));
      } catch (_) {
        storageMode = "unavailable"; state = freshState();
      }
    }
    root.dataset.theme = state.settings.theme; labelStorage();
  }
  async function save() {
    state.updatedAt = new Date().toISOString();
    try {
      if (storageMode === "indexedDB" && db) { await writeDB(db,state); labelStorage(); return true; }
      localStorage.setItem(FALLBACK,JSON.stringify(state)); storageMode = "localStorage"; labelStorage(); return true;
    } catch (_) {
      try { localStorage.setItem(FALLBACK,JSON.stringify(state)); storageMode = "localStorage"; labelStorage(); return true; }
      catch (_) { storageMode = "unavailable"; labelStorage(); toast("Browser tidak dapat menyimpan progres. Coba ekspor backup."); return false; }
    }
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
  function canStudyWord(w){return !!(w&&w.studyReady&&w.meaning&&w.example);}
  async function loadDatasets() {
    const paths=["A1","A2","B1","B2","UNCLASSIFIED"].map(level=>"/data/oxford3000/"+level+".json.gz.b64");
    const requests=await Promise.all([
      fetch("/data/vocabulary.json",{cache:"no-cache"}),
      fetch("/data/grammar.json",{cache:"no-cache"}),
      ...paths.map(loadGzipBase64),
      loadGzipBase64("/data/oxford3000/editorial-overrides.json.gz.b64")
    ]);
    if(!requests[0].ok||!requests[1].ok)throw new Error("Dataset kosakata dasar atau grammar tidak bisa dimuat.");
    const vd=await requests[0].json(),gd=await requests[1].json(),corpora=requests.slice(2,7),editorial=requests[7];
    if(!Array.isArray(vd.entries)||!Array.isArray(gd.topics)||corpora.some(c=>!Array.isArray(c.entries))||!Array.isArray(editorial.entries))throw new Error("Bentuk dataset tidak sesuai skema.");
    // The compressed editorial bundle contains high-frequency A1/A2 entries added to the original starter set.
    vd.entries=vd.entries.concat(editorial.entries);
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
  function setView(next) {
    if (!$('#view-' + next)) return;
    view = next;
    $$(".view").forEach(el => el.classList.toggle("is-visible",el.dataset.view === next));
    $$(".side-link").forEach(el => el.classList.toggle("is-active",el.dataset.viewTarget === next));
    const label = {overview:"RINGKASAN",vocabulary:"KOSAKATA",grammar:"GRAMMAR",review:"REVIEW",progress:"PROGRES",study:"LATIHAN KATA"};
    $("#breadcrumb-current").textContent = label[next] || next.toUpperCase();
    if (next === "overview") renderOverview();
    if (next === "vocabulary") renderVocabulary();
    if (next === "grammar") renderGrammar();
    if (next === "review") renderReview();
    if (next === "progress") renderProgress();
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
    $("#today-label").textContent = new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long"}).format(now).toUpperCase();
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
    $("#dataset-disclaimer").textContent=words.filter(w=>w.isOxford3000).length.toLocaleString("id-ID")+" headword Oxford 3000 + "+words.filter(w=>!w.isOxford3000).length+" kata starter tambahan. Entri tanpa arti dan contoh tidak dihitung sebagai materi siap-latih.";
    const suggestions=[];
    dueWords().slice(0,2).forEach(w=>suggestions.push({type:"REVIEW",title:w.word,description:w.meaning,wordId:w.id}));
    topics.filter(t=>!(state.grammarProgress[t.id]&&state.grammarProgress[t.id].attempts)).slice(0,2).forEach(t=>suggestions.push({type:"GRAMMAR",title:t.title,description:t.summary,topicId:t.id}));
    words.filter(w=>canStudyWord(w)&&statusOf(w)==="new").slice(0,3).forEach(w=>suggestions.push({type:"WORD",title:w.word,description:w.meaning,wordId:w.id}));
    $("#resume-list").innerHTML=suggestions.slice(0,4).map(x=>'<div class="resume-item"><span class="resume-type">'+esc(x.type)+'</span><div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p></div><button class="resume-action" type="button" '+(x.wordId?'data-study-word="'+esc(x.wordId)+'"':'data-open-topic="'+esc(x.topicId)+'"')+'>Mulai ↗</button></div>').join("") || '<div class="empty-state">Materi yang tersedia sudah pernah dicoba. Pilih topik lain.</div>';
  }
  function renderVocabulary(resetList=true) {
    if(resetList)listLimit=100;
    const topicSelect=$("#topic-filter"),old=topicSelect.value;
    const topicOptions=Array.from(new Set(words.flatMap(w=>w.topics||[]))).sort();
    topicSelect.innerHTML='<option value="all">Semua topik</option>'+topicOptions.map(t=>'<option value="'+esc(t)+'">'+esc(t.replace(/-/g," "))+'</option>').join("");
    if(topicOptions.includes(old))topicSelect.value=old;
    const oxfordCount=words.filter(w=>w.isOxford3000).length,readyCount=words.filter(canStudyWord).length,extraCount=words.length-oxfordCount;
    $("#source-note").innerHTML='<span aria-hidden="true">i</span> <span><strong>'+oxfordCount.toLocaleString("id-ID")+' headword Oxford 3000</strong> tersedia, plus '+extraCount+' kata starter. '+readyCount.toLocaleString("id-ID")+' kata sudah punya arti dan contoh untuk dilatih; entri lain tetap bisa dicari, tetapi belum membuka sesi belajar.</span>';
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
    more.textContent="Tampilkan "+Math.min(100,filtered.length-shown.length)+" kata berikutnya ↓ · "+(filtered.length-shown.length).toLocaleString("id-ID")+" tersisa";
    if(selectedWord&&shown.some(w=>w.id===selectedWord))renderWordDetail(selectedWord);
    else if(shown.length){selectedWord=shown[0].id;renderWordDetail(selectedWord);$$(".vocab-row").forEach(b=>b.classList.toggle("is-selected",b.dataset.selectWord===selectedWord));}
    else $("#word-detail").innerHTML='<div class="detail-empty"><span class="detail-empty-mark">Aa</span><h2>Belum ada hasil</h2><p>Coba ubah kata pencarian atau filter.</p></div>';
  }
  function renderWordDetail(id) {
    const w=words.find(x=>x.id===id);if(!w)return;
    const p=state.wordProgress[id],evidence=p?p.skillEvidence:{},ready=canStudyWord(w),si=ready?statusInfo[statusOf(w)]:{label:"BELUM SIAP",cls:"status-incomplete"};
    const exampleHtml=w.example?'<div class="detail-example"><p>'+esc(w.example)+'</p>'+(w.translation?'<p class="translation">'+esc(w.translation)+'</p>':'<p class="translation">Terjemahan contoh belum tersedia.</p>')+'</div>':'<p class="study-unavailable">Contoh penggunaan belum tersedia. Kata ini masih dapat dicari, tetapi belum bisa dilatih.</p>';
    const hasUnreviewedContext=(w.contextVariants||[]).some(v=>v.translation&&v.translationStatus&&v.translationStatus!=="human-reviewed"&&v.translationStatus!=="curated");
    const noteHtml=!ready?'<div class="content-status-note">Entri ini termasuk daftar headword sumber, tetapi materi latihannya belum lengkap. Sesi belajar baru dibuka setelah arti dan contoh penggunaan dapat dipakai.</div>':(w.translationStatus==="machine-generated-unreviewed"?'<div class="content-status-note">Terjemahan contoh berasal dari korpus kamus atau terjemahan mesin dan belum ditinjau satu per satu.</div>':(w.translationStatus==="assistant-curated-draft"?'<div class="content-status-note">Arti dan terjemahan ini sudah dikurasi sebagai draf editorial SinauuEnglish, tetapi belum diverifikasi secara independen oleh penutur manusia.</div>':(hasUnreviewedContext?'<div class="content-status-note">Beberapa contoh tambahan dan terjemahannya berasal dari korpus kamus atau draf editorial yang belum diverifikasi satu per satu.</div>':"")));
    const variants=(w.contextVariants||[]).slice(0,3);
    const variantHtml=variants.length?'<p class="detail-section-label">CONTOH TAMBAHAN</p><div class="detail-note">'+variants.map(v=>'<p>'+esc(v.sentence)+(v.translation?'<br><span>'+esc(v.translation)+'</span>':'')+'</p>').join("")+'</div>':"";
    const defHtml=w.definitionEn?'<p class="detail-section-label">ENGLISH DEFINITION · REFERENCE</p><p class="definition-note">'+esc(w.definitionEn)+'</p>':"";
    $("#word-detail").innerHTML='<div class="detail-meta"><span>'+esc(w.level||"Belum diklasifikasikan")+' / '+esc((w.partOfSpeech||"unclassified").toUpperCase())+'</span><span class="'+si.cls+'">'+si.label+'</span></div>'+
      '<div class="detail-word-row"><h2>'+esc(w.word)+'<span>.</span></h2><button class="audio-button" id="detail-speak" type="button" aria-label="Dengarkan '+esc(w.word)+'">♪</button></div>'+
      '<p class="detail-pronunciation">'+esc(w.ipa||"IPA belum tersedia")+(w.forms&&w.forms.length?" · "+esc(w.forms.map(x=>x.form||x.label).join(" · ")):"")+'</p>'+
      '<p class="detail-meaning">'+esc(w.meaning||"Arti Bahasa Indonesia belum tersedia.")+'</p>'+defHtml+'<p class="detail-section-label">CONTOH PENGGUNAAN</p>'+exampleHtml+variantHtml+
      (w.collocations&&w.collocations.length?'<p class="detail-section-label">COLLOCATIONS</p><div class="collocation-list">'+w.collocations.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div>':"")+
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
    $("#study-session-tag").textContent=activeStudy.mode==="review"?"SCHEDULED SPACED REVIEW":"VOCABULARY PRACTICE";
    setView("study");renderStudy();
  }
  function contextQuestion(w,p) {
    const tried=new Set(p.contextQuestionIds||[]),original=w.context;
    if(original&&original.id&&original.prompt&&Array.isArray(original.options)&&Number.isInteger(original.answer)&&!tried.has(original.id))
      return {id:original.id,prompt:original.prompt,options:original.options,answer:original.answer,explanation:original.explanation||"Perhatikan makna kata di dalam konteks."};
    const next=(w.contextVariants||[]).find(v=>v.id&&v.sentence&&!tried.has(v.id));
    const sentence=(next&&next.sentence)||w.example||"",id=(next&&next.id)||w.id+"-example-context";
    const correct=(w.acceptedMeanings||[]).find(Boolean)||(w.meaning||"").split(/[;；]/)[0].trim();
    const candidates=words.filter(x=>x.id!==w.id&&x.meaning).map(x=>(x.acceptedMeanings||[]).find(Boolean)||(x.meaning||"").split(/[;；]/)[0].trim()).filter(x=>x&&norm(x)!==norm(correct));
    const unique=Array.from(new Map(candidates.map(x=>[norm(x),x])).values());
    const seed=w.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0)+tried.size;
    const distractors=[0,1].map(offset=>unique[(seed+offset)%Math.max(1,unique.length)]).filter(Boolean);
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
    $("#study-container").innerHTML='<div class="study-step-meta"><span>'+esc(w.level)+' / '+stages[i].toUpperCase()+'</span><span>LANGKAH '+(i+1)+' DARI 3</span></div><div class="study-step-track"><span style="width:'+pct+'%"></span></div><article class="study-card"><p class="study-level">'+esc(w.partOfSpeech.toUpperCase())+' · '+esc((w.topics||[]).join(" / ").toUpperCase())+'</p><h1>'+esc(w.word)+'<em>.</em></h1><p class="study-ipa">'+esc(w.ipa||"Pronunciation not provided")+'</p>'+body+'</article>';
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
    $("#study-container").innerHTML='<article class="study-card study-complete"><span class="study-complete-mark">'+(passed?"✓":"↻")+'</span><p class="eyebrow">SESI SELESAI · '+activeStudy.stepResults.filter(Boolean).length+'/3 LANGKAH LOLOS</p><h1>'+(passed?"Sesi selesai.":"Masih ada yang perlu dilatih.")+'</h1><p>'+esc(message)+'</p><div class="study-evidence-summary"><span class="'+(p.skillEvidence.recall?"done":"")+'">'+(p.skillEvidence.recall?"✓":"○")+' Recall arti</span><span class="'+(p.skillEvidence.context?"done":"")+'">'+(p.skillEvidence.context?"✓":"○")+' Konteks berbeda</span><span class="'+(p.skillEvidence.production?"done":"")+'">'+(p.skillEvidence.production?"✓":"○")+' Produksi + self-check</span><span>'+(p.reviewSuccesses||0)+'/3 review berjeda</span></div><p class="study-small-note">Status sekarang: <strong>'+si.label+'</strong>. Jawaban benar dalam satu sesi tidak langsung memberi mastery.</p><div class="study-complete-actions"><button class="primary-action" id="study-another" type="button">Pilih kata lain ↗</button><button class="secondary-action" id="study-review" type="button">Lihat jadwal review</button></div></article>';
    $("#study-another").addEventListener("click",()=>setView("vocabulary"));$("#study-review").addEventListener("click",()=>setView("review"));
  }
  function renderGrammar() {
    $("#grammar-count").textContent=topics.length+" topik";$("#nav-grammar-count").textContent=topics.length;
    $("#grammar-topic-list").innerHTML=topics.map(t=>{
      const p=state.grammarProgress[t.id],n=Object.keys((p&&p.answers)||{}).length;
      return '<button class="topic-button '+(activeTopic===t.id?"is-active":"")+'" data-topic-id="'+esc(t.id)+'" type="button"><span class="topic-code">'+esc(t.level)+'</span><span><strong>'+esc(t.title)+'</strong><small>'+n+'/'+t.questions.length+' soal dicoba</small></span></button>';
    }).join("");
    if(!activeTopic||!topics.some(t=>t.id===activeTopic))activeTopic=topics[0]?.id;
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
    $("#lesson-panel").innerHTML='<div class="lesson-head-meta"><span>'+esc(t.level)+' / '+esc(t.category.toUpperCase())+'</span><span>'+t.estimatedMinutes+' MENIT</span></div><h2>'+esc(t.title)+'</h2><p class="lesson-summary">'+esc(t.summary)+'</p><div class="lesson-body"><h3>Penjelasan</h3><p>'+esc(t.explanation)+'</p><h3>Pola kalimat</h3><div class="pattern-list">'+patterns+'</div><h3>Contoh dan terjemahan</h3><div class="lesson-examples">'+examples+'</div><h3>Kesalahan yang sering terjadi</h3><div class="mistake-list">'+mistakes+'</div><div class="checkpoint"><strong>Checkpoint.</strong> '+esc(t.checkpoint)+'</div></div><div class="lesson-quiz"><div class="lesson-quiz-heading"><h3>Latihan khusus topik ini</h3><span>'+unique+'/'+t.questions.length+' soal unik dicoba</span></div><div id="lesson-question-container">'+lessonQuestion(t,ui)+'</div><p class="lesson-progress-note">Akurasi semua percobaan: '+(p.attempts?p.correct+"/"+p.attempts+" benar ("+Math.round(p.correct/p.attempts*100)+"%)":"belum ada percobaan")+'. Ini bukan status mastery grammar.</p></div>';
    bindGrammar(t);
  }
  function lessonQuestion(t,ui) {
    if(ui.index>=t.questions.length)return '<div class="quiz-end"><p class="eyebrow">SESI TOPIK SELESAI</p><h3>'+ui.sessionCorrect+'/'+t.questions.length+' benar pada sesi ini.</h3><p>Jawaban tersimpan. Kamu bisa mengulang topik; percobaan sebelumnya tetap ada.</p><button type="button" class="secondary-action" id="restart-topic">Ulangi topik ↻</button></div>';
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
      ui.result={correct,explanation:q.explanation,expected:q.options[q.answer]};renderLesson(t.id);
    }));
    $("#grammar-answer-form")?.addEventListener("submit",async e=>{
      e.preventDefault();if(ui.result)return;const q=t.questions[ui.index],ans=$("#grammar-typed-answer").value.trim(),accepted=q.accepted||[],correct=accepted.some(x=>norm(x)===norm(ans));
      await recordGrammar(t,q,correct,ans,accepted.join(" / "));if(correct)ui.sessionCorrect++;
      ui.result={correct,explanation:q.explanation,expected:accepted.join(" / ")};renderLesson(t.id);
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
    await save();
  }
  function renderReview() {
    const due=dueWords().sort((a,b)=>new Date(state.wordProgress[a.id].nextReviewAt)-new Date(state.wordProgress[b.id].nextReviewAt));
    $("#review-due-total").textContent=due.length;
    $("#review-success-total").textContent=Object.values(state.wordProgress).reduce((n,p)=>n+(p.reviewHistory||[]).filter(x=>x.correct).length,0);
    $("#nav-review-count").textContent=due.length;
    $("#review-list").innerHTML=due.length?due.map(w=>'<div class="review-row"><span class="review-due-label">JATUH TEMPO</span><div><h3>'+esc(w.word)+' · '+esc(w.level)+'</h3><p>'+esc(w.meaning)+' · '+(state.wordProgress[w.id].reviewSuccesses||0)+'/3 review beruntun</p></div><button type="button" data-review-word="'+esc(w.id)+'">Mulai review →</button></div>').join(""):'<div class="review-empty"><h2>Belum ada review yang jatuh tempo.</h2><p>Setelah kamu mempelajari kata, jadwal review akan muncul di sini. Jadwal memakai hari yang benar-benar berlalu; membuka halaman berulang kali tidak mempercepatnya.</p><button class="primary-action" type="button" data-view-target="vocabulary">Pelajari kata baru ↗</button></div>';
  }
  function renderProgress() {
    const stats=levelStats();
    $("#progress-levels").innerHTML=LEVELS.map(l=>levelRow(l,stats[l],true)).join("");
    $("#grammar-progress-list").innerHTML=topics.map(t=>{
      const p=state.grammarProgress[t.id]||{attempts:0,correct:0,answers:{}},n=Object.keys(p.answers||{}).length,score=p.attempts?Math.round(p.correct/p.attempts*100):null;
      return '<div class="grammar-progress-row"><span class="topic-code">'+esc(t.level)+'</span><div><strong>'+esc(t.title)+'</strong><p>'+n+'/'+t.questions.length+' soal unik dicoba · '+p.attempts+' percobaan total</p></div><span class="grammar-score">'+(score===null?"Belum dicoba":score+"% akurasi")+'</span></div>';
    }).join("");
    const history=state.history.slice(0,18);
    $("#history-list").innerHTML=history.length?history.map(x=>'<div class="history-row"><time>'+esc(fmtDate(new Date(x.at),{day:"2-digit",month:"short"}))+' · '+esc(new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(new Date(x.at)))+'</time><div><strong>'+esc((x.type==="vocabulary"?"Kosakata: ":"Grammar: ")+x.title)+'</strong><small>'+esc(x.detail||"")+'</small></div><span class="history-result">'+(x.correct===true?"BENAR":x.correct===false?"PERLU ULANG":"")+'</span></div>').join(""):'<div class="empty-state">Belum ada aktivitas. Latihan pertamamu akan tercatat di sini.</div>';
  }
  function exportBackup() {
    let extraLearning={};try{extraLearning=JSON.parse(localStorage.getItem("sinauu-extra-learning-v1")||"{}");}catch(_){}
    const backup=Object.assign({product:"SinauuEnglish",exportedAt:new Date().toISOString(),extraLearning:extraLearning},state);
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="sinauuenglish-backup-"+dayKey()+".json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    $("#backup-status").textContent="Backup dibuat dari data lokal.";
  }
  async function importBackup(file) {
    if(!file)return;
    try {
      if(file.size>10*1024*1024)throw new Error("Ukuran backup maksimal 10 MB.");
      const parsed=JSON.parse(await file.text());
      if(parsed.product&&parsed.product!=="SinauuEnglish")throw new Error("File bukan backup SinauuEnglish.");
      const safe=sanitize(parsed);
      if(!confirm("Pulihkan backup? Progres lokal saat ini akan diganti."))return;
      state=safe;if(parsed.extraLearning&&typeof parsed.extraLearning==="object"){try{localStorage.setItem("sinauu-extra-learning-v1",JSON.stringify(parsed.extraLearning));window.sinauuExtraLearningRestore?.(parsed.extraLearning);}catch(_){}}root.dataset.theme=state.settings.theme;await save();
      renderDate();renderOverview();renderVocabulary();renderGrammar();renderReview();renderProgress();
      $("#backup-status").textContent="Backup berhasil dipulihkan.";toast("Progres berhasil dipulihkan.");
    }catch(e){$("#backup-status").textContent=e.message||"JSON tidak valid.";}
    finally{$("#import-backup").value="";}
  }
  function bindEvents() {
    document.addEventListener("click",async e=>{
      const viewBtn=e.target.closest("[data-view-target]");
      if(viewBtn){setView(viewBtn.dataset.viewTarget);return;}
      const wordBtn=e.target.closest("[data-select-word]");
      if(wordBtn){selectedWord=wordBtn.dataset.selectWord;renderVocabulary(false);return;}
      const studyBtn=e.target.closest("[data-start-word],[data-study-word]");
      if(studyBtn){startStudy(studyBtn.dataset.startWord||studyBtn.dataset.studyWord,"learn");return;}
      const fav=e.target.closest("[data-favorite-word]");
      if(fav){const id=fav.dataset.favoriteWord;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):state.favorites.concat(id);await save();renderVocabulary(false);toast(state.favorites.includes(id)?"Kata disimpan ke favorit.":"Kata dihapus dari favorit.");return;}
      const topic=e.target.closest("[data-topic-id]");
      if(topic){activeTopic=topic.dataset.topicId;renderGrammar();return;}
      const openTopic=e.target.closest("[data-open-topic]");
      if(openTopic){activeTopic=openTopic.dataset.openTopic;setView("grammar");return;}
      const review=e.target.closest("[data-review-word]");
      if(review){startStudy(review.dataset.reviewWord,"review");return;}
    });
    $("#vocab-search").addEventListener("input",()=>renderVocabulary());
    $("#vocab-load-more").addEventListener("click",()=>{listLimit+=100;renderVocabulary(false);});
    $("#level-filter").addEventListener("change",renderVocabulary);
    $("#topic-filter").addEventListener("change",renderVocabulary);
    $("#favorites-only").addEventListener("change",renderVocabulary);
    $("#theme-toggle").addEventListener("click",()=>setTheme(root.dataset.theme==="dark"?"light":"dark"));
    $("#edit-goal").addEventListener("click",()=>{$("#daily-goal-input").value=String(state.settings.dailyGoal||10);$("#goal-dialog").showModal();});
    $("#goal-form").addEventListener("submit",async e=>{e.preventDefault();state.settings.dailyGoal=Number($("#daily-goal-input").value)||10;await save();$("#goal-dialog").close();renderOverview();toast("Target harian diperbarui.");});
    $("#export-backup").addEventListener("click",exportBackup);
    $("#import-backup").addEventListener("change",e=>void importBackup(e.target.files&&e.target.files[0]));
    $("#exit-study").addEventListener("click",()=>setView(activeStudy&&activeStudy.mode==="review"?"review":"vocabulary"));
    $("#speak-word")?.addEventListener("click",()=>speak("notice"));
    document.addEventListener("keydown",e=>{
      if(e.key==="/"&&view==="vocabulary"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){e.preventDefault();$("#vocab-search").focus();}
      if(e.key==="Escape")$("#goal-dialog")?.close();
    });
  }
  async function init() {
    bindEvents();renderDate();
    try {
      await loadDatasets();await loadState();await setTheme(state.settings.theme);
      renderDate();renderOverview();renderVocabulary();renderGrammar();renderReview();renderProgress();
      const stale=Object.keys(state.wordProgress).filter(id=>!words.some(w=>w.id===id));
      if(stale.length)toast(stale.length+" catatan kata lama tersimpan tetapi tidak ada dalam korpus versi ini.");
    } catch(e) {
      $("#load-error").hidden=false;$("#load-error").textContent="Ruang belajar gagal dimuat: "+(e.message||"kesalahan tidak diketahui")+" Periksa folder data/ lalu muat ulang.";
      console.error(e);
    }
  }
  init();
})();