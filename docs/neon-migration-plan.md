==========================================================
SINAUENGLISHV2 — RENCANA KERJA TERPADU
Migrasi Neon + Stabilisasi + Ekspansi Fitur
==========================================================

CARA MEMBACA DOKUMEN INI
- BAGIAN A: konteks dan aturan yang SELALU berlaku.
- BAGIAN B: stabilisasi (Fase 0–11). Wajib selesai lebih dulu.
- GERBANG STABILITAS: pintu antara Bagian B dan C.
- BAGIAN C: ekspansi fitur (Fase 12–20). Hanya setelah saya menulis "GERBANG DIBUKA".

PETA FASE
| Fase | Isi                                             | Bagian |
|------|-------------------------------------------------|--------|
| 0    | Verifikasi temuan audit (tanpa ubah kode)       | B |
| 1    | Arsitektur dan keputusan (tunggu persetujuan)   | B |
| 2    | Setup Neon + Vercel                             | B |
| 3    | Autentikasi dan API inti                        | B |
| 4    | Ekonomi dan hadiah di server                    | B |
| 5    | Sinkronisasi offline-first                      | B |
| 6    | Pindahkan semua fitur + perbaikan (6.1–6.10)    | B |
| 7    | Reset data legacy Google Sheets (tanpa migrasi) | B |
| 8    | Audit dan perbaikan bug HABIT Reading           | B |
| 9    | Tampilan rapi di semua ukuran layar             | B |
| 10   | Pengujian dan CI                                | B |
| 11   | Persiapan produksi                              | B |
| —    | GERBANG STABILITAS                              | — |
| 12   | Email + lupa password                           | C |
| 13   | Hapus akun + Privacy Policy                     | C |
| 14   | Kotak Surat                                     | C |
| 15   | In-app dan push notification                    | C |
| 16   | Smart analysis + saran dan prioritas belajar    | C |
| 17   | Laporan mingguan                                | C |
| 18   | Footer (GitHub dan Instagram)                   | C |
| 19   | Widget layar utama Android                      | C |
| 20   | Tambah 5.000 kosakata                           | C |

==========================================================
BAGIAN A — KONTEKS DAN ATURAN (SELALU BERLAKU)
==========================================================

A1. PERAN
Kamu senior full-stack engineer + product designer (security-minded).

A2. REPO DAN CABANG
- Repo kerja: https://github.com/riiddev/testesaja.git (React 19 + Vite; backend lama Google Apps Script + Google Sheets + Drive).
- Buat cabang `feat/neon-migration` dari main TERBARU. JANGAN menyentuh main. Pull Request hanya setelah checklist lulus; saya yang memutuskan merge.
- Jika masih ada cabang fitur lain yang belum di-merge (mis. feat/economy-story-reading), laporkan dan tanyakan urutannya dulu agar tidak konflik.
- Bagian C dikerjakan di cabang terpisah dari main terbaru setelah Gerbang dibuka (mis. feat/v2-expansion).

A3. KEPUTUSAN YANG SUDAH DIAMBIL
- Database utama: Neon PostgreSQL paket Free. Backend/API: Vercel Functions (folder api/). Frontend React + Vite dipertahankan. Biaya target Rp0.
- Google Sheets/Apps Script tetap dipertahankan sementara sampai fitur aplikasi benar-benar beralih ke API Neon. Namun, data akun dan progres lama di Google Sheets TIDAK dimigrasikan: data legacy akan dikosongkan pada Fase 7 setelah aplikasi berhenti menulis ke Sheets. Neon tidak ikut dikosongkan.
- Semua perubahan diuji di preview (Vercel preview + branch Neon). Production tidak disentuh sebelum checklist lulus.
- Mode gelap tetap dihapus. Angka total konten (jumlah kata/topik/artikel) tidak ditampilkan di UI.

A4. ATURAN UMUM
Keamanan dan data
- Jangan pernah meminta saya menempel secret (DATABASE_URL, token, password) ke chat. Pakai environment variable; sediakan .env.example tanpa nilai asli; pastikan .env* ada di .gitignore. Beri langkah persis kapan dan di mana saya mengisi variabel di dashboard Vercel/Neon.
- Server adalah sumber kebenaran. Client TIDAK boleh menentukan XP, koin, streak, harga, atau hadiah. user_id selalu dari sesi di server, bukan dari body request. Semua query dibatasi user_id.
- Jangan menyatakan sesuatu "berhasil" di UI sebelum server mengonfirmasi. Kegagalan harus terlihat di UI.
- Akun baru mulai dari NOL untuk semua progres, pencapaian, XP, koin, streak, inventory, dan data lain (tanpa angka default palsu).
- Cache lokal diberi namespace user_id dan dibersihkan saat logout atau ganti akun.

Akses dan reset data lama
- Jangan meminta kredensial Google dan jangan mengekspor akun/progres lama untuk migrasi. Keputusan pengguna: seluruh akun dan data lama di Google Sheets dibuang; pengguna baru akan mendaftar dari nol. Tidak ada CSV akun, hash password, atau progres yang dipindahkan ke Neon.
- Reset dilakukan hanya setelah aplikasi preview sudah berhenti memakai/menulis ke Google Sheets agar reset tidak membuat login/registrasi aplikasi aktif rusak atau data lama terbentuk kembali. Pada Fase 7, kosongkan baris data (bukan header/struktur tab) pada tab legacy yang digunakan, minimal `Accounts`, `LearningStates`, dan `Collections`; audit tab lain sebelum reset agar tidak ada data pengguna tertinggal. Neon tidak boleh dihapus atau di-reset sebagai bagian dari keputusan ini.

