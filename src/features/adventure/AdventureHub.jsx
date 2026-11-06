import React, { useState, useEffect } from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import {
  IconTarget,
  IconClock,
  IconLock,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconArrowUpRight,
  IconRefresh,
  IconTrophy
} from "../../components/common/Icons.jsx";
import { STORIES_CATALOG } from "../../data/stories/storiesCatalog.js";
import story01Data from "../../data/stories/story-01.json";
import story02Data from "../../data/stories/story-02.json";
import story03Data from "../../data/stories/story-03.json";
import story04Data from "../../data/stories/story-04.json";
import story05Data from "../../data/stories/story-05.json";
import story06Data from "../../data/stories/story-06.json";
import story07Data from "../../data/stories/story-07.json";
import story08Data from "../../data/stories/story-08.json";
import story09Data from "../../data/stories/story-09.json";
import story10Data from "../../data/stories/story-10.json";
import { StoryRunner } from "./StoryRunner.jsx";
import { api } from "../../services/api.js";
import { getAssetUrl } from "../../data/assets.js";
import "../../styles/adventure.css";

// Map of available story content bundles
const STORIES_CONTENT_MAP = {
  "story-01": story01Data,
  "story-02": story02Data,
  "story-03": story03Data,
  "story-04": story04Data,
  "story-05": story05Data,
  "story-06": story06Data,
  "story-07": story07Data,
  "story-08": story08Data,
  "story-09": story09Data,
  "story-10": story10Data
};

