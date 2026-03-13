/* TCS NG — main shared script (header, smooth scroll, reveals, map modal) */
(function () {
  ("use strict");

  // ---------- Header scroll state ----------
  function initHeader() {
    const header = document.getElementById("header");
    if (!header) return;

    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      header.classList.toggle("scrolled", y > 8);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  // ---------- Smooth scroll (anchors) ----------
  function initSmoothScroll() {
    document.querySelectorAll("[data-scroll]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
    });
  }

  // ---------- Footer year ----------
  function initYear() {
    const y = new Date().getFullYear();
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(y);
    const yEl = document.getElementById("y");
    if (yEl) yEl.textContent = String(y);
  }

  // ---------- Reveal on scroll ----------
  function initReveals() {
    const ids = ["heroInner", "aboutInner", "contactInner"];
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!targets.length || !("IntersectionObserver" in window)) return;

    const reveal = (el) => el && el.classList.add("visible");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((t) => io.observe(t));
  }

  // ---------- Map modal (Kje smo) ----------
  function initMapModal() {
    const mapModal = document.getElementById("mapModal");
    const mapFrame = document.getElementById("mapFrame");
    if (!mapModal || !mapFrame) return;

    const MAPS_QUERY = encodeURIComponent("Soška cesta 50, Solkan");
    const MAPS_EMBED = `https://www.google.com/maps?q=${MAPS_QUERY}&t=k&z=17&output=embed`;

    function openMap() {
      if (!mapFrame.src) mapFrame.src = MAPS_EMBED;
      mapModal.classList.add("show");
      mapModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeMap() {
      mapModal.classList.remove("show");
      mapModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    document.querySelectorAll("[data-open-map]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openMap();
      });
    });

    mapModal.querySelectorAll("[data-close-map]").forEach((el) => {
      el.addEventListener("click", closeMap);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mapModal.classList.contains("show")) closeMap();
    });
  }

  // ---------- Gravity flyby (only where present) ----------
  function initGravityFlyby() {
    const btn = document.querySelector(".cta-gravity");
    const flyby = document.getElementById("gravityFlyby");
    if (!btn || !flyby) return;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targetHref = btn.getAttribute("href") || "./tcs-gravity.html";

    const riderImg = flyby.querySelector(".gravity-flyby__rider");
    let riderOk = true;
    if (riderImg) {
      riderImg.addEventListener("error", () => (riderOk = false));
    }

    btn.addEventListener("click", (e) => {
      if (reduceMotion) return;
      if (!riderOk) return;

      e.preventDefault();

      flyby.classList.remove("play");
      void flyby.offsetWidth;
      flyby.classList.add("play");
      flyby.setAttribute("aria-hidden", "false");

      const DURATION_MS = 900;
      window.setTimeout(() => {
        window.location.href = targetHref;
      }, DURATION_MS);
    });
  }
  // ---------- Intro animation ----------
  function initIntroAnimation() {
    const intro = document.getElementById("intro-animation");
    if (!intro) return;

    window.addEventListener("load", () => {
      setTimeout(() => {
        intro.style.display = "none";
      }, 3000);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initSmoothScroll();
    initYear();
    initReveals();
    initMapModal();
    initGravityFlyby();
    initIntroAnimation();
  });
})();
