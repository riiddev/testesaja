# SinauuEnglish

SinauuEnglish is a frontend-only English-learning platform for Indonesian learners. The goal is to make vocabulary, grammar, and everyday English easier to understand through contextual practice and spaced review.

## Current stage

**Phase 1: Landing page**

The current build is a responsive, soft-pastel landing page with:
- A responsive navigation menu.
- Light and dark themes.
- A vocabulary sample with browser-native speech synthesis when supported.
- A short interactive grammar question with feedback.
- Learning-path previews for CEFR A1–C1.
- Reduced-motion support and keyboard-visible focus states.

The learning workspace and full curriculum are planned next. CEFR cards and learning modules on this page describe the intended product direction; they do not claim that all learning content is already implemented.

## Tech and constraints

- Static HTML, CSS, and vanilla JavaScript.
- No backend, API server, login, or required paid service.
- Browser-local storage is used only for the theme preference at this stage.
- Learning progress storage, vocabulary import, grammar content, mastery scheduling, and backup/restore are not implemented yet.

## Run locally

Open index.html in a browser, or serve the repository root with any static development server.

## Deploy

The repository is designed for static deployment on Vercel. Import riiddev/testesaja into Vercel and use the default static setup; no build command is required for the current landing page.

## Planned sequence

1. Landing page and brand system.
2. Learning workspace frontend.
3. Verified vocabulary corpus and grammar lessons.
4. Local-first study history, mastery engine, spaced review, and backup/restore.
5. Content audit, accessibility checks, and regression tests.

**Data integrity rule:** only publish word counts, completion rates, and mastery metrics when they can be derived from real, validated content and saved learning records.
