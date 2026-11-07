/**
 * Single Vercel Serverless Function for the existing SINAUENGLISH API surface.
 *
 * The implementation handlers live under api/_handlers (an internal directory,
 * not a public Vercel route). This keeps every existing /api/... URL while
 * staying within the Vercel Hobby limit of 12 functions per deployment.
 */

const routeLoaders = {
  "/activity/history": () => import("./_handlers/activity/history.js"),
  "/activity/summary": () => import("./_handlers/activity/summary.js"),
  "/auth/login": () => import("./_handlers/auth/login.js"),
  "/auth/logout": () => import("./_handlers/auth/logout.js"),
  "/auth/me": () => import("./_handlers/auth/me.js"),
  "/auth/register": () => import("./_handlers/auth/register.js"),
  "/avatar/delete": () => import("./_handlers/avatar/delete.js"),
  "/avatar/get": () => import("./_handlers/avatar/get.js"),
  "/avatar/upload": () => import("./_handlers/avatar/upload.js"),
  "/economy/buy": () => import("./_handlers/economy/buy.js"),
  "/economy/catalog": () => import("./_handlers/economy/catalog.js"),
  "/economy/equip": () => import("./_handlers/economy/equip.js"),
  "/economy/inventory": () => import("./_handlers/economy/inventory.js"),
  "/grammar/get": () => import("./_handlers/grammar/get.js"),
  "/grammar/save": () => import("./_handlers/grammar/save.js"),
  "/matching/round": () => import("./_handlers/matching/round.js"),
  "/matching/record": () => import("./_handlers/matching/record.js"),
  "/profile/get": () => import("./_handlers/profile/get.js"),
  "/profile/update": () => import("./_handlers/profile/update.js"),
  "/progress/get": () => import("./_handlers/progress/get.js"),
  "/progress/sync": () => import("./_handlers/progress/sync.js"),
  "/quests/claim": () => import("./_handlers/quests/claim.js"),
  "/quests/get": () => import("./_handlers/quests/get.js"),
  "/quests/update": () => import("./_handlers/quests/update.js"),
  "/reading-quiz/record": () => import("./_handlers/reading-quiz/record.js"),
  "/reward/grant": () => import("./_handlers/reward/grant.js"),
  "/settings/get": () => import("./_handlers/settings/get.js"),
  "/settings/update": () => import("./_handlers/settings/update.js"),
  "/story/complete": () => import("./_handlers/story/complete.js"),
  "/story/get": () => import("./_handlers/story/get.js"),
  "/titles/get": () => import("./_handlers/titles/get.js"),
  "/titles/unlock": () => import("./_handlers/titles/unlock.js"),
  "/widget/summary": () => import("./_handlers/widget/summary.js"),
};

export const API_ROUTE_PATHS = Object.freeze(Object.keys(routeLoaders));

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeSegments(segments) {
  const parts = segments
    .map((part) => safeDecode(String(part)))
    .filter((part) => part.length > 0);
  return parts.length ? `/${parts.join("/")}` : "/";
}

/**
 * Resolve the catch-all route from Vercel's dynamic segments first, falling
 * back to the original request URL for local tests and alternate runtimes.
 */
export function resolveApiPath(req) {
  const wildcard = req?.query?.segments;

  if (Array.isArray(wildcard)) return normalizeSegments(wildcard);
  if (typeof wildcard === "string" && wildcard.length) {
    return normalizeSegments(wildcard.split("/"));
  }

  const rawUrl = typeof req?.url === "string" ? req.url : "/";
  let pathname = "/";
  try {
    pathname = new URL(rawUrl, "http://localhost").pathname;
  } catch {
    pathname = rawUrl.split("?")[0] || "/";
  }

  if (pathname === "/api") return "/";
  if (pathname.startsWith("/api/")) pathname = pathname.slice(4);
  return normalizeSegments(pathname.split("/"));
}

export default async function apiRouter(req, res) {
  const routePath = resolveApiPath(req);
  const loadHandler = routeLoaders[routePath];

  if (!loadHandler) {
    return res.status(404).json({
      success: false,
      error: "NOT_FOUND",
      message: "Endpoint API tidak ditemukan."
    });
  }

  const routeModule = await loadHandler();
  const routeHandler = routeModule?.default;

  if (typeof routeHandler !== "function") {
    return res.status(500).json({
      success: false,
      error: "INVALID_HANDLER",
      message: "Handler API tidak tersedia."
    });
  }

  // Delegate the untouched request/response objects so legacy method,
  // cookie, body, status-code and response behavior remains in each handler.
  return await routeHandler(req, res);
}
