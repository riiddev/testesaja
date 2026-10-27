# SinauuEnglish

SinauuEnglish is a frontend-only English-learning workspace for Indonesian learners. It teaches vocabulary and grammar through contextual practice and spaced review, with study records stored on the learner's device.

## Current build

### Landing page
- Soft editorial visual direction with warm paper, sage, and lilac accents.
- Responsive layout, light/dark theme, and reduced-motion support.
- Landing-page calls to action open the learning workspace.

### Learning workspace
- Vocabulary search by headword, Indonesian meaning, English example, definition, CEFR level, topic, and favorites.
- The vocabulary index includes the supplied simplified American English Oxford 3000 headword list. Search results are rendered incrementally (100 words per batch) rather than mounting thousands of rows at once.
- Entries are marked as practice-ready only when they include a usable meaning and example. Incomplete source entries remain searchable, with practice disabled rather than invented content.
- Vocabulary details include Indonesian meaning, pronunciation when available, word forms, examples, collocations, additional contexts, and usage notes.
- Vocabulary practice records typed meaning recall, context recognition, typed sentence production/self-check, confidence, answer history, and study dates.
- Mastery is not awarded from exposure or a single correct answer. It requires recall, context, active-usage self-check, and three successful spaced reviews across separate dates spanning at least 12 days.
- Topic-specific grammar lessons include Indonesian explanations, patterns, translated examples, common mistakes, checkpoints, and individual exercises.
- Progress summaries are calculated from the loaded content and saved study events.
- IndexedDB is used when available, with localStorage fallback. JSON backup export/import is included.
- Browser-native speech synthesis is used only where supported; pronunciation quality is not automatically graded.

## Vocabulary corpus and its limitations

The supplied simplified list contains **2,971 unique Oxford 3000 headwords**. Its available CEFR metadata is:

| Level | Headwords |
|---|---:|
| A1 | 892 |
| A2 | 792 |
| B1 | 689 |
| B2 | 597 |
| Not classified | 1 |
| **Total** | **2,971** |

The simple headword list does not preserve the per-sense part-of-speech and CEFR information present in Oxford's PDF. The CEFR/POS labels were matched against a third-party text transcription because the simplified Markdown omits them. One headword, “o”, remains unclassified instead of being assigned a guessed level. The workspace also retains three independent SinauuEnglish starter words that are not in the supplied Oxford list, so it contains 2,974 unique display entries in total.

English–Indonesian meanings, definitions, IPA where available, and example material are enriched from the [KOReader English–Indonesian dictionary](https://github.com/DanielGregorini/koreader-dicts), a CC-BY-SA-4.0 compilation that includes WordNet Bahasa, Princeton WordNet 3.0, and English Wiktionary. See [data/oxford3000/ATTRIBUTION.md](data/oxford3000/ATTRIBUTION.md) for license/source details.

The Oxford corpus currently has **2,938 records with a populated Indonesian meaning**, **1,770 with an English example**, and **1,126 with a populated Indonesian example translation**. In the live app, the Oxford corpus plus the original curated starter and editorial overlays exposes **1,784 entries** that can be opened for practice. The editorial pass covers **261 high-frequency A1/A2 headwords** (**179 A1 and 82 A2**) plus a first batch of **75 B1/B2 headwords** (**39 B1 and 36 B2**), for **336 unique editorial entries** overall. All A1/A2 headwords now have meanings in the corpus, but B1/B2 still has meaning gaps (18 B1 and 14 B2 records without a meaning) and many entries without examples (285 B1 and 238 B2). The newly authored meanings, definitions, examples, and translations are **drafts, not independently human-verified**. Other records still include dictionary-derived or machine-translated material and need careful review. The app does not claim all 2,971 headwords are pedagogically complete or ready to study. See [data/oxford3000/audit.json](data/oxford3000/audit.json) for the detailed data-quality summary.

The Oxford source list is available at [Oxford Learner's Dictionaries — American Oxford 3000 PDF](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/American_Oxford_3000.pdf). SinauuEnglish is an independent project and is not affiliated with or endorsed by Oxford University Press.

The grammar curriculum currently contains **6 lessons and 18 topic-specific questions**. Broader grammar coverage and human review of the vocabulary corpus remain ongoing work.

## Technical constraints

- Static HTML, CSS, JavaScript, and JSON; no backend, API server, login, or required paid service.
- The source repository is the source of truth. Content updates go through GitHub and redeploy through the connected Vercel project.
- Study progress remains local to the browser/device. There is no automatic cross-device sync.
- Back up progress before clearing browser storage or switching devices.

## Files

- `index.html`, `styles.css`, `app.js` — landing page.
- `belajar.html`, `belajar.css`, `belajar.js` — local-first learning workspace.
- `data/vocabulary.json` — curated starter vocabulary; its entries override the Oxford-derived entry for matching headwords.
- `data/grammar.json` — starter grammar curriculum and question bank.
- `data/oxford3000/*.json.gz.b64` — gzip-compressed, Base64-encoded corpus split by CEFR level for static hosting.
- `data/oxford3000/editorial-overrides.json.gz.b64` — original bundle for 204 editorial drafts (197 new headwords plus 7 updates to existing curated entries).
- `data/oxford3000/editorial-overrides-batch2-a.json.gz.b64` and `editorial-overrides-batch2-b.json.gz.b64` — 57 additional high-frequency A1/A2 draft entries.
- `data/oxford3000/editorial-overrides-context-fixes.json.gz.b64` — corrected context-choice options and word forms for five earlier entries.
- `data/oxford3000/editorial-overrides-b1b2-a.json.gz`, `editorial-overrides-b1b2-b.json.gz.b64`, and `editorial-overrides-b1b2-c.json.gz` — first editorial review batch of 75 B1/B2 headwords.
- `data/oxford3000/editorial-overrides-loader.js` — combines gzip and gzip/Base64 overlays in the browser before the learning workspace loads.
- `data/oxford3000/ATTRIBUTION.md`, `data/oxford3000/audit.json` — source attribution and content-quality audit.

## Next work

1. Human-review high-frequency meanings, parts of speech, examples, and Indonesian translations, starting with A1/A2.
2. Replace unreliable or fragmentary examples and improve context variants before expanding the mastery-ready pool.
3. Expand grammar lessons and validated question banks topic by topic.
4. Build stories, everyday English, listening, speaking, writing, and placement-test modules.
5. Continue responsive, accessibility, persistence, backup/restore, and regression checks.

**Data integrity rule:** report counts that come from the checked-in corpus and mastery only from real saved learning records.
