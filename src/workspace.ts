/**
 * SINAUENGLISH V2 — Interactive Workspace Application Controller
 * Manages views, vocabulary browsing, study flow, grammar, reading, adventure, and local state.
 */

import { StorageService, AppState, createFreshState } from "./lib/storage.ts";
import {
  getWordStatus,
  calculateNextReview,
  ensureWordProgress,
  STATUS_META,
  WordStatus
} from "./lib/mastery.ts";
import { exportBackup, importBackup, triggerDownload } from "./lib/backup.ts";
import { speechService } from "./lib/speech.ts";

interface VocabEntry {
  id: string;
  word: string;
  level: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  translation: string;
  ipa?: string;
  definition?: string;
  context?: {
    prompt: string;
    options: string[];
    answer: number;
    explanation?: string;
  };
}

interface GrammarTopic {
  id: string;
  title: string;
  level: string;
  summary: string;
  estimatedMinutes: number;
  explanation: string;
  checkpoint: string;
  patterns: string[];
  examples: Array<{ en: string; id: string }>;
  mistakes: Array<{ wrong: string; right: string; why: string }>;
  questions: Array<{
    id: string;
    type: "multiple-choice" | "typed";
    prompt: string;
    options?: string[];
    answer?: number;
    accepted?: string[];
    explanation: string;
  }>;
}

class WorkspaceApp {
  private storage = new StorageService();
  private state: AppState = createFreshState();
  
  private vocabulary: VocabEntry[] = [];
  private grammarTopics: GrammarTopic[] = [];
  private habitPassages: any[] = [];
  private readingSkills: any[] = [];
  private stories: any[] = [];
  private dialogues: any[] = [];
  private listeningExercises: any[] = [];
  private pronunciationExercises: any[] = [];

  private currentView: string = "overview";
  private currentLevelFilter: string = "all";
  private currentSearchQuery: string = "";
  private currentVocabPage: number = 1;
  private readonly vocabPageSize: number = 60;

  // Study Session State
  private activeStudy: {
    word: VocabEntry;
    stage: 1 | 2 | 3;
    isCorrect?: boolean;
  } | null = null;

  // Active Grammar / Quiz state
  private activeGrammarTopic: GrammarTopic | null = null;
  private activeQuiz: {
    topic: GrammarTopic;
    questionIndex: number;
    score: number;
  } | null = null;

  async init(): Promise<void> {
    this.setupTheme();
    this.setupNavigation();
    this.setupEventListeners();

    // Load user state from local-first storage
    try {
      this.state = await this.storage.init();
      this.updateStorageIndicator();
    } catch (e) {
      console.warn("Could not load state, using fresh:", e);
      this.state = createFreshState();
    }

    // Load static datasets
    await this.loadDatasets();

    // Check URL hash for direct view navigation
    const hash = window.location.hash.replace("#", "");
    if (hash && ["overview", "vocabulary", "study", "grammar", "quiz", "reading", "adventure", "review", "progress", "settings"].includes(hash)) {
      this.switchView(hash);
    } else {
      this.switchView("overview");
    }

    this.renderOverview();
  }

  private setupTheme(): void {
    const root = document.documentElement;
    delete root.dataset.theme;
    localStorage.removeItem("sinauu-theme");
    this.state.settings.theme = "light";
  }

  private setupNavigation(): void {
    const sidebarLinks = document.querySelectorAll<HTMLButtonElement>(".sidebar-link");
    sidebarLinks.forEach(link => {
      link.addEventListener("click", () => {
        const targetView = link.dataset.view;
        if (targetView) this.switchView(targetView);
      });
    });

    // Mobile sidebar toggle
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("nav-backdrop");

    mobileBtn?.addEventListener("click", () => {
      sidebar?.classList.toggle("is-open");
      backdrop?.classList.toggle("is-visible");
    });

    backdrop?.addEventListener("click", () => {
      sidebar?.classList.remove("is-open");
      backdrop?.classList.remove("is-visible");
    });
  }

