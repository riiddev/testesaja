/**
 * SINAUENGLISH V2 — Google Apps Script Serverless Backend
 * 
 * Manages user authentication, session tokens, SRS learning progress,
 * quiz attempts, and settings in a private Google Spreadsheet.
 * 
 * Deployment: Deploy as Web App -> Execute as: Me -> Who has access: Anyone.
 */

// Configuration
const CONFIG = {
  TOKEN_TTL_DAYS: 7,
  HASH_ITERATIONS: 5000,
  CACHE_TTL_SEC: 600, // 10 minutes cache for session checks
  LOCK_TIMEOUT_MS: 10000, // 10 seconds
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_SEC: 900 // 15 minutes
};

// Sheet Names
const SHEETS = {
  USERS: "Users",
  SESSIONS: "Sessions",
  PROGRESS: "Progress",
  QUIZ: "QuizAttempts",
  SETTINGS: "Settings",
  PROFILES: "Profiles",
  TITLES: "Titles",
  QUESTS: "Quests",
  CATALOG: "Catalog",
  INVENTORY: "Inventory",
  TRANSACTIONS: "Transactions",
  GRAMMAR_PROGRESS: "GrammarProgress",
  STORY_PROGRESS: "StoryProgress"
};

/**
 * Handle incoming HTTP POST requests
 * Uses text/plain to bypass CORS preflight restrictions
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Acquire lock to prevent race conditions during write operations
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  } catch (err) {
    return jsonResponse({ success: false, error: "Server sibuk. Silakan coba beberapa saat lagi." }, 429);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Payload kosong." }, 400);
    }

    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: "Format JSON tidak valid." }, 400);
    }

    const action = body.action;
    const token = body.token;
    const payload = body.payload || {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Route actions
    switch (action) {
      // 1. Authentication
      case "register":
        return handleRegister(ss, payload);
      case "login":
        return handleLogin(ss, payload);
      case "logout":
        return handleLogout(ss, token);
      case "getMe":
        return handleGetMe(ss, token);

      // 2. Learning Progress (SRS)
      case "getProgress":
        return handleGetProgress(ss, token);
      case "syncProgress":
        return handleSyncProgress(ss, token, payload);

      // 3. Quizzes
      case "saveQuiz":
        return handleSaveQuiz(ss, token, payload);
      case "getQuizHistory":
        return handleGetQuizHistory(ss, token);

      // 4. Settings
      case "getSettings":
        return handleGetSettings(ss, token);
      case "updateSettings":
        return handleUpdateSettings(ss, token, payload);

      // 5. Profiles & Titles
      case "getProfile":
        return handleGetProfile(ss, token);
      case "updateProfile":
        return handleUpdateProfile(ss, token, payload);
      case "getUserTitles":
        return handleGetUserTitles(ss, token);
      case "unlockTitle":
        return handleUnlockTitle(ss, token, payload);

      // 5b. Custom Profile Avatar (Google DriveApp)
      case "uploadAvatar":
        return handleUploadAvatar(ss, token, payload);
      case "getAvatar":
        return handleGetAvatar(ss, token);
      case "deleteAvatar":
        return handleDeleteAvatar(ss, token);

      // 6. Daily Quests / Missions
      case "getDailyQuests":
        return handleGetDailyQuests(ss, token, payload);
      case "updateQuestProgress":
        return handleUpdateQuestProgress(ss, token, payload);
      case "claimQuestReward":
        return handleClaimQuestReward(ss, token, payload);

      // 7. One-time Migration from V1/V2 JSON Backup
      case "importBackup":
        return handleImportBackup(ss, token, payload);

      // 8. Economy & Collections (Tahap 3)
      case "getCatalog":
        return handleGetCatalog(ss, token);
      case "getInventory":
        return handleGetInventory(ss, token);
      case "buyItem":
        return handleBuyItem(ss, token, payload);
      case "equipItem":
        return handleEquipItem(ss, token, payload);
      case "grantReward":
        return handleGrantReward(ss, token, payload);

      // 9. Grammar Progress & Mastery (Tahap 5)
      case "getGrammarProgress":
        return handleGetGrammarProgress(ss, token);
      case "saveGrammarProgress":
        return handleSaveGrammarProgress(ss, token, payload);

      // 10. Storytelling & Adventures (Tahap 6)
      case "getStoryProgress":
        return handleGetStoryProgress(ss, token, payload);
      case "completeStoryEpisode":
        return handleCompleteStoryEpisode(ss, token, payload);

      default:
        return jsonResponse({ success: false, error: "Aksi tidak dikenal: " + action }, 400);
    }
  } catch (error) {
    return jsonResponse({ success: false, error: "Terjadi kesalahan server: " + error.message }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle HTTP GET requests for health check
 */
function doGet(e) {
  return jsonResponse({
    success: true,
    name: "SinauEnglish V2 Backend API",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
}

/* ==========================================================================
   AUTHENTICATION HANDLERS
   ========================================================================== */

function handleRegister(ss, payload) {
  const email = (payload.email || "").trim().toLowerCase();
  const password = payload.password || "";
  const displayName = (payload.displayName || "").trim() || email.split("@")[0];

  if (!email || !email.includes("@")) {
    return jsonResponse({ success: false, error: "Format email tidak valid." }, 400);
  }
  if (!password || password.length < 6) {
    return jsonResponse({ success: false, error: "Password minimal harus 6 karakter." }, 400);
  }

  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return jsonResponse({ success: false, error: "Tabel Users belum dibuat. Jalankan setup() dulu." }, 500);

  const data = sheet.getDataRange().getValues();
  // Check if email already registered (column 1 = email, 0-indexed)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === email) {
      return jsonResponse({ success: false, error: "Email sudah terdaftar. Silakan login." }, 409);
    }
  }

  const userId = "u_" + Utilities.getUuid().replace(/-/g, "").slice(0, 16);
  const salt = Utilities.getUuid().replace(/-/g, "");
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  sheet.appendRow([userId, email, displayName, passwordHash, salt, now, now]);

  // Automatically create a session for immediate login
  const token = createSession(ss, userId);

  return jsonResponse({
    success: true,
    message: "Pendaftaran berhasil.",
    data: {
      token: token,
      user: { id: userId, email: email, displayName: displayName }
    }
  });
}

