const GITHUB_USER = "nevertoday";
const REPO_LIMIT = 12;
const REPO_SNAPSHOT_URL = "repos.json";

const fallbackRepos = [
  {
    name: "xiaoxiaodong",
    description: "小小东的 GitHub 项目入口，包含主页、素材和公开 Skills。",
    html_url: "https://github.com/nevertoday/xiaoxiaodong",
    homepage: "https://nevertoday.github.io/xiaoxiaodong/",
    language: "HTML",
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: new Date().toISOString(),
    topics: ["homepage", "skills", "ai-workflow"],
  },
];

const state = {
  repos: [],
  query: "",
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
  "zhongguo-traditional-colors": {
    kind: "色彩资料库",
    format: "开放素材",
    intent: "查色、下载、教学引用和界面主题取色",
    colorName: "藤黄",
    color: "#FFD111",
  },
  nevertoday: {
    kind: "个人主页",
    format: "主页",
    intent: "快速了解公开身份、项目入口和基础链接",
    colorName: "月白天青",
    color: "#C6D7DB",
  },
  xposter: {
    kind: "发布插件",
    format: "Chrome MV3",
    intent: "把 Markdown 草稿导入 X Articles",
    colorName: "柏林蓝",
    color: "#126BAE",
  },
  xiaoxiaodong: {
    kind: "项目资料馆",
    format: "静态主页",
    intent: "把公开项目、Skills 和工作流整理成入口",
    colorName: "爵弁",
    color: "#6B3E3C",
  },
  "100-layout-compositions": {
    kind: "构图参考",
    format: "视觉资料",
    intent: "用于版式练习、设计参考和排版判断",
    colorName: "素积",
    color: "#D2C8BC",
  },
  "chrome-store-submission": {
    kind: "Agent Skill",
    format: "提交流程",
    intent: "整理 Chrome Web Store 上架材料和披露说明",
    colorName: "竹青",
    color: "#00A86B",
  },
  image: {
    kind: "图片实验",
    format: "脚本仓库",
    intent: "沉淀图片处理、素材整理和自动化尝试",
    colorName: "奶橙色",
    color: "#FFD8B3",
  },
  bootstrap: {
    kind: "早期实验",
    format: "前端存档",
    intent: "保留早期 Bootstrap 相关实验痕迹",
    colorName: "素积",
    color: "#D2C8BC",
  },
  "phpcms-zhongnanlinye": {
    kind: "旧站存档",
    format: "PHP 项目",
    intent: "保留早期网站项目的源码和结构",
    colorName: "鹅血石红",
    color: "#AB372F",
  },
};

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
      intent: "把重复的浏览器操作整理成可复用按钮",
      colorName: "柏林蓝",
      color: "#126BAE",
    };
  }

  if (haystack.includes("skill") || haystack.includes("agent")) {
    return {
      kind: "Agent Skill",
      format: "工作流模块",
      intent: "把一套流程封装成可调用的智能体能力",
      colorName: "竹青",
      color: "#00A86B",
    };
  }

  if (haystack.includes("color") || haystack.includes("image") || haystack.includes("layout")) {
    return {
      kind: "视觉资料",
      format: "素材仓库",
      intent: "为设计、写作和视觉判断提供可引用素材",
      colorName: palette.name,
      color: palette.color,
    };
  }

  if (language === "html" || haystack.includes("homepage")) {
    return {
      kind: "网页入口",
      format: "静态页面",
      intent: "把信息整理成可以直接访问的页面",
      colorName: palette.name,
      color: palette.color,
    };
  }

  return {
    kind: "开源项目",
    format: repo.language || "代码仓库",
    intent: "保留可继续阅读、复用或二次开发的代码线索",
    colorName: palette.name,
    color: palette.color,
  };
}

