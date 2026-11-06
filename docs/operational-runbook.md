# SINAUENGLISH V2 — RUNBOOK OPERASIONAL PRODUKSI

Dokumen ini adalah panduan komprehensif untuk pengoperasian, peluncuran (*cutover*), pencadangan data (*backup*), pemulihan (*disaster recovery*), dan pemantauan biaya Rp0/bulan untuk **SinauEnglish V2**.

---

## 1. Arsitektur Sistem Produksi

```
[ Pelajar / Web Browser / Mobile ]
                 │
                 ▼ HTTPS
┌──────────────────────────────────────────────┐
│ Vercel Edge Global Network                   │
│ ├─ Static Bundle (React 19 + Vite SPA)      │
│ └─ Serverless Functions (/api/*, Node.js 20) │
└──────────────────────┬───────────────────────┘
                       │ TLS 1.3 / Pooled Connection (PgBouncer)
                       ▼
┌──────────────────────────────────────────────┐
│ Neon Serverless PostgreSQL                   │
│ ├─ Region: AWS Singapore (ap-southeast-1)    │
│ ├─ Branch: production (Default)              │
│ └─ Storage: 18 Tabel Terindeks               │
└──────────────────────────────────────────────┘
```

- **Target Biaya Operasional:** **Rp0 / bulan** (100% Free Tier selamanya).
- **Latensi Database:** $\le 80$ ms ke region Asia Tenggara (AWS Singapore `ap-southeast-1`).
- **Otentikasi:** Server-Authoritative Token Session dengan Argon2id / SHA-256 HMAC & Salt.

---

## 2. Environment Variables di Vercel Dashboard

Buka **Vercel Dashboard** -> Pilih Proyek **SINAUENGLISHV2** -> Masuk ke menu **Settings** -> **Environment Variables**. Masukkan 5 kunci berikut:

| Nama Variabel | Lingkungan | Nilai yang Direkomendasikan | Catatan |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Production & Preview | `postgresql://neondb_owner:***@ep-***-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Gunakan **Pooled Connection** dari branch `production` Neon |
| `BETTER_AUTH_SECRET` | Production & Preview | *(String acak 32+ karakter, misal: `7k9Xv2Pq4Lm8Zs1Ww3Yt5Rt6Fh0Jk2Nm`)* | Kunci enkripsi token sesi server |
| `BETTER_AUTH_URL` | Production | `https://sinauenglish.vercel.app` *(sesuaikan domain Anda)* | URL publik aplikasi |
| `VITE_ENABLE_MOCK` | Production & Preview | `false` | **WAJIB `false`!** Melarang mode simulasi palsu di produksi |
| `VITE_API_URL` | Production & Preview | `""` *(string kosong)* | Memastikan seluruh fetch memanggil Vercel Functions lokal `/api/*` |

> [!IMPORTANT]
> Jangan pernah memasukkan URL Google Apps Script ke `VITE_API_URL` pada lingkungan produksi baru. Biarkan kosong agar seluruh lalu lintas rute berjalan melalui backend Neon PostgreSQL yang aman.

---

## 3. Strategi Branching Database di Neon

Neon mendukung branching database instan tanpa downtime. Kami membagi database menjadi dua cabang:

1. **`production` (Default Branch):**
   - Menampung data pengguna nyata.
   - Dilindungi dari reset otomatis.
   - Otomatis tersambung ke deployment Vercel Production.

2. **`development` (Child Branch):**
   - Digunakan untuk pengujian lokal dan automated test suite (`npm run test:all`).
   - Dapat di-reset atau di-recreate kapan saja tanpa memengaruhi pengguna produksi.

### Inisialisasi Branch `production` (Jika baru dibuat):
Jika Anda membuat branch baru untuk produksi, jalankan skrip inisialisasi schema 18 tabel dan katalog otomatis:
```bash
node scripts/init-production-db.mjs --url="postgresql://neondb_owner:***@ep-***-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```
Skrip ini bersifat **idempoten** (`CREATE TABLE IF NOT EXISTS` dan `ON CONFLICT DO UPDATE`), sehingga aman dijalankan berulang kali.

---

## 4. Prosedur Backup & Disaster Recovery