function handleLogin(ss, payload) {
  const email = (payload.email || "").trim().toLowerCase();
  const password = payload.password || "";

  if (!email || !password) {
    return jsonResponse({ success: false, error: "Email dan password wajib diisi." }, 400);
  }

  // Rate limit check
  const cache = CacheService.getScriptCache();
  const rateKey = "ratelimit_login_" + email;
  const attempts = Number(cache.get(rateKey) || 0);
  if (attempts >= CONFIG.MAX_LOGIN_ATTEMPTS) {
    return jsonResponse({ success: false, error: "Terlalu banyak percobaan login yang gagal. Silakan tunggu 15 menit." }, 429);
  }

  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  let userRow = -1;
  let userData = null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === email) {
      userRow = i + 1;
      userData = {
        id: data[i][0],
        email: data[i][1],
        displayName: data[i][2],
        passwordHash: data[i][3],
        salt: data[i][4]
      };
      break;
    }
  }

  if (!userData) {
    cache.put(rateKey, String(attempts + 1), CONFIG.RATE_LIMIT_WINDOW_SEC);
    return jsonResponse({ success: false, error: "Email atau password salah." }, 401);
  }

  const computedHash = hashPassword(password, userData.salt);
  if (computedHash !== userData.passwordHash) {
    cache.put(rateKey, String(attempts + 1), CONFIG.RATE_LIMIT_WINDOW_SEC);
    return jsonResponse({ success: false, error: "Email atau password salah." }, 401);
  }

  // Clear rate limit counter on success
  cache.remove(rateKey);

  // Update last_login
  sheet.getRange(userRow, 7).setValue(new Date().toISOString());

  // Issue new session token
  const token = createSession(ss, userData.id);

  return jsonResponse({
    success: true,
    message: "Login berhasil.",
    data: {
      token: token,
      user: { id: userData.id, email: userData.email, displayName: userData.displayName }
    }
  });
}

function handleLogout(ss, token) {
  if (!token) return jsonResponse({ success: true, message: "Logged out." });

  const tokenHash = hashToken(token);
  const sheet = ss.getSheetByName(SHEETS.SESSIONS);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === tokenHash) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }

  const cache = CacheService.getScriptCache();
  cache.remove("sess_" + tokenHash);

  return jsonResponse({ success: true, message: "Sesi berhasil ditutup." });
}

function handleGetMe(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid atau telah berakhir." }, 401);

  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return jsonResponse({
        success: true,
        data: {
          id: data[i][0],
          email: data[i][1],
          displayName: data[i][2],
          createdAt: data[i][5]
        }
      });
    }
  }

  return jsonResponse({ success: false, error: "Pengguna tidak ditemukan." }, 404);
}

/* ==========================================================================
   PROGRESS & SRS HANDLERS
   ========================================================================== */

function handleGetProgress(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const sheet = ss.getSheetByName(SHEETS.PROGRESS);
  if (!sheet) return jsonResponse({ success: true, data: { items: {} } });

  const data = sheet.getDataRange().getValues();
  const progressMap = {};

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      const wordId = data[i][1];
      progressMap[wordId] = {
        wordId: wordId,
        level: data[i][2],
        masteryStage: data[i][3],
        nextReviewAt: data[i][4],
        correctCount: Number(data[i][5]) || 0,
        wrongCount: Number(data[i][6]) || 0,
        updatedAt: data[i][7]
      };
    }
  }

  return jsonResponse({ success: true, data: { items: progressMap } });
}

function handleSyncProgress(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const updates = payload.updates || [];
  if (!Array.isArray(updates) || updates.length === 0) {
    return jsonResponse({ success: true, message: "Tidak ada pembaruan.", count: 0 });
  }

  const sheet = ss.getSheetByName(SHEETS.PROGRESS);
  const data = sheet.getDataRange().getValues();
  const rowMap = new Map();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      rowMap.set(data[i][1], i + 1); // map word_id -> 1-based row index
    }
  }

  const now = new Date().toISOString();
  const newRows = [];

  updates.forEach(u => {
    const wordId = u.wordId;
    const level = u.level || "A1";
    const masteryStage = u.masteryStage || "learning";
    const nextReviewAt = u.nextReviewAt || now;
    const correctCount = Number(u.correctCount) || 0;
    const wrongCount = Number(u.wrongCount) || 0;

    if (rowMap.has(wordId)) {
      const rowIdx = rowMap.get(wordId);
      sheet.getRange(rowIdx, 3, 1, 6).setValues([[level, masteryStage, nextReviewAt, correctCount, wrongCount, now]]);
    } else {
      newRows.push([userId, wordId, level, masteryStage, nextReviewAt, correctCount, wrongCount, now]);
    }
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 8).setValues(newRows);
  }

  return jsonResponse({ success: true, message: "Progres berhasil disinkronkan.", count: updates.length });
}

/* ==========================================================================
   QUIZ ATTEMPTS HANDLERS
   ========================================================================== */

function handleSaveQuiz(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const topicId = payload.topicId || "general";
  const score = Number(payload.score) || 0;
  const total = Number(payload.total) || 0;
  const now = new Date().toISOString();

  const sheet = ss.getSheetByName(SHEETS.QUIZ);
  sheet.appendRow([userId, topicId, score, total, now]);

  return jsonResponse({ success: true, message: "Hasil kuis tersimpan." });
}

function handleGetQuizHistory(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const sheet = ss.getSheetByName(SHEETS.QUIZ);
  const data = sheet.getDataRange().getValues();
  const history = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      history.push({
        topicId: data[i][1],
        score: Number(data[i][2]),
        total: Number(data[i][3]),
        takenAt: data[i][4]
      });
    }
  }

  return jsonResponse({ success: true, data: { history: history } });
}

/* ==========================================================================
   SETTINGS HANDLERS
   ========================================================================== */

function handleGetSettings(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const settings = { dailyGoal: 10, theme: "light" };

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      settings[data[i][1]] = data[i][2];
    }
  }

  return jsonResponse({ success: true, data: { settings: settings } });
}

function handleUpdateSettings(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const settings = payload.settings || {};
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();

  Object.keys(settings).forEach(key => {
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId && data[i][1] === key) {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx > 0) {
      sheet.getRange(rowIdx, 3).setValue(String(settings[key]));
    } else {
      sheet.appendRow([userId, key, String(settings[key])]);
    }
  });

  return jsonResponse({ success: true, message: "Pengaturan tersimpan." });
}

/* ==========================================================================
   BACKUP IMPORT MIGRATION HANDLER
   ========================================================================== */

function handleImportBackup(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const backupData = payload.backup || {};
  const wordProgress = backupData.wordProgress || backupData.progress || {};
  const words = Object.keys(wordProgress);

  if (words.length === 0) {
    return jsonResponse({ success: false, error: "File cadangan tidak berisi data progres yang valid." }, 400);
  }

  const updates = words.map(wId => {
    const item = wordProgress[wId];
    return {
      wordId: wId,
      level: item.level || "A1",
      masteryStage: item.masteryStage || item.stage || "learning",
      nextReviewAt: item.nextReviewAt || item.nextReview || new Date().toISOString(),
      correctCount: item.correctCount || (item.repetitions || 0),
      wrongCount: item.wrongCount || (item.lapses || 0)
    };
  });

  return handleSyncProgress(ss, token, { updates: updates });
}

