/**
 * Intelligence Designed To Evolve — Main JavaScript
 */

document.addEventListener("DOMContentLoaded", () => {
  initCountUp();
  initMobileMenu();
});

/**
 * 1. Count-Up Stats Animation
 * Uses easeOutCubic, stagger start delays, and IntersectionObserver (threshold: 0.25).
 */
function initCountUp() {
  const statElements = document.querySelectorAll(".stat-num");
  if (!statElements.length) return;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateValue = (el, target, decimals, duration, delay) => {
    setTimeout(() => {
      let startTime = null;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const current = easedProgress * target;

        el.textContent = current.toFixed(decimals);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toFixed(decimals);
        }
      };

      requestAnimationFrame(step);
    }, delay);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          statElements.forEach((el, index) => {
            const target = parseFloat(el.getAttribute("data-target") || "0");
            const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
            const duration = parseInt(el.getAttribute("data-duration") || `${1500 + index * 80}`, 10);
            const delay = parseInt(el.getAttribute("data-delay") || `${480 + index * 90}`, 10);

            animateValue(el, target, decimals, duration, delay);
          });
          obs.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );

  const statsContainer = document.querySelector(".stats");
  if (statsContainer) {
    observer.observe(statsContainer);
  }
}

/**
 * 2. Mobile Menu & Sheet Interactions
 */
function initMobileMenu() {
  const burgerBtn = document.getElementById("burgerBtn");
  const mobileSheet = document.getElementById("mobileSheet");
  const menuOverlay = document.getElementById("menuOverlay");

  if (!burgerBtn || !mobileSheet || !menuOverlay) return;

  const openMenu = () => {
    burgerBtn.setAttribute("aria-expanded", "true");
    mobileSheet.removeAttribute("hidden");
    menuOverlay.removeAttribute("hidden");
    document.body.classList.add("menu-open");
  };

  const closeMenu = () => {
    burgerBtn.setAttribute("aria-expanded", "false");
    mobileSheet.setAttribute("hidden", "");
    menuOverlay.setAttribute("hidden", "");
    document.body.classList.remove("menu-open");
  };

  const toggleMenu = () => {
    const isOpen = burgerBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  burgerBtn.addEventListener("click", toggleMenu);
  menuOverlay.addEventListener("click", closeMenu);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burgerBtn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  // Close when clicking any menu links
  const menuLinks = mobileSheet.querySelectorAll(".mobile-link, .mobile-sign-in");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Close on resize if wider than 720px
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && burgerBtn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });
}
