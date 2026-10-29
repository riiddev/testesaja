(() => {
  "use strict";
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const notice = document.getElementById("auth-notice");
  const title = document.getElementById("auth-title");
  const description = document.getElementById("auth-description");
  const signInForm = document.getElementById("signin-form");
  const signUpForm = document.getElementById("signup-form");
  const sessionKey = "sinauu-cloud-session-v1";
  const defaultNext = "/belajar.html";
  const sunIcon = '<svg class="sun-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2m14.7-6.7-1.4 1.4M6.2 17.8l-1.4 1.4m13 0-1.4-1.4M6.2 6.2 4.8 4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const moonIcon = '<svg class="moon-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function savedTheme() {
    try { const t = localStorage.getItem("sinauu-theme"); return t === "dark" || t === "light" ? t : "light"; }
    catch { return "light"; }
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
    if (persist) { try { localStorage.setItem("sinauu-theme", dark ? "dark" : "light"); } catch {} }
  }
  setTheme(savedTheme(), false);
  themeToggle?.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  function showNotice(message) {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
  }
  function clearNotice() {
    if (!notice) return;
    notice.hidden = true;
    notice.textContent = "";
  }
  function safeNextPath() {
    const next = new URLSearchParams(location.search).get("next") || defaultNext;
    return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : defaultNext;
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
      ? "Buat akun untuk menyimpan progres dan melanjutkan belajar dari perangkat lain."
      : "Masuk untuk melanjutkan perjalanan belajarmu.";
    document.title = signUp ? "Buat akun — SinauuEnglish" : "Masuk — SinauuEnglish";
    clearNotice();
  }
  async function requestAccount(action, payload) {
    let response;
    try {
      response = await fetch("/api/account?action=" + encodeURIComponent(action), {
        method: action === "status" ? "GET" : "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch { throw new Error("Layanan akun tidak dapat dijangkau. Coba lagi setelah koneksi tersedia."); }
    const contentType = response.headers.get("content-type") || "";
    let body = {};
    if (contentType.includes("application/json")) body = await response.json().catch(() => ({}));
    else {
      const text = await response.text().catch(() => "");
      if (!response.ok || !text) throw new Error("Layanan akun Google Sheets belum dapat merespons. Coba lagi beberapa saat lagi.");
    }
    if (!response.ok) {
      const message = typeof body.message === "string" ? body.message : "";
      if (response.status === 404) throw new Error("Layanan akun belum tersedia. Periksa koneksi backend Google Sheets.");
      throw new Error(message || "Permintaan akun gagal (" + response.status + "). Progres lokal tidak dihapus.");
    }
    return body;
  }
  function normalizeSession(data) {
    if (!data?.access_token || !data?.refresh_token || !data?.user?.id) {
      throw new Error("Server tidak mengembalikan sesi akun yang valid. Coba lagi.");
    }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Number(data.expires_at || (Math.floor(Date.now() / 1000) + Number(data.expires_in || 7200))),
      expires_in: Number(data.expires_in || 7200),
      token_type: data.token_type || "bearer",
      user: { id: data.user.id, email: data.user.email || "" },
    };
  }
  async function submitAuth(event, mode) {
    event.preventDefault();
    clearNotice();
    const signup = mode === "signup";
    const form = signup ? signUpForm : signInForm;
    const email = String(document.getElementById(signup ? "signup-email" : "signin-email")?.value || "").trim().toLowerCase();
    const passwordField = document.getElementById(signup ? "signup-password" : "signin-password");
    const password = String(passwordField?.value || "");
    const submit = form?.querySelector('button[type="submit"]');
    const idleLabel = signup ? 'Buat akun <span aria-hidden="true">↗</span>' : 'Masuk ke ruang belajar <span aria-hidden="true">↗</span>';
    if (!email || !password) { showNotice("Masukkan email dan kata sandi terlebih dahulu."); return; }
    if (signup) {
      const confirm = document.getElementById("signup-password-confirm");
      if (password.length < 8 || password.length > 128) { showNotice("Kata sandi harus berisi 8–128 karakter."); return; }
      if (password !== String(confirm?.value || "")) {
        confirm?.setCustomValidity("Kata sandi belum sama.");
        confirm?.reportValidity();
        confirm?.addEventListener("input", () => confirm.setCustomValidity(""), { once: true });
        return;
      }
    }
    if (submit) { submit.disabled = true; submit.setAttribute("aria-busy", "true"); submit.textContent = "Memproses…"; }
    try {
      const result = await requestAccount(signup ? "signup" : "login", { email, password });
      const session = normalizeSession(result);
      try { localStorage.setItem(sessionKey, JSON.stringify(session)); }
      catch { throw new Error("Browser tidak mengizinkan penyimpanan sesi. Aktifkan penyimpanan situs lalu coba lagi."); }
      if (passwordField) passwordField.value = "";
      if (signup) document.getElementById("signup-password-confirm").value = "";
      showNotice(signup ? "Akun berhasil dibuat. Menyiapkan ruang belajar dan menyinkronkan progres…" : "Berhasil masuk. Memuat progres akunmu…");
      location.assign(safeNextPath());
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Tidak dapat memproses akun. Coba lagi.");
    } finally {
      if (submit) { submit.disabled = false; submit.removeAttribute("aria-busy"); submit.innerHTML = idleLabel; }
    }
  }
  document.querySelectorAll("[data-mode]").forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode === "signup" ? "signup" : "signin")));
  document.querySelectorAll("[data-toggle-password]").forEach(button => button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.togglePassword);
    if (!input) return;
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("aria-label", visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  }));
  signInForm?.addEventListener("submit", event => void submitAuth(event, "signin"));
  signUpForm?.addEventListener("submit", event => void submitAuth(event, "signup"));
  void requestAccount("status").then(body => {
    if (body.ready !== true) showNotice("Layanan akun belum siap. Data yang kamu isi tidak akan dikirim; coba lagi setelah koneksi diperiksa.");
  }).catch(() => {
    showNotice("Layanan akun sedang tidak tersedia. Data yang kamu isi tidak akan dikirim atau disimpan sampai koneksi kembali.");
  });
})();
