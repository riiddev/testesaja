# Arsitektur dan Keputusan Teknis — SINAUENGLISHV2 → Neon + Vercel

**Tanggal riset:** 6 November 2026  
**Repository:** https://github.com/riiddev/testesaja  
**Branch kerja:** `feat/neon-migration`  
**Tahap:** Fase 1 — rancangan selesai, menunggu persetujuan keputusan pengguna  
**Ruang lingkup:** riset dan dokumentasi saja. Tidak ada perubahan source aplikasi, database Neon, Environment Variables Vercel, atau Production.

> Harga, kuota, lokasi region, dan fitur layanan dapat berubah. Angka di bawah diverifikasi dari dokumentasi resmi yang diakses pada 6 November 2026. Ringkasan kuota disimpan terpisah di [docs/kuota.md](./kuota.md).

---

## 1. Ringkasan keputusan yang direkomendasikan

**Rekomendasi default: Better Auth open-source (self-hosted) di Vercel Functions + Neon PostgreSQL + Drizzle ORM.**

| Komponen | Rekomendasi | Alasan utama |
|---|---|---|
| Database | Neon PostgreSQL Free | PostgreSQL standar, branching, autosuspend, dan kuota cukup untuk tahap awal aplikasi kecil |
| API | Vercel Functions | Mempertahankan React/Vite dan folder `api/` yang sudah digunakan |
| Region | Neon Singapore `ap-southeast-1` + Vercel Singapore `sin1` | Menempatkan function dekat database; Hobby dapat memilih satu region |
| Auth | Better Auth self-hosted | Bisa dikustomisasi, reset link 1 jam, session revocation, adapter Drizzle, dan cookie HttpOnly |
| ORM | Drizzle | Sudah digunakan di repo; schema dan migration SQL tersimpan di Git |
| Driver query biasa | Neon HTTP | Cocok untuk query singkat dan transaksi non-interaktif; dapat mengirim beberapa query sebagai satu batch |
| Driver transaksi interaktif | Neon WebSocket/Pool hanya bila dibutuhkan | Diperlukan untuk session/interactive transaction dan kompatibilitas `pg` yang lebih penuh |
| Avatar | PostgreSQL `bytea` WebP ≤35 KiB | Foto kecil; satu sumber data; penghapusan akun bisa memakai FK/cascade |
| Backup | `pg_dump` lokal terenkripsi + uji `pg_restore` | Instant restore Neon Free hanya 6 jam dan tidak menggantikan backup jangka panjang |

Keputusan ini **belum dianggap disetujui** sampai pengguna menyetujuinya. Fase 2 belum dimulai.

---

## 2. Perbandingan opsi autentikasi

| Aspek | A. Neon Managed Better Auth | B. Better Auth self-hosted di Vercel | C. Custom auth yang sekarang |
|---|---|---|---|
| Pengelola | Neon mengelola server auth | Auth berjalan di API Vercel milik aplikasi | Seluruh alur dikelola source aplikasi |
| Biaya | Termasuk Neon Free hingga 60.000 MAU/proyek | Tidak ada biaya lisensi terpisah; memakai kuota Neon dan Vercel | Tidak ada biaya lisensi; memakai kuota Neon dan Vercel |
| Frontend | SDK Neon untuk React/Vite | Better Auth client untuk React | Hook dan API client yang sudah ada |
| Sesi | Dikelola layanan Neon; data auth berada di schema `neon_auth` | Cookie session dikelola Better Auth dan disimpan sesuai adapter | Tabel `sessions` dan token custom |
| Kustomisasi | Mengikuti fitur dan plugin yang didukung Neon | Konfigurasi, adapter, hook, dan plugin Better Auth | Bebas, tetapi semua perilaku dan pengamanan ditanggung proyek |
| Reset password | Link reset bawaan berlaku 15 menit | TTL dapat ditetapkan 3.600 detik (1 jam) | Token, lifecycle, rate limit, email, dan revoke dibuat sendiri |
| Transaksi | Auth dikelola Neon | Adapter Drizzle dapat menggunakan transaksi | Harus diimplementasikan dan diuji sendiri |
| Integrasi API saat ini | Perlu adaptasi validasi identitas/JWT ke API Vercel | Dapat dipasang pada `/api/auth/*`; API belajar tetap di Vercel | Perubahan lebih kecil pada awalnya |
| Kecocokan dengan kebutuhan saat ini | Valid, tetapi kurang fleksibel untuk aturan reset 30–60 menit dan handler khusus | **Paling sesuai** | Opsi cadangan bila integrasi Better Auth gagal dalam pengujian |

### A. Neon Managed Better Auth

Kelebihan:
- Auth terintegrasi dengan Neon; pengguna, sesi, dan konfigurasi tersimpan di database proyek.
- State auth ikut terisolasi ketika database di-branch.
- SDK resmi mendukung penggunaan React.
- Termasuk pada Neon Free hingga 60.000 monthly active users (MAU) per proyek.

