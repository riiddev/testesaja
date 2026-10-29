import { randomUUID } from "node:crypto";
import { appendAccount, assertSheetsConfigured, ensureSheetsReady, findAccountByEmail, findAccountById, updateAccount } from "./_lib/sheets";
import { bearerToken, hashPassword, issueSession, verifyPassword, verifyToken } from "./_lib/security";

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: any;
};
type ResponseLike = {
  status(code: number): ResponseLike;
  setHeader(name: string, value: string): void;
  json(body: any): void;
  end(): void;
};

function queryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}
function sendError(res: ResponseLike, status: number, message: string): void {
  res.status(status).json({ message });
}
function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST" && req.method !== "GET") {
    sendError(res, 405, "Metode permintaan tidak didukung.");
    return;
  }
  const action = queryValue(req.query?.action);
  try {
    assertSheetsConfigured();
    if (action === "status") {
      await ensureSheetsReady();
      res.status(200).json({ ready: true, provider: "google-sheets" });
      return;
    }
    if (action === "recover") {
      sendError(res, 501, "Pemulihan kata sandi melalui email belum tersedia. Hubungi admin SinauuEnglish; jangan membuat akun baru karena progres akun lama tetap tersimpan.");
      return;
    }
    if (action === "signup") {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      if (!emailIsValid(email)) { sendError(res, 400, "Masukkan alamat email yang valid."); return; }
      if (password.length < 8 || password.length > 256) { sendError(res, 400, "Kata sandi harus berisi 8–256 karakter."); return; }
      const existing = await findAccountByEmail(email);
      if (existing) { sendError(res, 409, "Email ini sudah terdaftar. Silakan masuk."); return; }
      const id = randomUUID();
      const now = new Date().toISOString();
      await appendAccount([id, email, hashPassword(password), now, now]);
      res.status(201).json(issueSession({ id, email }));
      return;
    }
    if (action === "login") {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      if (!emailIsValid(email) || !password) { sendError(res, 400, "Masukkan email dan kata sandi."); return; }
      const account = await findAccountByEmail(email);
      if (!account || !verifyPassword(password, account.passwordHash)) {
        sendError(res, 401, "Email atau kata sandi salah.");
        return;
      }
      res.status(200).json(issueSession({ id: account.id, email: account.email }));
      return;
    }
    if (action === "refresh") {
      const refreshToken = String(req.body?.refresh_token || "");
      const claims = verifyToken(refreshToken, "refresh");
      if (!claims) { sendError(res, 401, "Sesi berakhir. Silakan masuk kembali."); return; }
      const account = await findAccountById(claims.sub);
      if (!account) { sendError(res, 401, "Akun tidak ditemukan. Silakan masuk kembali."); return; }
      res.status(200).json(issueSession({ id: account.id, email: account.email }));
      return;
    }
    if (action === "me" || action === "change-password" || action === "logout") {
      const token = bearerToken(req.headers.authorization);
      const claims = verifyToken(token, "access");
      if (!claims) { sendError(res, 401, "Sesi berakhir. Silakan masuk kembali."); return; }
      if (action === "me") {
        res.status(200).json({ id: claims.sub, email: claims.email });
        return;
      }
      if (action === "logout") {
        res.status(200).json({ ok: true });
        return;
      }
      const password = String(req.body?.password || "");
      if (password.length < 8 || password.length > 256) { sendError(res, 400, "Kata sandi harus berisi 8–256 karakter."); return; }
      const current = await findAccountById(claims.sub);
      if (!current) { sendError(res, 404, "Akun tidak ditemukan."); return; }
      const updatedAt = new Date().toISOString();
      await updateAccount(current.rowNumber, [current.id, current.email, hashPassword(password), current.createdAt, updatedAt]);
      res.status(200).json({ id: current.id, email: current.email });
      return;
    }
    sendError(res, 400, "Aksi akun tidak dikenal.");
  } catch (error) {
    sendError(res, 500, error instanceof Error ? error.message : "Layanan akun sedang tidak tersedia.");
  }
}
