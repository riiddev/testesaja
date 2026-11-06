# Arsitektur dan Keputusan Teknis — SINAUENGLISHV2 → Neon + Vercel

**Tanggal riset:** 6 November 2026  
**Repository:** riiddev/testesaja  
**Branch:** feat/neon-migration  
**Baseline:** main 395ce73409b08690b195da0254599294536a1dde  
**Status:** rancangan arsitektur siap; belum ada resource Neon yang dibuat. Preview compatibility fix berada di branch feat/neon-migration dan tidak mengubah Production.

> Dokumen arsitektur lama pada baseline tidak lagi akurat pada status Neon Auth dan batas paket gratis. Riset ini memakai dokumentasi resmi yang tersedia pada tanggal riset. Kuota, harga, region, dan API vendor dapat berubah; cek kembali saat setup Fase 2.

## 1. Keputusan yang direkomendasikan

**Rekomendasi default: Better Auth open-source yang dijalankan pada Vercel Functions, dengan Neon PostgreSQL dan Drizzle ORM.**

Alasannya:
1. Tetap memakai arsitektur aplikasi yang sudah ada: React/Vite → API Vercel → Neon. Tidak perlu memindahkan seluruh API ke Neon Functions atau mengubah frontend menjadi framework lain.
2. Better Auth sudah tercantum di package.json. Better Auth menyediakan adapter Drizzle, kontrol password hashing, session/cookie, serta konfigurasi masa berlaku reset password.
3. Akun lama dapat dipertahankan dengan ID yang sama. Verifier kompatibilitas dapat membaca format hash Apps Script lama dan format scrypt Vercel saat ini, lalu menaikkan hash ke format baru setelah login berhasil.
4. Masa berlaku reset password dapat ditetapkan 3600 detik (1 jam) sesuai roadmap; sesi dapat dicabut saat password di-reset.
5. Menghindari ketergantungan tambahan pada layanan auth terkelola; route, schema, dan pemeriksaan API tetap dapat diaudit di repository.

**Tidak ada perubahan kode auth pada Fase 1.** Rekomendasi ini akan diuji di branch development sebelum dipakai akun nyata. Jika integrasi hash lama atau transaksi Better Auth tidak lolos tes, jangan cutover; perbaiki di Preview dahulu.

## 2. Perbandingan opsi autentikasi

| Aspek | A. Neon Managed Better Auth | B. Better Auth self-hosted di Vercel | C. Pertahankan custom auth saat ini |
|---|---|---|---|
| Pengelola | Neon mengelola Auth API | Library open-source di project | Seluruh kode auth dikelola project |
| Biaya dasar | Termasuk Neon Free hingga 60.000 MAU/proyek | Tidak ada biaya lisensi; memakai kuota Vercel + Neon | Tidak ada biaya lisensi; memakai kuota Vercel + Neon |
| Integrasi frontend | SDK resmi @neondatabase/neon-js; quick start React/Vite tersedia | Better Auth client untuk React | Hook custom yang sudah ada |
| Integrasi Vercel API | Perlu mengirim/validasi JWT Managed Auth pada setiap API | API memeriksa sesi Better Auth dari request cookie | API memeriksa custom session token di tabel sessions |
| Password | Managed by Neon/Better Auth | Better Auth; hash/verify dapat dikustomisasi | Saat ini Node crypto.scrypt |
| Reset password | Tersedia, link default 15 menit; SDK reset tertentu belum sepenuhnya didukung dan UI reset disediakan lewat komponen auth | Reset TTL dapat ditetapkan 3600 detik dan sesi dapat dicabut | Token, email, reset, dan revoke harus dibuat sendiri |
| Kustomisasi | Lebih terbatas; bukan drop-in untuk Better Auth self-hosted dan belum mendukung custom server handler/plugin sendiri pada dokumentasi yang diriset | Luas: konfigurasi, hook, adapter, email callback, schema | Paling bebas, tetapi seluruh beban security pada project |
| Isolasi Preview | Auth, users, config dan endpoint ikut database branch | Schema/session ikut DB yang sama; route/config dikendalikan project | Harus dikelola sendiri |
| Dampak pada kode saat ini | Perlu migrasi ke Neon Auth SDK/JWT dan auth flow Neon | Mengganti helper custom dengan Better Auth; API tetap di Vercel | Memperbaiki custom auth dan menambah kode security sendiri |

### Catatan Neon Managed Better Auth