/* ==========================================================================
   PROFILES & TITLES HANDLERS (NON-DESTRUCTIVE MIGRATION)
   ========================================================================== */

function ensureProfilesAndTitlesSheets(ss) {
  let profileSheet = ss.getSheetByName(SHEETS.PROFILES);
  if (!profileSheet) {
    profileSheet = ss.insertSheet(SHEETS.PROFILES);
    profileSheet.appendRow(["user_id", "display_name", "active_title", "xp", "streak", "coins", "last_active_date", "avatar_key"]);
    const hRange = profileSheet.getRange(1, 1, 1, 8);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    profileSheet.setFrozenRows(1);
    [180, 180, 200, 100, 80, 100, 200, 120].forEach((w, idx) => profileSheet.setColumnWidth(idx + 1, w));
  }

  let titleSheet = ss.getSheetByName(SHEETS.TITLES);
  if (!titleSheet) {
    titleSheet = ss.insertSheet(SHEETS.TITLES);
    titleSheet.appendRow(["user_id", "title_id", "unlocked_at"]);
    const hRange = titleSheet.getRange(1, 1, 1, 3);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    titleSheet.setFrozenRows(1);
    [180, 180, 200].forEach((w, idx) => titleSheet.setColumnWidth(idx + 1, w));
  }

  return { profileSheet, titleSheet };
}

function handleGetProfile(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const { profileSheet, titleSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let userProfile = null;

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      userProfile = {
        userId: pData[i][0],
        displayName: pData[i][1],
        activeTitle: pData[i][2],
        xp: Number(pData[i][3]) || 0,
        streak: Number(pData[i][4]) || 1,
        coins: Number(pData[i][5]) || 0,
        lastActiveDate: pData[i][6],
        avatarKey: pData[i][7] || "avatar_1"
      };
      break;
    }
  }

  const now = new Date().toISOString();

  // If profile not yet created in Profiles table, generate default profile
  if (!userProfile) {
    let name = "Pelajar Sinau";
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    if (userSheet) {
      const uData = userSheet.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        if (uData[i][0] === userId) {
          name = uData[i][2] || name;
          break;
        }
      }
    }

    userProfile = {
      userId: userId,
      displayName: name,
      activeTitle: "",
      xp: 0,
      streak: 0,
      coins: 0,
      lastActiveDate: now,
      avatarKey: "avatar_1"
    };

    profileSheet.appendRow([
      userId,
      userProfile.displayName,
      userProfile.activeTitle,
      userProfile.xp,
      userProfile.streak,
      userProfile.coins,
      userProfile.lastActiveDate,
      userProfile.avatarKey
    ]);
  }

  // Fetch unlocked titles for this user
  const tData = titleSheet.getDataRange().getValues();
  const unlockedTitles = [];
  for (let i = 1; i < tData.length; i++) {
    if (tData[i][0] === userId) {
      unlockedTitles.push({
        titleId: tData[i][1],
        unlockedAt: tData[i][2]
      });
    }
  }

  return jsonResponse({
    success: true,
    data: {
      profile: userProfile,
      unlockedTitles: unlockedTitles
    }
  });
}

function handleUpdateProfile(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      rowIdx = i + 1;
      break;
    }
  }

  const now = new Date().toISOString();

  if (rowIdx > 0) {
    if (payload.displayName) profileSheet.getRange(rowIdx, 2).setValue(String(payload.displayName).trim());
    if (payload.activeTitle) profileSheet.getRange(rowIdx, 3).setValue(String(payload.activeTitle));
    if (payload.xp !== undefined) profileSheet.getRange(rowIdx, 4).setValue(Number(payload.xp));
    if (payload.streak !== undefined) profileSheet.getRange(rowIdx, 5).setValue(Number(payload.streak));
    if (payload.coins !== undefined) profileSheet.getRange(rowIdx, 6).setValue(Number(payload.coins));
    profileSheet.getRange(rowIdx, 7).setValue(now);
    if (payload.avatarKey) profileSheet.getRange(rowIdx, 8).setValue(String(payload.avatarKey));
  } else {
    profileSheet.appendRow([
      userId,
      payload.displayName || "Pelajar Sinau",
      payload.activeTitle || "word_explorer",
      payload.xp !== undefined ? Number(payload.xp) : 50,
      payload.streak !== undefined ? Number(payload.streak) : 1,
      payload.coins !== undefined ? Number(payload.coins) : 50,
      now,
      payload.avatarKey || "avatar_1"
    ]);
  }

  // Update display_name in Users table as well
  if (payload.displayName) {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    if (userSheet) {
      const uData = userSheet.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        if (uData[i][0] === userId) {
          userSheet.getRange(i + 1, 3).setValue(String(payload.displayName).trim());
          break;
        }
      }
    }
  }

  return jsonResponse({
    success: true,
    message: "Profil berhasil diperbarui."
  });
}

function handleGetUserTitles(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const { titleSheet } = ensureProfilesAndTitlesSheets(ss);
  const data = titleSheet.getDataRange().getValues();
  const titles = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      titles.push({
        titleId: data[i][1],
        unlockedAt: data[i][2]
      });
    }
  }

  return jsonResponse({
    success: true,
    data: { titles: titles }
  });
}

function handleUnlockTitle(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const titleId = payload.titleId;
  if (!titleId) return jsonResponse({ success: false, error: "Title ID tidak valid." }, 400);

  const { titleSheet } = ensureProfilesAndTitlesSheets(ss);
  const data = titleSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][1] === titleId) {
      return jsonResponse({ success: true, message: "Gelar sudah terbuka sebelumnya." });
    }
  }

  const now = new Date().toISOString();
  titleSheet.appendRow([userId, titleId, now]);

  return jsonResponse({
    success: true,
    message: "Gelar berhasil dibuka!",
    data: { titleId: titleId, unlockedAt: now }
  });
}


/* ==========================================================================
   AVATAR DRIVEAPP HANDLERS (GOOGLE DRIVE STORAGE FOR PROFILES)
   ========================================================================== */

const AVATAR_FOLDER_NAME = "SinauEnglish_Avatars";

