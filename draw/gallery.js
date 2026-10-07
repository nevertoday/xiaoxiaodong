/* xxd-draw-001 gallery: still tiles that repaint on hover, and a detail view
 * that paints the chosen work live. Used by draw/index.html and the homepage
 * teaser; `base` is the path from the page to draw/. Each live painting runs
 * in its own player.html document, because p5.brush keeps global state. */
(() => {
  const works = window.DRAW_WORKS || [];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const sourceLabel = (work) => (work.source === "photo" ? "照片" : "文字");

  function player(base, slug) {
    const frame = document.createElement("iframe");
    frame.className = "dw-live";
    frame.title = "正在作画";
    frame.setAttribute("tabindex", "-1");
    frame.src = `${base}player.html?w=${encodeURIComponent(slug)}`;
    return frame;
  }

  // ---- tiles --------------------------------------------------------------
  function tile(base, work, index) {
    return `
      <li class="dw-tile">
        <button class="dw-card" type="button" data-dw-index="${index}" aria-label="查看《${esc(work.title)}》作画过程">
          <span class="dw-frame">
            <img src="${base}stills/${esc(work.slug)}.webp" alt="${esc(work.title)}" width="600" height="600" loading="lazy" decoding="async" />
          </span>
          <span class="dw-cap">
            <span class="dw-title">${esc(work.title)}</span>
            <span class="dw-tag">${sourceLabel(work)}</span>
          </span>
        </button>
      </li>`;
  }

  function attachHover(card, base, work) {
    const frameBox = card.querySelector(".dw-frame");
    let timer = 0;
    let live = null;
    const stop = () => {
      window.clearTimeout(timer);
      if (!live) return;
      const old = live;
      live = null;
      old.classList.remove("is-on");
      window.setTimeout(() => old.remove(), 260);
    };
    card.addEventListener("pointerenter", () => {
      if (!finePointer.matches || reducedMotion.matches) return;
      timer = window.setTimeout(() => {
        live = player(base, work.slug);
        live.setAttribute("aria-hidden", "true");
        live.addEventListener("load", () => live?.classList.add("is-on"), { once: true });
        frameBox.append(live);
      }, 160);
    });
    card.addEventListener("pointerleave", stop);
  }

  // ---- detail view --------------------------------------------------------
  let dialog = null;
  let current = 0;
  let base = "";
  let statusTimer = 0;

  function buildDialog() {
    dialog = document.createElement("dialog");
    dialog.className = "dw-dialog";
    dialog.setAttribute("aria-labelledby", "dw-detail-title");
    dialog.innerHTML = `
      <div class="dw-detail">
        <div class="dw-detail-bar">
          <span class="dw-count" data-dw-count></span>
          <button class="dw-btn dw-close" type="button" data-dw-close aria-label="关闭">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="dw-detail-stage">
          <button class="dw-btn dw-nav dw-prev" type="button" data-dw-step="-1" aria-label="上一幅">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="dw-detail-art">
            <div class="dw-detail-frame" data-dw-stage></div>
            <p class="dw-status" data-dw-status aria-live="polite"></p>
          </div>
          <button class="dw-btn dw-nav dw-next" type="button" data-dw-step="1" aria-label="下一幅">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <div class="dw-detail-text">
          <p class="eyebrow" data-dw-source></p>
          <h2 id="dw-detail-title" data-dw-title></h2>
          <div class="dw-brief" data-dw-brief></div>
          <p class="dw-model" data-dw-model></p>
          <div class="dw-actions">
            <button class="dw-btn dw-text-btn" type="button" data-dw-restart>重画一遍</button>
            <a class="dw-btn dw-text-btn" data-dw-open target="_blank" rel="noopener">单独打开</a>
            <button class="dw-btn dw-text-btn dw-mobile-step" type="button" data-dw-step="-1">上一幅</button>
            <button class="dw-btn dw-text-btn dw-mobile-step" type="button" data-dw-step="1">下一幅</button>
          </div>
        </div>
      </div>`;
    document.body.append(dialog);
    dialog.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target === dialog || target.closest("[data-dw-close]")) dialog.close();
      const step = target.closest("[data-dw-step]");
      if (step) show(current + Number(step.dataset.dwStep));
      if (target.closest("[data-dw-restart]")) {
        const frame = dialog.querySelector(".dw-live");
        try {
          frame?.contentWindow?.xxdDraw?.restart();
        } catch {
          if (frame) frame.src = frame.src;
        }
      }
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") show(current - 1);
      if (event.key === "ArrowRight") show(current + 1);
    });
    dialog.addEventListener("close", () => {
      window.clearInterval(statusTimer);
      dialog.querySelector("[data-dw-stage]").replaceChildren();
      document.documentElement.classList.remove("dw-locked");
      document.querySelector(`[data-dw-index="${current}"]`)?.focus();
    });
  }

  function show(index) {
    current = (index + works.length) % works.length;
    const work = works[current];
    const q = (name) => dialog.querySelector(`[data-dw-${name}]`);
    q("count").textContent = `${String(current + 1).padStart(2, "0")} / ${String(works.length).padStart(2, "0")}`;
    q("source").textContent = work.source === "photo" ? "照片输入" : "文字输入";
    q("title").textContent = work.title;
    if (work.photo) {
      const page = `${work.photo}?w=1200&q=80`;
      q("brief").innerHTML = `
        <p class="dw-label">原照片</p>
        <a class="dw-photo" href="${esc(page)}" target="_blank" rel="noopener noreferrer">
          <img src="${esc(work.photo)}?w=480&q=70&auto=format" alt="${esc(work.title)}的原照片" loading="lazy" />
        </a>
        <p class="dw-credit">照片来自 Unsplash · 命题：把这张照片画成作品</p>`;
    } else if (work.prompt) {
      q("brief").innerHTML = `<p class="dw-label">命题</p><p class="dw-prompt">${esc(work.prompt)}</p>`;
    } else {
      q("brief").innerHTML = "";
    }
    q("model").textContent = work.model ? `由 ${work.model} 独立完成` : "";
    q("open").href = `${base}player.html?w=${encodeURIComponent(work.slug)}`;

    const stage = q("stage");
    const frame = player(base, work.slug);
    frame.title = `《${work.title}》作画过程`;
    frame.addEventListener("load", () => frame.classList.add("is-on"), { once: true });
    stage.replaceChildren(frame);

    const status = q("status");
    status.textContent = "正在准备画笔…";
    window.clearInterval(statusTimer);
    statusTimer = window.setInterval(() => {
      try {
        const text = frame.contentDocument?.getElementById("status")?.textContent;
        if (text && status.textContent !== text) status.textContent = text;
      } catch {
        window.clearInterval(statusTimer);
      }
    }, 200);
  }

  function open(index) {
    if (!dialog) buildDialog();
    document.documentElement.classList.add("dw-locked");
    if (!dialog.open) dialog.showModal();
    show(index);
    dialog.querySelector("[data-dw-close]").focus();
  }

  // ---- mount --------------------------------------------------------------
  function mount(container, options = {}) {
    if (!container || !works.length) return;
    base = options.base ?? "";
    const list = works.slice(0, options.limit ?? works.length);
    container.innerHTML = list.map((work, i) => tile(base, work, i)).join("");
    container.querySelectorAll("[data-dw-index]").forEach((card) => {
      const index = Number(card.dataset.dwIndex);
      attachHover(card, base, works[index]);
      card.addEventListener("click", () => open(index));
    });
    document.querySelectorAll("[data-dw-total]").forEach((el) => {
      el.textContent = String(works.length);
    });
  }

  // <ul data-dw-mount data-dw-base="draw/" data-dw-limit="6"> mounts itself.
  document.querySelectorAll("[data-dw-mount]").forEach((el) => {
    mount(el, { base: el.dataset.dwBase ?? "", limit: el.dataset.dwLimit ? Number(el.dataset.dwLimit) : undefined });
  });

  window.XXDDrawGallery = { mount, open };
})();
