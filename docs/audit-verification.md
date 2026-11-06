# Fase 0 — Verifikasi Audit Kode SINAUENGLISHV2

Tanggal: 6 November 2026  
Repository: riiddev/testesaja  
Branch: feat/neon-migration  
Base commit: e88c70517ff97ddcc1e1bd03cd9cf1965943e393  
Metode: GitHub source inspection + GitHub Actions log inspection. Fase 0 tidak mengubah source aplikasi.

> TERBUKTI pada GAS berarti bug ada pada handler legacy. Itu tidak otomatis membuktikan bahwa seluruh frontend masih memakainya; banyak aksi sekarang diarahkan ke Vercel Functions/Neon. Bedakan kode legacy dari jalur runtime yang aktif.

## 1. Ringkasan 19 temuan

| No | Status | Hasil |
|---:|---|---|
| 1 | **SEBAGIAN** | Mock success exists but only when DEV and VITE_ENABLE_MOCK=true; not automatic production fallback. |
| 2 | **TERBUKTI (legacy GAS)** | handleUpdateProfile writes XP/streak/coins from client payload. Vercel profile route is more restrictive. |
| 3 | **TERBUKTI (legacy GAS)** | handleClaimQuestReward trusts payload rewards and can create a claimed row with no proof of completion. |
| 4 | **SEBAGIAN** | Hook updateProgress is not used by Workspace/Missions; learningActivity directly updates server for a subset, not all types; server trusts client values. |
| 5 | **TIDAK TERBUKTI** | Persistent IndexedDB outbox exists, localStorage fallback exists, event removed after ACK. pagehide flush is still best-effort. |
| 6 | **SEBAGIAN** | GAS profile omits avatarUpdatedAt; Neon routes return it. Cross-device test not performed. |
| 7 | **TIDAK TERBUKTI** | Local cache exists but api.getInventory() is invoked and response populates state. |
| 8 | **TIDAK TERBUKTI** | totalReviewsDone is returned; no alleged hasStudyActivity mismatch found in current hook. |
| 9 | **TIDAK TERBUKTI** | daily quest local key includes user ID. |
| 10 | **TIDAK TERBUKTI** | ContextMatching accepts callback and WorkspacePage passes it. |
| 11 | **SEBAGIAN** | Two SRS implementations remain, but both use [1,3,8,16,30] and first success = 1 day. |
| 12 | **TIDAK TERBUKTI** | daily goal loads via getSettings and saves through updateSettings; save failure UX remains weak. |
| 13 | **TERBUKTI** | Reminder timer runs in active page; service worker lacks push/periodicSync listener. No working browser-closed reminder. |
| 14 | **TERBUKTI (legacy GAS)** | doPost grabs global ScriptLock before action dispatch, including reads. |
| 15 | **SEBAGIAN** | Buy/equip are server-first; avatar upload/delete optimistically mutate and may return success on server failure. |
| 16 | **TIDAK TERBUKTI in Workspace route** | ProfileView only creates internal hook if prop absent; WorkspacePage supplies shared hook. |
| 17 | **TIDAK TERBUKTI** | ProfileView uses ?? 0 for XP/coins/streak. |
| 18 | **TIDAK TERBUKTI** | Guest cache cleared only after successful registration response. |
| 19 | **SEBAGIAN** | GitHub Actions exists; test:all omits E2E; latest CI failed in logic test before build/API tests. |

## 2. Detail file:line and reproduction

### 1. src/services/api.js fallback
Location: src/services/api.js:12-18 and :220-350, plus handleDevFallback at end.
- IS_MOCK_ALLOWED requires import.meta.env.DEV and VITE_ENABLE_MOCK === "true".
- Core actions mapped to Vercel use requestApi directly.
- Remaining legacy actions use VITE_API_URL; missing URL/network failure throws NetworkError unless mock explicitly enabled.
- handleDevFallback returns success:true for several dev actions.
- Reproduce only on a dev build: set VITE_ENABLE_MOCK=true and omit legacy URL; then repeat with production build and verify mock unavailable. Never use production account/data.

### 2. backend/Code.gs handleUpdateProfile
Location: backend/Code.gs:642-698.
- Around lines 658-660 writes payload.xp, payload.streak, payload.coins directly.
- Around lines 672-674 creates new profile defaults XP=50, streak=1, coins=50.
- Proven for legacy Apps Script. api/profile/update.js Vercel route uses safe field allowlist and does not accept economy fields.
- Reproduce only against disposable GAS test copy, not the user's spreadsheet.