function getOrCreateAvatarFolder() {
  const folders = DriveApp.getFoldersByName(AVATAR_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(AVATAR_FOLDER_NAME);
}

function handleUploadAvatar(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const rawBase64 = payload.imageBase64;
  if (!rawBase64 || typeof rawBase64 !== "string") {
    return jsonResponse({ success: false, error: "Data gambar tidak valid." }, 400);
  }

  // Validate MIME type
  const mimeType = payload.mimeType || "image/webp";
  if (!["image/webp", "image/jpeg", "image/png"].includes(mimeType)) {
    return jsonResponse({ success: false, error: "Format gambar harus WebP, JPEG, atau PNG." }, 400);
  }

  // Clean data URL prefix if present
  const base64Data = rawBase64.replace(/^data:image\/\w+;base64,/, "");

  // Max size validation (target <= 60 KB, hard limit 75 KB)
  const bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > 75 * 1024) {
    return jsonResponse({ success: false, error: "Ukuran avatar melebihi batas 60 KB." }, 400);
  }

  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let rowIdx = -1;
  let oldFileId = "";

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      rowIdx = i + 1;
      oldFileId = pData[i][8] || "";
      break;
    }
  }

  // Delete previous avatar file if exists
  if (oldFileId) {
    try {
      const oldFile = DriveApp.getFileById(oldFileId);
      oldFile.setTrashed(true);
    } catch (e) {
      // old file may have been manually removed
    }
  }

  // Create new avatar file in dedicated Drive folder
  const folder = getOrCreateAvatarFolder();
  const fileName = "avatar_" + userId + "_" + Date.now() + (mimeType === "image/png" ? ".png" : mimeType === "image/jpeg" ? ".jpg" : ".webp");
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const newFile = folder.createFile(blob);
  const newFileId = newFile.getId();
  const now = new Date().toISOString();

  if (rowIdx > 0) {
    profileSheet.getRange(rowIdx, 9).setValue(newFileId);
    profileSheet.getRange(rowIdx, 10).setValue(now);
  } else {
    // User row doesn't exist yet, append
    profileSheet.appendRow([userId, "Pelajar Sinau", "", 0, 0, 0, now, "avatar_1", newFileId, now]);
  }

  const dataUrl = "data:" + mimeType + ";base64," + base64Data;

  return jsonResponse({
    success: true,
    message: "Foto profil berhasil diperbarui!",
    data: {
      avatarFileId: newFileId,
      avatarUpdatedAt: now,
      avatarUrl: dataUrl
    }
  });
}

function handleGetAvatar(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let fileId = "";
  let updatedAt = "";

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      fileId = pData[i][8] || "";
      updatedAt = pData[i][9] || "";
      break;
    }
  }

  if (!fileId) {
    return jsonResponse({
      success: true,
      data: { hasAvatar: false, avatarUrl: null, avatarUpdatedAt: null }
    });
  }

  try {
    const file = DriveApp.getFileById(fileId);
    const mimeType = file.getMimeType();
    const bytes = file.getBlob().getBytes();
    const base64Data = Utilities.base64Encode(bytes);
    const avatarUrl = "data:" + mimeType + ";base64," + base64Data;

    return jsonResponse({
      success: true,
      data: {
        hasAvatar: true,
        avatarUrl: avatarUrl,
        avatarUpdatedAt: updatedAt
      }
    });
  } catch (e) {
    return jsonResponse({
      success: true,
      data: { hasAvatar: false, avatarUrl: null, avatarUpdatedAt: null, warning: "Avatar lama tidak ditemukan di Drive." }
    });
  }
}

function handleDeleteAvatar(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let rowIdx = -1;
  let fileId = "";

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      rowIdx = i + 1;
      fileId = pData[i][8] || "";
      break;
    }
  }

  if (fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch (e) {}
  }

  const now = new Date().toISOString();
  if (rowIdx > 0) {
    profileSheet.getRange(rowIdx, 9).setValue("");
    profileSheet.getRange(rowIdx, 10).setValue(now);
  }

  return jsonResponse({
    success: true,
    message: "Foto profil berhasil dihapus.",
    data: { avatarUpdatedAt: now }
  });
}

/* ==========================================================================
   DAILY QUESTS / MISSIONS HANDLERS (NON-DESTRUCTIVE MIGRATION)
   ========================================================================== */

function ensureQuestsSheet(ss) {
  let questSheet = ss.getSheetByName(SHEETS.QUESTS);
  if (!questSheet) {
    questSheet = ss.insertSheet(SHEETS.QUESTS);
    questSheet.appendRow(["user_id", "date_str", "quest_id", "progress", "target", "is_completed", "claimed_at"]);
    const hRange = questSheet.getRange(1, 1, 1, 7);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    questSheet.setFrozenRows(1);
    [180, 120, 180, 80, 80, 100, 200].forEach((w, idx) => questSheet.setColumnWidth(idx + 1, w));
  }
  return questSheet;
}

function handleGetDailyQuests(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const dateStr = payload.dateStr || new Date().toISOString().slice(0, 10);
  const questSheet = ensureQuestsSheet(ss);
  const data = questSheet.getDataRange().getValues();
  const quests = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && String(data[i][1]) === dateStr) {
      quests.push({
        userId: data[i][0],
        dateStr: data[i][1],
        questId: data[i][2],
        progress: Number(data[i][3]) || 0,
        target: Number(data[i][4]) || 1,
        isCompleted: Boolean(data[i][5]),
        claimedAt: data[i][6] || null
      });
    }
  }

  return jsonResponse({
    success: true,
    data: { dateStr: dateStr, quests: quests }
  });
}

function handleUpdateQuestProgress(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const dateStr = payload.dateStr || new Date().toISOString().slice(0, 10);
  const questId = payload.questId;
  const progress = Number(payload.progress) || 0;
  const target = Number(payload.target) || 1;
  const isCompleted = progress >= target;

  const questSheet = ensureQuestsSheet(ss);
  const data = questSheet.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && String(data[i][1]) === dateStr && data[i][2] === questId) {
      rowIdx = i + 1;
      break;
    }
  }

  if (rowIdx > 0) {
    questSheet.getRange(rowIdx, 4).setValue(progress);
    questSheet.getRange(rowIdx, 6).setValue(isCompleted);
  } else {
    questSheet.appendRow([userId, dateStr, questId, progress, target, isCompleted, ""]);
  }

  return jsonResponse({
    success: true,
    data: { questId, progress, isCompleted }
  });
}

