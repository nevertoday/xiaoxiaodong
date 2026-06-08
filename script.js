const GITHUB_USER = "nevertoday";
const REPO_SNAPSHOT_URL = "repos.json";

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
  query: "",
  category: "all",
};

const themeColors = {
  light: "#f6f2e8",
  dark: "#151412",
};

const projectPalette = [
  { name: "爵弁", color: "#6B3E3C" },
  { name: "藤黄", color: "#FFD111" },
  { name: "竹青", color: "#00A86B" },
  { name: "柏林蓝", color: "#126BAE" },
  { name: "鹅血石红", color: "#AB372F" },
  { name: "月白天青", color: "#C6D7DB" },
  { name: "奶橙色", color: "#FFD8B3" },
  { name: "宝石绿", color: "#41AE3C" },
  { name: "素积", color: "#D2C8BC" },
];

const projectProfiles = {
  "chinese-traditional-colors": {
    kind: "色卡资料库",
    format: "开源网页",
    intent: "中国传统色色卡，可以查色、下载，也可以做设计参考。",
    colorName: "藤黄",
    color: "#FFD111",
  },
  "zhongguo-traditional-colors": {
    kind: "色卡资料库",
    format: "开源网页",
    intent: "中国传统色色卡，可以查色、下载，也可以做设计参考。",
    colorName: "藤黄",
    color: "#FFD111",
  },
  nevertoday: {
    kind: "个人主页",
    format: "主页",
    intent: "一个更轻的个人主页，用来放基础介绍和链接。",
    colorName: "月白天青",
    color: "#C6D7DB",
  },
  xposter: {
    kind: "发布插件",
    format: "Chrome MV3",
    intent: "把 Markdown 草稿导入 X Articles 的 Chrome 插件。",
    colorName: "柏林蓝",
    color: "#126BAE",
  },
  "100-layout-compositions": {
    kind: "构图参考",
    format: "视觉资料",
    intent: "100 张构图参考图，适合做版式练习和设计参考。",
    colorName: "素积",
    color: "#D2C8BC",
  },
  "chrome-store-submission": {
    kind: "开源 Skill",
    format: "提交流程",
    intent: "帮 Chrome 插件整理上架材料、权限说明和隐私文案。",
    colorName: "竹青",
    color: "#00A86B",
  },
  image: {
    kind: "图片实验",
    format: "脚本仓库",
    intent: "一些图片处理、素材整理和自动化实验。",
    colorName: "奶橙色",
    color: "#FFD8B3",
  },
  bootstrap: {
    kind: "早期实验",
    format: "前端存档",
    intent: "很早期的 Bootstrap 练习和前端存档。",
    colorName: "素积",
    color: "#D2C8BC",
  },
  "phpcms-zhongnanlinye": {
    kind: "旧站存档",
    format: "PHP 项目",
    intent: "早期网站项目源码，保留一下做过的痕迹。",
    colorName: "鹅血石红",
    color: "#AB372F",
  },
};

const projectGlyphs = {
  "chinese-traditional-colors": "色",
  "zhongguo-traditional-colors": "色",
  nevertoday: "我",
  xposter: "X",
  "100-layout-compositions": "版",
  "chrome-store-submission": "上",
  image: "图",
  bootstrap: "B",
  "phpcms-zhongnanlinye": "站",
};

const openSkills = [
  {
    name: "xxd-article-poster",
    label: "文章海报",
    trigger: "$xxd-article-poster",
    scene: "把长文章、网页或文档整理成更好读的信息海报。",
    output: "信息海报 / 一图读懂 / 多张卡片",
    source: "skills/xxd-article-poster/SKILL.md",
    url: "https://github.com/nevertoday/xiaoxiaodong/tree/main/skills/xxd-article-poster",
    colorName: "爵弁",
    color: "#6B3E3C",
  },
  {
    name: "chrome-store-submission",
    label: "插件上架",
    trigger: "$chrome-store-submission",
    scene: "帮 Chrome 插件准备商店上架文案、权限说明和隐私资料。",
    output: "上架文案 / 权限说明 / 文件清单",
    source: "独立开源仓库",
    url: "https://github.com/nevertoday/chrome-store-submission",
    colorName: "竹青",
    color: "#00A86B",
  },
  {
    name: "claude_skill_vibe-writing",
    label: "写作流程",
    trigger: "安装 Skill",
    scene: "把写作协作流程整理成一个可以被 Agent 调用的 Skill。",
    output: "Skill zip / 写作流程",
    source: "独立开源仓库",
    url: "https://github.com/nevertoday/claude_skill_vibe-writing",
    colorName: "柏林蓝",
    color: "#126BAE",
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

function formatDate(value) {
  if (!value) return "未记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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
      format: "Chrome 工具",
      intent: "把重复的浏览器操作做成一个更顺手的插件。",
      colorName: "柏林蓝",
      color: "#126BAE",
    };
  }

  if (haystack.includes("skill") || haystack.includes("agent")) {
    return {
      kind: "开源 Skill",
      format: "工作流模块",
      intent: "把一套做事流程整理成可以复用的 Skill。",
      colorName: "竹青",
      color: "#00A86B",
    };
  }

  if (haystack.includes("color") || haystack.includes("image") || haystack.includes("layout")) {
    return {
      kind: "视觉资料",
      format: "素材仓库",
      intent: "给设计、写作和视觉判断做参考。",
      colorName: palette.name,
      color: palette.color,
    };
  }

  if (language === "html" || haystack.includes("homepage")) {
    return {
      kind: "网页入口",
      format: "静态页面",
      intent: "把一些信息整理成可以直接访问的网页。",
      colorName: palette.name,
      color: palette.color,
    };
  }

  return {
    kind: "开源项目",
    format: repo.language || "代码仓库",
    intent: "一个公开代码项目，可以继续阅读、复用或二次开发。",
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
    description: repo.description || "这个仓库暂时没有描述。",
  };
}

