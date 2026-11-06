import {
  IconCheck,
  IconClock,
  IconGift
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";
import { ReadingQuizRunner } from "./ReadingQuizRunner.jsx";
import quizzesData from "../../data/habit-reading-quizzes.json";

export function ReadingLibrary({ passages = [], onRecordWordReview, userProfileHook }) {
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [activeQuizPassage, setActiveQuizPassage] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = ["all", "Science", "Culture", "History", "Technology", "Society"];

  const filtered = passages.filter((p) => {
    if (filterCategory === "all") return true;
    return p.category?.toLowerCase() === filterCategory.toLowerCase();
  });

  const availableQuizzes = quizzesData?.quizzes || {};

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="section-title">156 Bacaan Bahasa Inggris Nyata</h2>
        <p className="section-desc">
          Tingkatkan kecepatan membaca, perluas konteks kosakata, dan uji pemahaman analitis melalui kuis komprehensif 4 dimensi.
        </p>

        {/* Filter categories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                border: "var(--border-sm)",
                backgroundColor: filterCategory === cat ? "var(--color-accent-navy)" : "var(--color-bg-surface)",
                color: filterCategory === cat ? "var(--color-text-inverse)" : "var(--color-text-primary)",
                cursor: "pointer"
              }}
            >
              {cat === "all" ? "Semua Kategori (156)" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Passages */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)"
        }}
      >
        {filtered.slice(0, 36).map((p) => {
          const hasQuiz = Boolean(availableQuizzes[p.id]);

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPassage(p)}
              className="card card-interactive"
              id={`passage-card-${p.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                position: "relative"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)", gap: "var(--space-2)" }}>
                  <Badge variant="sage">{p.category || "General"}</Badge>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {hasQuiz && (
                      <span
                        className="scholar-chip chip-gold"
                        style={{ fontSize: "10px", padding: "1px 6px", fontWeight: 800 }}
                        title="Tersedia Kuis Pemahaman"
                      >
                        Kuis Tersedia
                      </span>
                    )}
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
                      <><IconClock size={11} style={{ marginRight: 3 }} /> {p.estimatedMinutes || 3} MENIT</>
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>
                  {p.title}
                </h3>

                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0, marginBottom: "var(--space-4)" }}>
                  {p.paragraphs ? p.paragraphs[0].slice(0, 110) + "..." : ""}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-sm)", paddingTop: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>
                  {p.wordCount} KATA
                </span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent-navy)" }}>
                  Baca Teks
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Passage Reader Modal */}
      {selectedPassage && (
        <Modal
          isOpen={Boolean(selectedPassage)}
          onClose={() => setSelectedPassage(null)}
          maxWidth="720px"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
            <Badge variant="sage">{selectedPassage.category || "HABIT Reading"}</Badge>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
              <><IconClock size={12} style={{ marginRight: 3 }} /> {selectedPassage.estimatedMinutes || 3} Menit</> · {selectedPassage.wordCount} Kata
            </span>
          </div>

          <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-4)" }}>
            {selectedPassage.title}
          </h2>

          <div
            style={{
              fontSize: "var(--text-base)",
              lineHeight: 1.8,
              color: "var(--color-text-primary)",
              marginBottom: "var(--space-6)",
              maxHeight: "55vh",
              overflowY: "auto",
              paddingRight: "var(--space-2)"
            }}
          >
            {(selectedPassage.paragraphs || []).map((para, idx) => (
              <p key={idx} style={{ marginBottom: "var(--space-4)" }}>
                <strong style={{ color: "var(--color-text-secondary)", marginRight: "8px", fontSize: "var(--text-xs)" }}>
                  [P{idx + 1}]
                </strong>
                {para}
              </p>
            ))}
          </div>

          {/* Action Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--space-3)",
              borderTop: "var(--border-sm)",
              paddingTop: "var(--space-4)"
            }}
          >
            <Button
              variant="outline"
              onClick={() => setSelectedPassage(null)}
              id="finish-reading-btn"
            >
              <>Selesai Membaca <IconCheck size={13} style={{ marginLeft: 4 }} /></>
            </Button>

            {availableQuizzes[selectedPassage.id] ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
                  <IconGift size={13} style={{ marginRight: 4 }} /> Hadiah: +30 EXP · +20 Koin
                </span>
                <button
                  type="button"
                  id="start-reading-quiz-btn"
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveQuizPassage(selectedPassage);
                    setSelectedPassage(null);
                  }}
                  style={{ minHeight: "44px" }}
                >
                  Kerjakan Kuis Pemahaman (8-10 Soal)
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <button
                  type="button"
                  id="quiz-coming-soon-btn"
                  className="btn btn-outline"
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed", minHeight: "44px" }}
                >
                  Kuis Segera Hadir
                </button>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  (Kurikulum sedang disusun)
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Active Reading Quiz Engine */}
      {activeQuizPassage && (
        <ReadingQuizRunner
          passage={activeQuizPassage}
          quizData={availableQuizzes[activeQuizPassage.id]}
          onClose={() => setActiveQuizPassage(null)}
          onRecordWordReview={onRecordWordReview}
          claimReward={userProfileHook?.claimReward}
          equippedOutfit={userProfileHook?.equippedOutfit}
        />
      )}
    </div>
  );
}
