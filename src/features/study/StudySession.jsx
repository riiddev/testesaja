import { IconCheck } from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { useSpeech } from "../../hooks/useSpeech.js";

export function StudySession({ word, onFinish, onNextWord, onRecordReview }) {
  const [stage, setStage] = useState(1);
  const [isMeaningRevealed, setIsMeaningRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const { speak } = useSpeech();

  if (!word) {
    return (
      <div className="card card-tint-sand" style={{ textAlign: "center", padding: "var(--space-12)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-3)" }}>
          Pilih Kata untuk Mulai Latihan
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          Buka menu Kosakata atau klik tombol di bawah untuk melatih kata berikutnya.
        </p>
        <button className="btn btn-primary" type="button" onClick={onFinish}>
          Buka Daftar Kosakata
        </button>
      </div>
    );
  }

  const context = word.context || {
    prompt: `Lengkapi kalimat: "${word.example || 'This is an important example sentence.'}"`,
    options: [word.meaning, "arti lain yang kurang tepat", "lawan kata"],
    answer: 0
  };

  const handleStage2Answer = (idx) => {
    setSelectedOption(idx);
    const correct = idx === context.answer;
    setIsCorrect(correct);

    const result = onRecordReview(word.id, word.level, correct);
    setOutcome(result);

    setTimeout(() => {
      setStage(3);
    }, 1200);
  };

  const stageTitles = ["Recall Makna", "Pahami Konteks", "Konfirmasi Ingatan"];
  const stagePct = Math.round((stage / 3) * 100);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="card study-card card-tint-sand">
        <div className="study-step-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
          <span className="badge badge-gold">TAHAP {stage} DARI 3 · {stageTitles[stage - 1].toUpperCase()}</span>
          <span className="badge badge-cefr">{word.level}</span>
        </div>

        <div className="study-progress-track">
          <div className="study-progress-fill" style={{ width: `${stagePct}%` }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
          <h2 style={{ fontSize: "var(--text-4xl)", margin: 0 }}>
            {word.word}<span style={{ color: "var(--color-accent-gold)" }}>.</span>
          </h2>
          <button
            className="btn btn-secondary btn-icon"
            type="button"
            onClick={() => speak(word.word)}
            aria-label="Audio"
            style={{ width: "36px", height: "36px", borderRadius: "var(--radius-pill)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>

        <p style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          {word.ipa || word.partOfSpeech || ""}
        </p>

        {/* STAGE 1: RECALL */}
        {stage === 1 && (
          <div>
            <div style={{ backgroundColor: "var(--color-bg-surface)", border: "var(--border-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-6)", textAlign: "center", marginBottom: "var(--space-6)" }}>
              <p style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                Cobalah mengingat arti kata ini sebelum membuka jawaban:
              </p>
              {isMeaningRevealed ? (
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent-navy)", marginBottom: "var(--space-4)" }}>
                  {word.meaning}
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setIsMeaningRevealed(true)}
                >
                  Buka Arti Kata
                </button>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-outline" type="button" onClick={onFinish}>
                Kembali ke Daftar
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={!isMeaningRevealed}
                onClick={() => setStage(2)}
              >
                Lanjut ke Konteks
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: CONTEXT QUESTION */}
        {stage === 2 && (
          <div>
            <p style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
              {context.prompt}
            </p>
            <div className="study-options">
              {context.options.map((opt, idx) => {
                let btnClass = "study-option-btn";
                if (selectedOption !== null) {
                  if (idx === context.answer) btnClass += " is-correct";
                  else if (selectedOption === idx) btnClass += " is-wrong";
                }

                return (
                  <button
                    key={idx}
                    className={btnClass}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleStage2Answer(idx)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selectedOption !== null && (
              <div style={{ marginTop: "var(--space-4)", fontWeight: 700, color: isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                {isCorrect ? "Jawaban Benar! Pemahaman konteks berhasil." : "Jawaban kurang tepat. Interval review direset ke 1 hari."}
              </div>
            )}
          </div>
        )}

        {/* STAGE 3: RESULT & INTERVAL */}
        {stage === 3 && (
          <div style={{ textAlign: "center", padding: "var(--space-6)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-2)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "var(--radius-pill)", backgroundColor: isCorrect ? "var(--color-success-bg)" : "var(--color-warning-bg)", border: "var(--border-sm)", color: isCorrect ? "var(--color-success)" : "var(--color-warning)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isCorrect ? (
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
            </div>
            </div>
            <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>
              {isCorrect ? "Penguasaan Meningkat!" : "Perlu Diulang Lagi"}
            </h2>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
              {isCorrect ? "Kata ini berhasil kamu kuasai dalam konteks." : "Kata ini akan muncul kembali dalam sesi review berikutnya."}
            </p>

            <div style={{ backgroundColor: "var(--color-bg-surface)", border: "var(--border-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-6)", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Status Penguasaan:</span>
                <strong style={{ textTransform: "capitalize" }}>{outcome?.masteryStage || "learning"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Jadwal Review Berikutnya:</span>
                <strong>{outcome?.intervalDays || 1} Hari Lagi</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Sinkronisasi:</span>
                <span style={{ color: "var(--color-success)", fontWeight: 700 }}><IconCheck size={12} style={{ marginRight: 3 }} /> Tersimpan Otomatis</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)" }}>
              <button className="btn btn-secondary" type="button" onClick={onFinish}>
                Daftar Kosakata
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setStage(1);
                  setIsMeaningRevealed(false);
                  setSelectedOption(null);
                  onNextWord();
                }}
              >
                Latih Kata Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
