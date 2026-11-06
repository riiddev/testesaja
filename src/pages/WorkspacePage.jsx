import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar.jsx";
import { AppTopbar } from "../components/layout/AppTopbar.jsx";
import { VocabGrid } from "../features/vocabulary/VocabGrid.jsx";
import { StudySession } from "../features/study/StudySession.jsx";
import { GrammarGrid } from "../features/grammar/GrammarGrid.jsx";
import { GrammarDetail } from "../features/grammar/GrammarDetail.jsx";
import { QuizRunner } from "../features/quiz/QuizRunner.jsx";
import { ReadingLibrary } from "../features/reading/ReadingLibrary.jsx";
import { AdventureHub } from "../features/adventure/AdventureHub.jsx";
import { ReviewQueue } from "../features/review/ReviewQueue.jsx";
import { ProgressStats } from "../features/progress/ProgressStats.jsx";
import { ProfileView } from "../features/profile/ProfileView.jsx";
import { MissionsView } from "../features/missions/MissionsView.jsx";
import { ContextMatching } from "../features/matching/ContextMatching.jsx";
import { SettingsPanel } from "../features/settings/SettingsPanel.jsx";
import { CollectionView } from "../features/collection/CollectionView.jsx";
import { KanciMascot } from "../components/mascot/KanciMascot.jsx";
import { WidgetDeck } from "../components/widgets/WidgetDeck.jsx";
import { useUserProfile } from "../hooks/useUserProfile.js";
import { useProgressSync } from "../hooks/useProgressSync.js";

// Static dataset imports
import vocabData from "../data/vocabulary.json";
import grammarData from "../data/grammar.json";
import habitData from "../data/habit-reading-library.json";
import storiesData from "../data/adventure/stories.json";
import dialoguesData from "../data/adventure/dialogues.json";
import listeningData from "../data/adventure/listening.json";
import pronunciationData from "../data/adventure/pronunciation.json";

