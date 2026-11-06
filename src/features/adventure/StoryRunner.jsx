import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClose,
  IconHelp,
  IconLightbulb,
  IconPin,
  IconScroll,
  IconSparkles,
  IconVolume
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";
import { api } from "../../services/api.js";
import "../../styles/story-runner.css";

export function StoryRunner({
  story,
  episode,
  onClose,
  onRecordWordReview,
  claimReward,
  equippedOutfit = null,
  onEpisodeCompleted
}) {
  const [activeStep, setActiveStep] = useState("story"); // "story" | "vocab" | "quiz" | "summary"
  const [showIdMap, setShowIdMap] = useState({});
  const [choiceSelections, setChoiceSelections] = useState({});
  const [addedSrsWords, setAddedSrsWords] = useState(() => new Set());
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState(null);

  if (!episode) return null;

  // Audio Speech Synthesis
  const handleSpeak = (text) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  };

  const toggleTranslate = (lineId) => {
    setShowIdMap((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  };

  const handleSelectChoice = (pointId, option) => {
    setChoiceSelections((prev) => ({
      ...prev,
      [pointId]: option
    }));
  };

  // Add vocab to SRS
  const handleAddToSrs = (word, e) => {
    e.stopPropagation();
    if (!word || addedSrsWords.has(word)) return;

    if (onRecordWordReview) {
      onRecordWordReview(word, "A1", false);
    }

    setAddedSrsWords((prev) => {
      const next = new Set(prev);
      next.add(word);
      return next;
    });
  };

  // Quiz Handling
  const quizQuestions = episode.quiz || [];
  const handleSelectQuizOption = (qId, optionIdx) => {
    if (isQuizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
  };

  // Complete Episode & Claim Reward
  const handleCompleteEpisode = async () => {
    setIsFinishing(true);
    try {
      const res = await api.completeStoryEpisode({
        storyId: story.id,
        episodeId: episode.id
      });

      if (res && res.success) {
        setCompletionFeedback({
          earnedXp: res.data?.earnedXp || 50,
          earnedCoins: res.data?.earnedCoins || 30,
          alreadyCompleted: Boolean(res.alreadyCompleted),
          message: res.message || null
        });

        if (onEpisodeCompleted) {
          onEpisodeCompleted(story.id, episode.id);
        }
      }
    } catch (err) {
      console.warn("Complete episode error:", err);
      setCompletionFeedback({
        error: err.message || "Gagal menyelesaikan episode."
      });
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="story-runner-modal" id="story-runner-overlay">
      <div className="story-runner-card" role="dialog" aria-modal="true" aria-label="Petualangan Cerita">
        {/* HEADER */}
        <div className="story-runner-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span className="scholar-chip chip-gold" style={{ fontSize: "10px", padding: "1px 6px" }}>
                {story.title}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
                • Episode {episode.id} dari {story.totalEpisodes || 10}
              </span>
            </div>
            <h3 style={{ fontSize: "var(--text-base)", margin: "2px 0 0", fontFamily: "var(--font-heading)" }}>
              {episode.title} ({episode.titleEn})
            </h3>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            id="close-story-runner-btn"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0 }}
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* STEPPER NAV */}
        <div style={{ padding: "var(--space-3) var(--space-6) 0" }}>
          <div className="story-nav-steps">
            <button
              type="button"
              className={`story-step-pill ${activeStep === "story" ? "is-active" : ""}`}
              onClick={() => setActiveStep("story")}
              id="step-btn-story"
            >
              1. Adegan Cerita
            </button>
            <button
              type="button"
              className={`story-step-pill ${activeStep === "vocab" ? "is-active" : ""}`}
              onClick={() => setActiveStep("vocab")}
              id="step-btn-vocab"
            >
              2. Kosakata & Grammar
            </button>
            <button
              type="button"
              className={`story-step-pill ${activeStep === "quiz" ? "is-active" : ""}`}
              onClick={() => setActiveStep("quiz")}
              id="step-btn-quiz"
            >
              3. Kuis Episode (5 Soal)
            </button>
            <button
              type="button"
              className={`story-step-pill ${activeStep === "summary" ? "is-active" : ""}`}
              onClick={() => setActiveStep("summary")}
              id="step-btn-summary"
            >
              4. Rangkuman & Selesai
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="story-runner-body">
          {/* STEP 1: DIALOGUE & RECAP */}
          {activeStep === "story" && (
            <div id="story-step-dialogue-content">
              {/* RECAP BANNER */}
              {episode.recap && (
                <div className="card card-tint-sand" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#744210" }}>
                    <IconScroll size={13} style={{ marginRight: 4 }} /> Latar Cerita
                  </span>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "4px 0 0" }}>
                    {episode.recap}
                  </p>
                </div>
              )}

              {/* DIALOGUE LINES */}
              <div className="dialogue-timeline">
                {episode.dialogue.map((item, idx) => {
                  // Interactive Choice Point
                  if (item.type === "interactive_choice") {
                    const chosen = choiceSelections[item.id];
                    return (
                      <div key={item.id} className="interactive-choice-box" id={`choice-box-${item.id}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#744210", textTransform: "uppercase" }}>
                            <IconHelp size={13} style={{ marginRight: 4 }} /> Pilihan Responmu:
                          </span>
                        </div>
                        <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 var(--space-2) 0" }}>
                          {item.prompt}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                          {item.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`choice-option-btn ${chosen?.id === opt.id ? "is-selected" : ""}`}
                              onClick={() => handleSelectChoice(item.id, opt)}
                              id={`choice-opt-${opt.id}`}
                            >
                              "{opt.text}"
                            </button>
                          ))}
                        </div>

                        {/* Reactive Reply after choice */}
                        {chosen && (
                          <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px dashed #D69E2E" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#744210" }}>
                              {chosen.speakerReply}:
                            </span>
                            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: "2px 0", color: "var(--color-text-primary)" }}>
                              "{chosen.reactionEn}"
                            </p>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic", margin: 0 }}>
                              {chosen.reactionId}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isYou = item.speaker === "You";
                  const isKanci = item.speaker === "Kanci";
                  const isNarrator = item.speaker === "Narator";
                  const showTranslation = showIdMap[item.id];

                  return (
                    <div
                      key={item.id}
                      className={`dialogue-bubble ${
                        isYou ? "speaker-you" : isKanci ? "speaker-kanci" : isNarrator ? "speaker-narrator" : ""
                      }`}
                      id={`dialogue-bubble-${item.id}`}
                    >
                      <div className="dialogue-speaker-name">
                        <span>{item.speaker}</span>
                        <div className="bubble-action-row">
                          <button
                            type="button"
                            className="btn-bubble-action"
                            onClick={() => handleSpeak(item.en)}
                            title="Dengarkan pengucapan audio"
                            id={`audio-btn-${item.id}`}
                          >
                            <><IconVolume size={13} style={{ marginRight: 4 }} /> Audio</>
                          </button>
                          <button
                            type="button"
                            className="btn-bubble-action"
                            onClick={() => toggleTranslate(item.id)}
                            title="Tampilkan/sembunyikan terjemahan Indonesia"
                            id={`trans-btn-${item.id}`}
                          >
                            {showTranslation ? "Tutup ID" : "Arti ID"}
                          </button>
                        </div>
                      </div>

                      <p className="dialogue-en-text">{item.en}</p>
                      {showTranslation && (
                        <p className="dialogue-id-text">{item.idText}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Nav to Vocab */}
              <div style={{ textAlign: "right", marginTop: "var(--space-6)", borderTop: "var(--border-sm)", paddingTop: "var(--space-4)" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveStep("vocab")}
                  id="goto-vocab-step-btn"
                >
                  Lanjut ke Kosakata & Grammar
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VOCABULARY, GRAMMAR & CULTURAL TIP */}
          {activeStep === "vocab" && (
            <div id="story-step-vocab-content">
              {/* HIGHLIGHTED VOCABULARY */}
              <div style={{ marginBottom: "var(--space-8)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-heading)", margin: 0 }}>
                    <IconSparkles size={16} style={{ marginRight: 6, color: 'var(--color-accent-gold)' }} /> Kosakata Pilihan Oxford 3000 ({episode.highlightedVocab?.length || 0} Kata)
                  </h4>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Tersambung langsung ke kamus V2
                  </span>
                </div>

                <div className="vocab-spotlight-grid">
                  {(episode.highlightedVocab || []).map((v) => {
                    const isAdded = addedSrsWords.has(v.word);

                    return (
                      <div key={v.wordId} className="vocab-spotlight-card" id={`vocab-card-${v.word}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h5>{v.word}</h5>
                          <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {v.partOfSpeech}
                          </span>
                        </div>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", fontWeight: 700, margin: "4px 0" }}>
                          {v.idMeaning}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontStyle: "italic", margin: "0 0 var(--space-3) 0" }}>
                          "{v.contextSentence}"
                        </p>

                        <button
                          type="button"
                          className={`btn-add-srs ${isAdded ? "is-added" : ""}`}
                          onClick={(e) => handleAddToSrs(v.word, e)}
                          disabled={isAdded}
                          id={`story-srs-btn-${v.word}`}
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          {isAdded ? <><IconCheck size={12} style={{ marginRight: 4 }} /> Tersimpan di SRS</> : `+ Simpan "${v.word}" ke SRS`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRAMMAR FOCUS */}
              {episode.grammarFocus && (
                <div className="card card-tint-slate" style={{ padding: "var(--space-5)", marginBottom: "var(--space-6)" }}>
                  <span className="scholar-chip chip-gold" style={{ fontSize: "10px", padding: "1px 6px" }}>
                    Fokus Grammar Episode Ini
                  </span>
                  <h4 style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-heading)", margin: "var(--space-2) 0" }}>
                    {episode.grammarFocus.title}
                  </h4>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", lineHeight: 1.6, margin: "0 0 var(--space-3) 0" }}>
                    {episode.grammarFocus.explanation}
                  </p>
                  <div style={{ backgroundColor: "var(--color-bg-surface)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700 }}>
                    {episode.grammarFocus.formula}
                  </div>
                </div>
              )}

              {/* CULTURAL TIP */}
              {episode.culturalTip && (
                <div className="card card-tint-sand" style={{ padding: "var(--space-5)", marginBottom: "var(--space-6)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#744210" }}>
                    <IconLightbulb size={13} style={{ marginRight: 4, color: 'var(--color-accent-gold)' }} /> Tip Budaya & Situasi Nyata
                  </span>
                  <h4 style={{ fontSize: "var(--text-sm)", margin: "4px 0 var(--space-2) 0" }}>
                    {episode.culturalTip.title}
                  </h4>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    {episode.culturalTip.content}
                  </p>
                </div>
              )}

              {/* Bottom Nav to Quiz */}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "var(--border-sm)", paddingTop: "var(--space-4)" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveStep("story")}
                >
                  <><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Kembali ke Cerita</>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveStep("quiz")}
                  id="goto-quiz-step-btn"
                >
                  <>Uji Pemahaman (5 Soal Kuis) <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 5-QUESTION QUIZ */}
          {activeStep === "quiz" && (
            <div id="story-step-quiz-content">
              <h4 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-heading)", margin: "0 0 var(--space-4) 0" }}>
                Kuis Pemahaman Episode (5 Soal)
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {quizQuestions.map((q, qIdx) => {
                  const selected = quizAnswers[q.id];
                  const isCorrect = selected === q.correctIndex;
                  const optionLetters = ["A", "B", "C", "D"];

                  return (
                    <div
                      key={q.id}
                      className="card"
                      style={{
                        padding: "var(--space-4)",
                        borderLeft: isQuizSubmitted
                          ? isCorrect
                            ? "6px solid var(--color-success)"
                            : "6px solid var(--color-danger)"
                          : "var(--border-sm)"
                      }}
                      id={`story-quiz-card-${q.id}`}
                    >
                      <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                        Soal {qIdx + 1}
                      </span>
                      <h5 style={{ fontSize: "var(--text-sm)", margin: "var(--space-2) 0 var(--space-3) 0", fontWeight: 700 }}>
                        {q.question}
                      </h5>

                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {q.options.map((opt, oIdx) => {
                          const isOptSelected = selected === oIdx;

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              className="quiz-option-button"
                              onClick={() => handleSelectQuizOption(q.id, oIdx)}
                              disabled={isQuizSubmitted}
                              style={{
                                padding: "var(--space-3)",
                                minHeight: "44px",
                                backgroundColor: isQuizSubmitted
                                  ? oIdx === q.correctIndex
                                    ? "#F0FFF4"
                                    : isOptSelected
                                    ? "#FFF5F5"
                                    : "var(--color-bg-surface)"
                                  : isOptSelected
                                  ? "#FFFDF0"
                                  : "var(--color-bg-surface)",
                                borderColor: isQuizSubmitted && oIdx === q.correctIndex ? "var(--color-success)" : "var(--border-color)"
                              }}
                              id={`story-quiz-opt-${q.id}-${oIdx}`}
                            >
                              <span className="option-badge-key" style={{ width: "24px", height: "24px", minWidth: "24px", fontSize: "11px" }}>
                                {optionLetters[oIdx]}
                              </span>
                              <span style={{ fontSize: "var(--text-xs)" }}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {isQuizSubmitted && (
                        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px dashed var(--border-color)", fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
                          <strong style={{ color: isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                            {isCorrect ? <><IconCheck size={13} style={{ marginRight: 4 }} /> Jawaban Benar! </> : <><IconClose size={13} style={{ marginRight: 4 }} /> Belum Tepat. </>}
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit or Proceed to Summary */}
              <div style={{ marginTop: "var(--space-8)", display: "flex", justifyContent: "space-between", borderTop: "var(--border-sm)", paddingTop: "var(--space-4)" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveStep("vocab")}
                >
                  <><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Kembali ke Kosakata</>
                </button>

                {!isQuizSubmitted ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                    id="submit-story-quiz-btn"
                  >
                    <>Periksa Jawaban Kuis <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveStep("summary")}
                    id="goto-summary-step-btn"
                  >
                    <>Lihat Rangkuman & Selesaikan <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & CLIFFHANGER */}
          {activeStep === "summary" && (
            <div style={{ textAlign: "center" }} id="story-step-summary-content">
              <KanciMascot
                expression="celebrating"
                equippedOutfit={equippedOutfit}
                size="md"
                dialogue="Hebat sekali! Kamu telah menyelesaikan episode ini dengan penuh ketekunan!"
              />

              <h3 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-4) 0 var(--space-2)" }}>
                Episode {episode.id} Tuntas!
              </h3>

              {/* Feedback Banner */}
              {completionFeedback && (
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
                  id="story-reward-feedback-banner"
                >
                  <span style={{ fontWeight: 800, color: "#744210", fontSize: "var(--text-sm)" }}>
                    Reward Episode:
                  </span>
                  <span className="scholar-chip chip-gold">+{completionFeedback.earnedXp} EXP</span>
                  <span className="scholar-chip chip-level">+{completionFeedback.earnedCoins} Sinau Coin</span>
                </div>
              )}

              {/* Takeaways Card */}
              <div className="card card-tint-sand" style={{ padding: "var(--space-6)", textAlign: "left", marginBottom: "var(--space-6)" }}>
                <h4 style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-heading)", margin: "0 0 var(--space-3) 0" }}>
                  <IconPin size={13} style={{ marginRight: 4 }} /> Yang Telah Kamu Pelajari Hari Ini:
                </h4>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--text-xs)", lineHeight: 1.7 }}>
                  {(episode.summary?.takeaways || []).map((t, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Cliffhanger Card */}
              {episode.cliffhanger && (
                <div className="card card-tint-slate" style={{ padding: "var(--space-5)", textAlign: "left", marginBottom: "var(--space-8)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--color-accent-navy)" }}>
                    <IconSparkles size={13} style={{ marginRight: 4 }} /> Cuplikan Episode Berikutnya:
                  </span>
                  <p style={{ fontSize: "var(--text-xs)", fontStyle: "italic", lineHeight: 1.6, margin: "4px 0 0" }}>
                    "{episode.cliffhanger}"
                  </p>
                </div>
              )}

              {/* Finish Action Button */}
              <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={completionFeedback ? onClose : handleCompleteEpisode}
                  disabled={isFinishing}
                  id="finish-episode-submit-btn"
                  style={{ minWidth: "240px" }}
                >
                  {isFinishing
                    ? "Menyimpan ke Cloud..."
                    : completionFeedback
                    ? "Kembali ke Daftar Episode"
                    : "Tandai Selesai & Klaim Reward (+50 EXP)"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

