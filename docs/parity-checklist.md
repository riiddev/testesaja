# Checklist Paritas Fitur: V1 (testesaja) vs V2 (SINAUENGLISHV2)

Dokumen ini menjadi instrumen verifikasi utama untuk memastikan **100% fitur dan data V1 tetap hadir dan berfungsi di V2** tanpa kehilangan satu komponen pun.

---

## 1. Paritas Data Statis

| Item Data | Target V1 | Status di V2 | Bukti Verifikasi |
|---|---|---|---|
| Oxford 3000 Total Headwords | 2.971 kata unik | ✅ **LULUS (Passed)** | `verify-v2-data.mjs` (2.971 valid) |
| Oxford 3000 Level A1 | 892 kata | ✅ **LULUS (Passed)** | `A1.json.gz.b64` (892 valid) |
| Oxford 3000 Level A2 | 792 kata | ✅ **LULUS (Passed)** | `A2.json.gz.b64` (792 valid) |
| Oxford 3000 Level B1 | 689 kata | ✅ **LULUS (Passed)** | `B1.json.gz.b64` (689 valid) |
| Oxford 3000 Level B2 | 597 kata | ✅ **LULUS (Passed)** | `B2.json.gz.b64` (597 valid) |
| Oxford 3000 UNCLASSIFIED | 1 kata ("o") | ✅ **LULUS (Passed)** | `UNCLASSIFIED.json.gz.b64` (1 valid) |
| Oxford 3000 Editorial Overrides | 1.144 kurasi | ✅ **LULUS (Passed)** | `audit.json` (1.144 verified) |
| Starter Vocab Quick Index | 999 kata | ✅ **LULUS (Passed)** | `data/vocabulary.json` (999 valid) |
| Kurikulum Grammar | 19 topik A1–B2 | ✅ **LULUS (Passed)** | `data/grammar.json` (19 topik valid) |
| Bank Soal Kuis Grammar | 57 soal tervalidasi | ✅ **LULUS (Passed)** | 57 soal tervalidasi unik |
| HABIT Reading Passages | 156 bacaan (63.309 kata) | ✅ **LULUS (Passed)** | 156 bacaan / 63.309 kata valid |
| Keterampilan Membaca (Reading Skills) | 12 materi + 12 soal | ✅ **LULUS (Passed)** | `data/reading-lessons.json` valid |
| Everyday Stories | 8 cerita A1–B2 | ✅ **LULUS (Passed)** | `public/data/adventure/stories.json` |
| Everyday English Dialogues | 4 skenario roleplay | ✅ **LULUS (Passed)** | `public/data/adventure/dialogues.json` |
| Listening Lab | 8 latihan 3-tahap | ✅ **LULUS (Passed)** | `public/data/adventure/listening.json` |
| Pronunciation Studio | 16 frasa terpandu | ✅ **LULUS (Passed)** | `public/data/adventure/pronunciation.json` |

---

## 2. Paritas Halaman & Navigasi

| Halaman / View | Elemen Kunci | Status di V2 |
|---|---|---|
| **Landing / Home (`index.html`)** | Hero headline Space Grotesk, specimen kata interaktif ber-audio, 3-step value prop, peta materi, kraft footer | ✅ **LULUS (Passed)** |
| **Workspace: Beranda (`overview`)** | Ringkasan harian, metrik target, progress bar per level CEFR, quick start action | ✅ **LULUS (Passed)** |
| **Workspace: Kosakata (`vocabulary`)** | Grid 2.971 kata, filter level A1–B2, search bar instan, kartu kata, audio TTS, modal detail kata | ✅ **LULUS (Passed)** |
| **Workspace: Grammar (`grammar`)** | 19 topik pelajaran bertingkat, detail konsep, pola/rumus, contoh bilingual, catatan kesalahan umum | ✅ **LULUS (Passed)** |
| **Workspace: Kuis (`quiz`)** | Latihan kuis per topik (57 soal), opsi jawaban interaktif, umpan balik langsung, skor akhir | ✅ **LULUS (Passed)** |
| **Workspace: Latihan Fokus (`study`)** | Alur 3 tahap (Recall Makna → Pahami Konteks Kalimat → Update Interval SRS) | ✅ **LULUS (Passed)** |
| **Workspace: Membaca (`reading / habit`)** | Pembaca teks perpustakaan HABIT (156 bacaan, 63k kata) dengan estimasi waktu baca | ✅ **LULUS (Passed)** |
| **Workspace: Petualangan (`adventure`)** | Hub cerita interaktif Everyday Stories, Everyday English dialogues, listening, pronunciation | ✅ **LULUS (Passed)** |
| **Workspace: Review (`review`)** | Antrean kata jatuh tempo spaced repetition, kartu review interaktif, jurnal kesalahan | ✅ **LULUS (Passed)** |
| **Workspace: Progres (`progress`)** | Statistik total kata mastered vs learning, visualisasi level CEFR | ✅ **LULUS (Passed)** |
| **Workspace: Pengaturan & Backup** | Pemilihan target belajar harian, unduh backup JSON, unggah & pulihkan backup, reset data aman | ✅ **LULUS (Passed)** |

---

## 3. Paritas Fungsional & Logika Bisnis

| Fungsionalitas | Spesifikasi | Status di V2 |
|---|---|---|
| **Penyimpanan Terpusat Bebas Biaya** | Google Apps Script API + Private Google Spreadsheet (5 Tab: Users, Sessions, Progress, QuizAttempts, Settings). Nol data di localStorage / IndexedDB. | ✅ **LULUS (Passed)** |
| **Keamanan Autentikasi** | Salt acak + 5.000 iterasi SHA-256. Token disimpan strictly di `sessionStorage` (atau memory). | ✅ **LULUS (Passed)** |
| **Batch Syncing & Quota Guard** | Debounced batch queue di sisi klien (`useProgressSync`) menghemat kuota harian eksekusi Google Apps Script. | ✅ **LULUS (Passed)** |
| **Tanpa Layanan Berbayar** | Berjalan 100% gratis memanfaatkan kuota gratis Google Cloud / Workspace. | ✅ **LULUS (Passed)** |
| **Alat Migrasi Cadangan** | Pengguna dapat mengunggah file backup lama (V1/V2 JSON) langsung ke Spreadsheet akunnya. | ✅ **LULUS (Passed)** |
| **Spaced Repetition Algorithm** | Interval adaptif `[1, 3, 8, 16, 30]` hari sesuai performa jawaban pengguna. | ✅ **LULUS (Passed)** |
| **Audio Pronunciation** | Web Speech Synthesis API dengan fallback UK/US voice selection. | ✅ **LULUS (Passed)** |
| **Toggle Dark/Light Mode** | State tema tersimpan dan sinkron antar halaman (*Warm Parchment* ↔ *Warm Espresso Night*). | ✅ **LULUS (Passed)** |

---

## 4. Kriteria Kelulusan Akhir
Setiap item di atas wajib bertanda **LULUS (Passed)** pada Fase 5 QA sebelum proyek dinyatakan siap dideploy.

