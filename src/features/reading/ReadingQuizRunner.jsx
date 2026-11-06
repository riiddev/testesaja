import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClose,
  IconLightbulb
} from "../../components/common/Icons.jsx";
import React, { useState, useEffect, useMemo } from "react";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";
import "../../styles/reading-quiz.css";

export function ReadingQuizRunner({
  passage,
  quizData,
  onClose,
  onRecordWordReview,
  claimReward,
  equippedOutfit = null
}) {
  const questions = quizData?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassageDrawer, setShowPassageDrawer] = useState(false);
  const [addedSrsWords, setAddedSrsWords] = useState(() => new Set());
  const [rewardFeedback, setRewardFeedback] = useState(null);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (qId, optionIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  // Submit and evaluate quiz
  const handleSubmitQuiz = async () => {
    setIsSubmitted(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);

    // Claim Server-side reward
    if (claimReward) {
      const eventId = `quiz_habit_${passage.id}_${Date.now()}`;
      try {
        const res = await claimReward({
          eventId,
          source: "article_quiz",
          refId: passage.id,
          meta: {
            scorePct,
            correctCount,
            totalQuestions: questions.length
          }
        });
        if (res && res.success) {
          setRewardFeedback({
            earnedXp: res.earnedXp || (scorePct >= 80 ? 30 : 0),
            earnedCoins: res.earnedCoins || (scorePct === 100 ? 20 : 0)
          });
        }
      } catch (err) {
        console.warn("Quiz reward claim error:", err);
      }
    }
  };

  // Score statistics & diagnostic
  const stats = useMemo(() => {
    if (!isSubmitted) return null;

    let correctCount = 0;
    const catMap = {
      "General Info": { correct: 0, total: 0 },
      "Specific Info": { correct: 0, total: 0 },
      "Implied Info": { correct: 0, total: 0 },
      "Vocabulary in Context": { correct: 0, total: 0 }
    };

    questions.forEach((q) => {
      const cat = q.category || "General Info";
      if (!catMap[cat]) catMap[cat] = { correct: 0, total: 0 };
      catMap[cat].total++;

      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
        catMap[cat].correct++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);

    // Weakest category detection
    let weakestCat = null;
    let lowestPct = 100;
    Object.entries(catMap).forEach(([cat, data]) => {
      if (data.total > 0) {
        const pct = Math.round((data.correct / data.total) * 100);
        if (pct < lowestPct) {
          lowestPct = pct;
          weakestCat = cat;
        }
      }
    });

    return {
      correctCount,
      totalCount: questions.length,
      scorePct,
      catMap,
      weakestCat: lowestPct < 80 ? weakestCat : null
    };
  }, [isSubmitted, questions, selectedAnswers]);

  // Handle Add to SRS
  const handleAddToSrs = (targetWord, e) => {
    e.stopPropagation();
    if (!targetWord || addedSrsWords.has(targetWord)) return;

    if (onRecordWordReview) {
      onRecordWordReview(targetWord, "B1", false);
    }

    setAddedSrsWords((prev) => {
      const next = new Set(prev);
      next.add(targetWord);
      return next;
    });
  };

  return (
    <div className="reading-quiz-modal" id="reading-quiz-modal-overlay">
      <div className="reading-quiz-card" role="dialog" aria-modal="true" aria-label="Kuis Pemahaman Artikel">
        {/* HEADER */}
        <div className="reading-quiz-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 800, color: "var(--color-text-secondary)" }}>
                HABIT Reading Quiz
              </span>
              <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                {passage.category || "Umum"}
              </span>
            </div>
            <h3 style={{ fontSize: "var(--text-base)", margin: "2px 0 0", maxWidth: "460px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {passage.title}
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            {/* Split Text Toggle */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowPassageDrawer((prev) => !prev)}
              style={{ fontSize: "var(--text-xs)", minHeight: "36px" }}
              id="toggle-passage-text-btn"
            >
              {showPassageDrawer ? "Sembunyikan Teks ▲" : "Lihat Teks Artikel ▼"}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Tutup kuis"
              id="close-quiz-btn"
              style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px", borderRadius: "50%", padding: 0 }}
            >
              <IconClose size={16} />
            </button>
          </div>
        </div>

        {/* PROGRESS TRACK */}
        {!isSubmitted && (
          <div style={{ padding: "0 var(--space-6)" }}>
            <div className="reading-quiz-progress-track">
              <div
                className="reading-quiz-progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", marginTop: "4px" }}>
              <span>Soal {currentIndex + 1} dari {questions.length}</span>
              <span>{answeredCount} Terjawab</span>
            </div>
          </div>
        )}

        {/* PASSAGE TEXT DRAWER (COLLAPSIBLE REFERENCE) */}
        {showPassageDrawer && (
          <div className="reading-text-drawer" id="reading-text-drawer">
            <h4 style={{ fontSize: "var(--text-sm)", margin: "0 0 var(--space-2)" }}>{passage.title}</h4>
            {(passage.paragraphs || []).map((p, idx) => (
              <p key={idx} style={{ marginBottom: "var(--space-2)" }}>
                <strong style={{ color: "var(--color-text-primary)", marginRight: "6px" }}>[P{idx + 1}]</strong>
                {p}
              </p>
            ))}
          </div>
        )}

        {/* MAIN BODY: ACTIVE QUIZ OR RESULTS */}
        <div className="reading-quiz-body">
          {!isSubmitted ? (
            /* ACTIVE QUESTION VIEW */
            <div>
              <div className="question-meta-row">
                <span className={`category-chip ${currentQ.category?.toLowerCase().split(" ")[0]}`}>
                  {currentQ.category}
                </span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  • {currentQ.subType}
                </span>
              </div>

              <h4 className="quiz-question-title" id="quiz-question-text">
                {currentQ.question}
              </h4>

              <div className="quiz-options-list" role="radiogroup" aria-label="Pilihan jawaban">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  const optionLetters = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`quiz-option-button ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      role="radio"
                      aria-checked={isSelected}
                      id={`option-btn-${idx}`}
                    >
                      <span className="option-badge-key" style={{ color: isSelected ? "#744210" : "var(--color-text-secondary)" }}>
                        {optionLetters[idx]}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-sm)", paddingTop: "var(--space-4)" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  style={{ minHeight: "44px" }}
                >
                  <><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Sebelumnya</>
                </button>

                {isLastQuestion ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitQuiz}
                    disabled={selectedAnswers[currentQ.id] === undefined}
                    id="submit-quiz-btn"
                    style={{ minHeight: "44px" }}
                  >
                    Selesaikan & Lihat Pembahasan
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={selectedAnswers[currentQ.id] === undefined}
                    id="next-question-btn"
                    style={{ minHeight: "44px" }}
                  >
                    <>Berikutnya <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* RESULTS & FULL 4-DIMENSION EXPLANATIONS */
            <div className="quiz-results-card" id="quiz-results-container">
              {/* Mascot celebration or encouragement */}
              <KanciMascot
                expression={stats.scorePct >= 80 ? "celebrating" : "encouraging"}
                equippedOutfit={equippedOutfit}
                size="md"
                dialogue={
                  stats.scorePct === 100
                    ? "Sempurna! Pemahamanmu sangat tajam dan presisi!"
                    : stats.scorePct >= 80
                    ? "Hebat sekali! Kamu menguasai intisari artikel ini!"
                    : "Terus semangat! Pembahasan di bawah akan membantumu memahami detailnya."
                }
              />

              <h3 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-3) 0 var(--space-2)" }}>
                Hasil Kuis Pemahaman
              </h3>

              <div className="quiz-score-circle">
                <div>
                  <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, fontFamily: "var(--font-heading)" }} id="quiz-final-score">
                    {stats.scorePct}%
                  </span>
                  <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                    {stats.correctCount} dari {stats.totalCount} Soal
                  </span>
                </div>
              </div>

              {/* Reward Notification Banner */}
              {rewardFeedback && (rewardFeedback.earnedXp > 0 || rewardFeedback.earnedCoins > 0) && (
                <div
                  className="card card-tint-cream"
                  id="quiz-reward-banner"
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    marginBottom: "var(--space-4)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    border: "1.5px solid #D69E2E"
                  }}
                >
                  <span style={{ fontWeight: 800, color: "#744210", fontSize: "var(--text-sm)" }}>
                    Reward Berhasil Diklaim:
                  </span>
                  {rewardFeedback.earnedXp > 0 && (
                    <span className="scholar-chip chip-gold">+{rewardFeedback.earnedXp} EXP</span>
                  )}
                  {rewardFeedback.earnedCoins > 0 && (
                    <span className="scholar-chip chip-level">+{rewardFeedback.earnedCoins} Sinau Coin</span>
                  )}
                </div>
              )}

              {/* Category Breakdown Grid */}
              <div className="category-breakdown-grid">
                {Object.entries(stats.catMap).map(([cat, data]) => {
                  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                  return (
                    <div key={cat} className="category-stat-box">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                        <span>{cat}</span>
                        <span>{data.correct}/{data.total} ({pct}%)</span>
                      </div>
                      <div style={{ height: "6px", backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-accent-gold)" : "var(--color-danger)"
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weak Category Diagnostic Alert */}
              {stats.weakestCat && (
                <div
                  className="card card-tint-sand"
                  style={{
                    padding: "var(--space-4)",
                    marginBottom: "var(--space-6)",
                    textAlign: "left"
                  }}
                >
                  <h4 style={{ fontSize: "var(--text-sm)", margin: "0 0 4px", fontWeight: 800 }}>
                    <IconLightbulb size={13} style={{ marginRight: 4 }} /> Saran Fokus Belajar: Area {stats.weakestCat}
                  </h4>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {stats.weakestCat === "General Info"
                      ? "Cobalah melatih teknik skimming untuk menangkap gagasan pokok paragraf pembuka dan penutup tanpa terpaku pada detail kecil."
                      : stats.weakestCat === "Specific Info"
                      ? "Gunakan teknik scanning kata kunci pada pertanyaan dan cari letak kalimat pembuktian persis di dalam teks artikel."
                      : stats.weakestCat === "Implied Info"
                      ? "Perhatikan petunjuk konteks tersirat dan nada penulis (tone), jangan berasumsi di luar batasan yang diungkapkan oleh teks."
                      : "Perhatikan fungsi kata dalam kalimat dan hubungannya dengan kata-kata di sekitar konteks paragraf."}
                  </p>
                </div>
              )}

              {/* 4-DIMENSION EXPLANATIONS FOR EACH QUESTION */}
              <h4 style={{ fontSize: "var(--text-lg)", textAlign: "left", margin: "var(--space-6) 0 var(--space-4)" }}>
                Pembahasan Lengkap 4 Dimensi
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} id="quiz-explanations-list">
                {questions.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[q.id];
                  const isCorrect = userAnswer === q.correctIndex;
                  const optionLetters = ["A", "B", "C", "D"];
                  const isVocab = q.category === "Vocabulary in Context";
                  const targetWord = q.targetWord;
                  const isWordAdded = targetWord && addedSrsWords.has(targetWord);

                  return (
                    <article
                      key={q.id}
                      className={`explanation-item ${isCorrect ? "was-correct" : "was-wrong"}`}
                      id={`explanation-card-${q.id}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                        <span className={`category-chip ${q.category?.toLowerCase().split(" ")[0]}`}>
                          {q.category} • {q.subType}
                        </span>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                          {isCorrect ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Jawaban Benar</> : <><IconClose size={12} style={{ marginRight: 3 }} /> Salah (Pilihanmu: {optionLetters[userAnswer]})</>}
                        </span>
                      </div>

                      <h5 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-base)", fontWeight: 700, margin: "var(--space-2) 0 var(--space-3)" }}>
                        {qIdx + 1}. {q.question}
                      </h5>

                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
                        <strong>Jawaban Tepat:</strong> {optionLetters[q.correctIndex]}. {q.options[q.correctIndex]}
                      </div>

                      {/* (a) Jawaban Benar & Bukti Teks */}
                      <div className="explanation-section">
                        <h5 style={{ color: "var(--color-success)" }}>1. Alasan Benar & Bukti Teks</h5>
                        <p style={{ margin: 0 }}>{q.explanation.correctReason}</p>
                      </div>

                      {/* (b) Analisis Jebakan Opsi Lain */}
                      <div className="explanation-section">
                        <h5 style={{ color: "var(--color-danger)" }}>2. Mengapa Opsi Lain Salah (Analisis Jebakan)</h5>
                        <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                          {q.explanation.wrongAnalysis.map((wrongExp, wIdx) => (
                            <li key={wIdx} style={{ marginBottom: "2px" }}>{wrongExp}</li>
                          ))}
                        </ul>
                      </div>

                      {/* (c) Strategi Menjawab */}
                      <div className="explanation-section">
                        <h5 style={{ color: "var(--color-accent-navy)" }}>3. Strategi Mengerjakan Tipe Soal Ini</h5>
                        <p style={{ margin: 0 }}>{q.explanation.readingStrategy}</p>
                      </div>

                      {/* (d) Kata Kunci */}
                      <div className="explanation-section">
                        <h5 style={{ color: "#744210" }}>4. Kata Kunci Penghubung (Keywords)</h5>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {q.explanation.keywords.map((kw, kwIdx) => (
                            <span key={kwIdx} className="scholar-chip chip-neutral" style={{ fontSize: "10px" }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ADD TO SRS BUTTON FOR MISSED VOCABULARY */}
                      {isVocab && !isCorrect && targetWord && (
                        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px dashed var(--border-color)" }}>
                          <button
                            type="button"
                            className={`btn-add-srs ${isWordAdded ? "is-added" : ""}`}
                            onClick={(e) => handleAddToSrs(targetWord, e)}
                            disabled={isWordAdded}
                            id={`add-srs-btn-${targetWord}`}
                          >
                            {isWordAdded ? (
                              <span><IconCheck size={12} style={{ marginRight: 4 }} /> Tersimpan di Antrean Review (SRS)</span>
                            ) : (
                              <span>+ Tambahkan "{targetWord}" ke Review (SRS)</span>
                            )}
                          </button>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                            Kata ini otomatis dijadwalkan dalam siklus ingatan Spaced Repetition (hari ke-1, ke-3, dst).
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Bottom Finish Button */}
              <div style={{ marginTop: "var(--space-8)", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={onClose}
                  id="finish-review-close-btn"
                  style={{ minWidth: "220px" }}
                >
                  Selesai & Kembali ke Perpustakaan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

