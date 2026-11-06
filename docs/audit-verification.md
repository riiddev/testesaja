# Fase 0 — Verifikasi Audit Kode SINAUENGLISHV2

Tanggal: 6 November 2026  
Repository: riiddev/testesaja  
Branch kerja: feat/neon-migration  
Baseline main: 395ce73409b08690b195da0254599294536a1dde  
Metode: inspeksi statis file pada branch kerja melalui GitHub; pemeriksaan konfigurasi, rute API, skema, test scripts dan CI.  
Batas kerja: tidak ada source aplikasi yang diubah dan tidak ada request tulis ke Neon, Vercel Production, Google Sheets, Apps Script atau Drive.

> Status “TERBUKTI (legacy GAS)” berarti masalah memang ada di implementasi Apps Script lama. Itu tidak otomatis berarti frontend saat ini memakai handler tersebut. Jalur utama beberapa fitur sudah dialihkan ke Vercel Functions. Setiap temuan dibedakan menurut jalur legacy dan jalur Vercel saat ini.

## 1. Ringkasan 19 temuan

| No. | Status | Kesimpulan |
|---:|---|---|
| 1 | **SEBAGIAN** | Mock success masih ada untuk development yang diaktifkan eksplisit. Build production tidak memenuhi kondisi mock. Aksi inti sudah dipetakan ke Vercel; beberapa aksi tersisa masih memakai VITE_API_URL/GAS. |
| 2 | **TERBUKTI — legacy GAS** | handleUpdateProfile menulis XP, streak, dan coins dari payload. Endpoint Vercel profile/update saat ini membatasi field. |
| 3 | **TERBUKTI — legacy GAS** | handleClaimQuestReward mempercayai hadiah dari payload dan dapat membuat baris selesai tanpa aktivitas. Endpoint Vercel quests/claim saat ini memvalidasi progres dan klaim. |
| 4 | **SEBAGIAN** | updateProgress dari hook tidak dipakai langsung di WorkspacePage. Namun misi Vercel dihitung dari event progres dan activity log server; SRS, matching, grammar, reading, serta story memiliki jalur pencatatan. Ada risiko refresh UI misi tertunda dan perlu tes end-to-end. |
| 5 | **TIDAK TERBUKTI** | Antrean persisten ada di IndexedDB, dengan fallback localStorage per user. Item dihapus sesudah ACK. pagehide/visibility flush tetap best-effort. |
| 6 | **SEBAGIAN** | GAS handleGetProfile tidak mengirim avatarUpdatedAt; client menghapus cache jika versi hilang. API Neon mengembalikan timestamp. Cache browser tidak user-namespaced. Tes dua perangkat belum dijalankan. |
| 7 | **TIDAK TERBUKTI** | Klaim api.getInventory tidak dipanggil salah: hook memanggil endpoint inventory. Namun state awal menggunakan cache lokal global; bila fetch gagal, data lama dapat bertahan di state. |
| 8 | **TIDAK TERBUKTI** | Hook mengembalikan totalReviewsDone; ketidakcocokan totalReviews vs totalReviewsDone tidak ditemukan. Statistik beberapa achievement masih berasal dari progressMap/localStorage, bukan semuanya server-authoritative. |
| 9 | **SEBAGIAN** | Key localStorage sudah mencakup user ID dan tanggal. Akan tetapi state hook tidak diinisialisasi ulang saat user berubah dan hasil remote digabungkan dengan state sebelumnya. |
| 10 | **TIDAK TERBUKTI** | ContextMatching menerima callback dan memanggilnya saat semua pasangan selesai; WorkspacePage meneruskan callback untuk mencatat matching. |
| 11 | **SEBAGIAN** | Dua implementasi SRS tetap ada. Keduanya memakai [1, 3, 8, 16, 30] hari, sehingga keberhasilan pertama = 1 hari. Model data dan penggunaannya belum disatukan. |
| 12 | **SEBAGIAN** | API settings membaca dan menyimpan target harian. Tetapi SettingsPanel membaca properti respons yang salah sehingga target tersimpan dapat tidak dimuat kembali. Error simpan hanya dicatat ke console dan state UI sudah berubah. |
| 13 | **TERBUKTI** | Pengingat terjadwal hanya diperiksa dengan setInterval 20 detik saat halaman hidup. Service worker tidak memiliki handler push atau periodicSync. |
| 14 | **TERBUKTI — legacy GAS** | doPost memakai ScriptLock global sebelum dispatch sehingga request baca juga menunggu lock. |
| 15 | **SEBAGIAN** | Pembelian server-first dan mengembalikan kegagalan. Upload/hapus avatar mengubah UI/cache lebih dulu dan tetap melaporkan success saat request gagal. Equip hanya console.warn saat gagal. |
| 16 | **TIDAK TERBUKTI pada WorkspacePage** | ProfileView memakai hook yang diberikan WorkspacePage. Hook internal hanya dibuat jika prop tidak diberikan. |
| 17 | **TIDAK TERBUKTI pada ProfileView** | ProfileView menjaga nol dengan ?? 0. Namun legacy GAS handleGetProfile memakai Number(streak) || 1, sehingga streak nol dapat ditampilkan sebagai satu pada jalur legacy. |
| 18 | **TIDAK TERBUKTI** | Registrasi dikirim ke server lebih dulu; cache tamu dibersihkan setelah respons sukses dan user dikonfirmasi. |
| 19 | **SEBAGIAN** | GitHub Actions tersedia. npm test, test:logic dan build berjalan di workflow. test:all tidak menjalankan E2E, workflow tidak menjalankan E2E/responsive test dan backend test dilewati jika DATABASE_URL tidak tersedia. |

## 2. Detail setiap temuan dan cara reproduksi

