import React from "react";
import { STATUS_META } from "../../hooks/useSpacedRepetition.js";

export function VocabCard({ word, status = "fresh", onSelect, onAudio }) {
  const meta = STATUS_META[status] || STATUS_META.fresh;

  const handleAudio = (e) => {
    e.stopPropagation();
    onAudio(word.word);
  };

  return (
    <div
      onClick={() => onSelect(word)}
      className="card card-tint-sand card-interactive vocab-card word-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "var(--space-4)",
        cursor: "pointer"
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            <span className="badge badge-cefr">{word.level}</span>
            <span className={`badge ${meta.className}`}>{meta.label}</span>
          </div>
          <button
            className="btn btn-secondary btn-icon btn-sm"
            type="button"
            onClick={handleAudio}
            aria-label="Audio"
            style={{ width: "28px", height: "28px", padding: 0, borderRadius: "var(--radius-pill)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>

        <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "2px" }}>
          {word.word}
        </h3>

        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic", display: "block", marginBottom: "var(--space-2)" }}>
          {word.partOfSpeech || "kata"}
        </span>

        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
          {word.meaning}
        </p>
      </div>

      <div style={{ marginTop: "var(--space-3)", textAlign: "right" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
          Detail Kata
        </span>
      </div>
    </div>
  );
}
