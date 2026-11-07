import React from "react";

/**
 * SINAUENGLISH V2 — 4-State Resilient Sync Status Pill
 * 
 * Displays transparent real-time state:
 * 1. "Tersimpan" (Hijau - Semua data aman di cloud)
 * 2. "Menyinkronkan..." (Kuning/Emas animasi - Batch sedang dikirim)
 * 3. "Menunggu sinkronisasi (N)" (Oranye - N item antre di outbox IndexedDB)
 * 4. "Gagal, akan dicoba lagi" (Merah - Server/jaringan offline, ada tombol retry)
 */
export function SyncStatusIndicator({
  syncStatus = "saved",
  outboxCount = 0,
  syncError = null,
  isAuthenticated = false,
  onRetry = null
}) {
  if (!isAuthenticated) {
    return (
      <div
        className="storage-pill storage-pill-guest"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "var(--color-bg-secondary, #F1F5F9)",
          border: "1px solid var(--border-color, #E2E8F0)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--color-text-secondary, #64748B)"
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#94A3B8"
          }}
        />
        <span>Mode Tamu</span>
      </div>
    );
  }

  // Do not show a cloud-save confirmation until the first authenticated read succeeds.
  if (syncStatus === "checking") {
    return (
      <div
        className="storage-pill storage-pill-checking"
        role="status"
        aria-live="polite"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "var(--color-bg-secondary, #F1F5F9)",
          border: "1px solid var(--border-color, #E2E8F0)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--color-text-secondary, #64748B)"
        }}
      >
        <span>Memeriksa penyimpanan...</span>
      </div>
    );
  }

  // 1. "error" — must take priority over pending so failures stay visible.
  if (syncStatus === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="storage-pill storage-pill-error"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FCA5A5",
          fontSize: "12px",
          fontWeight: 600,
          color: "#991B1B",
          cursor: onRetry ? "pointer" : "default"
        }}
        title={syncError ? `${syncError}. Klik untuk mencoba lagi.` : "Gagal sinkron. Klik untuk mencoba lagi."}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#DC2626"
          }}
        />
        <span>Gagal, akan dicoba lagi</span>
      </button>
    );
  }

  // 2. "syncing"
  if (syncStatus === "syncing") {
    return (
      <div
        className="storage-pill storage-pill-syncing"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "#FEF9C3",
          border: "1px solid #FDE047",
          fontSize: "12px",
          fontWeight: 600,
          color: "#854D0E"
        }}
        title="Sedang mengirim pembaruan ke server..."
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "spin 1s linear infinite" }}
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <span>Menyinkronkan...</span>
      </div>
    );
  }

  // 3. "pending" (outboxCount > 0)
  if (syncStatus === "pending" || outboxCount > 0) {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="storage-pill storage-pill-pending"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "#FFF7ED",
          border: "1px solid #FDBA74",
          fontSize: "12px",
          fontWeight: 600,
          color: "#9A3412",
          cursor: onRetry ? "pointer" : "default"
        }}
        title={`Ada ${outboxCount} aktivitas di antrean outbox offline. Klik untuk sinkronkan sekarang.`}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#EA580C"
          }}
        />
        <span>Menunggu sinkronisasi ({outboxCount})</span>
      </button>
    );
  }

  // 4. "saved" (Green check default)
  return (
    <div
      className="storage-pill storage-pill-saved"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: "#F0FDF4",
        border: "1px solid #86EFAC",
        fontSize: "12px",
        fontWeight: 600,
        color: "#166534"
      }}
      title="Semua progres belajar telah tersimpan aman di cloud Neon."
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#16A34A"
        }}
      />
      <span>Tersimpan</span>
    </div>
  );
}

