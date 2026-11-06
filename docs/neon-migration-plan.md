# Pelan Migrasi SINAUENGLISHV2 ke Neon PostgreSQL + Vercel Functions (feat/neon-migration)

Dokumen ini adalah salinan utuh rencana kerja dan panduan operasional migrasi sesuai instruksi teknis.
Setiap butir akan dibaca ulang di awal setiap fase dan diberi tanda centang `[x]` saat selesai.

---

## PERAN
Senior full-stack engineer (security-minded). Repo SINAUENGLISHV2 (React 19 + Vite, saat ini backend Google Apps Script + Google Sheets + Drive). Branch `feat/neon-migration`. JANGAN menyentuh `main`. Kerjakan BERTAHAP: selesaikan satu fase, laporkan, tunggu persetujuan. Commit per fase.

## KEPUTUSAN YANG SUDAH DIAMBIL
- [ ] Database utama pindah ke Neon PostgreSQL paket Free. Backend/API lewat Vercel Functions (folder `api/`). Frontend React+Vite dipertahankan. Biaya target Rp0.
- [ ] Google Sheets/Apps Script TIDAK dimatikan atau dihapus sampai semua data dan fitur terbukti pindah dan lolos tes.
- [ ] Semua perubahan diuji di preview (Vercel preview + branch Neon). Production tidak disentuh sebelum checklist lulus.

