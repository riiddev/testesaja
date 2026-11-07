import test from "node:test";
import assert from "node:assert/strict";
import { API_ROUTE_PATHS, resolveApiPath } from "../api/router.js";

test("static router resolves explicit Vercel rewrite route parameters", () => {
  assert.equal(
    resolveApiPath({ query: { route: "matching/round" }, url: "/api/router?route=matching/round&level=A1" }),
    "/matching/round"
  );
  assert.equal(
    resolveApiPath({ query: { route: "activity/history" }, url: "/api/router?route=activity/history&limit=10" }),
    "/activity/history"
  );
});

test("catch-all router resolves Vercel wildcard segments", () => {
  assert.equal(
    resolveApiPath({ query: { segments: ["auth", "login"] }, url: "/api/[...segments]" }),
    "/auth/login"
  );
  assert.equal(
    resolveApiPath({ query: { segments: "progress/sync" }, url: "/api/[...segments]" }),
    "/progress/sync"
  );
});

test("catch-all router falls back to the original request URL", () => {
  assert.equal(resolveApiPath({ url: "/api/auth/register?source=web" }), "/auth/register");
  assert.equal(resolveApiPath({ url: "/api/quests/get/" }), "/quests/get");
});

test("all existing API endpoints remain explicitly routable", () => {
  assert.equal(API_ROUTE_PATHS.length, 33);
  assert.equal(new Set(API_ROUTE_PATHS).size, 33);
  for (const route of [
    "/auth/login",
    "/auth/register",
    "/progress/get",
    "/progress/sync",
    "/quests/get",
    "/quests/update",
    "/quests/claim",
    "/economy/buy",
    "/avatar/upload",
    "/story/complete",
    "/matching/round",
    "/widget/summary"
  ]) {
    assert.ok(API_ROUTE_PATHS.includes(route), `Missing route: ${route}`);
  }
});
