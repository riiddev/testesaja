# Fase 2 — Setup Neon + Vercel Preview

**Project:** SinauEnglish V2  
**Repository:** riiddev/testesaja  
**Branch:** feat/neon-migration  
**Status:** persiapan repository selesai sebagian; menunggu pembuatan project/branch Neon dan pengisian nilai rahasia oleh pemilik akun.

## Batas aman

- Semua koneksi database untuk langkah ini harus menunjuk ke Neon branch development, bukan Production.
- Jangan menaruh connection string atau Better Auth secret di chat, GitHub, file yang di-commit, screenshot, atau log.
- Vercel Environment Variables yang dibuat pada fase ini dibatasi ke Preview + Git Branch feat/neon-migration.
- Jangan mengubah atau menghapus variable SINAI_APPS_SCRIPT_URL yang sekarang dipakai legacy.
- Jangan menjalankan scripts/init-production-db.mjs, db:init:prod, execute-purge scripts, atau perintah reset/drop/truncate.
- Data Neon yang sudah ada tidak boleh dihapus. Sebelum migration pertama, pastikan target adalah branch development baru dan inventarisasi tabel yang sudah ada.
- Production environment variables dan deployment Production tidak disentuh.

## A. Buat atau pilih Neon project

1. Buka https://console.neon.tech dan masuk ke akun Neon.
2. Periksa project yang sudah ada lebih dulu. Jangan membuat project duplikat bila project SinauEnglish untuk migrasi sudah ada; bila ada project yang pernah dipakai dan berisi data, jangan reset atau pakai sebelum statusnya diperiksa.
3. Untuk project baru, pilih Create project.
4. Nama yang disarankan: sinauuenglish-v2.
5. Plan: Free.
6. Region: AWS Singapore (ap-southeast-1).
7. PostgreSQL version: pilih versi stabil yang tersedia (disarankan 17 jika tersedia di region itu).
8. Buat project. Pertahankan default branch awal sebagai parent; jangan menjalankan schema migration terhadapnya.

## B. Buat branch development

1. Dari project yang benar, buka Branches.
2. Pilih Create branch.
3. Nama branch: development.
4. Parent branch: default branch project yang baru dibuat.
5. Pastikan branch memiliki satu compute endpoint Read-write.
6. Pertahankan ukuran compute minimum/default Free; tidak perlu autoscaling besar.
7. Jangan membuat banyak branch sementara. Satu branch development ini dipakai untuk Preview selama fase stabilisasi.

## C. Ambil dua connection string

1. Pilih branch development.
2. Klik Connect.
3. Pilih database dan role yang dibuat untuk project.
4. Aktifkan opsi Pooled connection, lalu salin connection string. Simpan sebagai DATABASE_URL.
   - Hostname harus mengandung -pooler.
   - Ini adalah URL runtime untuk Vercel Functions dan koneksi aplikasi.
5. Pada modal yang sama, nonaktifkan Pooled connection, lalu salin connection string direct. Simpan sebagai DATABASE_URL_UNPOOLED.
   - Hostname tidak mengandung -pooler.
   - Ini khusus migrasi Drizzle, pg_dump, dan pg_restore.
6. Simpan kedua URL ke file .env lokal pada root repository. Jangan mengirimkannya ke chat.
7. Jangan memasukkan DATABASE_URL_UNPOOLED ke Vercel Functions; direct URL memiliki hak koneksi yang lebih luas dan tidak dibutuhkan runtime.

## D. Isi Vercel Preview khusus branch

Project Vercel yang teridentifikasi:
- Team: Thoodev (Hobby)
- Project: sinauuenglish
- Git repository: riiddev/testesaja
- Preview branch: feat/neon-migration
- Alias Preview stabil: https://sinauuenglish-git-feat-neon-migration-thoodev.vercel.app

1. Buka https://vercel.com/thoodev/sinauuenglish/settings/environment-variables.
2. Pilih Add New.
3. Untuk setiap variable, set Target = Preview dan Git Branch = feat/neon-migration. Jangan memilih Production atau Development.
4. Tambahkan variable berikut:

| Key | Value | Catatan |
|---|---|---|
| DATABASE_URL | pooled connection string dari branch Neon development | Runtime API |
| BETTER_AUTH_SECRET | secret random baru minimal 32 byte | Generate lokal dengan perintah di bawah; dipakai saat Better Auth diimplementasikan pada Fase 3 |
| BETTER_AUTH_URL | https://sinauuenglish-git-feat-neon-migration-thoodev.vercel.app | URL auth untuk alias branch Preview |

