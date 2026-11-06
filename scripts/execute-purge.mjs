import fs from "fs";

function updateFile(filePath, transforms, iconsToImport = []) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  let code = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  
  // Apply transforms
  transforms.forEach(([from, to]) => {
    code = code.split(from).join(to);
  });

  // Add icon imports if specified and not already imported
  if (iconsToImport.length > 0) {
    const iconsPath = filePath.includes("components/common")
      ? "./Icons.jsx"
      : filePath.includes("components/layout")
      ? "../common/Icons.jsx"
      : filePath.includes("features/")
      ? "../../components/common/Icons.jsx"
      : "../components/common/Icons.jsx";

    const neededIcons = iconsToImport.filter(ic => !code.includes(ic));
    if (neededIcons.length > 0) {
      const importStatement = `import { ${neededIcons.join(", ")} } from "${iconsPath}";\n`;
      code = importStatement + code;
    }
  }

  fs.writeFileSync(filePath, code, "utf8");
  console.log(`Updated: ${filePath}`);
}

// 1. StoryRunner.jsx
updateFile("src/features/adventure/StoryRunner.jsx", [
  [">✕</button>", " style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconClose size={16} /></button>"],
  [">✕<", "><IconClose size={16} /><"],
  ["📜 Latar Cerita", "<IconScroll size={13} style={{ marginRight: 4 }} /> Latar Cerita"],
  ["🤔 Pilihan Responmu:", "<IconHelp size={13} style={{ marginRight: 4 }} /> Pilihan Responmu:"],
  ["🔊 Audio", "<><IconVolume size={13} style={{ marginRight: 4 }} /> Audio</>"],
  ["Lanjut ke Kosakata & Grammar ↗", "Lanjut ke Kosakata & Grammar"],
  ["✨ Kosakata Pilihan Oxford 3000", "<IconSparkles size={16} style={{ marginRight: 6, color: 'var(--color-accent-gold)' }} /> Kosakata Pilihan Oxford 3000"],
  ['{isAdded ? "✓ Tersimpan di SRS" : `+ Simpan "${v.word}" ke SRS ↗`}', '{isAdded ? <><IconCheck size={12} style={{ marginRight: 4 }} /> Tersimpan di SRS</> : `+ Simpan "${v.word}" ke SRS`}'],
  ["💡 Tip Budaya & Situasi Nyata", "<IconLightbulb size={13} style={{ marginRight: 4, color: 'var(--color-accent-gold)' }} /> Tip Budaya & Situasi Nyata"],
  ["← Kembali ke Cerita", "<><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Kembali ke Cerita</>"],
  ["Uji Pemahaman (5 Soal Kuis) ↗", "<>Uji Pemahaman (5 Soal Kuis) <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>"],
  ['{isCorrect ? "✓ Jawaban Benar! " : "✕ Belum Tepat. "}', '{isCorrect ? <><IconCheck size={13} style={{ marginRight: 4 }} /> Jawaban Benar! </> : <><IconClose size={13} style={{ marginRight: 4 }} /> Belum Tepat. </>}'],
  ["← Kembali ke Kosakata", "<><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Kembali ke Kosakata</>"],
  ["Periksa Jawaban Kuis ↗", "<>Periksa Jawaban Kuis <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>"],
  ["Lihat Rangkuman & Selesaikan ↗", "<>Lihat Rangkuman & Selesaikan <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>"],
  ["📌 Yang Telah Kamu Pelajari Hari Ini:", "<IconPin size={13} style={{ marginRight: 4 }} /> Yang Telah Kamu Pelajari Hari Ini:"],
  ["🔮 Cuplikan Episode Berikutnya:", "<IconSparkles size={13} style={{ marginRight: 4 }} /> Cuplikan Episode Berikutnya:"],
  ['"Kembali ke Daftar Episode ↗"', '"Kembali ke Daftar Episode"'],
  ['"Tandai Selesai & Klaim Reward (+50 EXP) ↗"', '"Tandai Selesai & Klaim Reward (+50 EXP)"']
], ["IconClose", "IconScroll", "IconHelp", "IconVolume", "IconSparkles", "IconCheck", "IconLightbulb", "IconArrowLeft", "IconArrowRight", "IconPin"]);

// 2. LoginForm.jsx
updateFile("src/features/auth/LoginForm.jsx", [
  ["Masuk Sekarang ↗", "Masuk Sekarang"]
]);

