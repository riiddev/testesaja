(() => {
  "use strict";
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const notice = document.getElementById("auth-notice");
  const title = document.getElementById("auth-title");
  const description = document.getElementById("auth-description");
  const signInForm = document.getElementById("signin-form");
  const signUpForm = document.getElementById("signup-form");

  const sunIcon = '<svg class="sun-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2m14.7-6.7-1.4 1.4M6.2 17.8l-1.4 1.4m13 0-1.4-1.4M6.2 6.2 4.8 4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const moonIcon = '<svg class="moon-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function savedTheme() {
    try {
      const theme = localStorage.getItem("sinauu-theme");
      return theme === "dark" || theme === "light" ? theme : "light";
    } catch { return "light"; }
  }
  function setTheme(theme, persist = true) {
    const dark = theme === "dark";
    root.dataset.theme = dark ? "dark" : "light";
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(dark));
      themeToggle.setAttribute("aria-label", dark ? "Aktifkan tema terang" : "Aktifkan tema gelap");
      themeToggle.innerHTML = dark ? moonIcon : sunIcon;
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#1f2822" : "#f8f8f2");
    if (persist) {
      try { localStorage.setItem("sinauu-theme", dark ? "dark" : "light"); } catch { /* Theme remains active for this visit. */ }
    }
  }
  setTheme(savedTheme(), false);
  themeToggle?.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  function clearNotice() {
    if (!notice) return;
    notice.hidden = true;
    notice.textContent = "";
  }
  function showNotice(message) {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
  }

  function setMode(mode) {
    const signUp = mode === "signup";
    signInForm.hidden = signUp;
    signUpForm.hidden = !signUp;
    document.querySelectorAll("[data-mode]").forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    title.textContent = signUp ? "Mulai perjalanan belajarmu." : "Selamat datang kembali.";
    description.textContent = signUp
      ? "Buat akun SinauuEnglish. Setelah sistem akun aktif, akun ini akan digunakan untuk masuk dari perangkatmu."
      : "Masuk untuk melanjutkan perjalanan belajarmu.";
    document.title = signUp ? "Buat akun — SinauuEnglish" : "Masuk — SinauuEnglish";
    clearNotice();
  }

  document.querySelectorAll("[data-mode]").forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode === "signup" ? "signup" : "signin"));
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.setAttribute("aria-pressed", String(visible));
      button.setAttribute("aria-label", visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    });
  });

  signInForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    showNotice("Login belum diaktifkan. Koneksi autentikasi Google Sheets akan dibuat pada tahap berikutnya. Data yang kamu isi tidak dikirim atau disimpan.");
  });

  signUpForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.getElementById("signup-password");
    const confirmation = document.getElementById("signup-password-confirm");
    if (password.value !== confirmation.value) {
      confirmation.setCustomValidity("Kata sandi belum sama.");
      confirmation.reportValidity();
      confirmation.addEventListener("input", () => confirmation.setCustomValidity(""), { once: true });
      return;
    }
    showNotice("Pendaftaran belum diaktifkan. Koneksi autentikasi Google Sheets akan dibuat pada tahap berikutnya. Data yang kamu isi tidak dikirim atau disimpan.");
  });
})();