### 1. Mock fallback dan VITE_API_URL
File: src/services/api.js:14-19, 128-219, 233-310, 317-446.
- IS_MOCK_ALLOWED hanya true jika import.meta.env.DEV dan VITE_ENABLE_MOCK === "true".
- Register, login, logout, getMe, profile, inventory, purchase/equip, reward, quest, progress, settings, avatar, title, grammar, story, matching, reading quiz, dan history diarahkan ke endpoint same-origin /api.
- Sisa aksi legacy menggunakan VITE_API_URL. Tanpa URL dan tanpa mock development, request melempar NetworkError; timeout/network error juga tidak dianggap sukses di production.
- handleDevFallback memang memberi success:true pada data simulasi, tetapi hanya dapat dipakai saat kondisi development eksplisit terpenuhi.
- Cara reproduksi aman: jalankan build development pada data dummy dengan VITE_ENABLE_MOCK=true; ulangi pada build production dengan endpoint development tidak tersedia dan pastikan request gagal, bukan mengembalikan data dummy. Jangan menguji fallback dengan akun production.
- VITE_API_URL tidak menjadi penentu utama API Neon yang sudah dipetakan ke /api. Nilai itu hanya dipakai aksi legacy yang belum dipindahkan.
- Catatan tambahan: api.logout() pada src/services/api.js:471-479 menelan kegagalan request logout, menghapus token lokal, lalu selalu mengembalikan success:true. Ini false success terpisah: server mungkin belum mencabut sesi walaupun client sudah keluar.

### 2. backend/Code.gs — handleUpdateProfile
File: backend/Code.gs:642-677.
- Baris 662-664 menulis payload.xp, payload.streak, dan payload.coins langsung ke sheet Profiles.
- Jika profil belum ada, baris 668-675 memberi default XP=50, streak=1, coins=50 bila payload tidak mengirim nilai.
- Cara reproduksi aman: tinjau payload handler pada salinan Apps Script dummy dan kirim nilai palsu. Jangan menjalankan pada Spreadsheet pengguna.
- Jalur aktif saat ini: src/services/api.js memetakan updateProfile ke /api/profile/update. Handler Vercel api/_handlers/profile/update.js:24-85 hanya menerima displayName, avatarKey, activeTitle, dan mengabaikan XP/koin/streak.

### 3. backend/Code.gs — handleClaimQuestReward
File: backend/Code.gs:1006-1068.
- Baris 1012-1013 membaca xpReward dan coinsReward dari payload client.
- Pengecekan yang terlihat hanya klaim sebelumnya; tidak menghitung progres dari event aktivitas.
- Jika baris misi belum ada, baris 1032-1038 membuat baris baru dengan progress=1,target=1 dan claimed=true.
- Handler lalu menambahkan XP/koin ke profil.
- Jalur Vercel sekarang: api/_handlers/quests/claim.js:26-105 mengambil misi hari ini dari server, menolak misi yang belum tercapai, menolak klaim ganda, dan mengambil nilai hadiah dari katalog misi server. Ini tidak menghapus risiko endpoint legacy yang masih terpasang.

### 4. Pencatatan dan progres misi
File: src/hooks/useDailyQuests.js:20-22, 40-73, 82-130; src/pages/WorkspacePage.jsx:85-90, 300-310; src/services/learningActivity.js:16-157; api/_lib/dailyQuestProgress.js:1-160; api/_handlers/quests/update.js:1-46.
- useDailyQuests menyediakan updateProgress, tetapi WorkspacePage tidak mengambil callback tersebut dari hook.
- LearningActivity mencatat matching, grammar, reading quiz, reading complete, dan story. SRS membuat progressEvents melalui api/_handlers/progress/sync.js.
- dailyQuestProgress.js menghitung misi dari progressEvents (vocab_learn dan srs_review) serta activityLog (grammar, reading, matching, story).
- Endpoint quests/update saat ini mengabaikan progress/target/tanggal dari browser dan membangun ulang snapshot berdasarkan data server. Endpoint quests/claim memvalidasi target server.
- Jadi klaim bahwa progres misi sama sekali tidak bertambah hanya karena updateProgress tidak dipanggil tidak terbukti. Risiko yang tersisa adalah hook UI tidak selalu menyegarkan sidebar segera setelah aktivitas; perlu tes browser per aktivitas dan setelah reload.
- Cara reproduksi aman: gunakan akun uji pada Preview, catat aktivitas satu jenis, periksa row sumber dan panggil GET /api/quests/get; bandingkan snapshot dengan UI. Belum dilakukan pada sesi audit ini.

### 5. Outbox offline
File: src/hooks/useProgressSync.js:16-23, 130-170, 230-255; src/services/outboxDb.js:1-10, 22-65, 84-190.
- Outbox memakai IndexedDB sinau_offline_db, object store outbox, index userId.
- Bila IndexedDB tidak tersedia, fallback localStorage menggunakan key sinau_outbox_<userId>.
- Flush mengirim batch dan removeConfirmedEvents hanya membuang event ID yang dikonfirmasi server.
- pagehide dan visibilitychange hanya pemicu tambahan; browser dapat menghentikan fetch saat ditutup.
- Klaim antrean hanya memori tidak terbukti.
- Tes offline lalu tutup/buka ulang dan dua browser belum dilakukan.

