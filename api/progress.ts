import { assertSheetsConfigured, readProgress, writeProgress, RevisionConflictError, LockBusyError } from "./_lib/sheets";
import { bearerToken, verifyToken } from "./_lib/security";

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
};
type ResponseLike = {
  status(code: number): ResponseLike;
  setHeader(name: string, value: string): void;
  json(body: any): void;
  end(): void;
};

function sendError(res: ResponseLike, status: number, message: string): void {
  res.status(status).json({ message });
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.method !== "POST") {
    sendError(res, 405, "Metode sinkronisasi tidak didukung.");
    return;
  }
  const claims = verifyToken(bearerToken(req.headers.authorization), "access");
  if (!claims) {
    sendError(res, 401, "Masuk kembali untuk melanjutkan sinkronisasi.");
    return;
  }
  try {
    assertSheetsConfigured();
    if (req.method === "GET") {
      const record = await readProgress(claims.sub);
      res.status(200).json(record ? [{
        user_id: claims.sub,
        state: record.state,
        updated_at: record.updatedAt,
        revision: record.revision
      }] : []);
      return;
    }

    const incoming = Array.isArray(req.body) ? req.body[0]?.state : req.body?.state;
    const baseRevision = Array.isArray(req.body) ? req.body[0]?.baseRevision : req.body?.baseRevision;

    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      sendError(res, 400, "Snapshot progres tidak valid.");
      return;
    }
    if (JSON.stringify(incoming).length > 5_000_000) {
      sendError(res, 413, "Snapshot progres terlalu besar.");
      return;
    }

    const result = await writeProgress(claims.sub, incoming, baseRevision);
    res.status(200).json({ ok: true, revision: result.revision, snapshotId: result.snapshotId });
  } catch (error) {
    if (error instanceof RevisionConflictError) {
      res.status(409).json({
        ok: false,
        code: "REVISION_CONFLICT",
        currentRevision: error.currentRevision,
        message: error.message
      });
      return;
    }
    if (error instanceof LockBusyError) {
      res.status(503).json({
        ok: false,
        code: "LOCK_BUSY",
        message: error.message
      });
      return;
    }
    sendError(res, 500, error instanceof Error ? error.message : "Sinkronisasi belum berhasil. Progres lokal tetap tersimpan.");
  }
}