export function WorkspacePage() {
  const { view: routeView } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = routeView || "overview";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sinau_sidebar_collapsed") === "true";
    } catch (e) {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sinau_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState(null);
  const [quizTopic, setQuizTopic] = useState(null);
  const [activeStudyWord, setActiveStudyWord] = useState(() => location.state?.word || null);

  const {
    progressMap,
    isSyncing,
    syncError,
    recordWordReview,
    getWordStatus
  } = useProgressSync();

  const vocabulary = vocabData.entries || [];
  const userProfile = useUserProfile({ vocabulary, progressMap });
  const grammarTopics = grammarData.topics || [];
  const habitPassages = habitData.passages || [];
  const stories = storiesData.stories || [];
  const dialogues = dialoguesData.dialogues || [];
  const listening = listeningData.exercises || [];
  const pronunciation = pronunciationData.exercises || [];

  const viewTitles = {
    overview: "Beranda Belajar",
    vocabulary: "Daftar Kosakata",
    missions: "Misi Harian",
    matching: "Matching Konteks Kalimat",
    study: "Latihan Kosakata",
    grammar: "Kurikulum Grammar",
    quiz: "Kuis Interaktif",
    reading: "Materi Bacaan",
    adventure: "Cerita & Dialog",
    petualangan: "Cerita & Dialog",
    review: "Spaced Review & Jurnal",
    progress: "Profil & Progres Belajar",
    profile: "Profil & Progres Belajar",
    collection: "Koleksi & Kanci",
    koleksi: "Koleksi & Kanci",
    settings: "Pengaturan Akun"
  };

  const handleStartStudy = (word) => {
    setActiveStudyWord(word);
    navigate("/belajar/study");
  };

  const handleStartQuiz = (topic) => {
    setQuizTopic(topic);
    navigate("/belajar/quiz");
  };

  const handleNextStudyWord = () => {
    const next = vocabulary.find((w) => !progressMap[w.id]) || vocabulary[0];
    setActiveStudyWord(next);
  };

  // Metrik Overview
  const masteredCount = vocabulary.filter((w) => getWordStatus(w.id) === "mastered").length;
  const dueCount = vocabulary.filter((w) => getWordStatus(w.id) === "review_due").length;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div className="app-content" id="app-content">
        {/* Topbar */}
        <AppTopbar
          title={viewTitles[currentView] || "Ruang Belajar"}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSyncing={isSyncing}
          syncError={syncError}
          coins={userProfile.profile.coins ?? 0}
          level={userProfile.calculatedLevel || 1}
        />

        {/* Workspace Body */}
        <div className="workspace-body">
          {/* VIEW 1: OVERVIEW */}
          {currentView === "overview" && (
            <section className="view-section is-active" id="view-overview">
              {/* WIDGET DECK SUITE */}
              <WidgetDeck
                vocabulary={vocabulary}
                userProfile={userProfile}
                progressMap={progressMap}
                onRecordWordReview={recordWordReview}
                onNavigate={(targetView) => navigate(`/belajar/${targetView}`)}
              />

              <div className="card card-tint-sand" style={{ padding: "var(--space-8)", marginBottom: "var(--space-8)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-6)", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 360px" }}>
                  <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, color: "var(--color-text-secondary)" }}>
                    Sapaan Kanci
                  </span>
                  <h2 style={{ fontSize: "var(--text-3xl)", margin: "4px 0 var(--space-2)" }}>
                    Halo, {userProfile.profile.displayName || "Pelajar Sinau"}!
                  </h2>
                  <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)", maxWidth: "560px", lineHeight: 1.6 }}>
                    Selesaikan misi dan review kata hari ini untuk menjaga ritme ingatan serta mengumpulkan Sinau Coin.
                  </p>
                  <button
                    className="btn btn-primary btn-lg"
                    id="overview-quick-start"
                    type="button"
                    onClick={() => {
                      const dueWord = vocabulary.find((w) => getWordStatus(w.id) === "review_due");
                      const wordToStudy = dueWord || vocabulary.find((w) => !progressMap[w.id]) || vocabulary[0];
                      handleStartStudy(wordToStudy);
                    }}
                  >
                    Lanjutkan Belajar Sekarang
                  </button>
                </div>

                <div style={{ flex: "0 0 auto", margin: "0 auto" }}>
                  <KanciMascot
                    expression="happy"
                    equippedOutfit={userProfile.equippedOutfit}
                    size="lg"
                    dialogue="Yuk mulai latihan hari ini!"
                  />
                </div>
              </div>

              <div className="stats-grid">
                <div className="card stat-card">
                  <span className="stat-label">Kata Dikuasai</span>
                  <span className="stat-value" id="stat-mastered">{masteredCount}</span>
                  <span className="stat-desc">Memenuhi kriteria mastery & review berulang</span>
                </div>

                <div className="card stat-card">
                  <span className="stat-label">Perlu Review</span>
                  <span className="stat-value" id="stat-due">{dueCount}</span>
                  <span className="stat-desc">Waktunya diulang hari ini (Spaced Repetition)</span>
                </div>

                <div className="card stat-card">
                  <span className="stat-label">Target Hari Ini</span>
                  <span className="stat-value" id="stat-goal">0/10</span>
                  <span className="stat-desc">Kata baru dipelajari hari ini</span>
                </div>

                <div className="card stat-card">
                  <span className="stat-label">Total Corpus</span>
                  <span className="stat-value">2.971</span>
                  <span className="stat-desc">Oxford 3000 American English</span>
                </div>
              </div>

              {/* Level Progress Trackers */}
              <div className="card card-tint-slate" style={{ padding: "var(--space-6)" }}>
                <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
                  Progres Penguasaan Level CEFR
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  {[
                    { id: "A1", label: "Level A1 (Beginner)", total: 892 },
                    { id: "A2", label: "Level A2 (Elementary)", total: 792 },
                    { id: "B1", label: "Level B1 (Intermediate)", total: 689 },
                    { id: "B2", label: "Level B2 (Upper Intermediate)", total: 597 }
                  ].map((lvl) => {
                    const levelWords = vocabulary.filter((w) => w.level === lvl.id);
                    const levelMastered = levelWords.filter((w) => getWordStatus(w.id) === "mastered").length;
                    const pct = Math.round((levelMastered / lvl.total) * 100);

                    return (
                      <div key={lvl.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "4px" }}>
                          <span>{lvl.label}</span>
                          <span id={`lvl-text-${lvl.id.toLowerCase()}`}>{levelMastered}/{lvl.total} ({pct}%)</span>
                        </div>
                        <div className="study-progress-track" style={{ marginBottom: 0 }}>
                          <div
                            className="study-progress-fill"
                            id={`lvl-fill-${lvl.id.toLowerCase()}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* VIEW 2: VOCABULARY */}
          {currentView === "vocabulary" && (
            <section className="view-section is-active" id="view-vocabulary">
              <VocabGrid
                vocabulary={vocabulary}
                progressMap={progressMap}
                onStartStudy={handleStartStudy}
              />
            </section>
          )}

          {/* VIEW: MISSIONS */}
          {currentView === "missions" && (
            <section className="view-section is-active" id="view-missions">
              <MissionsView />
            </section>
          )}

          {/* VIEW: CONTEXT MATCHING */}
          {currentView === "matching" && (
            <section className="view-section is-active" id="view-matching">
              <ContextMatching
                vocabulary={vocabulary}
              />
            </section>
          )}

          {/* VIEW 3: STUDY / 3-STAGE PRACTICE */}
          {currentView === "study" && (
            <section className="view-section is-active" id="view-study">
              <StudySession
                word={activeStudyWord}
                onFinish={() => navigate("/belajar/vocabulary")}
                onNextWord={handleNextStudyWord}
                onRecordReview={recordWordReview}
              />
            </section>
          )}

          {/* VIEW 4: GRAMMAR */}
          {currentView === "grammar" && (
            <section className="view-section is-active" id="view-grammar">
              {selectedGrammarTopic ? (
                <GrammarDetail
                  topic={selectedGrammarTopic}
                  onBack={() => setSelectedGrammarTopic(null)}
                  onStartQuiz={handleStartQuiz}
                  userProfileHook={userProfile}
                />
              ) : (
                <GrammarGrid
                  topics={grammarTopics}
                  onSelectTopic={setSelectedGrammarTopic}
                />
              )}
            </section>
          )}

          {/* VIEW 5: QUIZ */}
          {currentView === "quiz" && (
            <section className="view-section is-active" id="view-quiz">
              <QuizRunner
                topic={quizTopic || grammarTopics[0]}
                onFinish={() => navigate("/belajar/grammar")}
                onRetry={setQuizTopic}
              />
            </section>
          )}

          {/* VIEW 6: READING */}
          {currentView === "reading" && (
            <section className="view-section is-active" id="view-reading">
              <ReadingLibrary
                passages={habitPassages}
                onRecordWordReview={recordWordReview}
                userProfileHook={userProfile}
              />
            </section>
          )}

          {/* VIEW 7: ADVENTURE */}
          {(currentView === "adventure" || currentView === "petualangan") && (
            <section className="view-section is-active" id="view-adventure">
              <AdventureHub
                userProfileHook={userProfile}
                onRecordWordReview={recordWordReview}
                stories={stories}
                dialogues={dialogues}
                listening={listening}
                pronunciation={pronunciation}
              />
            </section>
          )}

          {/* VIEW 8: REVIEW */}
          {currentView === "review" && (
            <section className="view-section is-active" id="view-review">
              <ReviewQueue
                vocabulary={vocabulary}
                progressMap={progressMap}
                onStartStudy={handleStartStudy}
              />
            </section>
          )}

          {/* VIEW 9: PROGRESS & PROFILE */}
          {(currentView === "progress" || currentView === "profile") && (
            <section className="view-section is-active" id="view-progress">
              <ProfileView
                vocabulary={vocabulary}
                progressMap={progressMap}
                userProfileHook={userProfile}
              />
            </section>
          )}

          {/* VIEW 11: COLLECTION & KANCI */}
          {(currentView === "collection" || currentView === "koleksi") && (
            <section className="view-section is-active" id="view-collection">
              <CollectionView userProfileHook={userProfile} />
            </section>
          )}

          {/* VIEW 10: SETTINGS */}
          {currentView === "settings" && (
            <section className="view-section is-active" id="view-settings">
              <SettingsPanel />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