Kuota gratis
- Neon Free: VERIFIKASI angka terbaru dari halaman harga/dokumentasi Neon (penyimpanan per proyek, jam komputasi, jumlah branch, auto-suspend, riwayat pemulihan, apakah data di branch development ikut dihitung dalam batas penyimpanan). Jangan memakai angka dari ingatan; catat hasilnya di docs/kuota.md. Rancang data ringkas, hindari file/gambar besar di database, dan jangan membuat ping terus-menerus agar database tidak tidur.
- Setiap fase: tulis estimasi dampaknya ke kuota Neon dan Vercel.

Perubahan UI
- Larangan mengubah desain hanya untuk bagian di luar: tampilan Riwayat, profil dan achievement, penghapusan angka total konten, tanda seru merah pada Misi, perbaikan responsif, dan fitur baru di Bagian C.
- Bebas dari ciri AI slop; copy dalam bahasa Indonesia yang jelas.

Kejujuran
- Jika ada langkah gagal atau tidak mungkin, laporkan jujur dan beri alternatif. Jangan mengarang hasil. Tandai yang tidak bisa kamu uji (butuh perangkat fisik atau akses yang tidak kamu punya).

A5. DEFINISI SELESAI (berlaku untuk setiap butir)
1. Ada tes otomatis untuk logika yang dibuat/diubah.
2. Lolos 4 kondisi: pertama kali, setelah reload, setelah logout-login, dan di perangkat lain.
3. Ada bukti nyata: baris di database, screenshot, atau hasil tes (bukan sekadar "build berhasil").
4. Rapi di 360, 768, dan 1280 px.
5. test:all tetap hijau (tanpa regresi).

A6. CARA KERJA
- Kerjakan SATU fase pada satu waktu. Di fase besar (Fase 6), berhenti dan lapor di tiap sub-bagian. Setelah selesai, laporkan dan TUNGGU persetujuan saya sebelum fase berikutnya.
- Langkah pertama: simpan seluruh dokumen ini apa adanya ke docs/neon-migration-plan.md, baca ulang di awal tiap fase, dan beri tanda centang pada butir yang selesai.
- Format laporan tiap fase: (a) status, (b) file dibuat/diubah, (c) bukti verifikasi, (d) keputusan yang butuh saya, (e) dampak kuota, (f) yang belum bisa diverifikasi.

==========================================================
BAGIAN B — STABILISASI (FASE 0–11)
==========================================================

FASE 0 — VERIFIKASI TEMUAN AUDIT (TANPA MENGUBAH KODE)
Temuan di bawah berasal dari audit AI lain (tinjauan statis, belum terbukti). Untuk TIAP temuan tentukan TERBUKTI / TIDAK TERBUKTI / SEBAGIAN, sertakan file:baris dan cara reproduksi. Tulis di docs/audit-verification.md.
1. src/services/api.js: handleDevFallback() mengembalikan success:true (login, register, getMe, syncProgress, update profil, klaim hadiah) saat URL backend kosong, koneksi gagal, timeout, 401/403/302, action tak dikenal, atau error sesi.
2. backend/Code.gs handleUpdateProfile(): menerima payload.xp, streak, coins dari client dan langsung menyimpannya.
3. backend/Code.gs handleClaimQuestReward(): memakai payload.xpReward/coinsReward dari client, tidak memvalidasi misi/progres/klaim ganda, bisa membuat baris quest baru berstatus selesai.
4. useDailyQuests.updateProgress() tidak dipanggil dari aktivitas belajar (MissionsView/WorkspacePage), progres misi tidak bertambah.
5. useProgressSync.js: antrean pending hanya di memori (pendingQueueRef), flush di beforeunload tidak dijamin, tidak ada antrean permanen.
6. Avatar: backend menyimpan avatar_updated_at tapi handleGetProfile() tidak mengembalikan avatarUpdatedAt; frontend menghapus cache avatar saat nilainya tidak ada sehingga foto hilang setelah reload.
7. useUserProfile.js: inventory dimuat dari localStorage ("sinau_local_inventory"), api.getInventory() tidak dipanggil.
8. useUserProfile.js: nama properti totalReviewsDone vs totalReviews tidak cocok sehingga hasStudyActivity salah dan xp/streak/coins cloud bisa tertimpa 0.
9. useDailyQuests.js: key penyimpanan lokal tanpa user ID (sinau_daily_quests_<tanggal>), data antarakun bisa tercampur.
10. ContextMatching tidak menerima callback onRecordMatchComplete dari WorkspacePage, penyelesaian sesi tidak tercatat.
11. useSpacedRepetition.js: interval pertama [1,3,8,16,30] terlewat (keberhasilan pertama = 3 hari); src/lib/mastery.ts berbeda; tes mengharapkan 3 hari. Ada dua implementasi SRS.
12. SettingsPanel: target belajar harian hanya state lokal (useState(10)), tidak disimpan ke getSettings/updateSettings.
13. Notifikasi: hanya setInterval 20 detik saat aplikasi berjalan, tanpa push/periodicsync di service worker, padahal Settings menjanjikan notifikasi saat browser ditutup.
14. backend/Code.gs doPost(): lock.waitLock(...) global untuk semua request, termasuk baca.
15. useUserProfile.js: pembelian/equip/klaim/avatar/profil diterapkan lokal dulu; saat server gagal hanya console.warn, dan beli item tetap return success:true.
16. ProfileView membuat instance useUserProfile kedua padahal sudah menerima dari WorkspacePage.
17. ProfileView memakai profile.xp || 50, coins || 50, streak || 1 (nol dianggap kosong).
18. useAuth.jsx: data lokal tamu dihapus sebelum registrasi dikonfirmasi server.
19. npm test hanya menjalankan test:content dan react-srs.test; logic dan e2e tidak masuk; tidak ada GitHub Actions.

