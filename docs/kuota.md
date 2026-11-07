# Kuota Gratis — SINAUENGLISHV2 (Neon + Vercel)

**Tanggal verifikasi:** 6 November 2026  
**Branch:** feat/neon-migration  
**Status:** dokumentasi Fase 1; belum ada project Neon/konfigurasi Vercel yang dibuat atau diubah.

> Batas layanan dapat berubah. Angka berikut berasal dari halaman resmi yang diperiksa pada 6 November 2026. Sebelum setup Fase 2, periksa ulang Dashboard karena batas akun, region, dan mode Function aktif tidak dapat dipastikan hanya dari source code.

## 1. Neon Free

| Resource | Batas Free yang diverifikasi | Catatan |
|---|---:|---|
| Harga | $0/bulan | Di dalam kuota Free |
| Project | 100 per akun | Setiap project mempunyai kuota compute sendiri |
| Branch | 10 per project | Branch tidak memberi tambahan kuota compute/storage terpisah |
| PostgreSQL storage | 1 GB per project | Batas total hingga 20 GB untuk seluruh project Free pada akun |
| Compute | 100 CU-hours per project per bulan | Kira-kira 400 jam bila compute stabil pada 0,25 CU; pemakaian aktual mengikuti ukuran compute |
| Autoscaling | Maksimum 2 CU (sekitar 8 GB RAM) | Compute naik sesuai beban |
| Scale to zero | Setelah 5 menit tidak aktif | Tidak dapat dimatikan di Free |
| Public network transfer | 5 GB per project per bulan | Diukur per project |
| Instant restore history | 6 jam, dibatasi 1 GB change history | Bukan backup jangka panjang |
| Manual snapshot | 1 | Bukan pengganti dump mandiri |
| Monitoring history | 1 hari | Simpan bukti penting sendiri bila perlu |
| Managed Better Auth | Hingga 60.000 MAU | Pilihan auth terkelola, bukan jumlah akun yang wajib dimiliki |
| Neon Object Storage | 5 GB per project | S3-compatible, branch-aware; sudah GA |
| Neon Functions | 1 juta invocations, 10 active dan 400 waiting capacity-hours | Produk terpisah; proyek ini tetap merencanakan Vercel Functions |

### Periode reset dan kondisi batas

- Compute (CU-hours) dan public network transfer direset setiap awal periode bulanan.
- Storage PostgreSQL, jumlah branch, dan jumlah project adalah batas kapasitas berkelanjutan; tidak otomatis kembali nol setiap bulan.
- Bila CU-hours atau public network transfer habis, compute dapat disuspend sampai periode berikutnya atau plan diubah. Koneksi aktif terputus dan koneksi baru tidak dapat dibuka.
- Bila storage melebihi 1 GB per project atau 20 GB total akun, operasi yang menambah storage gagal sampai ruang dibebaskan atau plan berubah.
- Batas yang tercapai tidak otomatis menghapus data. Namun, aplikasi tidak bisa dianggap tetap tersedia saat compute disuspend.

### Branching dan strategi penggunaan

Neon memakai copy-on-write. Child branch mewarisi snapshot parent pada saat dibuat; membuat branch tidak langsung menggandakan seluruh data. Perubahan dan history antar-branch tetap menggunakan storage budget project bersama. Setiap branch memiliki compute endpoint, tetapi CU-hours dihitung pada tingkat project.

Untuk SinauEnglish:
1. Awali dengan satu project Neon dan satu branch development/preview yang dipakai konsisten.
2. Jangan membuat branch baru untuk setiap eksperimen kecil.
3. Jangan meng-copy data akun nyata ke Preview. Gunakan akun uji dan seed katalog non-personal.
4. Hapus branch uji yang sudah tidak digunakan hanya setelah memastikan tidak ada deployment terhubung.
5. Jangan mengirim ping berkala agar database tetap hidup. Itu memakai compute-hours dan tidak menyelesaikan cold start secara sehat.
6. Minimalkan request bootstrap, polling, dan query berulang; gunakan lazy loading untuk Riwayat/detail latihan.

## 2. Vercel Hobby

