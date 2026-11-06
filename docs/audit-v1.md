# Audit Repositori V1 (riiddev/testesaja)

**Tanggal Audit:** 04 November 2026  
**Repositori Asal:** `https://github.com/riiddev/testesaja.git`  
**Commit Referensi:** `1dbbb1d` (Merge pull request #31 into `main`)  
**Status Audit:** Selesai (Read-Only)

---

## 1. Inventaris Arsitektur & Stack Teknologi

### 1.1 Stack Utama
- **Runtime / Engine:** Node.js `>=22.12.0`
- **Frontend Core:** Vanilla HTML5, Modern ECMAScript (ESM), CSS Custom Properties, TypeScript (`tsc` untuk typechecking).
- **Bundler & Tooling:** Vite `v8.3.5`, Tailwind CSS `v4.3.3` (digunakan sebagian utilitas & komponen UI tertentu), Playwright untuk automated testing.
- **Micro-Framework UI:** Terdapat komponen pendukung `@radix-ui/react-slot`, `lucide-react`, `clsx`, `tailwind-merge` untuk mount navbar modular (`navbar-mount.tsx`).
- **Penyimpanan Klien:**
  - **IndexedDB:** Database `sinauu-english-v1`, object store `state`, key `current` (Schema Version `1`).
  - **localStorage Fallback:** `sinauu-english-state-v1` jika IndexedDB tidak tersedia.
  - **localStorage Modul Tambahan:**
    - `sinauu-adventure-progress-v1`: Progress Everyday Stories, Dialogues, Listening, Pronunciation.
    - `sinauu-extra-learning-v1`: Progress matching exercise & extra modules.
    - `sinauu-habit-library-v1`: Progress HABIT reading passages.
    - `sinauu-placement-result-v1`: Hasil tes penempatan (diagnostic level).
    - `sinauu-sidebar-collapsed`: State visual navigasi samping.
  - **Mekanisme Backup:** Ekspor dan impor file JSON mandiri berbasis schema version `1` (tidak memerlukan server).

### 1.2 Halaman & Struktur Navigasi
1. `index.html`: Landing page publik / showcase metode belajar (Pendekatan, Peta materi, Specimen kata, CTA ke ruang belajar).
2. `belajar.html`: Ruang belajar utama (Single Page Application multi-view).
   - View `overview`: Dashboard harian, target belajar, ringkasan progres, kartu aksi cepat.
   - View `vocabulary`: Penjelajah 2.971 kosakata Oxford 3000 (A1–B2 + UNCLASSIFIED) dengan filter level, pencarian instan, dan kartu makna/contoh.
   - View `grammar`: Kurikulum 19 topik grammar A1–B2 lengkap dengan pola rumus, contoh bilingual, catatan kesalahan umum (*common mistakes*), dan kuis terintegrasi.
   - View `study`: Mode fokus belajar per kata dengan alur 3 langkah (Makna → Konteks → Ingatan).
   - View `matching`: Latihan mencocokkan kata dan arti (pairing drill).
   - View `reading`: Perpustakaan membaca HABIT (156 passage, 63.309 kata) + 12 materi keterampilan membaca (*reading skills*).
   - View `adventure`:
     - *Everyday Stories* (8 cerita A1–B2 dengan kata fokus dan pertanyaan pemahaman).
     - *Everyday English* (4 dialog situasional & roleplay).
     - *Listening Lab* (8 latihan mendengarkan berbasis transkrip Web Speech TTS).
     - *Pronunciation Studio* (16 latihan pengucapan dengan analisis mikrofon lokal).
     - *Speaking Studio & Writing Studio* (skenario mandiri A1–B2).
   - View `practice`: Pusat latihan terpadu.
   - View `review`: Sistem spaced repetition & jurnal kesalahan (*mistake review*).
   - View `placement`: Tes penempatan diagnostik level pemula sampai menengah atas.
   - View `progress`: Visualisasi statistik penguasaan materi, grafik pencapaian, ekspor & impor backup JSON.
3. `login.html`: Halaman eksperimen otentikasi/cloud sync (pada V2, akses aplikasi dibuka penuh secara lokal tanpa paksaan login).
4. `liquid-navbar.html`: Demo komponen navbar liquid glass.

---

## 2. Inventaris & Metrik Data Statis (Baseline V1)

Berdasarkan eksekusi script verifikasi `scripts/audit-content.mjs`:

| Kategori Data | Lokasi Sumber | Metrik Validasi V1 |
|---|---|---|
| **Oxford 3000 Corpus** | `data/oxford3000/` | **2.971 total headwords unik** (A1: 892, A2: 792, B1: 689, B2: 597, UNCLASSIFIED: 1 ["o"]) |
| **Editorial Overrides** | `data/oxford3000/` | 1.144 record kurasi kontekstual & terjemahan |
| **Starter Vocab File** | `data/vocabulary.json` | 999 kata unik terindeks langsung untuk pencarian cepat |
| **Grammar Topics** | `data/grammar.json` | 19 topik kurikulum (A1–B2) |
| **Grammar Questions** | `data/grammar.json` | 57 pertanyaan latihan tervalidasi |
| **HABIT Reading Library**| `data/habit-reading-library.json` | 156 bacaan unik, 63.309 total kata, 174 halaman konten |
| **Reading Skills** | `data/reading-lessons.json` | 12 keterampilan membaca, 12 pertanyaan pemahaman |
| **Everyday Stories** | `public/data/adventure/stories.json` | 8 cerita bertingkat A1–B2 (lengkap dengan kata fokus terhubung ke kosakata) |
| **Everyday English** | `public/data/adventure/dialogues.json` | 4 skenario percakapan interaktif |
| **Listening Lab** | `public/data/adventure/listening.json` | 8 latihan mendengarkan 3 tahap (gist, detail, inference) |
| **Pronunciation Studio** | `public/data/adventure/pronunciation.json` | 16 frasa terpandu (stress words, thought groups, intonation) |

---

## 3. Logika Bisnis & Fitur Pembelajaran

1. **Sistem Penguasaan Kosakata (Mastery System):**
   - Menghitung interaksi pengguna per kata: pengenalan makna, ketepatan menjawab dalam konteks kalimat, dan pengulangan berkala.
   - Status kata: `unseen`, `learning`, `mastered`, dan `review_needed`.
2. **Spaced Repetition & Mistake Review:**
   - Interval pengulangan adaptif berbasis performa sesi sebelumnya.
   - Kata atau soal kuis yang dijawab keliru masuk ke antrean *Mistake Review* untuk diuji kembali di sesi berikutnya.
3. **Penyimpanan Lokal Mandiri (Local-First):**
   - Menggunakan IndexedDB sebagai *primary store* dengan fallback otomatis ke `localStorage`.
   - Tidak ada ketergantungan pada backend berbayar; semua state tersimpan di browser pengguna.
   - Fitur Backup/Restore berupa download file JSON dan upload file JSON dengan validasi schema `v1`.

---

## 4. Evaluasi Arsitektur untuk SINAUENGLISHV2

1. **Pemisahan Data dan UI:**
   Pada V1, sebagian file JS (`belajar.js` ~247 KB) menggabungkan logika navigasi view, manipulasi DOM, pemanggilan TTS, dan kalkulasi data sekaligus.
   Pada V2, data statis diletakkan di direktori `data/` terpisah, logika state/mastery diisolasi dalam modul mandiri (`src/lib/` atau `src/core/`), dan komponen UI dibuat terstruktur.
2. **Penghapusan Penghalang Akses (No Forced Login):**
   Pada branch akhir V1, terdapat script pengalihan ke `login.html`. Sesuai PRD V2, seluruh fitur belajar harus langsung dapat diakses tanpa login atau layanan cloud, murni offline/lokal.
3. **Penerapan Sistem Tema Modern:**
   CSS monolitik `belajar.css` (~222 KB) dan `styles.css` (~82 KB) digantikan dengan sistem CSS Variables terstruktur yang mengadopsi bahasa visual `themainideas.com`.

