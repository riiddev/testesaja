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
