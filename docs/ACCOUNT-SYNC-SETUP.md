# SinauuEnglish — akun dan sinkronisasi Google Sheets

SinauuEnglish mempertahankan aplikasi belajar yang sudah ada dan menggunakan Google Apps Script sebagai lapisan server untuk Google Sheets. Tidak ada Supabase dan tidak perlu membuat Google Cloud service account untuk konfigurasi ini.

## Environment Variables Vercel

Pada proyek Vercel **sinauuenglish** (yang terhubung ke `riiddev/testesaja`), isi variabel berikut untuk Production dan Preview:

- `SINAI_APPS_SCRIPT_URL`: URL Web App Apps Script yang berakhir dengan `/exec`.
- `SINAI_API_KEY`: rahasia yang sama dengan yang dikonfigurasi pada Apps Script. Simpan sebagai Secret/Sensitive, jangan pernah menaruhnya pada frontend atau repository.
- `SINAI_SESSION_SECRET` (opsional): rahasia acak minimal 32 karakter khusus untuk menandatangani sesi. Jika tidak diisi, server menurunkan kunci sesi dari `SINAI_API_KEY`.

Jangan menggunakan prefix `VITE_` untuk rahasia server. Setelah variabel ditambahkan atau diubah, buat deployment baru agar fungsi API menerima konfigurasi terbaru.

## Cara kerja

- Pendaftaran dan login diproses oleh API server di Vercel.
- Hash kata sandi dan salt disimpan di penyimpanan akun yang dikelola Apps Script; kata sandi asli tidak dikirim ke spreadsheet.
- Progres belajar disimpan sebagai snapshot terkompresi per akun, sehingga data bisa dimuat kembali saat pengguna masuk dari perangkat lain.
- Progres lokal tetap dipakai ketika pengguna belajar. Jika jaringan sedang tidak tersedia, sinkronisasi perlu dicoba lagi ketika online.
- Snapshot progres menggunakan ID internal dengan prefix `sinau_state_v1_`. Jangan mengedit atau menghapus record berawalan tersebut secara manual.

## Pemeriksaan setelah deployment

1. Buka `/api/account?action=status`. Respons yang benar memuat `ready: true`.
2. Buat akun uji dengan email yang belum terdaftar; pastikan baris akun muncul di spreadsheet.
3. Lakukan latihan lalu tunggu indikator sinkronisasi berhasil.
4. Buka situs pada browser/perangkat lain dan masuk menggunakan akun uji yang sama. Pastikan progres muncul.
5. Sebelum pemakaian luas, uji juga logout/login dan simpan backup progres lokal.

## Batasan

Google Sheets bukan basis data transaksional. Untuk aplikasi belajar skala kecil, arsitektur ini meminimalkan layanan tambahan, tetapi tetap bergantung pada kuota dan waktu eksekusi Apps Script. Pemulihan kata sandi via email belum tersedia pada versi ini. Simpan cadangan spreadsheet dan backup progres secara berkala.
