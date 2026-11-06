import React from "react";
import { Navbar } from "../components/layout/Navbar.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { RegisterForm } from "../features/auth/RegisterForm.jsx";

export function RegisterPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "var(--space-12) var(--space-4)" }}>
        <RegisterForm />
      </main>
      <Footer />
    </div>
  );
}

