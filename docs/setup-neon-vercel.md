# Panduan Langkah Setup Neon PostgreSQL & Vercel Preview (Fase 2)

Panduan ini berisi langkah-langkah persis yang Anda lakukan langsung di dashboard **Neon Console** dan **Vercel Dashboard**.

> [!CAUTION]
> **ATURAN KEAMANAN UTAMA:**
> **Jangan pernah menempelkan connection string (`DATABASE_URL`), password, atau secret apa pun ke dalam chat ini.**
> Variabel rahasia hanya diisi di dashboard Vercel dan file lokal `.env` Anda sendiri (yang sudah masuk ke `.gitignore`).

---

## 1. Langkah di Neon Console (Database Region Singapore)

1. Buka browser dan login ke [console.neon.tech](https://console.neon.tech).
2. Klik tombol **"Create project"** (atau **"New Project"**):
   - **Project name:** Masukkan `sinauenglish-db`
   - **Postgres version:** Pilih `16` (versi stabil teruji)
   - **Region:** Wajib pilih **`Singapore (ap-southeast-1)`** *(region terdekat dengan latensi terendah untuk pengguna di Indonesia)*
3. Klik **"Create project"**. Neon akan membuat database default `neondb` dan branch root `main`.

---

## 2. Membuat Branch `development` di Neon

Sesuai aturan keamanan, semua uji coba dan preview dijalankan di branch terpisah agar branch `main` (produksi) tetap suci.

1. Pada menu navigasi sebelah kiri dashboard proyek Neon, klik **"Branches"**.
2. Klik tombol **"New Branch"**:
   - **Branch name:** Ketik `development`
   - **Parent branch:** Pilih `main`
3. Klik **"Create branch"**.
   *(Catatan: Branch baru ini menggunakan Copy-on-Write dan awalnya berukuran 0 byte).*

---

## 3. Mengambil Connection String (Pooled)

1. Di dashboard Neon, pastikan dropdown branch yang sedang aktif adalah **`development`** (bukan `main`).
2. Pada bagian **"Connection Details"**:
   - Centang opsi **"Pooled connection"** (ini menggunakan port 5432 dengan PgBouncer Neon).
   - Pastikan database yang terpilih adalah `neondb`.
3. Klik tombol **"Copy snippet"** atau salin Connection String yang berformat:
   ```text
   postgresql://[user]:[password]@[endpoint]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Simpan nilai ini di clipboard Anda atau di catatan lokal yang aman.

---

## 4. Mengisi Environment Variables di Dashboard Vercel

1. Buka [vercel.com](https://vercel.com) dan masuk ke dashboard proyek **SINAUENGLISHV2**.
2. Klik tab **"Settings"** di menu atas, lalu pilih **"Environment Variables"** di bilah kiri.
3. Tambahkan 3 variabel berikut satu per satu:

### Variabel 1: `DATABASE_URL`
- **Key:** `DATABASE_URL`
- **Value:** *(Tempel connection string pooled yang disalin dari Neon branch development di Langkah 3)*
- **Environments:** Centang **Preview** dan **Development** (⚠️ **JANGAN** centang Production dulu).
- Klik **"Save"**.

### Variabel 2: `BETTER_AUTH_SECRET`
- **Key:** `BETTER_AUTH_SECRET`
- **Value:** Masukkan string acak 32 karakter atau lebih (bisa dibuat secara lokal di terminal dengan perintah `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).
- **Environments:** Centang **Preview** dan **Development**.
- Klik **"Save"**.

### Variabel 3: `BETTER_AUTH_URL`
- **Key:** `BETTER_AUTH_URL`
- **Value:** `http://localhost:5173` *(untuk dev lokal, di Vercel preview Better Auth akan otomatis mendeteksi VERCEL_URL)*.
- **Environments:** Centang **Development** dan **Preview**.
- Klik **"Save"**.

---

## 5. Menyiapkan `.env` Lokal Anda (Opsional untuk Dev Lokal)

Jika Anda ingin menjalankan migrasi atau skrip cek koneksi dari komputer Anda:
1. Buat berkas baru bernama `.env` di folder root repositori (jika belum ada).
2. Isi dengan format berikut:
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   BETTER_AUTH_SECRET=[string_acak_32_karakter_anda]
   BETTER_AUTH_URL=http://localhost:5173
   ```
3. Berkas `.env` telah dipastikan terlindungi di `.gitignore` sehingga tidak akan pernah ter-push ke GitHub.

---

## 6. Uji Koneksi Tanpa Membocorkan Secret

Setelah Anda mengisi `DATABASE_URL` di `.env` lokal, Anda dapat memverifikasi koneksi dengan menjalankan perintah:
```bash
node scripts/check-db-connection.mjs
```
Skrip ini secara ketat **TIDAK MENCETAK** connection string, username, atau password. Skrip hanya akan menampilkan nama database dan latensi koneksi (misal: `✓ Terhubung ke neondb di Singapore (Latensi: 42 ms)`).