### 3. backend/Code.gs handleClaimQuestReward
Location: backend/Code.gs:1006-1068.
- Lines 1012-1013 read xpReward/coinsReward from client.
- If no row, around 1036-1038 append quest row with 1/1 and claimed=true.
- Later credits profile. Proven legacy code; no live sheet tests.

### 4. Daily quest progress
Location: src/hooks/useDailyQuests.js:77-110; src/pages/WorkspacePage.jsx:85-90; src/services/learningActivity.js:16-157; api/quests/update.js:24-75.
- Hook exposes updateProgress but WorkspacePage does not destructure it and MissionsView only consumes claimReward.
- learningActivity directly calls updateQuestProgress for matching, grammar, reading quiz/read complete and story; no vocabulary/SRS case.
- api/quests/update reads questId/progress/target from body and inserts/updates those values. Server does not derive them from verified activity.
- Some activities are wired, but not all. Partial.

### 5. Persistent outbox
Location: src/hooks/useProgressSync.js:15-23 and :145-170; src/services/outboxDb.js:22-190.
- IndexedDB outbox store has eventId key and userId index.
- removeConfirmedEvents removes only server-acknowledged events.
- localStorage fallback exists if IndexedDB is unavailable.
- visibilitychange/pagehide attempts flush but it is not a guarantee of network completion on close. Persistent outbox means the old "memory only" claim is false.
- Two-device/offline close/reopen runtime test has not been performed.

### 6. Avatar version
Location: backend/Code.gs:558-640; src/hooks/useUserProfile.js:177-200; api/profile/get.js:15-45; api/avatar/upload.js:75-88; api/avatar/get.js:20-45.
- GAS handleGetProfile omits avatarUpdatedAt; client has a branch that removes cached URL if remote timestamp is absent.
- Vercel profile GET returns profile row including avatarUpdatedAt; upload updates it and returns timestamp; avatar GET also returns timestamp.
- No live two-device test. Partial.

### 7. Inventory
Location: src/hooks/useUserProfile.js:56-62, :133-146.
- State may initialize from localStorage cache.
- Effect calls api.getProfile and api.getInventory; remote inventory replaces state/cache.
- Claim that API is never called is false.

### 8. totalReviewsDone
Location: src/hooks/useUserProfile.js:64-107.
- Local totalReviews is returned as totalReviewsDone.
- No hasStudyActivity property found in this hook.
- Alleged property mismatch is not supported by current code.

### 9. Quest cache namespace
Location: src/hooks/useDailyQuests.js:16-18.
- Storage key includes user ID (or guest) and date.
- Cross-account shared key not found.

### 10. Matching callback
Location: src/features/matching/ContextMatching.jsx:9, :96-101; src/pages/WorkspacePage.jsx:300-309.
- Component receives callback and invokes it after all pairs matched.
- WorkspacePage passes callback and records activityType matching.
- Alleged missing wiring is false.

### 11. SRS intervals
Location: src/hooks/useSpacedRepetition.js:7, :39-54; src/lib/mastery.ts:8, :88-123; tests/react-srs.test.mjs:22-55.
- Both declare [1,3,8,16,30].
- Both calculate index 0 for the first correct review, hence 1 day.
- React SRS tests expect 1,3,8,16,30.
- No first-interval bug found in current logic. Two distinct implementations/data models remain, so unification still needs audit. Partial.

### 12. Daily goal
Location: src/features/settings/SettingsPanel.jsx:23-53.
- State initializes at 10.
- Settings are fetched through api.getSettings and saved with api.updateSettings.
- Error path only console.error; no clear rollback/status. Allegation of no server persistence is false.

### 13. Notifications
Location: src/hooks/usePWA.js:96-130, :143-168, :170-230; public/sw.js.
- setInterval checks schedule every 20s in active page context.
- Service worker can display a notification when explicitly triggered by page.
- Service worker has no push event listener or periodicSync handler.
- Closing browser stops the timer. Background reminders while closed are not implemented.

### 14. GAS global lock
Location: backend/Code.gs:41-48, :50-159.
- doPost obtains ScriptLock/waitLock before parsing dispatch action.
- Read and write POST actions pass through same exclusive lock.
- Proven for GAS legacy only.

### 15. Optimistic avatar operations
Location: src/hooks/useUserProfile.js:293-344, :345-410, :412-445.
- Buy/equip call server before applying main state updates.
- Avatar upload updates UI/local cache first; catch returns success:true with warning.
- Avatar delete clears local cache first; catch only logs; function returns success:true.
- Partial.

