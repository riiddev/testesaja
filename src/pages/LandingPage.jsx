import {
  IconRefresh
} from "../components/common/Icons.jsx";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

const SPECIMENS = [
  {
    word: "notice",
    ipa: "/ˈnoʊ.tɪs/ · US English",
    part: "VERB · LEVEL A2",
    meaning: "melihat, memperhatikan, menyadari",
    exampleEn: "Did you notice anything unusual about him today?",
    exampleId: "Apakah kamu memperhatikan sesuatu yang aneh tentangnya hari ini?"
  },
  {
    word: "crucial",
    ipa: "/ˈkruː.ʃəl/ · US English",
    part: "ADJECTIVE · LEVEL B1",
    meaning: "sangat penting, menentukan, krusial",
    exampleEn: "Early diagnostic tests played a crucial role in his recovery.",
    exampleId: "Tes diagnostik dini memainkan peran yang sangat penting dalam pemulihannya."
  },
  {
    word: "acquire",
    ipa: "/əˈkwaɪ.ɚ/ · US English",
    part: "VERB · LEVEL B2",
    meaning: "memperoleh, menguasai (keterampilan/kebiasaan)",
    exampleEn: "Children acquire their first language naturally through context.",
    exampleId: "Anak-anak menguasai bahasa pertama mereka secara alami melalui konteks."
  }
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [specimenIndex, setSpecimenIndex] = useState(0);
  const currentSpecimen = SPECIMENS[specimenIndex];

  const cycleSpecimen = () => {
    setSpecimenIndex((prev) => (prev + 1) % SPECIMENS.length);
  };

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div>
      <Navbar />

      <main id="main-content">
        {/* Hero Section */}
        <section className="container" id="hero-section" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "clamp(2.5rem, 5.5vw, 3.8rem)", lineHeight: 1.08, letterSpacing: "-0.025em", marginBottom: "var(--space-4)" }}>
                Kata baru<br />
                belum jadi<br />
                <em style={{ fontFamily: "var(--font-editorial)", fontStyle: "italic", color: "var(--color-accent-gold)" }}>
                  milikmu.
                </em>
              </h1>

              <p
                id="hero-subtitle"
                style={{ fontSize: "var(--text-md)", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "var(--space-6)", maxWidth: "520px" }}
              >
                Mengetahui arti terjemahan belum tentu tahu cara memakainya. Amati kata dalam kalimat nyata, bedakan nuansanya, dan kunci ingatanmu dengan spaced repetition yang terstruktur.
              </p>

              <div id="hero-cta-group" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-6)" }}>
                {isAuthenticated ? (
                  <Link className="btn btn-primary btn-lg" to="/belajar" style={{ minHeight: "44px" }}>
                    Lanjut ke Ruang Belajar
                  </Link>
                ) : (
                  <Link className="btn btn-primary btn-lg" to="/daftar" style={{ minHeight: "44px" }}>
                    Buat Akun & Mulai Belajar
                  </Link>
                )}
                <a className="btn btn-secondary btn-lg" href="#materi" style={{ minHeight: "44px" }}>
                  Lihat Peta Materi
                </a>
              </div>
            </div>

            {/* Interactive Specimen Card */}
            <div>
              <div className="card card-tint-sand" id="specimen-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)", borderBottom: "1px dashed var(--color-border)", paddingBottom: "var(--space-2)" }}>
                  <span className="badge badge-gold">{currentSpecimen.part}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                    SPECIMEN KATA
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <h2 style={{ fontSize: "var(--text-4xl)", letterSpacing: "-0.02em", margin: 0 }}>
                    {currentSpecimen.word}<span style={{ color: "var(--color-accent-gold)" }}>.</span>
                  </h2>
                  <button
                    className="btn btn-secondary btn-icon"
                    type="button"
                    onClick={() => speak(currentSpecimen.word)}
                    aria-label={`Dengarkan pelafalan ${currentSpecimen.word}`}
                    style={{ minWidth: "44px", minHeight: "44px" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  </button>
                </div>

                <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                  {currentSpecimen.ipa}
                </p>

                <p style={{ fontSize: "var(--text-md)", fontWeight: 600, marginBottom: "var(--space-5)" }}>
                  {currentSpecimen.meaning}
                </p>

                <div className="card" style={{ padding: "var(--space-4)", backgroundColor: "var(--color-bg-surface)", marginBottom: "var(--space-5)" }}>
                  <p style={{ fontSize: "var(--text-sm)", fontStyle: "italic", marginBottom: "var(--space-2)", lineHeight: 1.5 }}>
                    "{currentSpecimen.exampleEn}"
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                    {currentSpecimen.exampleId}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={cycleSpecimen}
                    style={{ flex: 1, minHeight: "44px" }}
                  >
                    <>Ganti Contoh Kata <IconRefresh size={13} style={{ marginLeft: 4 }} /></>
                  </button>
                  {isAuthenticated ? (
                    <Link className="btn btn-primary btn-sm" to="/belajar/vocabulary" style={{ minHeight: "44px" }}>
                      Pelajari di Workspace
                    </Link>
                  ) : (
                    <Link className="btn btn-primary btn-sm" to="/daftar" style={{ minHeight: "44px" }}>
                      Daftar Akun
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="container" id="pendekatan" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
          <div className="section-header" style={{ marginBottom: "var(--space-8)" }}>
            <h2 className="section-title">Kenapa Metode Biasa Selalu Lupa?</h2>
            <p className="section-desc">
              Menghafal daftar terjemahan kata per kata membuat otak pasif. SinauEnglish menerapkan metode belajar 3 tahap agar setiap kata melekat dalam memori aktifmu.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)" }}>
            <div className="card card-tint-sand">
              <span className="badge badge-navy" style={{ marginBottom: "var(--space-3)" }}>TAHAP 1</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Konteks Kalimat Nyata</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                Setiap kata dipelajari di dalam habitat aslinya: kalimat lengkap, situasi autentik, dan pelafalan penutur asli.
              </p>
            </div>

            <div className="card card-tint-sand">
              <span className="badge badge-gold" style={{ marginBottom: "var(--space-3)" }}>TAHAP 2</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Active Recall & Matching</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                Latihan interaktif yang menuntut otakmu memilih kata yang tepat berdasarkan situasi, bukan sekadar menebak terjemahan.
              </p>
            </div>

            <div className="card card-tint-sand">
              <span className="badge badge-sage" style={{ marginBottom: "var(--space-3)" }}>TAHAP 3</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Spaced Repetition (SRS)</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                Sistem menjadwalkan review pada interval 1, 3, 8, 16, hingga 30 hari tepat sebelum kamu lupa, mengunci kata ke memori aktifmu.
              </p>
            </div>
          </div>
        </section>

        {/* Material Map Section */}
        <section className="container" id="materi" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-16)" }}>
          <div className="section-header" style={{ marginBottom: "var(--space-8)" }}>
            <h2 className="section-title">Peta Materi Belajar</h2>
            <p className="section-desc">Semua materi tersusun bertingkat sesuai standar CEFR (A1 Pemula hingga B2 Mahir).</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-6)" }}>
            <div className="card card-interactive">
              <span className="badge badge-gold" style={{ marginBottom: "var(--space-3)" }}>2.971 KATA</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Oxford 3000 Corpus</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
                Kosakata American English terpenting level A1, A2, B1, dan B2 lengkap dengan audio dan kalimat contoh autentik.
              </p>
              {isAuthenticated ? (
                <Link className="btn btn-secondary btn-sm" to="/belajar/vocabulary" style={{ minHeight: "44px" }}>
                  Buka Kosakata
                </Link>
              ) : (
                <Link className="btn btn-secondary btn-sm" to="/daftar" style={{ minHeight: "44px" }}>
                  Daftar untuk Membuka
                </Link>
              )}
            </div>

            <div className="card card-interactive">
              <span className="badge badge-navy" style={{ marginBottom: "var(--space-3)" }}>19 TOPIK</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Kurikulum Grammar</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
                Pola kalimat tenses, modal verbs, passive voice, hingga conditional sentences dengan 57 kuis interaktif terstruktur.
              </p>
              {isAuthenticated ? (
                <Link className="btn btn-secondary btn-sm" to="/belajar/grammar" style={{ minHeight: "44px" }}>
                  Buka Grammar
                </Link>
              ) : (
                <Link className="btn btn-secondary btn-sm" to="/daftar" style={{ minHeight: "44px" }}>
                  Daftar untuk Membuka
                </Link>
              )}
            </div>

            <div className="card card-interactive">
              <span className="badge badge-sage" style={{ marginBottom: "var(--space-3)" }}>156 BACAAN</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>HABIT Reading Library</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
                63.309 kata bacaan berbobot untuk membangun intuisi membaca cepat dan melatih fokus pemahaman mendalam.
              </p>
              {isAuthenticated ? (
                <Link className="btn btn-secondary btn-sm" to="/belajar/reading" style={{ minHeight: "44px" }}>
                  Buka Bacaan
                </Link>
              ) : (
                <Link className="btn btn-secondary btn-sm" to="/daftar" style={{ minHeight: "44px" }}>
                  Daftar untuk Membuka
                </Link>
              )}
            </div>

            <div className="card card-interactive">
              <span className="badge badge-rose" style={{ marginBottom: "var(--space-3)" }}>10 CERITA SERIAL</span>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Everyday Adventure</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
                Serial petualangan interaktif 10 cerita × 10 episode, simulasi dialog situasi nyata, dan studio pelafalan berpandu.
              </p>
              {isAuthenticated ? (
                <Link className="btn btn-secondary btn-sm" to="/belajar/adventure" style={{ minHeight: "44px" }}>
                  Mulai Petualangan
                </Link>
              ) : (
                <Link className="btn btn-secondary btn-sm" to="/daftar" style={{ minHeight: "44px" }}>
                  Daftar untuk Membuka
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="container" style={{ paddingBottom: "var(--space-20)" }}>
          <div className="card card-tint-sand" style={{ textAlign: "center", padding: "var(--space-12) var(--space-6)" }}>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, var(--text-4xl))", marginBottom: "var(--space-3)" }}>
              Mulai Belajar Hari Ini
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-md)", maxWidth: "560px", margin: "0 auto var(--space-6)", lineHeight: 1.6 }}>
              Buat akun dalam 10 detik. Langsung buka ruang belajar dan mulai kuasai bahasa Inggris dengan terstruktur.
            </p>
            {isAuthenticated ? (
              <Link className="btn btn-primary btn-lg" to="/belajar" style={{ minHeight: "44px" }}>
                Buka Ruang Belajar Sekarang
              </Link>
            ) : (
              <Link className="btn btn-primary btn-lg" to="/daftar" style={{ minHeight: "44px" }}>
                Buat Akun Gratis Sekarang
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
