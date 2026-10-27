(() => {
  "use strict";

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceQuery.matches) return;

  document.documentElement.classList.add("motion-enabled");

  let lenis = null;
  let lenisFrame = 0;
  function startLenis() {
    if (lenis || !window.Lenis || reduceQuery.matches) return;
    try {
      lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true
      });
      window.sinauMotionLenis = lenis;
      const raf = (time) => {
        if (!lenis) return;
        lenis.raf(time);
        lenisFrame = requestAnimationFrame(raf);
      };
      lenisFrame = requestAnimationFrame(raf);
      lenis.on("scroll", requestScrollUpdate);
    } catch (_) {
      // Native scrolling remains available if the optional runtime is unavailable.
    }
  }

  // Load Lenis asynchronously, so a blocked CDN never delays the learning app.
  if (window.Lenis) {
    startLenis();
  } else {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js";
    script.async = true;
    script.onload = startLenis;
    script.onerror = () => {};
    document.head.appendChild(script);
  }

  window.sinauMotionScrollToTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 0.72 });
    else window.scrollTo({ top: 0, behavior: reduceQuery.matches ? "auto" : "smooth" });
  };

  const progress = document.createElement("div");
  progress.className = "motion-scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  document.body.appendChild(progress);
  const progressFill = progress.firstElementChild;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let updateFrame = 0;
  const hero = document.querySelector(".hero");
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual) heroVisual.classList.add("motion-parallax");

  function requestScrollUpdate() {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(updateScrollVisuals);
  }

  function updateScrollVisuals() {
    updateFrame = 0;
    const scrollingElement = document.scrollingElement || document.documentElement;
    const maxScroll = Math.max(1, scrollingElement.scrollHeight - window.innerHeight);
    const amount = clamp((window.scrollY || scrollingElement.scrollTop || 0) / maxScroll, 0, 1);
    if (progressFill) progressFill.style.transform = "scaleX(" + amount.toFixed(4) + ")";

    if (hero && heroVisual) {
      const bounds = hero.getBoundingClientRect();
      const travel = clamp(-bounds.top / Math.max(bounds.height, window.innerHeight), 0, 1);
      heroVisual.style.setProperty("--motion-parallax-y", (travel * 26).toFixed(2) + "px");
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  requestScrollUpdate();

  const landingSelectors = [
    ".hero-copy .eyebrow",
    ".hero-copy h1",
    ".hero-description",
    ".hero-actions",
    ".hero-note",
    ".hero-footnote",
    ".section-intro",
    ".steps-list .step",
    ".curriculum-heading",
    ".level-row",
    ".practice-copy > *",
    ".quiz > *",
    ".site-footer .footer-top > *",
    ".site-footer .footer-bottom > *"
  ];
  const workspaceSelectors = [
    ".view .page-heading",
    ".overview-metrics > *",
    ".section-block",
    ".task-link",
    ".resume-item",
    ".vocab-row",
    ".word-detail",
    ".topic-list-panel",
    ".lesson-panel",
    ".study-card",
    ".review-row",
    ".grammar-progress-row",
    ".history-row",
    ".vocab-toolbar"
  ];
  const selector = (hero ? landingSelectors : workspaceSelectors).join(",");

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
          currentObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" })
    : null;

  function delayFor(element) {
    const rootClass =
      (element.closest(".hero-copy") && ".hero-copy") ||
      (element.closest(".practice-copy") && ".practice-copy") ||
      (element.closest(".steps-list") && ".steps-list") ||
      (element.closest(".level-list") && ".level-list") ||
      (element.closest(".overview-metrics") && ".overview-metrics") ||
      (element.closest(".resume-list") && ".resume-list") ||
      null;
    let siblings = [];
    if (rootClass === ".hero-copy" || rootClass === ".practice-copy") {
      const group = element.closest(rootClass);
      siblings = Array.from(group.children).filter((node) => node.matches(landingSelectors.join(",")));
    } else if (rootClass === ".steps-list") {
      siblings = Array.from(element.closest(rootClass).querySelectorAll(":scope > .step"));
    } else if (rootClass === ".level-list") {
      siblings = Array.from(element.closest(rootClass).querySelectorAll(":scope > .level-row"));
    } else if (rootClass === ".overview-metrics") {
      siblings = Array.from(element.closest(rootClass).children);
    } else if (rootClass === ".resume-list") {
      siblings = Array.from(element.closest(rootClass).querySelectorAll(".resume-item"));
    } else {
      const groupClass = Array.from(element.classList).find((name) =>
        /^(task-link|resume-item|vocab-row|topic-button|review-row|grammar-progress-row|history-row)$/.test(name)
      );
      if (groupClass) {
        siblings = Array.from(element.parentElement ? element.parentElement.children : [])
          .filter((node) => node.classList.contains(groupClass));
      }
    }
    const index = siblings.indexOf(element);
    return index < 0 ? 0 : Math.min(index * 65, 260);
  }

  function mark(element) {
    if (!(element instanceof Element) || !element.matches(selector) || element.classList.contains("motion-item")) return;
    element.classList.add("motion-item");
    element.style.setProperty("--motion-delay", delayFor(element) + "ms");
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-in-view");
  }

  function scan(node) {
    if (!(node instanceof Element || node === document)) return;
    if (node instanceof Element) mark(node);
    node.querySelectorAll?.(selector).forEach(mark);
  }
  scan(document);

  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
      } else if (mutation.type === "attributes" && mutation.target.matches(".view")) {
        scan(mutation.target);
      }
    }
  });
  mutationObserver.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  // Use Lenis for anchor navigation when it is available; otherwise keep native behavior.
  document.addEventListener("click", (event) => {
    if (!lenis || event.defaultPrevented) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    let target;
    try { target = document.querySelector(href); } catch (_) { return; }
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: -18, duration: 1.15 });
  });

  window.addEventListener("pagehide", () => {
    if (lenisFrame) cancelAnimationFrame(lenisFrame);
    if (lenis) lenis.destroy();
    lenis = null;
  }, { once: true });
})();