function handleClaimQuestReward(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const dateStr = payload.dateStr || new Date().toISOString().slice(0, 10);
  const questId = payload.questId;
  const xpReward = Number(payload.xpReward) || 35;
  const coinsReward = Number(payload.coinsReward) || 15;

  const questSheet = ensureQuestsSheet(ss);
  const data = questSheet.getDataRange().getValues();
  let rowIdx = -1;
  let alreadyClaimed = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && String(data[i][1]) === dateStr && data[i][2] === questId) {
      rowIdx = i + 1;
      if (data[i][6]) alreadyClaimed = true;
      break;
    }
  }

  if (alreadyClaimed) {
    return jsonResponse({ success: false, error: "Hadiah misi sudah diklaim sebelumnya." }, 400);
  }

  const now = new Date().toISOString();
  if (rowIdx > 0) {
    questSheet.getRange(rowIdx, 6).setValue(true);
    questSheet.getRange(rowIdx, 7).setValue(now);
  } else {
    questSheet.appendRow([userId, dateStr, questId, 1, 1, true, now]);
  }

  // Update profile XP & Coins
  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let pRowIdx = -1;
  let currentXp = 50;
  let currentCoins = 50;

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      pRowIdx = i + 1;
      currentXp = Number(pData[i][3]) || 0;
      currentCoins = Number(pData[i][5]) || 0;
      break;
    }
  }

  const newXp = currentXp + xpReward;
  const newCoins = currentCoins + coinsReward;

  if (pRowIdx > 0) {
    profileSheet.getRange(pRowIdx, 4).setValue(newXp);
    profileSheet.getRange(pRowIdx, 6).setValue(newCoins);
    profileSheet.getRange(pRowIdx, 7).setValue(now);
  }

  return jsonResponse({
    success: true,
    message: "Hadiah misi berhasil diklaim!",
    data: {
      questId: questId,
      claimedAt: now,
      xpEarned: xpReward,
      coinsEarned: coinsReward,
      totalXp: newXp,
      totalCoins: newCoins
    }
  });
}

/* ==========================================================================
   SECURITY & UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Creates a cryptographically random token, hashes it, and stores it in Sessions
 */
function createSession(ss, userId) {
  const rawToken = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + CONFIG.TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const sheet = ss.getSheetByName(SHEETS.SESSIONS);
  sheet.appendRow([tokenHash, userId, expiresAt]);

  // Cache user_id by tokenHash
  const cache = CacheService.getScriptCache();
  cache.put("sess_" + tokenHash, userId, CONFIG.CACHE_TTL_SEC);

  return rawToken;
}

/**
 * Validates session token, returning user_id or null if expired/invalid
 */
function validateSession(ss, token) {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const cache = CacheService.getScriptCache();
  const cachedUserId = cache.get("sess_" + tokenHash);
  if (cachedUserId) return cachedUserId;

  const sheet = ss.getSheetByName(SHEETS.SESSIONS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tokenHash) {
      const expiresAt = data[i][2];
      if (expiresAt > now) {
        const userId = data[i][1];
        cache.put("sess_" + tokenHash, userId, CONFIG.CACHE_TTL_SEC);
        return userId;
      }
      // Expired session
      return null;
    }
  }

  return null;
}

/**
 * Hashes session token with SHA-256
 */
function hashToken(token) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
  return bytesToHex(rawHash);
}

/**
 * Hashes password using Salt + SHA-256 with 5,000 iterations
 */
function hashPassword(password, salt) {
  let combined = salt + ":" + password;
  let hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined, Utilities.Charset.UTF_8);

  for (let i = 1; i < CONFIG.HASH_ITERATIONS; i++) {
    hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, hashBytes);
  }

  return bytesToHex(hashBytes);
}

/**
 * Helper to convert byte array to hex string
 */
function bytesToHex(bytes) {
  return bytes.map(function(byte) {
    const v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

/**
 * Returns JSON response with appropriate headers
 */
function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/* ==========================================================================
   ONE-TIME DATABASE SETUP FUNCTION
   Run this once from the Apps Script Editor toolbar (`setupDatabase`)
   ========================================================================== */

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
    },
    {
      name: "Profiles",
      headers: ["user_id", "display_name", "active_title", "xp", "streak", "coins", "last_active_date", "avatar_key"],
      columnWidths: [180, 180, 200, 100, 80, 100, 200, 120]
    },
    {
      name: "Titles",
      headers: ["user_id", "title_id", "unlocked_at"],
      columnWidths: [180, 180, 200]
    },
    {
      name: "Quests",
      headers: ["user_id", "date_str", "quest_id", "progress", "target", "is_completed", "claimed_at"],
      columnWidths: [180, 120, 180, 80, 80, 100, 200]
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



/* ==========================================================================
   ECONOMY, CATALOG & INVENTORY HANDLERS (TAHAP 3)
   ========================================================================== */

function ensureEconomySheets(ss) {
  let catalogSheet = ss.getSheetByName(SHEETS.CATALOG);
  if (!catalogSheet) {
    catalogSheet = ss.insertSheet(SHEETS.CATALOG);
    catalogSheet.appendRow(["item_id", "type", "name", "price", "level_req", "active"]);
    const hRange = catalogSheet.getRange(1, 1, 1, 6);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    catalogSheet.setFrozenRows(1);
    [160, 100, 200, 100, 100, 80].forEach((w, idx) => catalogSheet.setColumnWidth(idx + 1, w));
  }

  // Seed default catalog if empty
  if (catalogSheet.getLastRow() <= 1) {
    const initialItems = [
      ["border_daun", "border", "Border Daun Belajar", 0, 1, true],
      ["border_tinta", "border", "Border Tinta Cendekiawan", 0, 1, true],
      ["border_kawung", "border", "Border Kawung Tradisional", 120, 3, true],
      ["border_buku", "border", "Border Buku Terbuka", 250, 5, true],
      ["border_emas", "border", "Border Emas Mahkota", 400, 6, true],
      ["border_kanci", "border", "Border Kanci Orisinal", 600, 8, true],
      ["outfit_kacamata", "outfit", "Kacamata Baca Cerdik", 150, 3, true],
      ["outfit_syal", "outfit", "Syal Tenun Hangat", 200, 4, true],
      ["outfit_headphone", "outfit", "Headphone Audio Fokus", 350, 6, true],
      ["outfit_petualang", "outfit", "Topi Petualang Rimba", 500, 7, true],
      ["streak_freeze", "utility", "Pelindung Streak (Streak Freeze)", 80, 2, true]
    ];
    initialItems.forEach(row => catalogSheet.appendRow(row));
  }

  let inventorySheet = ss.getSheetByName(SHEETS.INVENTORY);
  if (!inventorySheet) {
    inventorySheet = ss.insertSheet(SHEETS.INVENTORY);
    inventorySheet.appendRow(["user_id", "item_id", "unlocked_at", "equipped"]);
    const hRange = inventorySheet.getRange(1, 1, 1, 4);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    inventorySheet.setFrozenRows(1);
    [180, 160, 200, 100].forEach((w, idx) => inventorySheet.setColumnWidth(idx + 1, w));
  }

  let txSheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
  if (!txSheet) {
    txSheet = ss.insertSheet(SHEETS.TRANSACTIONS);
    txSheet.appendRow(["user_id", "tx_id", "type", "amount", "source", "ref_id", "created_at"]);
    const hRange = txSheet.getRange(1, 1, 1, 7);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    txSheet.setFrozenRows(1);
    [180, 200, 100, 100, 140, 200, 200].forEach((w, idx) => txSheet.setColumnWidth(idx + 1, w));
  }

  return { catalogSheet, inventorySheet, txSheet };
}

function handleGetCatalog(ss, token) {
  const { catalogSheet } = ensureEconomySheets(ss);
  const data = catalogSheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === true || String(data[i][5]).toLowerCase() === "true") {
      items.push({
        id: data[i][0],
        type: data[i][1],
        name: data[i][2],
        price: Number(data[i][3]) || 0,
        levelReq: Number(data[i][4]) || 1,
        active: true
      });
    }
  }
  return jsonResponse({ success: true, data: { items } });
}

function handleGetInventory(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const { inventorySheet } = ensureEconomySheets(ss);
  const data = inventorySheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      items.push({
        itemId: data[i][1],
        unlockedAt: data[i][2],
        equipped: data[i][3] === true || String(data[i][3]).toLowerCase() === "true"
      });
    }
  }

  // Ensure starter items (border_daun, border_tinta) are unlocked
  const hasDaun = items.some(it => it.itemId === "border_daun");
  const hasTinta = items.some(it => it.itemId === "border_tinta");
  const now = new Date().toISOString();

  if (!hasDaun) {
    inventorySheet.appendRow([userId, "border_daun", now, false]);
    items.push({ itemId: "border_daun", unlockedAt: now, equipped: false });
  }
  if (!hasTinta) {
    inventorySheet.appendRow([userId, "border_tinta", now, false]);
    items.push({ itemId: "border_tinta", unlockedAt: now, equipped: false });
  }

  return jsonResponse({ success: true, data: { inventory: items } });
}

