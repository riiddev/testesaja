import React from "react";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { getWordStatus, STATUS_META } from "../../hooks/useSpacedRepetition.js";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";

export function ReviewQueue({ vocabulary = [], progressMap = {}, onStartStudy }) {
  const wordsWithProgress = vocabulary.filter((w) => progressMap[w.id]);

  const dueWords = wordsWithProgress.filter((w) => {
    const status = getWordStatus(progressMap[w.id]);
    return status === "review_due";
  });

  const weakWords = wordsWithProgress.filter((w) => {
    const status = getWordStatus(progressMap[w.id]);
    return status === "weak";
  });

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="section-title">Antrean Review Berjeda</h2>
        <p className="section-desc">
          Kunci ingatan jangka panjang dengan meninjau kembali kata-kata yang telah jatuh tempo atau pernah salah dijawab.
        </p>
      </div>

      {/* Due Review Section */}
      <div className="card card-tint-sand" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>
            Kata Jatuh Tempo ({dueWords.length})
          </h3>
          {dueWords.length > 0 && (
            <Button size="sm" variant="primary" onClick={() => onStartStudy(dueWords[0])}>
              Mulai Review Cepat
            </Button>
          )}
        </div>

        {dueWords.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
            <KanciMascot expression="sleepy" size="sm" animate={false} />
            <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.5 }}>
              Bagus sekali! Tidak ada kata yang jatuh tempo hari ini. Kanci sedang santai sejenak sambil menanti giliran review berikutnya. Kamu bisa menambah kata baru dari daftar kosakata.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {dueWords.map((w) => (
              <div
                key={w.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-3) var(--space-4)",
                  backgroundColor: "var(--color-bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "var(--border-sm)"
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: "2px" }}>
                    <strong style={{ fontSize: "var(--text-base)" }}>{w.word}</strong>
                    <Badge variant="navy">{w.level}</Badge>
                    <Badge variant="due">Jatuh Tempo</Badge>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{w.meaning}</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onStartStudy(w)}>
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weak Words Journal */}
      <div className="card card-tint-rose" style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
          Jurnal Kesalahan / Perlu Perhatian ({weakWords.length})
        </h3>

        {weakWords.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            Belum ada kata yang tercatat dalam daftar evaluasi kesalahan.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {weakWords.map((w) => (
              <div
                key={w.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-3) var(--space-4)",
                  backgroundColor: "var(--color-bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "var(--border-sm)"
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: "2px" }}>
                    <strong style={{ fontSize: "var(--text-base)" }}>{w.word}</strong>
                    <Badge variant="weak">Salah {progressMap[w.id]?.wrongCount || 1}x</Badge>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{w.meaning}</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onStartStudy(w)}>
                  Latih Ulang
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

