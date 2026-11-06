# SINAUENGLISHV2 Neon Migration Plan

Repository: riiddev/testesaja
Branch: feat/neon-migration
Base: main at e88c70517ff97ddcc1e1bd03cd9cf1965943e393 (6 Nov 2026)

This is the operational checklist consolidating the user requirements. The uploaded roadmap addendum is included in the full plan below in summarized form; the source addendum remains available in the conversation attachment. This is not a byte-for-byte transcript of the long main chat message. The conversation remains authoritative if there is any wording ambiguity.

IMPORTANT: old documents on main claimed Fases 1-10 were completed, but those claims are not accepted as evidence. Their statuses are reset here. Only tasks marked complete below have current-session evidence.

## Decisions
- Neon PostgreSQL Free is the target database; Vercel Functions in api/ are the backend; React 19 + Vite stays.
- Cost target Rp0.
- Branch feat/neon-migration only. main must not be edited.
- User approved option A: use latest main as baseline; do not merge old branches.
- Keep Google Sheets, Apps Script and Drive until all data/features are migrated and verified.
- Preview only until release checklist and user approval.
- One phase, one commit, report, then wait for approval.

## Mandatory rules
1. Never ask the user to paste DATABASE_URL, tokens, passwords, private keys or other secrets into chat. Use environment variables. Keep .env and .env.* in .gitignore except .env.example. Give exact Neon/Vercel dashboard steps; the user enters secret values there.
2. Server is source of truth. Client cannot set XP, coins, streak, prices, rewards, inventory ownership or user_id. Resolve user_id from authenticated session on server and scope every personal query by it.
3. UI must never claim saved/success/reward/purchase/claim before server confirmation. Show failures; console.warn alone is insufficient.
4. Preserve existing working features and design during backend migration. UI redesign exceptions: History, Profile/Achievements, content total badges/mission alert, requested responsive/notif work, Android widget.
5. New accounts start at zero for progress, achievements, XP, coins, streak, inventory, titles and learning records. No fake default values.
6. Verify current official Neon Free limits in Fase 1. User-provided reference: 1 GB storage, autoscale to 2 CU, 100 compute hours, 10 branches. Keep data compact, no large blobs, no unnecessary database pings. Verify whether development branch deltas count against project storage.
7. Be honest about failures and unverified claims. Do not invent tests, screenshots, database rows or success.
8. Do not ask for Google credentials. User will count Google Sheets accounts/rows. CSV exports are supplied locally under a gitignored folder for Fase 7; never commit, log or send emails/password hashes to chat.
9. No production changes, production cutover, Apps Script shutdown, PR merge or main changes without explicit user approval.
10. Read this document again at the start of each phase. Check boxes only with evidence.

## Stability gate
No new features until all engines work without bugs: authentication, sync, progress, SRS, EXP/coins, quests, achievements, history, profile/avatar, inventory, matching, grammar, HABIT reading, stories and basic notifications.

### Part 1: Stabilization Fases 0-9
Also includes two bug-fix efforts:
- 1A HABIT audit: text rendering/format, completion marker, quiz button, one-time reward, reading progress, mobile, empty/broken articles, data consistency. List bug + file:line + reproduction; fix proven bugs; automated render/non-empty test every article and manual samples.
- 1B responsive audit at 320, 360, 390, 412, 600, 768, 1024, 1280, 1536, 1920 px, portrait and landscape, safe areas, OS text zoom 200%, tap targets >=44x44, no horizontal scroll/clipping/overlap. Playwright screenshots at key widths, before/after.

### Gate requirements for Part 2
All required simultaneously:
- npm run test:all fully passes and CI is green.
- Fase 8 security and two-device tests pass.
- No known P0/P1 bugs; all items A-I pass.
- User has used app for at least 7 real days with no data loss.
- User explicitly writes GERBANG DIBUKA.
Without that exact phrase, do not start any Part 2 phase or its small tasks.