### 6. Avatar, versi, dan service worker
File: backend/Code.gs:558-640, 764-865; src/hooks/useUserProfile.js:8-11, 176-200, 293-344; api/_handlers/profile/get.js:15-45; api/_handlers/avatar/upload.js:18-91; api/_handlers/avatar/get.js:18-45; public/sw.js:7-16, 49-87.
- GAS handleUploadAvatar menyimpan avatar_updated_at, namun handleGetProfile membangun object profil tanpa avatarUpdatedAt.
- Frontend useUserProfile membandingkan remoteP.avatarUpdatedAt. Jika timestamp tidak ada sementara cache URL ada, frontend menghapus cache gambar.
- API Neon profile/get mengirim row profile termasuk avatarUpdatedAt; avatar/upload memperbarui timestamp; avatar/get mengembalikan timestamp dan image data.
- Cache avatar, timestamp, dan profile memakai key localStorage global, bukan key dengan userId. Auth menghapus key global saat ganti akun/logout, tetapi desain namespace sesuai A4 belum diterapkan.
- Service worker menyimpan app shell dan aset statis dengan request.destination style/script/image/font. Request API JSON bukan kategori aset itu; tidak ditemukan aturan khusus yang menyimpan endpoint /api/avatar ke cache. Jadi cache SW sebagai penyebab langsung foto lama tidak terbukti.
- Tes dua browser/perangkat, ganti foto tanpa logout, reload, hapus foto belum dilakukan.

### 7. Inventory
File: src/hooks/useUserProfile.js:8-11, 55-62, 125-146; src/services/api.js:150-158; api/_handlers/economy/inventory.js:1-35.
- Inventory memang diinisialisasi dari localStorage.
- Namun hook secara eksplisit memanggil api.getInventory() dalam Promise.all dan mengganti state dengan data server bila respons sukses.
- Karena itu klaim bahwa api.getInventory tidak pernah dipanggil tidak terbukti.
- Risiko yang tersisa: bila server fetch gagal, state awal dari cache masih bisa terlihat; key cache tidak mengandung userId. Auth memang membersihkan key global saat perubahan akun, tetapi hook state lama dan kegagalan fetch perlu diuji.

### 8. totalReviewsDone dan hasStudyActivity
File: src/hooks/useUserProfile.js:64-107, 125-171; api/_handlers/titles/unlock.js:25-76.
- Hook menghitung totalReviews dari progressMap dan mengembalikan field totalReviewsDone. Mismatch nama properti yang dituduhkan tidak ditemukan.
- Hook tidak memiliki properti hasStudyActivity pada bagian yang diaudit.
- Profile XP, streak, coins digabung dari remote profile dengan pemeriksaan remote field !== undefined dan nullish fallback; data cloud tidak otomatis tertimpa nol karena ketidakcocokan nama ini.
- Temuan lain: statistik UI achievement tidak seluruhnya berasal dari server. readingCount dan grammarCount dibaca dari localStorage; adventureCompletedCount dihitung dengan rumus lokal sintetis di useUserProfile.js:84-101. API titles/unlock memeriksa statistik userStats server di api/_handlers/titles/unlock.js. Karena itu progres achievement yang tampil di UI dapat berbeda dari syarat yang server terima. Ini kandidat kuat penyebab progres achievement tidak konsisten lintas perangkat.

### 9. Namespace misi harian
File: src/hooks/useDailyQuests.js:20-22, 27-35, 40-73.
- Storage key sudah berbentuk sinau_daily_quests_<userId>_<tanggal>; tuduhan key tidak memiliki user ID adalah salah.
- Namun storedQuests diinisialisasi sekali saat hook dibuat. Saat user/storageKey berubah, effect mengambil remote dan menggabungkan remoteQuests dengan prev. State lama dari pengguna sebelumnya dapat terbawa sementara/tercampur ke UI.
- Perbaikan seharusnya memuat ulang state saat user ID atau tanggal berubah dan tidak menggabungkan dua namespace yang berbeda.
- Cara reproduksi aman: dua akun uji, login sebagai A, buka misi; logout-login sebagai B pada tab yang sama; amati isi misi sebelum dan sesudah respons server. Belum diuji runtime.

### 10. ContextMatching callback
File: src/features/matching/ContextMatching.jsx:5, sekitar 95-108; src/pages/WorkspacePage.jsx:300-310.
- Component menerima onRecordMatchComplete.
- Callback dijalankan saat jumlah matchedPairs sama dengan totalPairs.
- WorkspacePage mengirim callback yang memanggil recordLearningActivity dengan activityType matching.
- Klaim callback tidak diteruskan tidak terbukti.
- Cara reproduksi: selesaikan semua pasangan pada akun Preview dan periksa POST /api/matching/record serta activity_log. Belum dilakukan.

### 11. Dua implementasi SRS
File: src/hooks/useSpacedRepetition.js:7-54; src/lib/mastery.ts:8-123; tests/react-srs.test.mjs:1-55; tests/logic.test.mjs:1-60.
- Kedua implementasi mendefinisikan [1,3,8,16,30].
- Pada kedua alur, keberhasilan pertama menghasilkan interval 1 hari.
- Tes react-srs mengharapkan urutan 1,3,8,16,30.
- Masih ada dua model data berbeda: state hook berbasis correctCount/masteryStage dan lib/mastery berbasis reviewSuccesses/skillEvidence.
- Bug interval pertama=3 hari tidak ditemukan; duplikasi engine tetap nyata dan berisiko menyebabkan perilaku berbeda ketika modul berpindah implementasi.

### 12. Target belajar harian
File: src/features/settings/SettingsPanel.jsx:23-53; api/_handlers/settings/get.js:15-40; api/_handlers/settings/update.js:20-85.
- State awal SettingsPanel adalah useState(10).
- API GET membungkus nilai di response data.settings.dailyGoal.
- SettingsPanel hanya memeriksa res.data.dailyGoal atau res.dailyGoal; tidak membaca res.data.settings.dailyGoal. Target yang sebelumnya disimpan selain 10 tidak dimuat dengan benar.
- POST updateSettings menyimpan dailyGoal di server dan memvalidasi rentang 1–100.
- UI mengubah state sebelum respons, tidak memeriksa res.success, dan hanya console.error saat gagal. Jadi server persistence ada, namun load path dan error UI bermasalah.

