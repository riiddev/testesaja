import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { Button } from "../../components/common/Button.jsx";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Silakan isi email dan kata sandi.");
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      const dest = location.state?.from?.pathname || "/belajar";
      navigate(dest, { replace: true });
    } else {
      setErrorMessage(res.error || "Gagal masuk. Periksa email dan password.");
    }
  };

  return (
    <div className="card card-tint-sand" style={{ maxWidth: "440px", margin: "0 auto", padding: "var(--space-8)" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>
          Masuk ke SinauEnglish
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
          Progres dan hafalanmu tersimpan aman dan terintegrasi.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--color-danger-bg)",
            border: "var(--border-sm)",
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            marginBottom: "var(--space-4)"
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Alamat Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="nama@email.com"
          />
        </div>

        <div className="form-group" style={{ marginBottom: "var(--space-6)" }}>
          <label className="form-label" htmlFor="login-password">
            Kata Sandi
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Minimal 6 karakter"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          style={{ width: "100%", marginBottom: "var(--space-4)" }}
        >
          Masuk Sekarang
        </Button>
      </form>

      <div style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
        Belum punya akun?{" "}
        <Link to="/daftar" style={{ fontWeight: 700, color: "var(--color-accent-navy)", textDecoration: "underline" }}>
          Daftar di sini
        </Link>
      </div>
    </div>
  );
}