## Fase 0: verify audit findings, no source changes
Classify every finding TERBUKTI / TIDAK TERBUKTI / SEBAGIAN with file:line and safe reproduction.

1. src/services/api.js handleDevFallback: empty API URL, network failure, timeout, 401/403/302, unknown action, session error; distinguish development mock from production.
2. backend/Code.gs handleUpdateProfile accepting client XP/streak/coins.
3. backend/Code.gs handleClaimQuestReward trusting client rewards, no completion/double-claim check, creates completed rows.
4. useDailyQuests.updateProgress call sites across Workspace/Missions and learning modules.
5. useProgressSync memory queue vs IndexedDB/outbox, ACK and close-tab flush.
6. Avatar version field/avatarUpdatedAt and stale cache invalidation; distinguish GAS vs Neon; service worker.
7. Inventory localStorage vs api.getInventory.
8. totalReviewsDone/totalReviews/hasStudyActivity mismatch and possible profile reset.
9. daily quest storage key user namespace.
10. ContextMatching callback wiring.
11. SRS implementations, first interval and test expectations.
12. daily goal getSettings/updateSettings persistence.
13. notification timer vs service worker push/periodicsync; browser-closed claims.
14. GAS doPost global waitLock on reads and writes.
15. optimistic profile/economy/avatar actions and false success after failures.
16. duplicate useUserProfile hook in ProfileView.
17. zero fallback using || versus ??.
18. guest data cleared before/after server confirms registration.
19. npm test/test:all/CI coverage of content, logic, API/integration, E2E and GitHub Actions.

Also inspect duplicate setupDatabase() in backend/Code.gs and backend/setup.gs, jsonResponse status handling, other security/data integrity issues, plus Google Sheets account/row count. User will provide the counts; do not ask for credentials or invent numbers.

Additional B-F:
- B Progress/XP/coins: inspect actual API route map, VITE_API_URL, production mock behavior, demo accounts, hidden errors and database evidence. .env.example does not prove Vercel env presence. If user must check, ask only whether envs are present in Vercel, never values. Later add honest UI sync states: Saved, Pending sync (N), Failed/retrying. After migration prove progress_events/transactions/profiles rows and before/after balances.
- C Quests: map vocabulary, SRS, grammar, quizzes, matching, reading, stories to quest types. Fase 0 audit only. Implementation in Fases 4-6; server counts real recorded activities; test each type after reload and across devices.
- D Achievements: audit counters/targets/unlock/rewards server vs client. Final state server-derived and idempotent.
- E Avatar cross-device: inspect cache/version, SW cache, avatar_updated_at and two browsers. Don't claim physical testing without evidence.
- F History: Fase 0 audits existing history only; future implementation in Fases 4-6 with permanent activity_log, attempt_details JSONB 90 days, cursor paging, filters, 7-day summary, question-level answer/explanation detail, wrong-answer review and Kanci empty state.
Write Fase 0 results to docs/audit-verification.md. Do not change app source.

## Fase 1: architecture and decisions (approval required)
Read latest official Neon, Neon Auth/Better Auth and Vercel Functions docs. Write docs/architecture-neon.md covering:
1. Neon Auth/Managed Better Auth vs Better Auth OSS on Vercel+Neon vs safe/free alternative; current free limits, pros/cons/recommendation. Do not write custom password hashing if proven solution exists.
2. Driver/ORM e.g. @neondatabase/serverless + Drizzle and versioned schema migration.
3. Avatar: small PostgreSQL bytea (128-256 px WebP, strict size) vs Vercel Blob free tier; storage calculation.
4. Compact schema: profiles, progress, progress_events, grammar_progress, daily_quests, quest_claims, story_progress, reading_quiz_attempts, matching_attempts, settings, catalog, inventory, titles, transactions, avatars, with user_stats/activity_log/attempt_details as needed. UNIQUE(user_id,event_id), CHECK coins>=0, server reward config, WIB dates.
5. Sheets data/password plan: migrate old hashes + verify/rehash at first login or re-signup if accounts are test-only, based on user's counts.
6. Cold-start UI skeleton, clear timeout/messages, limited retries and fewer initial requests.
7. Independent pg_dump backup plan due to limited Neon Free recovery.
Wait for approval before Fase 2.