Kekurangan untuk kebutuhan SinauEnglish:
- Reset password link bawaan kedaluwarsa setelah **15 menit**, sedangkan roadmap menginginkan 30–60 menit.
- Neon menyediakan daftar plugin/fitur yang didukung; ini bukan pengganti penuh untuk self-hosted Better Auth yang dapat memasang custom server-side handler/plugin sendiri.
- Frontend dan API perlu mengadopsi Neon Auth SDK/flow, bukan sekadar memakai tabel sesi custom saat ini.

Kesimpulan: opsi ini layak bila kemudahan layanan terkelola lebih penting daripada kustomisasi reset dan server handler. Bukan pilihan utama untuk roadmap saat ini.

### B. Better Auth self-hosted di Vercel

Kelebihan:
- Email/password, sesi, cookie, password reset, hashing, dan rate limiting disediakan oleh library yang dapat dikonfigurasi.
- `resetPasswordTokenExpiresIn: 3600` dapat digunakan untuk masa reset 1 jam.
- `revokeSessionsOnPasswordReset: true` dapat mencabut sesi pengguna saat reset password.
- Adapter Drizzle resmi tersedia untuk PostgreSQL.
- API profil, belajar, misi, ekonomi, avatar, dan riwayat tetap berada pada Vercel Functions yang sudah ada.

Hal yang harus diperhatikan:
- Better Auth perlu disambungkan ke tabel dan kolom dengan benar. Tabel `users` yang ada tidak boleh dihapus atau diganti ID-nya.
- Rate limiting Better Auth secara default menggunakan memory storage; untuk serverless, storage harus diubah ke database atau custom storage atomik.
- Adapter Drizzle perlu dikonfigurasi dengan `transaction: true` bila flow yang diuji membutuhkan transaksi. Gunakan driver yang mendukung transaksi interaktif; jangan menganggap driver HTTP otomatis mendukung seluruh pola transaksi.
- Repository saat ini menyatakan `better-auth: ^1.7.17`; lockfile mengunci versi 1.7.17. Dokumentasi resmi yang diperiksa pada 6 November 2026 menampilkan 1.7.18 sebagai versi terbaru. `@better-auth/drizzle-adapter` 1.7.17 sudah muncul secara transitif di lockfile, tetapi belum menjadi dependency langsung yang dideklarasikan di `package.json`. Pada Fase 3, pilih satu versi Better Auth yang kompatibel, pasangkan versi adapter yang sama sebagai dependency langsung, lalu lock dan tes; jangan melakukan upgrade dependency dalam Fase 1.

### C. Mempertahankan custom auth saat ini

Kondisi kode yang terverifikasi:
- `api/_lib/auth.js` memakai Node.js `scrypt` untuk password, token sesi acak 32 byte, dan hash SHA-256 token yang disimpan di database.
- Login rate limit sekarang menggunakan tabel `auth_rate_limits` dan upsert database; temuan audit lama yang menyebut Map in-memory sudah tidak akurat untuk branch saat ini.
- Frontend mengambil bearer token dari `sessionStorage` lalu mengirimkannya pada header `Authorization`.
- Registrasi saat ini membuat user, profile, user_stats, settings, dan session melalui beberapa insert berurutan dengan compensation rollback, bukan satu transaksi database yang terbukti atomik.
- Reset password, email lifecycle, cookie-only session, dan seluruh edge cases tetap perlu dikelola sendiri.

Kesimpulan: custom auth bukan otomatis tidak aman, tetapi lebih banyak bagian sensitif yang harus terus dirawat sendiri. Better Auth disarankan agar primitive auth yang umum tidak perlu dibuat dari nol, sementara aturan belajar dan ekonomi tetap dikendalikan API aplikasi.

---

## 3. Kebijakan akun dan data lama — tanpa migrasi akun Sheets

**Keputusan pengguna:** akun dan data lama di Google Sheets akan dibuang; pengguna baru mendaftar dari nol. Cakupan reset hanya Google Sheets. **Data di Neon tidak boleh dihapus, dikosongkan, atau di-reset.**

Urutan aman:
1. Pada Fase 3–6, preview beralih penuh ke API Neon dan berhenti membaca/menulis data akun/progres lewat Apps Script.
2. Setelah cutover preview terbukti, Fase 7 menginventarisasi tab pengguna di Sheets dan mengosongkan baris data. Header/struktur tab dipertahankan. Minimal tab yang diketahui: `Accounts`, `LearningStates`, dan `Collections`; tab lain juga harus diperiksa.
3. Tidak ada ekspor CSV akun, email, password, hash password, progres, atau koleksi lama untuk dimasukkan ke Neon.
4. Spreadsheet dan Apps Script dapat dipertahankan sementara sebagai artefak legacy untuk audit; penghapusan proyek/skrip bukan bagian dari reset ini.
5. Neon tetap dipertahankan. Jika ada akun/data yang sudah tersimpan di Neon, seluruhnya harus tetap ada dan foreign key tetap valid.

### Perlakuan untuk akun yang mungkin sudah ada di Neon

Tidak ada bukti dari audit statis bahwa database Neon aktif berisi akun nyata; akses database langsung belum dilakukan. Karena itu jangan menganggap Neon kosong dan jangan melakukan truncate/reset.

