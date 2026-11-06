# Panduan Backend Serverless Google Spreadsheet

Dokumen ini menjelaskan arsitektur backend tanpa server (serverless) berbasis **Google Apps Script** dan **Google Spreadsheet** untuk **SINAUENGLISH V2**. Backend ini mengelola autentikasi akun, sesi pengguna, pencatatan progres kata (Spaced Repetition System / SRS), hasil kuis, dan preferensi akun secara gratis tanpa biaya server.

---

## 1. Arsitektur & Skema Tab

Spreadsheet disimpan secara privat di Google Drive pengembang/administrator dan **TIDAK PERNAH dibagikan untuk publik**. Komunikasi dari browser dilakukan melalui **Google Apps Script Web App** sebagai gateway API aman.

```
React Client (Browser)
   │
   │  POST (text/plain dengan JSON body — bypass CORS preflight)
   ▼
Google Apps Script Web App (Code.gs)
   ├── LockService (Mencegah tulis bersamaan)
   ├── CacheService (Cache sesi token 10 menit)
   ├── SHA-256 + Salt Engine (5.000 iterasi hash)
   │
   ▼
Google Spreadsheet (5 Tab Privat)
   ├── Users
   ├── Sessions
   ├── Progress
   ├── QuizAttempts
   └── Settings
```

### Rincian 5 Tab Spreadsheet

1. **`Users`**
   - `id`: ID unik pengguna bertipe string acak (`u_...`)
   - `email`: Alamat email terdaftar (lowercase, unik)
   - `display_name`: Nama tampilan pengguna
   - `password_hash`: Hash password hasil 5.000 siklus SHA-256
   - `salt`: String acak hex unik per pengguna (16-byte)
   - `created_at`: Waktu pendaftaran (ISO 8601)
   - `last_login`: Waktu login terakhir (ISO 8601)

2. **`Sessions`**
   - `token_hash`: Hash SHA-256 dari session token (token asli hanya ada di client `sessionStorage`)
   - `user_id`: ID pengguna pemilik sesi
   - `expires_at`: Waktu kadaluwarsa token (TTL 7 hari)

3. **`Progress`**
   - `user_id`: ID pengguna
   - `word_id`: ID kata kosakata (misal: `ox_abandon_1`)
   - `level`: Level CEFR kata (`A1`, `A2`, `B1`, `B2`)
   - `mastery_stage`: Tahap penguasaan (`fresh`, `learning`, `review_due`, `mastered`, `weak`)
   - `next_review_at`: Jadwal pengulangan berikutnya (ISO 8601)
   - `correct_count`: Jumlah repetisi berhasil
   - `wrong_count`: Jumlah kegagalan
   - `updated_at`: Waktu terakhir diperbarui

4. **`QuizAttempts`**
   - `user_id`: ID pengguna
   - `topic_id`: ID topik materi grammar (misal: `present-simple`)
   - `score`: Jumlah jawaban benar
   - `total`: Total soal dalam kuis
   - `taken_at`: Waktu pengerjaan

5. **`Settings`**
   - `user_id`: ID pengguna
   - `key`: Kunci pengaturan (`dailyGoal`, `theme`, `audioSpeed`)
   - `value`: Nilai pengaturan

---

## 2. Langkah Pembuatan & Deployment

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet: `SinauEnglish V2 Database`.
3. Biarkan spreadsheet berstatus privat (jangan ubah pengaturan berbagi).

### Langkah 2: Buka Apps Script Editor
1. Di menu Google Sheets, klik **Ekstensi** > **Apps Script** (*Extensions > Apps Script*).
2. Beri nama proyek Apps Script: `SinauEnglish-V2-API`.

