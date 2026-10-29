import { appendAccount, assertSheetsConfigured, ensureSheetsReady, findAccountByEmail } from "./_lib/sheets";
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
      res.status(200).json({ ready: true, provider: "google-sheets-apps-script" });
      return;
    }
    if (action === "recover") {
      sendError(res, 501, "Pemulihan kata sandi melalui email belum tersedia. Progres akun lama tetap tersimpan.");
      return;
    }
    if (action === "signup") {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      if (!emailIsValid(email)) { sendError(res, 400, "Masukkan alamat email yang valid."); return; }
      if (password.length < 8 || password.length > 128) { sendError(res, 400, "Kata sandi harus berisi 8–128 karakter."); return; }
      const existing = await findAccountByEmail(email);
      if (existing) { sendError(res, 409, "Email ini sudah terdaftar. Silakan masuk."); return; }
      const credentials = await hashPassword(password);
      const account = await appendAccount({
        email,
        displayName: email.split("@")[0] || email,
        ...credentials,
      });
      res.status(201).json(issueSession({ id: account.id, email: account.email }));
      return;
    }
    if (action === "login") {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      if (!emailIsValid(email) || !password) { sendError(res, 400, "Masukkan email dan kata sandi."); return; }
      const account = await findAccountByEmail(email);
      const valid = Boolean(account && account.status === "active" &&
        await verifyPassword(password, account.passwordHash, account.passwordSalt));
      if (!valid || !account) {
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
      res.status(200).json(issueSession({ id: claims.sub, email: claims.email }));
      return;
    }
    if (action === "me" || action === "logout" || action === "change-password") {
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
      sendError(res, 501, "Perubahan kata sandi otomatis belum tersedia pada versi ini.");
      return;
    }
    sendError(res, 400, "Aksi akun tidak dikenal.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan akun sedang tidak tersedia.";
    const status = /email ini sudah terdaftar/i.test(message) ? 409 : 500;
    sendError(res, status, message);
  }
}