| Resource | Alokasi Hobby (Fluid Compute) | Relevansi |
|---|---:|---|
| Harga | $0 | Dengan batas penggunaan dan kebijakan personal/non-komersial |
| Function invocations | 1.000.000 per bulan | Setiap request ke Function dihitung, termasuk yang gagal |
| Active CPU | 4 jam per bulan | Waktu CPU benar-benar bekerja; menunggu query/network tidak dihitung sebagai Active CPU |
| Provisioned Memory | 360 GB-hours per bulan | Memory dihitung selama instance hidup/menangani request, termasuk waktu menunggu I/O |
| Fast Data Transfer | 100 GB | Transfer melalui CDN |
| Fast Origin Transfer | 10 GB | Transfer dari origin menuju CDN |
| Function duration | Maksimum 300 detik (Fluid Compute) | Berlaku pada konfigurasi Fluid Compute yang didukung |
| Function memory | Maksimum 2 GB / 1 vCPU | Hobby tidak dapat menaikkan memory seperti Pro |
| Region Function | Satu region | Hobby boleh memilih satu region, termasuk Singapore sin1 |

### Fluid Compute vs legacy billing

Dokumentasi Vercel menyatakan Fluid Compute menjadi default untuk Function baru. Pada Fluid Compute, alokasi utamanya adalah Active CPU, Provisioned Memory, dan invocations seperti tabel di atas.

Dokumentasi lama masih berlaku untuk project/Function yang belum menggunakan Fluid Compute:
- Function Duration: 100 GB-hours.
- Function Invocations: 100.000.

**Jangan menjumlahkan kedua model.** Repo ini memakai project Vercel yang sudah ada, sehingga mode aktual deployment belum dapat dipastikan dari Git. Periksa Settings/Functions atau Dashboard Usage di Fase 2, lalu gunakan hanya angka pada model yang benar-benar aktif di project.

### Catatan kebijakan dan batas

- Hobby dibatasi untuk penggunaan personal/non-komersial. Karena SinauEnglish berpotensi terbuka untuk pengguna lain, pastikan penggunaan publik tetap sesuai Fair Use Policy Vercel. Gratis tidak berarti otomatis mengizinkan penggunaan komersial.
- Pemakaian di luar alokasi dapat menyebabkan project/function dibatasi atau dijeda hingga periode penggunaan pulih; jangan merancang sistem yang membutuhkan overage berbayar.
- Vercel Function default region untuk project baru adalah iad1 kecuali diganti melalui dashboard atau vercel.json. Repo saat ini belum menetapkan regions.
- Singapore tersedia sebagai sin1 (ap-southeast-1). Hobby dapat menetapkan satu region, sehingga Functions bisa didekatkan ke Neon Singapore tanpa multi-region.
- Function duration maksimum tidak berarti endpoint sebaiknya berjalan lama. Request API belajar harus tetap pendek, dengan timeout, pagination, dan batch yang terbatas.

## 3. Vercel Blob Hobby (opsi media eksternal)

| Resource | Kuota gratis | Cara hitung |
|---|---:|---|
| Storage | 1 GB | Rata-rata storage dalam satu bulan |
| Simple operations | 10.000 per bulan | Contoh: cache miss saat blob dibuka atau head() |
| Advanced operations | 2.000 per bulan | Contoh: put(), copy(), list() |
| Blob data transfer | 10 GB per bulan | Saat blob diunduh/dilihat |

Private Blob tersedia pada semua plan; akses baca/tulis membutuhkan autentikasi. Kuota penggunaan yang disertakan dibagi dalam lingkup layanan/project Vercel sesuai dokumentasi pricing; jangan mengasumsikan storage Blob berdiri terpisah dari kebijakan akun Vercel.

Untuk avatar kecil, Blob bukan rekomendasi awal karena menambah endpoint, lifecycle file, dan cleanup orphan. Evaluasi lagi bila aplikasi mulai menyimpan dokumen/media yang lebih besar.

## 4. Neon Object Storage (opsi tambahan)

Neon Object Storage telah GA dan paket Free menyertakan 5 GB per project. Layanan ini S3-compatible, bucket private secara default, dan bucket/object mengikuti branching backend Neon.

