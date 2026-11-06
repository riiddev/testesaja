# Dokumen Arsitektur & Keputusan Teknis Migrasi ke Neon PostgreSQL + Vercel Functions (Fase 1)

**Proyek:** SINAUENGLISHV2  
**Branch:** `feat/neon-migration`  
**Target Biaya:** Rp0 / bulan (100% Free Tier)  
**Status:** Menunggu Persetujuan Pengguna  

---

## 1. Opsi Autentikasi & Rekomendasi

Kami membandingkan 3 opsi autentikasi yang memenuhi syarat keamanan tinggi dan Rp0:

| Kriteria | Opsi A: Neon Auth (Managed Better Auth) | Opsi B: Better Auth Library di Vercel Functions | Opsi C: Lean Session Auth (Drizzle + WebCrypto/scrypt) |
|---|---|---|---|
| **Penyedia & Hosting** | Managed oleh Neon Cloud | Open-source library di folder `api/auth/*` Vercel Functions | Handler mandiri di folder `api/auth/*` Vercel Functions |
| **Batas Gratis (Free Tier)** | s.d. 60.000 Monthly Active Users (MAU) | 1.000.000 pemanggilan fungsi/bulan (Vercel) | 1.000.000 pemanggilan fungsi/bulan (Vercel) |
| **Ketergantungan / Vendor Lock-in** | Tinggi (terikat penuh ke dashboard & fitur pratinjau Neon) | Nol (library open-source standar, database Postgres apa saja) | Nol (tanpa dependensi eksternal, kode 100% transparan) |
| **Keamanan Password** | Teruji (scrypt / argon2id standar industri) | Teruji (scrypt / argon2id standar industri via Better Auth) | Teruji (Node.js native `crypto.scrypt` / WebCrypto PBKDF2) |
| **Dukungan Sesi & Cookie** | Token Bearer / Cookie | httpOnly secure cookies + Bearer fallback | httpOnly secure cookies + Session Token (SHA-256 di DB) |
| **Dukungan Migrasi Hash Lama** | Rumit (sulit menginjeksi verifikasi hash ganda SHA-256 Apps Script) | Mendukung via kustom plugin kredensial | Sangat mudah (cek hash lama di kolom `password_hash`, verifikasi, lalu otomatis migrasi ke hash baru) |
| **Dampak Cold Start** | Cepat (diurus proxy Neon) | ~400–800ms pada Vercel cold start pertama | **Paling Cepat (<150ms)** karena kode ringkas & bundle kecil |

### Rekomendasi Kami: **Opsi B (Better Auth Library di Vercel Functions)** dengan fallback arsitektural terstandar ke **Opsi C**
- **Alasan:** 
  1. Menghindari ketergantungan pada produk Neon Auth yang saat ini masih berstatus pratinjau/preview di Neon Console.
  2. Berjalan 100% di dalam repo kita sendiri (`api/auth/[...all].js`), sehingga skema tabel sesi dan pengguna berada di bawah kendali Drizzle ORM.
  3. Memiliki proteksi *brute-force rate limiting*, *token rotation*, dan *session invalidation* bawaan tanpa menulis logika kriptografi manual dari nol.

---

## 2. Driver & ORM: `@neondatabase/serverless` + Drizzle ORM

### Pilihan Driver: `@neondatabase/serverless` (HTTP Query Mode)
- **Mengapa bukan `pg` (node-postgres)?**
  `pg` standar menggunakan koneksi TCP persisten. Pada lingkungan *serverless* Vercel Functions, ribuan kontainer dapat hidup dan mati cepat, memicu *connection exhaustion* pada database Postgres.
- **Keunggulan `@neondatabase/serverless` via HTTP:**
  Mengirim query SQL melalui pipeline HTTP stateless ke proxy Neon. Ini menghasilkan:
  1. **Nol TCP handshake overhead** pada setiap fungsi serverless.
  2. **Nol koneksi macet/bocor (no connection pooling leakage).**
  3. Kompatibel penuh dengan Edge Functions maupun Node.js Serverless Functions di Vercel.

### Pilihan ORM: Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- **Mengapa bukan Prisma?**
  Prisma menyertakan binary engine Rust (~15-40 MB) yang memperlambat Vercel Function cold start hingga 1,5–3 detik. Drizzle murni JavaScript/TypeScript dengan overhead memori nyaris 0 KB.
