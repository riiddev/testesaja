# Architectural & Design Decisions — SINAUENGLISHV2

Dokumen ini mencatat keputusan-keputusan teknis dan desain (Architecture Decision Records) dalam pembangunan kembali **SINAUENGLISHV2**.

---

## ADR 001: Mempertahankan Core Stack (Vite + Modern ESM + CSS Custom Properties + TypeScript)
- **Status:** Diterima (Accepted)
- **Konteks:** V1 dibangun menggunakan Vite, modern JavaScript (ESM), TypeScript untuk typecheck, dan CSS. Proyek mensyaratkan 100% gratis, tanpa backend berbayar, dan dapat di-host di platform statis seperti GitHub Pages, Netlify, atau Vercel.
- **Keputusan:** Kami mempertahankan arsitektur frontend statis berbasis Vite + modern ESM. Kami tidak beralih ke framework fullstack berbayar atau server SSR karena website harus dapat dijalankan secara mandiri di sisi klien.

---

## ADR 002: Pemisahan Data Statis & Dekoupling Logika Aplikasi
- **Status:** Diterima (Accepted)
- **Konteks:** Pada V1, file `belajar.js` berukuran ~247 KB dan menggabungkan logika render DOM, navigasi view, logika SRS, data loader, dan audio synthesis dalam satu file besar.
- **Keputusan:** Pada V2, data statis (Oxford 3000, Grammar, HABIT reading, Everyday Stories) dipisahkan secara murni ke direktori `data/`. Logika sistem penguasaan (Mastery), Spaced Repetition (SRS), dan manajemen penyimpanan (Storage Service) diisolasi ke dalam modul mandiri di `src/lib/` agar arsitektur bersih, mudah dirawat, dan tema visual dapat dimodifikasi tanpa merusak integritas data.

---

## ADR 003: Menghilangkan Hambatan Login Cloud (100% Local-First)
- **Status:** Diterima (Accepted)
- **Konteks:** Pada commit akhir branch V1 terdapat pengalihan paksa ke `login.html` yang membutuhkan sesi cloud (Google Sheets / Supabase sync). Aturan PRD V2 mewajibkan: "Gratis total: tanpa backend/layanan berbayar. Data tetap lokal (IndexedDB/localStorage) + ekspor/impor backup."
- **Keputusan:** Di V2, seluruh ruang belajar terbuka langsung secara lokal tanpa mewajibkan pengguna login atau memiliki koneksi cloud. Data disimpan di IndexedDB lokal dengan fallback ke localStorage, serta didukung fitur Backup/Restore via file JSON.

---

## ADR 004: Pemilihan Tipografi Google Fonts untuk Gaya Editorial Neobrutalisme
- **Status:** Diterima (Accepted)
- **Konteks:** Situs referensi `themainideas.com` menggunakan tipografi `Space Grotesk` untuk heading, `Fraunces` untuk kutipan/aksen editorial, dan `Quicksand` untuk teks isi/tombol.
- **Keputusan:** Ketiga font tersebut tersedia secara resmi dan gratis di Google Fonts di bawah lisensi Open Font License (OFL). Kami menggunakan ketiganya secara langsung melalui `@import` Google Fonts dengan optimasi font-display swap untuk memastikan kesamaan visual 1:1 tanpa melanggar hak cipta komersial.

---

## ADR 005: Penambahan Variasi Dark Mode pada Tema Neobrutalisme
- **Status:** Diterima (Accepted)
- **Konteks:** Situs referensi `themainideas.com` berfokus pada nuansa kertas terang (Warm Parchment). Namun, pengguna aplikasi belajar sering kali belajar di malam hari atau kondisi minim cahaya.
- **Keputusan:** Kami merancang palet *Warm Espresso Night* untuk Dark Mode yang tetap mempertahankan karakter border tegas dan bayangan offset khas neobrutalism, namun dengan rasio kontras ramah mata (WCAG AA compliant) dan latar gelap hangat.

