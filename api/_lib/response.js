/**
 * SINAUENGLISH V2 — Standardized API Response Helper
 * 
 * Enforces structured responses across all Vercel Functions:
 * - SUCCESS (200/201)
 * - AUTH_ERROR (401)
 * - VALIDATION_ERROR (400)
 * - RATE_LIMITED (429)
 * - SERVER_ERROR (500)
 */

export function sendJson(res, statusCode, body, headers = {}) {
  // Support both standard Node.js Serverless (res.writeHead/end) and Express/Vercel (res.status().json())
  if (typeof res.status === "function" && typeof res.json === "function") {
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    }
    return res.status(statusCode).json(body);
  }

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  res.end(JSON.stringify(body));
}

export function sendSuccess(res, data = {}, message = null, statusCode = 200, headers = {}) {
  return sendJson(res, statusCode, {
    status: "SUCCESS",
    success: true,
    message,
    data
  }, headers);
}

export function sendAuthError(res, message = "Autentikasi gagal. Silakan masuk kembali.", statusCode = 401) {
  return sendJson(res, statusCode, {
    status: "AUTH_ERROR",
    success: false,
    error: message
  });
}

export function sendValidationError(res, message = "Data tidak valid.", errors = [], statusCode = 400) {
  return sendJson(res, statusCode, {
    status: "VALIDATION_ERROR",
    success: false,
    error: message,
    errors
  });
}

export function sendRateLimitError(res, retryAfterSeconds = 60) {
  return sendJson(res, 429, {
    status: "RATE_LIMITED",
    success: false,
    error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${retryAfterSeconds} detik.`
  }, {
    "Retry-After": String(retryAfterSeconds)
  });
}

export function sendServerError(res, message = "Terjadi kesalahan internal server.", statusCode = 500) {
  return sendJson(res, statusCode, {
    status: "SERVER_ERROR",
    success: false,
    error: message
  });
}

