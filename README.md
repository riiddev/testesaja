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

The unmodified compressed Oxford corpus has **2,970 records with an Indonesian meaning**, **2,293 with an English example**, and **1,934 with an Indonesian example translation**. The previously reported live-app estimate of **2,303 entries** for practice is a pre–A–E-import baseline, not a current count; the runtime combines the Oxford corpus, editorial overlays, and the imported A–E rows now in `data/vocabulary.json`, so that estimate must not be treated as current. The editorial pass covers **261 A1/A2 headwords**, **75 in the first B1/B2 review**, **523 additional B1/B2 entries** filled because their main examples or meanings were missing (including all 32 formerly missing meanings), and **285 B1/B2 entries** whose existing English examples now have Indonesian translations (148 B1 and 137 B2): **1,144 unique editorial overlay records** overall. After the overlays are applied, B1 and B2 have no missing meanings, main examples, or Indonesian example translations. Some entries elsewhere in the corpus still have incomplete translations, and the newly authored meanings, definitions, examples, and translations are **drafts, not independently human-verified**. Other records continue to include dictionary-derived or machine-translated material that needs careful review. The app does not claim all 2,971 headwords are pedagogically complete or ready to study. See [data/oxford3000/audit.json](data/oxford3000/audit.json) for the detailed data-quality summary.