### 16. Duplicate ProfileView hook
Location: src/features/profile/ProfileView.jsx:12-21; src/pages/WorkspacePage.jsx:399-407.
- ProfileView creates hook only when userProfileHook prop is absent.
- WorkspacePage passes the already-created hook.
- Not proven on Workspace route. Other callers without prop may create internal hook.

### 17. Zero fallback
Location: src/features/profile/ProfileView.jsx:341, :357, :370.
- XP/coins use nullish coalescing to zero; streak uses ?? 0.
- 0 remains 0.

### 18. Guest data and signup
Location: src/hooks/useAuth.jsx:79-90.
- api.register runs first.
- clearLocalUserCache runs only after res.success and res.data.user.
- No pre-confirmation guest data deletion found.

### 19. CI/test coverage
Location: package.json; .github/workflows/ci.yml:1-44; Actions run 42197332325.
- A GitHub Actions workflow exists.
- It runs npm test, npm run test:logic, build, and API tests behind DATABASE_URL condition.
- npm test runs content audit + react SRS. test:logic is a separate step.
- test:all does not include test:e2e.
- Latest run failed in test:logic; build and API/security steps were skipped.
- So "no CI" is false; coverage/run health is insufficient.

## 3. Additional verified findings

### P1: Client-forgeable quest progress and unknown quest reward
Files: api/quests/update.js:24-75; api/quests/claim.js:50-112.
- update endpoint trusts client questId/progress/target and inserts a new row if absent.
- claim endpoint only checks row completion.
- Reward lookup falls back to 35 XP/15 coins for arbitrary unknown questId.
- Authenticated user could potentially write progress=1,target=1 for arbitrary questId and claim fallback reward.
- Static evidence proves unsafe validation boundary. Dynamic exploit must only be tested on development database after approval.

### False success: Learning activity service
File: src/services/learningActivity.js:27-33 and :149-154.
- Result begins success=true.
- Catch records error but never changes success to false. Caller can treat failed request as success.

### False success: MissionsView claim
File: src/features/missions/MissionsView.jsx:21-25.
- claimReward is not awaited.
- UI immediately announces successful reward before server response.

### False success: Avatar
File: src/hooks/useUserProfile.js:293-344.
- Avatar upload/delete mutate local state first and report success even on API failure.

### HABIT reading completion / quiz mismatch
Files: src/features/reading/ReadingLibrary.jsx:177-200; src/features/reading/ReadingQuizRunner.jsx:48-76; src/services/learningActivity.js:103-118; api/reward/grant.js:31-90; api/reading-quiz/record.js.
- "Selesai Membaca" only closes passage selection; handler does not record completion/reward.
- ReadingQuizRunner calls claimReward with source article_quiz and timestamped event id.
- api/reward/grant accepts reading_quiz_complete, not article_quiz; this source is not recognized.
- A separate api/reading-quiz/record endpoint uses deterministic article event and records attempts; learningActivity has a case for that endpoint, but inspected runner calls claimReward instead.
- This breaks intended reading reward/history path and affects missions/history.

### Achievement unlock not validated server-side
File: api/titles/unlock.js:20-45; src/hooks/useUserProfile.js:64-107.
- Client derives several title progress values from progressMap/localStorage.
- API unlock only validates titleId presence and deduplicates per current user; it does not check server achievement criteria.

### Duplicate setupDatabase
Files: backend/Code.gs:1180; backend/setup.gs:8.
- Two global functions with same name in Apps Script source. Must reconcile before legacy retirement.

### GAS jsonResponse ignores HTTP status
File: backend/Code.gs:1169-1173.
- statusCode parameter is not used; function only creates JSON TextOutput and sets MIME type.
- GAS responses may arrive HTTP 200 even for body-level failure. This is legacy GAS; Vercel helper is separate.

### Ledger operations not grouped as one transaction
File: api/_lib/ledger.js:21-95.
- Idempotency check, transaction insert and profile update are separate DB queries without explicit transaction wrapping the entire operation.
- Unique event constraint helps duplicate prevention, but races/partial failure need testing before describing the operation as atomic.

### Non-portable reminder test
File: scripts/test-reminder-notification.mjs:1-7.
- Playwright import and screenshot output use machine-specific absolute Windows paths; not portable to Linux CI.

### Browser-local quest date
File: src/hooks/useDailyQuests.js:8-15 and reset countdown logic.
- Client computes today/midnight from device local timezone while server uses Asia/Jakarta. Potential mismatch outside WIB devices; server must remain source of truth.

## 4. Additional user-reported areas B-F

