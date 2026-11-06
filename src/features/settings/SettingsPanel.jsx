import {
  IconCheck
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { usePWA } from "../../hooks/usePWA.js";
import { Button } from "../../components/common/Button.jsx";
import { api } from "../../services/api.js";

export function SettingsPanel({ onProgressReload }) {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    canInstall,
    isInstalled,
    notificationPermission,
    reminderConfig,
    promptInstall,
    requestNotificationPermission,
    sendTestNotification,
    updateReminderConfig
  } = usePWA();

  const [dailyGoal, setDailyGoal] = useState(10);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [notifFeedback, setNotifFeedback] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      alert("Silakan login terlebih dahulu agar data dapat diimpor ke akun Anda.");
      return;
    }

    setIsImporting(true);
    setImportStatus("Membaca file cadangan...");

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      setImportStatus("Mengunggah data ke server...");
      const res = await api.importBackup(backupData);

      if (res.success) {
        setImportStatus(`Berhasil mengimpor ${res.count || 0} riwayat kata ke akun Anda!`);
        if (onProgressReload) onProgressReload();
      } else {
        throw new Error(res.error || "Gagal mengimpor.");
      }
    } catch (err) {
      setImportStatus(`Gagal mengimpor: ${err.message}`);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      setNotifFeedback("Izin notifikasi berhasil diaktifkan! Pengingat misi harian akan dikirim otomatis.");
      setTimeout(() => setNotifFeedback(""), 4000);
    } else if (perm === "denied") {
      setNotifFeedback("Izin notifikasi diblokir oleh browser. Silakan izinkan melalui pengaturan situs di browsermu.");
    }
  };

  const handleTestNotification = () => {
    sendTestNotification({
      title: "Misi Harian SinauEnglish",
      body: "3 misi harian menunggumu hari ini! Selesaikan sekarang untuk mengamankan streak belajarmu.",
      url: "/belajar/missions"
    });
    setNotifFeedback("Notifikasi pengingat uji coba berhasil dikirim!");
    setTimeout(() => setNotifFeedback(""), 4000);
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }} id="settings-panel-root">
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="section-title">Preferensi Belajar & Cloud</h2>
        <p className="section-desc">
          Kelola sesi login, pemasangan aplikasi (PWA), pengingat misi di ponsel, dan target harian.
        </p>
      </div>

      {/* 1. Account Info Card */}
      <div className="card card-tint-sand" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>
          Status Akun Belajar
        </h3>

        {isAuthenticated ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "var(--space-2)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Nama Panggilan:</span>
              <strong>{user.displayName}</strong>

              <span style={{ color: "var(--color-text-secondary)" }}>Email:</span>
              <strong>{user.email}</strong>

              <span style={{ color: "var(--color-text-secondary)" }}>ID Pengguna:</span>
              <code style={{ fontFamily: "var(--font-mono)" }}>{user.id}</code>
            </div>

            <Button variant="outline" size="sm" onClick={logout} style={{ minHeight: "44px" }}>
              Keluar Akun (Logout)
            </Button>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              Saat ini kamu berada dalam Mode Tamu. Kemajuan belajarmu tersimpan sementara pada browser aktif.
            </p>
            <a href="/login" className="btn btn-primary btn-sm" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
              Masuk atau Buat Akun Baru
            </a>
          </div>
        )}
      </div>

      {/* 2. PWA INSTALLATION CARD */}
      <div className="card card-tint-slate" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }} id="pwa-install-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
          <div>
            <h3 style={{ fontSize: "var(--text-lg)", margin: "0 0 4px" }}>
              Aplikasi Mandiri (PWA)
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
              Pasang SinauEnglish ke layar utama ponsel atau desktop untuk akses cepat tanpa bilah alamat browser.
            </p>
          </div>

          <span
            className="scholar-chip"
            style={{
              backgroundColor: isInstalled ? "#EBF5E9" : "var(--color-bg-subtle)",
              color: isInstalled ? "#274C23" : "var(--color-text-primary)",
              border: "var(--border-sm)"
            }}
          >
            {isInstalled ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Terpasang di Layar Utama</> : "Mode Browser"}
          </span>
        </div>

        {canInstall ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={promptInstall}
            id="install-pwa-btn"
            style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Pasang Aplikasi Sekarang
          </button>
        ) : isInstalled ? (
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-success)", fontWeight: 700 }}>
            Kamu sedang menggunakan SinauEnglish dalam mode aplikasi mandiri.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Tips: Untuk memasang di iOS/Safari, ketuk tombol <strong>Bagikan (Share)</strong> lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
          </p>
        )}
      </div>

      {/* 3. DAILY MISSION NOTIFICATION REMINDER CARD */}
      <div className="card card-tint-sand" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }} id="notification-reminder-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
          <div>
            <h3 style={{ fontSize: "var(--text-lg)", margin: "0 0 4px" }}>
              Pengingat Misi Harian di HP
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
              Dapatkan notifikasi otomatis pada jam belajar pilihanmu agar misi harian dan streak tidak terputus.
            </p>
          </div>

          <span
            className="scholar-chip"
            id="notif-permission-badge"
            style={{
              backgroundColor: notificationPermission === "granted" ? "#EBF5E9" : "var(--color-bg-subtle)",
              color: notificationPermission === "granted" ? "#274C23" : "var(--color-text-primary)",
              border: "var(--border-sm)"
            }}
          >
            {notificationPermission === "granted" ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Izin Aktif</> : "Izin Belum Aktif"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {notificationPermission !== "granted" && (
            <div style={{ padding: "var(--space-3) var(--space-4)", backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "var(--border-sm)", marginBottom: "var(--space-2)" }}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-2)" }}>
                Aktifkan izin notifikasi sistem agar pengingat tetap masuk saat browser ditutup:
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleEnableNotifications}
                id="enable-notif-btn"
                style={{ minHeight: "36px", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                Izinkan Notifikasi Sistem Browser
              </button>
            </div>
          )}

          {/* Time Pickers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
            <div>
              <label
                htmlFor="morning-hour-select"
                style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "4px" }}
              >
                Pengingat Pagi (Mulai Misi):
              </label>
              <select
                id="morning-hour-select"
                value={reminderConfig.morningHour}
                onChange={(e) => updateReminderConfig({ morningHour: e.target.value, enabled: true })}
                className="form-input"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "var(--border-sm)" }}
              >
                <option value="06:00">06:00 Pagi</option>
                <option value="07:00">07:00 Pagi</option>
                <option value="08:00">08:00 Pagi (Rekomendasi)</option>
                <option value="09:00">09:00 Pagi</option>
                <option value="10:00">10:00 Pagi</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="evening-hour-select"
                style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "4px" }}
              >
                Pengingat Malam (Amankan Streak):
              </label>
              <select
                id="evening-hour-select"
                value={reminderConfig.eveningHour}
                onChange={(e) => updateReminderConfig({ eveningHour: e.target.value, enabled: true })}
                className="form-input"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "var(--border-sm)" }}
              >
                <option value="18:00">18:00 Sore</option>
                <option value="19:00">19:00 Malam (Rekomendasi)</option>
                <option value="20:00">20:00 Malam</option>
                <option value="21:00">21:00 Malam</option>
              </select>
            </div>
          </div>

          {/* Test Notification Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleTestNotification}
              id="test-notif-btn"
              style={{ minHeight: "44px" }}
            >
              Uji Coba Pengingat (Melayang di HP)
            </button>

            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Pengingat melayang masuk otomatis di atas layar pada jam yang kamu tentukan.
            </span>
          </div>
        </div>


        {notifFeedback && (
          <p
            style={{
              marginTop: "var(--space-3)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              color: !notifFeedback.toLowerCase().includes("gagal") ? "var(--color-success)" : "var(--color-accent-gold)"
            }}
          >
            {notifFeedback}
          </p>
        )}
      </div>

      {/* 4. Learning Target Card */}
      <div className="card card-tint-slate" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>
          Target Belajar Harian
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <select
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="form-input"
            style={{ maxWidth: "200px", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "var(--border-sm)" }}
          >
            <option value="5">5 Kata / Hari (Santai)</option>
            <option value="10">10 Kata / Hari (Ideal)</option>
            <option value="15">15 Kata / Hari (Fokus)</option>
            <option value="20">20 Kata / Hari (Intensif)</option>
          </select>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Target direkomendasikan: 10 kata per hari.
          </span>
        </div>
      </div>

      {/* 5. Backup Migration Tool */}
      <div className="card card-tint-sage" style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>
          Alat Impor Cadangan Data
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          Punya file cadangan JSON dari versi sebelumnya? Unggah di sini untuk memindahkan seluruh riwayat hafalan kata langsung ke akunmu.
        </p>

        <label
          htmlFor="backup-file-input"
          className={`btn btn-secondary btn-sm ${isImporting ? "disabled" : ""}`}
          style={{ cursor: "pointer", display: "inline-block", minHeight: "44px", lineHeight: "30px" }}
        >
          {isImporting ? "Mengimpor Data..." : "Pilih File Backup (.json)"}
        </label>
        <input
          id="backup-file-input"
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          disabled={isImporting}
          style={{ display: "none" }}
        />

        {importStatus && (
          <p
            style={{
              marginTop: "var(--space-3)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: !importStatus.toLowerCase().includes("gagal") ? "var(--color-success)" : "var(--color-text-secondary)"
            }}
          >
            {importStatus}
          </p>
        )}
      </div>
    </div>
  );
}
