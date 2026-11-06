import React, { useState, useEffect } from "react";
import { Badge } from "../common/Badge.jsx";
import { IconCompass, IconArrowRight } from "../common/Icons.jsx";
import { STORIES_CATALOG } from "../../data/stories/storiesCatalog.js";
import { api } from "../../services/api.js";
import { getAssetUrl } from "../../data/assets.js";

export function StoryProgressWidget({ onOpenStory }) {
  const [storyProgress, setStoryProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await api.getStoryProgress();
        if (isMounted && res && res.data?.progress) {
          setStoryProgress(res.data.progress);
        }
      } catch (e) {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Find currently active story: first story with < 10 completed episodes
  let activeStory = STORIES_CATALOG[0];
  let completedInActive = 0;

  for (let i = 0; i < STORIES_CATALOG.length; i++) {
    const s = STORIES_CATALOG[i];
    const done = (storyProgress[s.id] || []).length;
    if (done < (s.totalEpisodes || 10)) {
      activeStory = s;
      completedInActive = done;
      break;
    }
    // If all completed, active is the last one
    if (i === STORIES_CATALOG.length - 1) {
      activeStory = s;
      completedInActive = done;
    }
  }

  const progressPct = Math.min(100, Math.round((completedInActive / (activeStory.totalEpisodes || 10)) * 100));

  return (
    <div className="sinau-widget-card" id="widget-story-progress">
      <div className="widget-card-header">
        <div className="widget-card-title-group">
          <IconCompass size={14} style={{ color: "var(--color-accent-navy)" }} />
          <h4 className="widget-card-title">Progres Cerita Aktif</h4>
        </div>
        <Badge variant="gold">{activeStory.level}</Badge>
      </div>

      <div className="widget-card-body">
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-2)" }}>
          {getAssetUrl("stories", activeStory.coverAssetKey) && (
            <div
              style={{
                width: "48px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid var(--border-color)"
              }}
            >
              <img
                src={getAssetUrl("stories", activeStory.coverAssetKey)}
                alt={activeStory.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h5 style={{ margin: 0, fontSize: "var(--text-sm)", fontFamily: "var(--font-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeStory.title}
            </h5>
            <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
              Cerita {activeStory.number} • {completedInActive} / {activeStory.totalEpisodes || 10} Episode
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: "6px", background: "var(--color-bg-subtle)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)", marginBottom: "4px" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "var(--color-accent-navy)",
              transition: "width 0.3s ease"
            }}
          />
        </div>
        <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
          {progressPct === 100 ? "Cerita tamat!" : `Episode berikutnya: Episode ${completedInActive + 1}`}
        </span>
      </div>

      <div className="widget-card-footer">
        <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
          100 Kisah Bersambung
        </span>

        {onOpenStory && (
          <button
            type="button"
            onClick={onOpenStory}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "11px", padding: "3px 8px", height: "auto", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            Lanjut Baca <IconArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