## Fase 2: Neon + Vercel setup
Give exact user steps to create Neon project in Singapore, development branch, pooled connection, and Vercel Preview envs. User enters secrets. Prepare schema migration, catalog seed, .env.example, and safe connection check script that never prints secrets.

## Fase 3: Auth and core API
1. Login/register/logout/getMe/session in Vercel Functions per Fase 1, with login rate limit.
2. Remove production fake fallback. Mock only with VITE_ENABLE_MOCK=true in development plus visible MODE SIMULASI banner; production ignores it.
3. Structured SUCCESS/AUTH_ERROR/NETWORK_ERROR/VALIDATION_ERROR and correct HTTP status. Network errors never count as success.
4. Unauthenticated users go to signup; all features require account.

## Fase 4: server economy/rewards
1. updateProfile whitelist only safe fields (display_name, unlocked active_title, avatar); no XP/coins/streak writes.
2. XP/coins only via server transaction ledger with unique event_id, valid source and daily caps; reward amounts on server.
3. Server validates quest belongs to user and WIB day, target reached from recorded activity and not previously claimed.
4. Purchase validates balance, server catalog price, level, ownership in one DB transaction. Failure changes neither balance nor inventory.
5. Streak server-calculated by WIB date.
6. A HABIT: reading reward once/article/account, deterministic reading:<article_id>:first_complete plus UNIQUE(user_id,event_id). Rereading allowed with clear no-more-reward UI. Quiz reward also once/article. Test repeated read/quiz and single transaction row.

## Fase 5: offline-first sync
1. Persistent IndexedDB outbox per user, unique event_id.
2. Batch to server; remove only after ACK. beforeunload not guaranteed; keepalive/sendBeacon best-effort only.
3. Server idempotent for same event and two devices.
4. Cache keys namespaced by user_id and cleared on logout/account switch. Browser is cache/outbox, not source of balances or inventory.

## Fase 6: migrate every engine and stabilize
Migrate profile/avatar/inventory/titles/settings/daily goal/quests/matching/grammar/reading quiz/stories/SRS/stats.
- Central src/services/learningActivity.js connects completed learning activity to missions; only emit after activity succeeds; server calculates mission progress.
- Connect matching recording.
- Unify profile hook instance.
- Use ?? for meaningful zero values.
- Keep guest data until server confirms registration.
- Unify SRS; ask user desired interval (proposal first correct=1 day) then update tests.
- No browser-closed notification promises until push works.

F History UI:
- Sidebar History page; group by day; filters vocabulary, SRS, grammar, article quiz, matching, stories and date range.
- Each row type/title/score/accuracy/duration/EXP/coins.
- Details per quiz/matching: questions, user's answers, correct answers, explanation; SRS words/outcomes; reading question categories; story episode.
- Latih lagi yang salah adds errors to Review SRS.
- 7-day summary + accuracy/category.
- activity_log permanent and attempt_details JSONB retained 90 days; cursor paging; Kanci empty state.

G Profile/Achievements UI:
- Original V2 profile: identity card photo/border/title/name/level, XP-to-next-level, personal XP/coins/streak/words mastered per level, achievements, latest activity link to History, account settings.
- Achievement categories vocabulary/streak/reading/grammar/matching/story/collection; 3 tiers, bars, locked/in-progress/completed/claimable, detail conditions/progress/date/reward, category/status filters; meaningful claim animation and reduced motion.
- All figures from server; zero stays zero using ??.