function createRepoCard(repo, index) {
  const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [];
  const homepage = repo.homepage && repo.homepage.startsWith("http") ? repo.homepage : "";
  const description = repo.description || "这个仓库暂时没有描述。";
  const profile = inferProjectProfile(repo, index);
  const name = escapeHtml(repo.name);
  const safeDescription = escapeHtml(description);
  const language = escapeHtml(repo.language || "Code");
  const htmlUrl = escapeHtml(repo.html_url);
  const homepageUrl = escapeHtml(homepage);
  const kind = escapeHtml(profile.kind);
  const format = escapeHtml(profile.format);
  const intent = escapeHtml(profile.intent);
  const colorName = escapeHtml(profile.colorName);
  const number = String(index + 1).padStart(2, "0");
  const featuredClass = index === 0 ? " is-featured" : "";

  return `
    <article class="repo-card${featuredClass}" style="--project-color: ${profile.color}; --card-index: ${index}">
      <div class="repo-plate" aria-hidden="true">
        <span>${number}</span>
        <b>${colorName}</b>
      </div>
      <div class="repo-card-main">
        <div class="repo-title-row">
          <h3>${name}</h3>
          <span>${language}</span>
        </div>
        <p>${safeDescription}</p>
      </div>
      <div class="repo-intent">
        <span>适合</span>
        <strong>${intent}</strong>
      </div>
      <div class="repo-format">
        <span>${kind}</span>
        <span>${format}</span>
      </div>
      ${topics.length ? `<div class="repo-topics">${topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")}</div>` : ""}
      <dl class="repo-meta" aria-label="${name} 仓库信息">
        <div>
          <dt>Stars</dt>
          <dd>${repo.stargazers_count ?? 0}</dd>
        </div>
        <div>
          <dt>Forks</dt>
          <dd>${repo.forks_count ?? 0}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>${formatDate(repo.pushed_at)}</dd>
        </div>
      </dl>
      <div class="repo-links">
        <a href="${htmlUrl}" target="_blank" rel="noopener noreferrer">源码</a>
        ${homepage ? `<a href="${homepageUrl}" target="_blank" rel="noopener noreferrer">预览</a>` : ""}
      </div>
    </article>
  `;
}

function filterDisplayRepos(repos) {
  return repos
    .filter((repo) => !repo.fork)
    .filter((repo) => !/-privacy$/i.test(repo.name) && !/privacy-policy/i.test(repo.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, REPO_LIMIT);
}

function setStatus(message, type = "default") {
  const status = document.querySelector("[data-repo-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
}

function getFilteredRepos() {
  const query = state.query.trim().toLowerCase();
  if (!query) return state.repos;

  return state.repos.filter((repo) => {
    const profile = inferProjectProfile(repo, 0);
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

function renderRepos() {
  const grid = document.querySelector("[data-repo-grid]");
  if (!grid) return;

  const repos = getFilteredRepos();
  grid.classList.remove("is-rendered");
  grid.innerHTML = repos.map((repo, index) => createRepoCard(repo, index)).join("");
  window.requestAnimationFrame(() => {
    grid.classList.add("is-rendered");
  });

  if (!repos.length) {
    setStatus("没有匹配的公开项目。", "empty");
  } else {
    setStatus(`展示 ${repos.length} 个公开项目，按最近更新排序。`, "ready");
  }
}

async function loadSnapshotRepos() {
  try {
    const response = await fetch(REPO_SNAPSHOT_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Snapshot returned ${response.status}`);

    const repos = await response.json();
    state.repos = filterDisplayRepos(repos);
    renderRepos();
    setStatus(`展示 ${state.repos.length} 个公开项目。`, "ready");
  } catch {
    state.repos = fallbackRepos;
    renderRepos();
    setStatus("展示本地兜底项目。", "warning");
  }
}

async function refreshReposFromGithub() {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=50`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const repos = await response.json();
    state.repos = filterDisplayRepos(repos);
    renderRepos();
  } catch {
    if (state.repos.length) {
      setStatus(`展示 ${state.repos.length} 个公开项目。`, "ready");
    } else {
      state.repos = fallbackRepos;
      renderRepos();
      setStatus("暂时无法读取 GitHub API，已显示本地兜底项目。", "warning");
    }
  }
}

function initSearch() {
  const search = document.querySelector("#repo-search");
  if (!search) return;

  search.addEventListener("input", () => {
    state.query = search.value;
    renderRepos();
  });
}

function initMotion() {
  if (!document.documentElement.classList.contains("motion-ready")) return;

  window.requestAnimationFrame(() => {
    document.documentElement.classList.add("motion-in");
  });
}

function initPage() {
  initMotion();
  initSearch();
  loadSnapshotRepos().then(refreshReposFromGithub);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
