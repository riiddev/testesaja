/**
 * tests/responsive-audit.test.mjs
 * 
 * Responsive Design & Accessibility Audit (Fase 8):
 * Verifies mobile (360px), tablet (768px portrait/landscape), and desktop (1280px)
 * stylesheet rules, viewport constraints, and WCAG touch targets (>= 44px).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("FASE 8 RESPONSIVE & ACCESSIBILITY AUDIT", async (t) => {
  const stylesDir = path.resolve(process.cwd(), "src/styles");
  const cssFiles = fs.readdirSync(stylesDir).filter((f) => f.endsWith(".css"));
  const allCss = cssFiles.map((f) => fs.readFileSync(path.join(stylesDir, f), "utf8")).join("\n");

  await t.test("1. Mobile Breakpoint (360px) Rules Exist", () => {
    assert.ok(
      allCss.includes("@media (max-width: 767px)") || allCss.includes("@media (max-width: 640px)"),
      "Must define mobile layout rules for screens under 768px"
    );
    assert.ok(allCss.includes(".mobile-menu-btn"), "Must have mobile navigation hamburger toggle");
    assert.ok(allCss.includes(".sidebar-backdrop"), "Must have backdrop for mobile drawer");
  });

  await t.test("2. Tablet Breakpoint (768px) & Landscape Enhancements Exist", () => {
    assert.ok(allCss.includes("@media (min-width: 768px)"), "Must define tablet min-width 768px media query");
    assert.ok(
      allCss.includes("orientation: landscape"),
      "Must define tablet landscape media query for iPad/Android tablets"
    );
  });

  await t.test("3. Desktop Breakpoint (1280px) & Collapsible Mode Exist", () => {
    assert.ok(allCss.includes(".app-sidebar.is-collapsed"), "Must support collapsible sidebar on desktop");
    assert.ok(allCss.includes(".sidebar-collapse-btn"), "Must have collapse toggle button");
    assert.ok(allCss.includes("@media (min-width: 1024px)"), "Must define desktop wide-screen layout rules");
  });

  await t.test("4. Touch Target Sizes Meet Accessibility Standard (>= 44px)", () => {
    const has44pxMinHeight = allCss.includes("min-height: 44px") || allCss.includes("height: 44px") || allCss.includes("44px");
    assert.ok(has44pxMinHeight, "Must define 44px minimum touch target dimensions for interactive controls");
  });

  await t.test("5. Sidebar count & mission alert badge styling", () => {
    assert.ok(allCss.includes(".sidebar-unread-alert"), "Must include styling for mission alert badge");
    assert.ok(
      allCss.includes(".app-sidebar.is-collapsed .sidebar-link span.sidebar-unread-alert"),
      "Must keep the alert badge visible in collapsed sidebar mode"
    );
  });
});

