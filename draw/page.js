/* draw/index.html: theme toggle, mobile menu, gallery mount. Mirrors the homepage's script.js behaviour. */
(() => {
  const themeColors = { light: "#ffffff", dark: "#151515" };

  function setTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    const nextLabel = normalized === "dark" ? "淡色" : "暗色";
    document.documentElement.dataset.theme = normalized;
    document.querySelector("[data-theme-color]")?.setAttribute("content", themeColors[normalized]);
    const toggle = document.querySelector("[data-theme-toggle]");
    toggle?.setAttribute("aria-pressed", String(normalized === "dark"));
    toggle?.setAttribute("aria-label", `切换到${nextLabel}模式`);
    const label = document.querySelector("[data-theme-label]");
    if (label) label.textContent = nextLabel;
    try {
      localStorage.setItem("theme", normalized);
    } catch {
      // Storage can be unavailable; the page still switches.
    }
  }

  setTheme(document.documentElement.dataset.theme || "light");
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  const header = document.querySelector(".site-header");
  const menu = document.querySelector("[data-menu-toggle]");
  const setMenu = (open) => {
    if (!header || !menu) return;
    header.dataset.navOpen = open ? "true" : "false";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
  };
  setMenu(false);
  menu?.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  document.querySelector("#primary-nav")?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const gallery = window.XXDDrawGallery;

  // The hero repaints on its own once, then on hover; clicking opens the detail view.
  const hero = document.querySelector("[data-draw-hero]");
  if (hero && gallery) {
    const index = Math.max(0, (window.DRAW_WORKS || []).findIndex((work) => work.slug === "cranes"));
    hero.addEventListener("click", () => gallery.open(index));
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const box = hero.querySelector(".dw-frame");
      const live = document.createElement("iframe");
      live.className = "dw-live";
      live.title = "冰湖双鹤作画过程";
      live.setAttribute("aria-hidden", "true");
      live.setAttribute("tabindex", "-1");
      live.loading = "lazy";
      live.src = "player.html?w=cranes";
      live.addEventListener("load", () => live.classList.add("is-on"), { once: true });
      box.append(live);
    }
  }
})();
