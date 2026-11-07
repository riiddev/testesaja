# Fase 6.1 — Progres dan Penyimpanan

**Tanggal:** 7 November 2026  
**Repository:** `riiddev/testesaja`  
**Cabang:** `main`  
**Ruang lingkup:** bukti ledger progres dan hadiah di Neon Development; sumber angka profil; keamanan perubahan profil/koleksi; perlindungan cache ketika registrasi gagal.

## Status

Implementasi 6.1 sudah diperbaiki dan diuji otomatis di Neon Development. Data Production tidak di-reset, tidak dimigrasikan, dan tidak disentuh oleh tes.

## Temuan dan perbaikan

| Area | Hasil audit | Tindakan |
|---|---|---|
| Cloud profile vs cache lokal | Server sekarang menjadi sumber kebenaran. Nilai server 0 tidak digabung dengan angka cache lama. | `normalizeServerProfile` menormalisasi XP, koin, streak dan `useUserProfile` mengganti state setelah respons profil berhasil. |
| Statistik repetisi | Menjumlahkan `correctCount + wrongCount` tidak sama dengan jumlah percobaan: jawaban salah dapat mengurangi correct count sedangkan ledger tetap bertambah. | `/api/profile/get` sekarang mengirim penghitung `user_stats`; hook memetakan `totalReviews` server ke `totalReviewsDone` yang dipakai sistem gelar. |
| Cache lintas akun | Callback pembelian/klaim hadiah sebelumnya tidak mencantumkan semua key cache pada dependency, sehingga berpotensi memakai key akun yang ditangkap saat render lama. | Dependency `buyItem` dan `claimReward` mencakup key profil/inventori akun aktif. Cache tetap diberi namespace ID pengguna. |
| XP/koin saat kuis bacaan | Respons kuis bacaan tidak menyertakan saldo akhir; UI dapat mempertahankan saldo cache lama setelah reward. | Endpoint `/api/reading-quiz/record` mengembalikan `totalXp` dan `totalCoins` dari hasil ledger server. |
| Operasi profil dan koleksi | Nama, gelar, avatar, pembelian, equip dan klaim hadiah sudah menunggu konfirmasi server sebelum mengubah state/cache. | Pola server-first dipertahankan. Kegagalan profil/avatar/koleksi ditampilkan melalui pesan error UI; pembelian/equip tidak dianggap sukses ketika API gagal. |
| Nol yang sah | Nilai streak 0 sebelumnya dapat terbaca sebagai 1 di progres gelar konsistensi. Tampilan profil memakai fallback numerik yang mempertahankan 0. | Default streak pada sistem gelar diubah menjadi nullish fallback 0; tes regresi ditambahkan. |
| Cache tamu saat registrasi gagal | Cache hanya dibersihkan setelah Better Auth mengonfirmasi akun dan sesi, atau jalur kompatibilitas mengembalikan akun + token yang berhasil. | Urutan ini dipertahankan; kegagalan registrasi tidak memanggil `clearLocalUserCache`. |

## Bukti database — Neon Development

Tes integrasi `tests/progress-sync-fase5.test.mjs` membuat akun tes sementara di database Development, memulai profil dari XP 0 dan koin 0, lalu menjalankan enam event SRS resmi melalui handler API.

Hasil yang diverifikasi oleh tes:

| Bukti | Sebelum | Sesudah enam event |
|---|---:|---:|
| `profiles.xp` | 0 | 22 |
| `profiles.coins` | 0 | 8 |
| `user_stats.total_reviews` | 0 | 6 |
| `user_stats.words_started` | 0 | 2 |
| `user_stats.words_mastered` | 0 | 1 |
| `user_stats.b2_mastered` | 0 | 1 |
| `progress_events` | 0 | 6 |
| `transactions` | 0 | 6 |

Dua kata resmi menghasilkan dua baris progres. Enam event menghasilkan enam baris ledger unik dengan total 22 XP dan 8 koin. Tes kemudian mengirim ulang batch dan mengirim beberapa retry serentak: server memberi ACK, tetapi saldo, jumlah event dan jumlah transaksi tidak bertambah lagi.

Tes juga memanggil `GET /api/profile/get` setelah belajar dan memverifikasi bahwa profil mengembalikan XP 22, koin 8 serta statistik server totalReviews 6 / wordsStarted 2 / wordsMastered 1 / b2Mastered 1. Akun tes dan baris turunannya dihapus pada tahap teardown. ID, email, token, dan secret dari fixture tidak dimasukkan ke laporan.

## File yang dibuat/diubah

- `api/_handlers/profile/get.js` — ikut mengembalikan penghitung belajar dari `user_stats`.
- `api/_handlers/reading-quiz/record.js` — mengembalikan saldo akhir hasil ledger.
- `src/lib/profileData.js` — normalisasi statistik resmi server.
- `src/hooks/useUserProfile.js` — statistik server menjadi acuan untuk review/vocabulary counters; callback cache mengikuti key akun aktif.
- `src/features/profile/titleSystem.js` — streak 0 tidak lagi dihitung sebagai 1.
- `tests/profile-data.test.mjs` — tes prioritas server, pemetaan review ledger, dan streak 0.
- `tests/progress-sync-fase5.test.mjs` — bukti saldo sebelum/sesudah, ledger, endpoint profil dan idempotency.

Perubahan server-first untuk profil/avatar/koleksi, cache terisolasi, dan error UI telah diperiksa pada kode yang sudah berada di `main`; tidak dibuat ulang.

## Pengujian

Pengujian integrasi menggunakan Neon Development yang terisolasi dari Production. **GitHub Actions run 42363642736 pada commit kode `73966a4487168693d19a2768e72ee014ea6c09fb` berstatus SUCCESS** untuk keseluruhan `npm run test:all`: content, logic, responsif berbasis CSS, build, API/database, security, multi-device dan SPA smoke. Tes pendukung yang terukur pada run tersebut: profile data 8/8, Fase 5 backend 8/8, Fase 6 backend 11/11, security 12/12, multi-device 8/8, widget 5/5, dan Better Auth integration 1/1.

Tes otomatis tidak membuktikan klik UI pada perangkat pengguna. Perubahan kode lulus CI, tetapi penyelesaian A5 untuk alur browser masih menunggu pemeriksaan manual berikut:
- Registrasi gagal: data tamu/cache lokal tetap ada; registrasi berhasil: sesi baru masuk dan profil akun baru mulai nol.
- Sesudah latihan, reload, logout-login dan login di browser/perangkat kedua: XP/koin/progres tetap sama dengan server.
- Gagal jaringan pada update nama, foto, pembelian, equip atau klaim: state tidak menampilkan perubahan sukses; pesan error terlihat.
- Tampilan pada 360, 768, 1280 px dan pembesaran teks 200%.

## Dampak kuota dan keselamatan data

- Tidak ada tabel baru, migration, cron, penyimpanan eksternal, atau layanan berbayar.
- Endpoint profil menambahkan satu query baca kecil ke tabel `user_stats` yang sudah ada.
- Tes hanya memakai Neon Development dan akun tes sementara.
- Neon Production, akun pengguna Production, dan Google Sheets tidak diubah.
- Deployment Production dari commit terbaru belum dianggap terverifikasi sampai ada deployment READY yang cocok dengan SHA terbaru.

## Keputusan pengguna

Tidak ada keputusan tambahan yang diperlukan untuk 6.1.