export function AdventureHub({ userProfileHook, onRecordWordReview }) {
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeRunningEpisode, setActiveRunningEpisode] = useState(null);
  const [storyProgressData, setStoryProgressData] = useState({ progress: {}, hasUnlockedNewEpisodeToday: false });
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  const userLevel = userProfileHook?.calculatedLevel || userProfileHook?.profile?.level || 1;

  // Fetch story progress from cloud/local
  const refreshProgress = async () => {
    try {
      const res = await api.getStoryProgress();
      if (res && res.data) {
        setStoryProgressData(res.data);
      }
    } catch (e) {
      console.warn("Fetch story progress error:", e);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  /**
   * Sequential story unlocking:
   * Story 1 is always unlocked.
   * Story N requires all 10 episodes of Story N-1 to be completed.
   */
  const isStoryUnlocked = (storyIndex) => {
    if (storyIndex === 0) return true;
    const prevStory = STORIES_CATALOG[storyIndex - 1];
    if (!prevStory) return true;
    const prevCompletedCount = (storyProgressData.progress?.[prevStory.id] || []).length;
    return prevCompletedCount >= (prevStory.totalEpisodes || 10);
  };

  // If a story was selected but is not unlocked, safely reset
  useEffect(() => {
    if (selectedStory) {
      const idx = STORIES_CATALOG.findIndex((s) => s.id === selectedStory.id);
      if (idx !== -1 && !isStoryUnlocked(idx)) {
        setSelectedStory(null);
      }
    }
  }, [storyProgressData, selectedStory]);

  const completedEpisodes = selectedStory ? (storyProgressData.progress?.[selectedStory.id] || []) : [];
  const totalCompletedEpisodes = Object.values(storyProgressData.progress || {}).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );
  const unlockedStoriesCount = STORIES_CATALOG.filter((_, idx) => isStoryUnlocked(idx)).length;

  return (
    <div className="adventure-hub-container" id="adventure-hub-view">
      {/* VIEW A: ROADMAP 10 EPISODE UNTUK CERITA TERPILIH */}
      {selectedStory ? (
        <div id="story-episodes-roadmap-view">
          {/* Breadcrumb / Back button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedStory(null)}
              id="back-to-stories-catalog-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <IconArrowLeft size={14} /> Kembali ke 10 Cerita Petualangan
            </Button>

            <span className="scholar-chip chip-gold" style={{ fontSize: "11px", fontWeight: 800 }}>
              Level {selectedStory.level} • {selectedStory.totalEpisodes} Episode
            </span>
          </div>

          {/* Story Hero Banner */}
          <div
            className="card card-tint-slate story-hero-banner"
            style={{
              padding: "var(--space-6) var(--space-8)",
              marginBottom: "var(--space-6)",
              display: "flex",
              gap: "var(--space-6)",
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            {getAssetUrl("stories", selectedStory.coverAssetKey) && (
              <div
                className="story-hero-cover-wrap"
                style={{
                  width: "220px",
                  height: "148px",
                  flexShrink: 0,
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "var(--border-sm)",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <img
                  src={getAssetUrl("stories", selectedStory.coverAssetKey)}
                  alt={selectedStory.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <Badge variant="navy">Cerita {selectedStory.number}</Badge>
                <Badge variant="gold">{selectedStory.level}</Badge>
              </div>
              <h2 style={{ fontSize: "var(--text-3xl)", fontFamily: "var(--font-heading)", margin: "0 0 var(--space-2) 0" }}>
                {selectedStory.title}
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-3) 0" }}>
                {selectedStory.description}
              </p>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconTarget size={14} /> Fokus Pembelajaran: {selectedStory.learningFocus}
              </div>
            </div>
          </div>

          {/* Daily Pacing Notice */}
          <div
            className="card card-tint-sand"
            style={{
              padding: "var(--space-4) var(--space-5)",
              marginBottom: "var(--space-5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              flexWrap: "wrap"
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#744210", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <IconClock size={13} /> Ritme Belajar Harian (Pacing Sistematis)
              </span>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                Pengguna dapat membuka <strong>1 episode baru per hari (WIB)</strong> untuk menjaga daya serap memori. Episode yang telah tuntas dapat diulang kapan saja tanpa batasan.
              </p>
            </div>
            <div>
              <span className={`scholar-chip ${storyProgressData.hasUnlockedNewEpisodeToday ? "chip-neutral" : "chip-level"}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {storyProgressData.hasUnlockedNewEpisodeToday ? (
                  <>
                    <IconClock size={12} /> Episode baru dibuka esok hari (WIB)
                  </>
                ) : (
                  <>
                    <IconCheck size={12} /> 1 Episode Baru Tersedia Hari Ini
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Celebration Banner when 10/10 episodes completed */}
          {completedEpisodes.length >= (selectedStory.totalEpisodes || 10) && (
            <div
              className="card card-tint-gold story-completion-banner"
              id="story-completion-banner"
              style={{
                padding: "var(--space-4) var(--space-5)",
                marginBottom: "var(--space-5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-4)",
                border: "1px solid var(--color-accent-gold)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(214, 158, 46, 0.08)",
                flexWrap: "wrap"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <IconTrophy size={18} style={{ color: "var(--color-accent-gold)" }} />
                  <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    Selamat! Cerita {selectedStory.number} Tamat (10/10 Episode Selesai)!
                  </strong>
                  <span className="scholar-chip chip-gold" style={{ fontSize: "10px" }}>Tuntas</span>
                </div>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Seluruh episode pada bab ini telah selesai dipelajari. Cerita berikutnya kini telah terbuka dan siap dijelajahi.
                </p>
              </div>
              {selectedStory.number < STORIES_CATALOG.length && (
                <Button
                  variant="primary"
                  size="sm"
                  id="go-to-next-story-btn"
                  onClick={() => {
                    const nextStory = STORIES_CATALOG.find((s) => s.number === selectedStory.number + 1);
                    if (nextStory) {
                      setSelectedStory(nextStory);
                    }
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  Lanjut ke Cerita {selectedStory.number + 1} <IconArrowRight size={14} />
                </Button>
              )}
            </div>
          )}

          {/* 10 EPISODES ROADMAP GRID */}
          <h3 style={{ fontSize: "var(--text-xl)", fontFamily: "var(--font-heading)", marginBottom: "var(--space-3)" }}>
            Peta 10 Episode: {selectedStory.title}
          </h3>

          <div className="episode-roadmap-grid">
            {(STORIES_CONTENT_MAP[selectedStory.id]?.episodes || []).map((ep) => {
              const isCompleted = completedEpisodes.includes(ep.id);
              // An episode is unlocked if it is Episode 1, OR if the previous episode is completed
              const isPrevCompleted = ep.id === 1 || completedEpisodes.includes(ep.id - 1);
              const isLocked = !isCompleted && !isPrevCompleted;
              const isCurrent = !isCompleted && isPrevCompleted;

              return (
                <div
                  key={ep.id}
                  className={`episode-node-card ${
                    isCompleted ? "is-completed" : isCurrent ? "is-current" : "is-locked"
                  }`}
                  onClick={() => {
                    if (!isLocked) {
                      setActiveRunningEpisode(ep);
                    }
                  }}
                  id={`episode-card-${ep.id}`}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                    <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                      Episode {ep.id}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: isCompleted ? "var(--color-success)" : isCurrent ? "#744210" : "var(--color-text-secondary)"
                      }}
                    >
                      {isCompleted ? (
                        <>
                          <IconCheck size={12} /> Selesai
                        </>
                      ) : isCurrent ? (
                        <>
                          Tersedia <IconArrowUpRight size={12} />
                        </>
                      ) : (
                        <>
                          <IconLock size={12} /> Terkunci
                        </>
                      )}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-heading)", margin: "0 0 4px 0" }}>
                    {ep.title}
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontStyle: "italic", margin: "0 0 var(--space-3) 0" }}>
                    {ep.titleEn}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--border-color)", paddingTop: "var(--space-2)", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <IconClock size={12} /> {ep.estimatedMinutes || 10} Menit
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--color-accent-navy)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {isCompleted ? (
                        <>
                          <IconRefresh size={12} /> Ulangi
                        </>
                      ) : isCurrent ? (
                        <>
                          Mulai Baca <IconArrowUpRight size={12} />
                        </>
                      ) : (
                        "Belum Terbuka"
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW B: 10 STORIES MASTER CATALOG */
        <div id="stories-catalog-overview">
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 className="section-title">Petualangan Bahasa Inggris Terapan</h2>
            <p className="section-desc">
              10 Kisah bersambung (100 Episode) melintasi level A1 hingga C1. Tuntaskan satu per satu cerita untuk membuka kisah petualangan berikutnya.
            </p>
          </div>

          {/* User Progress Stats Row */}
          <div className="adventure-stats-row">
            <div className="card stat-card">
              <span className="stat-label">Cerita Terbuka</span>
              <span className="stat-value" id="stat-stories-unlocked">
                {unlockedStoriesCount} / 10
              </span>
              <span className="stat-desc">Selesaikan 10 episode per cerita untuk membuka cerita selanjutnya</span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Episode Selesai</span>
              <span className="stat-value" id="stat-episodes-completed">
                {totalCompletedEpisodes} / 100
              </span>
              <span className="stat-desc">+50 EXP & +30 Koin per episode</span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Pacing Harian</span>
              <span className="stat-value" style={{ fontSize: "var(--text-lg)" }} id="stat-daily-pacing-status">
                {storyProgressData.hasUnlockedNewEpisodeToday ? "Sudah Membaca" : "Siap Dibaca"}
              </span>
              <span className="stat-desc">Maksimal 1 episode baru per hari WIB</span>
            </div>
          </div>

          {/* 10 Stories Grid */}
          <div className="story-card-grid">
            {STORIES_CATALOG.map((story, index) => {
              const isUnlocked = isStoryUnlocked(index);
              const hasContent = Boolean(STORIES_CONTENT_MAP[story.id]);
              const storyEpisodes = storyProgressData.progress?.[story.id] || [];
              const completedCount = storyEpisodes.length;
              const isStoryFinished = completedCount >= (story.totalEpisodes || 10);

              return (
                <div
                  key={story.id}
                  id={`story-catalog-card-${story.id}`}
                  className={`story-hub-card ${!isUnlocked ? "is-locked" : ""} ${isStoryFinished ? "is-story-finished" : ""}`}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedStory(story);
                    }
                  }}
                  style={{
                    borderLeft: isUnlocked
                      ? `6px solid ${story.themeColor || "var(--color-accent-navy)"}`
                      : "var(--border-sm)",
                    cursor: isUnlocked ? "pointer" : "not-allowed",
                    opacity: isUnlocked ? 1 : 0.72
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                        <Badge variant="navy">Cerita {story.number}</Badge>
                        <Badge variant="gold">{story.level}</Badge>
                      </div>
                      <span
                        className="story-lock-status-badge"
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: isStoryFinished
                            ? "var(--color-accent-gold)"
                            : isUnlocked
                            ? "var(--color-success)"
                            : "var(--color-text-secondary)"
                        }}
                      >
                        {isStoryFinished ? (
                          <>
                            <IconTrophy size={13} /> Tamat (10/10)
                          </>
                        ) : isUnlocked ? (
                          <>
                            <IconCheck size={13} /> Terbuka
                          </>
                        ) : (
                          <>
                            <IconLock size={13} /> Butuh Cerita {story.number - 1} Selesai
                          </>
                        )}
                      </span>
                    </div>

                    {/* Story Cover Thumbnail */}
                    {getAssetUrl("stories", story.coverAssetKey) && (
                      <div
                        className="story-card-cover-container"
                        style={{
                          width: "100%",
                          height: "140px",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          marginBottom: "var(--space-3)",
                          position: "relative",
                          backgroundColor: "var(--color-bg-subtle)"
                        }}
                      >
                        <img
                          src={getAssetUrl("stories", story.coverAssetKey)}
                          alt={`Sampul ${story.title}`}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            filter: isUnlocked ? "none" : "grayscale(80%) opacity(0.55)"
                          }}
                        />
                      </div>
                    )}

                    <h3 style={{ fontSize: "var(--text-xl)", fontFamily: "var(--font-heading)", marginBottom: "4px" }}>
                      {story.title}
                    </h3>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic", margin: "0 0 var(--space-3) 0" }}>
                      {story.titleEn}
                    </p>

                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.5, margin: "0 0 var(--space-4) 0" }}>
                      {story.description}
                    </p>
                  </div>

                  <div style={{ borderTop: "var(--border-sm)", paddingTop: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                      {completedCount} / {story.totalEpisodes || 10} Episode Selesai
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: isUnlocked ? "var(--color-accent-navy)" : "var(--color-text-secondary)"
                      }}
                    >
                      {isUnlocked ? (
                        <>
                          Buka Petualangan <IconArrowUpRight size={13} />
                        </>
                      ) : (
                        <>
                          <IconLock size={13} /> Terkunci (Cerita {story.number - 1})
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE STORY RUNNER MODAL */}
      {activeRunningEpisode && selectedStory && (
        <StoryRunner
          story={selectedStory}
          episode={activeRunningEpisode}
          onClose={() => {
            setActiveRunningEpisode(null);
            refreshProgress();
          }}
          onRecordWordReview={onRecordWordReview}
          claimReward={userProfileHook?.claimReward}
          equippedOutfit={userProfileHook?.equippedOutfit}
          onEpisodeCompleted={() => {
            refreshProgress();
          }}
        />
      )}
    </div>
  );
}