function handleBuyItem(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const itemId = payload.itemId;
  if (!itemId) return jsonResponse({ success: false, error: "Item ID tidak valid." }, 400);

  const { catalogSheet, inventorySheet, txSheet } = ensureEconomySheets(ss);
  const catData = catalogSheet.getDataRange().getValues();
  let targetItem = null;

  for (let i = 1; i < catData.length; i++) {
    if (catData[i][0] === itemId) {
      targetItem = {
        id: catData[i][0],
        type: catData[i][1],
        name: catData[i][2],
        price: Number(catData[i][3]) || 0,
        levelReq: Number(catData[i][4]) || 1,
        active: catData[i][5] === true || String(catData[i][5]).toLowerCase() === "true"
      };
      break;
    }
  }

  if (!targetItem || !targetItem.active) {
    return jsonResponse({ success: false, error: "Item tidak ditemukan di katalog." }, 404);
  }

  // 1. Check user level from XP in Profiles
  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let pRowIdx = -1;
  let userXp = 0;
  let userCoins = 0;

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      pRowIdx = i + 1;
      userXp = Number(pData[i][3]) || 0;
      userCoins = Number(pData[i][5]) || 0;
      break;
    }
  }

  const userLevel = Math.max(1, Math.floor(Math.sqrt(userXp / 15)) + 1);
  if (userLevel < targetItem.levelReq) {
    return jsonResponse({
      success: false,
      error: "Level belum mencukupi. Butuh Level " + targetItem.levelReq + " (Levelmu saat ini: " + userLevel + ")."
    }, 400);
  }

  // 2. Check if already owned
  const invData = inventorySheet.getDataRange().getValues();
  let ownedCount = 0;
  for (let i = 1; i < invData.length; i++) {
    if (invData[i][0] === userId && invData[i][1] === itemId) {
      ownedCount++;
    }
  }

  if (targetItem.type !== "utility" && ownedCount > 0) {
    return jsonResponse({ success: false, error: "Item ini sudah kamu miliki di inventaris." }, 400);
  }
  if (targetItem.id === "streak_freeze" && ownedCount >= 2) {
    return jsonResponse({ success: false, error: "Maksimal penyimpanan Pelindung Streak adalah 2 buah." }, 400);
  }

  // 3. Check coins
  if (userCoins < targetItem.price) {
    return jsonResponse({
      success: false,
      error: "Sinau Coin tidak mencukupi (Butuh " + targetItem.price + " Coin, saldomu " + userCoins + " Coin)."
    }, 400);
  }

  // 4. Deduct coins
  const remainingCoins = userCoins - targetItem.price;
  const now = new Date().toISOString();
  if (pRowIdx > 0) {
    profileSheet.getRange(pRowIdx, 6).setValue(remainingCoins);
    profileSheet.getRange(pRowIdx, 7).setValue(now);
  }

  // 5. Add to inventory
  inventorySheet.appendRow([userId, itemId, now, false]);

  // 6. Record transaction
  const txId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  txSheet.appendRow([userId, txId, "debit", targetItem.price, "shop_purchase", itemId, now]);

  return jsonResponse({
    success: true,
    message: "Berhasil membeli " + targetItem.name + "!",
    data: {
      item: targetItem,
      coins: remainingCoins
    }
  });
}

function handleEquipItem(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const itemId = payload.itemId; // e.g. "border_kawung" or "none"
  const type = payload.type || "border"; // "border" or "outfit"

  const { catalogSheet, inventorySheet } = ensureEconomySheets(ss);
  const catData = catalogSheet.getDataRange().getValues();
  const invData = inventorySheet.getDataRange().getValues();

  // If itemId is not "none", verify user owns it
  if (itemId && itemId !== "none") {
    let owned = false;
    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] === userId && invData[i][1] === itemId) {
        owned = true;
        break;
      }
    }
    if (!owned) {
      return jsonResponse({ success: false, error: "Kamu belum memiliki item ini." }, 400);
    }
  }

  // Map each item in catalog to its type
  const itemTypeMap = {};
  for (let i = 1; i < catData.length; i++) {
    itemTypeMap[catData[i][0]] = catData[i][1];
  }

  // Update equipped flag in Inventory
  for (let i = 1; i < invData.length; i++) {
    if (invData[i][0] === userId) {
      const invItemId = invData[i][1];
      const invItemType = itemTypeMap[invItemId] || "border";
      if (invItemType === type) {
        const isTarget = invItemId === itemId;
        inventorySheet.getRange(i + 1, 4).setValue(isTarget);
      }
    }
  }

  return jsonResponse({
    success: true,
    message: itemId === "none" ? "Item berhasil dilepas." : "Item berhasil dipasang!",
    data: {
      equippedItemId: itemId === "none" ? null : itemId,
      type: type
    }
  });
}