### 13. Notifikasi saat browser ditutup
File: src/hooks/usePWA.js:143-168; public/sw.js:118-135.
- Pengingat dijadwalkan dengan setInterval(checkReminderSchedule, 20000) dari konteks halaman.
- Service worker dapat menampilkan test notification melalui message SHOW_TEST_NOTIFICATION, dan menangani notificationclick.
- Tidak ada event listener push dan tidak ada periodicSync.
- Saat halaman/browser tertutup, timer halaman tidak berjalan. Klaim notifikasi terjadwal ketika browser ditutup tidak didukung implementasi saat ini.

### 14. Lock global Apps Script
File: backend/Code.gs:41-48.
- doPost mengambil LockService.getScriptLock dan memanggil waitLock sebelum parsing action.
- Lock berlaku untuk semua POST yang masuk doPost, termasuk aksi baca.
- Ini masalah pada backend GAS legacy; Vercel API tidak melewati lock ini.

### 15. Operasi profil/avatar dan ekonomi optimistis
File: src/hooks/useUserProfile.js:293-375, 376-420.
- uploadCustomAvatar mengubah avatarUrl dan localStorage sebelum server merespons. Jika api.uploadAvatar gagal, fungsi mengembalikan success:true dengan warning.
- deleteCustomAvatar menghapus avatar lokal sebelum request; kegagalan hanya console.warn; fungsi selalu mengembalikan success:true.
- buyItem memanggil server terlebih dahulu dan mengembalikan success:false pada kegagalan.
- equipItem menunggu server, tetapi catch hanya console.warn dan tidak memberi hasil gagal yang konsisten.
- Klaim reward diperiksa melalui respons server pada hook.
- Jadi temuan sebagian; perilaku palsu paling jelas pada upload/delete avatar.

### 16. Instance hook ProfileView
File: src/features/profile/ProfileView.jsx:12-21; src/pages/WorkspacePage.jsx:399-407.
- ProfileView memakai hook yang dikirim lewat userProfileHook.
- WorkspacePage meneruskan userProfile yang sudah dibuat sekali.
- Hook internal hanya dibuat jika ProfileView dipanggil tanpa userProfileHook. Dugaan duplikasi pada jalur Workspace tidak terbukti.

### 17. Fallback angka profil
File: src/features/profile/ProfileView.jsx:341,357,370; backend/Code.gs:558-576.
- ProfileView menggunakan profile.xp ?? 0, profile.coins ?? 0 dan profile.streak ?? 0; nilai nol tetap nol.
- Jalur GAS terpisah masih memakai Number(pData[i][4]) || 1 untuk streak. Nilai 0 di baris lama menjadi 1 bila handler ini dipakai.
- Temuan khusus ProfileView tidak terbukti; bug legacy GAS pada streak=0 terbukti.

### 18. Data tamu saat registrasi
File: src/hooks/useAuth.jsx:79-90.
- api.register dijalankan dahulu.
- clearLocalUserCache baru dijalankan setelah res.success dan res.data.user.
- Tidak ditemukan penghapusan data tamu sebelum server mengonfirmasi pendaftaran. Tuduhan tidak terbukti.

### 19. Test scripts dan CI
File: package.json:9-17; .github/workflows/ci.yml:1-44.
- GitHub Actions workflow ada; tidak benar bahwa CI tidak tersedia.
- npm test menjalankan audit konten dan react-srs.test.
- npm run test:logic menjalankan logic, SRS, router, quest, password compatibility, catalog, dan outbox migration tests.
- npm run test:all menjalankan audit konten, test:logic, responsive audit, dan test:api; script test:e2e tidak termasuk di dalam test:all.
- Workflow CI menjalankan npm ci, npm test, test:logic, build; test:api hanya jika secret DATABASE_URL tersedia. Workflow tidak menjalankan test:e2e maupun test:all.
- Run GitHub Actions 42210443701 berstatus success, tetapi langkah backend integration/security tests berstatus skipped. Success tersebut bukan bukti tes backend/Neon lolos.
- Cara reproduksi: periksa file package.json/workflow; untuk bukti runtime jalankan npm run test:all dalam environment development yang disiapkan dan amati apakah DB tests memang tersedia. Tidak ada run test:all baru dilakukan oleh audit ini.

## 3. Investigasi akar masalah progres, EXP, dan koin

### Temuan kode yang dapat dipastikan
1. Aksi inti di src/services/api.js dipetakan ke endpoint Vercel /api. Untuk jalur itu, VITE_API_URL bukan URL utama.
2. DB runtime dibangun dari process.env.DATABASE_URL pada db/index.js:5-15. Jika variabel tidak ada atau salah di Vercel Preview/Production, endpoint yang menyentuh database gagal.
3. Mock development tidak berjalan otomatis pada production. Syaratnya DEV dan VITE_ENABLE_MOCK=true.
4. Learning activity saat ini mengubah result.success menjadi false pada jalur catch (src/services/learningActivity.js:144-150); dugaan false success dari versi sebelumnya tidak berlaku pada file branch sekarang.
5. MissionsView menunggu claimReward dengan await dan hanya menampilkan feedback sukses jika hasil true (src/features/missions/MissionsView.jsx:20-31). Dugaan lama tidak menunggu server tidak berlaku.
6. Avatar upload/delete masih mengembalikan success:true meski API gagal (src/hooks/useUserProfile.js:293-344).
7. api.logout selalu mengembalikan success:true meskipun request server gagal; ini menyangkut pencabutan sesi, bukan kredit belajar.
8. Endpoint progres SRS api/_handlers/progress/sync.js menulis progressEvents lebih dulu (sekitar baris 121), kemudian mengubah progress/userStats, lalu mencatat ledger (sekitar baris 181 dan seterusnya). Semua operasi tersebut tidak dibungkus dalam satu transaksi database eksplisit. Jika event tersimpan lalu proses berikutnya gagal, retry dapat menemukan eventId yang sudah ada (sekitar baris 85), memasukkannya ke processedEvents dan melewati langkah yang belum selesai. Ini risiko konkret kehilangan sebagian update/XP akibat partial failure; perlu tes fault-injection di Neon development dan perbaikan transaksi sebelum dinyatakan aman.
9. api/_lib/ledger.js:21-95 melakukan cek idempotensi, insert transaksi, dan update profil dalam query terpisah tanpa transaksi eksplisit. Jika insert ledger berhasil tetapi update profil gagal, retry dapat melihat event sudah ada lalu tidak memperbaiki saldo profil. Jika dua permintaan identik terjadi bersamaan, hasil juga bergantung pada constraint unique dan penanganan konflik. Ini risiko integritas ekonomi yang perlu diprioritaskan.
10. Proses server tidak bisa disimpulkan sebagai penyebab insiden produksi tanpa mengetahui commit yang sedang di-deploy, Environment Variables yang ada, akun yang digunakan, dan row database aktual.