Managed Better Auth sekarang tersedia pada Neon Free, dan Neon mendokumentasikan integrasi React/Vite. Kuota Free yang tercantum adalah hingga 60.000 monthly active users per project. Jadi pernyataan lama bahwa Neon Auth masih preview sudah tidak berlaku.

Namun, dokumentasi reset password Managed Better Auth yang diperiksa pada 6 November 2026 menyebut masa berlaku link 15 menit. Roadmap aplikasi meminta 30–60 menit; SDK reset password juga dinyatakan belum sepenuhnya didukung dan dokumentasi mengarahkan penggunaan komponen UI. Untuk link reset, custom email provider diperlukan bila ingin menggunakan verification links alih-alih kode bersama. Ini membuat Managed Auth kurang cocok dengan kebutuhan kustom saat ini.

Managed Auth tetap opsi valid bila kebutuhan produk berubah dan masa reset 15 menit diterima, tetapi bukan pilihan default sekarang.

### Catatan Better Auth self-hosted

Better Auth memiliki adapter resmi Drizzle dan mendukung PostgreSQL. Password hashing default Better Auth memakai scrypt; fungsi hash/verify dapat dikustomisasi untuk kompatibilitas hash lama. Cookie sesi bersifat HttpOnly dan Secure di production; origin validation/CSRF protections tersedia. Masa berlaku reset password dapat dikonfigurasi, serta sesi dapat dicabut saat reset.

### Mengapa tidak mempertahankan custom auth selamanya?

Implementasi sekarang mempunyai beberapa bagian baik: Vercel membuat token acak 32 byte, menyimpan hash SHA-256 token di DB, password Neon/Vercel memakai scrypt, dan cookie HttpOnly. Namun:
- Login rate limit memakai Map di memori proses Vercel, sehingga state tidak persisten/terkoordinasi antar instance.
- Frontend masih menyimpan bearer session token pada sessionStorage sebagai jalur utama/fallback, memperbesar dampak bila terjadi XSS.
- Belum ada reset password dan seluruh email token lifecycle.
- Rotasi session, CSRF/origin, recovery, dan edge cases harus terus dijaga manual.

Custom auth tidak otomatis tidak aman, tetapi mempertahankannya menambah beban security dan pengujian. Better Auth memberi primitive yang lebih teruji, sementara kebutuhan khusus tetap dapat ditangani pada API project.

## 3. Rencana migrasi akun dan password — tanpa memaksa pendaftaran ulang

**Jangan menghapus atau mengganti kolom users.id.** Semua foreign key data belajar harus tetap menunjuk ke ID pengguna yang sama.

### Format password yang ditemukan

Pemeriksaan kode menemukan dua format yang berbeda:

1. **Akun Apps Script/Google Sheets lama:** backend/Code.gs menggunakan SHA-256 dengan salt dan 5.000 iterasi (HASH_ITERATIONS = 5000). Salt serta hasil hash disimpan pada kolom Users.
2. **Akun yang dibuat melalui API Vercel/Neon saat ini:** api/_lib/auth.js memakai Node.js crypto.scryptSync, salt acak 16 byte yang direpresentasikan hex, dan derived key 64 byte; hash dan salt disimpan terpisah pada kolom users.password_hash dan users.salt.

Kedua format ini tidak boleh diasumsikan identik. Skrip migrasi wajib mengidentifikasi jenis sumber akun dan mempertahankan format verifikasi yang benar.

### Strategi kompatibilitas yang direkomendasikan

1. Pertahankan user ID lama dari Google Sheets/Neon.
2. Buat record kredensial Better Auth yang terhubung ke ID tersebut.
3. Tandai hash dengan versi format, misalnya gas-sha256-5000:<salt>:<hash> dan vercel-scrypt-v1:<salt>:<hash>. Ini adalah format internal migrasi, bukan format yang boleh dikirim ke browser.
4. Custom password verifier Better Auth mendeteksi versi, memverifikasi menggunakan algoritma sumber yang tepat, lalu saat login berhasil menaikkan hash lama menjadi format scrypt terbaru.
5. Hash password tidak pernah didekripsi. CSV/hash tidak pernah dicetak ke log, commit, atau chat.
6. Bila akun duplikat email ditemukan, jangan gabungkan otomatis; karantina untuk pemeriksaan manual.
7. Uji akun Apps Script lama, akun Vercel/Neon lama, password salah, password benar, migrasi pertama saat login, login kedua setelah rehash, dan session revoke.
8. Jangan meminta pengguna membuat akun baru massal. Jika format akun tertentu tidak dapat diverifikasi, laporkan dan siapkan jalur reset yang aman; jangan mengarang hasil migrasi.

