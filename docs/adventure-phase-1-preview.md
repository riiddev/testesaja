# SinauuEnglish — Adventure MVP (Phase 1) Preview

Status: **design preview only**. Tidak ada file aplikasi lama yang diubah, tidak ada API yang dipanggil, dan tidak ada progres akun yang ditulis.

## 1. Arah desain

Adventure menjadi lapisan navigasi dan konteks belajar di dalam ruang belajar yang sudah ada, bukan aplikasi/game terpisah.

- Mempertahankan karakter visual workspace: paper/cream, sage, lilac, peach; Lora untuk heading dan Plus Jakarta Sans untuk UI.
- Menggunakan peta editorial seperti field notes: jalur, titik lokasi, label, dan misi. Hindari HUD neon, koin berlebihan, karakter kartun generik, serta animasi yang mengganggu.
- Di desktop peta tampil sebagai jalur lokasi; di layar kecil menjadi urutan stop vertikal agar tidak perlu zoom atau scroll horizontal.
- Rank/XP adalah elemen pendamping. Mastery tetap ditentukan oleh bukti belajar, bukan jumlah klik.

Preview UI: `/adventure-preview/`

## 2. Tiga misi pertama

Semua misi berada di World 01 — **First Steps Island**. Urutan ini dibuat sebagai satu rangkaian: interaksi personal → navigasi ruang publik → interaksi layanan sehari-hari.

### Mission 01 — Meet Your New Neighbors

- Lokasi: Neighbor Lane
- Level: A1
- Estimasi: 12–15 menit
- Tujuan komunikasi: memperkenalkan diri, menanyakan nama/asal, dan merespons sapaan.
- Kosakata inti (akan dipetakan ke ID kosakata yang benar-benar tersedia): name, live, from, neighbor, meet, welcome, nice.
- Language tools: subject pronouns; be (am/is/are); basic wh-/yes-no questions.
- Urutan: briefing → temukan kosakata dalam konteks → listening dua sapaan → baca dialog singkat → susun respons → produksi perkenalan singkat lewat teks atau suara.
- Bukti kemampuan: jawaban pemahaman listening/reading dan perkenalan mandiri yang relevan. Pengucapan tidak dinilai otomatis pada MVP.

### Mission 02 — A Day Around Town

- Lokasi: Town Square
- Level: A1–A2
- Estimasi: 15–18 menit
- Prasyarat: Mission 01 selesai.
- Tujuan komunikasi: memahami dan memberikan petunjuk arah sederhana serta menjelaskan letak tempat.
- Kosakata inti: street, road, turn, straight, left, right, near, next to, across from, corner.
- Language tools: imperative; prepositions of place; location phrases.
- Urutan: briefing → kosakata tempat/arah → listening petunjuk arah → baca peta sederhana → pilih rute → tulis petunjuk kepada pengunjung.
- Bukti kemampuan: pemilihan rute yang sesuai audio/peta dan instruksi tertulis yang dapat diikuti.

### Mission 03 — A Day at the Café

- Lokasi: Little Corner Café
- Level: A1–A2
- Estimasi: 15–18 menit
- Prasyarat: Mission 02 selesai.
- Tujuan komunikasi: membaca menu, memesan makanan/minuman, menanyakan harga, dan mengonfirmasi pesanan.
- Kosakata inti: menu, order, coffee, tea, water, bread, sandwich, small, large, price, bill.
- Language tools: “I'd like …”; countable nouns; this/that; asking about prices.
- Urutan: briefing → baca menu & temukan kata → listening pesanan → pahami menu dan pilihan → praktik dialog pelanggan/barista → tulis catatan pesanan.
- Bukti kemampuan: pilihan yang cocok dengan permintaan, pemahaman menu/audio, dan pesanan mandiri yang sopan.

Catatan konten: daftar di atas adalah target kurasi, bukan klaim bahwa seluruh kata/grammar sudah tersedia di repository. Saat implementasi, setiap referensi harus divalidasi ke ID data kosakata/grammar yang ada. Jika materi belum ada, buat konten editorial baru secara eksplisit dan beri provenance.

## 3. Alur belajar misi