H Remove content totals and mission badge:
- Remove content totals in dashboard/sidebar (2971/2947/19/156 and similar data-derived values); search only rendered UI strings and .length used as displayed totals. Keep exercise counters/timers and personal stats.
- Mission badge number 3 becomes danger-token red circle !, only if at least one today mission unfinished, hidden if complete or not loaded; aria-label "Ada misi yang belum selesai".
- Server/WIB computes unfinished status.

I Cross-device:
Every A-H must pass first-time, reload, logout/login and another device. Cache namespaced by user ID and cleared on logout.

## Fase 7: data migration
Read-only Sheets export to Neon development. Dry run first, per-table counts before/after, random per-account sample. Never delete Sheets. Skip only if Fase0 says test-only and user agrees. User CSV stays in gitignored local folder; never print/commit emails or password hashes. No real migration until user approves counts and password approach.

## Fase 8: test and CI
1. npm run test:all includes content, logic, API integration and E2E; free GitHub Actions on each branch push.
2. Security: wrong login denied, backend-down creates no demo account, fake XP/coins denied, incomplete quest claim denied, double claim once, insufficient-balance purchase denied, cross-user isolation, expired token asks login again, duplicate event_id no double reward.
3. Two profiles/devices: same data; offline close/reopen; outbox sent once.
4. Each feature first-time/reload/logout-login/other device at 360/768/1280 px.
5. New account zero in every feature.

## Fase 9: production (only with approval)
Separate production DB/branch and cutover plan; keep Apps Script until verified. Independent backup, operational README, Neon/Vercel quota guide. PR to main only after checklist passes; user alone decides merge.

## Fase 10: Android home-screen widget
After stability; Android device; native home-screen widget, not website component; Rp0; sideload APK, no Play Store unless requested.
- J1 verify current official Chrome Android/Android/Capacitor/App Widgets docs; PWA alone may not create native widgets; do not invent.
- J2 free stage: manifest shortcuts "Misi Hari Ini", "Review (SRS)", "Riwayat" deep links; Badging API only if supported; badge when unfinished and clear when done; user tests on phone/screenshot.
- J3 native only after separate plan approval: Capacitor android folder, bundled build vs URL, update impact, Android Studio, APK build, USB debugging, install. Kotlin App Widget 2x2/4x2, mission count x/3, streak, continue button, !. Read-only /api/widget/summary; scoped widget token not full session; EncryptedSharedPreferences; revoke on logout/server. WorkManager refresh limits verified in docs, manual refresh, cached timestamp offline, no real-time promises. Keystore/signing secrets never commit; .gitignore and docs/android-widget.md.
- Mockup approval first: small = mission x/3 + streak; medium = missions + Lanjut belajar; large = mission/streak/today priorities if Fase16 exists. Map container/Box, Row, Stack to Jetpack Glance Box/Row/Column.

## Fase 11: refinement (after Fase10 or earlier only if user asks)
a. Mobile audit at 320/360/390/768 with before/after screenshots.
b. Root-cause reminders not appearing; no browser-closed promise before real push.
c. Heads-up only where Android/Chrome allow; settings test-notification button and guide.

## Part 2: phases only after GERBANG DIBUKA

### Fase 12 Email/password reset
Research latest official free transactional email constraints (arbitrary recipients, verified domain/sender, quotas, spam risks); compare Apps Script MailApp via protected endpoint and alternatives; recommend and wait. Forgot endpoint always returns same neutral response regardless of email existence. Random one-time token stored hashed, TTL 30-60 minutes, email/IP rate limits. Reset validates token, changes password, revokes all sessions and widget/push tokens, sends password-change notification. Align Better Auth; test expired/reused/other-account/unknown email/rate limits. Email verification only with user's agreement.

### Fase 13 Delete account + privacy policy
Delete requires password re-confirmation and clear warning; JSON export offered; propose cancellable 7-day grace period and wait. Delete every user row across profiles/progress/history/transactions/inventory/titles/settings/avatar/sessions/widget tokens/push subscriptions/mailbox. Test no remaining user_id rows. Document backup copy retention/rotation. Indonesian privacy policy only from actual app code: collected data/purpose/storage and Neon/Vercel/email vendors/retention/rights/contact supplied by user/minors/effective date. No copied text or false claims; not legal advice; recommend UU PDP review.

