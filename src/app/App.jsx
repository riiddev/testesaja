import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth.jsx";
import { PWAProvider, usePWA } from "../hooks/usePWA.js";
import { StudyReminderBanner } from "../components/common/StudyReminderBanner.jsx";
import { AppRoutes } from "./routes.jsx";

function GlobalReminderRenderer() {
  const { activeInAppReminder, dismissInAppReminder } = usePWA();
  return (
    <StudyReminderBanner
      reminder={activeInAppReminder}
      onDismiss={dismissInAppReminder}
    />
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PWAProvider>
          <GlobalReminderRenderer />
          <AppRoutes />
        </PWAProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
