import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo.jsx";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandLogo />
            <p>Belajar kosakata dan grammar bahasa Inggris secara terstruktur dengan metode spaced repetition dan materi kontekstual.</p>
          </div>

          <div className="footer-col">
            <h4>Belajar</h4>
            <ul className="footer-links">
              <li><Link to="/belajar/vocabulary">Oxford 3000</Link></li>
              <li><Link to="/belajar/grammar">Kurikulum Grammar</Link></li>
              <li><Link to="/belajar/reading">HABIT Reading</Link></li>
              <li><Link to="/belajar/adventure">Everyday Adventure</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Fitur Cloud</h4>
            <ul className="footer-links">
              <li><Link to="/belajar/review">Spaced Repetition</Link></li>
              <li><Link to="/belajar/progress">Grafik Progres</Link></li>
              <li><Link to="/belajar/settings">Pengaturan Akun</Link></li>
              <li><Link to="/login">Masuk Akun</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Lisensi</h4>
            <ul className="footer-links">
              <li><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">Lisensi CC-BY-SA-4.0</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SINAUENGLISH V2 — Belajar Bahasa Inggris Berbasis Konteks.</span>
        </div>
      </div>
    </footer>
  );
}
