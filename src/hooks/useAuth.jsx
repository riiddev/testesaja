import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getSessionToken, clearSessionToken } from "../services/api.js";
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
    clearAllUserData(userId).catch(() => {});
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check existing session token on mount
  useEffect(() => {
    async function initSession() {
      const token = getSessionToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          clearSessionToken();
          setUser(null);
        }
      } catch (err) {
        clearSessionToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.data?.user) {
        // Clear prior account cache to avoid cross-tenant contamination
        clearLocalUserCache(user?.id);
        setUser(res.data.user);
        return { success: true };
      }
      throw new Error(res.error || "Gagal masuk.");
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const register = useCallback(async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      // Send registration request first; do NOT wipe local guest data before server confirms
      const res = await api.register({ email, password, displayName });
      if (res.success && res.data?.user) {
        // Server confirmed success: now wipe old local cache for a brand-new clean slate
        clearLocalUserCache(user?.id);
        setUser(res.data.user);
        return { success: true };
      }
      throw new Error(res.error || "Gagal mendaftar.");
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const logout = useCallback(async () => {
    setLoading(true);
    const activeUserId = user?.id;
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