**Batas penting:** jumlah akun dan row Google Sheets belum diberikan. Karena itu strategi migrasi sudah dirancang, tetapi belum boleh menjalankan migrasi riil. Penghitungan/ekspor hanya dilakukan pada Fase 7 setelah jumlah sumber diketahui dan dry-run disetujui.

## 4. Driver, ORM, dan koneksi

### Keputusan

Pertahankan:
- @neondatabase/serverless
- Drizzle ORM
- koneksi HTTP neon() untuk query stateless biasa dari Vercel Functions.

Ini sudah sesuai implementasi db/index.js pada branch sekarang. Drizzle mendokumentasikan driver Neon HTTP dan Neon WebSocket. HTTP cocok untuk query serverless stateless singkat; WebSocket/Pool menjadi opsi bila suatu operasi benar-benar membutuhkan session atau interactive transaction.

### Aturan implementasi

- Jangan membuat koneksi database saat build Vite/static export; inisialisasi hanya di runtime API yang membutuhkan DB.
- Jangan mencetak DATABASE_URL atau object konfigurasi yang mengandung secret.
- Gunakan pooled connection string dari Neon untuk koneksi berbasis PostgreSQL protocol bila diperlukan.
- Setiap transaksi kritis harus diuji dengan driver yang dipakai; khususnya ledger ekonomi harus menjamin insert transaksi dan update saldo tidak terpisah saat failure.
- Gunakan query parameterized/Drizzle, jangan string-concatenate input user menjadi SQL.
- Semua endpoint personal menggunakan user ID yang diperoleh dari sesi server, bukan dari body request.

### Batas transaksi

Ledger XP/coins, claim quest, purchase, serta pembuatan akun harus atomik:
- cek unique event / idempotency,
- validasi syarat server,
- insert ledger,
- update profile/inventory,
- commit bersama atau rollback seluruhnya.

Jika mode HTTP tidak dapat memenuhi transaksi yang dibutuhkan oleh suatu operasi, gunakan driver WebSocket hanya untuk alur itu atau gunakan mekanisme SQL transaction yang didukung dan diuji. Jangan mengklaim atomic sebelum ada race/partial-failure test.

## 5. Arsitektur target autentikasi