Jika terdapat baris pengguna Neon yang dibuat oleh custom auth saat ini:
- Pertahankan `users.id` dan semua foreign key yang menunjuk ke ID tersebut.
- Tambahkan struktur Better Auth secara aditif; jangan drop tabel `users`, `profiles`, `progress`, `transactions`, atau tabel pengguna lainnya.
- Buat/link credential account Better Auth untuk user Neon yang sudah ada dengan mempertahankan hash scrypt lama melalui verifier kompatibilitas yang diuji. Tidak perlu mengimpor hash SHA-256 dari Sheets.
- Sesi custom lama dapat meminta pengguna login ulang saat perpindahan auth, tetapi data akun/progres tidak boleh hilang.
- Jangan menjalankan reset atau migrasi destruktif ke Neon tanpa inventarisasi dan rencana rollback yang disetujui.

### Default akun baru

Akun baru wajib memiliki:
- XP = 0, koin = 0, streak = 0.
- Statistik belajar = 0.
- Belum memiliki progres SRS, grammar, reading, story, matching, achievement, atau riwayat.
- Tidak memiliki item/title yang belum diperoleh.
- Preferensi non-progres boleh memakai default produk (misalnya target belajar harian 10); ini bukan hadiah/progres palsu.

Profil, user_stats, dan settings harus dibuat secara konsisten bersama proses registrasi. Kegagalan di salah satu langkah tidak boleh meninggalkan akun setengah jadi.

---

## 4. Driver, ORM, dan migrasi skema

### Keputusan

Pertahankan dua paket yang sudah digunakan:
- `@neondatabase/serverless`
- `drizzle-orm` dan `drizzle-kit`

File `db/index.js` sekarang menggunakan `neon()` + `drizzle-orm/neon-http`. Pola ini sesuai untuk query singkat/stateless dari Vercel Functions.

### HTTP vs WebSocket

| Driver | Cocok untuk | Batas / aturan |
|---|---|---|
| Neon HTTP (`drizzle-orm/neon-http`) | Query biasa dan transaksi non-interaktif/batch yang tidak memerlukan sesi interaktif | Cocok untuk query singkat pada serverless. Gunakan fitur transaksi HTTP yang didukung driver untuk sekumpulan operasi yang dapat dijalankan non-interaktif; jangan mengasumsikan dukungan interactive transaction/session. |
| Neon WebSocket/Pool (`drizzle-orm/neon-serverless`) | Session, interactive transaction, atau kompatibilitas `pg` | Tambahkan konfigurasi `ws` yang diperlukan di runtime Node.js (termasuk dependency `ws`/`bufferutil` bila dibutuhkan); uji koneksi, pooling, commit, dan rollback di Vercel Preview. |

Rencana:
- Gunakan HTTP untuk mayoritas read/query pendek dan transaksi batch non-interaktif yang didukung Neon HTTP.
- Gunakan WebSocket/Pool hanya bila implementasi benar-benar memerlukan session atau interactive transaction. Jangan otomatis memaksa seluruh request melewati WebSocket.
- Sebelum mengaktifkan transaksi pada Better Auth Drizzle adapter, verifikasi operasi transaksional yang benar-benar dipanggil versi Better Auth terpilih; jika membutuhkan `db.transaction()` interaktif, hubungkan adapter ke driver yang mendukungnya dan uji commit/rollback di Preview.
- Operasi ekonomi/claim/pembelian harus berupa transaksi database atomik. Alternatifnya, satu statement SQL/function yang benar-benar atomik dapat digunakan untuk operasi tertentu. Jangan memecah ledger dan update saldo ke banyak request terpisah.
- Runtime Vercel hanya menerima `DATABASE_URL` pooled (hostname mengandung `-pooler`). Simpan URL ini sebagai Environment Variable Preview branch yang dipakai.
- Simpan `DATABASE_URL_UNPOOLED` direct (hostname tanpa `-pooler`) hanya di environment lokal/CI migration yang memang membutuhkannya; jangan menaruh direct URL di Vercel Functions runtime.
- Gunakan koneksi direct untuk Drizzle migrations, `pg_dump`, dan `pg_restore`; pooled connection dipakai untuk request aplikasi.
- Jangan membuat koneksi database ketika build Vite berjalan. Inisialisasi hanya di runtime API.
- Jangan mencetak `DATABASE_URL`, token, atau objek konfigurasi yang mengandung secret.

### Alur migrasi Drizzle

1. Ubah schema di `db/schema.js`.
2. Jalankan `npm run db:generate` untuk menghasilkan SQL migration.
3. Review file SQL: constraint, default, foreign key, index, dan urutan perubahan.
4. Backup development branch.
5. Terapkan migration hanya ke Neon development melalui `npm run db:migrate`.
6. Jalankan tes upgrade, rollback/recovery, auth, dan semua API yang terpengaruh.
7. Jangan mengedit migration yang sudah diterapkan; buat migration baru untuk perubahan berikutnya.
8. Production tidak mendapat migration sampai Fase 11 dan persetujuan eksplisit.

