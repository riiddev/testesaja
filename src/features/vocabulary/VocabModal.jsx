import React, { useEffect, useRef } from "react";
import { STATUS_META } from "../../hooks/useSpacedRepetition.js";

export function VocabModal({ word, status = "fresh", isOpen, onClose, onStartStudy, onAudio }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Auto-focus the close button for accessibility
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !word) return null;

  const meta = STATUS_META[status] || STATUS_META.fresh;

  return (
    <div
      className="modal-overlay is-open"
      id="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-word-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet modal-content" id="modal-sheet">
        <div id="modal-content">
          {/* Header row: Badges on left, Audio + Close side-by-side on right (No overlap!) */}
          <div
            className="modal-header-bar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              marginBottom: "var(--space-4)"
            }}
          >
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
              <span className={`badge ${meta.className}`}>{meta.label}</span>
              <span className="badge badge-cefr">{word.level}</span>
              <span className="badge">{word.partOfSpeech}</span>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexShrink: 0 }}>
              <button
                className="btn btn-secondary btn-icon"
                type="button"
                onClick={() => onAudio(word.word)}
                aria-label={`Dengarkan pengucapan audio ${word.word}`}
                title="Dengarkan pengucapan"
                style={{ width: "44px", height: "44px", minWidth: "44px", minHeight: "44px", borderRadius: "var(--radius-pill)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>

              <button
                ref={closeBtnRef}
                className="btn btn-outline btn-icon"
                id="modal-close-btn"
                type="button"
                onClick={onClose}
                aria-label="Tutup jendela detail kata"
                title="Tutup (Esc)"
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "44px",
                  minHeight: "44px",
                  borderRadius: "var(--radius-pill)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <h2 id="modal-word-title" style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-1)" }}>
            {word.word}<span style={{ color: "var(--color-accent-gold)" }}>.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
            {word.ipa || ""}
          </p>

          <div style={{ backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <strong style={{ display: "block", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
              Makna Indonesia:
            </strong>
            <p style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
              {word.meaning}
            </p>
          </div>

          {word.example && (
            <div style={{ borderLeft: "3px solid var(--color-accent-gold)", paddingLeft: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              <p style={{ fontWeight: 600, marginBottom: "2px" }}>{word.example}</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", fontStyle: "italic", margin: 0 }}>
                {word.translation || ""}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" type="button" onClick={onClose} style={{ minHeight: "44px" }}>
              Tutup
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                onClose();
                onStartStudy(word);
              }}
              style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
            >
              <span>Latih Kata Ini</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
