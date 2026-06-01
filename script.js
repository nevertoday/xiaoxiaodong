const JOIN_URL = "https://wx.zsxq.com/group/15554814142882";
const TOAST_VISIBLE_MS = 1500;
const COPY_CONFIRM_MS = 900;

function showToast(message) {
  const toast = document.querySelector(".toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, TOAST_VISIBLE_MS);
}

function initActions() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy || JOIN_URL;

      try {
        await navigator.clipboard.writeText(value);
        button.classList.add("is-confirmed");
        showToast("已复制加入链接，请在微信中打开");
        window.setTimeout(() => {
          button.classList.remove("is-confirmed");
        }, COPY_CONFIRM_MS);
      } catch {
        showToast(`复制失败，请手动复制链接：${value}`);
      }
    });
  });
}

function initReveals() {
  const items = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!items.length) return;

  document.documentElement.classList.add("motion-ready", "reveal-ready");
  items.forEach((item) => item.classList.add("is-visible"));
}

function initPage() {
  initReveals();
  initActions();
}

if (document.body) {
  initPage();
} else {
  window.addEventListener("DOMContentLoaded", initPage, { once: true });
}