1. React/Vite menggunakan Better Auth React client pada same-origin /api/auth/*.
2. Browser mengirim cookie melalui credentials: "include"; jangan menyimpan access/session token di localStorage/sessionStorage sebagai sumber sesi.
3. Vercel route api/auth/[...all].js menangani endpoint Better Auth.
4. Semua api/*.js yang membutuhkan login mengambil session Better Auth dari header/cookie request. Server menentukan user.id.
5. Profile, progress, inventory, history, economy, quest, dan avatar tetap di API Vercel yang sudah ada. Better Auth tidak diberi kewenangan mengubah XP/koin.
6. Cookie production harus HttpOnly, Secure, SameSite=Lax, scoped ke domain aplikasi; trusted origins dibatasi ke origin yang benar.
7. Login rate limit harus persisten/terkoordinasi, bukan hanya in-memory Map pada instance serverless. Pilihan implementasi awal: table rate-limit window di PostgreSQL dengan upsert atomik, expiry/cleanup, serta normalisasi IP berdasarkan header proxy tepercaya. Simpan identifier email/IP dalam bentuk hash bila memungkinkan.
8. users.id menjadi FK utama. Better Auth user model dimapping ke tabel users atau schema kompatibel; kolom wajib Better Auth dan account/session/verification schema ditambahkan melalui migration yang diuji.
9. Profil, user_stats, dan settings default dibuat atomik saat user dibuat (misalnya via DB transaction/database hook yang terbukti atomik). Akun baru wajib XP 0, coins 0, streak 0, tanpa progress, title, atau inventory palsu.
10. Verifikasi email tidak diaktifkan otomatis pada fase ini; roadmap meminta menunggu persetujuan pengguna. Reset email baru diimplementasikan pada Fase 12 setelah provider email gratis dipilih.

## 6. Skema PostgreSQL target

Semua data personal memakai foreign key ke users.id dan query harus scope by user_id.

| Area | Tabel | Tanggung jawab |
|---|---|---|
| Identity | users, Better Auth accounts, sessions, verifications | Identitas, kredensial, sesi, verification/reset token |
| Profile | profiles, avatars, settings | Nama tampilan, title aktif, XP/coins/streak, foto kecil, preferensi |
| Learning | progress, progress_events, user_stats | Status SRS per kata, event idempoten, akumulasi statistik |
| Curriculum | grammar_progress, story_progress | Kemajuan grammar dan episode cerita |
| Missions | daily_quests, quest_claims | Progres misi WIB serta satu klaim hadiah per user/quest/day |
| Economy | transactions, catalog, inventory, titles | Ledger XP/koin, katalog server, barang dimiliki, title unlocked |
| History | activity_log, attempt_details, reading_quiz_attempts, matching_attempts | Ringkasan sesi dan rincian jawaban |
| Future gated | push_subscriptions, widget_tokens, announcements, inbox_messages | Hanya dibuat pada fase setelah stability gate jika disetujui |

### Constraint dan indeks penting

- UNIQUE(user_id, event_id) pada progress event/transaction/reward event.
- UNIQUE(user_id, quest_date, quest_id) pada daily quest dan klaim.
- CHECK (xp >= 0), CHECK (coins >= 0), CHECK (progress >= 0), CHECK (target > 0), harga tidak negatif.
- Foreign key ON DELETE CASCADE untuk seluruh data personal yang memang harus ikut terhapus.
- Indeks untuk (user_id, created_at DESC), (user_id, next_review_at), session/token lookup, dan event ID.
- activity_log menyimpan ringkasan jangka panjang; attempt_details berisi JSONB detail dan di-retain 90 hari sesuai roadmap. Setelah 90 hari, hapus detail; jangan otomatis menghapus ledger idempotensi bila itu bisa membuat event lama diproses ulang.
- Jangan menyimpan seluruh corpus kosakata statis ke Neon; hanya status/progres kata.
- Simpan timestamp sebagai TIMESTAMPTZ UTC; tentukan tanggal misi/streak/reward dengan helper server Asia/Jakarta (WIB). Jangan bergantung timezone perangkat pengguna.

### Misi dan achievement

- Client tidak boleh mengirim progress/target final.
- Backend mencatat event aktivitas yang tervalidasi (misalnya review SRS, completion grammar, quiz, matching, reading, story).
- Server memetakan event ke quest dan menghitung progres; claim endpoint memeriksa progres dari event server, quest ID dikenal, hari WIB, dan klaim sebelumnya.
- Achievement dihitung dari statistik server dan unlock server hanya bila syarat terpenuhi. Client hanya meminta status atau klaim reward yang sudah valid.

## 7. Penyimpanan foto profil: bytea vs Vercel Blob

| Kriteria | bytea di Neon | Vercel Blob Hobby |
|---|---|---|
| Included quota | Termasuk dalam 1 GB PostgreSQL/project Neon | 1 GB storage, 10 GB data transfer; 10.000 simple ops dan 2.000 advanced ops |
| Secret terpisah | Tidak; memakai koneksi DB server | Perlu token Blob |
| Konsistensi penghapusan akun | Dapat memakai FK/cascade | Perlu menghapus file dari Blob juga |
| Skalabilitas file besar | Bukan pilihan untuk gambar besar | Lebih tepat untuk file besar |
| Beban implementasi | Rendah untuk foto kecil | Ada upload/delete, token, orphan cleanup |

### Rekomendasi: tetap gunakan bytea kecil

Schema saat ini sudah membatasi foto ke 35.840 byte (35 KiB). Dengan batas maksimum ini:
- 1.000 foto × 35 KiB ≈ 35 MiB.
- 5.000 foto × 35 KiB ≈ 171 MiB.
- Pada rata-rata 20 KiB: 1.000 foto ≈ 20 MiB; 5.000 foto ≈ 98 MiB.

Batasi ke WebP 192–256 px, kompres sebelum upload, validasi MIME dan signature file di server, jangan menerima SVG/HTML, dan tolak ukuran di atas 35 KiB. Kembalikan avatar melalui endpoint terautentikasi dengan ETag/revalidation; jangan memakai cache publik untuk foto personal. Bila jumlah akun/foto nanti mendekati batas storage, evaluasi Blob lagi berdasarkan data nyata.

## 8. Neon Free — batas dan dampak biaya

Riset resmi yang ditemukan pada 6 November 2026:
- 1 GB PostgreSQL storage per project.
- 100 CU-hours per project per bulan.
- Autoscaling hingga 2 CU (sekitar 8 GB RAM).
- 10 branches per project.
- 5 GB public network transfer per project per bulan.
- Scale-to-zero setelah 5 menit idle; Free instant restore window 6 jam.
- 100 CU-hours setara kira-kira 400 jam bila compute berjalan stabil pada 0,25 CU.

### Branching dan storage

Neon menggunakan copy-on-write. Child branch awalnya menunjuk ke data pages yang sama; data dasar tidak disalin penuh saat branch dibuat. Saat child branch menulis perubahan, branch tersebut membuat page berbeda untuk perubahan itu. Jadi branch tidak otomatis menggandakan 1 GB data, tetapi perubahan/retensi page yang divergen tetap menggunakan storage project. Semua branch berada dalam satu batas project, bukan masing-masing mendapat kuota 1 GB sendiri.

### Strategi hemat kuota

- Satu project Neon untuk aplikasi; gunakan maksimal branch yang diperlukan.
- Satu branch Preview/Development yang tetap; jangan membuat branch baru untuk setiap tes kecil.
- Jangan terus melakukan health ping untuk menjaga compute tetap hidup.
- Jangan menyimpan log debug/per-request yang tidak diperlukan.
- Simpan detail jawaban hanya 90 hari; pertahankan ringkasan sesi.
- Batasi foto ke 35 KiB; corpus kata tetap di frontend.
- Uji query dan indeks; hindari N+1 request untuk dashboard awal.
- Pantau compute hours, storage, network transfer dan branch count di Neon dashboard.

## 9. Vercel Hobby — batas dan pertimbangan region

Vercel Hobby saat ini mencantumkan included usage seperti hingga 1 juta Function invocations dan 100 GB-hours Function Duration; plan ini ditujukan untuk proyek personal/non-komersial. Gunakan kuota secara hemat dan cek kembali terms bila status penggunaan aplikasi berubah.

**Pertimbangan penting untuk pengguna Indonesia:** Vercel mencantumkan Singapore sebagai region sin1, tetapi dokumentasi regional pricing menyatakan pricing/region compute khusus Singapore tersedia untuk pengguna Pro. Vercel Functions memiliki default region iad1 (Washington, D.C.). Karena target biaya adalah Rp0 dan tidak boleh meminta pengguna upgrade, jangan mengasumsikan fungsi Hobby dapat dijalankan di Singapore. Pada setup nanti:
1. periksa region yang benar-benar diberikan project Hobby;
2. ukur cold/warm latency browser → function → Neon dari Indonesia;
3. jangan menjanjikan performa sub-second sebelum diukur;
4. jika latensi tidak memuaskan, tunjukkan alternatif gratis dan konsekuensinya (misalnya Neon Functions di region database, bila cocok dan disetujui) — jangan otomatis memindahkan arsitektur atau mengaktifkan plan berbayar.

## 10. Foto, data, dan perlindungan privasi

- DATABASE_URL, BETTER_AUTH_SECRET, email provider token, dan secret lainnya hanya di Vercel Environment Variables/local ignored .env; tidak pernah di source, log, commit, screenshot, atau chat.
- .env.example hanya placeholder dan tidak membuktikan environment variable terpasang.
- Preview menggunakan Neon development branch dan Vercel Preview env. Jangan membuat atau menulis ke production.
- Google Sheets/Apps Script/Drive tetap menjadi sumber legacy/rollback sampai migrasi terverifikasi.
- CSV export bersifat lokal, folder gitignored, akses terbatas. Password hash/email tidak dicetak di log.
- Jangan menyalin data production ke Preview tanpa strategi perlindungan/anonymization dan persetujuan; branch copy-on-write tetap dapat berisi snapshot data sensitif.

## 11. Cold start dan strategi request awal

- Neon Free dapat suspend compute setelah 5 menit idle. Request pertama setelah idle dapat mengalami wake-up latency.
- Vercel Function cold start terpisah dari Neon wake-up; keduanya harus diuji.
- Tampilkan skeleton untuk shell dan identitas akun; jangan memblokir seluruh workspace menunggu semua modul.
- Ambil data minimum untuk first paint; modul berat dan history dimuat saat dibuka.
- Timeout harus menghasilkan pesan yang bisa dipahami, bukan sukses palsu.
- Retry hanya pada operasi aman/idempoten atau event dengan event_id stabil. Jangan retry purchase/reward tanpa idempotency.
- Target loading diukur dari Preview, jangan menjanjikan 3 detik universal karena koneksi/perangkat/Neon cold start berbeda.
- Jangan melakukan ping database berkala hanya agar tidak tidur.

## 12. Backup dan pemulihan

Neon Free menyediakan instant restore window 6 jam dan satu manual snapshot menurut tabel paket yang diriset; itu bukan pengganti backup mandiri jangka panjang.

Rencana:
1. Sebelum setiap migration besar, buat pg_dump dari branch yang tepat.
2. Simpan backup di folder lokal terenkripsi/penyimpanan privat milik pengguna; folder backup selalu gitignored.
3. Lakukan backup mingguan saat aplikasi aktif digunakan, serta sebelum schema/cutover.
4. Uji restore ke branch development terpisah secara berkala.
5. Jangan upload dump ke repository publik atau lampirkan password hash ke chat.
6. Dokumentasikan tanggal, branch sumber, checksum, jumlah row, dan hasil restore tanpa menyertakan secret.

Jadwal otomatis baru dipilih bila penyimpanan backup privat dan kuota CI/retensinya dipastikan gratis serta aman. Jangan menyimpan dump rahasia sebagai GitHub artifact tanpa evaluasi akses dan retention.

## 13. Urutan implementasi setelah rancangan

1. Fase 2: user membuat Neon project Singapore dan development branch; memasukkan DATABASE_URL/secret sendiri di Vercel Preview; tidak ada production secret.
2. Fase 3: implementasi Better Auth self-hosted pada Vercel; migrasi schema/auth di branch development; compatibility verifier untuk dua format hash; no main changes.
3. Fase 4: transaksi ekonomi/reward atomik, server-side quest/achievement validation.
4. Fase 5: outbox IndexedDB, ACK, idempotency, multi-device.
5. Fase 6: semua modul, history, reading, profile/avatar, SRS, settings, cross-device.
6. Fase 7: dry-run data migration setelah jumlah akun/row diketahui. Jangan hapus Sheets.
7. Fase 8: CI/security/two-device/responsive/E2E.
8. Fase 9: production plan hanya setelah seluruh stability gate dan persetujuan eksplisit.

**Tidak ada perubahan production pada seluruh langkah tersebut.**

## 14. Keputusan teknis yang ditetapkan sebagai default

| Keputusan | Default |
|---|---|
| Database | Neon PostgreSQL Free |
| API | Vercel Functions |
| Region database | Singapore, bila tersedia untuk project Free |
| Auth | Better Auth self-hosted di Vercel |
| ORM | Drizzle |
| Driver umum | Neon HTTP |
| Driver transaksi khusus | Neon WebSocket bila tes transaksi mengharuskannya |
| Password compatibility | Verifikasi GAS SHA-256 × 5.000 dan Vercel scrypt, upgrade setelah login benar |
| Cookie/session | Better Auth HttpOnly/Secure/SameSite=Lax, same-origin |
| Rate limit | Persistent DB-backed, tidak bergantung Map in-memory |
| Avatar | PostgreSQL bytea WebP ≤35 KiB |
| Timezone misi/streak | Asia/Jakarta (WIB) |
| Backup | pg_dump lokal terenkripsi + restore test |
| Production | Tidak disentuh sebelum gerbang stabilitas dan persetujuan pengguna |

## 15. Sumber resmi yang digunakan (diakses 6 November 2026)

**Neon**
- [Neon Free Plan update (2 October 2026)](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Neon Free plan limits and quotas](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md)
- [Managed Better Auth overview](https://neon.com/docs/auth/overview)
- [React quick start for Managed Better Auth](https://neon.com/docs/auth/quick-start/react)
- [Managed Better Auth password reset](https://neon.com/docs/auth/guides/password-reset)
- [Branching authentication](https://neon.com/docs/auth/branching-authentication)
- [Copy-on-write branching](https://neon.com/blog/branching-as-the-new-standard-for-relational-databases)

**Better Auth / Drizzle**
- [Better Auth security and password hashing](https://better-auth.com/docs/reference/security)
- [Better Auth options: password hash/verify and reset TTL](https://better-auth.com/docs/reference/options)
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth cookie security](https://better-auth.com/docs/concepts/cookies)
- [Drizzle ORM + Neon](https://orm.drizzle.team/docs/connect-neon)

**Vercel**
- [Hobby plan usage](https://vercel.com/docs/plans/hobby)
- [Vercel Function limitations](https://vercel.com/docs/functions/limitations)
- [Vercel regions (Singapore = sin1; default function region = iad1)](https://vercel.com/docs/regions)
- [Singapore regional pricing availability](https://vercel.com/docs/pricing/regional-pricing/sin1)
- [Vercel Blob Hobby pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Vercel Cron limits](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing)

---
