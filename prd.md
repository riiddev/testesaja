# PRD — SINAUENGLISH V2

## 1. Ringkasan
Rebuild total tampilan (tema) website belajar Inggris dari repo `riiddev/testesaja` menjadi produk baru bernama **SINAUENGLISHV2**. Referensi tema: https://themainideas.com/home. Fitur dan data dari versi lama dipertahankan; yang berubah adalah desain visual, layout, dan pengalaman pengguna.

## 2. Tujuan
- Tampilan mengikuti bahasa visual themainideas.com: tipografi, palet warna, spacing, gaya komponen, dan nuansa "belajar fokus dan terstruktur".
- Semua fitur dari repo lama tetap berfungsi, tanpa kehilangan data.
- Responsif (mobile-first), cepat, dan gratis dijalankan (tanpa biaya server).

## 3. Non-Tujuan
- Tidak menyalin teks, logo, gambar, atau aset berhak cipta dari themainideas.com. Hanya meniru gaya (token desain dan pola layout).
- Tidak mengubah repo lama `testesaja` (read-only).
- Tidak memakai layanan berbayar atau backend wajib.

## 4. Pengguna
Pelajar Indonesia (SMP sampai dewasa) yang belajar kosakata dan grammar Inggris level A1–C1.

## 5. Fitur Baseline (dipertahankan dari V1)
> Daftar final ditentukan dari audit repo di Fase 0. Jika ada perbedaan dengan daftar ini, hasil audit yang menang.
1. Kosakata dari `American_Oxford_3000.md` (semua kata + arti Indonesia, tanpa ada yang hilang), level A1–C1.
2. Kurikulum grammar per topik.
3. Kuis per topik.
4. Sistem mastery ketat + spaced repetition.
5. Penyimpanan lokal (IndexedDB/localStorage) + ekspor/impor backup.
6. Fitur tambahan yang ada di V1 (speaking/listening/cerita, dll.) bila sudah ada.

## 6. Kebutuhan Desain
### 6.1 Design tokens (diisi dari hasil ekstraksi Fase 1 → `docs/design-tokens.md`)
- Warna (background, surface, teks, aksen, state: success/warn/error), mode terang/gelap bila situs referensi mendukung.
- Tipografi (font family, skala ukuran, weight, line-height). Pakai font gratis (Google Fonts) yang paling mirip jika font asli berbayar.
- Spacing, radius, border, shadow, lebar kontainer, breakpoint.
- Pola komponen: navbar, hero, kartu, tombol, tag/badge, footer, section heading.
### 6.2 Halaman
- Home/landing, Dashboard belajar, Daftar kosakata + filter level, Detail/latihan kosakata, Grammar (daftar & detail topik), Kuis, Progress/statistik, Pengaturan (backup/impor).
### 6.3 Aksesibilitas & performa
- Kontras WCAG AA, navigasi keyboard, label ARIA pada kontrol interaktif.
- Lighthouse Performance ≥ 90 dan Accessibility ≥ 90 di mobile.

## 7. Kebutuhan Teknis
- Pertahankan stack V1 kecuali audit menemukan alasan kuat untuk migrasi; catat alasan di `docs/decisions.md`.
- Semua data statis (kosakata, grammar) dipisah dari komponen UI agar tema mudah diganti.
- Theming lewat CSS variables terpusat.
- Tanpa dependensi berbayar; bisa di-deploy gratis (GitHub Pages / Netlify / Vercel).

## 8. Milestone
| Fase | Hasil |
|---|---|
| 0 | Audit repo lama + inventaris fitur & data |
| 1 | Ekstraksi design tokens situs referensi |
| 2 | Repo baru SINAUENGLISHV2 + scaffold + design system |
| 3 | Migrasi data & logika (kosakata, mastery, grammar, kuis) |
| 4 | Build halaman dengan tema baru |
| 5 | QA: paritas fitur, a11y, performa, responsif |
| 6 | Deploy gratis + README |

## 9. Kriteria Sukses
- 100% fitur dan data V1 hadir di V2 (dibuktikan checklist paritas).
- Jumlah kata kosakata V2 = V1 (tidak ada yang hilang).
- Tampilan konsisten dengan token hasil ekstraksi di semua halaman.
- Backup/impor dari V1 bisa dibaca V2 (atau ada skrip migrasi).
- Skor Lighthouse sesuai target.

## 10. Risiko
| Risiko | Mitigasi |
|---|---|
| Situs referensi tidak bisa diekstrak penuh | Simpan screenshot + catatan manual, tentukan token terdekat |
| Aset/font berhak cipta | Pakai font dan ikon gratis/open-source |
| Data lokal V1 tidak kompatibel | Skrip migrasi IndexedDB/localStorage |
| Scope melebar | Kunci paritas fitur dulu, fitur baru masuk backlog |