# Vocabulary data attribution

## Oxford headword list and CEFR/POS metadata

The corpus's 2,971 unique headwords are taken from the simplified, deduplicated American English Oxford 3000 list supplied for this project. The official reference is:

https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/American_Oxford_3000.pdf

A plain-text copy was used as a headword cross-check:
https://github.com/ittuann/The-Oxford-5000-Word-Lists/blob/main/American%20Oxford%203000.txt

The simplified Markdown does not include part-of-speech or CEFR labels. Where available, those fields were matched against this third-party text transcription:
https://gist.githubusercontent.com/G-tmp/a6d803c03386285a023af3a0912258d3/raw/American_Oxford_3000.txt

This is a transcription, not a file hosted by Oxford. One headword, “o”, remains without a matched CEFR level and is marked unclassified. SinauuEnglish is independent and is not affiliated with or endorsed by Oxford University Press.

## English–Indonesian dictionary enrichment

Glosses, English sense definitions, pronunciation/IPA where available, and usage examples are enriched from the KOReader English–Indonesian dictionary:

- Project and downloads: https://github.com/DanielGregorini/koreader-dicts
- Dictionary entry: English → Indonesian (en-id), generated 2026-09-21.
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA-4.0): https://creativecommons.org/licenses/by-sa/4.0/

The dictionary compilation lists these source datasets:
- omw-id: WordNet Bahasa, via Open Multilingual Wordnet 1.4.
- pwn30: Princeton University WordNet 3.0.
- wikt-en-id: English Wiktionary via kaikki.org (wiktextract).

**WordNet 3.0 notice:** Princeton University WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved. This copyright notice must be retained on all copies, including modified copies. The name of Princeton University or Princeton may not be used in advertising or publicity pertaining to distribution without prior written permission.

**Changes made for SinauuEnglish:** relevant dictionary records were selected and converted into a JSON learning corpus, matched to the supplied headwords, split into CEFR-level files, and filtered for entries whose examples were too short or did not contain the target headword. Available Indonesian translations are retained as unreviewed draft content; missing meanings/examples/translations are left blank instead of being fabricated. The checked-in corpus is distributed with the source data's CC-BY-SA-4.0 obligations and the terms of contributing sources above.

## Translation and content status

Indonesian translations present in dictionary-derived example records may be machine-generated. They have not all been individually human-reviewed. A record being marked study-ready only means the current app has a meaning and a usable example for its three-step practice flow; it does not mean the full entry has been pedagogically or linguistically reviewed. Dataset counts and real learning mastery are tracked separately.


## SinauuEnglish editorial overrides (2026-10-27)

The A1/A2 editorial pass covers 261 headwords (179 A1 and 82 A2): 254 additional overlay records plus updates to seven existing curated entries. A follow-up batch adds 57 headwords and corrects context-choice options and word forms. The first B1/B2 review covers 75 headwords (39 B1 and 36 B2) whose glosses, definitions, examples, or translations were missing or misleading. A further gap-completion pass adds 523 B1/B2 records (285 B1 and 238 B2) to fill missing main examples and the 32 missing meanings, with Indonesian translations and contextual practice. These are stored in `editorial-overrides-gap-01.json.gz.b64` through `editorial-overrides-gap-22.json.gz.b64`. The browser loader merges these static bundles without an API or backend. In total, 859 unique editorial overlay records are included. Each record includes an Indonesian gloss, English definition, main example with translation, two contextual examples with translations, and a three-option context question. These are assistant-authored editorial drafts, not independently human-verified or Oxford-authored content. Metadata uses `assistant-curated-draft` / `editorial-draft-needs-human-review` to preserve that distinction. Automated structure, target-example, and answer-key checks passed, but the draft language still requires independent human review.

The remaining entries continue to rely on the dictionary-enrichment pipeline described above, with gaps left blank where suitable information was not available. The compact runtime bundle is `data/oxford3000/editorial-overrides.json.gz.b64`; the original 34-entry starter file stays separate at `data/vocabulary.json`.