  private setupEventListeners(): void {
    // Vocab search and filter
    const searchInput = document.getElementById("vocab-search") as HTMLInputElement;
    searchInput?.addEventListener("input", (e) => {
      this.currentSearchQuery = (e.target as HTMLInputElement).value.trim().toLowerCase();
      this.currentVocabPage = 1;
      this.renderVocabulary();
    });

    const filterChips = document.querySelectorAll<HTMLButtonElement>(".filter-chips .chip");
    filterChips.forEach(chip => {
      chip.addEventListener("click", () => {
        filterChips.forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        this.currentLevelFilter = chip.dataset.level || "all";
        this.currentVocabPage = 1;
        this.renderVocabulary();
      });
    });

    // Settings actions
    const goalSelect = document.getElementById("setting-goal") as HTMLSelectElement;
    goalSelect?.addEventListener("change", () => {
      this.state.settings.dailyGoal = Number(goalSelect.value) || 10;
      this.storage.save(this.state);
      this.showToast("Target harian diperbarui: " + this.state.settings.dailyGoal + " kata");
      this.renderOverview();
    });

    const exportBtn = document.getElementById("btn-export-backup");
    exportBtn?.addEventListener("click", () => {
      const json = exportBackup(this.state);
      const filename = `sinauenglish-backup-${new Date().toISOString().split("T")[0]}.json`;
      triggerDownload(json, filename);
      this.showToast("File backup berhasil diunduh!");
    });

    const importInput = document.getElementById("file-import-backup") as HTMLInputElement;
    importInput?.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const { state } = importBackup(text);
        this.state = state;
        await this.storage.save(this.state);
        this.showToast("Backup berhasil dipulihkan!");
        this.renderOverview();
        this.renderVocabulary();
      } catch (err: any) {
        alert("Gagal memulihkan cadangan: " + err.message);
      }
      importInput.value = "";
    });

    const resetBtn = document.getElementById("btn-reset-data");
    resetBtn?.addEventListener("click", async () => {
      if (confirm("Apakah kamu yakin ingin mereset semua kemajuan belajar? Tindakan ini tidak dapat dibatalkan.")) {
        this.state = createFreshState();
        await this.storage.save(this.state);
        this.showToast("Semua data telah direset.");
        this.renderOverview();
        this.renderVocabulary();
      }
    });

    // Modal close
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalOverlay = document.getElementById("modal-overlay");
    modalCloseBtn?.addEventListener("click", () => this.closeModal());
    modalOverlay?.addEventListener("click", (e) => {
      if (e.target === modalOverlay) this.closeModal();
    });
  }

  private updateStorageIndicator(): void {
    const dot = document.querySelector(".storage-dot") as HTMLElement;
    const text = document.getElementById("storage-status-text");
    if (dot && text) {
      if (this.storage.mode === "indexedDB") {
        dot.style.backgroundColor = "var(--color-success)";
        text.textContent = "Tersimpan Aman (IndexedDB)";
      } else {
        dot.style.backgroundColor = "var(--color-accent-gold)";
        text.textContent = "Penyimpanan Cadangan (localStorage)";
      }
    }
  }

  private showToast(message: string): void {
    const toast = document.getElementById("toast-notice");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  public switchView(viewName: string): void {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Update active sidebar link
    document.querySelectorAll(".sidebar-link").forEach(link => {
      const target = (link as HTMLElement).dataset.view;
      link.classList.toggle("is-active", target === viewName);
    });

    // Update topbar title
    const topbarTitle = document.getElementById("topbar-title");
    const viewLabels: Record<string, string> = {
      overview: "Beranda Belajar",
      vocabulary: "Daftar Kosakata",
      study: "Latihan Kosakata",
      grammar: "Kurikulum Grammar",
      quiz: "Kuis Interaktif",
      reading: "Materi Bacaan",
      adventure: "Everyday Adventure",
      review: "Spaced Review & Jurnal",
      progress: "Statistik & Progres",
      settings: "Pengaturan & Cadangan"
    };
    if (topbarTitle) topbarTitle.textContent = viewLabels[viewName] || "Ruang Belajar";

    // Switch visible view section
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.toggle("is-active", sec.id === `view-${viewName}`);
    });

    // View-specific renders
    if (viewName === "overview") this.renderOverview();
    if (viewName === "vocabulary") this.renderVocabulary();
    if (viewName === "grammar") this.renderGrammar();
    if (viewName === "reading") this.renderReading();
    if (viewName === "adventure") this.renderAdventure();
    if (viewName === "review") this.renderReview();
    if (viewName === "progress") this.renderProgress();

    // Close mobile sidebar if open
    document.getElementById("app-sidebar")?.classList.remove("is-open");
    document.getElementById("nav-backdrop")?.classList.remove("is-visible");
  }

  private async loadDatasets(): Promise<void> {
    try {
      const [vRes, gRes, hRes, rRes, stRes, diaRes, lisRes, proRes] = await Promise.all([
        fetch("/data/vocabulary.json"),
        fetch("/data/grammar.json"),
        fetch("/data/habit-reading-library.json"),
        fetch("/data/reading-lessons.json"),
        fetch("/data/adventure/stories.json"),
        fetch("/data/adventure/dialogues.json"),
        fetch("/data/adventure/listening.json"),
        fetch("/data/adventure/pronunciation.json")
      ]);

      const [vData, gData, hData, rData, stData, diaData, lisData, proData] = await Promise.all([
        vRes.json(),
        gRes.json(),
        hRes.json(),
        rRes.json(),
        stRes.json(),
        diaRes.json(),
        lisRes.json(),
        proRes.json()
      ]);

      this.vocabulary = vData.entries || [];
      this.grammarTopics = gData.topics || [];
      this.habitPassages = hData.passages || [];
      this.readingSkills = rData.skills || [];
      this.stories = stData.stories || [];
      this.dialogues = diaData.dialogues || [];
      this.listeningExercises = lisData.exercises || [];
      this.pronunciationExercises = proData.exercises || [];

      // Update sidebar counts
      const vocabCount = document.getElementById("sidebar-vocab-count");
      if (vocabCount) vocabCount.textContent = "2.971";

      const grammarCount = document.getElementById("sidebar-grammar-count");
      if (grammarCount) grammarCount.textContent = String(this.grammarTopics.length);

      const readingCount = document.getElementById("sidebar-reading-count");
      if (readingCount) readingCount.textContent = String(this.habitPassages.length);

      this.updateReviewCount();
    } catch (e) {
      console.error("Error loading datasets:", e);
    }
  }

  private updateReviewCount(): void {
    const dueCount = this.getDueWords().length;
    const reviewBadge = document.getElementById("sidebar-review-count");
    if (reviewBadge) reviewBadge.textContent = String(dueCount);
  }

  private getDueWords(): VocabEntry[] {
    return this.vocabulary.filter(w => {
      const p = this.state.wordProgress[w.id];
      if (!p) return false;
      const status = getWordStatus(p);
      return status === "due" || status === "weak";
    });
  }

  /* --------------------------------------------------------------------------
     1. OVERVIEW / DASHBOARD VIEW
     -------------------------------------------------------------------------- */
  private renderOverview(): void {
    const totalWords = 2971;
    const masteredWords = this.vocabulary.filter(w => {
      const p = this.state.wordProgress[w.id];
      return p && getWordStatus(p) === "mastered";
    }).length;

    const dueWords = this.getDueWords().length;
    const goal = this.state.settings.dailyGoal || 10;
    const studiedToday = Object.values(this.state.wordProgress).filter(p => {
      const today = new Date().toISOString().split("T")[0];
      return p.studiedDates && p.studiedDates.includes(today);
    }).length;

    // Update Stats
    const elMastered = document.getElementById("stat-mastered");
    if (elMastered) elMastered.textContent = String(masteredWords);

    const elDue = document.getElementById("stat-due");
    if (elDue) elDue.textContent = String(dueWords);

    const elGoal = document.getElementById("stat-goal");
    if (elGoal) elGoal.textContent = `${studiedToday}/${goal}`;

    // Level Progress Breakdown
    const levels = ["A1", "A2", "B1", "B2"];
    levels.forEach(lvl => {
      const levelWords = this.vocabulary.filter(w => w.level === lvl);
      const levelMastered = levelWords.filter(w => {
        const p = this.state.wordProgress[w.id];
        return p && getWordStatus(p) === "mastered";
      }).length;

      const totalLvl = levelWords.length || 1;
      const pct = Math.round((levelMastered / totalLvl) * 100);

      const fill = document.getElementById(`lvl-fill-${lvl.toLowerCase()}`);
      if (fill) fill.style.width = `${pct}%`;

      const text = document.getElementById(`lvl-text-${lvl.toLowerCase()}`);
      if (text) text.textContent = `${levelMastered}/${totalLvl} (${pct}%)`;
    });

    // Quick Action button
    const quickStartBtn = document.getElementById("overview-quick-start");
    quickStartBtn?.replaceWith(quickStartBtn.cloneNode(true));
    document.getElementById("overview-quick-start")?.addEventListener("click", () => {
      const due = this.getDueWords();
      if (due.length > 0) {
        this.startStudySession(due[0]);
      } else {
        const nextWord = this.vocabulary.find(w => !this.state.wordProgress[w.id]) || this.vocabulary[0];
        if (nextWord) this.startStudySession(nextWord);
      }
    });
  }

  /* --------------------------------------------------------------------------
     2. VOCABULARY VIEW
     -------------------------------------------------------------------------- */
  private renderVocabulary(): void {
    const container = document.getElementById("vocab-list");
    if (!container) return;

    let filtered = this.vocabulary;

    if (this.currentLevelFilter !== "all") {
      filtered = filtered.filter(w => w.level === this.currentLevelFilter);
    }

    if (this.currentSearchQuery) {
      filtered = filtered.filter(w =>
        w.word.toLowerCase().includes(this.currentSearchQuery) ||
        (w.meaning && w.meaning.toLowerCase().includes(this.currentSearchQuery))
      );
    }

    const totalCountEl = document.getElementById("vocab-total-count");
    if (totalCountEl) totalCountEl.textContent = `${filtered.length} kata ditemukan`;

    const limit = this.currentVocabPage * this.vocabPageSize;
    const paginated = filtered.slice(0, limit);

    container.innerHTML = "";

    paginated.forEach(w => {
      const p = this.state.wordProgress[w.id];
      const status = getWordStatus(p);
      const meta = STATUS_META[status];

      const card = document.createElement("div");
      card.className = "card card-interactive word-card";
      card.innerHTML = `
        <div class="word-card-top">
          <span class="badge ${meta.className}">${meta.label}</span>
          <span class="badge badge-cefr">${w.level}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 class="word-headword">${w.word}</h3>
          <button class="btn btn-secondary btn-icon vocab-audio-btn" type="button" aria-label="Audio ${w.word}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
        </div>
        <div class="word-ipa">${w.ipa || w.partOfSpeech || ""}</div>
        <div class="word-meaning">${w.meaning}</div>
        <div class="word-example">${w.example || ""}</div>
      `;

      card.querySelector(".vocab-audio-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        speechService.speak(w.word);
      });

      card.addEventListener("click", () => this.openWordModal(w));

      container.appendChild(card);
    });

    const loadMoreBtn = document.getElementById("vocab-load-more");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = limit < filtered.length ? "inline-flex" : "none";
      loadMoreBtn.onclick = () => {
        this.currentVocabPage++;
        this.renderVocabulary();
      };
    }
  }

  private openWordModal(w: VocabEntry): void {
    const modal = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const p = this.state.wordProgress[w.id];
    const status = getWordStatus(p);
    const meta = STATUS_META[status];

    content.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
        <div style="display: flex; gap: var(--space-2);">
          <span class="badge ${meta.className}">${meta.label}</span>
          <span class="badge badge-cefr">${w.level}</span>
          <span class="badge">${w.partOfSpeech}</span>
        </div>
        <button class="btn btn-secondary btn-icon" id="modal-audio-btn" type="button" aria-label="Audio">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </button>
      </div>

      <h2 style="font-size: var(--text-3xl); margin-bottom: var(--space-1);">${w.word}<span style="color: var(--color-accent-gold);">.</span></h2>
      <p style="font-family: var(--font-mono); color: var(--color-text-secondary); margin-bottom: var(--space-4);">${w.ipa || ""}</p>

      <div style="background-color: var(--color-bg-subtle); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
        <strong style="display: block; font-size: var(--text-xs); text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px;">Makna Indonesia:</strong>
        <p style="font-size: var(--text-base); font-weight: 700; margin: 0;">${w.meaning}</p>
      </div>

      ${w.example ? `
      <div style="border-left: 3px solid var(--color-accent-gold); padding-left: var(--space-4); margin-bottom: var(--space-6);">
        <p style="font-weight: 600; margin-bottom: 2px;">${w.example}</p>
        <p style="color: var(--color-text-secondary); font-size: var(--text-sm); font-style: italic; margin: 0;">${w.translation || ""}</p>
      </div>` : ""}

      <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-6);">
        <button class="btn btn-secondary" id="modal-close-action" type="button">Tutup</button>
        <button class="btn btn-primary" id="modal-study-action" type="button">Latih Kata Ini ↗</button>
      </div>
    `;

    content.querySelector("#modal-audio-btn")?.addEventListener("click", () => {
      speechService.speak(w.word);
    });

    content.querySelector("#modal-close-action")?.addEventListener("click", () => this.closeModal());
    content.querySelector("#modal-study-action")?.addEventListener("click", () => {
      this.closeModal();
      this.startStudySession(w);
    });

    modal.classList.add("is-open");
  }

  private closeModal(): void {
    document.getElementById("modal-overlay")?.classList.remove("is-open");
  }

  /* --------------------------------------------------------------------------
     3. STUDY / 3-STAGE PRACTICE FLOW
     -------------------------------------------------------------------------- */
  public startStudySession(w: VocabEntry): void {
    this.activeStudy = {
      word: w,
      stage: 1
    };
    this.switchView("study");
    this.renderStudy();
  }

  private renderStudy(): void {
    const container = document.getElementById("study-view-container");
    if (!container || !this.activeStudy) return;

    const { word, stage } = this.activeStudy;
    const progress = ensureWordProgress(this.state.wordProgress, word.id);

    container.innerHTML = "";

    const studyBox = document.createElement("div");
    studyBox.className = "study-box";

    // Header & Stage Progress
    const stagePct = stage === 1 ? 33 : stage === 2 ? 66 : 100;
    const stageTitles = ["Recall Makna", "Pahami Konteks", "Konfirmasi Ingatan"];

    studyBox.innerHTML = `
      <div class="card study-card card-tint-sand">
        <div class="study-step-header">
          <span class="badge badge-gold">TAHAP ${stage} DARI 3 · ${stageTitles[stage - 1].toUpperCase()}</span>
          <span class="badge badge-cefr">${word.level}</span>
        </div>

        <div class="study-progress-track">
          <div class="study-progress-fill" style="width: ${stagePct}%;"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
          <h2 style="font-size: var(--text-4xl);">${word.word}<span style="color: var(--color-accent-gold);">.</span></h2>
          <button class="btn btn-secondary btn-icon" id="study-audio-btn" type="button" aria-label="Audio">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
        </div>

        <p style="font-family: var(--font-mono); color: var(--color-text-secondary); margin-bottom: var(--space-6);">${word.ipa || word.partOfSpeech || ""}</p>

        <div id="study-stage-content"></div>
      </div>
    `;

    studyBox.querySelector("#study-audio-btn")?.addEventListener("click", () => {
      speechService.speak(word.word);
    });

    const stageContent = studyBox.querySelector("#study-stage-content");
    if (!stageContent) return;

    if (stage === 1) {
      // Stage 1: Recall Meaning
      stageContent.innerHTML = `
        <div style="background-color: var(--color-bg-surface); border: var(--border-sm); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; margin-bottom: var(--space-6);">
          <p style="font-size: var(--text-md); font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-4);">
            Cobalah mengingat arti kata ini sebelum membuka jawaban:
          </p>
          <div id="recall-answer" style="display: none; font-size: var(--text-xl); font-weight: 700; color: var(--color-accent-navy); margin-bottom: var(--space-4);">
            ${word.meaning}
          </div>
          <button class="btn btn-secondary" id="btn-reveal-meaning" type="button">Buka Arti Kata 👁</button>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-outline" id="btn-skip-study" type="button">Kembali ke Daftar</button>
          <button class="btn btn-primary" id="btn-next-stage-2" type="button">Lanjut ke Konteks ↗</button>
        </div>
      `;

      stageContent.querySelector("#btn-reveal-meaning")?.addEventListener("click", () => {
        const ans = stageContent.querySelector("#recall-answer") as HTMLElement;
        if (ans) ans.style.display = "block";
        progress.skillEvidence.recall = true;
      });

      stageContent.querySelector("#btn-skip-study")?.addEventListener("click", () => {
        this.switchView("vocabulary");
      });

      stageContent.querySelector("#btn-next-stage-2")?.addEventListener("click", () => {
        this.activeStudy!.stage = 2;
        this.renderStudy();
      });

    } else if (stage === 2) {
      // Stage 2: Context Question
      const context = word.context || {
        prompt: `Lengkapi kalimat: "${word.example || 'This is an example.'}"`,
        options: [word.meaning, "arti lain yang kurang tepat", "lawan kata"],
        answer: 0
      };

      stageContent.innerHTML = `
        <p style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-4);">${context.prompt}</p>
        <div class="study-options">
          ${context.options.map((opt, i) => `
            <button class="study-option-btn" data-idx="${i}" type="button">${opt}</button>
          `).join("")}
        </div>
        <div id="context-feedback" style="margin-top: var(--space-4); font-weight: 700;"></div>
      `;

      const optionBtns = stageContent.querySelectorAll<HTMLButtonElement>(".study-option-btn");
      optionBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          optionBtns.forEach(b => (b.disabled = true));
          const idx = Number(btn.dataset.idx);
          const feedback = stageContent.querySelector("#context-feedback") as HTMLElement;

          if (idx === context.answer) {
            btn.classList.add("is-correct");
            feedback.textContent = "✓ Jawaban Benar! Pemahaman konteks berhasil.";
            feedback.style.color = "var(--color-success)";
            progress.skillEvidence.context = true;
            this.activeStudy!.isCorrect = true;
          } else {
            btn.classList.add("is-wrong");
            optionBtns[context.answer]?.classList.add("is-correct");
            feedback.textContent = "✗ Jawaban kurang tepat. Perhatikan konteks kalimat di atas.";
            feedback.style.color = "var(--color-danger)";
            this.activeStudy!.isCorrect = false;
          }

          setTimeout(() => {
            this.activeStudy!.stage = 3;
            this.renderStudy();
          }, 1400);
        });
      });

    } else if (stage === 3) {
      // Stage 3: Summary & Next SRS interval calculation
      const isCorrect = this.activeStudy.isCorrect !== false;
      calculateNextReview(progress, isCorrect);
      this.storage.save(this.state);
      this.updateReviewCount();

      stageContent.innerHTML = `
        <div style="text-align: center; padding: var(--space-6) 0;">
          <div style="font-size: 48px; margin-bottom: var(--space-2);">${isCorrect ? "🎉" : "📚"}</div>
          <h3 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">
            ${isCorrect ? "Sesi Selesai dengan Baik!" : "Tetap Semangat, Latihan Lagi Besok!"}
          </h3>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto var(--space-6);">
            Status kata: <strong>${STATUS_META[getWordStatus(progress)].label}</strong>.<br>
            Jadwal review berikutnya: <strong>${new Date(progress.nextReviewAt!).toLocaleDateString("id-ID")}</strong>.
          </p>

          <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-secondary" id="study-back-btn" type="button">Ke Ruang Belajar</button>
            <button class="btn btn-primary" id="study-next-btn" type="button">Lanjut Kata Berikutnya ↗</button>
          </div>
        </div>
      `;

      stageContent.querySelector("#study-back-btn")?.addEventListener("click", () => {
        this.switchView("overview");
      });

      stageContent.querySelector("#study-next-btn")?.addEventListener("click", () => {
        const nextWord = this.vocabulary.find(w => !this.state.wordProgress[w.id]) || this.vocabulary[0];
        this.startStudySession(nextWord);
      });
    }

    container.appendChild(studyBox);
  }

  /* --------------------------------------------------------------------------
     4. GRAMMAR VIEW & LESSON DETAIL
     -------------------------------------------------------------------------- */
  private renderGrammar(): void {
    const container = document.getElementById("grammar-grid");
    if (!container) return;

    container.innerHTML = "";

    this.grammarTopics.forEach(t => {
      const card = document.createElement("div");
      card.className = "card card-interactive";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
          <span class="badge badge-navy">${t.level}</span>
          <span style="font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 700;">⏱ ${t.estimatedMinutes} MENIT</span>
        </div>
        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2);">${t.title}</h3>
        <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); line-height: 1.5;">${t.summary}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <span class="badge badge-gold">${t.questions.length} SOAL KUIS</span>
          <span class="btn btn-secondary btn-sm">Buka Pelajaran ↗</span>
        </div>
      `;

      card.addEventListener("click", () => this.openGrammarTopic(t));
      container.appendChild(card);
    });
  }

  private openGrammarTopic(t: GrammarTopic): void {
    this.activeGrammarTopic = t;
    const view = document.getElementById("grammar-detail-container");
    const grid = document.getElementById("grammar-grid-wrap");
    if (!view || !grid) return;

    grid.style.display = "none";
    view.style.display = "block";

    view.innerHTML = `
      <div class="card card-tint-slate" style="margin-bottom: var(--space-6);">
        <button class="btn btn-secondary btn-sm" id="grammar-back-btn" style="margin-bottom: var(--space-4);">← Kembali ke Daftar Topik</button>
        <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
          <span class="badge badge-navy">${t.level}</span>
          <span class="badge badge-gold">${t.estimatedMinutes} Menit</span>
        </div>
        <h1 style="font-size: var(--text-3xl); margin-bottom: var(--space-4);">${t.title}</h1>
        <p style="font-size: var(--text-md); line-height: 1.6; margin-bottom: var(--space-6);">${t.explanation}</p>

        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-3);">Pola & Rumus:</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-6);">
          ${t.patterns.map(p => `
            <div style="background-color: var(--color-bg-surface); padding: var(--space-3) var(--space-4); border: var(--border-sm); border-radius: var(--radius-md); font-family: var(--font-mono); font-weight: 700;">
              ${p}
            </div>
          `).join("")}
        </div>

        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-3);">Contoh Kalimat:</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6);">
          ${t.examples.map(ex => `
            <div style="background-color: var(--color-bg-surface); padding: var(--space-4); border: var(--border-sm); border-radius: var(--radius-md);">
              <p style="font-weight: 700; margin-bottom: 2px;">${ex.en}</p>
              <p style="color: var(--color-text-secondary); font-size: var(--text-sm); font-style: italic; margin: 0;">${ex.id}</p>
            </div>
          `).join("")}
        </div>

        ${t.mistakes && t.mistakes.length > 0 ? `
        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-3);">Kesalahan Umum (Common Mistakes):</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8);">
          ${t.mistakes.map(m => `
            <div style="background-color: var(--color-tint-rose); padding: var(--space-4); border: var(--border-sm); border-radius: var(--radius-md);">
              <div style="color: var(--color-danger); font-weight: 700; margin-bottom: 2px;">✗ Salah: ${m.wrong}</div>
              <div style="color: var(--color-success); font-weight: 700; margin-bottom: 4px;">✓ Benar: ${m.right}</div>
              <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin: 0;">Alasan: ${m.why}</p>
            </div>
          `).join("")}
        </div>` : ""}

        <div style="text-align: right;">
          <button class="btn btn-primary btn-lg" id="btn-start-grammar-quiz">Mulai Kuis Topik Ini (${t.questions.length} Soal) ↗</button>
        </div>
      </div>
    `;

    view.querySelector("#grammar-back-btn")?.addEventListener("click", () => {
      view.style.display = "none";
      grid.style.display = "block";
    });

    view.querySelector("#btn-start-grammar-quiz")?.addEventListener("click", () => {
      this.startGrammarQuiz(t);
    });
  }

  /* --------------------------------------------------------------------------
     5. QUIZ VIEW
     -------------------------------------------------------------------------- */
  private startGrammarQuiz(t: GrammarTopic): void {
    this.activeQuiz = {
      topic: t,
      questionIndex: 0,
      score: 0
    };
    this.switchView("quiz");
    this.renderQuiz();
  }

  private renderQuiz(): void {
    const container = document.getElementById("quiz-view-container");
    if (!container || !this.activeQuiz) return;

    const { topic, questionIndex, score } = this.activeQuiz;
    const questions = topic.questions;

    if (questionIndex >= questions.length) {
      // Quiz finished
      const pct = Math.round((score / questions.length) * 100);
      container.innerHTML = `
        <div class="card card-tint-sand" style="max-width: 600px; margin: 0 auto; text-align: center; padding: var(--space-10);">
          <div style="font-size: 48px; margin-bottom: var(--space-2);">🏆</div>
          <h2 style="font-size: var(--text-3xl); margin-bottom: var(--space-2);">Kuis Selesai!</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">Topik: <strong>${topic.title}</strong></p>
          <div style="font-size: var(--text-5xl); font-weight: 700; font-family: var(--font-heading); color: var(--color-accent-gold); margin-bottom: var(--space-2);">
            ${score} / ${questions.length}
          </div>
          <p style="font-weight: 600; margin-bottom: var(--space-6);">${pct >= 80 ? "Hebat! Kamu telah menguasai konsep topik ini." : "Bagus! Kamu bisa mengulang materi jika masih ragu."}</p>
          <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-secondary" id="quiz-back-grammar">Kembali ke Grammar</button>
            <button class="btn btn-primary" id="quiz-retry">Ulangi Kuis</button>
          </div>
        </div>
      `;

      container.querySelector("#quiz-back-grammar")?.addEventListener("click", () => this.switchView("grammar"));
      container.querySelector("#quiz-retry")?.addEventListener("click", () => this.startGrammarQuiz(topic));
      return;
    }

    const q = questions[questionIndex];
    container.innerHTML = `
      <div class="card card-tint-sand" style="max-width: 680px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); border-bottom: var(--border-sm); padding-bottom: var(--space-3);">
          <span class="badge badge-gold">SOAL ${questionIndex + 1} DARI ${questions.length}</span>
          <span style="font-weight: 700; font-family: var(--font-heading);">SKOR: ${score}</span>
        </div>

        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-6);">${q.prompt}</h3>

        <div class="study-options">
          ${(q.options || []).map((opt, i) => `
            <button class="study-option-btn quiz-opt-btn" data-idx="${i}" type="button">${opt}</button>
          `).join("")}
        </div>

        <div id="quiz-feedback" style="margin-top: var(--space-6); font-weight: 600;"></div>
      </div>
    `;

    const optBtns = container.querySelectorAll<HTMLButtonElement>(".quiz-opt-btn");
    optBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        optBtns.forEach(b => (b.disabled = true));
        const idx = Number(btn.dataset.idx);
        const feedback = container.querySelector("#quiz-feedback") as HTMLElement;

        if (idx === q.answer) {
          btn.classList.add("is-correct");
          feedback.textContent = `✓ Benar! ${q.explanation}`;
          feedback.style.color = "var(--color-success)";
          this.activeQuiz!.score++;
        } else {
          btn.classList.add("is-wrong");
          if (q.answer !== undefined) optBtns[q.answer]?.classList.add("is-correct");
          feedback.textContent = `✗ Kurang tepat. ${q.explanation}`;
          feedback.style.color = "var(--color-danger)";
        }

        setTimeout(() => {
          this.activeQuiz!.questionIndex++;
          this.renderQuiz();
        }, 1800);
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. READING & HABIT LIBRARY VIEW
     -------------------------------------------------------------------------- */
  private renderReading(): void {
    const container = document.getElementById("reading-passages-list");
    if (!container) return;

    container.innerHTML = "";

    this.habitPassages.slice(0, 30).forEach(p => {
      const card = document.createElement("div");
      card.className = "card card-interactive";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
          <span class="badge badge-sage">${p.category || "General"}</span>
          <span style="font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 700;">⏱ ${p.estimatedMinutes} MENIT</span>
        </div>
        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2);">${p.title}</h3>
        <p style="font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
          ${p.paragraphs ? p.paragraphs[0].slice(0, 120) + "..." : ""}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <span style="font-size: var(--text-xs); font-family: var(--font-mono);">${p.wordCount} KATA</span>
          <span class="btn btn-secondary btn-sm">Baca Teks ↗</span>
        </div>
      `;

      card.addEventListener("click", () => this.openReadingPassage(p));
      container.appendChild(card);
    });
  }

  private openReadingPassage(p: any): void {
    const modal = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
        <span class="badge badge-sage">${p.category || "HABIT Reading"}</span>
        <span style="font-size: var(--text-xs); font-weight: 700;">⏱ ${p.estimatedMinutes} Menit · ${p.wordCount} Kata</span>
      </div>
      <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-6);">${p.title}</h2>
      <div style="font-size: var(--text-base); line-height: 1.8; color: var(--color-text-primary); margin-bottom: var(--space-8);">
        ${(p.paragraphs || []).map((para: string) => `<p style="margin-bottom: var(--space-4);">${para}</p>`).join("")}
      </div>
      <div style="text-align: right;">
        <button class="btn btn-primary" id="modal-reading-done" type="button">Selesai Membaca ✓</button>
      </div>
    `;

    content.querySelector("#modal-reading-done")?.addEventListener("click", () => {
      this.closeModal();
      this.showToast("Bagus! Kamu telah menyelesaikan bacaan: " + p.title);
    });

    modal.classList.add("is-open");
  }

  /* --------------------------------------------------------------------------
     7. ADVENTURE SERIES (Stories, Dialogues, Listening, Pronunciation)
     -------------------------------------------------------------------------- */
  private renderAdventure(): void {
    const storiesContainer = document.getElementById("adventure-stories-grid");
    if (!storiesContainer) return;

    storiesContainer.innerHTML = "";
    this.stories.forEach(s => {
      const card = document.createElement("div");
      card.className = "card card-interactive card-tint-sand";
      card.innerHTML = `
        <span class="badge badge-gold" style="margin-bottom: var(--space-2);">${s.level} · STORY</span>
        <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-1);">${s.title}</h3>
        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin-bottom: var(--space-3);">${s.subtitle || ""}</p>
        <span class="btn btn-secondary btn-sm" style="margin-top: auto;">Mulai Cerita ↗</span>
      `;
      card.addEventListener("click", () => {
        this.openReadingPassage({
          title: s.title,
          category: `Everyday Story (${s.level})`,
          estimatedMinutes: s.estimatedMinutes || 4,
          wordCount: s.paragraphs ? s.paragraphs.join(" ").split(" ").length : 200,
          paragraphs: s.paragraphs
        });
      });
      storiesContainer.appendChild(card);
    });
  }

  /* --------------------------------------------------------------------------
     8. REVIEW VIEW (Spaced Repetition & Mistake Review)
     -------------------------------------------------------------------------- */
  private renderReview(): void {
    const dueContainer = document.getElementById("review-due-list");
    if (!dueContainer) return;

    const due = this.getDueWords();
    const countEl = document.getElementById("review-total-due");
    if (countEl) countEl.textContent = `${due.length} kata perlu review`;

    if (due.length === 0) {
      dueContainer.innerHTML = `
        <div class="card card-tint-sand" style="text-align: center; padding: var(--space-8);">
          <div style="font-size: 36px; margin-bottom: var(--space-2);">✨</div>
          <h3>Tidak ada review tertunda!</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-4);">Semua kata telah direview sesuai jadwal spaced repetition.</p>
          <button class="btn btn-primary" id="btn-review-new-words">Pelajari Kata Baru ↗</button>
        </div>
      `;
      dueContainer.querySelector("#btn-review-new-words")?.addEventListener("click", () => this.switchView("vocabulary"));
      return;
    }

    dueContainer.innerHTML = "";
    due.forEach(w => {
      const p = this.state.wordProgress[w.id];
      const meta = STATUS_META[getWordStatus(p)];

      const row = document.createElement("div");
      row.className = "card card-interactive";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.marginBottom = "var(--space-3)";
      row.innerHTML = `
        <div>
          <div style="display: flex; gap: var(--space-2); align-items: center; margin-bottom: 2px;">
            <strong style="font-size: var(--text-lg);">${w.word}</strong>
            <span class="badge ${meta.className}">${meta.label}</span>
            <span class="badge badge-cefr">${w.level}</span>
          </div>
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${w.meaning}</span>
        </div>
        <button class="btn btn-primary btn-sm">Review Sekarang ↗</button>
      `;
      row.addEventListener("click", () => this.startStudySession(w));
      dueContainer.appendChild(row);
    });
  }

  /* --------------------------------------------------------------------------
     9. PROGRESS & STATS VIEW
     -------------------------------------------------------------------------- */
  private renderProgress(): void {
    const mastered = this.vocabulary.filter(w => {
      const p = this.state.wordProgress[w.id];
      return p && getWordStatus(p) === "mastered";
    }).length;

    const learning = this.vocabulary.filter(w => {
      const p = this.state.wordProgress[w.id];
      return p && getWordStatus(p) === "learning";
    }).length;

    const elTotal = document.getElementById("progress-total-mastered");
    if (elTotal) elTotal.textContent = String(mastered);

    const elLearning = document.getElementById("progress-total-learning");
    if (elLearning) elLearning.textContent = String(learning);
  }
}

// Bootstrap application on DOM load
window.addEventListener("DOMContentLoaded", () => {
  const app = new WorkspaceApp();
  (window as any).sinauApp = app;
  app.init();
});