function getProjectGlyph(repo) {
  return projectGlyphs[repo.name] || repo.name.slice(0, 1).toUpperCase();
}

function getProjectAction(view) {
  if (view.homepage) {
    return {
      label: "获取",
      url: view.homepage,
    };
  }

  return {
    label: "获取",
    url: view.repo.html_url,
  };
}

function filterDisplayRepos(repos) {
  return repos
    .filter((repo) => !repo.fork)
    .filter((repo) => repo.name !== "xiaoxiaodong")
    .filter((repo) => !/-privacy$/i.test(repo.name) && !/privacy-policy/i.test(repo.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

function getKindCounts(repos) {
  return repos.reduce((counts, repo, index) => {
    const kind = inferProjectProfile(repo, index).kind;
    counts.set(kind, (counts.get(kind) || 0) + 1);
    return counts;
  }, new Map());
}

function getFilteredRepos() {
  const query = state.query.trim().toLowerCase();

  return state.repos.filter((repo, index) => {
    const profile = inferProjectProfile(repo, index);
    const categoryMatches = state.category === "all" || profile.kind === state.category;
    if (!categoryMatches) return false;
    if (!query) return true;

    const searchable = [
      repo.name,
      repo.description,
      repo.language,
      profile.kind,
      profile.format,
      profile.intent,
      profile.colorName,
      ...(Array.isArray(repo.topics) ? repo.topics : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}

function setTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  document.querySelector("[data-theme-color]")?.setAttribute("content", themeColors[normalized]);

  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    const isActive = button.dataset.themeOption === normalized;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  try {
    localStorage.setItem("theme", normalized);
  } catch {
    // Ignore storage failures; the current document still updates.
  }
}

function initTheme() {
  setTheme(document.documentElement.dataset.theme || "light");
  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeOption));
  });
}

function setStatus(message, type = "default") {
  const status = document.querySelector("[data-repo-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
}

function renderStats(repos) {
  const kindCount = getKindCounts(repos).size;
  const latest = repos[0]?.pushed_at ? formatDate(repos[0].pushed_at) : "--";

  document.querySelectorAll("[data-project-count]").forEach((item) => {
    item.textContent = String(repos.length || "--");
  });
  document.querySelector("[data-kind-count]").textContent = String(kindCount || "--");
  document.querySelector("[data-latest-date]").textContent = latest;
}

function renderCategories() {
  const nav = document.querySelector("[data-category-nav]");
  if (!nav) return;

  const counts = getKindCounts(state.repos);
  const categories = [["all", state.repos.length], ...Array.from(counts.entries())];

  nav.innerHTML = categories
    .map(([kind, count]) => {
      const label = kind === "all" ? "全部项目" : kind;
      const active = state.category === kind ? " is-active" : "";
      return `
        <button class="category-button${active}" type="button" data-category="${escapeHtml(kind)}">
          <span>${escapeHtml(label)}</span>
          <b>${count}</b>
        </button>
      `;
    })
    .join("");

  nav.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category || "all";
      renderAll();
    });
  });
}

