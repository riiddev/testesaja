# SinauuEnglish — akun dan sinkronisasi Google Sheets

SinauuEnglish memakai **Google Sheets sebagai penyimpanan akun dan progres**, dengan API server-side pada Vercel. Tidak ada Supabase. Browser tidak pernah menerima private key service account atau rahasia penandatanganan sesi.

## Arsitektur

- **Google Sheets** menyimpan akun dan snapshot progres.
- **Vercel Functions** menangani pendaftaran, login, validasi sesi, dan akses baris progres.
- **Kata sandi** disimpan sebagai hash PBKDF2 dengan salt unik; kata sandi asli tidak ditulis ke spreadsheet.
- **Progres lokal tetap utama saat belajar**. Sinkronisasi dilakukan setelah ada perubahan, dan progres akun dibaca saat masuk pada perangkat baru.
- Snapshot progres dikompresi dan dipecah menjadi beberapa sel untuk menghindari batas ukuran 50.000 karakter per sel Google Sheets.

Catatan: Google Sheets bukan database transaksional. Sistem ini paling cocok untuk aplikasi belajar skala kecil/awal. Latensi dan kuota Google API tetap berlaku. Akun tidak membutuhkan email verifikasi pada versi ini; pemulihan kata sandi otomatis belum aktif.

## 1. Buat spreadsheet dan tab

1. Buat Google Spreadsheet baru.
2. Ubah nama tab pertama menjadi `Accounts`.
3. Tambahkan tab kedua bernama `LearningStates`.
4. Jangan isi header secara manual; aplikasi akan membuat header pada permintaan pertama.

Tab `Accounts` menyimpan ID pengguna, email, hash kata sandi, dan timestamp. Tab `LearningStates` menyimpan satu snapshot per ID pengguna; kolom snapshot dipecah ke beberapa bagian.

## 2. Buat service account Google

1. Buka [Google Cloud Console](https://console.cloud.google.com/), lalu buat project.
2. Pada APIs & Services → Library, aktifkan **Google Sheets API**.
3. Buka IAM & Admin → Service Accounts, lalu buat service account.
4. Buat JSON key untuk service account dan simpan secara privat. Jangan commit file JSON itu ke GitHub atau mengirimkan private key di chat.
5. Buka spreadsheet yang dibuat pada langkah pertama, tekan Share, lalu bagikan sebagai **Editor** kepada alamat email service account (field `client_email` pada JSON).

Google Sheets tetap menjadi database. Service account hanya menjadi identitas server untuk membaca dan menulis spreadsheet tersebut.

## 3. Konfigurasi environment variables Vercel

Di Vercel → project SinauuEnglish → Settings → Environment Variables, tambahkan variabel berikut untuk Production dan Preview:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: nilai `client_email` dari JSON service-account.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: nilai `private_key` dari JSON. Masukkan keseluruhan key, termasuk baris BEGIN/END; bila ditempel sebagai satu baris, pertahankan newline sebagai `\n`.
- `GOOGLE_SHEETS_SPREADSHEET_ID`: ID spreadsheet dari URL `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
- `SINAUU_SESSION_SECRET`: rahasia acak panjang, minimal 32 karakter. Buat sendiri dan simpan hanya di Vercel.

**Jangan** beri awalan `VITE_` pada variabel ini. Variabel server tidak boleh masuk ke bundel browser. Jangan pernah membuat spreadsheet publik atau membagikan akses Editor kepada semua orang.

Setelah semua variabel terisi, jalankan Redeploy agar API membaca konfigurasi terbaru.

## 4. Tes akun dan sinkronisasi

1. Buka [SinauuEnglish](https://sinauuenglish.vercel.app/belajar.html), lalu buat akun.
2. Pastikan baris akun baru muncul di tab `Accounts`; yang tersimpan adalah hash kata sandi, bukan kata sandi aslinya.
3. Selesaikan latihan agar progres berubah. Setelah badge menunjukkan sinkron, periksa tab `LearningStates`.
4. Buka situs di perangkat/browser lain lalu masuk memakai email dan kata sandi yang sama.
5. Saat logout, data lokal sesi dibersihkan agar progres akun tidak bercampur. Data di spreadsheet tidak dihapus.

## Batasan yang perlu diketahui

- Pemulihan kata sandi lewat email belum aktif karena sistem ini tidak menggunakan penyedia email. Jangan hilangkan atau mengubah baris akun untuk mencoba memulihkan progres.
- Versi awal ini tidak mengirim email verifikasi; pendaftaran hanya memeriksa format email.
- Progres disinkronkan saat perangkat online. Belajar tetap dapat dilakukan secara lokal jika jaringan putus, tetapi perubahan baru tersedia di perangkat lain setelah berhasil disinkronkan.
- Sheets API memiliki kuota dan dapat lebih lambat dari database khusus. Untuk mengurangi request, data disimpan sebagai satu snapshot terkompresi per pengguna dan sync di-debounce.
- Simpan salinan cadangan spreadsheet secara berkala. Jangan mengedit kolom snapshot secara manual.