Ini bukan bagian dari kebutuhan minimum avatar kecil; bytea 35 KiB tetap paling sederhana. Untuk file yang lebih besar di masa depan, bandingkan Neon Object Storage dengan Vercel Blob dan ukur egress/latency serta pola akses sebelum memilih.

## 5. Dampak perkiraan untuk SinauEnglish

| Area | Dampak | Aturan desain hemat kuota |
|---|---|---|
| Profil/avatar | 1.000 avatar × 35 KiB ≈ 34,2 MiB payload; 5.000 ≈ 171 MiB; 10.000 ≈ 342 MiB, belum termasuk overhead row/WAL/history | Resize WebP 192–256 px; validasi server; batas keras 35.840 byte |
| Progres & riwayat | Berpotensi menjadi bagian terbesar dari storage seiring pemakaian | Simpan event minimum yang dibutuhkan; retensi detail latihan 90 hari sesuai roadmap; ringkasan riwayat tetap ringan |
| Query API | Menggunakan CU-hours Neon saat compute aktif | Satu bootstrap endpoint minimum bila terbukti membantu; pagination; lazy load; tidak polling terus-menerus |
| Sinkronisasi offline | Batch besar atau retry agresif menambah query, compute, dan transfer | Outbox IndexedDB, batch terbatas, event_id idempoten, hapus hanya setelah ACK |
| Vercel Functions | Request API menambah invocations; fungsi sibuk menambah CPU/memory | Jangan membuat API request per elemen; agregasi query server-side; timeout dan retry terukur |
| Foto profil di PostgreSQL bytea | Memakai kuota 1 GB Postgres, bukan jatah Object Storage | Cocok untuk satu avatar kecil per akun; hapus/update di DB secara atomik |

Tidak ada kalkulasi biaya yang dapat dijamin tanpa pola trafik nyata. Fase 2 harus merekam baseline pemakaian dan menetapkan alarm/manual review sebelum mendekati batas. Target biaya tetap Rp0: jika batas gratis terancam, kurangi beban atau hentikan fitur berbiaya—jangan mengaktifkan plan berbayar otomatis.

## 6. Checklist wajib saat Fase 2

- [ ] Pastikan akun Neon benar-benar pada Free dan lihat kuota dashboard aktual.
- [ ] Buat Neon project pada Singapore ap-southeast-1; pastikan region masih tersedia untuk project baru.
- [ ] Buat satu development branch; catat ukuran database awal dan pemakaian compute.
- [ ] Ambil pooled connection string untuk runtime dan direct connection untuk migrasi bila diperlukan; jangan kirim nilainya ke chat atau Git.
- [ ] Pastikan Vercel Preview menggunakan DATABASE_URL branch development, bukan Production.
- [ ] Periksa apakah project Vercel memakai Fluid Compute atau legacy billing.
- [ ] Periksa Usage, Function region, dan batas Hobby aktual dari Dashboard.
- [ ] Jangan mengubah Environment Variables Production.
- [ ] Simpan dump backup terenkripsi di luar Git sebelum migrasi schema penting; uji pg_restore ke branch khusus.
- [ ] Jika ada perubahan terbaru pada pricing/limits, perbarui dokumen ini sebelum melanjutkan.

## 7. Sumber resmi

### Neon
- [Neon Free plan limits and quotas](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md)
- [Neon: Free plan 1 GB PostgreSQL + Object Storage 5 GB per project (2 October 2026)](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Neon Object Storage GA and architecture (6 August 2026)](https://neon.com/blog/building-neon-object-storage)
- [Neon branch management](https://neon.com/docs/manage/branches)
- [Neon pooled connections](https://neon.com/docs/connect/connection-pooling)

### Vercel
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Fluid Compute usage and pricing](https://vercel.com/docs/functions/usage-and-pricing)
- [Legacy Function usage and pricing](https://vercel.com/docs/functions/usage-and-pricing/legacy-pricing)
- [Vercel Function limits](https://vercel.com/docs/functions/limitations)
- [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Vercel Blob private storage](https://vercel.com/docs/vercel-blob/private-storage)
