import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

const WorkspacePage = lazy(() =>
  import("../pages/WorkspacePage.jsx").then((m) => ({ default: m.WorkspacePage }))
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage.jsx").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("../pages/RegisterPage.jsx").then((m) => ({ default: m.RegisterPage }))
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage.jsx").then((m) => ({ default: m.NotFoundPage }))
);

function PageLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "var(--color-bg-base)"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            width: "36px",
            height: "36px",
            border: "3px solid var(--border-color)",
            borderRightColor: "var(--color-accent-gold)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "var(--space-3)"
          }}
        />
        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Memuat Modul SinauEnglish...
        </p>
      </div>
    </div>
  );
}

/**
 * Route guard requiring registered account to access learning features.
 * Unauthenticated visitors are redirected to the registration page.
 */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/daftar" state={{ from: location }} replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/belajar"
          element={
            <RequireAuth>
              <WorkspacePage />
            </RequireAuth>
          }
        />
        <Route
          path="/belajar/:view"
          element={
            <RequireAuth>
              <WorkspacePage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/daftar" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
