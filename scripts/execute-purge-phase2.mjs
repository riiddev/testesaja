import fs from "fs";

function updateFile(filePath, transforms, iconsToImport = []) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  let code = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  
  transforms.forEach(([from, to]) => {
    code = code.split(from).join(to);
  });

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

// 1. Navbar.jsx
updateFile("src/components/layout/Navbar.jsx", [
  ["Ruang Belajar ↗", "Ruang Belajar"]
]);

// 2. StoryRunner.jsx
updateFile("src/features/adventure/StoryRunner.jsx", [
  [">✕<", "><IconClose size={16} /><"],
  [">✕\n", "><IconClose size={16} />\n"],
  ["\n            ✕\n", "\n            <IconClose size={16} />\n"]
], ["IconClose"]);

// 3. GrammarDetail.jsx
updateFile("src/features/grammar/GrammarDetail.jsx", [
  ['<span style={{ fontSize: "10px", color: "var(--color-success)", fontWeight: 800 }}>✓</span>', '<IconCheck size={12} style={{ color: "var(--color-success)" }} />'],
  ["📐 Rumus & Pola Kalimat Praktis", "<IconTarget size={14} style={{ marginRight: 4 }} /> Rumus & Pola Kalimat Praktis"],
  ["🧠 Pemahaman Bertahap: Dari Intuisi ke Kaidah Baku", "<IconSparkles size={14} style={{ marginRight: 4 }} /> Pemahaman Bertahap: Dari Intuisi ke Kaidah Baku"],
  ["💬 Contoh Pemakaian Kalimat Nyata", "<IconBook size={14} style={{ marginRight: 4 }} /> Contoh Pemakaian Kalimat Nyata"],
  ["🇮🇩 Kenapa Orang Indonesia Sering Salah di Topik Ini?", "<IconHelp size={14} style={{ marginRight: 4 }} /> Kenapa Orang Indonesia Sering Salah di Topik Ini?"],
  ["⚠️ Bedah Kesalahan Umum (Salah ➔ Benar)", "<IconClose size={14} style={{ marginRight: 4, color: 'var(--color-danger)' }} /> Bedah Kesalahan Umum (Salah ke Benar)"],
  ['<div className="mistake-wrong">✕ Salah:', '<div className="mistake-wrong"><IconClose size={12} style={{ marginRight: 4 }} /> Salah:'],
  ['<div className="mistake-correct">✓ Benar:', '<div className="mistake-correct"><IconCheck size={12} style={{ marginRight: 4 }} /> Benar:'],
  ["⚡ Ringkasan Cepat (Cheat Sheet)", "<IconSparkles size={14} style={{ marginRight: 4, color: 'var(--color-accent-gold)' }} /> Ringkasan Cepat (Cheat Sheet)"],
  ["⭐ Golden Rule:", "<IconStar size={12} style={{ marginRight: 4, color: 'var(--color-accent-gold)' }} /> Golden Rule:"],
  ["Mulai 12 Praktik Bertingkat ↗", "Mulai 12 Praktik Bertingkat"]
], ["IconCheck", "IconTarget", "IconSparkles", "IconBook", "IconHelp", "IconClose", "IconStar"]);

// 4. GrammarMasteryQuiz.jsx
updateFile("src/features/grammar/GrammarMasteryQuiz.jsx", [
  ['{isCorrect ? "✓ Jawaban Tepat" : `✕ Salah (Pilihanmu: ${optionLetters[userAnswer] || "-"})`}', '{isCorrect ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Jawaban Tepat</> : <><IconClose size={12} style={{ marginRight: 3 }} /> Salah (Pilihanmu: {optionLetters[userAnswer] || "-"})</>}']
], ["IconCheck", "IconClose"]);

// 5. GrammarPracticeRunner.jsx
updateFile("src/features/grammar/GrammarPracticeRunner.jsx", [
  ['{isCompleted ? "✓ Sesi Praktik Tersimpan di Cloud" : "Simpan Sesi Praktik & Lanjut ke Kuis ↗"}', '{isCompleted ? <><IconCheck size={12} style={{ marginRight: 4 }} /> Sesi Praktik Tersimpan di Cloud</> : "Simpan Sesi Praktik & Lanjut ke Kuis"}']
], ["IconCheck"]);

// 6. ProfileView.jsx
updateFile("src/features/profile/ProfileView.jsx", [
  ['"Pilih dari Galeri / Kamera ↗"', '"Pilih dari Galeri / Kamera"']
]);

// 7. ReadingQuizRunner.jsx
updateFile("src/features/reading/ReadingQuizRunner.jsx", [
  [">✕<", "><IconClose size={16} /><"],
  [">✕\n", "><IconClose size={16} />\n"],
  ["\n              ✕\n", "\n              <IconClose size={16} />\n"],
  ['{isCorrect ? "✓ Jawaban Benar" : `✕ Salah (Pilihanmu: ${optionLetters[userAnswer]})`}', '{isCorrect ? <><IconCheck size={12} style={{ marginRight: 3 }} /> Jawaban Benar</> : <><IconClose size={12} style={{ marginRight: 3 }} /> Salah (Pilihanmu: {optionLetters[userAnswer]})</>}'],
  ['<span>+ Tambahkan "${targetWord}" ke Review (SRS) ↗</span>', '<span>+ Tambahkan "${targetWord}" ke Review (SRS)</span>']
], ["IconClose", "IconCheck"]);

// 8. SettingsPanel.jsx
updateFile("src/features/settings/SettingsPanel.jsx", [
  ['color: notifFeedback.startsWith("✓") ? "var(--color-success)" : "var(--color-accent-gold)"', 'color: !notifFeedback.toLowerCase().includes("gagal") ? "var(--color-success)" : "var(--color-accent-gold)"'],
  ['"Pilih File Backup (.json) ↗"', '"Pilih File Backup (.json)"'],
  ['color: importStatus.startsWith("✓") ? "var(--color-success)" : "var(--color-text-secondary)"', 'color: !importStatus.toLowerCase().includes("gagal") ? "var(--color-success)" : "var(--color-text-secondary)"']
]);

// 9. StudySession.jsx
updateFile("src/features/study/StudySession.jsx", [
  ['{isCorrect ? "✓ Jawaban Benar! Pemahaman konteks berhasil." : "✗ Jawaban kurang tepat. Interval review direset ke 1 hari."}', '{isCorrect ? "Jawaban Benar! Pemahaman konteks berhasil." : "Jawaban kurang tepat. Interval review direset ke 1 hari."}'],
  ['<span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓ Tersimpan Otomatis</span>', '<span style={{ color: "var(--color-success)", fontWeight: 700 }}><IconCheck size={12} style={{ marginRight: 3 }} /> Tersimpan Otomatis</span>']
], ["IconCheck"]);

// 10. LandingPage.jsx
updateFile("src/pages/LandingPage.jsx", [
  ["Mulai Petualangan ↗", "Mulai Petualangan"],
  ["Buka Ruang Belajar Sekarang ↗", "Buka Ruang Belajar Sekarang"],
  ["Buat Akun Gratis Sekarang ↗", "Buat Akun Gratis Sekarang"]
]);

console.log("=== ALL REMAINING EMOJIS PURGED! ===");