5. Generate BETTER_AUTH_SECRET secara lokal melalui PowerShell/Terminal (jangan kirim hasilnya ke chat):

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

6. Simpan variable. Nilai secret bertipe Sensitive/Encrypted jika opsi tersedia.
7. Biarkan SINAI_APPS_SCRIPT_URL yang sudah ada. Jangan mengedit scope variable legacy.
8. Setelah environment variables disimpan, lakukan Redeploy pada deployment Preview terbaru dari branch feat/neon-migration. Variable Vercel baru hanya berlaku untuk deployment berikutnya; deployment lama tidak otomatis berubah.

## E. Verifikasi lokal

Di folder repository pada branch feat/neon-migration:

1. Jalankan npm ci.
2. Buat file .env lokal dari .env.example dan isi DATABASE_URL serta DATABASE_URL_UNPOOLED dari branch development.
3. Jalankan npm run db:check.
   - Pooled URL wajib CONNECTED.
   - Direct URL harus CONNECTED sebelum migrasi.
   - Output checker tidak menampilkan URL, password, hostname, atau pesan error mentah.
4. Pastikan branch yang dipilih di Neon Console benar-benar development. Jika ada tabel atau data yang tidak diharapkan, berhenti dan laporkan; jangan drop/truncate.
5. Setelah verifikasi target aman, jalankan npm run db:migrate untuk menerapkan migration yang sudah ada di folder drizzle.
6. Jalankan npm run db:check kembali.
7. Jalankan npm run db:seed untuk mengisi katalog item awal yang bersifat idempoten.
8. Periksa di Neon Tables bahwa tabel inti dibuat dan katalog berisi item awal. Jangan menampilkan data akun atau credential.
9. Jangan menjalankan skrip backup JSON lama sebagai backup disaster-recovery. Strategi pg_dump dan pg_restore akan disiapkan/dibuktikan sebagai bagian operasional sebelum penggunaan data nyata.

## F. Yang sudah tersedia di repository

- db/schema.js: schema Drizzle untuk tabel aplikasi.
- drizzle/0000_init_neon_schema.sql: migration schema awal.
- drizzle/0001_auth_rate_limits.sql: migration tabel rate limiting.
- drizzle/meta/_journal.json: journal migration.
- scripts/check-db-connection.mjs: pemeriksa koneksi pooled dan direct yang tidak mencetak detail koneksi.
- scripts/seed-catalog.mjs: seed katalog idempoten.
- drizzle.config.js: memakai DATABASE_URL_UNPOOLED terlebih dahulu untuk migration.
- vercel.json: mengarahkan Vercel Functions pada region Singapore (sin1).
- .env.example: contoh nama variable pooled/direct dan konfigurasi auth.

## G. Kriteria selesai Fase 2

- [ ] Neon project Free telah dibuat/dikonfirmasi pada region Singapore.
- [ ] Neon branch development dengan endpoint read-write aktif.
- [ ] Pooled dan direct connection string tersimpan dengan scope benar; tidak pernah diposting ke chat/Git.
- [ ] Vercel variable DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL hanya untuk Preview branch feat/neon-migration.
- [ ] Environment variable legacy Apps Script tidak dihapus/diubah.
- [ ] Preview deployment dari branch ini memakai region sin1.
- [ ] npm run db:check lolos untuk pooled dan direct.
- [ ] Migration Drizzle berhasil diterapkan pada development branch yang sudah dipastikan aman.
- [ ] Seed katalog berhasil dan jumlah item diverifikasi.
- [ ] Main dan Production tetap tidak berubah.

## H. Dampak kuota

- Membuat satu project dan satu development branch menggunakan batas jumlah project/branch Neon, serta compute ketika endpoint aktif.
- Schema migration dan seed hanya menghasilkan query dalam waktu singkat; jangan menjalankan ping/cron untuk menahan database aktif.
- Setiap redeploy Preview menggunakan build/invocation kuota Vercel; tidak ada penggunaan layanan berbayar yang direncanakan.
- Belum ada database size/compute baseline karena project belum dibuat atau belum diberikan akses untuk diperiksa.

## Sumber resmi

- Neon Console dan project: https://console.neon.tech
- Neon create project: https://neon.com/docs/manage/projects
- Neon branch management: https://neon.com/docs/manage/branches
- Neon connection strings: https://neon.com/docs/connect/connect-from-any-app
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling
- Drizzle migrations: https://orm.drizzle.team/docs/migrations
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel regions: https://vercel.com/docs/functions/configuring-functions/region