### Langkah 3: Tempel Kode Backend
1. Buka file `Code.gs` di editor Apps Script, hapus seluruh isi default, lalu tempel isi file [backend/Code.gs](file:///d:/VIBE%20CODE%20ANTI%20GRAFITY/SINAUENGLISHV2/backend/Code.gs).
2. Buat file script baru di editor dengan nama `setup.gs`, lalu tempel isi file [backend/setup.gs](file:///d:/VIBE%20CODE%20ANTI%20GRAFITY/SINAUENGLISHV2/backend/setup.gs).
3. Di dropdown fungsi bagian atas editor, pilih fungsi **`setupDatabase`**, lalu klik **Run** (Jalankan).
4. Berikan izin akses Google ketika diminta (*Review Permissions* > Pilih akun Google Anda > *Advanced* > *Go to SinauEnglish-V2-API (unsafe)* > *Allow*).
5. Kembali ke Google Sheets Anda: kelima tab (`Users`, `Sessions`, `Progress`, `QuizAttempts`, `Settings`) telah otomatis terbuat dengan format header yang rapi.

### Langkah 4: Deploy sebagai Web App
1. Di kanan atas Apps Script editor, klik tombol biru **Deploy** > **New deployment** (*Penerapan baru*).
2. Klik ikon gerigi (Select type) > pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `SinauEnglish V2 Production API v1`
   - **Execute as** (*Jalankan sebagai*): **Me (email Anda)**
   - **Who has access** (*Siapa yang memiliki akses*): **Anyone** (*Siapa saja*)
   > [!IMPORTANT]
   > Pengaturan *Who has access: Anyone* wajib dipilih agar aplikasi React di browser dapat mengirim permintaan POST tanpa ditolak oleh sistem autentikasi Google. Akun Google Anda tetap aman karena kode script yang mengontrol akses ke tabel, bukan Google login langsung.
4. Klik **Deploy**.
5. Salin **Web App URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

### Langkah 5: Hubungkan ke Aplikasi React
1. Di folder proyek lokal Anda, buat file `.env`:
   ```bash
   cp .env.example .env
   ```
2. Buka `.env` dan isi URL yang Anda salin:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
3. Restart development server (`npm run dev`) atau jalankan build (`npm run build`).

---

## 3. Keamanan & Penanganan Masalah Teknis

### A. Mengapa Menggunakan POST text/plain?
Infrastruktur Google Apps Script Web App tidak mengizinkan kustom HTTP Header (seperti `Authorization: Bearer` atau `Content-Type: application/json`) secara mudah karena Google tidak memproses preflight CORS `OPTIONS` secara standar dan akan memblokir request.
- **Solusi:** Frontend mengirimkan request `POST` dengan `Content-Type: text/plain;charset=utf-8` di mana isi body-nya adalah JSON string (`JSON.stringify({ action, token, payload })`).
- Cara ini secara spesifikasi browser dikategorikan sebagai *Simple Request* (tanpa preflight `OPTIONS`) sehingga request langsung sampai ke `doPost(e)` di Apps Script dengan mulus.

### B. Penyimpanan Token & Ketiadaan Data Lokal
- Token autentikasi disimpan **HANYA di `sessionStorage`** browser (atau React memory state).
- **Nol kredensial atau data progres di `localStorage` atau `IndexedDB`**.
- Begitu tab browser ditutup, token terhapus secara otomatis.

### C. Keamanan Password
- Password tidak pernah disimpan dalam format teks polos (plaintext).
- Server Apps Script menghasilkan salt acak 16-byte unik untuk setiap pengguna, menggabungkannya dengan password, lalu menjalankan iterasi hash SHA-256 sebanyak 5.000 kali (`Utilities.computeDigest`).
- *Catatan Keterbatasan:* Google Apps Script tidak menyediakan fungsi bawaan untuk algoritma `bcrypt` atau `argon2` tanpa library polifill yang lambat. Iterasi SHA-256 dengan salt acak adalah perlindungan terkuat yang didukung secara native dan cepat oleh Google V8 runtime.

### D. Isolasi Antar Pengguna
- Setiap operasi baca/tulis ke tab `Progress`, `QuizAttempts`, dan `Settings` wajib menyertakan `token`.
- Server memvalidasi hash token di sheet `Sessions`, mengambil `user_id` yang sah, lalu menyaring data hanya untuk baris milik pengguna tersebut.
- Pengguna A secara teknis mustahil membaca atau mengubah data milik Pengguna B.

### E. Optimasi Kuota via Batch Debounce
- Google Apps Script memiliki kuota eksekusi harian (sekitar 20.000 panggilan/hari untuk akun Gmail gratis).
- Jika aplikasi mengirim panggilan API untuk setiap klik kata atau kartu flashcard, kuota akan cepat terkuras.
- Klien `src/hooks/useProgressSync.js` menerapkan antrean memori lokal (queue) yang mendebounce pembaruan dan mengirimkannya dalam satu panggilan batch (`action: "syncProgress"`, berisi array pembaruan kata) setiap 5 kata atau saat pengguna berganti halaman.

---

## 4. Keterbatasan Backend Google Spreadsheet (Jujur & Transparan)

Meskipun solusi ini 100% gratis dan mudah dikelola tanpa infrastruktur server, terdapat beberapa batasan teknis yang perlu dipahami:

1. **Latensi Jaringan:** Respons Google Apps Script memerlukan waktu rata-rata **400ms – 1200ms** per permintaan (jauh lebih lambat dibanding database PostgreSQL/Redis). Oleh karena itu, aplikasi React menggunakan status UI optimistik (*optimistic update*) dan indikator loading yang elegan.
2. **Kuota Harian:** Akun Google pribadi gratis dibatasi sekitar 20.000 URL fetch dan kuota waktu eksekusi total 90 menit/hari. Solusi batch syncing sangat krusial untuk menjaga batas ini.
3. **Bukan Database Transaksional (ACID):** Google Spreadsheet bukan sistem RDBMS berkinerja tinggi. Script menggunakan `LockService` untuk mencegah tumpang-tindih penulisan secara simultan, namun jika ada ribuan pengguna menulis di detik yang sama, antrean kunci dapat mengalami batas waktu (*timeout*).
4. **Wajib Koneksi Internet (Online-Only):** Karena seluruh data akun dan progres dipindahkan ke Google Spreadsheet sesuai kebutuhan proyek, aplikasi membutuhkan koneksi internet aktif untuk menyimpan kemajuan belajar.


---

## 5. Arsitektur Penyimpanan Foto Profil (Google DriveApp) & Trade-Offs

### A. Alasan Pemilihan Google DriveApp Dibandingkan Sel Spreadsheet
- **Batas Karakter Sel**: Google Spreadsheet memiliki batasan ketat maksimal **50.000 karakter per sel teks**. Sebuah gambar beresolusi sedang dalam format Base64 dapat dengan mudah melebihi 100.000 karakter, yang akan menyebabkan penulisan ke spreadsheet gagal (*cell overflow error*) atau merusak struktur tab `Profiles`.
- **Solusi Arsitektural**: File gambar foto profil disimpan sebagai file mandiri di Google Drive milik pemilik Web App pada folder privat bernama `SinauEnglish_Avatars`.
- **Skema Tab Profiles**: Di tab `Profiles`, backend hanya menyimpan metadata ringkas:
  - `avatar_file_id`: ID string unik file di Google Drive (misal: `1A2b3C...`).
  - `avatar_updated_at`: Timestamp ISO 8601 (misal: `2026-11-04T17:30:00Z`).

### B. Analisis Kuota & Kapasitas (Google Drive & Apps Script)
1. **Kapasitas Penyimpanan (15 GB Gratis)**:
   - Client mengompres gambar hasil crop lingkaran ke resolusi **256×256 px WebP** dengan ukuran rata-rata **30–50 KB** (batas maksimal server 60 KB).
   - Dengan rata-rata 50 KB per avatar, kuota gratis Google Drive sebesar 15 GB sanggup menampung hingga **300.000 foto profil pengguna**.
2. **Pembersihan Otomatis (Anti-Bloat)**:
   - Saat pengguna mengunggah foto profil baru atau menekan tombol hapus foto, backend Apps Script (`handleUploadAvatar` dan `handleDeleteAvatar`) secara otomatis memindahkan file avatar lama ke tempat sampah (`file.setTrashed(true)`). Hal ini mencegah penumpukan file yatim (*orphaned files*) di Google Drive.
3. **Optimasi Kuota Eksekusi via Client Memory Cache**:
   - Membaca file dari Google Drive via Apps Script membutuhkan waktu eksekusi IO sekitar 200–400ms.
   - Untuk mencegah pemborosan kuota dan latensi berlebih, client React (`useUserProfile.js`) menyimpan DataURL avatar di memori dan `localStorage` dengan `avatar_updated_at` sebagai versi/etag.
   - Saat aplikasi dibuka, client hanya mengecek apakah nilai `avatar_updated_at` dari profil cloud berbeda dengan cache lokal. Jika nilainya sama, client **tidak akan memanggil API getAvatar**, melainkan langsung menggunakan cache lokal secara instan (0 ms).

### C. Kesiapan Lapisan Bingkai Avatar (Avatar Borders — Tahap 3)
- Pada kartu profil dan modal, elemen avatar disusun dalam struktur modular bertingkat (`scholar-avatar-box`):
  1. Lapisan Dasar: Elemen `img` (foto profil) atau inisial nama.
  2. Lapisan Atas (`z-index: 2`): Bingkai dekoratif (`avatar-border-overlay`) yang akan dihubungkan ke sistem katalog border (Daun, Tinta, Kawung, Emas, Buku, Kanci) pada Tahap 3.

---

## 6. Arsitektur Petualangan & Mesin Cerita (Tahap 6 — StoryProgress)

### A. Skema Tab `StoryProgress`
Menyimpan riwayat penyelesaian 10 cerita (100 episode) dan kontrol ritme harian (pacing):
- `user_id`: ID unik pengguna (`u_...`)
- `story_id`: ID cerita (misal: `story-01`)
- `episode_id`: Nomor episode yang diselesaikan (`1` s.d. `10`)
- `completed_at`: Waktu penyelesaian ISO 8601 UTC
- `wib_date`: Tanggal kalender WIB saat episode diselesaikan (`yyyy-MM-dd` GMT+07:00)
- `xp_rewarded`: Jumlah EXP yang diberikan (default +50 EXP)
- `coins_rewarded`: Jumlah Sinau Coin yang diberikan (default +30 Koin)

### B. Mekanisme Daily Pacing Sistematis (WIB)
1. **Ritme Belajar Harian (Pacing)**:
   - Pengguna dibatasi untuk membuka maksimal **1 episode baru per hari** kalender Waktu Indonesia Barat (WIB, GMT+07:00).
   - Tujuannya adalah menjaga retensi memori jangka panjang dan mencegah fenomena *binge-learning* yang tidak efektif.
2. **Replay Bebas Tanpa Batas**:
   - Episode yang telah berstatus selesai dapat diakses dan dibaca ulang kapan saja untuk mengulang latihan kosakata, grammar, maupun audio.
   - Replay tidak memberikan hadiah EXP maupun Koin berulang (`alreadyCompleted: true`).
3. **Endpoint API**:
   - `getStoryProgress`: Mengembalikan riwayat episode yang tuntas per cerita dan status `hasUnlockedNewEpisodeToday`.
   - `completeStoryEpisode`: Memvalidasi penyelesaian episode, mencatat ke tab `StoryProgress`, dan secara idempoten menambahkan +50 EXP dan +30 Koin ke tab `Profiles`.