1. **Briefing** — konteks cerita, tujuan komunikasi, perkiraan waktu, dan apa yang perlu diselesaikan.
2. **Notice** — temukan kata/ungkapan di dalam konteks; bukan sekadar daftar terjemahan.
3. **Listen / Read** — pahami petunjuk atau percakapan.
4. **Choose / Navigate** — gunakan informasi untuk membuat keputusan.
5. **Use** — hasilkan bahasa sendiri melalui teks atau rekaman lokal.
6. **Reflection** — tampilkan hal yang sudah dikuasai dan hal yang perlu diulang.
7. **Review** — bukti kosakata dikirim ke mekanisme SRS yang sudah ada hanya ketika memenuhi aturan review yang berlaku.

Semua misi Phase 1 perlu menyentuh beberapa skill, tetapi bobotnya mengikuti tujuan komunikatif misi. Jangan memaksa keenam skill muncul dengan porsi sama pada setiap misi.

## 4. Rancangan CloudBundle v2

### Kondisi sekarang

`src/account-cloud.ts` saat ini membentuk bundle v1 dengan:
- `core`: progres kosakata, grammar, favorites, events/history, settings.
- `extras.extraLearning`: progres matching dan reading skills.
- `extras.habitProgress`: progres koleksi bacaan HABIT.

Bundle dikirim melalui API progres yang sudah ada. API tersebut menyimpan snapshot terkompresi melalui koleksi `Lists` di spreadsheet yang sekarang. **Tidak perlu spreadsheet baru atau tab baru untuk Adventure MVP.**

### Target shape

```ts
type CloudBundleV2 = {
  schemaVersion: 2;       // versi envelope/cloud bundle
  core: CoreV1;           // tetap schemaVersion: 1; jangan dirombak
  extras: {
    extraLearning: Record<string, unknown>;
    habitProgress: Record<string, unknown>;
    adventureProgress: AdventureProgressV1;
  };
};

type AdventureProgressV1 = {
  schemaVersion: 1;
  missionProgress: Record<string, {
    status: "locked" | "available" | "in_progress" | "completed";
    attempts: MissionAttempt[];
    bestScore: number | null;
    completedAt: string | null;
  }>;
  skillEvidence: Record<string, SkillEvidence[]>;
  xpLedger: Record<string, { amount: number; awardedAt: string }>;
  achievementIds: string[];
  updatedAt: string;
};

type MissionAttempt = {
  attemptId: string;       // UUID/idempotency key
  missionId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  evidenceIds: string[];
};
```

Static curriculum (worlds, locations, mission instructions, question sets, transcripts, rubrics) disimpan sebagai JSON/asset di GitHub, misalnya `data/adventure/worlds.json`, `locations.json`, dan `missions.json`. Jangan menyalin seluruh bank kosakata/grammar/reading ke spreadsheet. Gunakan referensi ID ke konten yang sudah ada.

### Migrasi v1 → v2

1. Jika menerima bundle v1, pertahankan `core`, `extraLearning`, dan `habitProgress` tanpa normalisasi ulang yang menghapus properti.
2. Tambahkan `adventureProgress` kosong dengan `schemaVersion: 1`.
3. Simpan envelope sebagai v2, tetapi biarkan skema `core` tetap v1. Versi envelope dan versi data inti memang dua hal berbeda.
4. Jika bundle sudah v2, baca semua extra key yang dikenal dan pertahankan unknown keys agar ekspansi berikutnya tidak terhapus.
5. Backup export/import perlu membawa ketiga extras; import versi lama harus memberi default kosong hanya untuk Adventure.
6. Sign-out dan pergantian akun harus tetap membersihkan cache lokal milik akun sebelumnya tanpa menimpa cache akun lain.

### Aturan merge lintas perangkat

Jangan melakukan last-write-wins untuk seluruh objek Adventure.

- `attempts`: union berdasarkan `attemptId`.
- `skillEvidence`: union berdasarkan `evidenceId`.
- `bestScore`: nilai maksimum dari percobaan valid.
- `completedAt`: waktu completion valid paling awal; status completed tidak boleh turun karena perangkat lain punya snapshot lama.
- `achievementIds`: set union.
- `xpLedger`: union berdasarkan ID award yang deterministik; hitung total XP dari ledger, bukan menjumlahkan dua snapshot secara langsung.
- Status unlock dihitung ulang dari prasyarat misi dan completion yang tervalidasi, bukan dipercaya dari tombol klien.