- **Mekanisme Migrasi Skema Versi:**
  1. Skema didefinisikan secara deklaratif di `drizzle/schema.js`.
  2. `drizzle-kit generate` membuat file migrasi SQL berekstensi numerik (`0000_initial.sql`, `0001_add_tables.sql`).
  3. `drizzle-kit migrate` menerapkan migrasi secara terurut dan mencatat versinya di tabel internal `__drizzle_migrations`.

---

## 3. Penyimpanan Foto Profil: Bytea PostgreSQL vs Vercel Blob

### Analisis Perbandingan Kuota & Biaya

| Parameter | Opsi A: `bytea` di Neon PostgreSQL | Opsi B: Vercel Blob (Free Tier) |
|---|---|---|
| **Batas Penyimpanan Gratis** | 1 GB total proyek (Neon) | 1 GB total (Vercel) |
| **Batas Transfer / Bandwidth** | Tidak ada biaya bandwidth terpisah | 10 GB per bulan |
| **Batas Operasi Tulis** | Termasuk dalam kuota Neon | 10.000 upload / bulan |
| **Kebutuhan Secret / API Key** | Nol (cukup koneksi database yang sudah ada) | Wajib menambah `BLOB_READ_WRITE_TOKEN` |
| **Manajemen Orphan File** | **Otomatis & Atomik** (dihapus via SQL `ON DELETE CASCADE`) | **Rentan Bocor** (jika gagal panggil API delete, file lama tertinggal memakan kuota) |
| **Ukuran File per User** | Dibatasi ketat: WebP 192×192 px = **15–25 KB** | Bebas (biasanya lebih boros) |

### Perhitungan Kuota Opsi A pada 1 GB Neon:
- 1 foto profil WebP (192×192 px, kualitas 80%): rata-rata **20 KB**.
- 1.000 pengguna dengan foto kustom: $1.000 \times 20\text{ KB} = 20\text{ MB}$ (**hanya 2%** dari 1 GB kuota Neon).
- 5.000 pengguna dengan foto kustom: $5.000 \times 20\text{ KB} = 100\text{ MB}$ (**hanya 10%** dari 1 GB kuota Neon).

### Rekomendasi Kami: **Opsi A (`bytea` di PostgreSQL)**
- Disajikan melalui endpoint ringan `/api/avatar?v=<avatar_updated_at>` dengan header `Cache-Control: public, max-age=31536000, immutable` dan ETag browser caching. Browser pengguna hanya mengunduh 1 kali kecuali fotonya diganti.
- Nol dependensi tambahan, tidak ada risiko *orphan file*, dan transaksi 100% konsisten dengan tabel `profiles`.

---

## 4. Skema Lengkap PostgreSQL (Ringkas & Efisien)

Semua waktu dan tanggal menggunakan zona **Asia/Jakarta (WIB = UTC+7)** untuk penentuan reset misi harian, streak, batas hadiah, dan episode cerita.