Migration awal Better Auth harus aditif dan menjaga struktur data aplikasi yang sudah ada. Jangan menggunakan `drizzle-kit push` secara membabi buta pada database yang memiliki data.

---

## 5. Arsitektur autentikasi target

Alur:
1. React/Vite memakai Better Auth React client pada same-origin `/api/auth/*`.
2. Vercel route `api/auth/[...all].js` (atau route catch-all yang setara dan lolos tes) meneruskan request ke Better Auth.
3. Cookie sesi bersifat HttpOnly, Secure pada HTTPS/production, SameSite=Lax, dan host-only kecuali benar-benar diperlukan konfigurasi domain lain.
4. Frontend tidak lagi menyimpan bearer session token di `localStorage` atau `sessionStorage` sebagai sumber sesi. Request browser memakai cookie credentials.
5. Semua API personal memvalidasi sesi dari request cookie di server; `user.id` berasal dari sesi, bukan dari body/query pengguna.
6. Trusted origins harus berupa daftar origin yang benar-benar digunakan: domain aplikasi, domain Preview yang diizinkan, dan localhost development. Jangan memasukkan wildcard terlalu luas.
7. Jangan mematikan pemeriksaan CSRF, Origin, atau Fetch Metadata untuk mempermudah integrasi.
8. Better Auth hanya mengurus identitas, password, dan sesi. Better Auth tidak boleh mengatur atau mengubah XP, koin, streak, misi, inventory, atau hadiah belajar.
9. Reset password menggunakan TTL 3.600 detik; semua sesi dicabut setelah reset. Email provider baru dipilih pada Fase 12; hingga itu, reset email belum diaktifkan di UI.
10. Verifikasi email saat registrasi tetap menunggu persetujuan pengguna sesuai roadmap.

### Rate limiting

Better Auth rate limiter default menggunakan memory storage bila tidak diubah. Memory tidak cukup untuk koordinasi antar-instance Vercel.

Rekomendasi:
- Gunakan storage database atau custom storage yang melakukan cek + increment secara atomik.
- Atur batas lebih ketat pada route sensitif seperti sign-in, sign-up, dan reset password.
- Untuk login, batas desain awal: maksimum 5 percobaan per kombinasi IP dan email yang dinormalisasi dalam 15 menit; konfigurasi final harus diuji terhadap false positive dan proxy header Vercel.
- Simpan identifier rate-limit dalam bentuk hash bila memungkinkan, bukan email/IP mentah.
- Pastikan alamat IP diambil dari header yang memang ditetapkan oleh proxy tepercaya; jangan percaya nilai header yang dapat dipalsukan klien.
- Tetapkan masa retensi dan pembersihan row rate-limit agar tabel tidak tumbuh tanpa batas.

### Tabel auth

Better Auth membutuhkan tabel/field untuk user, account, session, dan verification. Penamaan model dapat dipetakan ke schema Drizzle, tetapi struktur aktual harus dihasilkan/diperiksa dari versi library yang dipakai. Credential email/password dikelola melalui account provider credential, bukan dikirim atau dibaca frontend.

---

## 6. Skema PostgreSQL target

Semua tabel personal menggunakan foreign key ke identitas user. Setiap query personal wajib dibatasi oleh user ID yang sudah diverifikasi server.

| Area | Tabel | Tanggung jawab |
|---|---|---|
| Identity | `users`, `accounts`, `sessions`, `verifications` | Identitas, credential, sesi, token verifikasi/reset |
| Profile | `profiles`, `avatars`, `settings` | Identitas tampilan, statistik utama, foto, preferensi |
| Learning | `progress`, `progress_events`, `user_stats` | Status SRS per kata, event idempoten, statistik |
| Curriculum | `grammar_progress`, `story_progress` | Progres grammar dan cerita |
| Missions | `daily_quests`, `quest_claims` | Misi berdasarkan tanggal WIB dan klaim hadiah |
| Economy | `transactions`, `catalog`, `inventory`, `titles` | Ledger XP/koin, katalog, kepemilikan item, title |
| History | `activity_log`, `attempt_details`, `reading_quiz_attempts`, `matching_attempts` | Ringkasan sesi dan detail jawaban |
| Future gated | `push_subscriptions`, `widget_tokens`, `announcements`, `inbox_messages` | Dibuat hanya pada fase ekspansi setelah gerbang dibuka |

Constraint wajib:
- `UNIQUE(user_id, event_id)` pada `progress_events` dan ledger transaksi/reward yang memerlukan idempotensi.
- `UNIQUE(user_id, word_id)` untuk satu status progres per kosakata.
- `UNIQUE(user_id, quest_date, quest_id)` untuk satu catatan misi/klaim per hari dan jenis.
- `CHECK (coins >= 0)`, `CHECK (xp >= 0)`, progres tidak negatif, target/harga sesuai batas.
- Foreign key dengan `ON DELETE CASCADE` untuk data personal yang memang harus ikut terhapus saat fitur hapus akun kelak diimplementasikan.
- Index untuk `(user_id, created_at DESC)`, `(user_id, next_review_at)`, token/session lookup, dan kolom event ID.
- Gunakan `TIMESTAMPTZ` untuk timestamp absolut UTC. Tanggal misi, streak, batas harian, dan cerita ditentukan oleh helper server zona `Asia/Jakarta`, bukan timezone perangkat.
- `attempt_details` boleh memakai JSONB dan retensi 90 hari; ringkasan `activity_log` dipertahankan sesuai kebijakan. Jangan memangkas event idempotensi terlalu cepat sehingga event lama dapat memberi hadiah ulang.
- Corpus kosakata statis tetap di file frontend; Neon menyimpan progres per kata, bukan semua definisi.
- Semua transaksi ekonomi memvalidasi aturan dan hadiah dari server. Client tidak boleh mengirim nilai hadiah final.

