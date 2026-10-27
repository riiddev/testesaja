(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js-enabled");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const primaryNav = document.getElementById("primary-nav");
  const toast = document.getElementById("toast");

  const sunIcon = '<svg class="sun-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2m16.22-6.72-1.42 1.42M6.7 17.3l-1.42 1.42m13.44 0-1.42-1.42M6.7 6.7 5.28 5.28" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const moonIcon = '<svg class="moon-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function readSavedTheme() {
    try {
      const saved = window.localStorage.getItem("sinauu-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (error) {
      // Private browsing or storage restrictions should not block the page.
    }
    return null;
  }

  function setTheme(theme, persist = true) {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap");
      themeToggle.innerHTML = isDark ? moonIcon : sunIcon;
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", isDark ? "#1f2822" : "#f8f8f2");
    if (persist) {
      try {
        window.localStorage.setItem("sinauu-theme", isDark ? "dark" : "light");
      } catch (error) {
        // Theme still works for this visit if storage is unavailable.
      }
    }
  }

  setTheme(readSavedTheme() || "light", false);
  themeToggle?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  function closeMenu() {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka navigasi");
    primaryNav.classList.remove("is-open");
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Buka navigasi" : "Tutup navigasi");
    primaryNav?.classList.toggle("is-open", !isOpen);
  });

  primaryNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  const speakButton = document.getElementById("speak-word");
  speakButton?.addEventListener("click", () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      showToast("Pemutaran suara belum didukung oleh browser ini.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("notice");
    utterance.lang = "en-GB";
    utterance.rate = 0.82;
    utterance.onerror = () => showToast("Suara tidak dapat diputar. Coba periksa pengaturan browser.");
    window.speechSynthesis.speak(utterance);
    showToast("Memutar pengucapan bahasa Inggris.");
  });

  const quizOptions = Array.from(document.querySelectorAll(".quiz-option"));
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizReset = document.getElementById("quiz-reset");

  function resetQuiz() {
    quizOptions.forEach((option) => {
      option.disabled = false;
      option.classList.remove("is-correct", "is-incorrect");
    });
    if (quizFeedback) {
      quizFeedback.hidden = true;
      quizFeedback.classList.remove("feedback-wrong");
      quizFeedback.textContent = "";
    }
    if (quizReset) quizReset.hidden = true;
  }

  quizOptions.forEach((option) => {
    option.addEventListener("click", () => {
      if (option.disabled) return;
      const isCorrect = option.dataset.answer === "correct";
      quizOptions.forEach((item) => {
        item.disabled = true;
        if (item.dataset.answer === "correct") item.classList.add("is-correct");
      });
      if (!isCorrect) option.classList.add("is-incorrect");
      if (quizFeedback) {
        quizFeedback.hidden = false;
        quizFeedback.classList.toggle("feedback-wrong", !isCorrect);
        quizFeedback.textContent = isCorrect
          ? "Benar! Dalam present simple, he, she, dan it memakai verb dengan akhiran -s/-es. Jadi, “She goes” adalah bentuk yang tepat."
          : "Belum tepat. Untuk subjek “she” dalam present simple, kata kerja perlu akhiran -s/-es. Jawaban yang benar: “She goes to school by bus.”";
      }
      if (quizReset) quizReset.hidden = false;
    });
  });
  quizReset?.addEventListener("click", resetQuiz);

  const year = document.getElementById("current-year");
  if (year) year.textContent = String(new Date().getFullYear());

  // All page interactions are browser-native; no account or server is required.
})();