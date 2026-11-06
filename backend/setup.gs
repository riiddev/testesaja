/**
 * SINAUENGLISH V2 — Database Setup Script
 * 
 * Run this function once from the Apps Script Editor (`setupDatabase`)
 * to automatically create and format the 5 required sheets.
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const tables = [
    {
      name: "Users",
      headers: ["id", "email", "display_name", "password_hash", "salt", "created_at", "last_login"],
      columnWidths: [180, 220, 180, 260, 260, 200, 200]
    },
    {
      name: "Sessions",
      headers: ["token_hash", "user_id", "expires_at"],
      columnWidths: [260, 180, 200]
    },
    {
      name: "Progress",
      headers: ["user_id", "word_id", "level", "mastery_stage", "next_review_at", "correct_count", "wrong_count", "updated_at"],
      columnWidths: [180, 140, 80, 120, 200, 100, 100, 200]
    },
    {
      name: "QuizAttempts",
      headers: ["user_id", "topic_id", "score", "total", "taken_at"],
      columnWidths: [180, 180, 80, 80, 200]
    },
    {
      name: "Settings",
      headers: ["user_id", "key", "value"],
      columnWidths: [180, 160, 240]
    }
  ];

  tables.forEach(table => {
    let sheet = ss.getSheetByName(table.name);
    if (!sheet) {
      sheet = ss.insertSheet(table.name);
    }

    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(table.headers);
      const headerRange = sheet.getRange(1, 1, 1, table.headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4B5E73");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);

      table.columnWidths.forEach((width, idx) => {
        sheet.setColumnWidth(idx + 1, width);
      });
    }
  });

  // Remove default "Sheet1" if empty and other sheets exist
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Ignore if cannot delete
    }
  }

  Logger.log("✅ SinauEnglish V2 Database setup completed successfully!");
}