Selain itu, selidiki dan laporkan:
- AKAR MASALAH laporan saya "progres/EXP/koin tidak tercatat": apakah build production memakai fallback simulasi, apakah VITE_API_URL benar, apakah request gagal diam-diam, apakah akun yang dipakai akun demo. Jika perlu saya cek pengaturan Vercel, minta dan beri langkahnya.
- Penyebab progres misi dan achievement tidak bertambah (temuan 4, 8).
- Penyebab foto profil tidak berganti di perangkat lain: cache avatar tanpa versi, penghapusan cache yang salah, service worker (public/sw.js) yang meng-cache endpoint/gambar avatar, respons profil tanpa avatar_updated_at.
- Audit apa yang sudah ada terkait riwayat latihan.
- Temuan lain, termasuk dua definisi setupDatabase() (backend/Code.gs dan backend/setup.gs) dan jsonResponse yang tidak benar-benar mengatur status.
- Tanyakan saya jumlah akun/baris di Google Sheets (saya yang menghitung).

FASE 1 — ARSITEKTUR DAN KEPUTUSAN (TUNGGU PERSETUJUAN SAYA)
Baca dokumentasi TERBARU Neon, Neon Auth/Better Auth, dan Vercel Functions, lalu tulis docs/architecture-neon.md berisi:
1. Opsi login: (a) Neon Auth / Managed Better Auth, (b) library Better Auth open-source di Vercel Functions terhubung ke Neon, (c) opsi lain yang aman dan gratis. Beri kelebihan/kekurangan, batas gratis terbaru, dan rekomendasi. Jangan menulis sistem hashing sendiri bila ada solusi teruji.
2. Driver/ORM (mis. @neondatabase/serverless + Drizzle), alasan, dan cara migrasi skema berversi.
3. Penyimpanan foto profil: bandingkan (a) bytea kecil di Postgres (128–256 px WebP, batas ukuran ketat) dan (b) Vercel Blob free tier, dengan perhitungan ukuran terhadap batas penyimpanan Neon. Rekomendasikan satu.
4. Skema PostgreSQL (ringkas): profiles, progress (status SRS per kata), progress_events (ledger aktivitas, event_id unik), grammar_progress, daily_quests + quest_claims, story_progress, reading_quiz_attempts, matching_attempts, settings, catalog, inventory, titles, transactions (ledger XP/koin), avatars, activity_log, user_stats. Wajib: UNIQUE (user_id, event_id) untuk idempotensi, CHECK coins >= 0, konfigurasi hadiah di sisi server, tanggal pakai zona Asia/Jakarta (WIB) untuk misi, streak, batas harian, dan episode cerita.
5. Strategi migrasi data dari Google Sheets, termasuk password: migrasi hash lama lalu hash ulang saat login pertama, ATAU minta daftar ulang jika akun yang ada hanya akun uji. Sesuaikan dengan jumlah akun dari saya.
6. Penanganan cold start Neon (skeleton UI, timeout dan pesan jelas, retry terbatas, kurangi request awal).
7. Backup mandiri (pg_dump manual/terjadwal), karena pemulihan Neon Free terbatas.
8. Strategi branch Neon dan pembersihan data uji (hasil verifikasi kuota di A4).

FASE 2 — SETUP NEON + VERCEL
1. Beri langkah persis bagi saya: membuat proyek Neon (region Singapore), membuat branch development, mengambil connection string pooled, mengisi Environment Variables Vercel untuk Preview. Saya yang mengerjakan di dashboard; jangan meminta nilainya.
2. Siapkan migrasi skema, seed katalog item, .env.example, dan skrip cek koneksi yang tidak mencetak secret.

FASE 3 — AUTENTIKASI DAN API INTI
1. Login, registrasi, logout, getMe, dan sesi di Vercel Functions sesuai keputusan Fase 1. Rate limit percobaan login.
2. HAPUS fallback palsu dari build production. Mode simulasi hanya aktif bila VITE_ENABLE_MOCK=true pada build development, dengan banner "MODE SIMULASI"; build production mengabaikannya.
3. Respons API terstruktur: SUCCESS, AUTH_ERROR (minta login ulang), NETWORK_ERROR (tidak pernah dianggap sukses), VALIDATION_ERROR. Perbaiki penanganan status HTTP.
4. Pengguna belum login diarahkan membuat akun; semua fitur wajib akun.

FASE 4 — EKONOMI DAN HADIAH DI SERVER
1. updateProfile hanya boleh mengubah field yang diizinkan (display_name, active_title yang sudah terbuka, avatar). XP, koin, streak TIDAK bisa diubah lewat endpoint profil.
2. XP dan koin hanya berubah lewat operasi server yang tercatat di transactions: event_id unik, sumber aktivitas valid, batas harian per sumber, nilai hadiah dari konfigurasi server.
3. Klaim misi: server memvalidasi misi milik pengguna hari itu, target tercapai berdasarkan aktivitas tercatat, dan belum diklaim.
4. Pembelian item: cek saldo, harga katalog, syarat level, kepemilikan, dalam satu transaksi database. Gagal berarti saldo dan inventory tidak berubah.
5. Streak dihitung server berdasarkan hari aktif WIB.

