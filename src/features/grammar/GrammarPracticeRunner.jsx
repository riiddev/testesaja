import {
  IconCheck,
  IconClose,
  IconLightbulb
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";

export function GrammarPracticeRunner({ topic, onFinishPractice }) {
  const exercises = topic?.practiceExercises || [];
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluated, setEvaluated] = useState({});
  const [scrambleSelections, setScrambleSelections] = useState({});
  const [textInputs, setTextInputs] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  if (exercises.length === 0) {
    return (
      <div className="card card-tint-sand" style={{ textAlign: "center", padding: "var(--space-8)" }}>
        <p>Latihan interaktif untuk modul ini sedang disusun.</p>
      </div>
    );
  }

  // Handle Multiple Choice
  const handleSelectOption = (exId, optionIdx, correctIdx) => {
    if (evaluated[exId]) return;
    setUserAnswers((prev) => ({ ...prev, [exId]: optionIdx }));
    setEvaluated((prev) => ({ ...prev, [exId]: optionIdx === correctIdx }));
  };

  // Handle Fill-in & Transformation text submit
  const handleCheckText = (exId, acceptedAnswers = []) => {
    if (evaluated[exId]) return;
    const input = (textInputs[exId] || "").trim().toLowerCase();
    const isCorrect = acceptedAnswers.some(
      (ans) => ans.trim().toLowerCase() === input
    );
    setUserAnswers((prev) => ({ ...prev, [exId]: textInputs[exId] }));
    setEvaluated((prev) => ({ ...prev, [exId]: isCorrect }));
  };

  // Handle Scramble
  const handleToggleScrambleWord = (exId, word, wordIdx) => {
    if (evaluated[exId]) return;
    const current = scrambleSelections[exId] || [];
    const exists = current.some((item) => item.idx === wordIdx);

    let next;
    if (exists) {
      next = current.filter((item) => item.idx !== wordIdx);
    } else {
      next = [...current, { word, idx: wordIdx }];
    }
    setScrambleSelections((prev) => ({ ...prev, [exId]: next }));
  };

  const handleCheckScramble = (exId, targetSentence) => {
    const selected = (scrambleSelections[exId] || []).map((x) => x.word).join(" ");
    const isCorrect =
      selected.trim().toLowerCase() === targetSentence.trim().toLowerCase() ||
      selected.replace(/\s+\?/g, "?").trim().toLowerCase() === targetSentence.trim().toLowerCase();

    setUserAnswers((prev) => ({ ...prev, [exId]: selected }));
    setEvaluated((prev) => ({ ...prev, [exId]: isCorrect }));
  };

  // Evaluate All
  const evaluatedCount = Object.keys(evaluated).length;
  const correctCount = Object.values(evaluated).filter(Boolean).length;

  const handleFinishAll = () => {
    setIsCompleted(true);
    if (onFinishPractice) {
      onFinishPractice({
        topicId: topic.id,
        practiceDone: true,
        correctCount,
        totalCount: exercises.length
      });
    }
  };

  return (
    <div className="practice-container" id="grammar-practice-runner">
      {/* Progress Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase" }}>
          Praktik Bertingkat 12 Latihan
        </span>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
          {evaluatedCount} dari {exercises.length} Selesai • Skor: {correctCount}/{evaluatedCount || 1}
        </span>
      </div>

      <div style={{ height: "8px", backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-pill)", overflow: "hidden", marginBottom: "var(--space-6)" }}>
        <div
          style={{
            height: "100%",
            width: `${(evaluatedCount / exercises.length) * 100}%`,
            backgroundColor: "var(--color-accent-gold)",
            transition: "width 0.3s ease"
          }}
        />
      </div>

      {/* Exercises List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {exercises.map((ex, idx) => {
          const isDone = evaluated[ex.id] !== undefined;
          const isCorrect = evaluated[ex.id] === true;

          return (
            <div
              key={ex.id}
              className="practice-card"
              id={`practice-card-${ex.id}`}
              style={{
                borderLeft: isDone
                  ? isCorrect
                    ? "6px solid var(--color-success)"
                    : "6px solid var(--color-danger)"
                  : "var(--border-md)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                  Latihan {idx + 1} • {ex.level} • {ex.type.toUpperCase()}
                </span>
                {isDone && (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                    {isCorrect ? <><IconCheck size={13} style={{ marginRight: 4 }} /> Jawaban Benar</> : <><IconClose size={13} style={{ marginRight: 4 }} /> Belum Tepat</>}
                  </span>
                )}
              </div>

              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: "0 0 var(--space-3) 0", lineHeight: 1.5 }}>
                {ex.prompt}
              </h4>

              {/* VARIATION 1: MULTIPLE CHOICE */}
              {ex.type === "multiple-choice" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                  {ex.options.map((opt, oIdx) => {
                    const isSelected = userAnswers[ex.id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleSelectOption(ex.id, oIdx, ex.correctIndex)}
                        disabled={isDone}
                        style={{
                          textAlign: "left",
                          justifyContent: "flex-start",
                          padding: "var(--space-2) var(--space-4)",
                          backgroundColor: isDone
                            ? oIdx === ex.correctIndex
                              ? "#F0FFF4"
                              : isSelected
                              ? "#FFF5F5"
                              : "var(--color-bg-surface)"
                            : isSelected
                            ? "var(--color-bg-subtle)"
                            : "var(--color-bg-surface)",
                          borderColor: isDone && oIdx === ex.correctIndex ? "var(--color-success)" : "var(--border-color)",
                          fontWeight: oIdx === ex.correctIndex && isDone ? 800 : 600
                        }}
                      >
                        <span style={{ marginRight: "8px", fontWeight: 800 }}>{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* VARIATION 2 & 5: FILL-IN & TRANSFORMATION */}
              {(ex.type === "fill-in" || ex.type === "transformation") && (
                <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ketik jawabanmu di sini..."
                    value={textInputs[ex.id] || ""}
                    onChange={(e) => setTextInputs({ ...textInputs, [ex.id]: e.target.value })}
                    disabled={isDone}
                    style={{ flex: 1, minWidth: "220px", height: "42px" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isDone) handleCheckText(ex.id, ex.acceptedAnswers);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCheckText(ex.id, ex.acceptedAnswers)}
                    disabled={isDone || !textInputs[ex.id]}
                    style={{ minHeight: "42px" }}
                  >
                    Periksa Jawaban
                  </button>
                </div>
              )}

              {/* VARIATION 3: ERROR CORRECTION */}
              {ex.type === "error-correction" && (
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-2) 0" }}>
                    Kata yang salah: <strong style={{ color: "var(--color-danger)" }}>"{ex.errorWord}"</strong>. Tuliskan perbaikan yang benar:
                  </p>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={`Ganti kata "${ex.errorWord}" dengan...`}
                      value={textInputs[ex.id] || ""}
                      onChange={(e) => setTextInputs({ ...textInputs, [ex.id]: e.target.value })}
                      disabled={isDone}
                      style={{ flex: 1, minWidth: "200px", height: "42px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isDone) handleCheckText(ex.id, [ex.correctWord]);
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCheckText(ex.id, [ex.correctWord])}
                      disabled={isDone || !textInputs[ex.id]}
                      style={{ minHeight: "42px" }}
                    >
                      Koreksi
                    </button>
                  </div>
                </div>
              )}

              {/* VARIATION 4: WORD SCRAMBLE */}
              {ex.type === "word-scramble" && (
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <div className="practice-scramble-dropzone">
                    {(scrambleSelections[ex.id] || []).length === 0 ? (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic", alignSelf: "center" }}>
                        Klik kepingan kata di bawah ini secara berurutan...
                      </span>
                    ) : (
                      (scrambleSelections[ex.id] || []).map((item) => (
                        <span
                          key={item.idx}
                          className="scramble-word-chip"
                          onClick={() => handleToggleScrambleWord(ex.id, item.word, item.idx)}
                          title="Klik untuk menghapus kata ini"
                        >
                          <>{item.word} <IconClose size={10} style={{ marginLeft: 2 }} /></>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Word Bank */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                    {ex.words.map((word, wIdx) => {
                      const isUsed = (scrambleSelections[ex.id] || []).some((item) => item.idx === wIdx);
                      return (
                        <button
                          key={wIdx}
                          type="button"
                          className={`scramble-word-chip ${isUsed ? "is-used" : ""}`}
                          onClick={() => handleToggleScrambleWord(ex.id, word, wIdx)}
                          disabled={isUsed || isDone}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>

                  {!isDone && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCheckScramble(ex.id, ex.targetSentence)}
                      disabled={(scrambleSelections[ex.id] || []).length === 0}
                    >
                      Periksa Urutan Kalimat
                    </button>
                  )}
                </div>
              )}

              {/* INSTANT FEEDBACK & EXPLANATION */}
              {isDone && (
                <div
                  style={{
                    backgroundColor: isCorrect ? "#F0FFF4" : "#FFF5F5",
                    border: isCorrect ? "1px solid #38A169" : "1px solid #E53E3E",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3) var(--space-4)",
                    fontSize: "var(--text-xs)",
                    lineHeight: 1.5,
                    marginTop: "var(--space-2)"
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: isCorrect ? "#22543D" : "#742A2A" }}>
                    <IconLightbulb size={13} style={{ marginRight: 4 }} /> Pembahasan: {ex.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion CTA */}
      <div style={{ textAlign: "center", marginTop: "var(--space-8)", padding: "var(--space-6)", backgroundColor: "var(--color-bg-surface)", border: "var(--border-sm)", borderRadius: "var(--radius-lg)" }}>
        <h4 style={{ fontSize: "var(--text-base)", margin: "0 0 var(--space-2) 0" }}>
          Sesi Praktik Selesai ({evaluatedCount}/{exercises.length} Terjawab)
        </h4>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-4) 0" }}>
          Progres praktik Anda akan dicatat ke Cloud agar misi harian tata bahasa Anda terpenuhi.
        </p>
        <button
          type="button"
          id="finish-grammar-practice-btn"
          className="btn btn-primary btn-lg"
          onClick={handleFinishAll}
          disabled={evaluatedCount < 6}
        >
          {isCompleted ? <><IconCheck size={12} style={{ marginRight: 4 }} /> Sesi Praktik Tersimpan di Cloud</> : "Simpan Sesi Praktik & Lanjut ke Kuis"}
        </button>
      </div>
    </div>
  );
}
