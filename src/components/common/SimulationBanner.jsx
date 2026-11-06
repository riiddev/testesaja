import React from "react";

export function SimulationBanner() {
  // Only display if development build AND explicitly enabled via VITE_ENABLE_MOCK
  const isMockActive = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK === "true";

  if (!isMockActive) return null;

  return (
    <aside
      role="alert"
      className="simulation-mode-banner"
      style={{
        backgroundColor: "#D97706",
        color: "#FFFFFF",
        padding: "8px 16px",
        textAlign: "center",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        letterSpacing: "0.02em",
        position: "sticky",
        top: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}
    >
      <span aria-hidden="true">⚠️</span>
      <span>
        <strong>MODE SIMULASI AKTIF:</strong> Backend sedang disimulasikan secara lokal (Data tidak tersimpan ke database Neon).
      </span>
    </aside>
  );
}

