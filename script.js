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

function createRepoCard(repo) {
  const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [];
  const homepage = repo.homepage && repo.homepage.startsWith("http") ? repo.homepage : "";
  const description = repo.description || "这个仓库暂时没有描述。";
  const name = escapeHtml(repo.name);
  const safeDescription = escapeHtml(description);
  const language = escapeHtml(repo.language || "Code");
  const htmlUrl = escapeHtml(repo.html_url);
  const homepageUrl = escapeHtml(homepage);

  return `
    <article class="repo-card">
      <div class="repo-card-main">
        <div class="repo-title-row">
          <h3>${name}</h3>
          <span>${language}</span>
        </div>
        <p>${safeDescription}</p>
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
    const searchable = [
      repo.name,
      repo.description,
      repo.language,
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
  grid.innerHTML = repos.map(createRepoCard).join("");

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

function initPage() {
  initSearch();
  loadSnapshotRepos().then(refreshReposFromGithub);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
