const GITHUB_USER = "nevertoday";
const REPO_SNAPSHOT_URL = "repos.json";
const VIP_PUBLIC_STATS_URL = "https://vip.xiaoxiaodong.ai/api/public-stats";

const fallbackRepos = [
  {
    name: "chinese-traditional-colors",
    description: "中华传统色演示、色卡浏览与颜色知识科普开源项目",
    html_url: "https://github.com/nevertoday/chinese-traditional-colors",
    homepage: "https://nevertoday.github.io/chinese-traditional-colors/",
    language: "JavaScript",
    stargazers_count: 338,
    forks_count: 44,
    pushed_at: new Date().toISOString(),
    topics: [],
  },
];

const state = {
  repos: [],
};

let reposSignature = "";

const themeColors = {
  light: "#ffffff",
  dark: "#151515",
};

const FOOTER_COLOR_SELECTOR = "[data-footer-color]";
const FOOTER_COPIED_MS = 900;
const FOOTER_COPY_TOAST_MS = 1400;
const FOOTER_SPECTRUM_HEIGHTS = [52, 84, 44, 96, 64, 112, 56, 76];

const projectPalette = [
  { name: "墨黑", color: "#111111" },
  { name: "铁灰", color: "#3F3F3F" },
  { name: "中灰", color: "#777777" },
  { name: "石灰", color: "#9A9A9A" },
  { name: "线灰", color: "#B8B8B8" },
  { name: "纸白", color: "#F7F7F7" },
];

const footerColorPalette = [
  { name: "乳白", hex: "#F9F4DC" },
  { name: "杏仁黄", hex: "#F7E8AA" },
  { name: "油菜花黄", hex: "#FBDA41" },
  { name: "桂黄", hex: "#F8C387" },
  { name: "朱砂", hex: "#FF461F" },
  { name: "胭脂", hex: "#9D2933" },
  { name: "海棠红", hex: "#F03752" },
  { name: "酡颜", hex: "#F9906F" },
  { name: "竹青", hex: "#789262" },
  { name: "青葱", hex: "#0AA344" },
  { name: "松花绿", hex: "#BCE672" },
  { name: "湖蓝", hex: "#30DFF3" },
  { name: "天青", hex: "#C3D7DF" },
  { name: "群青", hex: "#177CB0" },
  { name: "靛蓝", hex: "#065279" },
  { name: "雪青", hex: "#B0A4E3" },
  { name: "青莲", hex: "#801DAE" },
  { name: "乌金", hex: "#A78E44" },
  { name: "苍黄", hex: "#806332" },
  { name: "藕荷", hex: "#E4C6D0" },
];

const projectProfiles = {
  "chinese-traditional-colors": {
    kind: "色卡资料库",
    title: "传统色，直接查",
    summary: "做海报、配色、内容图时少试错",
    format: "开源网页",
    intent: "查传统色",
    colorName: "墨黑",
    color: "#111111",
  },
  "zhongguo-traditional-colors": {
    kind: "色卡资料库",
    title: "传统色，直接查",
    summary: "做海报、配色、内容图时少试错",
    format: "开源网页",
    intent: "查传统色",
    colorName: "墨黑",
    color: "#111111",
  },
  nevertoday: {
    kind: "个人主页",
    format: "主页",
    intent: "个人入口",
    colorName: "铁灰",
    color: "#3F3F3F",
  },
  xposter: {
    kind: "发布插件",
    title: "Markdown 直接发布到 X",
    summary: "少复制、少改格式",
    format: "Chrome MV3",
    intent: "把 Markdown 发到 X",
    colorName: "墨黑",
    color: "#111111",
  },
  "100-layout-compositions": {
    kind: "构图参考",
    title: "100 种版式参考",
    summary: "先定结构，再做画面",
    format: "视觉资料",
    intent: "看构图",
    colorName: "中灰",
    color: "#777777",
  },
  "chrome-store-submission": {
    kind: "开源 Skill",
    title: "Chrome 上架资料生成",
    summary: "权限说明、隐私披露、商店文案一次整理",
    format: "提交流程",
    intent: "准备 Chrome 上架材料",
    colorName: "铁灰",
    color: "#3F3F3F",
  },
  "tampermonkey-scripts": {
    kind: "Chrome 插件",
    displayName: "拾图",
    title: "网页图片批量下载插件",
    summary: "悬停拾取图片，侧边栏批量下载原图",
    format: "Chrome MV3",
    intent: "批量下载图片",
    chromeStoreUrl: "",
    colorName: "墨黑",
    color: "#111111",
  },
  image: {
    kind: "图片实验",
    title: "图片实验素材",
    summary: "生成、整理、批处理",
    format: "脚本仓库",
    intent: "做图片实验",
    colorName: "石灰",
    color: "#9A9A9A",
  },
  bootstrap: {
    kind: "早期实验",
    format: "前端存档",
    intent: "早期前端练习",
    colorName: "线灰",
    color: "#B8B8B8",
  },
  "phpcms-zhongnanlinye": {
    kind: "旧站存档",
    format: "PHP 项目",
    intent: "早期网站源码",
    colorName: "中灰",
    color: "#777777",
  },
};

