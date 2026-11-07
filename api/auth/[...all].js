/**
 * Better Auth Vercel Pages API handler.
 *
 * Body parsing is disabled only for this route so Better Auth can read the
 * original request stream. Existing /login, /logout, /me and /register URLs
 * are delegated to their legacy compatibility handlers.
 */

export const config = {
  api: {
    bodyParser: false
  }
};

const legacyAuthHandlers = {
  "/login": () => import("../_handlers/auth/login.js"),
  "/logout": () => import("../_handlers/auth/logout.js"),
  "/me": () => import("../_handlers/auth/me.js"),
  "/register": () => import("../_handlers/auth/register.js")
};

function getAuthSubpath(req) {
  try {
    const pathname = new URL(req.url || "/api/auth", "http://localhost").pathname;
    const prefix = "/api/auth";
    if (pathname === prefix || pathname === prefix + "/") return "/";
    if (pathname.startsWith(prefix + "/")) return pathname.slice(prefix.length);
  } catch {
    // Fall through to Vercel's parsed catch-all segments.
  }

  const all = req?.query?.all;
  if (Array.isArray(all)) return "/" + all.map(String).join("/");
  if (typeof all === "string" && all) return "/" + all;
  return "/";
}

export default async function authRouter(req, res) {
  const subpath = getAuthSubpath(req);
  const loadLegacyHandler = legacyAuthHandlers[subpath];

  try {
    if (loadLegacyHandler) {
      const routeModule = await loadLegacyHandler();
      return await routeModule.default(req, res);
    }

    const [{ toNodeHandler }, { auth }] = await Promise.all([
      import("better-auth/node"),
      import("../_lib/better-auth.js")
    ]);

    return await toNodeHandler(auth)(req, res);
  } catch (error) {
    // Log the stack in Vercel Runtime Logs, but never expose secrets to the client.
    console.error("[Better Auth route failure]", {
      path: subpath,
      name: error?.name || "Error",
      message: error?.message || "Unknown auth route failure",
      stack: error?.stack || null
    });

    if (res.headersSent) return res.end();
    return res.status(500).json({
      success: false,
      error: "AUTH_HANDLER_FAILED",
      message: "Layanan autentikasi sedang mengalami gangguan. Coba lagi nanti."
    });
  }
}