### Yang belum dapat dibuktikan dari repository
- Apakah Vercel Production/Preview sedang menjalankan commit feat/neon-migration atau commit lain.
- Apakah DATABASE_URL pada Preview/Production sudah terpasang dan menunjuk ke branch Neon yang benar.
- Apakah pengguna masuk ke akun pribadi atau akun demo.
- Apakah request gagal pada jaringan/timeout atau server merespons error.
- Apakah progress_events, transactions dan profiles menerima baris untuk sesi yang dikeluhkan.
- Nilai EXP/koin sebelum dan sesudah suatu sesi.

### Pemeriksaan Vercel yang aman
Jika deployment Preview akan diuji, buka Vercel Dashboard → project yang terhubung ke riiddev/testesaja → Settings → Environment Variables. Periksa keberadaan variabel berikut sesuai mode backend yang benar-benar dipakai:
- DATABASE_URL (wajib untuk Neon)
- VITE_API_URL (hanya untuk aksi legacy Apps Script yang belum dipetakan ke Vercel)
- BETTER_AUTH_SECRET / BETTER_AUTH_URL hanya setelah implementasi runtime Better Auth benar-benar dipakai; .env.example mencantumkan keduanya, tetapi api/_lib/auth.js yang diaudit masih menggunakan helper autentikasi custom. Jangan menganggap nama variabel contoh sebagai bukti runtime memakainya.
Pastikan cakupan Environment Variable sesuai Preview, bukan hanya Production. Jangan menyalin nilainya, screenshot nilai, atau mengirim secret ke chat. Cukup beri tahu apakah nama variabel yang diperlukan ada dan environment mana yang dicentang. Jangan mengubah variabel Production saat audit.

### Arti VITE_API_URL
- VITE_API_URL di .env.example adalah placeholder untuk Web App Apps Script lama, bukan endpoint Neon.
- Endpoint core yang sudah dipetakan menggunakan same-origin /api dan bergantung pada konfigurasi Vercel Functions serta DATABASE_URL.
- Bila fitur legacy yang belum dipindah masih dipanggil, VITE_API_URL kosong akan menghasilkan NetworkError di production, bukan simulasi success.

## 4. Penyebab progres misi dan achievement tidak konsisten

### Misi
- Backend Vercel menghitung progress dari progressEvents/activityLog berdasarkan WIB.
- SRS sync menghasilkan progress event vocab_learn/srs_review; grammar, reading quiz, matching dan story masing-masing menghasilkan activity log.
- updateProgress dari useDailyQuests tidak menjadi sumber kebenaran; endpoint hanya meminta server menghitung ulang snapshot.
- Sidebar mengandalkan hook useDailyQuests yang dimuat saat Workspace mount dan tidak ada callback yang secara langsung mengganti state hook setelah semua jenis aktivitas. Ini dapat menyebabkan badge/sidebar tertinggal walau server sudah mencatat aktivitas.
- UI misi sendiri memakai useDailyQuests terpisah dan mengambil snapshot saat dimuat. Pengujian setelah setiap jenis aktivitas tetap diperlukan.
- Misi harian pada API menggunakan tanggal WIB. Local key juga membentuk tanggal Asia/Jakarta.

### Achievement
- totalReviewsDone cocok antara hasil hook dan nama yang digunakan pada sebagian katalog.
- Tetapi beberapa nilai untuk UI judul/achievement masih dihitung lokal: reading history, grammar history, dan rumus adventure yang disintesis pada useUserProfile.js:84-101.
- Server title unlock mengacu pada userStats database (api/_handlers/titles/unlock.js). Akibatnya UI dapat menampilkan angka kemajuan yang berbeda dari kriteria server dan lintas perangkat.
- Perlu menjadikan userStats server sebagai sumber tunggal sebelum menganggap achievement sudah konsisten.

## 5. Foto profil lintas perangkat
- Neon route profile/get dan avatar/get mengembalikan avatarUpdatedAt; GAS handleGetProfile tidak mengembalikannya.
- Frontend cache global menggunakan sinau_avatar_url dan sinau_avatar_updated_at, dan menghapus gambar bila remote timestamp kosong.
- Service worker tidak terbukti menyimpan endpoint avatar JSON/API ke cache; aset image statis memang memakai stale-while-revalidate.
- Upload/delete mempunyai false-success dan local-first behavior.
- Belum diuji dua browser/perangkat. Jadi penyebab foto tidak berubah di perangkat lain belum bisa dipastikan hanya dari inspeksi statis; bug cache GAS sudah terbukti.