### B. Progress/EXP/coins not recorded
**Status: PARTIAL; code-level causes found, live environment/DB unverified.**
- Many core routes already map to Vercel Functions.
- Mock is gated to development + explicit VITE_ENABLE_MOCK=true; not automatic in production.
- learningActivity false success, MissionsView false success, avatar false success.
- HABIT quiz uses unrecognized reward source.
- Cannot inspect Vercel env presence, production SHA, runtime logs or Neon rows from public repo. Do not request secret values. User can report only if expected variables are configured.
- No preview learning event was run; no progress_events/transactions/profiles row or balance before/after is available.

### C. Quest progress
**Status: PARTIAL, with P1 security issue.**
- Activity dispatcher only updates subset; vocabulary/SRS not mapped.
- Client hook updates local state then sends API; errors swallowed.
- API accepts client progress/target and can insert arbitrary quest row.
- No dynamic tests against development Neon performed.

### D. Achievement
**Status: PARTIAL.**
- useUserProfile computes several stats using local progressMap and localStorage histories.
- Some user_stats exist and some server endpoints update counters, but not all modules are connected.
- titles/unlock endpoint does not validate qualifying stats server-side.
- Cross-device verification not performed.

### E. Avatar
**Status: PARTIAL.**
- GAS profile misses timestamp and frontend can clear cache.
- Neon profile/avatar routes return timestamp.
- Upload/delete false-success remain.
- No two-browser test performed.

### F. History
**Status: PARTIAL.**
- PracticeHistoryView has filters, 7-day summary, cursor paging and API calls.
- API scopes query using session user and joins attemptDetails, but selects wrongItems only.
- Matching and reading quiz routes write activityLog; coverage for SRS/grammar/story is not consistently proven.
- All answer/explanation detail is not proven for every module.
- Implementation stays in Fases 4-6.

## 5. CI evidence

Actions run: 42197332325  
Workflow: SinauEnglish V2 CI  
Commit: e88c70517ff97ddcc1e1bd03cd9cf1965943e393 (main)  
Observed: 6 Nov 2026 around 16:44 WIB  
Conclusion: FAILURE.

Step results:
- npm ci: passed.
- npm test: passed. Data report: Oxford 2,971; starter vocabulary 999; grammar 19 lessons / 57 questions; HABIT 156 passages / 63,309 words; reading skills 12; stories 8; dialogues 4; listening 8; pronunciation 16; data parity 100%; React SRS tests 3/3.
- npm run test:logic: failed at tests/logic.test.mjs:20. Fixture first review date is 2026-11-04T12:00Z, but workflow is 2026-11-06; nextReviewAt is already due, so actual "due" differs from expected "learning". Likely test-clock fixture mismatch; no fix in Fase0.
- Vite build: skipped.
- API/security tests: skipped on this run.
- npm ci reported 4 moderate npm audit advisories; package details not audited yet.
No local test rerun was performed in this session; only the actual Actions run was inspected.

## 6. Google Sheets account/row counts
**Not verified.** User said they will count and provide counts. No Sheets read access connected. Do not request credentials, Spreadsheet ID, or service-account key. Do not invent row counts.

## 7. Vercel Preview and Neon row evidence
**Not verified.** .env.example does not prove dashboard variables are present. No Vercel secrets were read. No approved Preview transaction executed and no Neon rows inspected. Cannot claim any row was written or provide XP/coins before/after. Later safe process: user checks whether variables are configured in Vercel Dashboard → Project → Settings → Environment Variables, reports presence only; then perform a Preview exercise and inspect redacted DB query results.

## 8. Fase 0 summary

| Area | Status |
|---|---|
| 19 static findings | Classified against branch source |
| Additional findings | P1 quest exploit + false-success paths recorded |
| B progress/XP/coins | Partial; actual deployment/env/DB not verified |
| C quest progress | Partial; incomplete mapping and client-controlled API |
| D achievements | Partial; no complete server-authoritative criteria |
| E avatar | Partial; legacy vs Neon differences and false success |
| F history | Partial; UI/API exists but coverage/details incomplete |
| setupDatabase/jsonResponse | Proven in legacy GAS |
| Sheets account/row counts | Await user count |
| Vercel Preview env/Neon rows | Unverified |
| App source code changed | No |

## 9. Fase 0 boundary
- No app source changes during Fase 0.
- Do not alter Neon production, Vercel production env, Apps Script deployment, Sheets or Drive.
- Do not merge old branches or PR to main.
- Do not start Fase 1 or later phases before user approves this report.
- Stability gate is NOT open.