### Fase 14 Mailbox
Header/sidebar unread badge; global release announcements stored once with per-user read table; personal inbox_messages per user. Markdown content/changelog/YYYY-MM-DD.md synced to announcements at deploy. Categories/filter/read-unread/delete/deep link/cursor/Kanci empty state/90-day personal retention. Server-computed cross-device badge.

### Fase 15 in-app and push
In-app toast/banner plus mailbox. Web Push VAPID through Vercel Functions; per-device subscriptions and cleanup on failure/logout; polite permission, per-kind preferences, Test Notification. Verify Vercel Hobby cron current limits and timing drift; offer free external scheduler such as GitHub Actions and explain delay/reliability. Avoid waking Neon frequently; few fixed WIB slots, lightweight query and batches; estimate Neon CU hours/Vercel use. Never promise unsupported heads-up; Android/Chrome controls it. At most one concrete reminder/day; respect quiet hours.

### Fase 16 Smart analysis
Deterministic own activity data, no paid AI/third-party tracker: skill accuracy (vocab/grammar/reading General/Specific/Implied/Vocabulary in Context/matching), weak words/topics, SRS forgetting, active days/time, weekly rate, recurring confusions. CEFR only labeled estimate above minimum data; else "Data belum cukup". Analysis charts with explanations. 3-5 ranked priorities with reason/minutes/deep link, daily update integrated with quest generation. Server from activity_log/user_stats, light cached query.

### Fase 17 weekly report
Weekly WIB report of active days, XP, new/reviewed words, accuracy, strongest/weakest categories, streak, quests/achievements, prior-week comparison, three next priorities. Mailbox plus optional email opt-in using Fase12 service; archive. Batch within Fase15 constraints; no-activity user receives brief message.

### Fase 18 footer
Landing and settings footer GitHub https://github.com/riiddev (verify) + Instagram username only when user supplies it; until then constant in src/config/social.js, never guess. Open new tab with noopener noreferrer, accessible labels/contrast/responsive; link Privacy Policy.

### Fase 19 Android widget detailed follow-up
Follow Fase10 verification, shortcuts/badge, native Capacitor, restricted token and sideload. Mockups first. Small mission x/3 and streak; medium quest list + Lanjut belajar; large mission/streak/priorities if Fase16 exists. Jetpack Glance Box/Row/Column mapping.

### Fase 20 add 5,000 vocabulary (last)
Propose lawful sources/licenses for frequency/CEFR; do not copy copyrighted material; existing American Oxford 3000 unchanged; await approval. Fields: stable word_id, word, POS, IPA, Indonesian meaning, example + translation, level. Deduplicate/normalize; generated content marked needs review; uncertain IPA/meaning marked verify. Batch 500; show 30 random sample words, duplicates/problem list; wait approval each batch. Static frontend JSON chunks lazy loaded/indexed; DB only progress; measure bundle/mobile load; old word progress unchanged; test vocabulary/SRS/matching/quiz/missions.

## Report format
Each phase: (a) status, (b) exact files changed, (c) evidence including tests/screenshots/database rows only if real, (d) user decisions, (e) unverified items. One commit per phase. Do not trust old completion claims.

## Fase 0 tracking
- [x] Repo/default branch checked.
- [x] Main SHA recorded.
- [x] feat/neon-migration created from exact main SHA.
- [x] User approved option A; no old branches merged.
- [x] Static audit and CI logs reviewed.
- [ ] User provides own Google Sheets account/row count.
- [ ] User safely checks Vercel Preview variables presence; no values shared.
- [ ] Actual Preview database transaction/rows verified.
- [ ] User approves Fase 0 report.

STOP after Fase0. Fase1 requires explicit approval.
