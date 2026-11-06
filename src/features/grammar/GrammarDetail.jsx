import {
  IconArrowLeft,
  IconBook,
  IconCheck,
  IconClock,
  IconClose,
  IconEdit,
  IconHelp,
  IconLightbulb,
  IconSparkles,
  IconStar,
  IconTarget,
  IconTrophy
} from "../../components/common/Icons.jsx";
import React, { useState, useEffect } from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { getGrammarTopic } from "../../data/grammar/grammarRegistry.js";
import { GrammarPracticeRunner } from "./GrammarPracticeRunner.jsx";
import { GrammarMasteryQuiz } from "./GrammarMasteryQuiz.jsx";
import { api } from "../../services/api.js";
import "../../styles/grammar-deep.css";

export function GrammarDetail({ topic, onBack, onStartQuiz, userProfileHook }) {
  const [activeTab, setActiveTab] = useState("materi"); // "materi" | "praktik" | "kuis"
  const [topicProgress, setTopicProgress] = useState(null);

  // Load enhanced 10-part curriculum data if available
  const detailedTopic = getGrammarTopic(topic?.id) || topic;

  useEffect(() => {
    let isMounted = true;
    api.getGrammarProgress().then((res) => {
      if (isMounted && res.data?.progress?.[topic?.id]) {
        setTopicProgress(res.data.progress[topic.id]);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [topic?.id]);

  if (!detailedTopic) return null;

  const handleSaveProgress = async (data) => {
    try {
      const res = await api.saveGrammarProgress(data);
      if (res && res.data) {
        setTopicProgress(res.data);
      }
    } catch (err) {
      console.warn("Save grammar progress error:", err);
    }
  };

  const isMastered = topicProgress?.status === "mastered" || (topicProgress?.quizBest || 0) >= 80;

  return (
    <div className="grammar-deep-container" id="grammar-deep-detail-view">
      {/* Back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <Button variant="secondary" size="sm" onClick={onBack} id="back-to-grammar-grid-btn">
          <><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Kembali ke 19 Modul Grammar</>
        </Button>

        {isMastered && (
          <span className="mastery-status-pill mastered" id="mastered-status-badge">
            <><IconCheck size={13} style={{ marginRight: 4 }} /> Topik Dikuasai</> (Skor: {topicProgress?.quizBest || 80}%)
          </span>
        )}
      </div>

      {/* HEADER CARD */}
      <div className="grammar-header-card">
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
          <Badge variant="navy">{detailedTopic.level}</Badge>
          <Badge variant="gold"><><IconClock size={12} style={{ marginRight: 3 }} /> {detailedTopic.estimatedMinutes || 12} Menit</></Badge>
          <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
            {detailedTopic.category || "Tata Bahasa"}
          </span>
          {!detailedTopic.isLegacy && (
            <span className="scholar-chip chip-gold" style={{ fontSize: "10px", padding: "1px 6px", fontWeight: 800 }}>
              <><IconStar size={12} style={{ marginRight: 4 }} /> Kurikulum Mendalam 10 Bagian</>
            </span>
          )}
        </div>

        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-3)", fontFamily: "var(--font-heading)" }}>
          {detailedTopic.title}
        </h1>

        <p style={{ fontSize: "var(--text-base)", lineHeight: 1.7, color: "var(--color-text-primary)", margin: 0 }}>
          {detailedTopic.learningObjectives?.goal || detailedTopic.summary}
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="grammar-tabs-nav" role="tablist" aria-label="Navigasi Belajar Grammar">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "materi"}
          className={`grammar-tab-btn ${activeTab === "materi" ? "is-active" : ""}`}
          onClick={() => setActiveTab("materi")}
          id="tab-btn-materi"
        >
          <IconBook size={14} />
          <span>1. Materi & Kaidah</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "praktik"}
          className={`grammar-tab-btn ${activeTab === "praktik" ? "is-active" : ""}`}
          onClick={() => setActiveTab("praktik")}
          id="tab-btn-praktik"
        >
          <IconEdit size={14} />
          <span>2. Praktik Bertingkat (12 Latihan)</span>
          {topicProgress?.practiceDone && (
            <IconCheck size={12} style={{ color: "var(--color-success)" }} />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "kuis"}
          className={`grammar-tab-btn ${activeTab === "kuis" ? "is-active" : ""}`}
          onClick={() => setActiveTab("kuis")}
          id="tab-btn-kuis"
        >
          <IconTrophy size={14} />
          <span>3. Kuis Penguasaan (10 Soal)</span>
          {isMastered && (
            <IconCheck size={12} style={{ color: "var(--color-success)" }} />
          )}
        </button>
      </div>

      {/* TAB 1: MATERI & KAIDAH (PEDAGOGY) */}
      {activeTab === "materi" && (
        <div id="grammar-tab-materi-content">
          {/* (a) TUJUAN & KAPAN DIPAKAI */}
          {detailedTopic.learningObjectives?.whenToUse && (
            <section className="pedagogy-block">
              <h3 className="pedagogy-title">
                <IconTarget size={14} style={{ marginRight: 4 }} /> Kapan Harus Digunakan?
              </h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-4) 0" }}>
                Gunakan pola <strong>{detailedTopic.title}</strong> dalam 4 konteks komunikasi nyata berikut:
              </p>

              <div className="situation-grid">
                {detailedTopic.learningObjectives.whenToUse.map((sit, idx) => (
                  <div key={idx} className="situation-card">
                    <h4>{idx + 1}. {sit.situation}</h4>
                    <p>{sit.description}</p>
                    {sit.triggerWords && sit.triggerWords.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "var(--space-2)" }}>
                        {sit.triggerWords.map((tw, tIdx) => (
                          <span key={tIdx} className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {tw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* (b) RUMUS & POLA DALAM TABEL */}
          {detailedTopic.patternTable && (
            <section className="pedagogy-block">
              <h3 className="pedagogy-title">
                <IconTarget size={14} style={{ marginRight: 4 }} /> Rumus & Pola Kalimat Praktis
              </h3>
              <div className="formula-table-container">
                <table className="formula-table">
                  <thead>
                    <tr>
                      <th style={{ width: "120px" }}>Tipe Kalimat</th>
                      <th style={{ width: "160px" }}>Kelompok Subjek</th>
                      <th>Rumus / Pola Struktur</th>
                      <th>Contoh Kalimat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedTopic.patternTable.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800, color: "var(--color-accent-navy)" }}>{p.type}</td>
                        <td style={{ fontWeight: 600 }}>{p.subjectGroup}</td>
                        <td className="formula-mono">{p.formula}</td>
                        <td style={{ fontStyle: "italic", color: "var(--color-text-secondary)" }}>{p.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* (c) PENJELASAN BERTAHAP (INTUISI -> ATURAN -> EJAAN -> PENGECUALIAN) */}
          {detailedTopic.progressiveExplanation && (
            <section className="pedagogy-block">
              <h3 className="pedagogy-title">
                <IconSparkles size={14} style={{ marginRight: 4 }} /> Pemahaman Bertahap: Dari Intuisi ke Kaidah Baku
              </h3>

              <div className="stepper-list">
                {/* Langkah 1: Intuisi */}
                <div className="stepper-item">
                  <div className="stepper-badge">1</div>
                  <div className="stepper-content">
                    <h4>Intuisi Komunikasi</h4>
                    <p>{detailedTopic.progressiveExplanation.step1_intuition}</p>
                  </div>
                </div>

                {/* Langkah 2: Kaidah Inti */}
                <div className="stepper-item">
                  <div className="stepper-badge">2</div>
                  <div className="stepper-content">
                    <h4>Aturan Inti Struktur Kalimat</h4>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "18px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                      {(detailedTopic.progressiveExplanation.step2_coreRules || []).map((rule, idx) => (
                        <li key={idx} style={{ marginBottom: "2px" }}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Langkah 3: Kaidah Ejaan & Bunyi */}
                {(detailedTopic.progressiveExplanation.step3_spellingRules || detailedTopic.progressiveExplanation.step3_regularSpellingAndSound) && (
                  <div className="stepper-item">
                    <div className="stepper-badge">3</div>
                    <div className="stepper-content">
                      <h4>Kaidah Perubahan Bentuk & Ejaan</h4>
                      <ul style={{ margin: "4px 0 0", paddingLeft: "18px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        {(detailedTopic.progressiveExplanation.step3_spellingRules || detailedTopic.progressiveExplanation.step3_regularSpellingAndSound || []).map((rule, idx) => (
                          <li key={idx} style={{ marginBottom: "2px" }}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Langkah 4: Pengecualian & Kata Kerja Khusus */}
                {(detailedTopic.progressiveExplanation.step4_exceptions || detailedTopic.progressiveExplanation.step4_irregularVerbs) && (
                  <div className="stepper-item">
                    <div className="stepper-badge">4</div>
                    <div className="stepper-content">
                      <h4>Pengecualian Penting yang Sering Menjebak</h4>
                      <ul style={{ margin: "4px 0 0", paddingLeft: "18px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        {(detailedTopic.progressiveExplanation.step4_exceptions || detailedTopic.progressiveExplanation.step4_irregularVerbs || []).map((exc, idx) => (
                          <li key={idx} style={{ marginBottom: "2px" }}>{exc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* (d) CONTOH KALIMAT PER KEGUNAAN */}
          {detailedTopic.useCaseExamples && (
            <section className="pedagogy-block">
              <h3 className="pedagogy-title">
                <IconBook size={14} style={{ marginRight: 4 }} /> Contoh Pemakaian Kalimat Nyata
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {detailedTopic.useCaseExamples.map((cat, idx) => (
                  <div key={idx} style={{ backgroundColor: "#FAF8F5", padding: "var(--space-4)", borderRadius: "var(--radius-md)", border: "var(--border-sm)" }}>
                    <h4 style={{ fontSize: "var(--text-sm)", margin: "0 0 var(--space-3) 0", color: "var(--color-accent-navy)" }}>
                      Kategori: {cat.category}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {cat.sentences.map((s, sIdx) => (
                        <div key={sIdx} style={{ backgroundColor: "var(--color-bg-surface)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                          <p style={{ fontWeight: 700, margin: 0, fontSize: "var(--text-sm)" }}>{s.en}</p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic", margin: "2px 0 0" }}>{s.id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* (e) PERBANDINGAN BAHASA INDONESIA (CONTRASTIVE ANALYSIS) */}
          {detailedTopic.indonesianContrast && (
            <section className="contrast-card">
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: 800, margin: "0 0 var(--space-3) 0", color: "#744210" }}>
                <IconHelp size={14} style={{ marginRight: 4 }} /> Kenapa Orang Indonesia Sering Salah di Topik Ini?
              </h3>
              <p style={{ fontSize: "var(--text-xs)", lineHeight: 1.6, color: "var(--color-text-primary)", marginBottom: "var(--space-3)" }}>
                <strong>Perbedaan Mendasar:</strong> {detailedTopic.indonesianContrast.fundamentalDifference}
              </p>
              <p style={{ fontSize: "var(--text-xs)", lineHeight: 1.6, color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                <strong>Akar Kesalahan:</strong> {detailedTopic.indonesianContrast.whyIndonesiansStruggle}
              </p>

              {detailedTopic.indonesianContrast.contrastTable && (
                <div style={{ borderTop: "1px dashed #D69E2E", paddingTop: "var(--space-3)" }}>
                  {detailedTopic.indonesianContrast.contrastTable.map((row, idx) => (
                    <div key={idx} className="contrast-row">
                      <strong style={{ color: "#744210" }}>{row.concept}</strong>
                      <span style={{ color: "var(--color-text-secondary)" }}>{row.bahasaIndonesia}</span>
                      <strong style={{ color: "var(--color-accent-navy)" }}>{row.bahasaInggris}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* (f) BEDAH KESALAHAN UMUM */}
          {detailedTopic.commonMistakes && detailedTopic.commonMistakes.length > 0 && (
            <section className="pedagogy-block">
              <h3 className="pedagogy-title">
                <IconClose size={14} style={{ marginRight: 4, color: 'var(--color-danger)' }} /> Bedah Kesalahan Umum (Salah ke Benar)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {detailedTopic.commonMistakes.map((m, idx) => (
                  <div key={idx} className="mistake-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span className="scholar-chip chip-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
                        {m.trapType || "Jebakan Pola"}
                      </span>
                    </div>
                    <div className="mistake-wrong"><IconClose size={12} style={{ marginRight: 4 }} /> Salah: {m.wrong}</div>
                    <div className="mistake-correct"><IconCheck size={12} style={{ marginRight: 4 }} /> Benar: {m.correct}</div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                      <strong>Alasan:</strong> {m.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* (g) CHEAT SHEET & GOLDEN RULE */}
          {detailedTopic.cheatSheet && (
            <section className="card card-tint-sand" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: 800, margin: "0 0 var(--space-3) 0" }}>
                <IconSparkles size={14} style={{ marginRight: 4, color: 'var(--color-accent-gold)' }} /> Ringkasan Cepat (Cheat Sheet)
              </h3>
              <ul style={{ margin: "0 0 var(--space-4) 0", paddingLeft: "18px", fontSize: "var(--text-xs)", lineHeight: 1.7, color: "var(--color-text-primary)" }}>
                {(detailedTopic.cheatSheet.keyTakeaways || []).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: "2px" }}><strong>{item}</strong></li>
                ))}
              </ul>
              {detailedTopic.cheatSheet.quickGoldenRule && (
                <div style={{ backgroundColor: "var(--color-bg-surface)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", border: "1.5px solid #D69E2E" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#744210", textTransform: "uppercase" }}>
                    <IconStar size={12} style={{ marginRight: 4, color: 'var(--color-accent-gold)' }} /> Golden Rule:
                  </span>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {detailedTopic.cheatSheet.quickGoldenRule}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* (j) TAUTAN TOPIK PRASYARAT & KELANJUTAN */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-sm)", paddingTop: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {detailedTopic.prerequisites && detailedTopic.prerequisites.length > 0 && (
                <span>Prasyarat: <strong>{detailedTopic.prerequisites.join(", ")}</strong> • </span>
              )}
              {detailedTopic.nextTopics && detailedTopic.nextTopics.length > 0 && (
                <span>Lanjutan: <strong>{detailedTopic.nextTopics.join(", ")}</strong></span>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab("praktik")}
              id="goto-practice-tab-btn"
            >
              Mulai 12 Praktik Bertingkat
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: PRAKTIK BERTINGKAT */}
      {activeTab === "praktik" && (
        <div id="grammar-tab-praktik-content">
          <GrammarPracticeRunner
            topic={detailedTopic}
            onFinishPractice={(result) => {
              handleSaveProgress(result);
              setActiveTab("kuis");
            }}
          />
        </div>
      )}

      {/* TAB 3: KUIS PENGUASAAN (10 SOAL) */}
      {activeTab === "kuis" && (
        <div id="grammar-tab-kuis-content">
          <GrammarMasteryQuiz
            topic={detailedTopic}
            onClose={() => setActiveTab("materi")}
            onSaveProgress={handleSaveProgress}
            claimReward={userProfileHook?.claimReward}
            equippedOutfit={userProfileHook?.equippedOutfit}
          />
        </div>
      )}
    </div>
  );
}
