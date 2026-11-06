import React, { useState, useEffect } from "react";
import { WordOfTheDayWidget } from "./WordOfTheDayWidget.jsx";
import { StreakLevelWidget } from "./StreakLevelWidget.jsx";
import { KanciTipWidget } from "./KanciTipWidget.jsx";
import { QuickSrsWidget } from "./QuickSrsWidget.jsx";
import { StoryProgressWidget } from "./StoryProgressWidget.jsx";
import {
  IconWidget,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconCheck
} from "../common/Icons.jsx";
import "../../styles/widgets.css";

const ALL_WIDGETS_CONFIG = [
  {
    id: "word_of_day",
    title: "Kata Hari Ini",
    desc: "Kosakata harian Oxford 3000 lengkap dengan audio dan contoh konteks."
  },
  {
    id: "streak_level",
    title: "Pelacak Konsistensi & Level",
    desc: "Pantau streak harian, perolehan XP, level saat ini, dan koin belajar."
  },
  {
    id: "kanci_tips",
    title: "Tips Sahabat Kanci",
    desc: "Strategi belajar efektif, teknik active recall, dan motivasi Kanci."
  },
  {
    id: "quick_srs",
    title: "Antrean Kilat SRS",
    desc: "Hitungan kosakata memori yang jatuh tempo dan siap direview."
  },
  {
    id: "story_progress",
    title: "Progres Cerita Aktif",
    desc: "Status kemajuan episode cerita petualangan yang sedang dipelajari."
  }
];

const DEFAULT_ACTIVE_IDS = ["word_of_day", "streak_level", "kanci_tips", "quick_srs", "story_progress"];

export function WidgetDeck({
  vocabulary = [],
  userProfile = {},
  progressMap = {},
  onRecordWordReview,
  onNavigate
}) {
  const [activeWidgetIds, setActiveWidgetIds] = useState(() => {
    try {
      const saved = localStorage.getItem("sinau_active_widgets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ACTIVE_IDS;
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sinau_widgets_collapsed") === "true";
    } catch (e) {
      return false;
    }
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sinau_widgets_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleToggleWidget = (id) => {
    setActiveWidgetIds((prev) => {
      let next;
      if (prev.includes(id)) {
        // Prevent disabling all widgets (keep at least 1)
        if (prev.length <= 1) return prev;
        next = prev.filter((item) => item !== id);
      } else {
        next = [...prev, id];
      }
      try {
        localStorage.setItem("sinau_active_widgets", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetDefaults = () => {
    setActiveWidgetIds(DEFAULT_ACTIVE_IDS);
    try {
      localStorage.setItem("sinau_active_widgets", JSON.stringify(DEFAULT_ACTIVE_IDS));
    } catch (e) {}
  };

  return (
    <div className="widgets-deck-container" id="widget-deck-container">
      {/* HEADER BAR */}
      <div className="widgets-deck-header">
        <div className="widgets-deck-title-area">
          <IconWidget size={16} style={{ color: "var(--color-accent-navy)" }} />
          <h3 className="widgets-deck-title">Widget Belajar Interaktif</h3>
          <span className="scholar-chip chip-gold" style={{ fontSize: "10px", padding: "1px 6px" }}>
            {activeWidgetIds.length} Aktif
          </span>
        </div>

        <div className="widgets-deck-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsConfigOpen(true)}
            id="open-widget-config-btn"
            style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <IconWidget size={13} /> Atur Pilihan Widget
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={toggleCollapse}
            id="toggle-widget-collapse-btn"
            title={isCollapsed ? "Buka Widget" : "Sembunyikan Widget"}
            style={{ width: "28px", height: "28px", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            {isCollapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* GRID BODY (COLLAPSIBLE) */}
      {!isCollapsed && (
        <div className="widgets-grid" id="widgets-grid">
          {activeWidgetIds.includes("word_of_day") && (
            <WordOfTheDayWidget
              vocabulary={vocabulary}
              onRecordWordReview={onRecordWordReview}
              onOpenVocab={() => onNavigate && onNavigate("vocabulary")}
            />
          )}

          {activeWidgetIds.includes("streak_level") && (
            <StreakLevelWidget
              userProfile={userProfile}
              onOpenProfile={() => onNavigate && onNavigate("profile")}
            />
          )}

          {activeWidgetIds.includes("kanci_tips") && (
            <KanciTipWidget equippedOutfit={userProfile?.equippedOutfit} />
          )}

          {activeWidgetIds.includes("quick_srs") && (
            <QuickSrsWidget
              progressMap={progressMap}
              onOpenReview={() => onNavigate && onNavigate("review")}
            />
          )}

          {activeWidgetIds.includes("story_progress") && (
            <StoryProgressWidget onOpenStory={() => onNavigate && onNavigate("adventure")} />
          )}
        </div>
      )}

      {/* MODAL CONFIGURATION */}
      {isConfigOpen && (
        <div
          className="widget-config-modal-backdrop"
          onClick={() => setIsConfigOpen(false)}
          id="widget-config-modal"
        >
          <div
            className="widget-config-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4) var(--space-5)", borderBottom: "var(--border-sm)" }}>
              <div>
                <h4 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-md)" }}>
                  Pilih Widget Aktif
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                  Sesuaikan informasi belajar yang tampil di layar Tablet & HP Anda.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsConfigOpen(false)}
                id="close-widget-config-btn"
                style={{ width: "28px", height: "28px", padding: 0 }}
              >
                <IconClose size={14} />
              </button>
            </div>

            <div style={{ padding: "var(--space-2) 0", maxHeight: "60vh", overflowY: "auto" }}>
              {ALL_WIDGETS_CONFIG.map((cfg) => {
                const isActive = activeWidgetIds.includes(cfg.id);
                return (
                  <div
                    key={cfg.id}
                    className="widget-config-item"
                    id={`widget-toggle-row-${cfg.id}`}
                    onClick={() => handleToggleWidget(cfg.id)}
                  >
                    <div style={{ flex: 1, paddingRight: "var(--space-3)" }}>
                      <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", display: "block" }}>
                        {cfg.title}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        {cfg.desc}
                      </span>
                    </div>

                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "var(--radius-sm)",
                        border: isActive ? "2px solid var(--color-accent-navy)" : "2px solid var(--border-color)",
                        background: isActive ? "var(--color-accent-navy)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      {isActive && <IconCheck size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3) var(--space-5)", borderTop: "var(--border-sm)", background: "var(--color-bg-subtle)" }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResetDefaults}
                style={{ fontSize: "11px" }}
              >
                Reset Default
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsConfigOpen(false)}
                id="save-widget-config-btn"
                style={{ fontSize: "12px", padding: "4px 14px" }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