---

## 7. Foto profil: PostgreSQL bytea vs Vercel Blob

| Kriteria | PostgreSQL `bytea` | Vercel Blob Hobby (Private Store) |
|---|---|---|
| Kuota gratis terkait | Termasuk dalam kuota PostgreSQL Neon 1 GB/proyek | 1 GB storage per bulan, 10 GB transfer, 10.000 simple operations, 2.000 advanced operations |
| Privasi | Dapat dilayani lewat endpoint API yang memvalidasi sesi | Private Blob tersedia; semua read/write memerlukan autentikasi |
| Pengiriman gambar | API membaca row lalu mengirim gambar kecil | Private Blob perlu diakses melalui Function dengan `get()`, lalu stream ke browser |
| Integritas hapus akun | FK/cascade dapat menghapus row bersama data akun | File perlu dihapus dari Blob juga; perlu menangani orphan file |
| Beban implementasi | Rendah untuk gambar sangat kecil | SDK, store private, token/OIDC, endpoint stream, cache, cleanup |
| Cocok untuk | Avatar 192–256 px yang dibatasi ketat | Gambar/dokumen lebih besar atau jumlah media yang terus bertambah |

### Rekomendasi: tetap gunakan bytea kecil di Neon

Schema saat ini sudah membatasi file avatar ke 35.840 byte (35 KiB). Perkiraan batas maksimum:
- 1.000 foto × 35 KiB ≈ 35 MiB.
- 5.000 foto × 35 KiB ≈ 171 MiB.
- 10.000 foto × 35 KiB ≈ 342 MiB.

Perhitungan ini hanya ukuran payload foto, belum overhead row, WAL/history, progres, dan data aplikasi lain.

Aturan implementasi:
- Resize ke WebP 192–256 px; batas keras 35 KiB.
- Validasi signature file/magic bytes, MIME, dimensi, dan ukuran dari binary aktual di server; jangan percaya MIME dari client.
- Tolak SVG/HTML dan file lain yang bukan raster image yang diizinkan; hapus metadata sensitif/EXIF jika memungkinkan.
- Satu avatar aktif per user; update/delete dan timestamp versi avatar harus konsisten.
- Endpoint foto harus memvalidasi sesi dan menggunakan cache private/revalidation. Jangan menerbitkan URL publik untuk foto akun.
- Jika pemakaian PostgreSQL mendekati batas 1 GB, ukur dahulu data sebenarnya; baru evaluasi Neon Object Storage dan Vercel Blob sebagai tahap tersendiri.

Vercel Private Blob tersedia pada semua plan. Namun, untuk foto kecil 35 KiB, keuntungan penyimpanan terpisah belum mengimbangi beban tambahan. Private Blob layak dievaluasi ulang bila aplikasi mulai menyimpan file yang lebih besar dari avatar.

### Catatan opsi baru: Neon Object Storage

Neon Object Storage menjadi GA pada Agustus 2026 dan Free plan mencakup 5 GB per project. Layanannya S3-compatible, branch-aware, serta bucket dibuat private secara default (akses publik harus dipilih secara eksplisit). Ini opsi yang patut dipertimbangkan untuk media yang lebih besar karena bucket ikut terisolasi per branch. Namun, untuk satu avatar WebP kecil dengan batas 35 KiB, `bytea` tetap rekomendasi fase awal: lebih sedikit komponen, tidak perlu URL presigned, dan metadata/foto berada dalam satu transaksi PostgreSQL. Bila kebutuhan file berkembang, bandingkan kembali Neon Object Storage dengan Vercel Blob sebelum menambah layanan. Region dan batas penggunaan object storage harus dikonfirmasi di Console ketika Fase 2 dimulai.

---

## 8. Neon Free — batas, risiko, dan dampak kuota

Angka resmi yang diverifikasi pada 6 November 2026:

| Resource | Neon Free |
|---|---:|
| Harga | $0/bulan |
| Project | 100 project per account |
| Branch | 10 branch per project |
| PostgreSQL storage | 1 GB per project; 20 GB total seluruh project |
| Compute | 100 CU-hours per project per bulan |
| Maksimum autoscaling | 2 CU (sekitar 8 GB RAM) |
| Scale to zero | Setelah 5 menit tidak aktif |
| Public network transfer | 5 GB per project per bulan |
| Instant restore history | 6 jam, dibatasi 1 GB change history |
| Manual snapshot | 1 snapshot |
| Monitoring history | 1 hari |
| Managed Better Auth | Hingga 60.000 MAU |
| Neon Object Storage | 5 GB per project |