const projectIcons = {
  "chinese-traditional-colors": "assets/icons/traditional-colors-site.svg",
  "zhongguo-traditional-colors": "assets/icons/traditional-colors-site.svg",
  "tampermonkey-scripts": "assets/icons/tampermonkey-scripts.png",
  xposter: "assets/icons/xposter.png",
  "100-layout-compositions": "assets/icons/layout-compositions.svg",
  "chrome-store-submission": "assets/icons/chrome-submission.svg",
};

const hiddenProjectNames = new Set(["xiaoxiaodong", "nevertoday", "image", "bootstrap", "phpcms-zhongnanlinye"]);

const openSkills = [
  {
    name: "xxd-article-poster",
    label: "文章海报",
    title: "长文转海报卡片",
    summary: "先提炼重点，再生成可发版本",
    trigger: "$xxd-article-poster",
    scene: "长文转海报",
    output: "海报 / 卡片",
    source: "skills/xxd-article-poster/SKILL.md",
    url: "https://github.com/nevertoday/xiaoxiaodong/tree/main/skills/xxd-article-poster",
    icon: "assets/icons/article-poster.svg",
    colorName: "墨黑",
    color: "#111111",
    pain: "长文直接发，没人看完",
    highlights: ["提炼传播重点", "整理标题和层级", "输出社媒卡片首版"],
    usage: ["准备一篇文章或笔记", "调用 $xxd-article-poster", "让 Agent 先提炼重点，再生成可发布的海报卡片方案"],
    tips: ["先给目标读者", "先出 3 个标题方向", "长文先摘核心段落"],
  },
  {
    name: "chrome-store-submission",
    label: "插件上架",
    title: "Chrome 插件上架资料",
    summary: "减少权限说明和隐私披露返工",
    trigger: "$chrome-store-submission",
    scene: "Chrome 插件上架",
    output: "文案 / 权限说明",
    source: "独立开源仓库",
    url: "https://github.com/nevertoday/chrome-store-submission",
    icon: "assets/icons/chrome-submission.svg",
    colorName: "铁灰",
    color: "#3F3F3F",
    pain: "插件能跑，不代表能过审",
    highlights: ["整理商店资料", "生成权限说明", "补齐隐私披露"],
    usage: ["把插件仓库交给 Agent 分析", "运行 chrome-store-submission Skill", "按输出清单补齐商店文案、权限解释和隐私说明"],
    tips: ["上架前先确认 manifest 权限是否真的必要", "权限说明要写用户收益，不要只复述 API 名称", "隐私披露要和代码行为一致"],
  },
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function stripEndingPunctuation(value) {
  return String(value ?? "").replace(/[。！？!?；;：:，,、.。…\s]+$/u, "");
}

function escapeCopy(value) {
  return escapeHtml(stripEndingPunctuation(value));
}

function formatDate(value) {
  if (!value) return "未记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatPlainCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) return "";
  return new Intl.NumberFormat("zh-CN").format(Math.round(count));
}

async function syncStyleCount() {
  const counts = [...document.querySelectorAll("[data-style-count]")];
  if (!counts.length) return;

  try {
    const response = await fetch(VIP_PUBLIC_STATS_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`Stats returned ${response.status}`);

    const stats = await response.json();
    const nextCount = formatPlainCount(stats.styles);
    if (nextCount) {
      counts.forEach((count) => {
        count.textContent = nextCount;
      });
    }
  } catch {
    // Keep the static fallback when the stats endpoint is unavailable or blocked by CORS.
  }
}

function inferProjectProfile(repo, index) {
  if (projectProfiles[repo.name]) return projectProfiles[repo.name];

  const name = repo.name.toLowerCase();
  const description = String(repo.description || "").toLowerCase();
  const language = String(repo.language || "").toLowerCase();
  const topics = Array.isArray(repo.topics) ? repo.topics.join(" ").toLowerCase() : "";
  const haystack = `${name} ${description} ${language} ${topics}`;
  const palette = projectPalette[index % projectPalette.length];

  if (haystack.includes("chrome") || haystack.includes("extension") || haystack.includes("mv3")) {
    return {
      kind: "浏览器插件",
      title: "做一个浏览器里的实用工具",
      summary: repo.description || "把高频操作搬进浏览器，减少重复步骤",
      format: "Chrome 工具",
      intent: "做浏览器工具",
      colorName: "墨黑",
      color: "#111111",
    };
  }

  if (haystack.includes("skill") || haystack.includes("agent")) {
    return {
      kind: "开源 Skill",
      title: "把一段工作流交给 Agent 执行",
      summary: repo.description || "把常见任务拆成可复用步骤，让 Agent 按流程稳定产出",
      format: "工作流模块",
      intent: "复用工作流",
      colorName: "铁灰",
      color: "#3F3F3F",
    };
  }

  if (haystack.includes("color") || haystack.includes("image") || haystack.includes("layout")) {
    return {
      kind: "视觉资料",
      title: "整理可复用的视觉参考",
      summary: repo.description || "把颜色、图片或版式资料沉淀成可直接查阅的素材",
      format: "素材仓库",
      intent: "做视觉参考",
      colorName: palette.name,
      color: palette.color,
    };
  }

  if (language === "html" || haystack.includes("homepage")) {
    return {
      kind: "网页入口",
      title: "打开就能使用的静态网页",
      summary: repo.description || "轻量网页入口，适合快速查看内容或演示结果",
      format: "静态页面",
      intent: "打开就能看",
      colorName: palette.name,
      color: palette.color,
    };
  }

  return {
    kind: "开源项目",
    title: repo.description || "公开一个可复用的代码项目",
    summary: repo.language ? `${repo.language} 公开项目` : "可查看、可复用",
    format: repo.language || "代码仓库",
    intent: "公开代码",
    colorName: palette.name,
    color: palette.color,
  };
}

function getRepoView(repo, index) {
  const profile = inferProjectProfile(repo, index);
  return {
    repo,
    profile,
    index,
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [],
    homepage: repo.homepage && repo.homepage.startsWith("http") ? repo.homepage : "",
  };
}

function getProjectIcon(repo) {
  return projectIcons[repo.name] || "assets/icons/project-default.svg";
}

function getProjectAction(view) {
  const chromeStoreUrl = view.profile.chromeStoreUrl;
  if (chromeStoreUrl && chromeStoreUrl.startsWith("http")) {
    return {
      label: "Chrome 插件",
      url: chromeStoreUrl,
    };
  }

  if (view.homepage) {
    return {
      label: "官网",
      url: view.homepage,
    };
  }

  return {
    label: "GitHub",
    url: view.repo.html_url,
  };
}

function filterDisplayRepos(repos) {
  return repos
    .filter((repo) => !repo.fork)
    .filter((repo) => !hiddenProjectNames.has(repo.name))
    .filter((repo) => !/-privacy$/i.test(repo.name) && !/privacy-policy/i.test(repo.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

function getReposSignature(repos) {
  return repos.map((repo) => `${repo.name}:${repo.pushed_at}:${repo.stargazers_count}:${repo.forks_count}`).join("|");
}

function updateRepos(repos) {
  const filteredRepos = filterDisplayRepos(repos);
  const nextSignature = getReposSignature(filteredRepos);
  if (nextSignature === reposSignature) return false;

  reposSignature = nextSignature;
  state.repos = filteredRepos;
  renderAll();
  return true;
}

function scheduleIdleTask(task) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 3500 });
    return;
  }

  window.setTimeout(task, 1600);
}

