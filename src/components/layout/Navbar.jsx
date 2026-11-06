import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { BrandLogo } from "../common/BrandLogo.jsx";

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <BrandLogo />

        <nav className="nav-menu" aria-label="Navigasi Utama">
          <a className="nav-link" href="/#pendekatan">Pendekatan</a>
          <a className="nav-link" href="/#materi">Peta Materi</a>
          {isAuthenticated ? (
            <Link
              className={`nav-link ${location.pathname.startsWith("/belajar") ? "is-active" : ""}`}
              to="/belajar"
            >
              Ruang Belajar
            </Link>
          ) : (
            <Link
              className={`nav-link ${location.pathname === "/daftar" ? "is-active" : ""}`}
              to="/daftar"
            >
              Daftar Akun
            </Link>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link to="/belajar/settings" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{user?.displayName || "Pelajar"}</span>
              </Link>
              <Link className="btn btn-primary btn-sm" to="/belajar">
                Ruang Belajar
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Masuk
              </Link>
              <Link className="btn btn-primary btn-sm" to="/daftar">
                Daftar Akun
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