// 3. RegisterForm.jsx
updateFile("src/features/auth/RegisterForm.jsx", [
  ["Daftar Akun Baru ↗", "Daftar Akun Baru"]
]);

// 4. CollectionView.jsx
updateFile("src/features/collection/CollectionView.jsx", [
  ["✓ Digunakan", "<><IconCheck size={12} style={{ marginRight: 3 }} /> Digunakan</>"],
  ["✓ Dimiliki", "<><IconCheck size={12} style={{ marginRight: 3 }} /> Dimiliki</>"],
  ["🔒 Terkunci (Butuh Lvl {item.levelReq})", "<><IconLock size={12} style={{ marginRight: 3 }} /> Terkunci (Butuh Lvl {item.levelReq})</>"],
  ["Gunakan Sekarang ↗", "Gunakan Sekarang"],
  ['"Menyimpan ke Cloud..." : "Beli Sekarang ↗"', '"Menyimpan ke Cloud..." : "Beli Sekarang"'],
  ['"Beli Sekarang ↗"', '"Beli Sekarang"']
], ["IconCheck", "IconLock"]);

// 5. GrammarDetail.jsx
updateFile("src/features/grammar/GrammarDetail.jsx", [
  ["← Kembali ke 19 Modul Grammar", "<><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Kembali ke 19 Modul Grammar</>"],
  ["✓ Topik Dikuasai", "<><IconCheck size={13} style={{ marginRight: 4 }} /> Topik Dikuasai</>"],
  ["⏱ {detailedTopic.estimatedMinutes || 12} Menit", "<><IconClock size={12} style={{ marginRight: 3 }} /> {detailedTopic.estimatedMinutes || 12} Menit</>"],
  ["★ Kurikulum Mendalam 10 Bagian", "<><IconStar size={12} style={{ marginRight: 4 }} /> Kurikulum Mendalam 10 Bagian</>"],
  ["<span>📖</span>", "<IconBook size={14} />"],
  ["<span>✍️</span>", "<IconEdit size={14} />"],
  ["<span>✍</span>", "<IconEdit size={14} />"],
  ["<span>🏆</span>", "<IconTrophy size={14} />"],
  ["🎯 Kapan Harus Digunakan?", "<IconTarget size={14} style={{ marginRight: 4 }} /> Kapan Harus Digunakan?"],
  ["💡 Contoh Kalimat & Pola:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Contoh Kalimat & Pola:"],
  ["💡 Rumus & Aturan Tata Bahasa:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Rumus & Aturan Tata Bahasa:"],
  ["💡 Bandingkan dengan Pola Lain:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Bandingkan dengan Pola Lain:"],
  ["💡 Situasi & Konteks Penggunaan:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Situasi & Konteks Penggunaan:"],
  ["💡 Kesalahan Umum yang Sering Terjadi:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Kesalahan Umum yang Sering Terjadi:"],
  ["💡 Cara Memperbaiki:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Cara Memperbaiki:"],
  ["💡 Tips Mengingat:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Tips Mengingat:"],
  ["💡 Contoh Situasi Praktis:", "<IconLightbulb size={14} style={{ marginRight: 4 }} /> Contoh Situasi Praktis:"],
  ["Mulai Sesi Praktik (3 Soal) ↗", "Mulai Sesi Praktik (3 Soal)"],
  ["Uji Penguasaan (5 Soal Kuis) ↗", "Uji Penguasaan (5 Soal Kuis)"],
  [">✓ Selesai<", "><IconCheck size={11} style={{ marginRight: 2 }} /> Selesai<"],
  [">✓ Lulus<", "><IconCheck size={11} style={{ marginRight: 2 }} /> Lulus<"]
], ["IconArrowLeft", "IconCheck", "IconClock", "IconStar", "IconBook", "IconEdit", "IconTrophy", "IconTarget", "IconLightbulb"]);

// 6. GrammarGrid.jsx
updateFile("src/features/grammar/GrammarGrid.jsx", [
  ["✓ Dikuasai", "<><IconCheck size={12} style={{ marginRight: 3 }} /> Dikuasai</>"],
  ["★ 10 Bagian", "<><IconStar size={11} style={{ marginRight: 3 }} /> 10 Bagian</>"],
  ["⏱ {t.estimatedMinutes || 12} MENIT", "<><IconClock size={11} style={{ marginRight: 3 }} /> {t.estimatedMinutes || 12} MENIT</>"],
  ["Pelajari Modul ↗", "Pelajari Modul"]
], ["IconCheck", "IconStar", "IconClock"]);

