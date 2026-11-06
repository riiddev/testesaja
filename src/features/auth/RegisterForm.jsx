import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { Button } from "../../components/common/Button.jsx";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Silakan isi semua data yang diperlukan.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    const res = await register(email, password, displayName);
    setSubmitting(false);

    if (res.success) {
      const dest = location.state?.from?.pathname || "/belajar";
      navigate(dest, { replace: true });
    } else {
      setErrorMessage(res.error || "Gagal membuat akun.");
    }
  };

  return (
    <div className="card card-tint-sand" style={{ maxWidth: "440px", margin: "0 auto", padding: "var(--space-8)" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>
          Buat Akun Pelajar
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
          Gratis selamanya, tanpa biaya tersembunyi.
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
          <label className="form-label" htmlFor="reg-name">
            Nama Panggilan
          </label>
          <input
            id="reg-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-input"
            placeholder="Contoh: Rian"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">
            Alamat Email
          </label>
          <input
            id="reg-email"
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
          <label className="form-label" htmlFor="reg-password">
            Kata Sandi
          </label>
          <input
            id="reg-password"
            type="password"
            required
            autoComplete="new-password"
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
          Daftar Akun Baru
        </Button>
      </form>

      <div style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
        Sudah memiliki akun?{" "}
        <Link to="/login" style={{ fontWeight: 700, color: "var(--color-accent-navy)", textDecoration: "underline" }}>
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