function shouldRefreshGithub() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return !["slow-2g", "2g"].includes(connection.effectiveType);
}

function setTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  const nextMode = normalized === "dark" ? "light" : "dark";
  const nextModeLabel = nextMode === "dark" ? "暗色" : "淡色";
  document.documentElement.dataset.theme = normalized;
  document.documentElement.classList.add("theme-changing");
  window.clearTimeout(setTheme.timeoutId);
  setTheme.timeoutId = window.setTimeout(() => {
    document.documentElement.classList.remove("theme-changing");
  }, 260);
  document.querySelector("[data-theme-color]")?.setAttribute("content", themeColors[normalized]);

  const toggle = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  toggle?.setAttribute("aria-pressed", String(normalized === "dark"));
  toggle?.setAttribute("aria-label", `切换到${nextModeLabel}模式`);
  if (label) label.textContent = nextModeLabel;

  try {
    localStorage.setItem("theme", normalized);
  } catch {
    // Ignore storage failures; the current document still updates.
  }
}

function initTheme() {
  setTheme(document.documentElement.dataset.theme || "light");
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}

function setMobileNavOpen(open) {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector("[data-menu-toggle]");
  if (!header || !toggle) return;

  header.dataset.navOpen = open ? "true" : "false";
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
}

function initMobileNav() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("#primary-nav");
  if (!toggle || !nav) return;

  setMobileNavOpen(false);

  toggle.addEventListener("click", () => {
    setMobileNavOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest('a[href^="#"]')) {
      setMobileNavOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileNavOpen(false);
  });

  const desktopQuery = window.matchMedia("(min-width: 761px)");
  const closeOnDesktop = (event) => {
    if (event.matches) setMobileNavOpen(false);
  };
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", closeOnDesktop);
  } else {
    desktopQuery.addListener(closeOnDesktop);
  }
}