function createSkillCard(skill, index) {
  return `
    <article class="skill-card" style="--skill-color: ${skill.color}; --card-index: ${index}">
      <div class="skill-index">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <b>${escapeHtml(skill.label)}</b>
      </div>
      <div>
        <p>${escapeHtml(skill.label)}</p>
        <h3>${escapeHtml(skill.name)}</h3>
      </div>
      <dl class="skill-facts">
        <div>
          <dt>触发</dt>
          <dd>${escapeHtml(skill.trigger)}</dd>
        </div>
        <div>
          <dt>场景</dt>
          <dd>${escapeHtml(skill.scene)}</dd>
        </div>
        <div>
          <dt>产物</dt>
          <dd>${escapeHtml(skill.output)}</dd>
        </div>
      </dl>
      <div class="skill-footer">
        <span>${escapeHtml(skill.source)}</span>
        <a href="${escapeHtml(skill.url)}" target="_blank" rel="noopener noreferrer">查看源码</a>
      </div>
    </article>
  `;
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

function createFeatureCard(view, featureIndex) {
  const { repo, profile, homepage, description } = view;
  const safeName = escapeHtml(repo.name);
  const htmlUrl = escapeHtml(repo.html_url);
  const action = getProjectAction(view);
  const actionUrl = escapeHtml(action.url);
  const actionLabel = escapeHtml(action.label);
  const glyph = escapeHtml(getProjectGlyph(repo));

  return `
    <article class="feature-card app-feature-card" style="--project-color: ${profile.color}; --card-index: ${featureIndex}">
      <div class="app-feature-copy">
        <p>${escapeHtml(profile.kind)}</p>
        <h3>${safeName}</h3>
        <strong>${escapeHtml(profile.intent)}</strong>
        <span>${escapeHtml(description)}</span>
      </div>
      <div class="app-feature-footer">
        <div class="app-icon app-icon-large" aria-hidden="true">${glyph}</div>
        <div class="app-actions">
          <a href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>
          ${homepage ? `<a href="${htmlUrl}" target="_blank" rel="noopener noreferrer">源码</a>` : ""}
        </div>
      </div>
    </article>
  `;
}

function createRepoCard(view, visibleIndex) {
  const { repo, profile, topics, homepage, description } = view;
  const safeName = escapeHtml(repo.name);
  const htmlUrl = escapeHtml(repo.html_url);
  const action = getProjectAction(view);
  const actionUrl = escapeHtml(action.url);
  const actionLabel = escapeHtml(action.label);
  const glyph = escapeHtml(getProjectGlyph(repo));
  const topicMarkup = topics.length
    ? topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")
    : "";

  return `
    <article class="repo-card app-card" style="--project-color: ${profile.color}; --card-index: ${visibleIndex}">
      <div class="app-icon" aria-hidden="true">${glyph}</div>
      <div class="app-card-main">
        <div class="app-card-head">
          <div>
            <h3>${safeName}</h3>
            <p>${escapeHtml(profile.intent)}</p>
          </div>
          <a class="app-get" href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>
        </div>
        <p class="app-description">${escapeHtml(description)}</p>
        <div class="app-tags">
          <span>${escapeHtml(profile.kind)}</span>
          <span>${escapeHtml(profile.format)}</span>
          ${repo.language ? `<span>${escapeHtml(repo.language)}</span>` : ""}
          ${topicMarkup}
        </div>
        <div class="app-meta">
          <span>${repo.stargazers_count ?? 0} stars</span>
          <span>${repo.forks_count ?? 0} forks</span>
          <span>${formatDate(repo.pushed_at)}</span>
          <a href="${htmlUrl}" target="_blank" rel="noopener noreferrer">源码</a>
        </div>
      </div>
    </article>
  `;
}

function renderProjects() {
  const featureGrid = document.querySelector("[data-feature-grid]");
  const repoGrid = document.querySelector("[data-repo-grid]");
  if (!featureGrid || !repoGrid) return;

  const repos = getFilteredRepos();
  const views = repos.map(getRepoView);
  const featureViews = views.slice(0, Math.min(2, views.length));
  const gridViews = views.slice(featureViews.length);

  featureGrid.classList.remove("is-rendered");
  repoGrid.classList.remove("is-rendered");
  featureGrid.innerHTML = featureViews.map(createFeatureCard).join("");
  repoGrid.innerHTML = gridViews.map(createRepoCard).join("");

  window.requestAnimationFrame(() => {
    featureGrid.classList.add("is-rendered");
    repoGrid.classList.add("is-rendered");
  });

  if (!repos.length) {
    setStatus("没有匹配的公开项目。", "empty");
  } else {
    setStatus(`展示 ${repos.length} 个公开项目。`, "ready");
  }
}

function renderAll() {
  renderStats(state.repos);
  renderCategories();
  renderProjects();
}

async function loadSnapshotRepos() {
  try {
    const response = await fetch(REPO_SNAPSHOT_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Snapshot returned ${response.status}`);

    state.repos = filterDisplayRepos(await response.json());
    renderAll();
  } catch {
    state.repos = fallbackRepos;
    renderAll();
    setStatus("展示本地兜底项目。", "warning");
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

    state.repos = filterDisplayRepos(await response.json());
    renderAll();
  } catch {
    if (state.repos.length) {
      renderAll();
    } else {
      state.repos = fallbackRepos;
      renderAll();
      setStatus("暂时无法读取 GitHub API，已显示本地兜底项目。", "warning");
    }
  }
}

function initSearch() {
  const search = document.querySelector("#repo-search");
  if (!search) return;

  search.addEventListener("input", () => {
    state.query = search.value;
    renderProjects();
  });
}

function initMotion() {
  if (!document.documentElement.classList.contains("motion-ready")) return;

  window.requestAnimationFrame(() => {
    document.documentElement.classList.add("motion-in");
  });
}

function initPage() {
  initTheme();
  initMotion();
  initSearch();
  renderSkills();
  loadSnapshotRepos().then(refreshReposFromGithub);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