The Oxford source list is available at [Oxford Learner's Dictionaries — American Oxford 3000 PDF](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/American_Oxford_3000.pdf). SinauuEnglish is an independent project and is not affiliated with or endorsed by Oxford University Press.

The grammar curriculum currently contains **6 lessons and 18 topic-specific questions**. Broader grammar coverage and human review of the vocabulary corpus remain ongoing work.

## Accounts, cross-device progress, and app installation

The workspace now includes a progressive web app (PWA) manifest and service worker, with an account entry point for email/password sign-up, sign-in, and cloud sync. Vocabulary evidence/mastery, favorites, grammar, activity history, Matching, and HABIT reading answers are included in the sync bundle.

**Cloud accounts remain disabled until configured.** Create a Supabase Free project, apply [the SQL migration](supabase/migrations/20261029000000_create_user_learning_states.sql), and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel project’s Production and Preview environments. Follow [the step-by-step account and sync setup](docs/ACCOUNT-SYNC-SETUP.md). The SQL uses Row Level Security to restrict each account to its own learning-state row; never add a service-role/secret key to the browser environment.

Learners can install the website from their browser’s “Install app” / “Add to Home Screen” menu. This is a PWA (installed website), not a native Android APK or App Store/Play Store package. The existing local-first learning modes still work if cloud configuration is absent.

## Technical constraints

- Static HTML, CSS, JavaScript, and JSON; no backend, API server, login, or required paid service.
- The source repository is the source of truth. Content updates go through GitHub and redeploy through the connected Vercel project.
- Study progress remains local to the browser/device. There is no automatic cross-device sync.
- Back up progress before clearing browser storage or switching devices.

## Files

- `index.html`, `styles.css`, `app.js` — landing page.
- `belajar.html`, `belajar.css`, `belajar.js` — local-first learning workspace.
- `data/vocabulary.json` — retained curated starter entries plus 965 unique A–E batch rows imported from `riiddev/SinauuEnglish`; imported rows override the Oxford-derived entry for matching headwords and are marked draft pending human review.
- `data/grammar.json` — starter grammar curriculum and question bank.
- `data/oxford3000/*.json.gz.b64` — gzip-compressed, Base64-encoded corpus split by CEFR level for static hosting.
- `data/oxford3000/editorial-overrides.json.gz.b64` — original bundle for 204 editorial drafts (197 new headwords plus 7 updates to existing curated entries).
- `data/oxford3000/editorial-overrides-batch2-a.json.gz.b64` and `editorial-overrides-batch2-b.json.gz.b64` — 57 additional high-frequency A1/A2 draft entries.
- `data/oxford3000/editorial-overrides-context-fixes.json.gz.b64` — corrected context-choice options and word forms for five earlier entries.
- `data/oxford3000/editorial-overrides-b1b2-a.json.gz`, `editorial-overrides-b1b2-b.json.gz.b64`, and `editorial-overrides-b1b2-c.json.gz` — first editorial review batch of 75 B1/B2 headwords.
- `data/oxford3000/editorial-overrides-gap-01.json.gz.b64` through `editorial-overrides-gap-22.json.gz.b64` — 523 B1/B2 entries with newly completed meanings and/or main examples, Indonesian translations, context examples, and answer-key checks.
- `data/oxford3000/editorial-overrides-b1b2-translations.json.gz.b64` — 285 existing B1/B2 entries with their previously blank Indonesian example translations filled; translations remain draft content pending human review.
- `data/oxford3000/editorial-overrides-loader.js` — combines gzip and gzip/Base64 overlays in the browser before the learning workspace loads.
- `data/oxford3000/ATTRIBUTION.md`, `data/oxford3000/audit.json` — source attribution and content-quality audit.

## Next work

1. Human-review high-frequency meanings, parts of speech, examples, and Indonesian translations, starting with A1/A2.
2. Replace unreliable or fragmentary examples and improve context variants before expanding the mastery-ready pool.
3. Expand grammar lessons and validated question banks topic by topic.
4. Build stories, everyday English, listening, speaking, writing, and placement-test modules.
5. Continue responsive, accessibility, persistence, backup/restore, and regression checks.

**Data integrity rule:** report counts that come from the checked-in corpus and mastery only from real saved learning records.


## Quality checks

- `npm run test:content` validates vocabulary fields and uniqueness, all reading-question answer keys, HABIT passage integrity and word-count metadata, and byte-for-byte synchronization between root and `public/data` JSON copies.
- `npm run build` runs TypeScript checks and builds all production entry points.
- `npm run test:browser` runs Playwright smoke tests for the landing page, navigation, vocabulary lookup, HABIT reading questions, feedback, and answer persistence. Install Playwright and Chromium before running it locally; the `.github/workflows/quality-gates.yml` workflow does that in CI.
- Automated checks catch structural and regression problems, not every linguistic nuance. The 965 imported A–E entries remain marked as editorial drafts until an independent human review confirms their meanings, examples, and Indonesian translations.

## HABIT reading library

- `public/data/habit-reading-library.json` contains **156 unique reading passages** extracted from the user-provided `HABIT.pdf` (175 physical PDF pages, including a final blank page; 174 numbered content pages. Blank/reference-only pages and exact duplicate text are not treated as separate passages). The extracted collection contains approximately **63,309 words**. Reference lists and raw source-link fragments are excluded from passage bodies.
- The Reading Comprehension page provides search by title/body, category filtering, progressive loading, a full passage reader, and three evidence-based detail questions per passage. The correct option is an exact sentence from the selected passage; distractors are exact sentences from other passages. Each answer shows the supporting sentence and paragraph number. Distractors are prioritized from other passages in the same broad category, with similar wording, before falling back to other categories.
- Reading selections and answers are saved in local storage and contribute to the existing local activity history. Nothing is sent to an external backend.
- `data/reading-lessons.json` / `public/data/reading-lessons.json` retains the original 12 reading-skill lessons, now aligned to “The Learning Myth That Will Not Die” from the PDF.

## Vocabulary batch import (2026-10-28)

- The static curated vocabulary JSON now contains **999 unique entries**: 34 retained original starter entries and 965 new unique entries from batches A, B, C1, C2, D, and E (978 source rows total; overlapping headwords were not duplicated).
- Each imported row has a headword, part of speech, CEFR level, topic, Indonesian meaning(s), an English example, and Indonesian example translation. The imported 965 entries remain marked as editorial drafts because the source batches flag them for human language review. The import does not invent IPA or extra word forms.
- The broader compressed Oxford 3000 corpus and existing editorial overlays remain in place; this batch import supplements and overrides matching headwords rather than replacing the corpus.
- The app's data and script files are mirrored under `public/` where required by Vite's configured `publicDir`. Keep the root data and public static copies synchronized when making future content changes.