function setStatus(message, type = "default") {
  const status = document.querySelector("[data-repo-status]");
  if (!status) return;
  status.textContent = stripEndingPunctuation(message);
  status.dataset.type = type;
}

function randomItems(items, count) {
  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, count);
}

async function copyText(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function footerColorButtons() {
  return [...document.querySelectorAll(FOOTER_COLOR_SELECTOR)];
}

function footerCopyValue(color) {
  return `${color.name} ${color.hex}`;
}

function setFooterButtonColor(button, color, height) {
  const copyValue = footerCopyValue(color);
  button.style.setProperty("--spectrum-color", color.hex);
  button.style.setProperty("--spectrum-height", `${height}px`);
  button.dataset.footerCopyValue = copyValue;
  button.title = `复制 ${copyValue}`;
  button.setAttribute("aria-label", `复制 ${color.name} 色值 ${color.hex}`);
}

function buildFooterSpectrum(buttons = footerColorButtons()) {
  if (!buttons.length) return;

  const heights = randomItems(FOOTER_SPECTRUM_HEIGHTS, buttons.length);
  randomItems(footerColorPalette, buttons.length).forEach((color, index) => {
    setFooterButtonColor(buttons[index], color, heights[index]);
  });
}

function markFooterButtonCopied(button) {
  button.dataset.copied = "true";
  window.setTimeout(() => {
    if (button.dataset.copied === "true") delete button.dataset.copied;
  }, FOOTER_COPIED_MS);
}

function showFooterCopyToast(message) {
  const toast = document.querySelector("[data-footer-copy-toast]");
  if (!toast) return;

  toast.textContent = message;
  toast.dataset.visible = "true";
  window.clearTimeout(showFooterCopyToast.timeoutId);
  showFooterCopyToast.timeoutId = window.setTimeout(() => {
    delete toast.dataset.visible;
  }, FOOTER_COPY_TOAST_MS);
}

function initFooterSpectrum() {
  buildFooterSpectrum();
  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest(FOOTER_COLOR_SELECTOR);
    if (!button) return;

    const copyValue = button.dataset.footerCopyValue;
    const copied = await copyText(copyValue);
    if (!copied) {
      showFooterCopyToast("浏览器未允许复制");
      return;
    }

    markFooterButtonCopied(button);
    showFooterCopyToast(`已复制 ${copyValue}`);
  });
}