FASE 5 — SINKRONISASI OFFLINE-FIRST
1. Ganti antrean memori dengan antrean permanen (outbox) di IndexedDB per pengguna. Tiap aktivitas punya event_id unik.
2. Kirim batch; hapus dari antrean HANYA setelah server mengonfirmasi. Jangan mengandalkan beforeunload (fetch keepalive/sendBeacon hanya tambahan).
3. Server idempoten dan menangani dua perangkat dengan ledger aktivitas.
4. Indikator status simpan yang jujur di UI: "Tersimpan", "Menunggu sinkronisasi (N)", "Gagal, akan dicoba lagi". Tidak boleh tampil "tersimpan" sebelum server mengonfirmasi.

FASE 6 — PINDAHKAN SEMUA FITUR KE API BARU + PERBAIKAN
Cakupan: profil, avatar, inventory, titles, settings (termasuk target harian), misi, matching, grammar, reading quiz, cerita/petualangan, SRS, statistik. Kerjakan per sub-bagian; berhenti dan lapor setelah tiap sub-bagian; semuanya memenuhi A5.

6.1 Progres dan penyimpanan
- Buktikan dengan data nyata: setelah menyelesaikan latihan, tunjukkan baris di progress_events, transactions, profiles beserta nilai EXP/koin sebelum dan sesudah. Skrip verifikasi tidak mencetak secret.
- Perbaiki temuan 8, 15, 17, 18 (cloud menang atas default; || diganti ??; jangan hapus data tamu sebelum registrasi sukses; kegagalan server terlihat di UI).

6.2 Misi harian
- Satu layanan pencatatan aktivitas (src/services/learningActivity.js) dengan pemetaan aktivitas → jenis misi (kosakata baru, review SRS, grammar, kuis, matching, bacaan, cerita). Tiap modul memanggilnya saat aktivitas selesai. Progres misi dihitung di server dari aktivitas tercatat. Klaim hanya bila target tercapai dan belum diklaim.
- Matching tersambung ke pencatatan (temuan 10).
- TANDA SERU MERAH pada menu Misi (sidebar dan bottom navigation bila ada), menggantikan badge angka "3": lingkaran merah dengan "!". Tampil HANYA bila ada minimal satu misi hari ini yang belum selesai; hilang total bila semua selesai atau data belum termuat. Pakai token warna bahaya dari design system. aria-label "Ada misi yang belum selesai"; jangan hanya mengandalkan warna. Status dihitung dari data misi di server (WIB), bukan cache lokal.
- Uji tiap jenis misi satu per satu (UI dan database, setelah reload dan di perangkat lain).

6.3 Achievement
- Progres dihitung di server dari aktivitas nyata (tabel user_stats diperbarui dalam transaksi yang sama dengan aktivitasnya). Client hanya menampilkan.
- Tiap achievement punya penghitung, target bertingkat, tanggal terbuka, dan status klaim hadiah (koin/EXP/title) yang idempoten.

6.4 HABIT Reading: hadiah sekali
- Hadiah membaca hanya SEKALI per artikel per akun, dijaga di server dengan event_id deterministik (mis. reading:<article_id>:first_complete) + UNIQUE (user_id, event_id). Hadiah kuis artikel hanya untuk percobaan pertama.
- Membaca ulang boleh; UI menjelaskan bahwa artikel sudah selesai dan tidak memberi hadiah lagi, tanpa pesan error.
- Uji: baca artikel yang sama dua kali; EXP/koin bertambah sekali dan hanya ada satu baris transactions.

6.5 Foto profil lintas perangkat
- Server selalu mengembalikan avatar_updated_at (versi); client membandingkan versi saat memuat profil dan mengambil ulang bila berbeda; endpoint avatar network-first atau URL berversi (?v=<updated_at>); cache bernamespace user_id; jangan hapus cache hanya karena field kosong; periksa service worker.
- Uji dengan dua perangkat/profil browser: ganti foto di satu, muat ulang di yang lain, foto berubah tanpa logout. Uji juga hapus foto.

6.6 SRS, pengaturan, dan lainnya
- Satukan SRS jadi SATU implementasi dan TANYAKAN saya perilaku interval yang diinginkan (usulan: keberhasilan pertama = 1 hari), lalu perbarui tes.
- Target belajar harian tersimpan di server (temuan 12).
- Satukan instance hook profil (temuan 16). Inventory dan titles dimuat dari server (temuan 7). Cache misi bernamespace user_id (temuan 9).
- Teks UI jangan menjanjikan notifikasi saat browser ditutup bila belum ada push yang benar-benar berjalan (sampai Fase 15).

6.7 Riwayat latihan (BARU)
- Halaman "Riwayat" (menu sendiri di sidebar): daftar per hari dengan filter jenis (kosakata, SRS, grammar, kuis artikel, matching, cerita) dan rentang tanggal. Tiap item: jenis, judul (mis. "Grammar: Present Perfect, kuis"), skor/akurasi, durasi, EXP dan koin.
- Detail sesi: kuis/matching menampilkan tiap soal, jawabanmu, jawaban benar, pembahasan; kosakata/SRS daftar kata dan hasil; bacaan hasil per kategori soal; cerita episode yang diselesaikan. Tombol "Latih lagi yang salah" memasukkan item salah ke antrean SRS.
- Ringkasan: aktivitas 7 hari terakhir (grafik sederhana) dan akurasi per kategori.
- Data: activity_log (ringkasan per sesi, permanen) dan attempt_details (JSONB ringkas, disimpan 90 hari lalu dipangkas). Paginasi cursor. State kosong dengan maskot Kanci.

