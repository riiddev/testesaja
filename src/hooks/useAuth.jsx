import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getSessionToken, clearSessionToken } from "../services/api.js";

const AuthContext = createContext(null);

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
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          clearSessionToken();
        }
      } catch (err) {
        console.warn("Gagal memvalidasi sesi:", err.message);
        clearSessionToken();
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
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      // Clear any prior cached account data for a clean slate starting strictly from 0
      try {
        localStorage.removeItem("sinau_local_profile");
        localStorage.removeItem("sinau_local_inventory");
        localStorage.removeItem("sinau_story_progress_dev");
        localStorage.removeItem("sinau_habit_read_history");
        localStorage.removeItem("sinau_grammar_history");
        localStorage.removeItem("sinau_srs_records");
        localStorage.removeItem("sinau_avatar_url");
        localStorage.removeItem("sinau_avatar_updated_at");
      } catch (e) {}

      const res = await api.register({ email, password, displayName });
      if (res.success && res.data?.user) {
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
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await api.logout();
    } finally {
      try {
        localStorage.removeItem("sinau_local_profile");
        localStorage.removeItem("sinau_local_inventory");
        localStorage.removeItem("sinau_story_progress_dev");
        localStorage.removeItem("sinau_habit_read_history");
        localStorage.removeItem("sinau_grammar_history");
        localStorage.removeItem("sinau_srs_records");
        localStorage.removeItem("sinau_avatar_url");
        localStorage.removeItem("sinau_avatar_updated_at");
      } catch (e) {}
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

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

