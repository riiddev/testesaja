import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAssetUrl } from "../../data/assets.js";
import { IconArrowUpRight } from "./Icons.jsx";

/**
 * In-App Floating Top Reminder Banner
 * Slides down smoothly from the top of the mobile/tablet screen when a study reminder triggers.
 */
export function StudyReminderBanner({ reminder, onDismiss }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!reminder) return;
    // Auto dismiss after 12 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 12000);
    return () => clearTimeout(timer);
  }, [reminder, onDismiss]);

  if (!reminder) return null;

  const mascotUrl = getAssetUrl("mascot.encouraging") || "/assets/mascot/kanci-encouraging.png";

  const handleAction = () => {
    onDismiss();
    if (reminder.url) {
      navigate(reminder.url);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      id="in-app-study-reminder"
      style={{
        position: "fixed",
        top: "14px",
        left: "14px",
        right: "14px",
        maxWidth: "460px",
        margin: "0 auto",
        zIndex: 99999,
        backgroundColor: "#FFFDF7",
        border: "2.5px solid #1E1E1E",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.18), 4px 4px 0 #1E1E1E",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        animation: "slideDownNotif 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}
    >
      <style>{`
        @keyframes slideDownNotif {
          from {
            transform: translateY(-120%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Mascot Thumbnail */}
      <img
        src={mascotUrl}
        alt="Kanci Si Kancil"
        style={{
          width: "46px",
          height: "46px",
          objectFit: "contain",
          flexShrink: 0,
          filter: "drop-shadow(2px 2px 0 rgba(0,0,0,0.15))"
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "3px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#B7791F" }}>
            Pengingat Belajar
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup pengingat"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              color: "#718096",
              fontSize: "16px",
              lineHeight: 1,
              fontWeight: "bold"
            }}
          >
            ×
          </button>
        </div>

        <h4 style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: 800, color: "#1A202C", lineHeight: 1.3 }}>
          {reminder.title || "Saatnya Belajar SinauEnglish!"}
        </h4>

        <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#4A5568", lineHeight: 1.4 }}>
          {reminder.body || "Selesaikan misi harian dan review kata untuk mengamankan streak belajarmu hari ini."}
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleAction}
            className="btn btn-primary btn-sm"
            style={{
              padding: "5px 12px",
              fontSize: "11px",
              fontWeight: 800,
              minHeight: "32px",
              borderRadius: "20px"
            }}
          >
            Mulai Belajar Sekarang <IconArrowUpRight size={13} style={{ marginLeft: 4 }} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="btn btn-secondary btn-sm"
            style={{
              padding: "5px 10px",
              fontSize: "11px",
              minHeight: "32px",
              borderRadius: "20px"
            }}
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}

