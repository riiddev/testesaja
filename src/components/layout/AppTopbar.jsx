import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { getAssetUrl } from "../../data/assets.js";

export function AppTopbar({
  title = "Beranda Belajar",
  isSidebarOpen = false,
  onToggleSidebar,
  isSyncing = false,
  syncError = null,
  coins = 0,
  level = 1
}) {
  const { isAuthenticated } = useAuth();

  return (
    <header className="app-topbar">
      <div className="topbar-title-wrap">
        <button
          className="mobile-menu-btn"
          id="mobile-menu-btn"
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          aria-label={isSidebarOpen ? "Tutup menu samping" : "Buka menu samping"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            minWidth: "44px",
            minHeight: "44px",
            borderRadius: "var(--radius-pill)"
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="topbar-title" id="topbar-title">
          {title}
        </h1>
      </div>

      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {/* Sinau Coin Pill */}
        <Link
          to="/belajar/collection"
          className="topbar-coin-pill"
          id="topbar-coin-pill"
          title="Buka Koleksi & Toko Sinau"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "var(--radius-pill)",
            border: "1.5px solid #D69E2E",
            backgroundColor: "#FFF9E6",
            color: "#744210",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "var(--text-xs)",
            textDecoration: "none"
          }}
        >
          <img
            src={getAssetUrl("ui", "coin") || "/assets/ui/sinau-coin.png"}
            alt="Sinau Coin"
            style={{ width: "18px", height: "18px", objectFit: "contain", verticalAlign: "middle" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <span id="topbar-coins-count">{coins}</span>
          <span style={{ fontSize: "10px", opacity: 0.85 }}>Coin</span>
        </Link>

        {/* Level Indicator Pill */}
        <span
          className="topbar-level-pill"
          id="topbar-level-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 10px",
            borderRadius: "var(--radius-pill)",
            border: "1.5px solid var(--border-color)",
            backgroundColor: "var(--color-bg-surface)",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "var(--text-xs)",
            color: "var(--color-text-secondary)"
          }}
        >
          Lvl {level}
        </span>

        {/* Cloud Sync Status */}
        <div className="storage-pill">
          <span
            className="storage-dot"
            style={{
              backgroundColor: isSyncing
                ? "var(--color-accent-gold)"
                : syncError
                ? "var(--color-danger)"
                : isAuthenticated
                ? "var(--color-success)"
                : "var(--color-accent-gold)"
            }}
          />
          <span id="storage-status-text">
            {isSyncing
              ? "Menyinkronkan ke Cloud..."
              : syncError
              ? "Sinkron tertunda"
              : isAuthenticated
              ? "Tersimpan di Cloud"
              : "Mode Tamu"}
          </span>
        </div>
      </div>
    </header>
  );
}