// 7. GrammarMasteryQuiz.jsx
updateFile("src/features/grammar/GrammarMasteryQuiz.jsx", [
  ["← Sebelumnya", "<><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Sebelumnya</>"],
  ["Selesaikan Kuis & Uji Penguasaan ↗", "Selesaikan Kuis & Uji Penguasaan"],
  ["Berikutnya →", "<>Berikutnya <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>"],
  ['"Status: Topik Dikuasai! 🎉"', '"Status: Topik Dikuasai!"'],
  ['"✓ Status: Dikuasai (Mastered)"', '"Status: Dikuasai (Mastered)"'],
  ['{isCorrect ? "✓ Jawaban Tepat" : `✕ Salah (Pilihanmu: ${optionLetters[userAnswer]})`}', '{isCorrect ? <><IconCheck size={13} style={{ marginRight: 4 }} /> Jawaban Tepat</> : <><IconClose size={13} style={{ marginRight: 4 }} /> Salah (Pilihanmu: {optionLetters[userAnswer]})</>}'],
  ["Ulangi Kuis ↺", "<><IconRefresh size={13} style={{ marginRight: 4 }} /> Ulangi Kuis</>"],
  ["Kembali ke Modul Grammar ↗", "Kembali ke Modul Grammar"]
], ["IconArrowLeft", "IconArrowRight", "IconCheck", "IconClose", "IconRefresh"]);

// 8. GrammarPracticeRunner.jsx
updateFile("src/features/grammar/GrammarPracticeRunner.jsx", [
  ['{isCorrect ? "✓ Jawaban Benar" : "✕ Belum Tepat"}', '{isCorrect ? <><IconCheck size={13} style={{ marginRight: 4 }} /> Jawaban Benar</> : <><IconClose size={13} style={{ marginRight: 4 }} /> Belum Tepat</>}'],
  ["Periksa Jawaban ↗", "Periksa Jawaban"],
  ["Koreksi ↗", "Koreksi"],
  ["{item.word} ✕", "<>{item.word} <IconClose size={10} style={{ marginLeft: 2 }} /></>"],
  ["Periksa Urutan Kalimat ↗", "Periksa Urutan Kalimat"],
  ["💡 Pembahasan:", "<IconLightbulb size={13} style={{ marginRight: 4 }} /> Pembahasan:"],
  ['{isCompleted ? "✓ Sesi Praktik Tersimpan di Cloud" : "Simpan Sesi Praktik & Lanjut ↗"}', '{isCompleted ? <><IconCheck size={12} style={{ marginRight: 4 }} /> Sesi Praktik Tersimpan</> : "Simpan Sesi Praktik & Lanjut"}']
], ["IconCheck", "IconClose", "IconLightbulb"]);

// 9. ContextMatching.jsx
updateFile("src/features/matching/ContextMatching.jsx", [
  ["Putaran Berikutnya ↻", "<><IconRefresh size={13} style={{ marginRight: 4 }} /> Putaran Berikutnya</>"],
  ["Kembali ke Misi Harian ↗", "Kembali ke Misi Harian"]
], ["IconRefresh"]);

// 10. missionsEngine.js
updateFile("src/features/missions/missionsEngine.js", [
  ['"Buka Daftar Kata ↗"', '"Buka Daftar Kata"'],
  ['"Buka Antrean Review ↗"', '"Buka Antrean Review"'],
  ['"Pilih Modul Grammar ↗"', '"Pilih Modul Grammar"'],
  ['"Buka Perpustakaan ↗"', '"Buka Perpustakaan"'],
  ['"Mulai Sesi Fokus ↗"', '"Mulai Sesi Fokus"'],
  ['"Mulai Petualangan ↗"', '"Mulai Petualangan"']
]);

// 11. MissionsView.jsx
updateFile("src/features/missions/MissionsView.jsx", [
  [">✓ Tercapai<", "><IconCheck size={12} style={{ marginRight: 3 }} /> Tercapai<"],
  ["Lihat Progres Profil ↗", "Lihat Progres Profil"]
], ["IconCheck"]);

