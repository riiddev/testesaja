import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClose,
  IconRefresh
} from "../../components/common/Icons.jsx";
import React, { useState, useMemo } from "react";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";
import { api } from "../../services/api.js";

export function GrammarMasteryQuiz({
  topic,
  onClose,
  onSaveProgress,
  claimReward,
  equippedOutfit = null
}) {
  const questions = topic?.finalQuiz || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rewardFeedback, setRewardFeedback] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setRewardFeedback(null);
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitted(true);
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const isMastered = scorePct >= 80;

    // Save to Cloud Progress
    setIsSaving(true);
    try {
      if (onSaveProgress) {
        await onSaveProgress({
          topicId: topic.id,
          practiceDone: true,
          quizScore: scorePct
        });
      } else {
        await api.saveGrammarProgress({
          topicId: topic.id,
          practiceDone: true,
          quizScore: scorePct
        });
      }

      // Claim server-side reward if mastered
      if (isMastered && claimReward) {
        const eventId = `quiz_grammar_${topic.id}_${Date.now()}`;
        const res = await claimReward({
          eventId,
          source: "grammar_quiz",
          refId: topic.id,
          meta: { scorePct, correctCount, totalQuestions: questions.length }
        });
        if (res && res.success) {
          setRewardFeedback({
            earnedXp: res.earnedXp || 25,
            earnedCoins: res.earnedCoins || 15
          });
        }
      }
    } catch (err) {
      console.warn("Failed to save grammar quiz progress:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (!isSubmitted) return null;
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    const scorePct = Math.round((correctCount / questions.length) * 100);
    return {
      correctCount,
      totalCount: questions.length,
      scorePct,
      isMastered: scorePct >= 80
    };
  }, [isSubmitted, questions, selectedAnswers]);

  return (
    <div className="card card-tint-sand" style={{ padding: "var(--space-6) var(--space-8)", marginTop: "var(--space-4)" }} id="grammar-mastery-quiz-card">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", borderBottom: "var(--border-sm)", paddingBottom: "var(--space-3)" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
            Kuis Penguasaan 10 Soal (Ambang 80%)
          </span>
          <h3 style={{ fontSize: "var(--text-lg)", margin: "2px 0 0" }}>
            {topic.title}
          </h3>
        </div>
        {!isSubmitted && (
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            Soal {currentIndex + 1} dari {questions.length}
          </span>
        )}
      </div>

      {/* QUIZ IN PROGRESS */}
      {!isSubmitted ? (
        <div>
          {/* Progress fill */}
          <div style={{ height: "6px", backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-pill)", overflow: "hidden", marginBottom: "var(--space-6)" }}>
            <div
              style={{
                height: "100%",
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                backgroundColor: "var(--color-accent-gold)",
                transition: "width 0.25s ease"
              }}
            />
          </div>

          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-base)", fontWeight: 800, lineHeight: 1.5, marginBottom: "var(--space-6)" }} id="mastery-quiz-question-title">
            {currentIndex + 1}. {currentQ.question}
          </h4>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              const optionLetters = ["A", "B", "C", "D"];

              return (
                <button
                  key={idx}
                  type="button"
                  className={`quiz-option-button ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
                  id={`mastery-option-${idx}`}
                >
                  <span className="option-badge-key" style={{ color: isSelected ? "#744210" : "var(--color-text-secondary)" }}>
                    {optionLetters[idx]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-sm)", paddingTop: "var(--space-4)" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Sebelumnya</>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitQuiz}
                disabled={selectedAnswers[currentQ.id] === undefined}
                id="submit-mastery-quiz-btn"
              >
                Selesaikan Kuis & Uji Penguasaan
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={selectedAnswers[currentQ.id] === undefined}
                id="next-mastery-quiz-btn"
              >
                <>Berikutnya <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ RESULTS & 4-DIMENSION EXPLANATIONS */
        <div style={{ textAlign: "center" }} id="mastery-quiz-results-container">
          <KanciMascot
            expression={stats.isMastered ? "celebrating" : "encouraging"}
            equippedOutfit={equippedOutfit}
            size="md"
            dialogue={
              stats.isMastered
                ? "Luar biasa! Pemahaman tata bahasamu resmi teruji di atas ambang 80%!"
                : "Hampir sampai! Pelajari pembahasan di bawah dan ulangi lagi untuk mencapai 80%."
            }
          />

          <h3 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-3) 0 var(--space-2)" }}>
            {stats.isMastered ? "Status: Topik Dikuasai!" : "Perlu Penguatan Materi"}
          </h3>

          <div className="quiz-score-circle" style={{ borderColor: stats.isMastered ? "var(--color-success)" : "var(--color-danger)" }}>
            <div>
              <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, fontFamily: "var(--font-heading)" }} id="mastery-final-score">
                {stats.scorePct}%
              </span>
              <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                {stats.correctCount} dari {stats.totalCount} Soal Benar
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "var(--space-4)" }}>
            <span className={`mastery-status-pill ${stats.isMastered ? "mastered" : "learning"}`}>
              {stats.isMastered ? "Status: Dikuasai (Mastered)" : "Status: Sedang Dipelajari"}
            </span>
          </div>

          {/* Reward Banner */}
          {rewardFeedback && (
            <div
              className="card card-tint-cream"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-5)",
                border: "1.5px solid #D69E2E",
                marginBottom: "var(--space-6)"
              }}
            >
              <span style={{ fontWeight: 800, color: "#744210", fontSize: "var(--text-sm)" }}>
                Hadiah Penguasaan Topik:
              </span>
              <span className="scholar-chip chip-gold">+{rewardFeedback.earnedXp} EXP</span>
              <span className="scholar-chip chip-level">+{rewardFeedback.earnedCoins} Sinau Coin</span>
            </div>
          )}

          {/* 4-DIMENSION EXPLANATIONS FOR ALL 10 QUESTIONS */}
          <h4 style={{ fontSize: "var(--text-lg)", textAlign: "left", margin: "var(--space-6) 0 var(--space-4)" }}>
            Pembahasan Lengkap 4 Dimensi Soal Kuis
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {questions.map((q, qIdx) => {
              const userAnswer = selectedAnswers[q.id];
              const isCorrect = userAnswer === q.correctIndex;
              const optionLetters = ["A", "B", "C", "D"];

              return (
                <article
                  key={q.id}
                  className={`explanation-item ${isCorrect ? "was-correct" : "was-wrong"}`}
                  id={`grammar-exp-card-${q.id}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                      Soal {qIdx + 1}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                      {isCorrect ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Jawaban Tepat</> : <><IconClose size={12} style={{ marginRight: 3 }} /> Salah (Pilihanmu: {optionLetters[userAnswer] || "-"})</>}
                    </span>
                  </div>

                  <h5 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-sm)", fontWeight: 700, margin: "var(--space-2) 0 var(--space-3)" }}>
                    {q.question}
                  </h5>

                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
                    <strong>Jawaban Tepat:</strong> {optionLetters[q.correctIndex]}. {q.options[q.correctIndex]}
                  </div>

                  {/* 1. Alasan Benar & Bukti Kaidah */}
                  <div className="explanation-section">
                    <h5 style={{ color: "var(--color-success)" }}>1. Alasan Benar & Bukti Kaidah</h5>
                    <p style={{ margin: 0 }}>{q.explanation.correctReason}</p>
                  </div>

                  {/* 2. Analisis Jebakan Opsi Lain */}
                  <div className="explanation-section">
                    <h5 style={{ color: "var(--color-danger)" }}>2. Mengapa Opsi Lain Salah (Analisis Jebakan)</h5>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                      {q.explanation.wrongAnalysis.map((wrongExp, wIdx) => (
                        <li key={wIdx} style={{ marginBottom: "2px" }}>{wrongExp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. Strategi Mengerjakan */}
                  <div className="explanation-section">
                    <h5 style={{ color: "var(--color-accent-navy)" }}>3. Strategi Mengerjakan Tipe Soal Ini</h5>
                    <p style={{ margin: 0 }}>{q.explanation.readingStrategy}</p>
                  </div>

                  {/* 4. Kata Kunci */}
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
                </article>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-4)", marginTop: "var(--space-8)", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-outline btn-md"
              onClick={handleRetake}
              id="retake-grammar-quiz-btn"
            >
              <><IconRefresh size={13} style={{ marginRight: 4 }} /> Ulangi Kuis</>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-md"
              onClick={onClose}
              id="finish-grammar-quiz-btn"
            >
              Kembali ke Modul Grammar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
