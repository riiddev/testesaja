import {
  IconRefresh
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { api } from "../../services/api.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import { getGrammarTopic } from "../../data/grammar/grammarRegistry.js";

export function QuizRunner({ topic, onFinish, onRetry, claimReward }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [answers, setAnswers] = useState([]);

  const { isAuthenticated } = useAuth();

  const officialTopic = topic?.id ? (getGrammarTopic(topic.id) || topic) : topic;
  const questions = Array.isArray(officialTopic?.finalQuiz) && officialTopic.finalQuiz.length > 0
    ? officialTopic.finalQuiz.map((question, index) => ({
        id: question.id || `legacy-q-${index + 1}`,
        prompt: question.question || question.prompt || "",
        options: question.options || [],
        answer: question.correctIndex,
        explanation: typeof question.explanation === "string"
          ? question.explanation
          : question.explanation?.correctReason || "Jawaban telah diperiksa berdasarkan kunci resmi."
      }))
    : (officialTopic?.questions || []).map((question, index) => ({
        ...question,
        id: question.id || `legacy-q-${index + 1}`
      }));

  if (!topic || questions.length === 0) {
    return (
      <div className="card card-tint-sand" style={{ textAlign: "center", padding: "var(--space-10)" }}>
        <h3>Pilih Topik Grammar untuk Mengikuti Kuis</h3>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          Kuis dirancang untuk menguji pemahaman konsep tata bahasa secara langsung.
        </p>
        <Button variant="primary" onClick={onFinish}>
          Lihat Modul Grammar
        </Button>
      </div>
    );
  }

  const isFinished = questionIndex >= questions.length;
  const currentQ = questions[questionIndex];

  const handleSelectOption = (idx) => {
    if (selectedOption !== null || isFinished || !currentQ) return;

    setSelectedOption(idx);
    const correct = idx === currentQ.answer;
    if (correct) setScore((prev) => prev + 1);

    const nextAnswers = [
      ...answers,
      {
        questionId: currentQ.id || `legacy-q-${questionIndex + 1}`,
        selectedIndex: idx
      }
    ];
    setAnswers(nextAnswers);

    setTimeout(async () => {
      setSelectedOption(null);
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);

      if (nextIdx >= questions.length) {
        if (!isAuthenticated) {
          setSaveStatus("Masuk ke akun untuk menyimpan hasil kuis.");
          return;
        }

        setIsSaving(true);
        setSaveStatus("Menyimpan hasil kuis ke akunmu...");

        try {
          const payload = {
            eventId: `grammar:${officialTopic.id}:first_complete`,
            source: "grammar_quiz",
            refId: officialTopic.id,
            meta: { answers: nextAnswers }
          };
          const res = claimReward
            ? await claimReward(payload)
            : await api.saveGrammarProgress({
                topicId: officialTopic.id,
                answers: nextAnswers
              });

          if (!res?.success || !res.data) {
            throw new Error(res?.error || res?.message || "Server belum mengonfirmasi penyimpanan.");
          }

          setSaveStatus(
            res.data.status === "completed"
              ? "Hasil tersimpan. Topik Grammar berhasil diselesaikan."
              : "Hasil tersimpan. Skor minimal 80% diperlukan untuk menyelesaikan topik."
          );
        } catch (err) {
          setSaveStatus("Gagal menyimpan hasil kuis: " + (err.message || "Kesalahan server."));
        } finally {
          setIsSaving(false);
        }
      }
    }, 1200);
  };

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="card card-tint-sand" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "var(--space-10)" }}>
        <div style={{ fontSize: "52px", marginBottom: "var(--space-3)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px", borderRadius: "var(--radius-pill)", backgroundColor: "var(--color-bg-surface)", border: "var(--border-sm)", color: pct >= 80 ? "var(--color-accent-gold)" : "var(--color-accent-navy)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9H4.5a2.5 2.5 0 0 0 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"/>
            </svg>
          </div>
        </div>
        <h2 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-2)" }}>
          Kuis Selesai!
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          Topik: <strong>{topic.title}</strong>
        </p>

        <div style={{ backgroundColor: "var(--color-bg-surface)", padding: "var(--space-6)", borderRadius: "var(--radius-lg)", border: "var(--border-sm)", marginBottom: "var(--space-6)" }}>
          <div style={{ fontSize: "var(--text-4xl)", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-accent-navy)", marginBottom: "4px" }}>
            {score} / {questions.length}
          </div>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Akurasi Pemahaman: {pct}%
          </span>
          {(isSaving || saveStatus) && (
            <p role="status" aria-live="polite" style={{
              fontSize: "var(--text-xs)",
              color: saveStatus.startsWith("Gagal") ? "var(--color-danger)" : "var(--color-text-secondary)",
              marginTop: "var(--space-3)"
            }}>
              {isSaving ? "Menyimpan hasil kuis..." : saveStatus}
            </p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-4)" }}>
          <Button variant="secondary" onClick={onFinish}>
            Kembali ke Grammar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setQuestionIndex(0);
              setScore(0);
              setSelectedOption(null);
              setAnswers([]);
              setSaveStatus("");
              if (onRetry) onRetry(topic);
            }}
          >
            <><IconRefresh size={13} style={{ marginRight: 4 }} /> Ulangi Kuis</>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="card card-tint-sand" style={{ padding: "var(--space-8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "var(--border-sm)", paddingBottom: "var(--space-3)", marginBottom: "var(--space-6)" }}>
          <span className="badge badge-gold">
            SOAL {questionIndex + 1} DARI {questions.length}
          </span>
          <span style={{ fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            SKOR: {score}
          </span>
        </div>

        <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-6)", lineHeight: 1.4 }}>
          {currentQ.prompt}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
          {(currentQ.options || []).map((opt, idx) => {
            const optStyle = {
              textAlign: "left",
              justifyContent: "flex-start",
              padding: "var(--space-4)"
            };

            if (selectedOption !== null) {
              if (idx === currentQ.answer) {
                optStyle.backgroundColor = "var(--color-success-bg)";
                optStyle.borderColor = "var(--color-success)";
                optStyle.color = "var(--color-success)";
              } else if (selectedOption === idx) {
                optStyle.backgroundColor = "var(--color-danger-bg)";
                optStyle.borderColor = "var(--color-danger)";
                optStyle.color = "var(--color-danger)";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={selectedOption !== null}
                onClick={() => handleSelectOption(idx)}
                className="btn btn-secondary quiz-opt-btn"
                style={optStyle}
              >
                <span style={{ fontWeight: 700, marginRight: "var(--space-2)" }}>{String.fromCharCode(65 + idx)}.</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <div
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: "var(--border-sm)",
              backgroundColor: selectedOption === currentQ.answer ? "var(--color-success-bg)" : "var(--color-danger-bg)",
              color: selectedOption === currentQ.answer ? "var(--color-success)" : "var(--color-danger)",
              fontWeight: 600,
              fontSize: "var(--text-sm)"
            }}
          >
            {selectedOption === currentQ.answer
              ? `Benar! ${currentQ.explanation}`
              : `Kurang tepat. ${currentQ.explanation}`}
          </div>
        )}
      </div>
    </div>
  );
}