### Cara membaca compute

- 100 CU-hours sama dengan sekitar 400 jam bila compute berjalan stabil pada 0,25 CU.
- Pada 0,5 CU, jatah setara sekitar 200 jam aktif.
- Pada 1 CU, setara sekitar 100 jam aktif.
- Perhitungan aktual mengikuti ukuran compute dan durasi aktif; idle 5 menit akan disuspend pada plan Free.
- Setiap branch punya compute endpoint sendiri, tetapi batas compute dihitung pada tingkat project. Banyak branch aktif dapat memakai jatah project bersama.

### Branch dan storage

Neon menggunakan copy-on-write: membuat branch baru tidak langsung menyalin seluruh database. Branch berbagi pages dasar; perubahan pada child branch membuat data divergen. Namun, storage perubahan dan history tetap menggunakan batas project yang sama. **Satu branch tidak mendapat jatah 1 GB tersendiri.**

Strategi:
- Satu Neon project untuk awal; satu branch development/preview yang dipakai terus.
- Jangan membuat branch baru untuk setiap tes kecil.
- Hapus branch percobaan yang sudah tidak dipakai setelah memastikan tidak ada koneksi deployment yang menggunakannya.
- Hindari salinan data pribadi dari production ke Preview. Untuk proyek baru, seed hanya katalog umum dan data uji.
- Pantau compute, storage, network transfer, dan jumlah branch di Dashboard.

### Apa yang terjadi jika kuota habis?

- Compute-hours atau network transfer habis: compute project dapat disuspend sampai kuota periode berikutnya atau plan diubah.
- Storage melewati batas: operasi INSERT/UPDATE yang menambah storage akan gagal sampai ruang dibebaskan atau plan diubah.
- Branch mencapai batas: pembuatan branch baru gagal hingga branch lain dihapus.
- Data yang sudah ada tidak otomatis dihapus saat kuota habis.

Jangan melakukan ping berkala agar database tetap hidup. Itu justru dapat menghabiskan compute-hours.

---

## 9. Vercel Hobby — batas dan region

Vercel Hobby berharga $0. Untuk proyek baru yang memakai Fluid Compute, alokasi utama yang berlaku adalah:
- 1.000.000 Function invocations per bulan.
- 4 jam Active CPU per bulan.
- 360 GB-hours Provisioned Memory per bulan.
- Fast Data Transfer 100 GB dan Fast Origin Transfer 10 GB.
- Maximum Function duration pada Fluid Compute: 300 detik (5 menit); maksimum memory Hobby 2 GB / 1 vCPU.
- Hobby dapat memilih **satu region** untuk Function. Multi-region tidak tersedia pada Hobby.

**Jangan mencampur model billing baru dan legacy.** Dokumentasi Vercel menyatakan Fluid Compute menjadi default untuk semua Function baru. Proyek/function lama yang masih tidak memakai Fluid Compute dapat tetap mengikuti model legacy dengan 100 GB-hours Function Duration dan 100.000 invocations. Karena repo ini menggunakan project Vercel yang sudah ada, mode aktualnya belum dapat dipastikan dari source code: periksa Settings/Functions atau Dashboard Usage saat Fase 2, lalu gunakan hanya angka pada model yang benar-benar aktif. Jangan memakai 100 GB-hours legacy bersamaan dengan kuota Active CPU/Provisioned Memory Fluid Compute.

Batas kebijakan:
- Hobby hanya untuk penggunaan personal/non-komersial. Karena SinauEnglish dapat diakses pengguna lain, pastikan penggunaan publiknya tetap sesuai kebijakan personal/non-komersial Vercel. Gratis tidak berarti bebas untuk penggunaan komersial.
- Pemakaian di luar alokasi dapat menyebabkan project/function dibatasi atau dijeda hingga reset periode atau perubahan plan; desain jangan bergantung pada penggunaan berbayar otomatis.

### Region yang direkomendasikan

- Neon: Singapore `ap-southeast-1`.
- Vercel: Singapore `sin1` (kode region AWS `ap-southeast-1`).
- Hobby dapat memilih satu region; Singapore tersedia sehingga konfigurasi ini tidak membutuhkan multi-region Pro.
- `vercel.json` saat ini belum mencantumkan `regions`, jadi dari source repo saja kita belum bisa membuktikan region deployment aktif. Dokumentasi Vercel menyebut default Function untuk project baru adalah `iad1` kecuali Dashboard/config mengubahnya. Pengaturan region akan dilakukan hanya setelah disetujui dan diuji pada branch Preview.

Tempatkan Vercel Function di region yang sama dengan Neon untuk mengurangi perjalanan jaringan. Hasil latency tetap perlu diukur dari browser pengguna di Indonesia; region yang sama tidak menghilangkan cold start atau latency jaringan ISP.

---

## 10. Privasi, environment, dan batas Preview

