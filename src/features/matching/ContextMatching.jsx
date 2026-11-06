import {
  IconRefresh
} from "../../components/common/Icons.jsx";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { generateMatchingRound } from "./matchingGenerator.js";
import "../../styles/matching.css";

export function ContextMatching({ vocabulary = [], onRecordMatchComplete }) {
  const [levelFilter, setLevelFilter] = useState("all");
  const [roundData, setRoundData] = useState(() => generateMatchingRound(vocabulary, "all", 5));
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [hintedPair, setHintedPair] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState([]);

  // Dragging state
  const [dragState, setDragState] = useState(null); // { startId, startX, startY, currentX, currentY }

  const boardRef = useRef(null);

  // Initialize new round
  const startNewRound = useCallback((lvl = levelFilter) => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairs([]);
    setWrongPair(null);
    setHintedPair(null);
    setLines([]);
    setDragState(null);
    setRoundData(generateMatchingRound(vocabulary, lvl, 5));
  }, [vocabulary, levelFilter]);

  // Handle level change
  const handleLevelChange = (lvl) => {
    setLevelFilter(lvl);
    startNewRound(lvl);
  };

  // Measure anchor ports and recalculate Bézier curves
  const updateLines = useCallback(() => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    const computedLines = matchedPairs.map((pair) => {
      const leftPort = document.getElementById(`port-left-${pair.leftId}`);
      const rightPort = document.getElementById(`port-right-${pair.rightId}`);

      if (!leftPort || !rightPort) return null;

      const lRect = leftPort.getBoundingClientRect();
      const rRect = rightPort.getBoundingClientRect();

      const x1 = lRect.left + lRect.width / 2 - boardRect.left;
      const y1 = lRect.top + lRect.height / 2 - boardRect.top;
      const x2 = rRect.left + rRect.width / 2 - boardRect.left;
      const y2 = rRect.top + rRect.height / 2 - boardRect.top;

      const dx = Math.abs(x2 - x1);
      const cp1x = x1 + dx * 0.5;
      const cp1y = y1;
      const cp2x = x2 - dx * 0.5;
      const cp2y = y2;

      return {
        id: `${pair.leftId}-${pair.rightId}`,
        d: `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`,
        status: "matched"
      };
    }).filter(Boolean);

    setLines(computedLines);
  }, [matchedPairs]);

  // Recalculate lines when matches change or window resizes
  useEffect(() => {
    updateLines();
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [updateLines]);

  // Evaluate pair match
  const evaluateMatch = (leftItem, rightItem) => {
    if (leftItem.wordId === rightItem.wordId) {
      // MATCH SUCCESS
      const newMatched = [...matchedPairs, { leftId: leftItem.id, rightId: rightItem.id, wordId: leftItem.wordId }];
      setMatchedPairs(newMatched);
      setScore((prev) => prev + 20);
      setSelectedLeft(null);
      setSelectedRight(null);
      setHintedPair(null);

      // Trigger reward callback if round complete
      if (newMatched.length === roundData.totalPairs) {
        if (onRecordMatchComplete) {
          onRecordMatchComplete({ score: score + 20, count: 5 });
        }
      }
    } else {
      // MATCH FAILED (Micro-shake & red curve)
      setWrongPair({ leftId: leftItem.id, rightId: rightItem.id });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 650);
    }
  };

  // Handle Tap-to-Select
  const handleLeftClick = (item) => {
    if (matchedPairs.some((p) => p.leftId === item.id)) return;
    if (wrongPair) return;

    if (selectedLeft?.id === item.id) {
      setSelectedLeft(null);
      return;
    }

    setSelectedLeft(item);

    if (selectedRight) {
      evaluateMatch(item, selectedRight);
    }
  };

  const handleRightClick = (item) => {
    if (matchedPairs.some((p) => p.rightId === item.id)) return;
    if (wrongPair) return;

    if (selectedRight?.id === item.id) {
      setSelectedRight(null);
      return;
    }

    setSelectedRight(item);

    if (selectedLeft) {
      evaluateMatch(selectedLeft, item);
    }
  };

  // Handle "Bantuan Petunjuk" (Hint)
  const handleProvideHint = () => {
    if (hintsRemaining <= 0) return;

    // Find first unmatched pair
    const unmatchedLeft = roundData.leftItems.find((l) => !matchedPairs.some((p) => p.leftId === l.id));
    if (!unmatchedLeft) return;

    const matchingRight = roundData.rightItems.find((r) => r.wordId === unmatchedLeft.wordId);
    if (!matchingRight) return;

    setHintedPair({ leftId: unmatchedLeft.id, rightId: matchingRight.id });
    setHintsRemaining((prev) => prev - 1);

    setTimeout(() => {
      setHintedPair(null);
    }, 2500);
  };

  // Drag-to-Connect Pointer Handlers
  const handlePointerDownPort = (e, leftItem) => {
    e.stopPropagation();
    if (matchedPairs.some((p) => p.leftId === leftItem.id)) return;
    if (!boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    setDragState({
      startItem: leftItem,
      startX: e.clientX - boardRect.left,
      startY: e.clientY - boardRect.top,
      currentX: e.clientX - boardRect.left,
      currentY: e.clientY - boardRect.top
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    setDragState((prev) => ({
      ...prev,
      currentX: e.clientX - boardRect.left,
      currentY: e.clientY - boardRect.top
    }));
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    setDragState(null);
  };

  const handlePointerUpOnRight = (rightItem) => {
    if (!dragState) return;
    evaluateMatch(dragState.startItem, rightItem);
    setDragState(null);
  };

  const isRoundComplete = matchedPairs.length === roundData.totalPairs;

  return (
    <div
      className="matching-container"
      id="matching-view-root"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 1. HEADER CONTROL CARD */}
      <section className="matching-header-card" aria-label="Kontrol Matching">
        <div className="matching-top-row">
          <div className="matching-title-wrap">
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>
              Latihan Kontekstual
            </span>
            <h2 className="matching-title">Matching Konteks Kalimat</h2>
            <p className="matching-desc">
              Hubungkan kalimat rumpang di sebelah kiri dengan kata yang tepat di sebelah kanan berdasarkan konteks makna kalimat.
            </p>
          </div>

          <div className="matching-controls-row">
            <span className="matching-stat-pill" id="matching-pairs-count">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Pasangan: {matchedPairs.length} / {roundData.totalPairs}
            </span>

            <span className="matching-stat-pill" id="matching-score-badge">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ color: "var(--color-accent-gold)" }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Skor: {score}</span>
              </span>
            </span>

            <button
              type="button"
              className="btn-hint"
              onClick={handleProvideHint}
              disabled={hintsRemaining <= 0 || isRoundComplete}
              title="Dapatkan bantuan kilau petunjuk pada pasangan yang tepat"
              id="hint-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                <circle cx="12" cy="12" r="5"/>
              </svg>
              Bantuan Petunjuk ({hintsRemaining})
            </button>
          </div>
        </div>

        {/* Level Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            Filter Level:
          </span>
          {["all", "A1", "A2", "B1", "B2"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`filter-pill-btn ${levelFilter === lvl ? "is-active" : ""}`}
              onClick={() => handleLevelChange(lvl)}
            >
              {lvl === "all" ? "Semua Level" : `Level ${lvl}`}
            </button>
          ))}
        </div>
      </section>

      {/* 2. MATCHING BOARD WITH SVG CANVAS */}
      <section className="matching-board" ref={boardRef} aria-label="Papan Menjodohkan Kata">
        {/* SVG Drawing Canvas */}
        <svg className="matching-svg-canvas" aria-hidden="true">
          {/* Matched Completed Lines */}
          {lines.map((line) => (
            <path key={line.id} d={line.d} className="bezier-line-matched" />
          ))}

          {/* Active Dragging Line */}
          {dragState && (
            <path
              d={`M ${dragState.startX} ${dragState.startY} C ${dragState.startX + 60} ${dragState.startY}, ${dragState.currentX - 60} ${dragState.currentY}, ${dragState.currentX} ${dragState.currentY}`}
              className="bezier-line-drawing"
            />
          )}

          {/* Temporary Wrong Line */}
          {wrongPair && (() => {
            const lPort = document.getElementById(`port-left-${wrongPair.leftId}`);
            const rPort = document.getElementById(`port-right-${wrongPair.rightId}`);
            if (!lPort || !rPort || !boardRef.current) return null;
            const bRect = boardRef.current.getBoundingClientRect();
            const lr = lPort.getBoundingClientRect();
            const rr = rPort.getBoundingClientRect();
            const x1 = lr.left + lr.width / 2 - bRect.left;
            const y1 = lr.top + lr.height / 2 - bRect.top;
            const x2 = rr.left + rr.width / 2 - bRect.left;
            const y2 = rr.top + rr.height / 2 - bRect.top;
            const dx = Math.abs(x2 - x1);
            return (
              <path
                d={`M ${x1} ${y1} C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`}
                className="bezier-line-wrong"
              />
            );
          })()}
        </svg>

        {/* LEFT COLUMN: 5 CONTEXT SENTENCES */}
        <div className="matching-column col-sentences">
          <div className="matching-column-title">Kalimat Konteks Rumpang</div>
          {roundData.leftItems.map((item) => {
            const isMatched = matchedPairs.some((p) => p.leftId === item.id);
            const isSelected = selectedLeft?.id === item.id;
            const isWrong = wrongPair?.leftId === item.id;
            const isHinted = hintedPair?.leftId === item.id;

            return (
              <div
                key={item.id}
                id={`left-card-${item.id}`}
                className={`match-card ${isSelected ? "is-selected" : ""} ${isMatched ? "is-matched" : ""} ${isWrong ? "is-wrong" : ""} ${isHinted ? "is-hinted" : ""}`}
                onClick={() => handleLeftClick(item)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-disabled={isMatched}
                aria-label={`Kalimat: ${item.clozeSentence}`}
              >
                <div className="match-card-content">
                  <p className="sentence-text">
                    {renderClozedPrompt(item.clozeSentence)}
                  </p>
                  {item.translation && (
                    <p className="sentence-translation">
                      Arti: {item.translation}
                    </p>
                  )}
                </div>

                {/* Right Anchor Port */}
                <div
                  className="anchor-port port-right"
                  id={`port-left-${item.id}`}
                  onPointerDown={(e) => handlePointerDownPort(e, item)}
                  title="Tarik garis ke kata yang cocok"
                />
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: 5 TARGET WORDS */}
        <div className="matching-column col-words">
          <div className="matching-column-title">Kata Target</div>
          {roundData.rightItems.map((item) => {
            const isMatched = matchedPairs.some((p) => p.rightId === item.id);
            const isSelected = selectedRight?.id === item.id;
            const isWrong = wrongPair?.rightId === item.id;
            const isHinted = hintedPair?.rightId === item.id;

            return (
              <div
                key={item.id}
                id={`right-card-${item.id}`}
                className={`match-card ${isSelected ? "is-selected" : ""} ${isMatched ? "is-matched" : ""} ${isWrong ? "is-wrong" : ""} ${isHinted ? "is-hinted" : ""}`}
                onClick={() => handleRightClick(item)}
                onPointerUp={() => handlePointerUpOnRight(item)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-disabled={isMatched}
                aria-label={`Pilihan Kata: ${item.wordText}`}
              >
                {/* Left Anchor Port */}
                <div
                  className="anchor-port port-left"
                  id={`port-right-${item.id}`}
                />

                <div className="word-card-content">
                  <span className="word-text-label">{item.wordText}</span>
                  <span className="scholar-chip chip-level" style={{ fontSize: "10px", padding: "2px 8px" }}>
                    {item.level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. ROUND COMPLETION CARD */}
      {isRoundComplete && (
        <section className="matching-completion-card" aria-label="Putaran Selesai">
          <div className="trophy-badge-circle" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M6 4h12v5a6 6 0 0 1-12 0V4Z"/>
            </svg>
          </div>

          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: 800, margin: "0 0 4px" }}>
              Putaran Selesai Sempurna!
            </h3>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Kamu berhasil mencocokkan seluruh 5 kalimat konteks dengan kata target yang presisi.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", margin: "var(--space-2) 0" }}>
            <span className="reward-badge reward-exp" style={{ fontSize: "var(--text-sm)", padding: "6px 14px" }}>
              +50 EXP
            </span>
            <span className="reward-badge reward-coins" style={{ fontSize: "var(--text-sm)", padding: "6px 14px" }}>
              +20 Koin Sinau
            </span>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => startNewRound()}
              id="next-matching-round-btn"
              style={{ minHeight: "44px" }}
            >
              <><IconRefresh size={13} style={{ marginRight: 4 }} /> Putaran Berikutnya</>
            </button>

            <Link
              to="/belajar/missions"
              className="btn btn-outline"
              style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
            >
              Kembali ke Misi Harian
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// Helper to style clozed blank
function renderClozedPrompt(clozeSentence) {
  if (!clozeSentence) return "_____";
  const parts = clozeSentence.split("_____");
  if (parts.length === 1) return clozeSentence;

  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span className="cloze-blank">_____</span>}
        </React.Fragment>
      ))}
    </>
  );
}

