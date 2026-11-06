# Design Tokens — SINAUENGLISHV2

**Basis Referensi:** `https://themainideas.com/` & `https://themainideas.com/home`  
**Gaya Desain:** *Warm Editorial Neobrutalism* (Kombinasi estetika editorial ramah bernuansa kertas perkamen, tipografi geometris modern, border tegas, sudut melengkung ramah, dan bayangan offset padat tanpa blur).  
**Lisensi Aset:** 100% font Google Fonts gratis & bebas lisensi komersial; tanpa menyalin gambar/logo/materi berhak cipta referensi.

---

## 1. Tipografi (Typography System)

| Peran Tipografi | Font Family | Sumber | Bobot (Weight) | Penggunaan |
|---|---|---|---|---|
| **Headings & Display** | `Space Grotesk`, sans-serif | [Google Fonts](https://fonts.google.com/specimen/Space+Grotesk) | 700 (Bold), 600 (SemiBold) | H1, H3, angka statistik, nomor urut, label aksen |
| **Editorial & Quotes** | `Fraunces`, serif | [Google Fonts](https://fonts.google.com/specimen/Fraunces) | 400 (Regular), 600 (SemiBold) | H2, kutipan refleksi, catatan motivasi belajar, aksen editorial |
| **Body & Interactive** | `Quicksand`, sans-serif | [Google Fonts](https://fonts.google.com/specimen/Quicksand) | 500 (Medium), 600 (SemiBold), 700 (Bold) | Paragraf, kartu kosakata, tombol, filter pills, form input, navigasi |

### Skala Ukuran & Ritme (Type Scale)
- **H1 (Hero Display):** `clamp(2.25rem, 5vw, 3.625rem)` (36px – 58px) / `line-height: 1.08` / `letter-spacing: -0.025em`
- **H2 (Section Heading / Editorial):** `clamp(1.75rem, 3.5vw, 2.25rem)` (28px – 36px) / `line-height: 1.2` / `letter-spacing: -0.01em`
- **H3 (Card Title / Subtitle):** `1.4375rem` (23px) / `line-height: 1.25` / `letter-spacing: -0.01em`
- **Body Large (Lead Paragraph):** `1.125rem` (18px) / `line-height: 1.6` / `weight: 500`
- **Body Base (Default Content):** `1rem` (16px) / `line-height: 1.55` / `weight: 500`
- **Body Small (Secondary / Captions):** `0.875rem` (14px) / `line-height: 1.5` / `weight: 500`
- **Micro / Label / Badge:** `0.8125rem` (13px) / `line-height: 1` / `letter-spacing: 0.05em` / `weight: 700`

---

## 2. Palet Warna (Color Palette)

### 2.1 Mode Terang (Default — Warm Parchment Aesthetic)
- **Background Utama (Base Canvas):** `#F4F0E8` (warm cream paper tone)
- **Background Navigasi & Bar Atas:** `#F9F7F2` (soft warm ivory)
- **Background Permukaan Kartu (Card Surface):** `#FFFFFF` (crisp white)
- **Background Footer (Kraft Tone):** `#ECE4CF` (richer warm kraft parchment)
- **Teks Primer (High Contrast Ink):** `#1A1A1A` (deep charcoal black)
- **Teks Sekunder (Muted Ink):** `#736B61` (warm olive-slate gray)
- **Warna Border Utama:** `#1A1A1A` (border tegas khas neobrutalism)

### 2.2 Warna Aksen & State (Signature Neobrutalist Accents)
- **Primary Brand / Gold Ochre:** `#C99A3B`
  - Digunakan untuk: tombol aksi primer (CTA), badge aktif, highlight kata penting.
- **Secondary Accent / Slate Navy:** `#4B5E73`
  - Digunakan untuk: tombol sekunder, status navigasi aktif, indikator progres.
- **Success / Sage Green:** `#5F7A4B`
  - Digunakan untuk: kata *mastered*, jawaban kuis benar, badge lulus level.
- **Danger / Berry Terracotta:** `#8C4A4E`
  - Digunakan untuk: kata *needs review*, jawaban kuis salah, peringatan reset data.
- **Warning / Amber Ochre:** `#D4973B`
  - Digunakan untuk: peringatan sesi, review tertunda.

### 2.3 Kartu Bertema Berwarna (Pastel Tint Surfaces)
- **Tint Sand (Warm):** `#F6EFE0`
- **Tint Sage (Learning):** `#E5EAE2`
- **Tint Slate (Reading/Grammar):** `#E2E5E9`
- **Tint Rose (Practice/Speaking):** `#EFE3DE`

### 2.4 Mode Gelap (Dark Mode — Warm Espresso Night)
- **Background Utama:** `#161514` (warm deep obsidian)
- **Background Permukaan (Cards):** `#22201D` (warm dark charcoal)
- **Background Navigasi / Bar:** `#1B1917`
- **Teks Primer:** `#F5F2EB` (soft parchment white)
- **Teks Sekunder:** `#A8A196` (muted warm gray)
- **Border:** `#3D3934`
- **Aksen Gold:** `#E5B24D`
- **Aksen Navy/Slate:** `#6C85A3`
- **Aksen Green:** `#7CA263`
- **Aksen Berry:** `#B86B70`

---

## 3. Garis, Sudut, & Bayangan (Borders, Radii, Shadows)

### 3.1 Border & Radius
- **Border Widths:**
  - Tipis (Tombol, Badge, Input): `1px solid var(--color-border)`
  - Tebal (Kartu, Kontainer, Panel): `2px solid var(--color-border)`
- **Border Radius:**
  - Full / Pill (Tombol, Badge, Filter Chips): `9999px`
  - Large (Kartu, Dialog, Lembar Latihan): `20px`
  - Medium (Input Form, Box Interaktif): `12px`
  - Small (Indikator Kecil): `8px`

### 3.2 Bayangan Khas (Neobrutalist Hard Offset Shadows)
Tidak menggunakan gaussian blur, melainkan bayangan padat terproyeksi ke kanan-bawah:
- **Shadow Tombol / Kontrol Interaktif:** `4px 4px 0px 0px rgba(86, 52, 0, 0.25)` (saat ditekan/aktif: bergeser `translate(2px, 2px)` dan shadow mengecil jadi `2px 2px 0px 0px`).
- **Shadow Kartu:** `6px 6px 0px 0px rgba(86, 52, 0, 0.25)`
- **Shadow Kartu Berwarna:**
  - Kartu Gold: `6px 6px 0px 0px #C99A3B`
  - Kartu Sage: `6px 6px 0px 0px #5F7A4B`
  - Kartu Navy: `6px 6px 0px 0px #4B5E73`

---

## 4. Layout, Spacing, & Breakpoints

- **Lebar Kontainer Maksimum:** `1200px` (dengan padding horizontal responsif: `16px` di mobile, `24px` di tablet, `32px` di desktop).
- **Skala Spacing:**
  - `space-1`: 4px
  - `space-2`: 8px
  - `space-3`: 12px
  - `space-4`: 16px
  - `space-6`: 24px
  - `space-8`: 32px
  - `space-12`: 48px
  - `space-16`: 64px
- **Breakpoints Responsif:**
  - Mobile Small: `< 480px`
  - Tablet: `481px – 768px`
  - Laptop / Desktop: `769px – 1024px`
  - Large Desktop: `> 1024px`

---

## 5. Implementasi CSS Variables

```css
:root {
  /* Typography */
  --font-heading: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-editorial: "Fraunces", Georgia, "Times New Roman", serif;
  --font-body: "Quicksand", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;

  /* Color Palette - Light Mode */
  --color-bg-base: #F4F0E8;
  --color-bg-nav: #F9F7F2;
  --color-bg-surface: #FFFFFF;
  --color-bg-footer: #ECE4CF;
  --color-bg-subtle: #F1ECE1;

  /* Card Tint Variations */
  --color-tint-sand: #F6EFE0;
  --color-tint-sage: #E5EAE2;
  --color-tint-slate: #E2E5E9;
  --color-tint-rose: #EFE3DE;

  /* Ink & Typography Colors */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #736B61;
  --color-text-inverse: #FFFFFF;

  /* Accent & Functional Colors */
  --color-accent-gold: #C99A3B;
  --color-accent-gold-hover: #B8892D;
  --color-accent-navy: #4B5E73;
  --color-accent-navy-hover: #3E4E60;
  --color-success: #5F7A4B;
  --color-danger: #8C4A4E;
  --color-warning: #D4973B;

  /* Borders & Shadows */
  --color-border: #1A1A1A;
  --border-width-sm: 1px;
  --border-width-lg: 2px;
  --border-sm: var(--border-width-sm) solid var(--color-border);
  --border-lg: var(--border-width-lg) solid var(--color-border);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-pill: 9999px;

  --shadow-color: rgba(86, 52, 0, 0.25);
  --shadow-btn: 4px 4px 0px 0px var(--shadow-color);
  --shadow-btn-hover: 2px 2px 0px 0px var(--shadow-color);
  --shadow-card: 6px 6px 0px 0px var(--shadow-color);
  --shadow-card-gold: 6px 6px 0px 0px var(--color-accent-gold);
  --shadow-card-sage: 6px 6px 0px 0px var(--color-success);
  --shadow-card-navy: 6px 6px 0px 0px var(--color-accent-navy);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --color-bg-base: #161514;
  --color-bg-nav: #1B1917;
  --color-bg-surface: #22201D;
  --color-bg-footer: #181715;
  --color-bg-subtle: #2C2925;

  --color-tint-sand: #2A261F;
  --color-tint-sage: #232B21;
  --color-tint-slate: #20262E;
  --color-tint-rose: #2E2221;

  --color-text-primary: #F5F2EB;
  --color-text-secondary: #A8A196;
  --color-text-inverse: #1A1A1A;

  --color-accent-gold: #E5B24D;
  --color-accent-gold-hover: #D69E35;
  --color-accent-navy: #6C85A3;
  --color-accent-navy-hover: #597391;
  --color-success: #7CA263;
  --color-danger: #B86B70;
  --color-warning: #E8AA4C;

  --color-border: #3D3934;
  --shadow-color: rgba(0, 0, 0, 0.6);
  --shadow-btn: 4px 4px 0px 0px var(--shadow-color);
  --shadow-btn-hover: 2px 2px 0px 0px var(--shadow-color);
  --shadow-card: 6px 6px 0px 0px var(--shadow-color);
  --shadow-card-gold: 6px 6px 0px 0px #E5B24D;
  --shadow-card-sage: 6px 6px 0px 0px #7CA263;
  --shadow-card-navy: 6px 6px 0px 0px #6C85A3;
}
```

