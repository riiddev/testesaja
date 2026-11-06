# Dokumentasi PWA & Notifikasi Misi Harian SinauEnglish V2

Dokumen ini menjelaskan arsitektur Progressive Web App (PWA), strategi Service Worker, dan mekanisme notifikasi pengingat misi harian pada SinauEnglish V2.

---

## 1. Ikhtisar & Arsitektur PWA

SinauEnglish V2 dirancang sebagai Progressive Web App yang memenuhi standar instalasi PWA modern pada Android (Chrome/Edge/Samsung Internet), iOS/iPadOS (Safari 16.4+), dan Desktop (Chromium/Firefox/Safari).

### Aset Kunci PWA:
1. **Web App Manifest (`public/manifest.json`)**:
   - `display: standalone` untuk antarmuka layar penuh tanpa chrome peramban.
   - Ikon adaptif: 192×192 px, 512×512 px, dan SVG maskable dengan latar belakang `#2c2825`.
   - App Shortcuts langsung ke:
     - 🎯 Misi Harian (`/belajar/missions`)
     - 🔄 Review SRS (`/belajar/review`)
     - 🧩 Matching Konteks (`/belajar/matching`)
   - `theme_color: #1e1b18` dan `background_color: #f7f4ee`.

2. **Service Worker (`public/sw.js`)**:
   - **Cache-First** untuk static assets (CSS, JS, fonts, icon SVG).
   - **Network-First** dengan fallback offline shell untuk navigasi HTML (`/index.html`).
   - **Bypass Rule**: Permintaan dinamis ke Google Cloud Apps Script API (`script.google.com` dan `googleusercontent.com`) selalu dialirkan langsung tanpa caching untuk menjaga integritas data real-time.
   - **Event Notification**: Menangani `notificationclick` untuk memfokuskan tab aktif atau membuka jendela baru menuju rute `/belajar/missions`.

3. **Komposisi Hook React (`src/hooks/usePWA.js`)**:
   - Mendengarkan event `beforeinstallprompt` untuk menampilkan banner/tombol instalasi native di halaman Pengaturan.
   - Mengelola state izin notifikasi (`default`, `granted`, `denied`).
   - Mengatur preferensi jadwal pengingat (pagi 08:00 WIB dan malam 19:00 WIB) dan menyinkronkannya ke Cloud Settings pengguna.

---

## 2. Batasan Teknis & Pertimbangan Platform

### A. iOS / Safari (Apple)
- Notifikasi Web Push di iOS hanya didukung pada **iOS 16.4 ke atas**.
- Notifikasi **hanya dapat diaktifkan** setelah pengguna menambahkan aplikasi ke Layar Utama (Home Screen) melalui menu *Share > Add to Home Screen*.
- Pengambilan izin (`Notification.requestPermission()`) harus dipicu oleh interaksi gestur langsung pengguna (klik tombol), bukan saat halaman pertama kali dimuat.

### B. Lingkungan Serverless Cloud
- Google Apps Script tidak memiliki dedicated persistent background push engine untuk mengirim notifikasi push web secara push-down real-time.
- Solusi arsitektural yang diterapkan pada SinauEnglish V2 adalah:
  1. Izin notifikasi diminta secara eksplisit di menu **Pengaturan > Pengingat Misi di Ponsel**.
  2. Pengingat lokal dijalankan oleh Service Worker ketika peramban aktif atau saat pergantian tanggal (WIB).
  3. Konfigurasi jam pengingat (Pagi & Malam) tersinkronisasi ke tab `Settings` di cloud database.

---

## 3. Alur UX Permintaan Izin (Etika Akses)

Aplikasi **tidak pernah** menampilkan prompt izin notifikasi secara agresif saat pengguna pertama kali membuka aplikasi. Sebaliknya:
1. Pengguna membuka tab **Pengaturan**.
2. Tersedia kartu khusus **Pengingat Misi di Ponsel**.
3. Tombol **"Aktifkan Pengingat Misi Harian"** ditekan secara sadar oleh pengguna.
4. Muncul dialog izin resmi dari sistem operasi/browser.
5. Setelah disetujui, tombol otomatis berganti menjadi kontrol jam pengingat (Pagi & Malam) serta tombol uji coba instan (*"Kirim Notifikasi Uji Coba 🔔"*).

---

## 4. Format & Konten Notifikasi

Notifikasi dirancang konkret, ringkas, dan fokus pada aksi belajar:
- **Pengingat Pagi (08:00 WIB)**:
  - *Judul*: `🎯 Misi Harian SinauEnglish`
  - *Pesan*: `3 misi harian siap untukmu hari ini. Mulai 1 sesi untuk mengamankan streak belajarmu!`
  - *Aksi Klik*: Membuka layar `/belajar/missions`.
- **Pengingat Malam (19:00 WIB)**:
  - *Judul*: `🔥 Amankan Streak Belajarmu!`
  - *Pesan*: `Hari ini hampir berakhir. Tuntaskan misi harianmu sebelum pukul 00:00 WIB.`
  - *Aksi Klik*: Membuka layar `/belajar/missions`.

---

## 5. Cara Instalasi di Berbagai Perangkat

### Android (Chrome / Edge):
1. Buka aplikasi di peramban ponsel.
2. Ketuk ikon menu titik tiga (⋮) atau tombol **"Pasang Aplikasi SinauEnglish"** di tab Pengaturan.
3. Pilih **"Install app"** / **"Tambahkan ke Layar Utama"**.

### iPhone / iPad (iOS Safari 16.4+):
1. Buka aplikasi di Safari.
2. Ketuk tombol **Share** (kotak dengan panah ke atas) di bilah bawah browser.
3. Gulir ke bawah dan pilih **"Add to Home Screen"** (Tambahkan ke Layar Utama).
4. Buka aplikasi dari ikon di Layar Utama untuk menikmati tampilan layar penuh dan mengaktifkan notifikasi misi.

### Desktop (Chrome / Edge / Windows / Mac):
1. Buka aplikasi di Google Chrome atau Microsoft Edge.
2. Klik ikon monitor/instal di sebelah kanan bilah alamat (URL bar) atau tombol di menu Pengaturan.
3. Aplikasi akan berjalan di jendela mandiri tanpa gangguan tab lain.