6.8 Profil dan achievement (desain ulang)
- Audit profil sekarang, lalu desain ulang sesuai tema V2 (orisinal, bukan salinan referensi). Bagian: kartu identitas (foto, border, title aktif, nama, level), progres EXP menuju level berikutnya, ubin statistik pribadi (EXP, koin, streak, kata dikuasai per level), galeri achievement, aktivitas terbaru (tautan ke Riwayat), pengaturan akun.
- Achievement dikelompokkan per kategori (kosakata, konsistensi/streak, membaca, grammar, matching, cerita, koleksi), bertingkat (mis. 3 tingkat), progress bar, status terkunci/berjalan/selesai/siap klaim, detail (syarat, progres, tanggal diraih, hadiah), filter kategori dan status, animasi klaim bermakna (hormati reduced motion).
- Semua angka dari server dengan ?? (nol tetap 0).

6.9 Hapus angka total konten
- Hapus angka total dari data konten di dashboard dan sidebar: badge jumlah kata (mis. 2.971/2947), jumlah topik grammar, jumlah artikel, dan angka serupa yang di-hardcode atau dihitung dari .length dataset (cari "2947", "2971", "19", "156" hanya pada teks yang dirender di UI).
- Pertahankan angka fungsional dalam latihan ("soal 3 dari 10", penghitung, timer) dan statistik pribadi (EXP, koin, streak, level). Daftar semua angka yang dihapus di laporan.

6.10 Cerita/petualangan, grammar, reading quiz, matching
- Pastikan semuanya memakai API baru, progres tersimpan di server, dan lolos A5.

FASE 7 — RESET DATA LEGACY GOOGLE SHEETS (TANPA MIGRASI)
Keputusan pengguna: mulai dari nol akun. Tidak ada akun, password/hash, progres, koleksi, atau data pengguna lama yang dipindahkan ke Neon.
1. Jangan reset Sheets sebelum seluruh alur aplikasi preview sudah beralih ke API Neon dan tidak lagi membaca/menulis akun/progres melalui Apps Script. Ini mencegah login/registrasi rusak atau data lama tercipta kembali.
2. Inventarisasi semua tab yang berisi data pengguna. Minimal tab yang diketahui: `Accounts`, `LearningStates`, dan `Collections`. Pertahankan tab serta baris header/struktur; hapus hanya baris data. Periksa tab lain agar tidak ada data pengguna yang tertinggal.
3. Catat jumlah baris sebelum dan sesudah pengosongan tanpa menampilkan email, hash password, atau isi data pribadi. Verifikasi ketiga tab tersebut tidak lagi memiliki baris akun/progres/koleksi.
4. Cakupan reset hanya Google Sheets lama. JANGAN menghapus, mengosongkan, atau mengubah data di Neon. Akun yang dibuat setelah cutover harus registrasi baru dan seluruh progres/EXP/koin/streak/inventory dimulai dari nol.
5. Jangan membuat ekspor CSV atau skrip migrasi akun lama. Jangan menghapus proyek Apps Script atau spreadsheet sebelum verifikasi akhir Fase 11; data di Sheets sudah kosong, tetapi artefak legacy dapat dipertahankan sementara untuk audit.

FASE 8 — AUDIT DAN PERBAIKAN BUG HABIT READING
Audit menyeluruh: render teks dan format, daftar/filter/pencarian, penanda selesai membaca, tombol kuis, hadiah sekali per artikel (6.4), progres bacaan, tampilan mobile, artikel rusak atau kosong, konsistensi data, kuis (soal, kunci jawaban, pembahasan). Daftar semua bug dengan file:baris dan cara reproduksi, lalu perbaiki yang terbukti. Pembuktian: tes otomatis tiap artikel (render tidak error, teks tidak kosong) + uji manual sampel.

FASE 9 — TAMPILAN RAPI DI SEMUA UKURAN LAYAR
- Audit di 320, 360, 390, 412, 600, 768, 1024, 1280, 1536, 1920 px, portrait dan landscape, safe-area, pembesaran teks sistem hingga 200%, area sentuh minimal 44x44 px, tanpa scroll horizontal, tanpa teks terpotong/tumpang tindih.
- Tes screenshot otomatis (Playwright) per ukuran utama sebagai regresi. Screenshot sebelum dan sesudah.

FASE 10 — PENGUJIAN DAN CI
1. Perintah test:all yang menjalankan content, logic, integrasi API, dan e2e. GitHub Actions gratis menjalankannya pada tiap push ke cabang ini.
2. Tes keamanan wajib lulus: login salah ditolak; backend mati tidak membuat akun demo; XP/koin palsu ditolak; klaim misi belum selesai ditolak; klaim ganda hanya satu kali; beli tanpa saldo ditolak; akses data akun lain ditolak; token kedaluwarsa meminta login ulang; event_id sama tidak menggandakan hadiah.
3. Tes dua perangkat (dua profil browser): data sama di keduanya; offline lalu tutup dan buka ulang, antrean terkirim satu kali.
4. Tes 4 kondisi per fitur dan uji di 360, 768, 1280 px. Akun baru mulai dari nol di semua fitur.

FASE 11 — PERSIAPAN PRODUKSI
1. Rencana database production terpisah (branch/proyek) dan cutover, tanpa mematikan Apps Script sampai terverifikasi.
2. Backup mandiri terjadwal atau panduan manual, README operasional, panduan memantau kuota Neon dan Vercel.
3. Pull Request ke main hanya setelah semua lulus. Saya yang memutuskan merge.