function handleGrantReward(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const eventId = payload.eventId;
  const source = payload.source; // "daily_quest" | "story_episode" | "article_quiz" | "grammar_quiz" | "srs_review" | "matching" | "streak_milestone"
  const refId = payload.refId || "";
  const meta = payload.meta || {};

  if (!eventId || !source) {
    return jsonResponse({ success: false, error: "Parameter event reward tidak lengkap." }, 400);
  }

  const { txSheet } = ensureEconomySheets(ss);
  const txData = txSheet.getDataRange().getValues();

  // 1. IDEMPOTENCY CHECK: Check if eventId was already rewarded
  for (let i = 1; i < txData.length; i++) {
    if (txData[i][0] === userId && txData[i][5] === eventId) {
      return jsonResponse({
        success: true,
        alreadyClaimed: true,
        message: "Reward sudah diklaim sebelumnya."
      });
    }
  }

  // 2. DAILY CAP CHECK
  const todayStr = new Date().toISOString().slice(0, 10);
  let todayCount = 0;
  for (let i = 1; i < txData.length; i++) {
    if (txData[i][0] === userId && txData[i][4] === source) {
      const txDateStr = String(txData[i][6]).slice(0, 10);
      if (txDateStr === todayStr) {
        todayCount++;
      }
    }
  }

  // 3. SERVER-SIDE CALCULATION OF REWARD
  let xpReward = 0;
  let coinsReward = 0;

  if (source === "daily_quest") {
    if (todayCount >= 3) return jsonResponse({ success: false, error: "Batas harian reward misi sudah tercapai (3 misi/hari)." }, 400);
    xpReward = Number(meta.difficulty) === 2 ? 40 : 30;
    coinsReward = Number(meta.difficulty) === 2 ? 20 : 15;
  } else if (source === "story_episode") {
    if (todayCount >= 1) return jsonResponse({ success: false, error: "Batas harian reward cerita sudah tercapai (1 episode/hari)." }, 400);
    xpReward = 50;
    coinsReward = 30;
  } else if (source === "article_quiz") {
    if (todayCount >= 2) return jsonResponse({ success: false, error: "Batas harian kuis artikel sudah tercapai (2 kuis/hari)." }, 400);
    const scorePct = Number(meta.scorePct) || 0;
    if (scorePct >= 80) xpReward = 30;
    if (scorePct >= 100) coinsReward = 20;
    if (xpReward === 0 && coinsReward === 0) {
      return jsonResponse({ success: true, message: "Kuis selesai, butuh skor minimal 80% untuk mendapatkan reward." });
    }
  } else if (source === "grammar_quiz") {
    if (todayCount >= 2) return jsonResponse({ success: false, error: "Batas harian latihan grammar sudah tercapai (2 sesi/hari)." }, 400);
    xpReward = 25;
    coinsReward = 15;
  } else if (source === "srs_review") {
    if (todayCount >= 4) return jsonResponse({ success: false, error: "Batas harian review terhadiah sudah tercapai (40 kata/hari)." }, 400);
    xpReward = 15;
    coinsReward = 10;
  } else if (source === "matching") {
    if (todayCount >= 2) return jsonResponse({ success: false, error: "Batas harian matching konteks sudah tercapai (2 sesi/hari)." }, 400);
    xpReward = 15;
    coinsReward = 10;
  } else if (source === "streak_milestone") {
    const days = Number(meta.streakDays) || 7;
    if (days >= 100) { xpReward = 1000; coinsReward = 500; }
    else if (days >= 30) { xpReward = 300; coinsReward = 150; }
    else { xpReward = 100; coinsReward = 50; }
  } else {
    xpReward = 10;
    coinsReward = 5;
  }

  // 4. Update Profile XP & Coins in Spreadsheet
  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let pRowIdx = -1;
  let currentXp = 50;
  let currentCoins = 50;

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      pRowIdx = i + 1;
      currentXp = Number(pData[i][3]) || 0;
      currentCoins = Number(pData[i][5]) || 0;
      break;
    }
  }

  const prevLevel = Math.max(1, Math.floor(Math.sqrt(currentXp / 15)) + 1);
  const nextXp = currentXp + xpReward;
  const nextCoins = currentCoins + coinsReward;
  const nextLevel = Math.max(1, Math.floor(Math.sqrt(nextXp / 15)) + 1);
  const isLevelUp = nextLevel > prevLevel;
  const now = new Date().toISOString();

  if (pRowIdx > 0) {
    profileSheet.getRange(pRowIdx, 4).setValue(nextXp);
    profileSheet.getRange(pRowIdx, 6).setValue(nextCoins);
    profileSheet.getRange(pRowIdx, 7).setValue(now);
  }

  // 5. Append Transaction record
  const txId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  txSheet.appendRow([userId, txId, "credit", coinsReward, source, eventId, now]);

  return jsonResponse({
    success: true,
    data: {
      earnedXp: xpReward,
      earnedCoins: coinsReward,
      totalXp: nextXp,
      totalCoins: nextCoins,
      level: nextLevel,
      isLevelUp: isLevelUp
    }
  });
}


/* ==========================================================================
   GRAMMAR PROGRESS & MASTERY HANDLERS (TAHAP 5)
   ========================================================================== */

function ensureGrammarSheets(ss) {
  let sheet = ss.getSheetByName(SHEETS.GRAMMAR_PROGRESS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.GRAMMAR_PROGRESS);
    sheet.appendRow(["user_id", "topic_id", "practice_done", "quiz_best", "status", "updated_at"]);
    const hRange = sheet.getRange(1, 1, 1, 6);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    [180, 160, 120, 100, 120, 200].forEach((w, idx) => sheet.setColumnWidth(idx + 1, w));
  }
  return sheet;
}

function handleGetGrammarProgress(ss, token) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const sheet = ensureGrammarSheets(ss);
  const data = sheet.getDataRange().getValues();
  const progress = {};

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      const topicId = data[i][1];
      progress[topicId] = {
        topicId: topicId,
        practiceDone: Boolean(data[i][2]),
        quizBest: Number(data[i][3]) || 0,
        status: data[i][4] || "learning",
        updatedAt: data[i][5]
      };
    }
  }

  return jsonResponse({
    success: true,
    data: { progress }
  });
}

function handleSaveGrammarProgress(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const topicId = payload.topicId;
  const practiceDone = Boolean(payload.practiceDone);
  const quizScore = Number(payload.quizScore) || 0;

  if (!topicId) return jsonResponse({ success: false, error: "Parameter topicId diperlukan." }, 400);

  const sheet = ensureGrammarSheets(ss);
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  let currentQuizBest = 0;
  let currentPracticeDone = false;
  let currentStatus = "learning";

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][1] === topicId) {
      rowIdx = i + 1;
      currentPracticeDone = Boolean(data[i][2]);
      currentQuizBest = Number(data[i][3]) || 0;
      currentStatus = data[i][4] || "learning";
      break;
    }
  }

  const nextPracticeDone = practiceDone || currentPracticeDone;
  const nextQuizBest = Math.max(currentQuizBest, quizScore);
  const isMastered = nextQuizBest >= 80;
  const nextStatus = isMastered ? "mastered" : (nextPracticeDone ? "learning" : currentStatus);
  const now = new Date().toISOString();

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 3).setValue(nextPracticeDone);
    sheet.getRange(rowIdx, 4).setValue(nextQuizBest);
    sheet.getRange(rowIdx, 5).setValue(nextStatus);
    sheet.getRange(rowIdx, 6).setValue(now);
  } else {
    sheet.appendRow([userId, topicId, nextPracticeDone, nextQuizBest, nextStatus, now]);
  }

  return jsonResponse({
    success: true,
    data: {
      topicId,
      practiceDone: nextPracticeDone,
      quizBest: nextQuizBest,
      status: nextStatus,
      isMastered,
      isNewlyMastered: isMastered && currentStatus !== "mastered"
    }
  });
}


