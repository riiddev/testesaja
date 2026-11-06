import React, { useState } from "react";
import { Badge } from "../common/Badge.jsx";
import { Button } from "../common/Button.jsx";
import { IconBook, IconVolume, IconCheck, IconArrowRight } from "../common/Icons.jsx";

export function WordOfTheDayWidget({ vocabulary = [], onRecordWordReview, onOpenVocab }) {
  const [added, setAdded] = useState(false);

  // Deterministically select today's word based on date
  const todayStr = new Date().toISOString().slice(0, 10);
  const hash = todayStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const wordItem = vocabulary.length > 0 ? vocabulary[hash % vocabulary.length] : null;

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!wordItem?.word || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordItem.word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  const handleAddSrs = (e) => {
    e.stopPropagation();
    if (!wordItem || added) return;
    if (onRecordWordReview) {
      onRecordWordReview(wordItem.word, wordItem.level || "A1", false);
    }
    setAdded(true);
  };

  if (!wordItem) {
    return (
      <div className="sinau-widget-card" id="widget-word-of-day">
        <div className="widget-card-header">
          <div className="widget-card-title-group">
            <IconBook size={14} style={{ color: "var(--color-accent-navy)" }} />
            <h4 className="widget-card-title">Kata Hari Ini</h4>
          </div>
        </div>
        <div className="widget-card-body">
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Memuat kosakata...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sinau-widget-card" id="widget-word-of-day">
      <div className="widget-card-header">
        <div className="widget-card-title-group">
          <IconBook size={14} style={{ color: "var(--color-accent-navy)" }} />
          <h4 className="widget-card-title">Kata Hari Ini</h4>
        </div>
        <Badge variant="gold">{wordItem.level || "A1"}</Badge>
      </div>

      <div className="widget-card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            {wordItem.word}
          </h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleSpeak}
            title="Dengarkan Pengucapan"
            style={{ padding: "4px 8px", height: "auto" }}
          >
            <IconVolume size={14} />
          </button>
        </div>

        {wordItem.phonetic && (
          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontStyle: "italic", marginBottom: "4px", display: "block" }}>
            /{wordItem.phonetic}/
          </span>
        )}

        <p style={{ margin: "2px 0 6px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent-navy)" }}>
          {wordItem.definition_id || wordItem.meaning_id || wordItem.definition || "Kosakata pilihan hari ini"}
        </p>

        {wordItem.example_en && (
          <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-secondary)", fontStyle: "italic", lineHeight: 1.4 }}>
            "{wordItem.example_en}"
          </p>
        )}
      </div>

      <div className="widget-card-footer">
        <button
          type="button"
          onClick={handleAddSrs}
          disabled={added}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "11px", padding: "3px 8px", height: "auto", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          {added ? (
            <>
              <IconCheck size={12} /> Masuk SRS
            </>
          ) : (
            "+ Simpan ke SRS"
          )}
        </button>

        {onOpenVocab && (
          <button
            type="button"
            onClick={onOpenVocab}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "11px", padding: "3px 6px", height: "auto", display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-text-secondary)" }}
          >
            Semua Kosakata <IconArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