==========================================================
GERBANG STABILITAS (WAJIB LULUS SEBELUM BAGIAN C)
==========================================================
"Engine" = autentikasi, sinkronisasi, progres, SRS, EXP/koin, misi, achievement, riwayat, profil/avatar, inventory, matching, grammar, HABIT reading, cerita, notifikasi dasar.
Syarat:
- npm run test:all lulus penuh dan CI hijau.
- Tes keamanan dan tes dua perangkat (Fase 10) lulus.
- Nol bug P0/P1 yang diketahui; seluruh sub-bagian Fase 6 lulus A5.
- Pemakaian nyata oleh saya minimal 7 hari tanpa kehilangan data.
- Saya menulis "GERBANG DIBUKA" secara eksplisit. Tanpa kalimat itu, JANGAN memulai satu pun fase di Bagian C, termasuk yang kecil. Jika ditemukan bug engine di Bagian C, berhenti dan perbaiki dulu.

==========================================================
BAGIAN C — EKSPANSI (FASE 12–20, SETELAH GERBANG DIBUKA)
==========================================================

Tiap fase berdiri sendiri: rencana dulu, tunggu persetujuan saya, uji, laporkan.

FASE 12 — EMAIL + LUPA PASSWORD
1. Verifikasi dari dokumentasi terbaru opsi pengiriman email yang benar-benar Rp0: (a) layanan email transaksional paket gratis (apakah bisa kirim ke alamat sembarang tanpa domain terverifikasi, kuota, syarat pengirim), (b) Apps Script MailApp dari Gmail saya lewat endpoint kecil yang dilindungi secret (kuota harian), (c) opsi lain. Beri kelebihan/kekurangan, risiko spam, rekomendasi. Tunggu keputusan saya.
2. Alur: halaman "Lupa password" meminta email; server SELALU membalas pesan netral yang sama (tidak membocorkan apakah email terdaftar); kirim link reset berisi token acak sekali pakai, disimpan sebagai hash, kedaluwarsa 30–60 menit; dibatasi per email dan per IP. Halaman buat ulang password memvalidasi token, mengatur password baru, mencabut SEMUA sesi dan token widget/push lama, lalu mengirim email pemberitahuan password diubah. Token dihapus dari URL setelah dibaca dan tidak pernah dicatat di log.
3. Selaraskan dengan solusi login Fase 1 (mis. reset bawaan Better Auth). Tes: token kedaluwarsa, dipakai dua kali, milik akun lain, email tidak terdaftar, rate limit.
4. Verifikasi email saat registrasi hanya jika saya setuju.

FASE 13 — HAPUS AKUN + PRIVACY POLICY
1. Hapus akun: konfirmasi ulang dengan password, peringatan jelas, opsi unduh data saya (JSON) sebelum menghapus, dan opsi masa tenggang 7 hari yang bisa dibatalkan (usulkan, tunggu keputusan saya). Hapus SEMUA data akun di semua tabel (profil, progres, riwayat, transaksi, inventory, titles, pengaturan, foto profil, sesi, token widget, langganan push, pesan kotak surat), diuji dengan skrip yang memastikan tidak ada baris tersisa untuk user_id itu. Dokumentasikan bahwa salinan di backup mandiri tetap ada sampai dirotasi, beserta kebijakan rotasinya.
2. Privacy policy (halaman publik /privasi, bahasa Indonesia yang jelas, tertaut dari footer landing, pengaturan, dan form registrasi): tulis HANYA berdasarkan praktik data yang benar-benar ada (audit kode): data yang dikumpulkan (email, nama, foto, progres, aktivitas, langganan notifikasi, log), tujuan, penyimpanan dan pihak ketiga (mis. Neon, Vercel, penyedia email, GitHub), lama penyimpanan, hak pengguna (akses, ubah, hapus, unduh), kontak (saya beri emailnya), kebijakan untuk pengguna di bawah umur, tanggal berlaku. Jangan menyalin teks situs lain dan jangan menulis klaim yang tidak benar. Rujukan hukum (mis. UU PDP) harus diverifikasi dari sumber resmi. Tandai sebagai DRAF yang bukan nasihat hukum dan perlu ditinjau pihak yang paham UU PDP.
3. Kotak persetujuan saat daftar; simpan consent_version dan waktunya.

FASE 14 — KOTAK SURAT
Satu "Kotak Surat" (ikon di header/sidebar dengan badge belum dibaca) untuk info pembaruan aplikasi dan notifikasi in-app (misi, pencapaian, laporan mingguan, sistem).
1. Pesan global disimpan SATU kali di tabel announcements dengan status baca per pengguna di tabel terpisah (hemat penyimpanan). Pesan personal di inbox_messages per user_id.
2. Konten pembaruan ditulis sebagai file markdown di repo (mis. content/changelog/YYYY-MM-DD.md) dan disinkronkan ke announcements saat deploy, tanpa panel admin.
3. Fitur: kategori dan filter, tandai dibaca/belum, hapus, deep link ke fitur terkait, paginasi, state kosong dengan Kanci, retensi pesan personal 90 hari.
4. Semua dihitung di server; badge konsisten lintas perangkat.

