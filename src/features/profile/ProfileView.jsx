import {
  IconCheck
} from "../../components/common/Icons.jsx";
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useUserProfile } from "../../hooks/useUserProfile.js";
import { AVATAR_PRESETS } from "./titleSystem.js";
import { AvatarWithBorder } from "./AvatarWithBorder.jsx";
import "../../styles/profile.css";

export function ProfileView({ vocabulary = [], progressMap = {}, userProfileHook }) {
  const { user, isAuthenticated } = useAuth();
  const internalProfileHook = useUserProfile({ vocabulary, progressMap });
  const activeHook = userProfileHook || internalProfileHook;

  const {
    profile,
    userStats,
    avatarUrl,
    isUploadingAvatar,
    activeTitleObj,
    evaluatedTitles,
    calculatedLevel,
    equippedBorder,
    updateDisplayName,
    setActiveTitle,
    uploadCustomAvatar,
    deleteCustomAvatar
  } = activeHook;

  const [filterMode, setFilterMode] = useState("all"); // "all" | "unlocked" | "locked"
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.displayName || "Pelajar Sinau");
  const [selectedTitleId, setSelectedTitleId] = useState(profile.activeTitle || "");

  // Avatar Upload & Crop State
  const fileInputRef = useRef(null);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const cropImageRef = useRef(null);

  const currentAvatar = AVATAR_PRESETS.find((a) => a.id === profile.avatarKey) || AVATAR_PRESETS[0];

  const filteredTitles = evaluatedTitles.filter((t) => {
    if (filterMode === "unlocked") return t.isUnlocked;
    if (filterMode === "locked") return !t.isUnlocked;
    return true;
  });

  const handleOpenEditModal = () => {
    setEditName(profile.displayName || "Pelajar Sinau");
    setSelectedTitleId(profile.activeTitle || "");
    setCropImageSrc(null);
    setAvatarError("");
    setAvatarSuccess("");
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    setAvatarSuccess("");

    // Validate MIME type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Format file tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.");
      return;
    }

    // Validate size (raw file max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Ukuran gambar terlalu besar (maksimal 5 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
    };
    reader.onerror = () => {
      setAvatarError("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Drag handlers for Crop Viewport
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Save Crop & Compress to WebP <= 60 KB
  const handleApplyCrop = async () => {
    if (!cropImageRef.current) return;
    const img = cropImageRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Center circular crop calculation
    // Viewport is 200x200, output is 256x256 (ratio 1.28)
    const ratio = 256 / 200;
    const baseScale = Math.max(200 / img.naturalWidth, 200 / img.naturalHeight);
    const totalScale = baseScale * zoomScale;

    const drawW = img.naturalWidth * totalScale * ratio;
    const drawH = img.naturalHeight * totalScale * ratio;
    const drawX = 128 - drawW / 2 + panOffset.x * ratio;
    const drawY = 128 - drawH / 2 + panOffset.y * ratio;

    // Optional circular clip for canvas
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Compress to WebP
    let webpDataUrl = canvas.toDataURL("image/webp", 0.85);

    // Fallback if browser doesn't support webp export
    if (!webpDataUrl.startsWith("data:image/webp")) {
      webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
    }

    const res = await uploadCustomAvatar({
      imageBase64: webpDataUrl,
      mimeType: webpDataUrl.startsWith("data:image/webp") ? "image/webp" : "image/jpeg"
    });

    if (res.success) {
      setAvatarSuccess("Foto profil berhasil disimpan ke cloud storage!");
      setCropImageSrc(null);
      setTimeout(() => setAvatarSuccess(""), 4000);
    } else {
      setAvatarError(res.error || "Gagal mengunggah foto profil.");
    }
  };

  const handleDeleteAvatar = async () => {
    await deleteCustomAvatar();
    setAvatarSuccess("Foto profil dihapus. Profil kembali menggunakan inisial namamu.");
    setTimeout(() => setAvatarSuccess(""), 4000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (editName.trim()) {
      updateDisplayName(editName.trim());
    }
    setActiveTitle(selectedTitleId);
    setIsEditModalOpen(false);
  };

  const levels = [
    { id: "A1", label: "Level A1 (Beginner)", total: 892 },
    { id: "A2", label: "Level A2 (Elementary)", total: 792 },
    { id: "B1", label: "Level B1 (Intermediate)", total: 689 },
    { id: "B2", label: "Level B2 (Upper Intermediate)", total: 597 }
  ];

  return (
    <div className="profile-container" id="profile-view-root">
      {/* 1. SCHOLAR IDENTITY CARD */}
      <section className="scholar-id-card" aria-label="Profil Pelajar">
        <div className="scholar-header-wrap">
          <div className="scholar-bio-section">
            <div className="scholar-avatar-box">
              <AvatarWithBorder
                avatarUrl={avatarUrl}
                initialLetter={currentAvatar.letter}
                bgColor={avatarUrl ? "transparent" : currentAvatar.bg}
                color={currentAvatar.color}
                equippedBorder={equippedBorder}
                size={88}
                id="scholar-avatar-border-wrap"
              />
              <button
                type="button"
                className="avatar-edit-btn"
                onClick={handleOpenEditModal}
                id="edit-avatar-icon-btn"
                aria-label="Ubah Foto dan Profil"
                title="Ubah Foto dan Profil"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </button>
            </div>

            <div className="scholar-details">
              <span className="scholar-eyebrow">Profil Cendekiawan</span>
              <h2 className="scholar-name" id="scholar-display-name">
                {profile.displayName || "Pelajar Sinau"}
              </h2>
              <span className="scholar-email">
                {isAuthenticated ? user?.email : "Mode Tamu • Kemajuan Tersimpan Sementara"}
              </span>

              <div className="scholar-chips-row">
                <span className="scholar-chip chip-gold" id="scholar-active-title-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {activeTitleObj?.name || "Pelajar Baru"}
                </span>

                <span className="scholar-chip chip-level">
                  Level {calculatedLevel}
                </span>

                <span className="scholar-chip chip-neutral">
                  {isAuthenticated ? "Akun Cloud Aktif" : "Mode Tamu"}
                </span>
              </div>
            </div>
          </div>

          <div className="scholar-actions-right">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleOpenEditModal}
              id="edit-profile-btn"
              style={{ minHeight: "44px", minWidth: "120px" }}
            >
              Edit Profil
            </button>

            <Link
              to="/belajar/settings"
              className="btn btn-ghost btn-sm"
              title="Buka Pengaturan Akun"
              style={{ minHeight: "44px", minWidth: "44px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Pengaturan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PROGRESS OVERVIEW (4-BENTO METRIC BOXES) */}
      <section className="overview-card" aria-label="Ringkasan Kemajuan Belajar">
        <div className="overview-header">
          <h3 className="overview-title">Ringkasan Kemajuan Belajar</h3>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            Oxford 3000 American English
          </span>
        </div>

        <div className="bento-grid-4">
          {/* Box 1: Level */}
          <div className="bento-box" id="bento-level-box">
            <div className="bento-icon-wrap bento-icon-level" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
                <path d="M6 4h12v5a6 6 0 0 1-12 0V4Z"/>
              </svg>
            </div>
            <div className="bento-value" id="bento-stat-level">{calculatedLevel}</div>
            <div className="bento-label">Level Belajar</div>
          </div>

          {/* Box 2: EXP */}
          <div className="bento-box" id="bento-exp-box">
            <div className="bento-icon-wrap bento-icon-exp" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className="bento-value" id="bento-stat-exp">
              {Number(profile.xp || 50).toLocaleString("id-ID")}
            </div>
            <div className="bento-label">EXP Kosakata</div>
          </div>

          {/* Box 3: Koin Sinau */}
          <div className="bento-box" id="bento-coins-box">
            <div className="bento-icon-wrap bento-icon-coins" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v10"/>
                <path d="M9 10h6"/>
                <path d="M9 14h6"/>
              </svg>
            </div>
            <div className="bento-value" id="bento-stat-coins">
              {Number(profile.coins || 50).toLocaleString("id-ID")}
            </div>
            <div className="bento-label">Koin Sinau</div>
          </div>

          {/* Box 4: Streak */}
          <div className="bento-box" id="bento-streak-box">
            <div className="bento-icon-wrap bento-icon-streak" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
            </div>
            <div className="bento-value" id="bento-stat-streak">
              {profile.streak || 1} Hari
            </div>
            <div className="bento-label">Konsistensi Belajar</div>
          </div>
        </div>
      </section>

      {/* 3. VOCABULARY MASTERY BY CEFR LEVEL */}
      <section className="overview-card" aria-label="Penguasaan Kosakata CEFR">
        <div className="overview-header">
          <h3 className="overview-title">Penguasaan Kosakata per Jenjang CEFR</h3>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            Total 2.971 Lema Inti
          </span>
        </div>

        <div className="cefr-grid">
          {levels.map((lvl) => {
            const levelWords = vocabulary.filter((w) => w.level === lvl.id);
            const totalInLevel = lvl.total || levelWords.length || 1;
            const masteredInLevel = levelWords.filter((w) => {
              const p = progressMap[w.id];
              return p && (p.stage === "mastered" || p.correctCount >= 3);
            }).length;

            const pct = Math.min(100, Math.round((masteredInLevel / totalInLevel) * 100));

            return (
              <div key={lvl.id} className="cefr-card" id={`cefr-card-${lvl.id.toLowerCase()}`}>
                <div className="cefr-card-header">
                  <span className="cefr-badge">{lvl.id}</span>
                  <span className="cefr-count">
                    <strong>{masteredInLevel}</strong> / {totalInLevel} Kata
                  </span>
                </div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>
                  {lvl.label}
                </div>
                <div className="progress-track" style={{ height: "10px" }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                <div style={{ textAlign: "right", fontSize: "var(--text-xs)", fontWeight: 700, marginTop: "6px" }}>
                  {pct}% Dikuasai
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ACADEMIC TITLES SYSTEM */}
      <section className="titles-section" aria-label="Gelar Akademik">
        <div className="titles-header-row">
          <div>
            <h3 className="titles-main-heading">Gelar Akademik Cendekiawan</h3>
            <p className="titles-sub-heading">
              Gelar kehormatan terbuka berdasarkan pencapaian nyata dalam mempelajari kosakata, membaca konteks, dan konsistensi harian.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="titles-filter-pills" role="tablist" aria-label="Filter Gelar">
            <button
              type="button"
              className={`filter-pill ${filterMode === "all" ? "is-active" : ""}`}
              onClick={() => setFilterMode("all")}
            >
              Semua ({evaluatedTitles.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterMode === "unlocked" ? "is-active" : ""}`}
              onClick={() => setFilterMode("unlocked")}
            >
              Terbuka ({evaluatedTitles.filter((t) => t.isUnlocked).length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterMode === "locked" ? "is-active" : ""}`}
              onClick={() => setFilterMode("locked")}
            >
              Terkunci ({evaluatedTitles.filter((t) => !t.isUnlocked).length})
            </button>
          </div>
        </div>

        {/* Titles List */}
        <div className="titles-list" id="titles-catalog-list">
          {filteredTitles.map((item) => {
            const isActive = profile.activeTitle === item.id;

            return (
              <div
                key={item.id}
                className={`title-milestone-item ${item.isUnlocked ? "is-unlocked" : "is-locked"}`}
                id={`title-card-${item.id}`}
              >
                <div className="title-icon-badge" aria-hidden="true">
                  <TitleIcon type={item.iconType} isUnlocked={item.isUnlocked} />
                </div>

                <div className="title-info-wrap">
                  <div className="title-name-row">
                    <h4 className="title-name-id">{item.name}</h4>
                    <span className="title-name-en">({item.englishName})</span>
                    <span className="title-category-badge">{item.badgeLabel}</span>
                  </div>
                  <p className="title-desc">{item.description}</p>
                </div>

                <div className="title-progress-wrap">
                  <div className="title-progress-header">
                    <span>Target Capaian</span>
                    <span>
                      {item.progressValue} / {item.targetValue} {item.unit}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.isUnlocked ? "var(--color-success)" : "var(--color-accent-navy)"
                      }}
                      role="progressbar"
                      aria-valuenow={item.percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                </div>

                <div className="title-action-wrap">
                  {item.isUnlocked ? (
                    isActive ? (
                      <span className="active-badge" id={`active-badge-${item.id}`}>
                        <><IconCheck size={12} style={{ marginRight: 3 }} /> Gelar Aktif</>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveTitle(item.id)}
                        id={`activate-title-btn-${item.id}`}
                        style={{ minHeight: "44px" }}
                      >
                        Pasang Gelar
                      </button>
                    )
                  ) : (
                    <span className="locked-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      {item.percentage}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. EDIT PROFILE & AVATAR CROP MODAL */}
      {isEditModalOpen && (
        <div
          className="modal-overlay is-open"
          id="edit-profile-modal-overlay"
          onClick={() => {
            if (!cropImageSrc) setIsEditModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-profile-title"
        >
          <div
            className="modal-sheet"
            style={{ maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 className="modal-title" id="modal-edit-profile-title" style={{ margin: 0, fontSize: "var(--text-lg)" }}>
                {cropImageSrc ? "Sesuaikan Foto Profil (Crop)" : "Ubah Profil Cendekiawan"}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setCropImageSrc(null);
                  setIsEditModalOpen(false);
                }}
                id="close-profile-modal-btn"
                aria-label="Tutup modal edit profil"
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "var(--border-sm)",
                  backgroundColor: "var(--color-bg-surface)",
                  cursor: "pointer"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {avatarError && (
              <div className="card card-tint-rose" style={{ padding: "8px 12px", marginBottom: "var(--space-3)", color: "var(--color-danger)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                {avatarError}
              </div>
            )}
            {avatarSuccess && (
              <div className="card card-tint-sage" style={{ padding: "8px 12px", marginBottom: "var(--space-3)", color: "var(--color-success)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                {avatarSuccess}
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="avatar-file-input"
            />

            {/* VIEW A: CROP TOOL VIEW */}
            {cropImageSrc ? (
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textAlign: "center" }}>
                  Geser foto dan gunakan slider perbesaran agar wajah atau objek pas di dalam lingkaran.
                </p>

                {/* Circular Viewport */}
                <div
                  className={`avatar-crop-viewport ${isDragging ? "is-dragging" : ""}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  id="avatar-crop-viewport"
                >
                  <img
                    ref={cropImageRef}
                    src={cropImageSrc}
                    alt="Preview Crop"
                    draggable={false}
                    style={{
                      position: "absolute",
                      transformOrigin: "center center",
                      transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoomScale})`,
                      top: "50%",
                      left: "50%",
                      maxWidth: "none",
                      maxHeight: "none",
                      pointerEvents: "none"
                    }}
                  />
                  {/* Subtle crosshair guide lines */}
                  <div style={{ position: "absolute", inset: 0, border: "1px dashed rgba(255,255,255,0.4)", borderRadius: "50%", pointerEvents: "none" }} />
                </div>

                {/* Zoom Slider */}
                <div className="avatar-crop-controls">
                  <div className="avatar-crop-slider-wrap">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>Zoom</span>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={zoomScale}
                      onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                      style={{ width: "160px", cursor: "pointer" }}
                      id="crop-zoom-slider"
                      aria-label="Perbesaran foto"
                    />
                    <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", width: "36px" }}>
                      {zoomScale.toFixed(1)}x
                    </span>
                  </div>

                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", textAlign: "center", margin: 0 }}>
                    Target: 256×256 px WebP (≤ 60 KB) disimpan aman di Google Drive.
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setCropImageSrc(null)}
                    style={{ minHeight: "44px" }}
                    id="cancel-crop-btn"
                  >
                    Batal Pilihan
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApplyCrop}
                    disabled={isUploadingAvatar}
                    style={{ minHeight: "44px" }}
                    id="save-cropped-avatar-btn"
                  >
                    {isUploadingAvatar ? "Menyimpan ke Cloud..." : "Potong & Simpan Foto"}
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW B: GENERAL PROFILE FORM */
              <form onSubmit={handleSaveProfile}>
                {/* Custom Photo Upload Card */}
                <div
                  className="card card-tint-sand"
                  style={{
                    padding: "var(--space-4)",
                    marginBottom: "var(--space-5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    flexWrap: "wrap"
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      border: "var(--border-sm)",
                      overflow: "hidden",
                      backgroundColor: avatarUrl ? "transparent" : currentAvatar.bg,
                      color: currentAvatar.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "var(--text-xl)",
                      flexShrink: 0
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar saat ini" className="scholar-avatar-img" />
                    ) : (
                      currentAvatar.letter
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <strong style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "2px" }}>
                      {avatarUrl ? "Foto Profil Kustom Aktif" : "Foto Profil (Inisial Nama)"}
                    </strong>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "block", marginBottom: "var(--space-2)" }}>
                      {avatarUrl ? "Tersimpan di Google Drive cloud akunmu." : "Bisa diganti dengan foto dari galeri atau kamera ponsel."}
                    </span>

                    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        id="choose-avatar-gallery-btn"
                        style={{ minHeight: "40px" }}
                      >
                        Pilih dari Galeri / Kamera
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={handleDeleteAvatar}
                          id="delete-avatar-btn"
                          style={{ minHeight: "40px" }}
                        >
                          Hapus Foto (Gunakan Inisial)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <label
                    htmlFor="edit-display-name-input"
                    style={{ display: "block", fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}
                  >
                    Nama Panggilan Pelajar
                  </label>
                  <input
                    id="edit-display-name-input"
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={30}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "var(--border-sm)" }}
                  />
                </div>

                {/* Active Title Selector from Unlocked Titles */}
                <div style={{ marginBottom: "var(--space-6)" }}>
                  <label
                    htmlFor="select-active-title"
                    style={{ display: "block", fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}
                  >
                    Gelar Aktif Terbuka
                  </label>
                  <select
                    id="select-active-title"
                    className="form-input"
                    value={selectedTitleId}
                    onChange={(e) => setSelectedTitleId(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "var(--border-sm)" }}
                  >
                    {evaluatedTitles.filter((t) => t.isUnlocked).length === 0 ? (
                      <option value="">Belum Ada Gelar Terbuka (Pelajar Baru)</option>
                    ) : (
                      evaluatedTitles
                        .filter((t) => t.isUnlocked)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.englishName})
                          </option>
                        ))
                    )}
                  </select>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ minHeight: "44px" }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    id="save-profile-btn"
                    style={{ minHeight: "44px" }}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Icon helper function for titles
function TitleIcon({ type, isUnlocked }) {
  const strokeColor = isUnlocked ? "#121212" : "currentColor";

  switch (type) {
    case "compass":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      );
    case "quote":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        </svg>
      );
    case "flame-cadence":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      );
    case "award":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      );
    case "book-open":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      );
    case "shield-star":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polygon points="12 8 13.5 11 17 11.5 14.5 14 15 17.5 12 16 9 17.5 9.5 14 7 11.5 10.5 11 12 8"/>
        </svg>
      );
    case "layers":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      );
    case "refresh":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 21h5v-5"/>
        </svg>
      );
    case "map-pin":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      );
    case "crown":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
}
