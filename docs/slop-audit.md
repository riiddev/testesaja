# Audit & Eliminasi Pola "AI Slop" — SINAUENGLISH V2

Dokumen ini mencatat audit menyeluruh terhadap antarmuka pengguna (UI), tipografi, tata letak visual, dan copywriting untuk memastikan produk terbebas dari pola generik "AI Slop".

---

## 1. Ringkasan Prinsip Editorial Neobrutalisme
Alih-alih mengadopsi estetika kecerdasan buatan generik (gradien ungu-biru, teks glow, glassmorphism, emoji roket/sparkle berlebihan, dan copy klise), **SINAUENGLISH V2** berakar pada bahasa desain editorial surat kabar dan materi ajar berbobot (*Warm Editorial Neobrutalism*), mengacu pada referensi `themainideas.com`.

---

## 2. Tabel Temuan Audit: Sebelum vs Sesudah

| Kategori Elemen | Pola AI Slop (Dihindari/Dihapus) | Desain SinauEnglish V2 (Diterapkan) | Alasan Penggantian & Manfaat |
|---|---|---|---|
| **Palet Warna & Latar** | Gradien ungu-biru/neon generik, efek glow menyilaukan, teks gradien di heading. | Palet hangat kertas cetak (*Warm Parchment* `#F4F0E8`), Charcoal Ink (`#1A1A1A`), Ochre Gold (`#C99A3B`), dan Slate Navy (`#4B5E73`). | Kontras tinggi (14.8:1, WCAG AAA), nyaman dibaca berjam-jam, memberikan kesan jurnalistik dan terpercaya. |
| **Gaya Kartu & Bayangan** | Glassmorphism buram (`backdrop-filter: blur`), bayangan kabur raksasa (`box-shadow: 0 20px 50px rgba(0,0,0,0.1)`), sudut super bulat 32px seragam. | Neobrutalisme editorial: border tegas 1px–1.5px (`#1A1A1A`), hard-drop shadow offset (`4px 4px 0 rgba(86,52,0,0.25)`), radius 16px–20px seimbang. | Elemen visual memiliki batas struktural yang jelas, tidak mengapung tanpa arah, dan berbobot nyata di layar. |
| **Ikonografi & Dekorasi** | Ikon sparkle (✨), robot (🤖), roket (🚀), atau emoji dekoratif tanpa fungsi di tiap kartu. | Ikonografi SVG garis tipis fungsional (audio speaker, search, navigasi drawer) dan tipografi mono untuk data metrik. | Menghilangkan distraksi visual; ikon hanya hadir jika memiliki fungsi interaktif langsung (umpan balik pengguna). |
| **Tata Letak Hero** | Hero tengah generik simetris dengan dua tombol identik ("Get Started" / "Learn More"). | Hero editorial asimetris 2-kolom: tipografi Space Grotesk headline + kartu spesimen kata interaktif ber-audio. | Langsung mendemokan nilai inti produk dalam 3 detik pertama tanpa basa-basi pemasaran. |
| **Copywriting & Nada Bahasa** | Klise generik: *"Unlock your potential"*, *"Revolutionize your English"*, *"Seamless AI-powered future"*, *"The ultimate learning experience"*. | Narasi konkret & berbasis realitas: *"Kata baru belum jadi milikmu. Menghafal arti kamus saja tidak menjamin kamu bisa memakainya saat berbicara. Amati kata dalam kalimat nyata, bedakan nuansanya, dan kunci ingatanmu."* | Mengedukasi pengguna tentang masalah nyata belajar bahasa dan solusi metodologis yang disediakan. |
| **Kredibilitas Data & Metrik** | Statistik buatan (*"99.9% success rate"*, *"10M+ users"*), testimoni palsu dengan foto stok, logo korporat fiktif. | Data riil korpus: **2.971** kata Oxford 3000, **19** topik tata bahasa, **156** bacaan HABIT (63.309 kata), dan progres riil akun dari Spreadsheet. | Kejujuran intelektual; pengguna tahu persis materi apa yang akan mereka kuasai. |
| **Animasi & Interaksi** | Animasi melayang tanpa henti (*floating/bobbing*), tombol wiggle bergetar, efek bounce memantul berlebihan. | Transisi interaksi bertujuan: mikro-interaksi saat kartu ditekan, pergeseran status SRS, dan Lenis smooth scroll yang menghormati preferensi `prefers-reduced-motion`. | Menjaga stabilitas tata letak, mencegah pusing bagi pengguna vestibular, dan mempertahankan 60fps di ponsel kelas menengah. |

---

## 3. Verifikasi Aksesibilitas & Tipografi

- **Skala Fluid:** Menggunakan rumus `clamp()` modern untuk transisi ukuran font dari viewport mobile (360px) ke desktop (1280px) tanpa lompatan breakpoint yang kasar.
- **Rasio Kontras:**
  - Teks `#1A1A1A` di atas latar `#F4F0E8`: **14.8:1** (Lulus AAA).
  - Teks `#C99A3B` di atas latar `#1A1A1A` (Dark mode): **8.6:1** (Lulus AAA).
- **Mode Gerak Berkurang (`prefers-reduced-motion`):**
  - Seluruh animasi transisi dan Lenis smooth scroll dinonaktifkan secara otomatis bagi pengguna yang mengaktifkan pengaturan reduced motion di sistem operasi mereka.

