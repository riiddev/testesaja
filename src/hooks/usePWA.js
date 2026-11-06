import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";
import { useAuth } from "./useAuth.jsx";

const SETTINGS_PWA_KEY = "sinau_pwa_settings";
const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [activeInAppReminder, setActiveInAppReminder] = useState(null);

  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const [reminderConfig, setReminderConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_PWA_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: false,
      morningHour: "08:00",
      eveningHour: "19:00"
    };
  });

  // 1. Register Service Worker on Mount
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);
      })
      .catch((err) => {
        console.warn("[PWA] Service Worker gagal didaftarkan:", err);
      });

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 2. Prompt PWA Installation
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);

    if (outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  // 3. Dismiss Active In-App Floating Reminder
  const dismissInAppReminder = useCallback(() => {
    setActiveInAppReminder(null);
  }, []);

  // 4. Trigger Reminder Dual Channel (System Notification + In-App Top Floating Banner)
  const triggerReminder = useCallback(({ title, body, url = "/belajar/missions" } = {}) => {
    const notifTitle = title || "Waktunya Belajar SinauEnglish!";
    const notifBody = body || "3 misi harian menunggumu hari ini. Jaga streak dan raih Sinau Coin!";

    // A. Send system notification if permitted
    try {
      if (notificationPermission === "granted") {
        if (swRegistration && "showNotification" in swRegistration) {
          swRegistration.showNotification(notifTitle, {
            body: notifBody,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/favicon.svg",
            data: { url },
            tag: "sinau-study-reminder"
          });
        } else if ("Notification" in window) {
          new Notification(notifTitle, {
            body: notifBody,
            icon: "/icons/icon-192x192.png"
          });
        }
      }
    } catch (err) {
      console.warn("[PWA] System notification error:", err);
    }

    // B. Trigger in-app top floating banner (melayang masuk di atas layar)
    setActiveInAppReminder({
      id: Date.now(),
      title: notifTitle,
      body: notifBody,
      url
    });
  }, [notificationPermission, swRegistration]);

  // 5. Background / Foreground Timer Tick Check for Scheduled Reminders
  useEffect(() => {
    if (!reminderConfig.enabled) return;

    const checkReminderSchedule = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentHHMM = `${hh}:${mm}`;
      const todayDate = now.toISOString().slice(0, 10);

      const lastFiredSlot = localStorage.getItem("sinau_last_reminder_slot");

      if (currentHHMM === reminderConfig.morningHour && lastFiredSlot !== `${todayDate}_morning`) {
        localStorage.setItem("sinau_last_reminder_slot", `${todayDate}_morning`);
        triggerReminder({
          title: "Pengingat Pagi SinauEnglish",
          body: "Awali harimu dengan kosakata baru dan selesaikan misi harianmu!",
          url: "/belajar/missions"
        });
      } else if (currentHHMM === reminderConfig.eveningHour && lastFiredSlot !== `${todayDate}_evening`) {
        localStorage.setItem("sinau_last_reminder_slot", `${todayDate}_evening`);
        triggerReminder({
          title: "Amankan Streak Belajarmu Malam Ini",
          body: "Hari ini hampir selesai. Review kata yang jatuh tempo agar ingatanmu tetap tajam!",
          url: "/belajar/review"
        });
      }
    };

    // Run immediate check
    checkReminderSchedule();

    // Check every 20 seconds
    const intervalId = setInterval(checkReminderSchedule, 20000);
    return () => clearInterval(intervalId);
  }, [reminderConfig, triggerReminder]);

  // 6. Request Notification Permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Browser ini belum mendukung fitur Web Notification.");
      return "unsupported";
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);

      if (perm === "granted") {
        setReminderConfig((prev) => {
          const next = { ...prev, enabled: true };
          localStorage.setItem(SETTINGS_PWA_KEY, JSON.stringify(next));
          return next;
        });

        if (isAuthenticated) {
          api.updateSettings({
            notifications_enabled: true,
            reminder_morning: reminderConfig.morningHour,
            reminder_evening: reminderConfig.eveningHour
          }).catch(() => {});
        }
      }

      return perm;
    } catch (err) {
      console.warn("[PWA] Gagal meminta izin notifikasi:", err);
      return "denied";
    }
  }, [isAuthenticated, reminderConfig]);

  // 7. Send Immediate Test Notification (triggers both system and in-app banner)
  const sendTestNotification = useCallback(({ title, body, url = "/belajar/missions" } = {}) => {
    triggerReminder({
      title: title || "Uji Coba Pengingat SinauEnglish",
      body: body || "Notifikasi pengingat belajar berhasil aktif! Ini contoh tampilan pengingat di ponselmu.",
      url
    });
  }, [triggerReminder]);

  // 8. Update Reminder Config
  const updateReminderConfig = useCallback((newConfig) => {
    setReminderConfig((prev) => {
      const next = { ...prev, ...newConfig };
      localStorage.setItem(SETTINGS_PWA_KEY, JSON.stringify(next));
      return next;
    });

    if (isAuthenticated) {
      api.updateSettings({
        notifications_enabled: newConfig.enabled !== undefined ? newConfig.enabled : reminderConfig.enabled,
        reminder_morning: newConfig.morningHour || reminderConfig.morningHour,
        reminder_evening: newConfig.eveningHour || reminderConfig.eveningHour
      }).catch(() => {});
    }
  }, [isAuthenticated, reminderConfig]);

  const value = {
    canInstall,
    isInstalled,
    notificationPermission,
    reminderConfig,
    activeInAppReminder,
    promptInstall,
    requestNotificationPermission,
    sendTestNotification,
    triggerReminder,
    dismissInAppReminder,
    updateReminderConfig
  };

  return React.createElement(PWAContext.Provider, { value }, children);
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    // Graceful fallback for isolated testing
    return {
      canInstall: false,
      isInstalled: false,
      notificationPermission: "default",
      reminderConfig: { enabled: false, morningHour: "08:00", eveningHour: "19:00" },
      activeInAppReminder: null,
      promptInstall: async () => false,
      requestNotificationPermission: async () => "denied",
      sendTestNotification: () => {},
      triggerReminder: () => {},
      dismissInAppReminder: () => {},
      updateReminderConfig: () => {}
    };
  }
  return context;
}
