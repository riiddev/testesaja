import {
  IconCheck,
  IconClock,
  IconStar
} from "../../components/common/Icons.jsx";
import React, { useState, useEffect } from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { api } from "../../services/api.js";

// Enhanced topics in Batch 1
const ENHANCED_SET = new Set(["present-simple", "present-continuous", "past-simple"]);

export function GrammarGrid({ topics = [], onSelectTopic }) {
  const [grammarProgressMap, setGrammarProgressMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    api.getGrammarProgress().then((res) => {
      if (isMounted && res.data?.progress) {
        setGrammarProgressMap(res.data.progress);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="section-title">19 Modul Tata Bahasa (A1–B2)</h2>
        <p className="section-desc">
          Pahami konsep dari intuisi ke kaidah baku, bedah kesalahan transfer bahasa Indonesia, tuntaskan 12 praktik bertingkat, dan raih ambang penguasaan 80%.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)"
        }}
      >
        {topics.map((t) => {
          const isEnhanced = ENHANCED_SET.has(t.id);
          const prog = grammarProgressMap[t.id];
          const isMastered = prog?.status === "mastered" || (prog?.quizBest || 0) >= 80;

          return (
            <div
              key={t.id}
              id={`grammar-card-${t.id}`}
              onClick={() => onSelectTopic(t)}
              className="card card-interactive"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                borderLeft: isMastered
                  ? "6px solid var(--color-success)"
                  : isEnhanced
                  ? "6px solid var(--color-accent-gold)"
                  : "var(--border-sm)"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant="navy">{t.level}</Badge>
                    {isMastered && (
                      <span className="scholar-chip chip-level" style={{ fontSize: "10px", padding: "1px 6px", fontWeight: 800 }}>
                        <><IconCheck size={12} style={{ marginRight: 3 }} /> Dikuasai</>
                      </span>
                    )}
                    {isEnhanced && !isMastered && (
                      <span className="scholar-chip chip-gold" style={{ fontSize: "10px", padding: "1px 6px", fontWeight: 800 }}>
                        <><IconStar size={11} style={{ marginRight: 3 }} /> 10 Bagian</>
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
                    <><IconClock size={11} style={{ marginRight: 3 }} /> {t.estimatedMinutes || 12} MENIT</>
                  </span>
                </div>

                <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)", fontFamily: "var(--font-heading)" }}>
                  {t.title}
                </h3>

                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0, marginBottom: "var(--space-4)" }}>
                  {t.summary}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-sm)", paddingTop: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <span className="badge badge-gold" style={{ fontSize: "11px" }}>
                  {isEnhanced ? "12 Latihan + 10 Soal" : `${t.questions ? t.questions.length : 3} Soal Kuis`}
                </span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent-navy)" }}>
                  Pelajari Modul
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
