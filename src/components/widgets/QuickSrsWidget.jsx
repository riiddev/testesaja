import React from "react";
import { Badge } from "../common/Badge.jsx";
import { IconClock, IconCheck, IconArrowRight } from "../common/Icons.jsx";

export function QuickSrsWidget({ progressMap = {}, onOpenReview }) {
  const records = Object.values(progressMap || {});
  const now = new Date();
  
  // Count words due for review: nextReview <= now OR status === "learning"
  const dueItems = records.filter((rec) => {
    if (!rec) return false;
    if (!rec.nextReview) return true;
    return new Date(rec.nextReview) <= now;
  });

  const dueCount = dueItems.length;
  const totalTracked = records.length;
  const masteredCount = records.filter((rec) => rec.status === "mastered").length;

  return (
    <div className="sinau-widget-card" id="widget-quick-srs">
      <div className="widget-card-header">
        <div className="widget-card-title-group">
          <IconClock size={14} style={{ color: "var(--color-accent-navy)" }} />
          <h4 className="widget-card-title">Antrean Kilat SRS</h4>
        </div>
        <Badge variant={dueCount > 0 ? "rose" : "mint"}>
          {dueCount > 0 ? `${dueCount} Butuh Review` : "Tuntas"}
        </Badge>
      </div>

      <div className="widget-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
          <div>
            <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, fontFamily: "var(--font-heading)", color: dueCount > 0 ? "var(--color-accent-navy)" : "var(--color-success)" }}>
              {dueCount}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginLeft: "6px" }}>
              kata jatuh tempo
            </span>
          </div>

          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
            {masteredCount} / {totalTracked} Dikuasai
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
          {dueCount > 0
            ? "Kosakata ini telah mencapai jadwal interval memori. Tinjau sekarang agar tidak terlupakan!"
            : "Luar biasa! Tidak ada kata yang jatuh tempo saat ini. Anda dapat menambah kosakata baru."}
        </p>
      </div>

      <div className="widget-card-footer">
        <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
          Metode Spaced Repetition
        </span>

        {onOpenReview && (
          <button
            type="button"
            onClick={onOpenReview}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "11px", padding: "3px 8px", height: "auto", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            {dueCount > 0 ? "Mulai Review" : "Buka Jurnal"} <IconArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