// 12. ProfileView.jsx
updateFile("src/features/profile/ProfileView.jsx", [
  ['setAvatarSuccess("✓ Foto profil berhasil disimpan ke cloud storage!");', 'setAvatarSuccess("Foto profil berhasil disimpan ke cloud storage!");'],
  ["✓ Gelar Aktif", "<><IconCheck size={12} style={{ marginRight: 3 }} /> Gelar Aktif</>"],
  ['"Potong & Simpan Foto ↗"', '"Potong & Simpan Foto"'],
  ['"Pilih dari Galeri / Kamera ↗"', '"Pilih dari Galeri / Kamera"']
], ["IconCheck"]);

// 13. QuizRunner.jsx
updateFile("src/features/quiz/QuizRunner.jsx", [
  ["Lihat Modul Grammar ↗", "Lihat Modul Grammar"],
  ["Ulangi Kuis ↺", "<><IconRefresh size={13} style={{ marginRight: 4 }} /> Ulangi Kuis</>"],
  ["? `✓ Benar! ${currentQ.explanation}`", "? `Benar! ${currentQ.explanation}`"],
  [": `✗ Kurang tepat. ${currentQ.explanation}`}", ": `Kurang tepat. ${currentQ.explanation}`}"]
], ["IconRefresh"]);

// 14. ReadingLibrary.jsx
updateFile("src/features/reading/ReadingLibrary.jsx", [
  ["⏱ {p.estimatedMinutes || 3} MENIT", "<><IconClock size={11} style={{ marginRight: 3 }} /> {p.estimatedMinutes || 3} MENIT</>"],
  ["Baca Teks ↗", "Baca Teks"],
  ["⏱ {selectedPassage.estimatedMinutes || 3} Menit", "<><IconClock size={12} style={{ marginRight: 3 }} /> {selectedPassage.estimatedMinutes || 3} Menit</>"],
  ["Selesai Membaca ✓", "<>Selesai Membaca <IconCheck size={13} style={{ marginLeft: 4 }} /></>"],
  ["🎁 Hadiah:", "<IconGift size={13} style={{ marginRight: 4 }} /> Hadiah:"],
  ["Kerjakan Kuis Pemahaman (8-10 Soal) ↗", "Kerjakan Kuis Pemahaman (8-10 Soal)"]
], ["IconClock", "IconCheck", "IconGift"]);

// 15. ReadingQuizRunner.jsx
updateFile("src/features/reading/ReadingQuizRunner.jsx", [
  [">✕</button>", " style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconClose size={16} /></button>"],
  ["← Sebelumnya", "<><IconArrowLeft size={13} style={{ marginRight: 4 }} /> Sebelumnya</>"],
  ["Selesaikan & Lihat Pembahasan ↗", "Selesaikan & Lihat Pembahasan"],
  ["Berikutnya →", "<>Berikutnya <IconArrowRight size={13} style={{ marginLeft: 4 }} /></>"],
  ["💡 Saran Fokus Belajar:", "<IconLightbulb size={13} style={{ marginRight: 4 }} /> Saran Fokus Belajar:"],
  ['{isCorrect ? "✓ Jawaban Benar" : `✕ Salah (Pilihanmu: ${optionLetters[userAnswers[q.id]] || "-"})`}', '{isCorrect ? <><IconCheck size={13} style={{ marginRight: 4 }} /> Jawaban Benar</> : <><IconClose size={13} style={{ marginRight: 4 }} /> Salah (Pilihanmu: {optionLetters[userAnswers[q.id]] || "-"}</>}'],
  ['<span>✓ Tersimpan di Antrean Review (SRS)</span>', '<span><IconCheck size={12} style={{ marginRight: 4 }} /> Tersimpan di Antrean Review (SRS)</span>'],
  ['<span>+ Tambahkan "${targetWord}" ke Review (SRS) ↗</span>', '<span>+ Tambahkan "${targetWord}" ke Review (SRS)</span>'],
  ["Selesai & Kembali ke Perpustakaan ↗", "Selesai & Kembali ke Perpustakaan"]
], ["IconClose", "IconArrowLeft", "IconArrowRight", "IconLightbulb", "IconCheck"]);

// 16. ReviewQueue.jsx
updateFile("src/features/review/ReviewQueue.jsx", [
  ["Mulai Review Cepat ↗", "Mulai Review Cepat"],
  ["Review ↗", "Review"],
  ["Latih Ulang ↗", "Latih Ulang"]
]);