/* ==========================================================================
   STORY PROGRESS & EPISODE HANDLERS (TAHAP 6)
   ========================================================================== */

function ensureStoriesSheets(ss) {
  let sheet = ss.getSheetByName(SHEETS.STORY_PROGRESS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.STORY_PROGRESS);
    sheet.appendRow(["user_id", "story_id", "episode_id", "completed_at", "date_wib"]);
    const hRange = sheet.getRange(1, 1, 1, 5);
    hRange.setFontWeight("bold");
    hRange.setBackground("#4B5E73");
    hRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    [180, 140, 140, 200, 140].forEach((w, idx) => sheet.setColumnWidth(idx + 1, w));
  }
  return sheet;
}

function getTodayWibDateString() {
  const now = new Date();
  return Utilities.formatDate(now, "GMT+07:00", "yyyy-MM-dd");
}

function handleGetStoryProgress(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const sheet = ensureStoriesSheets(ss);
  const data = sheet.getDataRange().getValues();
  const progress = {}; // { [storyId]: Set of completed episodeIds }
  const completedTodayWib = [];
  const todayWib = getTodayWibDateString();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      const sId = data[i][1];
      const epId = Number(data[i][2]);
      const dateWib = String(data[i][4]);

      if (!progress[sId]) progress[sId] = [];
      if (!progress[sId].includes(epId)) progress[sId].push(epId);

      if (dateWib === todayWib) {
        completedTodayWib.push({ storyId: sId, episodeId: epId });
      }
    }
  }

  return jsonResponse({
    success: true,
    data: {
      progress,
      todayWib,
      hasUnlockedNewEpisodeToday: completedTodayWib.length > 0,
      completedTodayWib
    }
  });
}

function handleCompleteStoryEpisode(ss, token, payload) {
  const userId = validateSession(ss, token);
  if (!userId) return jsonResponse({ success: false, error: "Sesi tidak valid." }, 401);

  const storyId = payload.storyId;
  const episodeId = Number(payload.episodeId);

  if (!storyId || !episodeId) {
    return jsonResponse({ success: false, error: "Parameter storyId dan episodeId diperlukan." }, 400);
  }

  const sheet = ensureStoriesSheets(ss);
  const data = sheet.getDataRange().getValues();
  const todayWib = getTodayWibDateString();
  let alreadyCompletedThisEpisode = false;
  let newEpisodesCompletedToday = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      const rowStory = data[i][1];
      const rowEp = Number(data[i][2]);
      const rowDateWib = String(data[i][4]);

      if (rowStory === storyId && rowEp === episodeId) {
        alreadyCompletedThisEpisode = true;
      }

      if (rowDateWib === todayWib) {
        newEpisodesCompletedToday++;
      }
    }
  }

  // Sequential story check: Story N requires Story N-1 to have 10 unique completed episodes
  const storyNumMatch = String(storyId).match(/story-(\d+)/);
  if (storyNumMatch) {
    const sNum = parseInt(storyNumMatch[1], 10);
    if (sNum > 1) {
      const prevStoryId = "story-" + (sNum - 1 < 10 ? "0" + (sNum - 1) : (sNum - 1));
      let prevCount = 0;
      const countedEps = {};
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === userId && data[i][1] === prevStoryId) {
          const ep = Number(data[i][2]);
          if (!countedEps[ep]) {
            countedEps[ep] = true;
            prevCount++;
          }
        }
      }
      if (prevCount < 10) {
        return jsonResponse({
          success: false,
          error: "Cerita sebelumnya belum selesai. Anda harus menyelesaikan seluruh 10 episode Cerita " + (sNum - 1) + " terlebih dahulu!"
        }, 403);
      }
    }
  }

  // If this episode was ALREADY completed previously: allow replay without reward
  if (alreadyCompletedThisEpisode) {
    return jsonResponse({
      success: true,
      alreadyCompleted: true,
      earnedXp: 0,
      earnedCoins: 0,
      message: "Episode selesai diulang (tanpa reward ganda)."
    });
  }

  // DAILY PACING CHECK: Only 1 NEW episode per calendar day (WIB)
  if (newEpisodesCompletedToday >= 1) {
    return jsonResponse({
      success: false,
      error: "Batas harian: Anda hanya dapat membuka 1 episode baru per hari (WIB). Episode berikutnya akan terbuka esok hari!"
    }, 429);
  }

  // First time completing this episode: grant reward
  const eventId = "story_ep_" + storyId + "_" + episodeId + "_" + Date.now();
  const nowIso = new Date().toISOString();

  // Record completion
  sheet.appendRow([userId, storyId, episodeId, nowIso, todayWib]);

  // Grant reward via economy calculation (+50 EXP, +30 Coins)
  const xpReward = 50;
  const coinsReward = 30;

  const { profileSheet } = ensureProfilesAndTitlesSheets(ss);
  const pData = profileSheet.getDataRange().getValues();
  let pRowIdx = -1;
  let currentXp = 0;
  let currentCoins = 0;

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === userId) {
      pRowIdx = i + 1;
      currentXp = Number(pData[i][3]) || 0;
      currentCoins = Number(pData[i][5]) || 0;
      break;
    }
  }

  const nextXp = currentXp + xpReward;
  const nextCoins = currentCoins + coinsReward;
  const nextLevel = Math.max(1, Math.floor(Math.sqrt(nextXp / 15)) + 1);

  if (pRowIdx > 0) {
    profileSheet.getRange(pRowIdx, 4).setValue(nextXp);
    profileSheet.getRange(pRowIdx, 6).setValue(nextCoins);
    profileSheet.getRange(pRowIdx, 7).setValue(nowIso);
  }

  const { txSheet } = ensureEconomySheets(ss);
  const txId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  txSheet.appendRow([userId, txId, "credit", coinsReward, "story_episode", eventId, nowIso]);

  return jsonResponse({
    success: true,
    data: {
      storyId,
      episodeId,
      earnedXp: xpReward,
      earnedCoins: coinsReward,
      totalXp: nextXp,
      totalCoins: nextCoins,
      level: nextLevel,
      todayWib
    }
  });
}
