import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";
import { IconClock, IconCheck, IconRefresh } from "../../components/common/Icons.jsx";

const MODULE_FILTERS = [
  { id: "all", label: "Semua Sesi" },
  { id: "matching", label: "Matching Konteks" },
  { id: "grammar", label: "Grammar Quiz" },
  { id: "reading_quiz", label: "HABIT Reading Quiz" },
  { id: "story_episode", label: "Petualangan Cerita" },
  { id: "vocabulary", label: "Kosakata (SRS)" }
];

export function PracticeHistoryView({ onStartStudyWord }) {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [historyItems, setHistoryItems] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch 7-day summary
  useEffect(() => {
    let active = true;
    api.getActivitySummary()
      .then((res) => {
        if (active && res.success && res.data) {
          setSummaryData(res.data);
        }
      })
      .catch((err) => {
        console.warn("[PracticeHistory] Gagal memuat ringkasan 7 hari:", err.message);
      });
    return () => { active = false; };
  }, []);

  // 2. Fetch history feed (initial or on filter change)
  const fetchFeed = useCallback(async (filter, cursor = null, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const res = await api.getActivityHistory({
        limit: 10,
        cursor,
        type: filter
      });

      if (res.success && res.data) {
        const newItems = res.data.items || [];
        setHistoryItems((prev) => append ? [...prev, ...newItems] : newItems);
        setNextCursor(res.data.nextCursor || null);
        setHasMore(Boolean(res.data.hasMore));
      } else {
        setError(res.error || "Gagal memuat riwayat latihan.");
      }
    } catch (err) {
      console.error("[PracticeHistory] Fetch error:", err.message);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(selectedFilter, null, false);
  }, [selectedFilter, fetchFeed]);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    fetchFeed(selectedFilter, nextCursor, true);
  };

  const handlePracticeMistakes = (wrongItems) => {
    if (!wrongItems || wrongItems.length === 0) return;
    const firstWrong = typeof wrongItems[0] === "string" ? wrongItems[0] : (wrongItems[0]?.word || wrongItems[0]?.id);
    if (onStartStudyWord && firstWrong) {
      onStartStudyWord({ id: firstWrong, word: firstWrong });
    } else {
      navigate("/belajar/review");
    }
  };

  const formatDateTime = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta"
      }) + " WIB";
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "var(--space-12)" }} id="practice-history-root">
      {/* 1. Header Banner */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, color: "var(--color-text-secondary)" }}>
          Evaluasi & Retensi 90 Hari
        </span>
        <h2 style={{ fontSize: "var(--text-3xl)", margin: "4px 0 var(--space-2)" }}>
          Riwayat Latihan Belajar
        </h2>
        <p style={{ color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Setiap sesi latihan, pencapaian skor, dan kosakata yang perlu diperbaiki tercatat otomatis di server.
        </p>
      </div>

      {/* 2. 7-Day Performance & Consistency Summary */}
      {summaryData && (
        <div className="card card-tint-sand" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }} id="history-7day-summary">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <h3 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
              Tren Konsistensi 7 Hari Terakhir
            </h3>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
              {(summaryData.totalSessions7Days ?? summaryData.totalSessions ?? 0)} Sesi Selesai • +{(summaryData.totalXp7Days ?? summaryData.totalXpEarned ?? 0)} EXP
            </span>
          </div>

          {/* 7-Day Mini Bar Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "var(--space-2)", textAlign: "center", marginTop: "var(--space-3)" }}>
            {((summaryData.days || summaryData.dailyTrend || [])).map((day, idx) => {
              const count = day.sessionCount ?? day.count ?? 0;
              const allDays = summaryData.days || summaryData.dailyTrend || [];
              const maxCount = Math.max(1, ...(allDays.map((d) => d.sessionCount ?? d.count ?? 0)));
              const heightPct = Math.max(12, Math.round((count / maxCount) * 100));
              const hasActivity = count > 0;

              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: hasActivity ? "var(--color-brand)" : "var(--color-text-secondary)" }}>
                    {count}x
                  </span>
                  <div style={{ width: "100%", height: "54px", backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${hasActivity ? heightPct : 6}%`,
                        backgroundColor: hasActivity ? "var(--color-brand)" : "rgba(0,0,0,0.08)",
                        borderRadius: "var(--radius-sm)",
                        transition: "height 0.3s ease"
                      }}
                      title={`${day.dateStr}: ${count} sesi, +${day.xpTotal ?? day.xp ?? 0} EXP`}
                    />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    {day.dayLabel || day.dateStr?.slice(-2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px dashed rgba(0,0,0,0.1)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            <span>Durasi Belajar: <strong style={{ color: "var(--color-text-primary)" }}>{summaryData.totalDurationMinutes ?? 0} menit</strong></span>
            <span>Total EXP: <strong style={{ color: "var(--color-text-primary)" }}>+{summaryData.totalXp7Days ?? 0} EXP</strong></span>
          </div>
        </div>
      )}

      {/* 3. Module Filter Tabs */}
      <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        {MODULE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn btn-sm ${selectedFilter === f.id ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSelectedFilter(f.id)}
            style={{ whiteSpace: "nowrap", minHeight: "36px", fontSize: "12px", borderRadius: "var(--radius-pill)" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 4. Activity Feed List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            Memuat riwayat latihan...
          </p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "var(--space-6)", textAlign: "center", border: "1px solid #FEB2B2", backgroundColor: "#FFF5F5" }}>
          <p style={{ color: "#C53030", margin: "0 0 var(--space-3)" }}>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchFeed(selectedFilter, null, false)}>
            <IconRefresh size={14} style={{ marginRight: 6 }} /> Coba Lagi
          </button>
        </div>
      ) : historyItems.length === 0 ? (
        /* Empty State with Kanci Mascot */
        <div className="card card-tint-sand" style={{ padding: "var(--space-8)", textAlign: "center", marginTop: "var(--space-4)" }}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <KanciMascot
              expression="thinking"
              size="md"
              dialogue="Belum ada sesi latihan di modul ini. Yuk mulai latihan sekarang!"
            />
          </div>
          <h3 style={{ fontSize: "var(--text-xl)", margin: "0 0 var(--space-2)" }}>
            Belum Ada Catatan Sesi
          </h3>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "460px", margin: "0 auto var(--space-6)", fontSize: "var(--text-sm)" }}>
            Selesaikan latihan kosakata, kuis grammar, petualangan, atau matching untuk melihat rekaman performa dan poin di sini.
          </p>
          <Link to="/belajar/vocabulary" className="btn btn-primary btn-md">
            Mulai Belajar Kosakata
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {historyItems.map((item) => {
            const hasWrongs = Array.isArray(item.wrongItems) && item.wrongItems.length > 0;
            const accuracy = item.accuracyPercent ?? Math.round(((item.score || 0) / (item.totalQuestions || 1)) * 100);

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  transition: "transform 0.15s ease",
                  border: "var(--border-sm)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span
                        className="scholar-chip"
                        style={{
                          fontSize: "10px",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          backgroundColor: "var(--color-bg-subtle)",
                          fontWeight: 700
                        }}
                      >
                        {item.activityType}
                      </span>
                      <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700 }}>
                        {item.title || "Sesi Latihan"}
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <IconClock size={12} /> {formatDateTime(item.createdAt)}
                      </span>
                      {item.durationSeconds > 0 && (
                        <span>⏱️ {item.durationSeconds} detik</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 800,
                          color: accuracy >= 80 ? "var(--color-brand)" : accuracy >= 60 ? "var(--color-accent-gold)" : "var(--color-danger, #E53E3E)"
                        }}
                      >
                        {accuracy}% ({item.score ?? 0}/{item.totalQuestions ?? 1})
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      +{(item.xpEarned ?? 0)} EXP • +{(item.coinsEarned ?? 0)} Koin
                    </div>
                  </div>
                </div>

                {/* Wrong Items Mistake Breakdown (Butir F) */}
                {hasWrongs && (
                  <div
                    style={{
                      padding: "var(--space-3)",
                      backgroundColor: "var(--color-bg-subtle)",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed rgba(0,0,0,0.12)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#C53030", display: "block", marginBottom: "4px" }}>
                          ⚠️ Perlu Diperbaiki ({item.wrongItems.length} item):
                        </span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {item.wrongItems.slice(0, 5).map((w, wIdx) => {
                            const label = typeof w === "string" ? w : (w.word || w.id || `Soal #${wIdx + 1}`);
                            return (
                              <span
                                key={wIdx}
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  backgroundColor: "#FED7D7",
                                  color: "#9B2C2C",
                                  borderRadius: "var(--radius-sm)",
                                  fontWeight: 600
                                }}
                              >
                                {label}
                              </span>
                            );
                          })}
                          {item.wrongItems.length > 5 && (
                            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                              +{item.wrongItems.length - 5} lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePracticeMistakes(item.wrongItems)}
                        style={{ fontSize: "11px", padding: "4px 10px", minHeight: "30px", alignSelf: "flex-end" }}
                      >
                        Latih Lagi Yang Salah →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Cursor Load More */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                id="load-more-history-btn"
                style={{ minWidth: "180px" }}
              >
                {isLoadingMore ? "Memuat..." : "Tampilkan Sesi Terdahulu"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
