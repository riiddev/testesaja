import React from "react";
import { Badge } from "../common/Badge.jsx";
import { IconFire, IconSparkles, IconCoin, IconArrowRight } from "../common/Icons.jsx";
import { getAssetUrl } from "../../data/assets.js";

export function StreakLevelWidget({ userProfile, onOpenProfile }) {
  const streak = userProfile?.streak || 0;
  const level = userProfile?.calculatedLevel || userProfile?.profile?.level || 1;
  const xp = userProfile?.profile?.xp || 0;
  const coins = userProfile?.profile?.coins || 0;
  const activeTitle = userProfile?.activeTitleObj?.name || "Pelajar Pemula";

  // XP calculation for next level: Level * 100
  const currentLevelBaseXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  const xpInCurrentLevel = Math.max(0, xp - currentLevelBaseXp);
  const xpSpan = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const progressPct = Math.min(100, Math.round((xpInCurrentLevel / xpSpan) * 100));

  return (
    <div className="sinau-widget-card" id="widget-streak-level">
      <div className="widget-card-header">
        <div className="widget-card-title-group">
          <IconFire size={14} style={{ color: "#E05A47" }} />
          <h4 className="widget-card-title">Pelacak Konsistensi</h4>
        </div>
        <Badge variant="navy">Level {level}</Badge>
      </div>

      <div className="widget-card-body">
        {/* Streak and Coins Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-2xl)", fontWeight: 800, fontFamily: "var(--font-heading)", color: streak > 0 ? "#C05621" : "var(--color-text-secondary)" }}>
              {streak}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", lineHeight: 1.2 }}>
              Hari<br />Streak
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {getAssetUrl("ui", "coin") ? (
              <img
                src={getAssetUrl("ui", "coin")}
                alt="Sinau Coin"
                style={{ width: "20px", height: "20px", objectFit: "contain" }}
              />
            ) : (
              <IconCoin size={18} style={{ color: "var(--color-accent-gold)" }} />
            )}
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#744210" }}>
              {coins}
            </span>
          </div>
        </div>

        {/* Level XP Bar */}
        <div style={{ marginBottom: "var(--space-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "2px" }}>
            <span>Progres Level ({xp} XP)</span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ height: "6px", background: "var(--color-bg-subtle)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, var(--color-accent-gold), #C05621)",
                transition: "width 0.3s ease"
              }}
            />
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-secondary)" }}>
          Gelar: <strong>{activeTitle}</strong>
        </p>
      </div>

      <div className="widget-card-footer">
        <span style={{ fontSize: "11px", color: streak > 0 ? "var(--color-success)" : "var(--color-text-secondary)", fontWeight: 700 }}>
          {streak > 0 ? "Momentum aktif!" : "Mulai belajar hari ini"}
        </span>

        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "11px", padding: "3px 6px", height: "auto", display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-text-secondary)" }}
          >
            Lihat Profil <IconArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

