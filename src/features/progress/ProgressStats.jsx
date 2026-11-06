import React from "react";
import { getWordStatus } from "../../hooks/useSpacedRepetition.js";

export function ProgressStats({ vocabulary = [], progressMap = {} }) {
  const totalCorpus = 2971;

  const masteredCount = vocabulary.filter((w) => {
    const p = progressMap[w.id];
    return p && getWordStatus(p) === "mastered";
  }).length;

  const learningCount = vocabulary.filter((w) => {
    const p = progressMap[w.id];
    return p && getWordStatus(p) === "learning";
  }).length;

  const weakCount = vocabulary.filter((w) => {
    const p = progressMap[w.id];
    return p && getWordStatus(p) === "weak";
  }).length;

  const levels = [
    { id: "A1", label: "Level A1 (Beginner)", total: 892 },
    { id: "A2", label: "Level A2 (Elementary)", total: 792 },
    { id: "B1", label: "Level B1 (Intermediate)", total: 689 },
    { id: "B2", label: "Level B2 (Upper Intermediate)", total: 597 }
  ];

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="section-title">Progres Penguasaan Kosakata</h2>
        <p className="section-desc">
          Pantau perkembangan kosakata aktifmu yang telah tersimpan dan terorganisasi.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-8)"
        }}
      >
        <div className="card card-tint-sage" style={{ padding: "var(--space-6)" }}>
          <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", fontWeight: 700 }}>
            Kata Dikuasai
          </span>
          <div style={{ fontSize: "var(--text-4xl)", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-success)", marginBlock: "4px" }}>
            {masteredCount}
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Repetisi berhasil ≥ 5 kali
          </span>
        </div>

        <div className="card card-tint-sand" style={{ padding: "var(--space-6)" }}>
          <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", fontWeight: 700 }}>
            Sedang Dipelajari
          </span>
          <div style={{ fontSize: "var(--text-4xl)", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-accent-gold)", marginBlock: "4px" }}>
            {learningCount}
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Aktif dalam interval SRS
          </span>
        </div>

        <div className="card card-tint-slate" style={{ padding: "var(--space-6)" }}>
          <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", fontWeight: 700 }}>
            Total Korpus Oxford 3000
          </span>
          <div style={{ fontSize: "var(--text-4xl)", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-accent-navy)", marginBlock: "4px" }}>
            {totalCorpus}
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            American Oxford 3000 A1–B2
          </span>
        </div>
      </div>

      {/* Level Breakdown Progress Bars */}
      <div className="card card-tint-sand" style={{ padding: "var(--space-8)" }}>
        <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-6)" }}>
          Cakupan Level CEFR
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {levels.map((lvl) => {
            const masteredInLevel = vocabulary.filter((w) => {
              const p = progressMap[w.id];
              return w.level === lvl.id && p && getWordStatus(p) === "mastered";
            }).length;

            const pct = Math.round((masteredInLevel / lvl.total) * 100);

            return (
              <div key={lvl.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>
                  <span>{lvl.label}</span>
                  <span>{masteredInLevel} / {lvl.total} ({pct}%)</span>
                </div>
                <div
                  style={{
                    height: "12px",
                    backgroundColor: "var(--color-bg-surface)",
                    borderRadius: "var(--radius-full)",
                    border: "var(--border-sm)",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      backgroundColor: "var(--color-accent-gold)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.8s var(--ease-editorial)"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

