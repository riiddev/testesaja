/**
 * SINAUENGLISH V2 — Standardized API Error Classes
 */

export class ApiError extends Error {
  constructor(message, status = "SERVER_ERROR", statusCode = 500, details = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthError extends ApiError {
  constructor(message = "Sesi telah berakhir atau tidak valid. Silakan masuk kembali.") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Data tidak valid.", details = []) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Gagal terhubung ke server. Periksa koneksi internet Anda.") {
    super(message, "NETWORK_ERROR", 0);
    this.name = "NetworkError";
  }
}