- `DATABASE_URL`, `BETTER_AUTH_SECRET`, token Blob (bila kelak dipakai), dan secret lain hanya berada di Environment Variables Vercel atau file `.env` lokal yang diabaikan Git.
- Jangan meminta pengguna mengirim secret ke chat. Jangan mencetak nilai secret ke log. `.env.example` hanya memuat placeholder.
- Vercel Preview harus memakai Neon development branch; Environment Variables Production tidak diubah pada Fase 1–10.
- Main tetap terlindungi. Semua perubahan rancangan dan implementasi berada di `feat/neon-migration` dan PR tetap tidak di-merge sampai pengguna menyetujui.
- Google Sheets/Apps Script tidak menjadi tempat penulisan data setelah seluruh preview cutover ke Neon. Pengosongan data Sheets ditunda sampai Fase 7 dan hanya menyentuh spreadsheet legacy.
- Reset Sheets tidak boleh menghapus data Neon. Migration database Neon harus aditif dan menjaga foreign key/data akun Neon yang mungkin sudah ada.
- Data pribadi tidak boleh dicopy ke branch Preview tanpa tujuan yang jelas, persetujuan, dan anonimisasi.

---

## 11. Cold start dan pengalaman memuat

Ada dua kemungkinan waktu tunggu yang terpisah:
1. Vercel Function cold start.
2. Neon compute wake-up setelah scale-to-zero 5 menit.

Neon menjelaskan compute yang disuspend akan aktif lagi ketika menerima koneksi berikutnya; estimasi wake-up yang dipublikasikan dapat sekitar ratusan milidetik, tetapi ini bukan SLA dan bukan jaminan waktu total dari browser. Jaringan pengguna, Function cold start, query, dan banyaknya request tetap berpengaruh.

Strategi UI dan request:
- Render shell, sidebar, dan skeleton terlebih dahulu. Jangan mengunci seluruh workspace saat semua modul mengambil data.
- Ambil informasi sesi dan data awal minimum saja.
- Muat history, detail latihan, katalog besar, dan modul lain ketika dibutuhkan.
- Gunakan satu bootstrap endpoint yang kecil bila pengukuran membuktikan banyak request awal menjadi bottleneck; jangan membuat endpoint gabungan yang mengambil seluruh database.
- Timeout harus menampilkan pesan yang jelas, tombol coba lagi, dan status sinkronisasi yang jujur.
- Retry otomatis hanya untuk GET/read idempoten atau operasi tulis yang mempunyai `event_id` idempoten. Jangan mengulang purchase, reward, atau klaim tanpa idempotency key.
- Jangan menampilkan data mock atau sukses palsu saat database tidur/gagal.
- Target muat 3 detik diuji pada Preview dengan cold/warm scenario, bukan dijanjikan universal.
- Jangan mengirim keepalive/ping hanya agar Neon tidak tidur.

---

## 12. Backup dan pemulihan

Neon Free menyediakan instant restore history hingga 6 jam (dengan batas 1 GB change history) dan satu manual snapshot. Neon juga menyediakan 5 GB Object Storage per project Free per informasi resmi 2 Oktober 2026. Fitur restore membantu pemulihan jangka pendek, tetapi bukan backup mandiri jangka panjang.

### Rekomendasi

1. Gunakan `pg_dump --format=custom` untuk backup database secara utuh.
2. Simpan dump secara lokal dalam folder yang di-`.gitignore`, terenkripsi, dan tidak tersinkron ke lokasi publik.
3. Backup sebelum perubahan schema/migration/cutover dan secara berkala ketika aplikasi mulai dipakai nyata.
4. Gunakan Windows Task Scheduler untuk jadwal otomatis lokal bila diperlukan; backup hanya berjalan saat komputer menyala dan memiliki koneksi. Penyimpanan/retensi tetap di bawah kendali pengguna.
5. Uji pemulihan dengan `pg_restore` ke Neon development branch terpisah. Jangan menguji restore langsung pada branch yang digunakan Preview.
6. Catat tanggal, branch sumber, checksum, dan hasil restore. Jangan memasukkan password/hash/token atau isi data pribadi ke laporan.
7. Jangan commit dump, mengunggah dump mentah ke GitHub, atau mengirimkannya melalui chat.

### Kondisi script backup yang sudah ada

Repo sudah memiliki `scripts/backup-db.mjs` dan `scripts/restore-db.mjs`, tetapi keduanya saat ini memakai ekspor/impor JSON per tabel, bukan `pg_dump`/format arsip PostgreSQL:
- daftar tabel backup ditulis manual;
- kegagalan membaca satu tabel ditangkap sebagai peringatan dan diisi array kosong, sehingga proses masih dapat menyelesaikan file backup yang tidak lengkap;
- restore mengerjakan insert per baris dan bukan proses restore database penuh yang atomik;
- file JSON memuat data akun/progres sehingga harus diperlakukan sebagai data pribadi.

Karena itu script tersebut **belum boleh dianggap sebagai backup disaster-recovery yang teruji**. Perbaikannya harus dilakukan dan diuji pada fase implementasi, tidak dalam Fase 1.

---

