/**
 * SinauuEnglish — Google Apps Script Backend (Production 2.0)
 * 
 * High-performance, batch-optimized Google Sheets storage engine for
 * user accounts, multi-device incremental progress synchronization,
 * and offline merge durability.
 *
 * SPREADSHEET STRUCTURE (Created automatically if missing):
 * - Tab "Accounts": user_id, email, password_hash, password_salt, display_name, status, created_at, updated_at, last_login_at
 * - Tab "LearningStates": user_id, updated_at, part_count, state_part_01 ... state_part_24
 * - Tab "Collections": collection, record_id, user_id, updated_at, payload
 */

var CONFIG = {
  VERSION: "2.0.0",
  MAX_LOCK_WAIT_MS: 15000,
  CACHE_TTL_SECONDS: 600, // 10 minutes cache for read lookups
  CHUNK_SIZE: 30000,
  MAX_CHUNKS: 250,
  SHEETS: {
    ACCOUNTS: "Accounts",
    STATES: "LearningStates",
    COLLECTIONS: "Collections"
  }
};

/**
 * Handle HTTP POST requests from the Vercel API or authorized clients.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var rawText = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var payload = {};
    try {
      payload = JSON.parse(rawText);
    } catch (parseErr) {
      return jsonResponse({ ok: false, error: "Format payload JSON tidak valid." });
    }

    var expectedKey = getScriptApiKey();
    if (!expectedKey || expectedKey.length < 16) {
      return jsonResponse({
        ok: false,
        error: "SINAI_API_KEY belum dikonfigurasi di Script Properties Google Apps Script."
      });
    }

    var providedKey = payload.apiKey || (e && e.parameter && e.parameter.apiKey);
    if (!providedKey || providedKey !== expectedKey) {
      return jsonResponse({ ok: false, error: "Unauthorized: API key tidak cocok." });
    }

    var action = payload.action || (e && e.parameter && e.parameter.action) || "health";

    // Route actions
    if (action === "health" || action === "status") {
      return handleHealth();
    } else if (action === "users.findByEmail") {
      return handleFindUserByEmail(payload);
    } else if (action === "users.findById") {
      return handleFindUserById(payload);
    } else if (action === "users.create") {
      if (!lock.tryLock(CONFIG.MAX_LOCK_WAIT_MS)) {
        return jsonResponse({ ok: false, error: "Server sibuk. Coba lagi dalam beberapa saat." });
      }
      return handleCreateUser(payload);
    } else if (action === "collections.list") {
      return handleCollectionsList(payload);
    } else if (action === "collections.upsertBatch") {
      if (!lock.tryLock(CONFIG.MAX_LOCK_WAIT_MS)) {
        return jsonResponse({ ok: false, error: "Server sibuk memproses antrean sinkronisasi. Coba lagi." });
      }
      return handleCollectionsUpsertBatch(payload);
    } else if (action === "progress.get") {
      return handleProgressGet(payload);
    } else if (action === "progress.save") {
      if (!lock.tryLock(CONFIG.MAX_LOCK_WAIT_MS)) {
        return jsonResponse({ ok: false, error: "Server sibuk memproses penyimpanan progres. Coba lagi." });
      }
      return handleProgressSave(payload);
    } else {
      return jsonResponse({ ok: false, error: "Aksi '" + action + "' tidak dikenal." });
    }
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: "Kesalahan internal Apps Script: " + (err.message || String(err))
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

/**
 * Handle HTTP GET requests (Health check and status inspection).
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "health";
  if (action === "health" || action === "status") {
    return handleHealth();
  }
  return jsonResponse({
    ok: true,
    service: "SinauuEnglish Google Sheets Sync Engine",
    version: CONFIG.VERSION,
    timestamp: new Date().toISOString()
  });
}

// ==========================================
// ACTION HANDLERS
// ==========================================

function handleHealth() {
  var ss = getSpreadsheet();
  return jsonResponse({
    ok: true,
    version: CONFIG.VERSION,
    spreadsheetId: ss.getId(),
    timestamp: new Date().toISOString()
  });
}

function handleFindUserByEmail(payload) {
  var email = String(payload.email || "").trim().toLowerCase();
  if (!email) {
    return jsonResponse({ ok: false, error: "Email wajib diisi." });
  }

  var cache = CacheService.getScriptCache();
  var cachedJson = cache.get("user:email:" + email);
  if (cachedJson) {
    try {
      var cachedUser = JSON.parse(cachedJson);
      return jsonResponse({ ok: true, data: cachedUser });
    } catch (_) {}
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.ACCOUNTS, [
    "user_id", "email", "password_hash", "password_salt", "display_name", "status", "created_at", "updated_at", "last_login_at"
  ]);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ ok: true, data: null });
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowEmail = String(row[1] || "").trim().toLowerCase();
    if (rowEmail === email) {
      var user = {
        userId: String(row[0] || ""),
        id: String(row[0] || ""),
        email: rowEmail,
        passwordHash: String(row[2] || ""),
        passwordSalt: String(row[3] || ""),
        displayName: String(row[4] || rowEmail.split("@")[0]),
        status: String(row[5] || "active"),
        createdAt: String(row[6] || ""),
        updatedAt: String(row[7] || ""),
        lastLoginAt: String(row[8] || "")
      };
      cache.put("user:email:" + email, JSON.stringify(user), CONFIG.CACHE_TTL_SECONDS);
      cache.put("user:id:" + user.userId, JSON.stringify(user), CONFIG.CACHE_TTL_SECONDS);
      return jsonResponse({ ok: true, data: user });
    }
  }

  return jsonResponse({ ok: true, data: null });
}

function handleFindUserById(payload) {
  var userId = String(payload.userId || payload.id || "").trim();
  if (!userId) {
    return jsonResponse({ ok: false, error: "User ID wajib diisi." });
  }

  var cache = CacheService.getScriptCache();
  var cachedJson = cache.get("user:id:" + userId);
  if (cachedJson) {
    try {
      var cachedUser = JSON.parse(cachedJson);
      return jsonResponse({ ok: true, data: cachedUser });
    } catch (_) {}
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.ACCOUNTS, [
    "user_id", "email", "password_hash", "password_salt", "display_name", "status", "created_at", "updated_at", "last_login_at"
  ]);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ ok: true, data: null });
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0] || "") === userId) {
      var email = String(row[1] || "").trim().toLowerCase();
      var user = {
        userId: userId,
        id: userId,
        email: email,
        passwordHash: String(row[2] || ""),
        passwordSalt: String(row[3] || ""),
        displayName: String(row[4] || email.split("@")[0]),
        status: String(row[5] || "active"),
        createdAt: String(row[6] || ""),
        updatedAt: String(row[7] || ""),
        lastLoginAt: String(row[8] || "")
      };
      cache.put("user:id:" + userId, JSON.stringify(user), CONFIG.CACHE_TTL_SECONDS);
      cache.put("user:email:" + email, JSON.stringify(user), CONFIG.CACHE_TTL_SECONDS);
      return jsonResponse({ ok: true, data: user });
    }
  }

  return jsonResponse({ ok: true, data: null });
}

function handleCreateUser(payload) {
  var email = String(payload.email || "").trim().toLowerCase();
  var passwordHash = String(payload.passwordHash || "");
  var passwordSalt = String(payload.passwordSalt || "");
  var displayName = String(payload.displayName || email.split("@")[0] || "Learner");

  if (!email || !passwordHash || !passwordSalt) {
    return jsonResponse({ ok: false, error: "Email, passwordHash, dan passwordSalt wajib diisi." });
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.ACCOUNTS, [
    "user_id", "email", "password_hash", "password_salt", "display_name", "status", "created_at", "updated_at", "last_login_at"
  ]);

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || "").trim().toLowerCase() === email) {
      return jsonResponse({ ok: false, error: "Email sudah terdaftar. Silakan masuk." });
    }
  }

  var now = new Date().toISOString();
  var userId = Utilities.getUuid();
  var newRow = [
    userId,
    email,
    passwordHash,
    passwordSalt,
    displayName,
    "active",
    now,
    now,
    now
  ];

  sheet.appendRow(newRow);

  var created = {
    userId: userId,
    id: userId,
    email: email,
    passwordHash: passwordHash,
    passwordSalt: passwordSalt,
    displayName: displayName,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  };

  var cache = CacheService.getScriptCache();
  cache.put("user:email:" + email, JSON.stringify(created), CONFIG.CACHE_TTL_SECONDS);
  cache.put("user:id:" + userId, JSON.stringify(created), CONFIG.CACHE_TTL_SECONDS);

  return jsonResponse({ ok: true, data: created });
}

function handleCollectionsList(payload) {
  var collectionName = String(payload.collection || "lists").trim();
  var userId = String(payload.userId || "").trim();

  if (!userId) {
    return jsonResponse({ ok: false, error: "userId wajib diisi." });
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.COLLECTIONS, [
    "collection", "record_id", "user_id", "updated_at", "payload"
  ]);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ ok: true, data: { records: [] } });
  }

  var matchingRecords = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowCol = String(row[0] || "");
    var rowId = String(row[1] || "");
    var rowUser = String(row[2] || "");
    var rowUpdated = String(row[3] || "");
    var rawPayload = String(row[4] || "");

    if (rowUser === userId && (!collectionName || rowCol === collectionName)) {
      var parsedData = {};
      try {
        parsedData = JSON.parse(rawPayload);
      } catch (_) {
        parsedData = { payload: rawPayload };
      }
      matchingRecords.push({
        id: rowId,
        listId: rowId,
        collection: rowCol,
        userId: rowUser,
        updatedAt: rowUpdated,
        data: parsedData
      });
    }
  }

  return jsonResponse({ ok: true, data: { records: matchingRecords } });
}

function handleCollectionsUpsertBatch(payload) {
  var collectionName = String(payload.collection || "lists").trim();
  var userId = String(payload.userId || "").trim();
  var records = payload.records;

  if (!userId || !Array.isArray(records)) {
    return jsonResponse({ ok: false, error: "userId dan records array wajib diisi." });
  }

  if (records.length === 0) {
    return jsonResponse({ ok: true, data: { updated: 0 } });
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.COLLECTIONS, [
    "collection", "record_id", "user_id", "updated_at", "payload"
  ]);

  var data = sheet.getDataRange().getValues();
  var rowIndexById = {};

  // Build row index map for this user
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[2] || "") === userId && String(row[0] || "") === collectionName) {
      rowIndexById[String(row[1] || "")] = i + 1; // 1-based sheet row number
    }
  }

  var now = new Date().toISOString();
  var appendRows = [];

  for (var r = 0; r < records.length; r++) {
    var item = records[r];
    if (!item) continue;
    var recordId = String(item.id || item.record_id || item.listId || "");
    if (!recordId) continue;

    var recordPayload = JSON.stringify(item.data !== undefined ? item.data : item);
    var targetRow = rowIndexById[recordId];

    if (targetRow) {
      // In-place batch row update
      sheet.getRange(targetRow, 1, 1, 5).setValues([[
        collectionName,
        recordId,
        userId,
        now,
        recordPayload
      ]]);
    } else {
      // Append row
      appendRows.push([
        collectionName,
        recordId,
        userId,
        now,
        recordPayload
      ]);
      // Update local index so subsequent items with same ID in same batch update rather than double-append
      rowIndexById[recordId] = data.length + appendRows.length;
    }
  }

  if (appendRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appendRows.length, 5).setValues(appendRows);
  }

  return jsonResponse({ ok: true, data: { updated: records.length } });
}

function handleProgressGet(payload) {
  var userId = String(payload.userId || "").trim();
  if (!userId) {
    return jsonResponse({ ok: false, error: "userId wajib diisi." });
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.STATES, [
    "user_id", "updated_at", "part_count"
  ]);

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0] || "") === userId) {
      var updatedAt = String(row[1] || "");
      var partCount = Number(row[2] || 0);
      var parts = [];
      for (var p = 3; p < 3 + partCount; p++) {
        parts.push(String(row[p] || ""));
      }
      return jsonResponse({
        ok: true,
        data: {
          userId: userId,
          updatedAt: updatedAt,
          partCount: partCount,
          payload: parts.join("")
        }
      });
    }
  }

  return jsonResponse({ ok: true, data: null });
}

function handleProgressSave(payload) {
  var userId = String(payload.userId || "").trim();
  var packed = String(payload.payload || "");
  var updatedAt = String(payload.updatedAt || new Date().toISOString());

  if (!userId || !packed) {
    return jsonResponse({ ok: false, error: "userId dan payload wajib diisi." });
  }

  var sheet = getOrCreateSheet(CONFIG.SHEETS.STATES, [
    "user_id", "updated_at", "part_count"
  ]);

  var chunkSize = 40000;
  var parts = [];
  for (var offset = 0; offset < packed.length; offset += chunkSize) {
    parts.push(packed.substring(offset, offset + chunkSize));
  }

  var rowValues = [userId, updatedAt, parts.length].concat(parts);

  var data = sheet.getDataRange().getValues();
  var existingRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || "") === userId) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow > 0) {
    // Clear old row values first if part count shrank
    sheet.getRange(existingRow, 1, 1, sheet.getLastColumn()).clearContent();
    sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return jsonResponse({ ok: true, data: { saved: true, parts: parts.length, updatedAt: updatedAt } });
}

// ==========================================
// SPREADSHEET & UTILITY HELPERS
// ==========================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(sheetName, defaultHeaders) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length) {
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getScriptApiKey() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty("SINAI_API_KEY");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