// 17. SettingsPanel.jsx
updateFile("src/features/settings/SettingsPanel.jsx", [
  ['`✓ Berhasil mengimpor', '`Berhasil mengimpor'],
  ['`✗ Gagal mengimpor', '`Gagal mengimpor'],
  ['"✓ Izin notifikasi berhasil diaktifkan!', '"Izin notifikasi berhasil diaktifkan!'],
  ['"✓ Notifikasi pengingat uji coba berhasil dikirim!"', '"Notifikasi pengingat uji coba berhasil dikirim!"'],
  ["Masuk atau Buat Akun Baru ↗", "Masuk atau Buat Akun Baru"],
  ['{isInstalled ? "✓ Terpasang di Layar Utama" : "Mode Browser"}', '{isInstalled ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Terpasang di Layar Utama</> : "Mode Browser"}'],
  ["Pasang Aplikasi Sekarang ↗", "Pasang Aplikasi Sekarang"],
  ["✓ Kamu sedang menggunakan SinauEnglish dalam mode aplikasi mandiri.", "Kamu sedang menggunakan SinauEnglish dalam mode aplikasi mandiri."],
  ['{notificationPermission === "granted" ? "✓ Izin Aktif" : "Izin Belum Aktif"}', '{notificationPermission === "granted" ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Izin Aktif</> : "Izin Belum Aktif"}'],
  ["Uji Coba Pengingat (Melayang di HP) ↗", "Uji Coba Pengingat (Melayang di HP)"]
], ["IconCheck"]);

// 18. StudySession.jsx
updateFile("src/features/study/StudySession.jsx", [
  ["Buka Daftar Kosakata ↗", "Buka Daftar Kosakata"],
  ["Buka Arti Kata ↗", "Buka Arti Kata"],
  ["Lanjut ke Konteks ↗", "Lanjut ke Konteks"],
  ['{isCorrect ? "✓ Jawaban Benar! Pemahaman konteks berhasil." : "✗ Jawaban kurang tepat. Coba perhatikan petunjuk kata kunci konteks."}', '{isCorrect ? "Jawaban Benar! Pemahaman konteks berhasil." : "Jawaban kurang tepat. Coba perhatikan petunjuk kata kunci konteks."}'],
  ['>✓ Tersimpan Otomatis di Cloud SRS<', '><IconCheck size={13} style={{ marginRight: 3 }} /> Tersimpan Otomatis di Cloud SRS<'],
  ["Latih Kata Selanjutnya ↗", "Latih Kata Selanjutnya"]
], ["IconCheck"]);

// 19. VocabCard.jsx
updateFile("src/features/vocabulary/VocabCard.jsx", [
  ["Detail Kata ↗", "Detail Kata"]
]);

// 20. VocabGrid.jsx
updateFile("src/features/vocabulary/VocabGrid.jsx", [
  ["Muat Lebih Banyak Kata ↺", "<>Muat Lebih Banyak Kata <IconRefresh size={13} style={{ marginLeft: 4 }} /></>"]
], ["IconRefresh"]);

// 21. LandingPage.jsx
updateFile("src/pages/LandingPage.jsx", [
  ["Lanjut ke Ruang Belajar ↗", "Lanjut ke Ruang Belajar"],
  ["Buat Akun & Mulai Belajar ↗", "Buat Akun & Mulai Belajar"],
  ["Ganti Contoh Kata ↻", "<>Ganti Contoh Kata <IconRefresh size={13} style={{ marginLeft: 4 }} /></>"],
  ["Pelajari di Workspace ↗", "Pelajari di Workspace"],
  ["Daftar Akun ↗", "Daftar Akun"],
  ["Buka Kosakata ↗", "Buka Kosakata"],
  ["Daftar untuk Membuka ↗", "Daftar untuk Membuka"],
  ["Buka Grammar ↗", "Buka Grammar"],
  ["Buka Bacaan ↗", "Buka Bacaan"],
  ["Buka Petualangan ↗", "Buka Petualangan"],
  ["Mulai Perjalanan Belajarmu Sekarang ↗", "Mulai Perjalanan Belajarmu Sekarang"]
], ["IconRefresh"]);

// 22. NotFoundPage.jsx
updateFile("src/pages/NotFoundPage.jsx", [
  ["Kembali ke Beranda ↗", "Kembali ke Beranda"]
]);

// 23. WorkspacePage.jsx
updateFile("src/pages/WorkspacePage.jsx", [
  ["Lanjutkan Belajar Sekarang ↗", "Lanjutkan Belajar Sekarang"]
]);

console.log("=== ALL TARGET FILES PURGED OF EMOJIS! ===");

