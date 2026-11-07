import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("catalog totals are not rendered as UI copy", () => {
  const landing = read("src/pages/LandingPage.jsx");
  const workspace = read("src/pages/WorkspacePage.jsx");
  const grammarGrid = read("src/features/grammar/GrammarGrid.jsx");
  const grammarDetail = read("src/features/grammar/GrammarDetail.jsx");
  const reading = read("src/features/reading/ReadingLibrary.jsx");
  const vocabulary = read("src/features/vocabulary/VocabGrid.jsx");
  const progress = read("src/features/progress/ProgressStats.jsx");

  for (const forbidden of [
    "2.971 KATA",
    "19 TOPIK",
    "156 BACAAN",
    "63.309 kata",
    "57 kuis interaktif"
  ]) {
    assert.ok(!landing.includes(forbidden), "Landing page still contains: " + forbidden);
  }

  for (const forbidden of ["total: 892", "total: 792", "total: 689", "total: 597", "{lvl.total}"]) {
    assert.ok(!workspace.includes(forbidden), "Workspace still contains catalogue total: " + forbidden);
  }

  assert.ok(!grammarGrid.includes("19 Modul"));
  assert.ok(!grammarGrid.includes("t.questions.length"));
  assert.ok(!grammarGrid.includes("12 Latihan + 10 Soal"));
  assert.ok(!grammarDetail.includes("Kembali ke 19 Modul"));

  assert.ok(!reading.includes("156 Bacaan"));
  assert.ok(!reading.includes("Semua Kategori (156)"));

  assert.ok(!vocabulary.includes("Menampilkan {displayedWords.length} dari {filteredWords.length} kata"));

  assert.ok(!progress.includes("const totalCorpus = 2971"));
  assert.ok(!progress.includes("lvl.total"));
  assert.ok(!progress.includes("Total Korpus Oxford 3000"));
  assert.ok(progress.includes("{weakCount}"), "Progress screen should show the learner's own review-needed count");
});
