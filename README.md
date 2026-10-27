# SinauuEnglish

SinauuEnglish is a frontend-only English-learning workspace for Indonesian learners. It teaches vocabulary and grammar through contextual practice and spaced review, with study records stored on the learner's device.

## Current build

### Landing page
- Soft editorial visual direction with warm paper, sage, and lilac accents.
- Responsive layout, light/dark theme, and reduced-motion support.
- Landing-page calls to action open the learning workspace.

### Learning workspace
- Vocabulary search by word/meaning/example, CEFR filter, topic filter, and favorites.
- Vocabulary details include Indonesian meaning, pronunciation when available, word forms, examples, collocations, and usage notes.
- A vocabulary study flow records meaning recall, context recognition, typed sentence production/self-check, confidence, answer history, and study dates.
- Mastery is not awarded from exposure or a single correct answer. It requires recall, context, active-usage self-check, and three successful spaced reviews across separate dates spanning at least 12 days.
- Topic-specific grammar lessons include Indonesian explanations, patterns, translated examples, common mistakes, checkpoints, and individual exercises.
- Progress summaries are calculated from the real current dataset and saved study events.
- IndexedDB is used when available, with localStorage fallback. JSON backup export/import is included.
- Browser-native speech synthesis is used only where supported; pronunciation quality is not automatically graded.

## Actual content status

The starter corpus currently has **34 curated vocabulary entries** and **6 grammar topics with 18 topic-specific questions**. These counts come from the checked-in JSON datasets.

The original Google Drive vocabulary source has **not yet been imported or audited**. Its contents could not be accessed by the available reader, so this build does not claim source coverage or full A1–C1 coverage. The current vocabulary set is seed content, not a replacement for the full source list.

The initial grammar curriculum covers a limited set of A1–B1 topics; the broader target curriculum remains incomplete. Topic/question counts are derived from the JSON data, not visual placeholders.

## Technical constraints

- Static HTML, CSS, JavaScript, and JSON; no backend, API server, login, or required paid service.
- The source repository is the source of truth. Content updates go through GitHub and redeploy through the connected Vercel project.
- Study progress remains local to the browser/device. There is no automatic cross-device sync.
- Back up progress before clearing browser storage or switching devices.

## Files

- index.html, styles.css, app.js — landing page.
- belajar.html, belajar.css, belajar.js — local-first learning workspace.
- data/vocabulary.json — curated starter vocabulary.
- data/grammar.json — curated starter grammar curriculum and question bank.

## Roadmap

1. Import and audit the complete original vocabulary source.
2. Expand and review A1/A2 vocabulary, then substantially expand B1/B2 and selected C1 entries.
3. Expand grammar lessons and validated question banks topic by topic.
4. Add additional context variants and refine mastery/review edge cases with automated tests.
5. Build stories, everyday English, listening, speaking, writing, and placement-test modules.
6. Run responsive, accessibility, persistence, backup/restore, and regression checks.

**Data integrity rule:** only report counts and mastery metrics that can be derived from real validated content and saved learning records.
