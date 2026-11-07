import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setSessionToken, clearSessionToken } from "../services/api.js";
import { authClient } from "../lib/auth-client.js";
import { clearAllUserData } from "../services/outboxDb.js";

const AuthContext = createContext(null);

function clearLocalUserCache(userId = null) {
  try {
    localStorage.removeItem("sinau_local_profile");
    localStorage.removeItem("sinau_local_inventory");
    localStorage.removeItem("sinau_story_progress_dev");
    localStorage.removeItem("sinau_habit_read_history");
    localStorage.removeItem("sinau_grammar_history");
    localStorage.removeItem("sinau_srs_records");
    localStorage.removeItem("sinau_avatar_url");
    localStorage.removeItem("sinau_avatar_updated_at");
  } catch (e) {
    // Ignore storage restrictions
  }

  if (userId) {
    clearAllUserData(userId, { preserveOutbox: true }).catch(() => {});
  }
}

function authErrorMessage(result, fallback) {
  return result?.error?.message ||
    result?.error?.statusText ||
    result?.error?.code ||
    fallback;
}

async function getAppSession() {
  const res = await api.getMe();
  if (!res?.success || !res.data?.user) {
    throw new Error(res?.error || "Sesi tidak ditemukan. Silakan masuk kembali.");
  }

  if (res.data.token) {
    setSessionToken(res.data.token);
  }

  return res.data.user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always ask the server. This supports both a remembered Better Auth cookie
  // and the temporary compatibility token used by existing feature APIs.
  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        const currentUser = await getAppSession();
        if (active) setUser(currentUser);
      } catch {
        clearSessionToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    clearSessionToken();

    try {
      const result = await authClient.signIn.email({
        email: String(email || "").trim().toLowerCase(),
        password,
        rememberMe: true
      });

      if (result?.error) {
        // Keep the previous credential flow available for any legacy account
        // that has not yet created a Better Auth credential record.
        const legacy = await api.login({ email, password });
        if (legacy?.success && legacy.data?.user) {
          clearLocalUserCache(user?.id);
          setUser(legacy.data.user);
          return { success: true };
        }
        throw new Error(authErrorMessage(result, legacy?.error || "Gagal masuk."));
      }

      const currentUser = await getAppSession();
      clearLocalUserCache(user?.id);
      setUser(currentUser);
      return { success: true };
    } catch (err) {
      clearSessionToken();
      const message = err?.message || "Gagal masuk. Periksa email dan kata sandi.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const register = useCallback(async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    clearSessionToken();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(displayName || "").trim();

    try {
      const result = await authClient.signUp.email({
        name: normalizedName,
        email: normalizedEmail,
        password
      });

      if (result?.error) {
        // Transitional compatibility path: Better Auth remains the primary
        // registration flow. If its HTTP endpoint rejects the request, use
        // the existing Vercel registration handler, which creates the same
        // zero-state profile, stats, settings and a hashed legacy session.
        const legacy = await api.register({
          email: normalizedEmail,
          password,
          displayName: normalizedName
        });

        if (legacy?.success && legacy.data?.user && legacy.data?.token) {
          clearLocalUserCache(user?.id);
          setUser(legacy.data.user);
          return { success: true };
        }

        throw new Error(
          legacy?.error ||
          authErrorMessage(result, "Gagal membuat akun. Silakan coba lagi.")
        );
      }

      const currentUser = await getAppSession();
      // Only clear guest/prior-account cache after the server confirms signup.
      clearLocalUserCache(user?.id);
      setUser(currentUser);
      return { success: true };
    } catch (err) {
      clearSessionToken();
      const message = err?.message || "Gagal membuat akun. Silakan coba lagi.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const logout = useCallback(async () => {
    setLoading(true);
    const activeUserId = user?.id;
    try {
      await authClient.signOut();
    } catch (err) {
      // Clear the legacy bridge below even when the Better Auth request fails.
    }

    try {
      await api.logout();
    } finally {
      clearLocalUserCache(activeUserId);
      clearSessionToken();
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, [user?.id]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
