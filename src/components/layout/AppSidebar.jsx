import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { BrandLogo } from "../common/BrandLogo.jsx";

export function AppSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const sidebarRef = useRef(null);
  const closeBtnRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);

  const isView = (v) => {
    if (v === "overview") return location.pathname === "/belajar" || location.pathname === "/belajar/";
    if (v === "progress") return location.pathname === "/belajar/progress" || location.pathname === "/belajar/profile";
    if (v === "collection" || v === "koleksi") return location.pathname === "/belajar/collection" || location.pathname === "/belajar/koleksi";
    return location.pathname === `/belajar/${v}`;
  };

  // Keyboard Escape & Focus Management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        document.getElementById("mobile-menu-btn")?.focus();
      }

      // Focus trap within sidebar on mobile drawer
      if (e.key === "Tab" && sidebarRef.current) {
        const focusables = sidebarRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Auto focus close button or first item when opened
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Touch Swipe Left to Dismiss Drawer
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diffX = touchCurrentXRef.current - touchStartXRef.current;
    if (diffX < -50) {
      onClose();
      document.getElementById("mobile-menu-btn")?.focus();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={() => {
          onClose();
          document.getElementById("mobile-menu-btn")?.focus();
        }}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={`app-sidebar ${isOpen ? "is-open mobile-open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}
        id="app-sidebar"
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-label="Navigasi Ruang Belajar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebar-header">
          <BrandLogo />

          {/* Close button on mobile (< 1024px) */}
          <button
            ref={closeBtnRef}
            className="btn btn-outline btn-icon sidebar-close-btn"
            type="button"
            onClick={() => {
              onClose();
              document.getElementById("mobile-menu-btn")?.focus();
            }}
            aria-label="Tutup navigasi samping"
            title="Tutup (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Menu Belajar">
          <Link
            to="/belajar"
            onClick={onClose}
            className={`sidebar-link ${isView("overview") ? "is-active" : ""}`}
            title="Beranda Belajar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Beranda</span>
          </Link>

          <Link
            to="/belajar/vocabulary"
            onClick={onClose}
            className={`sidebar-link ${isView("vocabulary") ? "is-active" : ""}`}
            title="Daftar Kosakata"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h10"/>
            </svg>
            <span>Kosakata</span>
            <span className="sidebar-count" id="sidebar-vocab-count">2.971</span>
          </Link>

          <Link
            to="/belajar/missions"
            onClick={onClose}
            className={`sidebar-link ${isView("missions") ? "is-active" : ""}`}
            title="Misi Harian"
            id="sidebar-missions-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <span>Misi Harian</span>
            <span className="sidebar-count" id="sidebar-missions-count">3</span>
          </Link>

          <Link
            to="/belajar/matching"
            onClick={onClose}
            className={`sidebar-link ${isView("matching") ? "is-active" : ""}`}
            title="Matching Konteks Kalimat"
            id="sidebar-matching-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>Matching Konteks</span>
          </Link>

          <Link
            to="/belajar/grammar"
            onClick={onClose}
            className={`sidebar-link ${isView("grammar") ? "is-active" : ""}`}
            title="Kurikulum Grammar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="m9 15 2 2 4-4"/>
            </svg>
            <span>Grammar</span>
            <span className="sidebar-count" id="sidebar-grammar-count">19</span>
          </Link>

          <Link
            to="/belajar/reading"
            onClick={onClose}
            className={`sidebar-link ${isView("reading") ? "is-active" : ""}`}
            title="HABIT Reading"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>HABIT Reading</span>
            <span className="sidebar-count" id="sidebar-reading-count">156</span>
          </Link>

          <Link
            to="/belajar/adventure"
            onClick={onClose}
            className={`sidebar-link ${isView("adventure") ? "is-active" : ""}`}
            title="Petualangan"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
            <span>Petualangan</span>
          </Link>

          <Link
            to="/belajar/review"
            onClick={onClose}
            className={`sidebar-link ${isView("review") ? "is-active" : ""}`}
            title="Review (SRS)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span>Review (SRS)</span>
          </Link>

          <Link
            to="/belajar/progress"
            onClick={onClose}
            className={`sidebar-link ${isView("progress") ? "is-active" : ""}`}
            title="Profil & Progres Belajar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profil & Progres</span>
          </Link>

          <Link
            to="/belajar/collection"
            onClick={onClose}
            className={`sidebar-link ${isView("collection") || isView("koleksi") ? "is-active" : ""}`}
            title="Koleksi & Kanci"
            id="sidebar-collection-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Koleksi & Kanci</span>
          </Link>

          <Link
            to="/belajar/settings"
            onClick={onClose}
            className={`sidebar-link ${isView("settings") ? "is-active" : ""}`}
            title="Pengaturan"
          >
            {/* Standard 8-tooth gear SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Pengaturan</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: "block", color: "var(--color-text-primary)", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.displayName || "Pelajar Sinau"}
              </strong>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-success)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Tersinkronisasi
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Keluar dari akun"
              style={{ padding: "4px 8px", fontSize: "11px", minHeight: "28px" }}
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Desktop Collapse Toggle Button (≥ 1024px) */}
        {onToggleCollapse && (
          <button
            className="sidebar-collapse-btn"
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Perlebar navigasi" : "Ciutkan navigasi"}
            title={isCollapsed ? "Buka panel samping" : "Ciutkan panel samping"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
            {!isCollapsed && <span>Ciutkan</span>}
          </button>
        )}
      </aside>
    </>
  );
}
