document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Fade-in ligero al entrar en pantalla.
  const targets = document.querySelectorAll(
    ".section-heading, .project, .skill, .contact-list a, .hero-intro"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal", "visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    targets.forEach(el => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  }

  // Evita que un navegador antiguo fuerce comportamientos raros al cargar con #hash.
  if (window.location.hash) {
    setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }
});