## 6. Riwayat latihan yang sudah ada
File: src/features/history/PracticeHistoryView.jsx:1-220, 220-360; api/_handlers/activity/history.js:1-70; api/_handlers/activity/summary.js:1-100.
Yang sudah tersedia:
- Halaman Riwayat Latihan dengan filter berdasarkan tipe sesi.
- Cursor pagination.
- Ringkasan 7 hari dan grafik mini jumlah sesi.
- Daftar judul, jenis aktivitas, waktu, skor/akurasi, durasi, EXP, dan koin.
- Wrong items sederhana dan tombol "Latih Lagi Yang Salah".
- API menggunakan authenticated user dari session dan membatasi query pada userId.

Kekurangan yang tampak:
- Belum ada filter rentang tanggal yang diminta rencana.
- Endpoint history hanya memilih wrongItems dari attemptDetails, bukan questionsBreakdown; detail jawaban pengguna, jawaban benar dan pembahasan per soal belum tersedia di UI.
- reading-quiz/record membangun questionsBreakdown dari jawaban resmi tetapi menyimpan body.questionsBreakdown (sekitar baris 121-130). Frontend ReadingQuizRunner mengirim answers dalam meta dan tidak mengirim questionsBreakdown sebagai field request. Karena itu detail breakdown tidak ikut tersimpan sebagaimana dimaksud.
- API progress/sync mencatat progressEvents dan progress per kata, tetapi tidak menulis activityLog. History API hanya membaca activityLog. Jadi filter Vocabulary/SRS belum terbukti memiliki sesi; tidak ditemukan penulisan activityLog di progress/sync.
- Matching, grammar, reading quiz dan story mempunyai handler yang menulis activityLog. Pemetaan seluruh modul masih perlu audit end-to-end.
- Pagination cursor hanya menggunakan createdAt; bila beberapa row memiliki timestamp identik, pagination berpotensi melewatkan item karena cursor memakai lt(createdAt,cursor).
- Detail story/episode dan jawaban lengkap kuis/matching belum ditampilkan sebagaimana spesifikasi Fase 6.7.

Kesimpulan: Riwayat sudah memiliki kerangka nyata, tetapi belum memenuhi seluruh rancangan Fase 6.7.

## 7. Temuan tambahan

### Dua setupDatabase()
- backend/Code.gs:1180 mendefinisikan setupDatabase().
- backend/setup.gs:8 juga mendefinisikan setupDatabase().
- Keduanya membuat set sheet berbeda: Code.gs lebih baru/lebih luas, setup.gs membuat lima tab Users, Sessions, Progress, QuizAttempts, Settings.
- Apps Script source yang memuat dua deklarasi global identik berisiko konflik; harus diputuskan satu sumber setup sebelum backend legacy dipensiunkan.
- Jangan menjalankan kedua fungsi terhadap spreadsheet pengguna sebagai uji.

### jsonResponse GAS
- backend/Code.gs:1169-1173 menerima parameter statusCode tetapi tidak menggunakannya.
- ContentService TextOutput mengatur MIME type JSON saja; status HTTP tidak benar-benar dikendalikan oleh helper tersebut.
- Vercel helper api/_lib/response.js:12-25 sudah meneruskan statusCode melalui res.status(...).json(...) atau writeHead(...).

### Ledger dan integritas data
- api/_lib/ledger.js:21-95 tidak membungkus pengecekan, insert transaksi, dan update profil dalam satu transaksi.
- api/_handlers/progress/sync.js menjalankan insert progress event, update progress/statistik, dan pemberian ledger secara bertahap tanpa transaction boundary eksplisit.
- Ini bukan bukti bahwa row production sudah rusak; ini bukti risiko partial commit/retry. Perlu transaksi database atomik, unique constraints, dan fault-injection test.

### Environment dan autentikasi
- .env.example:6-21 hanya contoh. DATABASE_URL di file adalah placeholder dan tidak membuktikan Vercel memiliki variabel nyata.
- db/index.js:5-15 membaca process.env.DATABASE_URL saat runtime.
- api/_lib/auth.js menggunakan crypto.scrypt dan sesi token custom; dependency better-auth ada di package.json dan BETTER_AUTH_* ada di .env.example, tetapi pada file helper yang diaudit alur runtime masih custom. Arsitektur autentikasi final perlu dipastikan pada fase arsitektur, tidak disimpulkan dari nama dependency.

### Penyimpanan lokal
- useUserProfile memakai cache global tanpa userId untuk profile/avatar/inventory.
- useAuth menghapus beberapa key global saat login/logout/ganti akun. Penghapusan tersebut mengurangi risiko, tetapi namespace per user tetap belum sesuai A4 dan state React yang sudah terlanjur dimuat perlu diuji saat account switch.
- useDailyQuests memakai key ber-ID user, tetapi state hook dapat tertinggal saat account switch.

## 8. Bukti CI yang dapat diakses
- Workflow file: .github/workflows/ci.yml.
- Test run yang tercatat pada branch plan: 42210443701.
- Job status: success.
- Step npm ci, npm test, test:logic, build berhasil menurut ringkasan job.
- Step Backend Integration & Security Tests berstatus skipped.
- Run ini tidak membuktikan test:api lulus, dan workflow tidak menjalankan test:e2e ataupun npm run test:all.
- Audit ini tidak menjalankan ulang test secara lokal; tidak ada akses koneksi DATABASE_URL sehingga tidak ada test integrasi Neon baru yang dijalankan.

Tautan run: https://github.com/riiddev/testesaja/actions/runs/42210443701

## 9. Jumlah akun/baris Google Sheets
**Belum tersedia.** Pengguna akan menghitung sendiri. Tidak ada akses spreadsheet yang digunakan. Mohon berikan jumlah akun dan jumlah baris per sheet (tanpa mengirim kredensial, spreadsheet ID, email atau hash password). Angka ini hanya untuk perencanaan Fase 7; tidak ada migrasi yang dilakukan sekarang.