```sql
-- 1. Tabel Akun & Pengguna
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 2. Sesi Pengguna
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 3. Profil Pelajar (Akun baru WAJIB mulai dari 0)
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  active_title VARCHAR(100) NOT NULL DEFAULT '',
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
  last_active_date DATE, -- Disimpan dalam tanggal WIB
  avatar_key VARCHAR(50) NOT NULL DEFAULT 'avatar_1',
  avatar_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Penyimpanan Foto Profil Biner (Maksimal 35 KB)
CREATE TABLE avatars (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mime_type VARCHAR(30) NOT NULL DEFAULT 'image/webp',
  image_data BYTEA NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size <= 35840), -- Maks 35 KB
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Ringkasan Statistik Belajar Terakumulasi di Server
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  words_started INTEGER NOT NULL DEFAULT 0 CHECK (words_started >= 0),
  words_mastered INTEGER NOT NULL DEFAULT 0 CHECK (words_mastered >= 0),
  b2_mastered INTEGER NOT NULL DEFAULT 0 CHECK (b2_mastered >= 0),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  grammar_completed INTEGER NOT NULL DEFAULT 0 CHECK (grammar_completed >= 0),
  reading_completed INTEGER NOT NULL DEFAULT 0 CHECK (reading_completed >= 0),
  stories_completed INTEGER NOT NULL DEFAULT 0 CHECK (stories_completed >= 0),
  matching_completed INTEGER NOT NULL DEFAULT 0 CHECK (matching_completed >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Status Spaced Repetition (SRS) Kosakata
CREATE TABLE progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id VARCHAR(100) NOT NULL,
  level VARCHAR(10) NOT NULL,
  mastery_stage VARCHAR(20) NOT NULL DEFAULT 'fresh',
  interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  wrong_count INTEGER NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, word_id)
);
CREATE INDEX idx_progress_due ON progress(user_id, next_review_at);

-- 7. Ledger Aktivitas Belajar (Idempotensi Mutlak)
CREATE TABLE progress_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(140) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_event UNIQUE (user_id, event_id)
);

-- 8. Ledger Transaksi Ekonomi (XP & Koin)
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(140) NOT NULL,
  source VARCHAR(50) NOT NULL,
  xp_amount INTEGER NOT NULL DEFAULT 0,
  coins_amount INTEGER NOT NULL DEFAULT 0,
  balance_after_coins INTEGER NOT NULL CHECK (balance_after_coins >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_trans_event UNIQUE (user_id, event_id)
);
CREATE INDEX idx_trans_user ON transactions(user_id, created_at DESC);

-- 9. Progres Tata Bahasa (Grammar)
CREATE TABLE grammar_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, topic_id)
);

-- 10. Progres Cerita & Petualangan (Habiskan 1 cerita / 10 episode baru buka berikutnya)
CREATE TABLE story_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id VARCHAR(50) NOT NULL,
  current_episode INTEGER NOT NULL DEFAULT 1 CHECK (current_episode >= 1),
  completed_episodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_story_completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

-- 11. Misi Harian & Klaim Hadiah
CREATE TABLE daily_quests (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL, -- Berdasarkan WIB (Asia/Jakarta)
  quest_id VARCHAR(80) NOT NULL,
  current_progress INTEGER NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
  target INTEGER NOT NULL CHECK (target > 0),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_user_daily_quest UNIQUE (user_id, quest_date, quest_id)
);

CREATE TABLE quest_claims (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL,
  quest_id VARCHAR(80) NOT NULL,
  xp_reward INTEGER NOT NULL CHECK (xp_reward >= 0),
  coins_reward INTEGER NOT NULL CHECK (coins_reward >= 0),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_quest_claim UNIQUE (user_id, quest_date, quest_id)
);

-- 12. Riwayat Latihan (Menu Riwayat Baru - Sesi Ringkas Permanen)
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL, -- 'vocabulary', 'srs_review', 'grammar', 'reading_quiz', 'matching', 'story'
  title VARCHAR(150) NOT NULL,
  score INTEGER,
  total_questions INTEGER,
  accuracy_percent SMALLINT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_user_date ON activity_log(user_id, created_at DESC);

-- 13. Detail Soal/Jawaban Latihan (Retensi 90 Hari - Hemat Kuota Storage Neon)
CREATE TABLE attempt_details (
  activity_id TEXT PRIMARY KEY REFERENCES activity_log(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wrong_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempt_details_retention ON attempt_details(created_at);

-- 14. Katalog Koleksi, Inventori, Gelar, dan Pengaturan
CREATE TABLE catalog (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'border', 'outfit', 'booster'
  category VARCHAR(30) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  level_req INTEGER NOT NULL DEFAULT 1 CHECK (level_req >= 1),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  asset_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id VARCHAR(60) NOT NULL REFERENCES catalog(id),
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_inventory_item UNIQUE (user_id, item_id)
);

CREATE TABLE titles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id VARCHAR(80) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_title UNIQUE (user_id, title_id)
);

CREATE TABLE settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_goal INTEGER NOT NULL DEFAULT 10 CHECK (daily_goal > 0),
  theme VARCHAR(20) NOT NULL DEFAULT 'light',
  sound_effects BOOLEAN NOT NULL DEFAULT TRUE,
  morning_reminder_hour SMALLINT DEFAULT 7,
  evening_reminder_hour SMALLINT DEFAULT 19,
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Strategi Migrasi Data dari Google Sheets

Berdasarkan jumlah akun dan sifat data yang ada saat ini:

### Skenario 1: Hanya Terdapat Akun Uji Coba Pribadi
- **Rekomendasi:** Tidak perlu menjalankan skrip migrasi CSV data lama. Database Neon dimulai dalam kondisi bersih (*clean slate*). Seluruh akun baru akan langsung dimulai dari angka **0** murni.

### Skenario 2: Terdapat Akun Pengguna Nyata
- **Format Hash Password Lama:** Di `backend/Code.gs`, password disimpan menggunakan format SHA-256 ber-garam (`Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt)`).
- **Prosedur Migrasi Aman:**
  1. Ekspor CSV dari Google Sheets diletakkan di direktori lokal `migration_data/` (yang sudah dimasukkan ke `.gitignore`). Tidak ada secret yang di-commit ke Git.
  2. Skrip migrasi mengimpor pengguna dengan kolom `salt` lama dan penanda `legacy_hash: true`.
  3. Pada saat login pertama pengguna di sistem baru:
     - Endpoint auth memeriksa apakah akun berstatus `legacy_hash`.
     - Jika ya, server memverifikasi password dengan formula SHA-256 lama.
     - Begitu cocok, server **otomatis meng-upgrade hash** ke standar baru (scrypt / argon2id) dan menghapus flag legacy.

---

## 6. Rencana Penanganan Cold Start Neon & Vercel Functions

Neon Free Tier melakukan *scale-to-zero* setelah 5 menit tidak ada aktivitas. Waktu bangun rata-rata adalah **1–3 detik**. Vercel Functions juga membutuhkan ~300ms saat cold start.

### Langkah Penanganan di Frontend & Backend:
1. **Penyatuan Request Awal (Bootstrap Endpoint `/api/bootstrap`):**
   Alih-alih frontend menembak 5 request paralel terpisah saat aplikasi dibuka (`/getMe`, `/getProfile`, `/getSettings`, `/getQuests`, `/getStats`) yang bisa membuat fungsi serverless bertabrakan, kita menyediakan satu endpoint `/api/bootstrap` yang mengambil seluruh ringkasan awal dalam satu query terpadu.
2. **Skeleton & Shimmer UI:**
   Tampilkan placeholder skeleton yang elegan pada kartu profil, kartu ringkasan kuis, dan list misi. Hindari layar putih atau spinner modal yang membekukan interaksi pengguna.
3. **HTTP Driver Tanpa Pooling Delay:**
   Penggunaan `@neondatabase/serverless` via HTTP menghilangkan proses TCP handshake dan re-negotiation socket, menghemat ~400ms setiap kali serverless bangun.
4. **Retry Terbatas dengan Jitter:**
   Jika query pertama terkena timeout cold start (>8 detik), client melakukan 1 kali retry otomatis dengan jeda 1,5 detik. Tampilkan toast jujur: *"Menghubungkan ke database..."* bila koneksi memakan waktu lebih dari 3 detik.

---

## 7. Rencana Backup Mandiri (Rp0)

Neon Free Tier memiliki batas pemulihan Point-in-Time Recovery (PITR) selama 6 jam. Jika terjadi kesalahan data melebihi 6 jam, Neon tidak menyediakannya secara otomatis di paket Free.

### Mekanisme Backup Terjadwal:
1. **Skrip Ekspor `scripts/backup-db.mjs`:**
   Skrip Node.js mandiri yang menggunakan `pg_dump` atau streaming JSON tabel Neon. Skrip ini menghasilkan arsip `.sql.gz` atau `.json.gz` bertanggal.
2. **GitHub Actions Terjadwal (Gratis):**
   Dibuat workflow `.github/workflows/db-backup.yml` yang berjalan otomatis seminggu sekali (`cron: '0 3 * * 0'`) atau manual via tombol `Run workflow` di GitHub Actions.
   - Hasil backup disimpan sebagai GitHub Actions Artifacts terenkripsi (retensi 90 hari gratis).
   - Tidak ada kredensial yang tercetak di log terminal GitHub Actions.

---

## 8. Verifikasi Aturan Desain & Konten Khusus

1. **Aturan EXP/Koin Habit Reading (Butir A):**
   - Hadiah membaca artikel dibatasi deterministik di server dengan `event_id = 'reading:' || article_id || ':first_complete'`.
   - Pembacaan ulang diperbolehkan tanpa batas, UI menampilkan status *"Artikel sudah selesai dibaca sebelumnya (Latihan Pengayaan)"* tanpa memicu error atau menambah koin ganda.
2. **Hapus Badge Konten Hardcoded (Butir H):**
   - Menghapus badge angka total korpus (`2.971`, `19`, `156`, dll.) di sidebar dan overview dashboard yang dihitung dari `.length` berkas statis.
   - Mengganti badge angka "3" pada menu Misi dengan **Tanda Seru Merah `!`** (`aria-label="Ada misi yang belum selesai"`), yang hanya muncul bila ada minimal 1 misi hari ini (WIB) yang belum selesai di server.
3. **Riwayat Latihan & Review SRS yang Salah (Butir F):**
   - Menu baru "Riwayat" di sidebar menampilkan daftar sesi latihan.
   - Tombol *"Latih lagi yang salah"* langsung memasukkan kosakata atau soal yang salah ke antrean SRS berikutnya.

---

Dokumen ini disusun untuk memastikan seluruh fondasi arsitektur aman, efisien kuota, dan siap dieksekusi pada **Fase 2 (Setup Neon + Vercel)**.