Perlu uji konflik: dua perangkat menyelesaikan misi yang sama offline, dua percobaan identik tersinkron, satu perangkat memakai bundle lama, serta sign-out/switch account saat sync berjalan.

### Catatan kompatibilitas penting

Versi aplikasi lama saat ini menormalisasi extras dengan daftar key eksplisit. Karena itu, sebelum progres Adventure ditulis ke cloud, semua jalur sync baru harus mempertahankan extra key yang tidak dikenal. Hindari rollout yang memungkinkan tab/aplikasi lama menyimpan snapshot setelah Adventure aktif. Lakukan tes round-trip pada payload v1 dan v2 terlebih dahulu. Jika perlu, gunakan rollout bertahap: deploy pembaca/penjaga kompatibilitas → deploy Adventure → aktifkan penyimpanan Adventure.

## 5. Data yang boleh disimpan

Simpan data yang diperlukan untuk melanjutkan belajar:
- mission status, attempt IDs, waktu mulai/selesai, skor dan evidence IDs;
- ringkasan bukti per skill;
- XP ledger yang idempotent dan achievement IDs;
- versi schema dan timestamp update.

Jangan kirim rekaman suara mentah ke Google Sheets. MVP dapat merekam secara lokal; sinkronisasi suara bukan syarat. Simpan transkrip hanya bila pengguna memilih menyimpannya, dan utamakan ringkasan/rubrik daripada audio mentah.

## 6. Scope preview ini

- Hanya halaman preview statis di folder public.
- Tidak menambah route ke app utama, tidak mengubah navigasi, `belajar.js`, `belajar.css`, `account-cloud.ts`, API, Apps Script, atau spreadsheet.
- Tombol demo hanya menampilkan pesan bahwa belum ada progres yang disimpan.
- Produksi tetap tidak berubah sampai desain disetujui.


## 7. Phase 1.5 — Daily Quest, Mistake Journal, and reward milestones

The preview now includes three additional systems built on the existing mission curriculum.

### Daily Quest

- One locally dated challenge per day, built deterministically from the authored First Steps Island lessons.
- Three short tasks: vocabulary, comprehension (reading or listening), and a grammar point.
- The daily attempt is stored under \`adventureProgress.dailyQuests[YYYY-MM-DD]\`.
- A single 15 XP award is keyed by \`daily-quest:YYYY-MM-DD\`; reloads and repeated clicks cannot issue another award for the same day.
- A missed day has no penalty. Daily Quest is a lightweight optional practice loop, not a streak requirement.
- Challenge progress and completion merge by date across devices; completed step IDs are unioned and wrong-attempt counts use the maximum observed count.

### Mistake Journal

- Incorrect authored multiple-choice responses are stored as compact entries in \`adventureProgress.mistakeJournal\`.
- Each entry records the mission/step, skill, prompt, selected option, correct option, explanation, and timestamp. It contains no personal writing or audio.
- A correct retry in the same mission attempt or daily quest marks matching entries as resolved.
- The user can filter open, resolved, and all entries; an open entry links back to its mission for another practice attempt.
- When two devices sync the same mistake, the entry is deduplicated by \`mistakeId\`; a resolved record wins over an open copy.

### Achievements and progression

The reward ledger remains authoritative for XP. Additional milestones are:
- Daily Explorer — first completed Daily Quest.
- Steady Traveller — Daily Quests completed on seven different dates (not necessarily consecutive).
- Learning from Mistakes — five mistakes successfully corrected.
- Six Ways to Grow — at least three evidence entries in each of the six skills.
- A Polite Customer — complete A Day at the Café.

The interface shows current progress toward the seven-day and five-correction milestones. These achievements are motivational markers, not CEFR certification.

### Compatibility and tests

The existing CloudBundle v2 merge function now performs idempotent merges for \`dailyQuests\` and \`mistakeJournal\`, in addition to mission attempts, evidence, XP, and achievement IDs. Local backup/export includes the complete \`adventureProgress\` object.

Browser tests cover:
- wrong answer → journal entry → correct retry → resolved entry;
- three Daily Quest challenges → one 15 XP award → reload persistence;
- Daily Quest and Mistake Journal restore on a second browser profile and merge new completion/resolution evidence back into the shared cloud snapshot.

The cross-profile browser test uses mocked progress API responses. It verifies client merge behavior but is not a live Google Sheets write/read test.
