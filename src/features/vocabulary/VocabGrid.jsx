import {
  IconRefresh
} from "../../components/common/Icons.jsx";
import React, { useState, useMemo } from "react";
import { VocabCard } from "./VocabCard.jsx";
import { VocabModal } from "./VocabModal.jsx";
import { useSpeech } from "../../hooks/useSpeech.js";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 60;

export function VocabGrid({ vocabulary = [], progressMap = {}, onStartStudy }) {
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedWord, setSelectedWord] = useState(null);

  const { speak } = useSpeech();
  const navigate = useNavigate();

  // Filter words by level and search query
  const filteredWords = useMemo(() => {
    return vocabulary.filter((w) => {
      const matchLevel = levelFilter === "all" || w.level === levelFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        w.word.toLowerCase().includes(q) ||
        (w.meaning && w.meaning.toLowerCase().includes(q));
      return matchLevel && matchSearch;
    });
  }, [vocabulary, levelFilter, searchQuery]);

  const displayedWords = useMemo(() => {
    return filteredWords.slice(0, visibleCount);
  }, [filteredWords, visibleCount]);

  const handleStudy = (word) => {
    if (onStartStudy) {
      onStartStudy(word);
    } else {
      navigate("/belajar/study", { state: { word } });
    }
  };

  return (
    <div>
      <div className="vocab-controls">
        <input
          className="form-control form-search"
          id="vocab-search"
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Cari kata Inggris atau arti bahasa Indonesia..."
          aria-label="Cari kata"
        />

        <div className="filter-chips">
          {[
            { id: "all", label: "Semua Kata (2.971)" },
            { id: "A1", label: "Level A1 (892)" },
            { id: "A2", label: "Level A2 (792)" },
            { id: "B1", label: "Level B1 (689)" },
            { id: "B2", label: "Level B2 (597)" }
          ].map((chip) => (
            <button
              key={chip.id}
              className={`chip ${levelFilter === chip.id ? "is-active" : ""}`}
              data-level={chip.id}
              type="button"
              onClick={() => {
                setLevelFilter(chip.id);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }} id="vocab-total-count">
          Menampilkan {displayedWords.length} dari {filteredWords.length} kata
        </span>
      </div>

      <div className="vocab-grid" id="vocab-list">
        {displayedWords.map((word) => {
          const itemProgress = progressMap[word.id];
          const status = itemProgress?.masteryStage || "fresh";
          return (
            <VocabCard
              key={word.id}
              word={word}
              status={status}
              onSelect={setSelectedWord}
              onAudio={speak}
            />
          );
        })}
      </div>

      {visibleCount < filteredWords.length && (
        <div style={{ textAlign: "center", marginTop: "var(--space-8)" }}>
          <button
            className="btn btn-secondary btn-lg"
            id="vocab-load-more"
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          >
            <>Muat Lebih Banyak Kata <IconRefresh size={13} style={{ marginLeft: 4 }} /></>
          </button>
        </div>
      )}

      {selectedWord && (
        <VocabModal
          word={selectedWord}
          status={progressMap[selectedWord.id]?.masteryStage || "fresh"}
          isOpen={Boolean(selectedWord)}
          onClose={() => setSelectedWord(null)}
          onStartStudy={handleStudy}
          onAudio={speak}
        />
      )}
    </div>
  );
}