## 10. Status verifikasi Vercel/Neon dan bukti runtime
Belum diverifikasi:
- Keberadaan variabel environment pada project Vercel Preview/Production.
- Deployment SHA yang sedang aktif.
- Neon project/branch yang dipakai aplikasi.
- Row progress_events, transactions, profiles, quest claims, activity_log.
- Perbandingan XP/koin sebelum dan sesudah aktivitas.
- Tes akun baru, akun lama, dua perangkat, offline close/reopen, avatar lintas browser.

Tidak ada secret yang diminta atau dibaca. Tidak ada perubahan data remote.

## 11. Dampak kuota
- Neon: tidak ada query ke Neon yang dijalankan selama audit, sehingga konsumsi compute/storage dari audit = 0.
- Vercel: tidak ada deployment, function invocation aplikasi, perubahan environment, atau production action yang dilakukan.
- GitHub: dua commit dokumentasi pada branch kerja saja; tidak mengubah main atau data aplikasi.

## 12. Berkas yang diubah dalam Fase 0
- docs/neon-migration-plan.md — mengganti ringkasan terdahulu dengan rencana kerja lengkap yang diberikan pengguna.
- docs/audit-verification.md — laporan verifikasi Fase 0 terkini untuk branch feat/neon-migration.
- Tidak ada file source aplikasi, skema database, migration SQL, konfigurasi Vercel, Apps Script, Spreadsheet atau Drive yang diubah.

## 13. Kesimpulan Fase 0
1. Beberapa temuan lama memang benar pada backend Apps Script, tetapi sebagian jalur aktif telah diganti oleh Vercel Functions yang lebih aman.
2. Risiko paling penting pada branch saat ini adalah operasi progres/ledger yang tidak dibungkus dalam transaksi database atomik, false-success pada avatar dan logout, serta statistik achievement yang masih berasal dari localStorage.
3. Target harian memiliki bug parse respons yang membuat nilai server tidak dimuat kembali dengan benar.
4. Riwayat latihan sudah ada, namun detail jawaban dan histori kosakata/SRS belum memenuhi spesifikasi.
5. Tidak ada bukti dari audit kode saja yang dapat memastikan penyebab aktual insiden di Vercel/Neon. Environment, deployment SHA dan row database harus diverifikasi dengan langkah aman di atas.
6. Branch saat ini 26 commit di depan main pada awal audit; PR #33 sudah terbuka. Dokumentasi audit memperbarui branch PR itu. Main tidak disentuh.

## 14. Batas fase dan keputusan berikutnya
- Fase 0 selesai pada tingkat inspeksi statis dan dokumentasi. Bukti runtime/database dan tes lintas perangkat masih menunggu akses/aksi pengguna.
- Jangan memulai Fase 1, Fase 2, atau fase berikutnya sebelum pengguna menyetujui laporan ini.
- Jangan memulai Bagian C tanpa perintah tepat "GERBANG DIBUKA".
- Jangan merge PR #33 atau mengubah main.
- Google Sheets/Apps Script/Drive tetap dipertahankan.


---

## Addendum verifikasi pada 6 November 2026 — pemeriksaan lanjutan branch aktif

Pemeriksaan lanjutan ini mempertahankan seluruh laporan di atas dan menambahkan koreksi/bukti dari source yang dibaca ulang. Source aplikasi terakhir yang diperiksa berada pada commit `d5c9bc84327f4a206efd49dc7cadcc4adc4ed724`; commit sesudahnya `415f8e9e317d3ea068a39738f7900c538db7f104` hanya memperbarui dokumen audit. Posisi branch sekarang: **28 commit ahead, 0 behind** dari `main`. Tidak ada perubahan source aplikasi pada pemeriksaan lanjutan.

### A. Risiko partial commit SRS yang perlu diprioritaskan
File: `api/_handlers/progress/sync.js:85-95,123-177`; `api/_lib/ledger.js:20-90`.

1. progress/sync memeriksa eventId yang telah tercatat. Bila event ada, event langsung dimasukkan ke processedEvents dan sisa proses dilewati.
2. Untuk event baru, progressEvents ditulis lebih dahulu; setelah itu progress, userStats, dan reward ledger di-update satu demi satu tanpa satu transaction boundary yang membungkus semua operasi.
3. Jika request terhenti setelah progressEvents masuk tetapi sebelum progress/stat/reward lengkap, retry akan menemukan eventId yang sama, memasukkannya ke processedEvents, dan melewati operasi yang belum selesai. Client dapat menerima ACK dan menghapus event dari outbox.
4. recordLedgerTransaction sendiri melakukan cek idempotensi, insert transactions, lalu update profiles sebagai query terpisah. Bila insert sukses dan update saldo gagal, retry dapat melihat transaksi sebagai alreadyProcessed tanpa memperbaiki saldo.

Status: **risiko statis terbukti; kejadian pada database pengguna belum dibuktikan**. Ini kandidat penting untuk keluhan progres/EXP/koin. Reproduksi harus menggunakan Neon development dan fault injection setelah disetujui; tidak ada transaksi uji dilakukan pada Fase 0.

### B. Bug bentuk respons Settings
File: `api/_handlers/settings/get.js:21-34`; `src/features/settings/SettingsPanel.jsx:29-40`.

- API mengirim `{ settings: userSettings }` di dalam `data`.
- SettingsPanel saat ini memeriksa `res.data.dailyGoal` atau `res.dailyGoal`, bukan `res.data.settings.dailyGoal`.
- Dengan demikian GET dapat berhasil tetapi target yang tersimpan tidak dimuat kembali dan UI bertahan pada default 10. Endpoint update menulis setting ke database; masalah yang terlihat adalah pembacaan respons di client.
- Reproduksi aman setelah akun uji tersedia: ubah target, reload Settings, dan bandingkan nilai yang ditampilkan dengan respons GET /api/settings/get. Belum diuji pada database Preview.

### C. State misi dan cache akun
File: `src/hooks/useDailyQuests.js:9-21,27-73`; `src/hooks/useUserProfile.js:8-11,55-62,125-146`.