### A. Pencadangan Otomatis Mingguan (GitHub Actions)
- Telah dikonfigurasi melalui [`.github/workflows/db-backup.yml`](file:///d:/VIBE%20CODE%20ANTI%20GRAFITY/SINAUENGLISHV2/.github/workflows/db-backup.yml).
- **Jadwal:** Berjalan setiap hari Minggu pukul 02:00 UTC (09:00 WIB).
- **Hasil Backup:** Diunggah sebagai *Artifact* terenkripsi di GitHub Actions dengan retensi 30 hari.
- **Pemicu Manual:** Dapat dijalankan kapan saja dari tab **Actions** -> **Neon Database Backup** -> **Run workflow**.

### B. Pencadangan Mandiri Lokal (On-Demand)
Untuk membuat salinan cadangan sebelum pemeliharaan besar:
```bash
npm run db:backup
```
- Salinan JSON lengkap dari seluruh 18 tabel akan disimpan di folder `backups/backup-<TIMESTAMP>.json`.
- Folder `backups/` telah dilindungi oleh [`.gitignore`](file:///d:/VIBE%20CODE%20ANTI%20GRAFITY/SINAUENGLISHV2/.gitignore) sehingga tidak akan pernah bocor ke publik.

### C. Pemulihan Database (Restore)
1. **Simulasi Dry-run (Memeriksa integritas file tanpa menulis):**
   ```bash
   npm run db:restore -- --dry-run
   ```
2. **Eksekusi Pemulihan Nyata:**
   ```bash
   npm run db:restore -- --file=backups/backup-2026-11-05T06-51-48-072Z.json
   ```

### D. Neon Instant Point-In-Time Restore (PITR)
Jika terjadi kesalahan fatal data di produksi, Neon Free Tier menyediakan history restore instan hingga 24 jam terakhir:
1. Buka dashboard Neon -> Masuk ke menu **Branches**.
2. Klik tombol **Create child branch**.
3. Pilih opsi **Restore to point in time**, lalu pilih jam/menit sebelum insiden terjadi.
4. Ganti `DATABASE_URL` di Vercel ke branch hasil pemulihan tersebut. Selesai dalam < 1 menit tanpa kehilangan data.

---

## 5. Monitoring Kuota & Pemeliharaan Rp0 / Bulan

| Layanan | Batas Gratis (Free Tier) | Estimasi Penggunaan SinauEnglish | Status |
| :--- | :--- | :--- | :---: |
| **Neon Storage** | 0.5 GiB (512 MB) | $\approx 2.5\text{ MB}$ (10.000 pelajar aktif dengan 500k baris SRS) | **Sangat Aman (< 1%)** |
| **Neon Compute** | 100 CU-hours / bulan | $\approx 3 - 5\text{ CU-hours / bulan}$ (Auto-suspend 5 menit saat idle) | **Sangat Aman (< 5%)** |
| **Vercel Bandwidth**| 100 GB / bulan | $\approx 4\text{ GB / bulan}$ (Aset di-cache dengan header Cache-Control) | **Sangat Aman (< 5%)** |
| **Vercel Function** | 100.000 request / hari | $\approx 2.000 - 5.000\text{ request / hari}$ (Berkat offline-first sync) | **Sangat Aman (< 5%)** |

> [!TIP]
> Fitur **Auto-suspend (5 menit)** pada Neon compute secara otomatis menidurkan mesin serverless ketika tidak ada request belajar. Begitu ada request baru, Neon bangun kembali dalam hitungan $\approx 500\text{ ms}$, menjaga penggunaan CU tetap mendekati 0 saat malam hari.

---

## 6. Prosedur Cutover (Peluncuran Resmi)

Langkah-langkah saat Anda siap meluncurkan versi baru:

1. **Jalankan Verifikasi Lengkap Terakhir di Lokal:**
   ```bash
   npm run test:all
   npm run test:e2e
   ```
2. **Keluarkan Salinan Cadangan Final:**
   ```bash
   npm run db:backup
   ```
3. **Review & Merge Pull Request ke `main`:**
   - Seluruh kode fitur dan backend baru berada di branch `feat/neon-migration`.
   - Branch `main` sama sekali belum berubah.
   - Buat PR dari `feat/neon-migration` ke `main` di GitHub.
   - Merge PR ke `main` setelah review selesai.
4. **Deploy Otomatis oleh Vercel:**
   - Vercel akan mendeteksi push ke `main`, menjalankan build, dan mempublikasikan versi baru secara global.
5. **Verifikasi Smoke Test di Browser:**
   - Buka URL produksi.
   - Buat akun baru (pastikan mulai dari level 1, 0 XP, 0 koin).
   - Kerjakan 1 kartu kosakata (pastikan badge status sinkronisasi berubah menjadi hijau "Tersimpan").
   - Buka menu Riwayat Latihan (`/belajar/riwayat`) untuk memastikan log aktivitas tercatat di server.

---

## 7. Rencana Rollback Darurat (Jika Diperlukan)

Jika ditemukan anomali tak terduga setelah cutover:
1. **Rollback Instan Vercel (Durasi: 5 Detik):**
   - Buka **Vercel Dashboard** -> **Deployments**.
   - Cari deployment sebelum merge `main`.
   - Klik menu titik tiga (...) -> Pilih **Instant Rollback**.
   - Trafik langsung kembali ke versi sebelumnya tanpa perlu build ulang.
2. **Database Rollback:**
   - Gunakan fitur PITR Neon atau jalankan skrip `npm run db:restore`.