function setActiveSection(sectionId) {
  if (!sectionId) return;

  document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initSectionNav() {
  const sections = [...document.querySelectorAll("main > section[id]")];
  if (!sections.length) return;

  setActiveSection(sections[0].id);

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (visible?.target?.id) setActiveSection(visible.target.id);
  }, {
    rootMargin: "-32% 0px -52% 0px",
    threshold: [0.08, 0.18, 0.32],
  });

  sections.forEach((section) => observer.observe(section));
}

function createSkillCard(skill, index) {
  const icon = escapeHtml(skill.icon || "assets/icons/project-default.svg");
  const tone = escapeHtml(skill.color || "#111111");
  return `
    <article class="skill-card" style="--card-delay: ${80 + index * 52}ms; --skill-tone: ${tone}">
      <img class="app-icon skill-app-icon" src="${icon}" alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <div class="skill-index">
        <b>${escapeCopy(skill.label)}</b>
        <span>${escapeCopy(skill.output)}</span>
      </div>
      <div class="skill-heading">
        <h3>${escapeCopy(skill.title)}</h3>
        <span>${escapeCopy(skill.summary)}</span>
      </div>
      <div class="skill-facts">
        <div>
          <dt>适合</dt>
          <dd>${escapeCopy(skill.scene)}</dd>
        </div>
        <div>
          <dt>调用</dt>
          <dd>${escapeCopy(skill.trigger)}</dd>
        </div>
      </div>
      <div class="skill-footer">
        <div class="skill-actions">
          <button type="button" data-skill-detail="${escapeHtml(skill.name)}">详情</button>
          <a href="${escapeHtml(skill.url)}" target="_blank" rel="noopener noreferrer">源码</a>
        </div>
      </div>
    </article>
  `;
}

function createListMarkup(items) {
  return items.map((item) => `<li>${escapeCopy(item)}</li>`).join("");
}

function createSkillDetailMarkup(skill) {
  return `
    <div class="skill-modal-heading">
      <p class="eyebrow">${escapeCopy(skill.label)}</p>
      <h3 id="skill-modal-title">${escapeCopy(skill.title)}</h3>
      <p>${escapeCopy(skill.summary)}</p>
    </div>
    <div class="skill-modal-grid">
      <section>
        <h4>解决的痛点</h4>
        <p>${escapeCopy(skill.pain)}</p>
      </section>
      <section>
        <h4>详细亮点</h4>
        <ul>${createListMarkup(skill.highlights)}</ul>
      </section>
      <section>
        <h4>使用方案</h4>
        <ol>${createListMarkup(skill.usage)}</ol>
      </section>
      <section>
        <h4>使用技巧</h4>
        <ul>${createListMarkup(skill.tips)}</ul>
      </section>
    </div>
    <dl class="skill-modal-links">
      <div>
        <dt>触发方式</dt>
        <dd>${escapeCopy(skill.trigger)}</dd>
      </div>
      <div>
        <dt>相关地址</dt>
        <dd><a href="${escapeHtml(skill.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(skill.source)}</a></dd>
      </div>
    </dl>
  `;
}

function openSkillModal(skillName) {
  const skill = openSkills.find((item) => item.name === skillName);
  const modal = document.querySelector("[data-skill-modal]");
  const body = document.querySelector("[data-skill-modal-body]");
  const panel = modal?.querySelector(".skill-modal-panel");
  if (!skill || !modal || !body || !panel) return;

  body.innerHTML = createSkillDetailMarkup(skill);
  modal.hidden = false;
  document.body.classList.add("modal-open");
  window.requestAnimationFrame(() => {
    modal.classList.add("is-open");
    panel.focus();
  });
}