- Storage key Daily Quest sudah memuat userId dan tanggal Asia/Jakarta, tetapi state React `storedQuests` hanya diinisialisasi sekali. Saat user/storageKey berubah pada instance hook yang sama, effect memuat remote lalu menggabungkan remoteQuests ke state sebelumnya. Ini berpotensi menyisakan data akun terdahulu dalam state sementara/hasil merge.
- Inventory, profile dan avatar menggunakan beberapa key localStorage global (tanpa userId). Auth menghapus sebagian key ketika logout atau berganti akun, tetapi pendekatan ini belum sesuai aturan namespace per user dan perlu diuji saat account switch serta saat fetch remote gagal.
- useProgressSync memiliki outbox/cache yang memang sudah dinamespace per user. Jangan menyamakan cache yang belum dinamespace dengan outbox tersebut.

### D. Pencatatan misi setelah SRS
File: `src/hooks/useProgressSync.js:145-176,240-255`; `api/_lib/dailyQuestProgress.js:31-112`; `src/pages/WorkspacePage.jsx:85-90`.

- Event vocab_learn dan srs_review dapat dihitung oleh server untuk quest.
- Setelah flush menerima ACK, useProgressSync tidak memanggil refresh Daily Quest.
- Maka server dapat menghitung progres yang benar, tetapi badge/sidebar yang sudah dimuat dapat tertinggal sampai query misi dijalankan lagi. Perlu tes aktivitas vocab/SRS dan refresh UI di Preview.

### E. False-success tambahan
File: `src/services/api.js:471-479`; `src/hooks/useUserProfile.js:293-344`.

- `api.logout()` menelan request error, menghapus token lokal, lalu selalu mengembalikan `success: true`. Client memang terlogout secara lokal, tetapi server belum tentu menerima pencabutan sesi. Ini bukan bukti progres tidak tersimpan, tetapi status pencabutan sesi tidak boleh dilaporkan sukses terkonfirmasi.
- Upload/delete avatar tetap memiliki false-success sebagaimana laporan utama.

### F. Reading quiz dan riwayat
File: `src/features/reading/ReadingQuizRunner.jsx:55-94`; `src/hooks/useUserProfile.js:410-460`; `api/_handlers/reading-quiz/record.js:80-145`; `api/_handlers/activity/history.js:33-62`; `api/_handlers/progress/sync.js:123-177`.

- Jalur `article_quiz` pada ReadingQuizRunner dikenali wrapper claimReward dan dialihkan ke recordReadingQuiz. Mismatch source reward dari audit lama sudah tidak berlaku pada jalur ini.
- Endpoint reading quiz membangun questionsBreakdown dari soal resmi, tetapi penyimpanan attemptDetails memakai `body.questionsBreakdown || []`; wrapper mengirim answers, bukan questionsBreakdown. Detail analisis jawaban yang salah dapat tersimpan kosong.
- History API mengambil wrongItems, bukan questionsBreakdown.
- Handler SRS menulis progressEvents/progress/userStats, bukan activityLog. History API yang diperiksa membaca activityLog. Jadi filter Kosakata/SRS belum memiliki bukti bahwa setiap review muncul sebagai sesi riwayat.

### G. Bukti CI paling baru yang berhasil diverifikasi
- Run yang dapat diperiksa pada source commit `d5c9bc8`: GitHub Actions run **42228478402**, status success.
- npm ci, content/SRS audit, adaptive logic, dan Vite build berhasil.
- Langkah Backend Integration & Security Tests **skipped** karena `DATABASE_URL` tidak tersedia di environment workflow run itu.
- Run ini bukan bukti test:api lulus, dan tidak menjalankan E2E.
- Commit audit setelahnya (`415f8e9`) hanya mengubah `docs/audit-verification.md`; tidak ada hasil workflow baru yang dapat diverifikasi untuk commit dokumentasi tersebut.
- Vercel bot sebelumnya melaporkan Preview Ready pada PR #33. Status itu adalah bukti deployment Preview yang teramati saat itu, bukan bukti bahwa production sedang menjalankan branch ini.

### H. Koreksi ringkas status Fase 0
- Source-level audit 19 temuan dan tambahan sudah terdokumentasi.
- Temuan penting yang tetap terbuka: risiko atomicity SRS/ledger, Settings GET response mismatch, state/cache account-switch, refresh quest setelah SRS, false-success avatar/logout, achievement berbasis data lokal, dan coverage history.
- Akar insiden production tidak dapat dipastikan tanpa deployment SHA, keberadaan Environment Variables (cukup cek ada/tidak; jangan bagikan nilainya), log runtime, dan row Neon yang relevan.
- Tidak ada perubahan source aplikasi, tidak ada request tulis ke Neon/Sheets/Drive, tidak ada perubahan Vercel environment atau production.


### I. Keputusan reset data legacy setelah Fase 0 (6 November 2026)
- Pengguna memilih membuang akun dan data lama **hanya di Google Sheets**. Data atau akun di Neon tidak termasuk cakupan reset.
- Tidak ada migrasi akun, hash password, progres, atau koleksi lama ke Neon. Pengguna baru akan membuat akun baru dari nol.
- Pengosongan Sheets dijadwalkan pada Fase 7, setelah preview sepenuhnya berhenti membaca/menulis data pengguna melalui Apps Script. Tab dan header dipertahankan; baris data pada tab pengguna dihapus setelah inventarisasi, minimal `Accounts`, `LearningStates`, dan `Collections`.
- Keputusan dan urutan aman ini telah dicatat di `docs/neon-migration-plan.md`.
- **Pengosongan belum dilakukan.** Dalam sesi ini tidak tersedia koneksi langsung ke spreadsheet Google Sheets; tidak ada data Sheets atau Neon yang diubah.