FASE 15 — IN-APP DAN PUSH NOTIFICATION
1. In-app: toast/banner dan masuk ke Kotak Surat.
2. Push: Web Push (VAPID) lewat Vercel Functions; langganan di tabel push_subscriptions (per perangkat; dibersihkan saat gagal atau logout). Izin diminta sopan, bisa diatur per jenis di Pengaturan. Tombol "Uji notifikasi". Perbaiki masalah pengingat misi yang tidak muncul pada jamnya.
3. PENJADWALAN (batas nyata): Vercel Hobby setahu saya hanya mengizinkan cron sekali per hari dengan waktu yang bisa meleset (verifikasi di dokumentasi terbaru). Usulkan pemicu eksternal gratis (mis. GitHub Actions terjadwal) beserta kelemahannya. JANGAN membangunkan database Neon terlalu sering: pakai beberapa slot jam tetap (mis. pagi, siang, sore, malam WIB), pengguna memilih slot, query ringan, kirim dalam batch agar muat dalam batas durasi fungsi. Hitung perkiraan pemakaian kuota Neon dan Vercel dan tunjukkan ke saya.
4. Teks UI tidak boleh menjanjikan hal yang tidak berjalan. Notifikasi melayang (heads-up) diatur Android/Chrome; jelaskan batasannya dan sediakan panduan pengaturan.
5. Isi notifikasi konkret, maksimal 1 pengingat per hari, hormati jam tenang, jangan kirim bila misi hari itu sudah selesai.

FASE 16 — SMART ANALYSIS + SARAN DAN PRIORITAS BELAJAR
1. Analisis deterministik dari data aktivitas milik pengguna sendiri (tanpa API AI berbayar, tanpa pelacak pihak ketiga): akurasi per keterampilan (kosakata, grammar, kategori soal bacaan General/Specific/Implied/Vocabulary in Context, matching), topik/kata terlemah, laju lupa (SRS), konsistensi (hari aktif, jam belajar), laju belajar per minggu, pola kesalahan berulang. Estimasi level CEFR hanya sebagai estimasi berlabel dengan batas data minimum; bila data kurang tampilkan "Data belum cukup".
2. Halaman "Analisis" dengan grafik sederhana dan penjelasan "mengapa" tiap temuan.
3. "Prioritas Belajar": 3–5 saran berperingkat, masing-masing dengan alasan, estimasi menit, dan deep link; diperbarui harian dan terhubung dengan pembuat misi harian. Rumus skor tertulis di docs/rekomendasi.md dan deterministik. Pengguna bisa menunda/menyembunyikan saran.
4. Dihitung di server dari activity_log/user_stats dengan query ringan, pra-agregasi harian, dan caching.

FASE 17 — LAPORAN MINGGUAN
1. Dibuat sekali seminggu (WIB) dari analisis Fase 16: hari aktif, EXP, kata baru/diulang, akurasi, kategori terkuat dan terlemah, streak, misi dan achievement, perbandingan dengan minggu lalu, 3 prioritas minggu depan.
2. Dikirim ke Kotak Surat; email opsional (opt-in, default mati) lewat layanan Fase 12. Arsip laporan (12 minggu).
3. Penjadwalan mengikuti batas Fase 15 dan dibuat dalam batch kecil. Pengguna tanpa aktivitas mendapat pesan singkat yang menyemangati, bukan laporan kosong.

