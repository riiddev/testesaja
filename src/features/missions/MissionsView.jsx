import {
  IconCheck
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";
import { useDailyQuests } from "../../hooks/useDailyQuests.js";
import "../../styles/missions.css";

export function MissionsView({ onRewardClaimed }) {
  const {
    quests,
    todayStr,
    timeUntilReset,
    completedCount,
    claimedCount,
    allCompleted,
    claimReward
  } = useDailyQuests({ onRewardClaimed });

  const [claimFeedback, setClaimFeedback] = useState(null);

  const handleClaim = (quest) => {
    claimReward(quest.id);
    setClaimFeedback(`Berhasil mengklaim +${quest.xpReward} EXP & +${quest.coinsReward} Koin Sinau!`);
    setTimeout(() => setClaimFeedback(null), 3500);
  };

  // Format today date nicely in Indonesian (e.g. "Rabu, 4 November 2026")
  const formattedDate = (() => {
    try {
      const d = new Date();
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return todayStr;
    }
  })();

  const totalPossibleXp = quests.reduce((acc, q) => acc + q.xpReward, 0);
  const totalPossibleCoins = quests.reduce((acc, q) => acc + q.coinsReward, 0);

  return (
    <div className="missions-container" id="missions-view-root">
      {/* 1. MISSIONS HEADER CARD */}
      <section className="missions-header-card" aria-label="Ringkasan Misi Harian">
        <div className="missions-top-bar">
          <div className="missions-title-wrap">
            <span className="missions-eyebrow">Pusat Sasaran Belajar</span>
            <h2 className="missions-main-title">Misi Harian Cendekiawan</h2>
            <p className="missions-desc">
              Selesaikan 3 sasaran harian untuk menjaga ketajaman memori, mengumpulkan poin EXP, dan meraih Koin Sinau.
            </p>
          </div>

          <div className="missions-meta-pills">
            <span className="mission-pill pill-timer" title="Waktu tersisa hingga pergantian misi hari baru">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Reset: {timeUntilReset || "Malam ini"}
            </span>

            <span className="mission-pill pill-status">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {completedCount} / {quests.length} Selesai
            </span>
          </div>
        </div>

        {/* Date & Reward Summary Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formattedDate}
          </span>
          <span>Potensi Hadiah Hari Ini: <strong>+{totalPossibleXp} EXP</strong> &bull; <strong>+{totalPossibleCoins} Koin Sinau</strong></span>
        </div>

        {/* Toast Alert Feedback */}
        {claimFeedback && (
          <div
            className="card card-tint-sage"
            style={{ padding: "10px 16px", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "8px" }}
            role="status"
            aria-live="polite"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{claimFeedback}</span>
          </div>
        )}
      </section>

      {/* 2. THREE DAILY QUEST CARDS */}
      <section className="missions-list" aria-label="Daftar Misi Hari Ini">
        {quests.map((quest, index) => {
          return (
            <article
              key={quest.id}
              className={`mission-card ${quest.isCompleted ? "is-completed" : ""} ${quest.isClaimed ? "is-claimed" : ""}`}
              id={`mission-card-${index}`}
            >
              <div className="mission-card-header">
                <div className="mission-card-title-group">
                  <div className="mission-icon-box" aria-hidden="true">
                    <QuestIcon type={quest.iconType} />
                  </div>

                  <div className="mission-card-content">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "2px" }}>
                      <h3 className="mission-title-text">{quest.title}</h3>
                      <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "2px 8px" }}>
                        {quest.categoryLabel}
                      </span>
                    </div>
                    <p className="mission-desc-text">{quest.description}</p>
                  </div>
                </div>

                <div className="mission-rewards-group">
                  <span className="reward-badge reward-exp" title="Poin Pengalaman">
                    +{quest.xpReward} EXP
                  </span>
                  <span className="reward-badge reward-coins" title="Koin Sinau">
                    +{quest.coinsReward} Koin
                  </span>
                </div>
              </div>

              {/* Progress Bar Row */}
              <div className="mission-progress-row">
                <div className="mission-track">
                  <div
                    className={`mission-fill ${quest.isCompleted ? "fill-done" : ""}`}
                    style={{ width: `${quest.percentage}%` }}
                  />
                </div>
                <span className="mission-progress-label">
                  {quest.isCompleted ? (
                    <span style={{ color: "var(--color-success)" }}><IconCheck size={12} style={{ marginRight: 3 }} /> Tercapai</span>
                  ) : (
                    `${quest.progress} / ${quest.target} ${quest.unit} (${quest.percentage}%)`
                  )}
                </span>
              </div>

              {/* Actions Footer */}
              <div className="mission-card-footer">
                {quest.isClaimed ? (
                  <span
                    className="scholar-chip chip-neutral"
                    style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-success)", fontWeight: 800 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Hadiah Telah Diklaim
                  </span>
                ) : quest.isCompleted ? (
                  <button
                    type="button"
                    className="btn-claim-reward"
                    onClick={() => handleClaim(quest)}
                    aria-label={`Klaim hadiah untuk ${quest.title}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Klaim Hadiah
                  </button>
                ) : (
                  <Link
                    to={quest.actionUrl}
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
                  >
                    {quest.actionText}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* 3. DAILY COMPLETION CELEBRATION BOX */}
      {allCompleted && (
        <section className="missions-bonus-card" aria-label="Bonus Harian Selesai">
          <div className="bonus-info-group">
            <div className="bonus-trophy-box" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
                <path d="M6 4h12v5a6 6 0 0 1-12 0V4Z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: 800, margin: "0 0 4px" }}>
                Luar Biasa! Semua Misi Hari Ini Tuntas!
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Kamu telah menjaga ritme belajar harian dan memperkuat retensi memori jangka panjang.
              </p>
            </div>
          </div>

          <Link
            to="/belajar/progress"
            className="btn btn-primary btn-sm"
            style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
          >
            Lihat Progres Profil
          </Link>
        </section>
      )}
    </div>
  );
}

// Icon helper function for quest types
function QuestIcon({ type }) {
  switch (type) {
    case "book":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
        </svg>
      );
    case "refresh":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 21h5v-5"/>
        </svg>
      );
    case "award":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      );
    case "book-open":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      );
    case "target":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      );
    case "compass":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
}