function closeSkillModal() {
  const modal = document.querySelector("[data-skill-modal]");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    if (!modal.classList.contains("is-open")) modal.hidden = true;
  }, 180);
}

function renderSkills() {
  const grid = document.querySelector("[data-skills-grid]");
  if (!grid) return;

  grid.classList.remove("is-rendered");
  grid.innerHTML = openSkills.map(createSkillCard).join("");
  window.requestAnimationFrame(() => {
    grid.classList.add("is-rendered");
  });
}

function initSkillModal() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const detailButton = target?.closest("[data-skill-detail]");
    if (detailButton) {
      openSkillModal(detailButton.dataset.skillDetail);
      return;
    }

    if (target?.closest("[data-skill-modal-close]")) {
      closeSkillModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSkillModal();
  });
}

function createProjectCard(view, visibleIndex) {
  const { repo, profile, homepage } = view;
  const safeName = escapeHtml(repo.name);
  const displayName = escapeCopy(profile.displayName || repo.name);
  const projectTitle = escapeCopy(profile.title || profile.intent || repo.description || repo.name);
  const projectSummary = escapeCopy(profile.summary || repo.description || profile.format || "公开代码项目");
  const htmlUrl = escapeHtml(repo.html_url);
  const action = getProjectAction(view);
  const actionUrl = escapeHtml(action.url);
  const actionLabel = escapeHtml(action.label);
  const icon = escapeHtml(getProjectIcon(repo));
  const tone = escapeHtml(profile.color || "#111111");

  return `
    <article class="project-card" style="--card-delay: ${90 + visibleIndex * 48}ms; --project-tone: ${tone}">
      <div class="project-card-top">
        <img class="app-icon" src="${icon}" alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <div class="project-title">
          <p>${escapeCopy(profile.kind)}</p>
          <span title="${safeName}">${displayName}</span>
        </div>
      </div>
      <div class="project-copy">
        <h3 class="project-intent">${projectTitle}</h3>
        <p class="project-summary">${projectSummary}</p>
      </div>
      <div class="project-footer">
        <a class="project-get" href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>
        ${action.url !== repo.html_url ? `<a class="project-source" href="${htmlUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ""}
      </div>
    </article>
  `;
}

function renderProjects() {
  const grid = document.querySelector("[data-project-grid]");
  if (!grid) return;

  const repos = state.repos;
  const views = repos.map(getRepoView);

  grid.classList.remove("is-rendered");
  grid.innerHTML = views.map(createProjectCard).join("");

  window.requestAnimationFrame(() => {
    grid.classList.add("is-rendered");
  });

  if (!repos.length) {
    setStatus("暂无项目", "empty");
  } else {
    setStatus(`${repos.length} 个可用项目`, "ready");
  }
}

function renderAll() {
  renderProjects();
}

async function loadSnapshotRepos() {
  try {
    const response = await fetch(REPO_SNAPSHOT_URL);
    if (!response.ok) throw new Error(`Snapshot returned ${response.status}`);

    updateRepos(await response.json());
  } catch {
    updateRepos(fallbackRepos);
    setStatus("显示本地项目", "warning");
  }
}

async function refreshReposFromGithub() {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    updateRepos(await response.json());
  } catch {
    if (state.repos.length) {
      setStatus(`${state.repos.length} 个可用项目`, "ready");
    } else {
      updateRepos(fallbackRepos);
      setStatus("GitHub 暂时不可用", "warning");
    }
  }
}

function initMotion() {
  if (!document.documentElement.classList.contains("motion-ready")) return;

  window.requestAnimationFrame(() => {
    document.documentElement.classList.add("motion-in");
  });
}

function initPage() {
  initTheme();
  initMobileNav();
  initMotion();
  initFooterSpectrum();
  initSectionNav();
  renderSkills();
  initSkillModal();
  syncStyleCount();
  loadSnapshotRepos();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