## 13. Urutan implementasi setelah rancangan disetujui

| Fase | Fokus | Batas aman |
|---|---|---|
| 2 | Membuat Neon project Singapore dan development branch; menghubungkan Vercel Preview | Pengguna mengisi secret di dashboard; Production tidak disentuh |
| 3 | Better Auth, registrasi/login/logout/sesi dan API inti | Pertahankan data Neon yang ada; schema additive; tes transaksi dan session |
| 4 | Ekonomi, ledger, klaim, pembelian, streak server-side | Semua perubahan atomik dan idempoten |
| 5 | Outbox IndexedDB dan sinkronisasi offline | Hapus event dari queue hanya setelah ACK |
| 6 | Pindahkan semua fitur ke API baru dan perbaikan sub-bagian | Satu sub-bagian per laporan; Preview saja |
| 7 | Reset data legacy Google Sheets tanpa migrasi akun | Hanya setelah preview tidak lagi memakai Sheets; Neon tidak diubah |
| 8 | Audit/perbaikan HABIT Reading | Jangan mengubah konten lain di luar cakupan |
| 9 | Responsif di seluruh ukuran layar | Screenshot dan pengujian regresi |
| 10 | Test:all, integrasi, keamanan, multi-device, CI | Semua tes dan CI harus hijau |
| 11 | Persiapan produksi dan backup operasional | Cutover hanya setelah seluruh checklist dan persetujuan |
| — | Gerbang Stabilitas | Pengguna sendiri menulis "GERBANG DIBUKA" |
| 12–20 | Ekspansi fitur | Dilarang sebelum Gerbang Stabilitas dibuka |

Tidak ada implementasi source code, provisioning Neon, pengubahan Environment Variables, penghapusan data, atau deployment Production dalam Fase 1.

---

## 14. Keputusan yang diminta dari pengguna

Rekomendasi untuk disetujui:

1. **Auth:** Better Auth self-hosted di Vercel Functions.
2. **Database/ORM:** Neon PostgreSQL + Drizzle.
3. **Driver:** HTTP untuk query biasa; WebSocket/Pool hanya untuk transaksi interaktif yang diwajibkan dan diuji.
4. **Region:** Neon Singapore `ap-southeast-1` dan Vercel Hobby Singapore `sin1` (satu region).
5. **Avatar:** tetap `bytea` WebP ≤35 KiB di Neon.
6. **Data lama:** tidak mengimpor akun/progres Google Sheets; Fase 7 mengosongkan Sheets sesudah preview beralih; Neon tidak di-reset dan data Neon yang sudah ada wajib dipertahankan.
7. **Backup:** `pg_dump` lokal terenkripsi, dengan uji `pg_restore`.

Bila disetujui, Fase 2 dapat dimulai. Bila ada komponen yang tidak disetujui, ubah keputusan itu dulu sebelum setup.

---

## 15. Sumber resmi (diakses 6 November 2026)

### Neon
- [Free plan limits and quotas](https://neon.com/docs/introduction/plans) — kuota proyek, branch, storage, compute, transfer, restore.
- [Neon Free Plan: 1 GB PostgreSQL + 5 GB Object Storage per project (2 October 2026)](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Neon Object Storage (GA, 6 August 2026)](https://neon.com/blog/building-neon-object-storage)
- [Neon FAQ: Free plan limits and quotas](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md)
- [Managed Better Auth overview](https://neon.com/docs/auth/overview)
- [Managed Better Auth password reset](https://neon.com/docs/auth/guides/password-reset)
- [React quick start for Managed Better Auth](https://neon.com/docs/auth/quick-start/react)
- [Neon branching authentication](https://neon.com/docs/auth/branching-authentication)
- [Neon regional latency dashboard](https://neon.com/demos/regional-latency)
- [Neon branch management](https://neon.com/docs/manage/branches)

### Better Auth dan Drizzle
- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth options: custom password hash/verify and reset TTL](https://better-auth.com/docs/reference/options)
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth session management](https://better-auth.com/docs/concepts/session-management)
- [Better Auth rate limiting](https://better-auth.com/docs/concepts/rate-limit)
- [npm package: Better Auth Drizzle adapter current release](https://www.npmjs.com/package/@better-auth/drizzle-adapter)
- [Better Auth security and origin validation](https://better-auth.com/docs/reference/security)
- [Drizzle ORM + Neon](https://orm.drizzle.team/docs/connect-neon)

### Vercel
- [Hobby plan usage and restrictions](https://vercel.com/docs/plans/hobby)
- [Vercel regions](https://vercel.com/docs/regions)
- [Vercel Function region configuration](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel Functions usage and pricing — Fluid Compute](https://vercel.com/docs/functions/usage-and-pricing)
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
- [Vercel legacy Function usage and pricing](https://vercel.com/docs/functions/usage-and-pricing/legacy-pricing)
- [Vercel project configuration: Hobby single-region support](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Vercel Blob private storage](https://vercel.com/docs/vercel-blob/private-storage)
- [Vercel Private Blob general availability (30 June 2026)](https://vercel.com/changelog/vercel-private-blob-is-now-generally-available)

