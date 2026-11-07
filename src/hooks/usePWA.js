import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";
import { useAuth } from "./useAuth.jsx";
import {
  DEFAULT_REMINDER_CONFIG,
  getReminderStorageKey,
  getWibDateTimeParts,
  normalizeReminderConfig,
  reminderConfigFromServerSettings,
  reminderConfigToServerSettings
} from "../lib/reminderConfig.js";

const PWAContext = createContext(null);

function readReminderConfig(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return normalizeReminderConfig(JSON.parse(saved));
  } catch (error) {
    console.warn("[PWA] Preferensi pengingat lokal tidak dapat dibaca.");
  }
  return { ...DEFAULT_REMINDER_CONFIG };
}

function writeReminderConfig(storageKey, value) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(normalizeReminderConfig(value)));
  } catch (error) {
    console.warn("[PWA] Preferensi pengingat lokal tidak dapat disimpan.");
  }
}

export function PWAProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const storageKey = getReminderStorageKey(isAuthenticated ? user?.id : null);
  const lastReminderSlotKey = storageKey + "_last_slot";

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

  const [reminderConfig, setReminderConfig] = useState(() => readReminderConfig(storageKey));

  // Keep local preferences separated between accounts and anonymous browsing.
  useEffect(() => {
    let active = true;
    const localConfig = readReminderConfig(storageKey);
    setReminderConfig(localConfig);

    if (!isAuthenticated) return () => { active = false; };

    api.getSettings()
      .then((res) => {
        const settings = res?.data?.settings;
        if (!active || !res?.success || !settings) return;
        const remoteConfig = reminderConfigFromServerSettings(settings);
        setReminderConfig(remoteConfig);
        writeReminderConfig(storageKey, remoteConfig);
      })
      .catch((error) => {
        console.warn("[PWA] Gagal memuat preferensi pengingat akun.");
      });

    return () => { active = false; };
  }, [isAuthenticated, storageKey]);

  // 1. Register Service Worker on Mount.
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => setSwRegistration(reg))
      .catch(() => console.warn("[PWA] Service Worker gagal didaftarkan."));

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
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

  // 2. Prompt PWA Installation.
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

  // 3. Dismiss Active In-App Floating Reminder.
  const dismissInAppReminder = useCallback(() => {
    setActiveInAppReminder(null);
  }, []);

  // 4. Trigger an immediate system notification and an in-app banner.
  // This function is called only while the application page is active.
  const triggerReminder = useCallback(({ title, body, url = "/belajar/missions" } = {}) => {
    const notifTitle = title || "Waktunya Belajar SinauEnglish!";
    const notifBody = body || "Selesaikan misi dan review kata hari ini.";

    try {
      if (notificationPermission === "granted" && typeof window !== "undefined") {
        if (swRegistration && "showNotification" in swRegistration) {
          void swRegistration.showNotification(notifTitle, {
            body: notifBody,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/favicon.svg",
            data: { url },
            tag: "sinau-study-reminder"
          }).catch(() => {
            console.warn("[PWA] Browser tidak dapat menampilkan notifikasi sistem.");
          });
        } else if ("Notification" in window) {
          new Notification(notifTitle, {
            body: notifBody,
            icon: "/icons/icon-192x192.png"
          });
        }
      }
    } catch (error) {
      console.warn("[PWA] Notifikasi sistem tidak dapat ditampilkan.");
    }

    setActiveInAppReminder({
      id: Date.now(),
      title: notifTitle,
      body: notifBody,
      url
    });
  }, [notificationPermission, swRegistration]);

  // 5. Reminder schedule is checked only while this application is open.
  // It does not run as a background scheduler after the tab/app is closed.
  useEffect(() => {
    if (!reminderConfig.enabled) return undefined;

    const checkReminderSchedule = () => {
      const { date, time } = getWibDateTimeParts(new Date());
      let lastFiredSlot = null;

      try {
        lastFiredSlot = localStorage.getItem(lastReminderSlotKey);
      } catch (error) {
        return;
      }

      if (
        time === reminderConfig.morningHour &&
        lastFiredSlot !== date + "_morning"
      ) {
        try { localStorage.setItem(lastReminderSlotKey, date + "_morning"); } catch (error) {}
        triggerReminder({
          title: "Pengingat Pagi SinauEnglish",
          body: "Awali harimu dengan belajar dan selesaikan misi hari ini.",
          url: "/belajar/missions"
        });
      } else if (
        time === reminderConfig.eveningHour &&
        lastFiredSlot !== date + "_evening"
      ) {
        try { localStorage.setItem(lastReminderSlotKey, date + "_evening"); } catch (error) {}
        triggerReminder({
          title: "Pengingat Malam SinauEnglish",
          body: "Periksa review yang jatuh tempo sebelum hari berakhir.",
          url: "/belajar/review"
        });
      }
    };

    checkReminderSchedule();
    const intervalId = setInterval(checkReminderSchedule, 20000);
    return () => clearInterval(intervalId);
  }, [reminderConfig, lastReminderSlotKey, triggerReminder]);

  const persistReminderConfig = useCallback(async (nextConfig) => {
    const normalized = normalizeReminderConfig(nextConfig);
    const previous = reminderConfig;

    setReminderConfig(normalized);
    writeReminderConfig(storageKey, normalized);

    if (!isAuthenticated) return { success: true, localOnly: true };

    try {
      const res = await api.updateSettings(reminderConfigToServerSettings(normalized));
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Server belum mengonfirmasi pengaturan.");
      }
      return { success: true, localOnly: false };
    } catch (error) {
      setReminderConfig(previous);
      writeReminderConfig(storageKey, previous);
      return { success: false, error: error.message || "Gagal menyimpan pengaturan pengingat." };
    }
  }, [isAuthenticated, reminderConfig, storageKey]);

  // 6. Request browser notification permission.
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        const result = await persistReminderConfig({
          ...reminderConfig,
          enabled: true
        });
        if (!result.success) {
          console.warn("[PWA] Izin aktif, tetapi preferensi akun gagal disimpan.");
        }
      }

      return permission;
    } catch (error) {
      console.warn("[PWA] Gagal meminta izin notifikasi.");
      return "denied";
    }
  }, [persistReminderConfig, reminderConfig]);

  // 7. Send an immediate notification for the user's manual test.
  const sendTestNotification = useCallback(({ title, body, url = "/belajar/missions" } = {}) => {
    triggerReminder({
      title: title || "Uji Coba Pengingat SinauEnglish",
      body: body || "Ini adalah contoh tampilan pengingat di perangkatmu.",
      url
    });
  }, [triggerReminder]);

  // 8. Update reminder schedule and synchronize it to Neon when signed in.
  const updateReminderConfig = useCallback((newConfig) => {
    return persistReminderConfig({
      ...reminderConfig,
      ...newConfig
    });
  }, [persistReminderConfig, reminderConfig]);

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
    return {
      canInstall: false,
      isInstalled: false,
      notificationPermission: "default",
      reminderConfig: { ...DEFAULT_REMINDER_CONFIG },
      activeInAppReminder: null,
      promptInstall: async () => false,
      requestNotificationPermission: async () => "denied",
      sendTestNotification: () => {},
      triggerReminder: () => {},
      dismissInAppReminder: () => {},
      updateReminderConfig: async () => ({ success: false, error: "Pengaturan PWA tidak tersedia." })
    };
  }
  return context;
}