FASE 18 — FOOTER
Tulisan kecil di footer landing page dan footer Pengaturan dengan dua tautan: GitHub (https://github.com/riiddev, verifikasi) dan Instagram (username saya beri; sebelum itu simpan sebagai konstanta di src/config/social.js, jangan menebak). Tab baru dengan rel="noopener noreferrer", aria-label jelas, kontras terbaca, responsif. Tautkan Privacy Policy dari footer yang sama.

FASE 19 — WIDGET LAYAR UTAMA ANDROID
Perangkat saya Android. Yang dimaksud widget di layar utama HP, bukan komponen di dalam website. Target Rp0. Distribusi: APK dipasang langsung (sideload).
19.1 VERIFIKASI (tanpa ubah kode): baca dokumentasi resmi terbaru (Chrome/Android, Capacitor, Android App Widgets); laporkan jujur apakah PWA di Chrome Android bisa membuat widget layar utama; jangan mengarang dukungan.
19.2 TAHAP A (gratis, lebih dulu): PWA shortcuts di manifest ("Misi Hari Ini", "Review (SRS)", "Riwayat") dengan deep link; Badging API pada ikon aplikasi saat ada misi belum selesai (verifikasi dukungan dan jelaskan batasnya). Uji di HP Android saya.
19.3 TAHAP B (rencana dulu, tunggu persetujuan saya):
- Bungkus web app dengan Capacitor (folder android/); jelaskan cara kerja, konsekuensi pembaruan, apa yang harus saya install (Android Studio), langkah build APK, USB debugging, dan pasang APK.
- Widget native (Kotlin; Jetpack Glance bila cocok) dengan komposisi container (kartu/Box berlatar dan sudut membulat), row (ikon, teks, angka), dan stack (lapisan: latar + konten, mis. badge tanda seru di atas kartu). Tiga ukuran: kecil (misi x dari 3 dan streak), sedang (daftar misi + tombol "Lanjut belajar"), besar (misi, streak, dan prioritas belajar hari ini bila Fase 16 sudah ada). Jelaskan pemetaan ke Box/Row/Column dan beri mockup dulu untuk persetujuan saya.
- Data: endpoint ringkas read-only (mis. /api/widget/summary) dengan token khusus widget bercakupan terbatas (bukan token sesi penuh), disimpan di EncryptedSharedPreferences, dicabut saat logout dan bisa dicabut dari server.
- Penyegaran: WorkManager berkala (batas minimum Android sekitar 15–30 menit) + tombol segarkan manual; offline menampilkan data terakhir beserta waktunya. Jangan menjanjikan real-time.
- Keystore/kunci penandatanganan TIDAK di-commit; sediakan .gitignore dan panduan membuatnya. Tidak ada secret di kode widget.
- Uji di HP Android saya (saya yang build dan melapor): login, logout, offline, semua misi selesai (tanda seru hilang), ganti akun. Tulis docs/android-widget.md.

FASE 20 — TAMBAH 5.000 KOSAKATA (TERAKHIR, PALING BERISIKO)
1. SUMBER DAN LISENSI DULU (tunggu keputusan saya): usulkan sumber daftar kata yang sah (frekuensi/level CEFR) dengan lisensi dan kewajibannya (atribusi/share-alike); hindari menyalin konten berhak cipta (daftar Oxford dan definisinya berhak cipta). American Oxford 3000 yang sekarang tidak diubah.
2. Data per kata: word_id baru yang stabil dan unik (word_id lama tidak boleh berubah atau dipakai ulang), kata, kelas kata, perkiraan level CEFR, IPA, makna Indonesia, definisi Inggris sederhana, contoh kalimat + terjemahan, tag topik, sumber, status tinjauan. Deteksi duplikat terhadap data yang ada, normalisasi bentuk kata, saring nama diri/kata kasar/arkais, tandai konten hasil generate "perlu ditinjau".
3. Per batch 500 kata. Setelah tiap batch tunjukkan 30 sampel acak untuk saya periksa (IPA, makna, contoh) beserta laporan duplikat dan kata bermasalah. Jangan lanjut tanpa persetujuan saya. Jangan mengarang IPA atau makna yang kamu ragukan; tandai "perlu verifikasi". Bila kualitas tidak tercapai, serahkan lebih sedikit dan laporkan, jangan mengisi demi angka.
4. Teknis: data statis di frontend (JSON per level/chunk, dimuat malas, diindeks untuk pencarian), BUKAN di Neon; hanya progres per kata di database. Ukur dan laporkan ukuran bundle dan dampak waktu muat di HP. Kosakata, SRS, Matching, Kuis, dan Misi harus bekerja dengan kata baru tanpa mengubah progres kata lama. Jangan menampilkan angka total kata di UI.

==========================================================
MULAI SEKARANG
==========================================================
1. Simpan dokumen ini apa adanya ke docs/neon-migration-plan.md.
2. Kerjakan FASE 0 saja (tanpa mengubah kode), lalu laporkan dan tunggu persetujuan saya.

==========================================================
CATATAN STATUS PELAKSANAAN — 6 NOVEMBER 2026
==========================================================
- Fase 0: audit statis dan laporan verifikasi sudah didokumentasikan. Pengujian runtime/production yang membutuhkan akses dashboard dan database tetap ditandai belum terverifikasi.
- Fase 1: riset arsitektur dan kuota sudah didokumentasikan di `docs/architecture-neon.md` dan `docs/kuota.md`. Rekomendasi teknis telah disiapkan, tetapi keputusan final komponen masih menunggu persetujuan pengguna.
- Keputusan data: tidak memigrasikan akun/progres lama dari Google Sheets; reset hanya menyentuh Sheets pada Fase 7 setelah preview cutover; Neon tidak boleh dihapus atau dikosongkan.
- Fase 2 belum dimulai. Belum ada Neon project/branch baru, Environment Variables yang diubah, migration database yang dijalankan, atau deployment Production yang dilakukan.
- Main dan PR merge tetap menunggu keputusan eksplisit pengguna.


==========================================================
STATUS FASE 2 — 6 NOVEMBER 2026
==========================================================
- Pengguna menyetujui tujuh rekomendasi arsitektur Fase 1.
- Pemeriksaan read-only Vercel menemukan project `sinauuenglish` di tim Hobby, terhubung ke repo `riiddev/testesaja`; Preview branch `feat/neon-migration` saat pemeriksaan berjalan di region `iad1`.
- Konfigurasi repository `vercel.json` disiapkan untuk mengarahkan Function Preview ke Singapore `sin1`. Perubahan berlaku pada deployment dari branch ini; Production tidak disentuh.
- Neon project/branch belum dapat dibuat atau diverifikasi melalui koneksi yang tersedia. Pemilik akun harus membuat/memilih project di Neon Console dan menyiapkan branch `development`.
- Runtime memakai pooled `DATABASE_URL`; migration/backup memakai direct `DATABASE_URL_UNPOOLED`. Direct URL tidak disimpan pada Vercel runtime.
- Environment Variables Vercel: BETTER_AUTH_SECRET (Sensitive) dan BETTER_AUTH_URL telah dibuat khusus untuk Preview branch; DATABASE_URL pooled menunggu Neon project. Variable legacy `SINAI_APPS_SCRIPT_URL` tidak diubah.
- Schema Drizzle, dua migration awal, seed katalog, dan skrip koneksi sudah tersedia sebelum Fase 2; konfigurasi migrasi/koneksi diperketat. Belum ada migration atau seed yang dijalankan pada database.
- Lihat `docs/fase-2-setup.md` untuk checklist langkah manual, verifikasi, dan batas aman.
- Environment Variables Vercel branch-specific `BETTER_AUTH_SECRET` (Sensitive) dan `BETTER_AUTH_URL` telah dibuat untuk Preview `feat/neon-migration`; `DATABASE_URL` pooled masih menunggu project Neon development.
- CI run 42246638151 berhasil untuk install, audit logic/content, dan build Vite; Backend Integration & Security Tests dilewati karena DATABASE_URL belum tersedia.
- Preview deployment commit ini berstatus READY dan region Function terverifikasi `sin1`; alias branch tetap `https://sinauuenglish-git-feat-neon-migration-thoodev.vercel.app`.
