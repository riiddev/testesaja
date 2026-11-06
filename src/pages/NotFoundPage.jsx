import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { Button } from "../components/common/Button.jsx";

export function NotFoundPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "var(--space-12) var(--space-4)" }}>
        <div className="card card-tint-sand" style={{ maxWidth: "480px", textAlign: "center", padding: "var(--space-10)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", borderRadius: "var(--radius-pill)", backgroundColor: "var(--color-bg-surface)", border: "var(--border-sm)", marginBottom: "var(--space-4)", color: "var(--color-accent-navy)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-3)" }}>
            Halaman Tidak Ditemukan
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
            Alamat yang kamu tuju tidak tersedia atau telah dipindahkan.
          </p>
          <Link to="/">
            <Button variant="primary">Kembali ke Beranda</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