## ATURAN UMUM
- [ ] Jangan pernah meminta secret (DATABASE_URL, token, password) ke chat. Pakai environment variable; sediakan `.env.example` tanpa nilai asli; pastikan `.env*` ada di `.gitignore`. Beri langkah persis kapan dan di mana mengisi variabel di dashboard Vercel/Neon.
- [ ] Server adalah sumber kebenaran. Client tidak boleh menentukan nilai XP, coins, streak, harga, atau hadiah. user_id selalu diambil dari sesi di server, bukan dari body request. Semua query dibatasi oleh user_id.
- [ ] Jangan menyatakan sesuatu "berhasil" di UI sebelum server mengonfirmasi. Kegagalan harus terlihat di UI.
- [ ] Pertahankan semua fitur yang berjalan dan tampilan yang ada. Jangan mengubah desain saat migrasi backend (kecuali pengecualian di Koreksi & Tambahan #1).
- [ ] Akun baru harus mulai dari NOL untuk semua progres, pencapaian, XP, coins, streak, inventory, dan data lain (tidak ada progres sekecil apa pun, tidak ada angka default palsu).
- [ ] Batas Neon Free: ikuti batas yang tertulis di halaman harga Neon saat ini (penyimpanan 1 GB storage, Autoscaling to 2 CU, 100 compute hours, 10 branches). Rancang data ringkas, hindari menyimpan file/gambar besar di database, dan jangan membuat ping terus-menerus agar database tidak tidur.
- [ ] Jika ada langkah gagal atau tidak mungkin, laporkan jujur dan beri alternatif. Jangan mengarang hasil.

---

## FASE 0 — VERIFIKASI TEMUAN AUDIT (TANPA MENGUBAH KODE)
Status: **SELESAI (TERVERIFIKASI SEMUA DI DOCS/AUDIT-VERIFICATION.MD)**
Berikut temuan dari audit AI lain (tinjauan statis, belum terbukti). Untuk TIAP temuan tentukan: TERBUKTI / TIDAK TERBUKTI / SEBAGIAN, sertakan file:baris dan cara reproduksinya. Tulis hasilnya di `docs/audit-verification.md`.

- [x] 1. `src/services/api.js`: `handleDevFallback()` mengembalikan `success:true` (login, register, getMe, syncProgress, update profil, klaim hadiah) saat URL backend kosong, koneksi gagal, timeout, 401/403/302, action tak dikenal, atau error sesi.
- [x] 2. `backend/Code.gs` `handleUpdateProfile()`: menerima `payload.xp`, `streak`, `coins` dari client dan langsung menyimpannya.
- [x] 3. `backend/Code.gs` `handleClaimQuestReward()`: memakai `payload.xpReward`/`coinsReward` dari client, tidak memvalidasi misi/progres/klaim ganda, bisa membuat baris quest baru berstatus selesai.
- [x] 4. `useDailyQuests.updateProgress()` tidak dipanggil dari aktivitas belajar (MissionsView/WorkspacePage), sehingga progres misi tidak bertambah.
- [x] 5. `useProgressSync.js`: antrean pending hanya di memori (`pendingQueueRef`), flush di beforeunload tidak dijamin selesai, tidak ada antrean permanen.
- [x] 6. Avatar: backend menyimpan `avatar_updated_at` tapi `handleGetProfile()` tidak mengembalikan `avatarUpdatedAt`; frontend menghapus cache avatar saat nilainya tidak ada, sehingga foto hilang setelah reload.
- [x] 7. `useUserProfile.js`: inventory dimuat dari localStorage (`"sinau_local_inventory"`), `api.getInventory()` tidak dipanggil.
- [x] 8. `useUserProfile.js`: ketidaksesuaian nama properti `totalReviewsDone` vs `totalReviews` membuat `hasStudyActivity` salah, sehingga xp/streak/coins cloud bisa tertimpa 0.
- [x] 9. `useDailyQuests.js`: key penyimpanan lokal tidak memuat user ID (`sinau_daily_quests_<tanggal>`), data antarakun bisa tercampur.
- [x] 10. `ContextMatching` tidak menerima callback `onRecordMatchComplete` dari WorkspacePage, penyelesaian sesi tidak tercatat.
- [x] 11. `useSpacedRepetition.js`: interval pertama `[1,3,8,16,30]` terlewat (keberhasilan pertama memakai 3 hari); `src/lib/mastery.ts` punya perhitungan berbeda; tes mengharapkan 3 hari. Ada dua implementasi SRS.
- [x] 12. `SettingsPanel`: target belajar harian hanya state lokal (`useState(10)`), tidak disimpan ke getSettings/updateSettings.
- [x] 13. Notifikasi: hanya `setInterval` 20 detik saat aplikasi berjalan, tidak ada push/periodicsync di service worker, padahal Settings menjanjikan notifikasi saat browser ditutup.
- [x] 14. `backend/Code.gs` `doPost()`: `lock.waitLock(...)` global untuk semua request, termasuk baca.
- [x] 15. `useUserProfile.js`: pembelian item/equip/klaim/avatar/profil diterapkan lokal dulu; saat server gagal hanya `console.warn`, dan beli item tetap return `success:true`.
- [x] 16. `ProfileView` membuat instance `useUserProfile` kedua padahal sudah menerima dari WorkspacePage.
- [x] 17. `ProfileView` memakai `profile.xp || 50`, `coins || 50`, `streak || 1` (nol dianggap kosong).
- [x] 18. `useAuth.jsx`: data lokal tamu dihapus sebelum registrasi dikonfirmasi server.
- [x] 19. `npm test` hanya menjalankan `test:content` dan `react-srs.test`; logic dan e2e tidak masuk; tidak ada GitHub Actions.
- [x] Temuan tambahan: dua definisi `setupDatabase()` di `backend/Code.gs` dan `backend/setup.gs`, `jsonResponse` yang tidak benar-benar mengatur HTTP status.
- [x] Verifikasi Butir B: Akar masalah progres/EXP/koin tidak tercatat di akun.
- [x] Verifikasi Butir C: Progres misi tidak bertambah di modul belajar.
- [x] Verifikasi Butir D: Achievement tidak bergerak.
- [x] Verifikasi Butir E: Foto profil tidak berganti di perangkat lain.
- [x] Verifikasi Butir F: Audit riwayat latihan yang ada saat ini.
- [x] Verifikasi Kuota Neon: Apakah data branch development dihitung dalam batas kuota 1 GB storage Neon.

---

## FASE 1 — ARSITEKTUR DAN KEPUTUSAN (TUNGGU PERSETUJUAN SAYA)
Status: **DOKUMEN DIAJUKAN DI DOCS/ARCHITECTURE-NEON.MD (MENUNGGU PERSETUJUAN)**
- [x] 1. Opsi login: perbandingan Neon Auth / Managed Better Auth vs Better Auth open-source di Vercel Functions vs alternatif. Kelebihan, kekurangan, batas gratis, rekomendasi.
- [x] 2. Driver/ORM: usulan (@neondatabase/serverless + Drizzle) dengan alasan dan cara migrasi skema.
- [x] 3. Penyimpanan foto profil: bandingkan bytea Postgres vs Vercel Blob free tier dengan perhitungan batas kuota.
- [x] 4. Skema PostgreSQL ringkas: profiles, progress, progress_events, grammar_progress, daily_quests + quest_claims, story_progress, reading_quiz_attempts, matching_attempts, settings, catalog, inventory, titles, transactions, avatars, user_stats, activity_log, attempt_details. Idempotensi, CHECK constraints, zona waktu Asia/Jakarta (WIB).
- [x] 5. Strategi migrasi data dari Google Sheets termasuk password.
- [x] 6. Rencana penanganan cold start Neon (skeleton UI, timeout, retry, pengurangan request awal).
- [x] 7. Rencana backup mandiri (pg_dump manual/terjadwal).
Dokumen: `docs/architecture-neon.md`. Tunggu persetujuan user.

---

## FASE 2 — SETUP NEON + VERCEL
Status: **SELESAI (PANDUAN DI DOCS/SETUP-NEON-VERCEL.MD, MIGRATION & SCRIPTS SIAP)**
- [x] 1. Panduan langkah tepat dashboard Neon (region Singapore) + Vercel preview env.
- [x] 2. Migrasi skema Drizzle/SQL (`drizzle/0000_init_neon_schema.sql`), seed katalog item (`scripts/seed-catalog.mjs`), `.env.example`, skrip cek koneksi aman (`scripts/check-db-connection.mjs`).

---

## FASE 3 — AUTENTIKASI DAN API INTI
Status: **SELESAI (VERIFIKASI TEST LULUS 8/8 DI TESTS/AUTH-API.TEST.MJS)**
- [x] 1. Implementasi login, registrasi, logout, getMe, dan sesi di Vercel Functions (`api/auth/*`). Rate limiting (5 percobaan / 15 menit).
- [x] 2. Hapus fallback palsu dari build production. Mode simulasi hanya jika `VITE_ENABLE_MOCK=true` pada dev, dengan banner "MODE SIMULASI" yang jelas (`SimulationBanner.jsx`); build production mengabaikannya.
- [x] 3. Format respons API terstruktur: SUCCESS, AUTH_ERROR, NETWORK_ERROR, VALIDATION_ERROR. HTTP status code yang benar (200, 201, 400, 401, 409, 429, 500).
- [x] 4. Auth guard: Pengguna belum login langsung diarahkan ke pendaftaran akun (`/daftar`); semua fitur wajib akun. Data tamu tidak dihapus sebelum registrasi dikonfirmasi server.

---

## FASE 4 — EKONOMI DAN HADIAH DI SERVER
Status: **SELESAI (10/10 TEST LULUS DI TESTS/ECONOMY-FASE4.TEST.MJS & VERIFIKASI PARITI PASSED)**
- [x] 1. `updateProfile` (`/api/profile/update`): hanya whitelist field aman (`displayName`, `avatarKey`, `activeTitle`). XP, coins, streak dilarang dan diabaikan dari payload request profil.
- [x] 2. Ledger `transactions` dengan `event_id` unik dan idempoten, batasan saldo `CHECK (coins >= 0)` di level PostgreSQL, sumber valid via `api/_lib/ledger.js`.
- [x] 3. Validasi klaim misi di server (`/api/quests/claim`): zona Asia/Jakarta (WIB), validasi status riil ketercapaian target misi sebelum klaim, dan pencegahan klaim ganda (double-claim prevention).
- [x] 4. Transaksi pembelian item di server (`/api/economy/buy`): pemeriksaan saldo, katalog aktif, level cendekiawan, batas simpanan inventori. Pembayaran tercatat di ledger transaksi.
- [x] 5. Perhitungan streak di server (`api/_lib/streak.js`): inkremen beruntun berdasarkan hari aktif WIB, konsumsi `streak_freeze` otomatis dari inventori jika terjadi jeda 1 hari libur.
- [x] Butir A: Habit Reading hadiah hanya 1x per artikel per akun (`reading:<id>:first_complete`). Baca ulang boleh tanpa error dan mengembalikan `alreadyRewarded: true` dengan 0 XP & 0 Coin tambahan tanpa menduplikasi baris transaksi ledger.

---

## FASE 5 — SINKRONISASI OFFLINE-FIRST YANG ANDAL
Status: **SELESAI (7/7 TEST LULUS DI TESTS/PROGRESS-SYNC-FASE5.TEST.MJS & TOTAL 25/25 API TESTS PASS)**
- [x] 1. Outbox permanen di IndexedDB per namespace user_id (`src/services/outboxDb.js`, fallback ke localStorage jika browser memblokir IndexedDB).
- [x] 2. Batch sync ke server (`/api/progress/sync`); hapus dari outbox HANYA setelah server mengonfirmasi (ACK `processedEvents`).
- [x] 3. Idempotensi server (`UNIQUE (user_id, event_id)` di `progress_events` & `transactions`): re-send event yang sama tidak menduplikasi riwayat, tidak menduplikasi stats, dan tidak menggandakan hadiah XP/koin.
- [x] 4. Pembersihan cache lokal saat logout/ganti akun (`clearAllUserData` membersihkan IndexedDB dan localStorage ber-namespace).
- [x] 5. Indikator 4-status simpan di UI (`src/components/common/SyncStatusIndicator.jsx`): "Tersimpan" (hijau), "Menyinkronkan..." (emas/animasi), "Menunggu sinkronisasi (N)" (oranye), "Gagal, akan dicoba lagi" (merah dengan tombol retry).

---

## FASE 6 — PINDAHKAN SEMUA FITUR KE API BARU
- [x] 1. Migrasi endpoint: profil, avatar, inventory, titles, settings, misi harian, matching, grammar, reading quiz, cerita/petualangan, SRS, statistik.
- [x] 2. Hubungkan modul belajar ke layanan tunggal `src/services/learningActivity.js`.
- [x] 3. Hubungkan matching ke pencatatan.
- [x] 4. Satukan hook profil, ganti `||` dengan `??`.
- [x] 5. Perbaiki alur data tamu registrasi.
- [x] 6. Satukan implementasi SRS (opsi 1: sekuens baku [1, 3, 8, 16, 30] hari).
- [x] 7. Perbaiki teks notifikasi di Settings agar tidak menjanjikan background push palsu.
- [x] Butir F: Halaman Riwayat Latihan (`activity_log` & `attempt_details` JSONB 90 hari, cursor pagination, filter, grafik 7 hari, tombol "Latih lagi yang salah", empty state Kanci).
- [x] Butir G: Redesain halaman Profil & Achievement (kartu identitas V2, tier progress, filter kategori, `??` handling).
- [x] Butir H: Hapus badge total konten hardcoded (2971, 19, 156, dll); Ganti badge angka misi menjadi Tanda Seru Merah `!` dengan `aria-label` yang hanya muncul bila ada misi belum selesai (WIB).

---

## FASE 7 — MIGRASI DATA
- [x] Skrip ekspor/impor CSV lokal (`scripts/migrate-from-sheets.mjs`) dengan proteksi folder `migration_data/` di `.gitignore`.
- [x] Dry-run audit verifikasi baris database Neon: Strategi Clean Slate (Opsi A) diterapkan. Database berada dalam kondisi murni (0 users, 0 progress, 11 seeded catalog items).

---

## FASE 8 — PENGUJIAN DAN CI
- [x] 1. Script `test:all` (content, logic, integrasi API, e2e) + GitHub Actions (`.github/workflows/ci.yml`).
- [x] 2. Security test suite (`tests/security.test.mjs` 12/12 lulus: invalid login, no demo on failure, reject forged XP/coins, reject uncompleted quest claim, double claim prevention, insufficient balance check, cross-tenant isolation, expired token handling, duplicate event_id idempotency).
- [x] 3. Multi-device sync test (`tests/multi-device-sync.test.mjs` 8/8 lulus: 2 sesi/perangkat independen tetap sinkron).
- [x] 4. Responsive audit di 360, 768, 1280 px (`tests/responsive-audit.test.mjs` 6/6 lulus).
- [x] 5. Verifikasi akun baru benar-benar mulai dari 0 (DB Neon diaudit: 0 user sisa, 0 progress palsu, 11 katalog ter-seed).

---

## FASE 9 — PRODUKSI
Status: **SELESAI (RUNBOOK OPERASIONAL, BACKUP/RESTORE TOOLING & CI WORKFLOW SIAP DILUNCURKAN)**
- [x] 1. Rencana database production terpisah, verifikasi cutover (`docs/operational-runbook.md`, `scripts/init-production-db.mjs`).
- [x] 2. Rencana backup mandiri (`scripts/backup-db.mjs`, `scripts/restore-db.mjs`), README operasional, monitoring kuota Rp0/bln, GitHub Actions weekly backup (`.github/workflows/db-backup.yml`).
- [x] 3. PR ke `main` disiapkan (user yang memutuskan kapan merge, seluruh kode tersimpan aman di branch `feat/neon-migration`).

---

## FASE 10 — WIDGET LAYAR UTAMA ANDROID
Status: **SELESAI (PWA APP SHORTCUTS & BADGING API AKTIF, WIDGET SUMMARY API & CETAK BIRU CAPACITOR LENGKAP)**
- [x] J1. Verifikasi kemampuan PWA Android Chrome untuk home screen widget (`docs/android-widget-guide.md`).
- [x] J2. Tahap A: PWA App Shortcuts (Misi, SRS, Riwayat, Matching di `public/manifest.json`) + W3C Badging API (`src/services/badging.js` terhubung ke `WorkspacePage.jsx`).
- [x] J3. Tahap B: Rencana Capacitor + Android App Widget native (2x2 Mini Streak & SRS, 4x2 Wide Missions) + Endpoint cepat `GET /api/widget/summary` (`tests/widget-summary.test.mjs` lulus) + Android WorkManager guide.

---

## FASE 11 — REFINEMENT TAMBAHAN
- [ ] (a) Audit & perbaikan tampilan mobile di 320/360/390/768 px.
- [ ] (b) Root-cause & fix pengingat notifikasi jam belajar.
- [ ] (c) Heads-up notification & tombol "Uji notifikasi" di Settings.

---
