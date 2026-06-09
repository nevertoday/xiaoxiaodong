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
};

const themeColors = {
  light: "#f6f2e8",
  dark: "#151412",
};

const projectPalette = [
  { name: "墨黑", color: "#111111" },
  { name: "铁灰", color: "#3F3F3C" },
  { name: "中灰", color: "#777771" },
  { name: "石灰", color: "#9A9A94" },
  { name: "线灰", color: "#B8B8B2" },
  { name: "纸白", color: "#F7F7F4" },
];

const projectProfiles = {
  "chinese-traditional-colors": {
    kind: "色卡资料库",
    title: "查中华传统色，直接复制色值",
    summary: "传统色演示、色卡浏览和颜色知识科普，适合做视觉配色参考。",
    format: "开源网页",
    intent: "查传统色。",
    colorName: "墨黑",
    color: "#111111",
  },
  "zhongguo-traditional-colors": {
    kind: "色卡资料库",
    title: "查中华传统色，直接复制色值",
    summary: "传统色演示、色卡浏览和颜色知识科普，适合做视觉配色参考。",
    format: "开源网页",
    intent: "查传统色。",
    colorName: "墨黑",
    color: "#111111",
  },
  nevertoday: {
    kind: "个人主页",
    format: "主页",
    intent: "个人入口。",
    colorName: "铁灰",
    color: "#3F3F3C",
  },
  xposter: {
    kind: "发布插件",
    title: "把 Markdown 一键发布到 X",
    summary: "面向写作者和运营者的 Chrome 插件，把本地内容整理后快速发布。",
    format: "Chrome MV3",
    intent: "把 Markdown 发到 X。",
    colorName: "墨黑",
    color: "#111111",
  },
  "100-layout-compositions": {
    kind: "构图参考",
    title: "用 100 种版式找构图参考",
    summary: "沉淀版式组合和视觉构图，给海报、卡片、封面设计找起点。",
    format: "视觉资料",
    intent: "看构图。",
    colorName: "中灰",
    color: "#777771",
  },
  "chrome-store-submission": {
    kind: "开源 Skill",
    title: "生成 Chrome 插件上架材料",
    summary: "整理商店描述、权限说明、隐私披露和提交材料，减少上架返工。",
    format: "提交流程",
    intent: "准备 Chrome 上架材料。",
    colorName: "铁灰",
    color: "#3F3F3C",
  },
  "tampermonkey-scripts": {
    kind: "油猴脚本集",
    title: "批量选择并下载主流图片站原图",
    summary: "支持 Pinterest、小红书、微信公众号、堆糖、500px，悬停勾选后一键导出链接、逐张下载或打包 ZIP。",
    format: "Tampermonkey",
    intent: "批量下载图片。",
    colorName: "墨黑",
    color: "#111111",
  },
  image: {
    kind: "图片实验",
    title: "批量处理图片实验素材",
    summary: "围绕图片生成、整理和脚本化处理做实验，适合沉淀视觉工作流。",
    format: "脚本仓库",
    intent: "做图片实验。",
    colorName: "石灰",
    color: "#9A9A94",
  },
  bootstrap: {
    kind: "早期实验",
    format: "前端存档",
    intent: "早期前端练习。",
    colorName: "线灰",
    color: "#B8B8B2",
  },
  "phpcms-zhongnanlinye": {
    kind: "旧站存档",
    format: "PHP 项目",
    intent: "早期网站源码。",
    colorName: "中灰",
    color: "#777771",
  },
};

const projectGlyphs = {
  "chinese-traditional-colors": "色",
  "zhongguo-traditional-colors": "色",
  nevertoday: "我",
  xposter: "X",
  "100-layout-compositions": "版",
  "chrome-store-submission": "上",
  "tampermonkey-scripts": "油",
  image: "图",
  bootstrap: "B",
  "phpcms-zhongnanlinye": "站",
};

const hiddenProjectNames = new Set(["xiaoxiaodong", "nevertoday", "bootstrap", "phpcms-zhongnanlinye"]);

const openSkills = [
  {
    name: "xxd-article-poster",
    label: "文章海报",
    title: "把长文生成可发布的海报卡片",
    summary: "从文章内容提炼标题、摘要和视觉层级，输出适合社媒传播的海报。",
    trigger: "$xxd-article-poster",
    scene: "长文转海报。",
    output: "海报 / 卡片",
    source: "skills/xxd-article-poster/SKILL.md",
    url: "https://github.com/nevertoday/xiaoxiaodong/tree/main/skills/xxd-article-poster",
    colorName: "墨黑",
    color: "#111111",
    pain: "长文章适合阅读，但不适合直接发到社媒；手动提炼标题、摘要、层级和卡片版式，很容易越改越散。",
    highlights: ["从长文中提炼传播重点", "把标题、摘要和视觉层级一起整理", "适合做小红书、公众号配图、社媒海报的首版"],
    usage: ["准备一篇文章或笔记", "调用 $xxd-article-poster", "让 Agent 先提炼重点，再生成可发布的海报卡片方案"],
    tips: ["先给文章的目标读者，不要只贴正文", "适合先出 3 个标题方向，再选一个继续细化", "如果文章很长，先让 Agent 摘出核心段落再生成卡片"],
  },
  {
    name: "chrome-store-submission",
    label: "插件上架",
    title: "自动整理 Chrome 插件上架资料",
    summary: "分析扩展代码，生成商店介绍、权限解释、隐私披露和提交检查清单。",
    trigger: "$chrome-store-submission",
    scene: "Chrome 插件上架。",
    output: "文案 / 权限说明",
    source: "独立开源仓库",
    url: "https://github.com/nevertoday/chrome-store-submission",
    colorName: "铁灰",
    color: "#3F3F3C",
    pain: "Chrome 插件上架不是只传代码，还要解释权限、隐私、商店描述和审核材料；很多返工都发生在这些文字和披露表述上。",
    highlights: ["按扩展代码整理上架所需资料", "生成权限说明、隐私披露和商店介绍", "减少审核前反复补材料的时间"],
    usage: ["把插件仓库交给 Agent 分析", "运行 chrome-store-submission Skill", "按输出清单补齐商店文案、权限解释和隐私说明"],
    tips: ["上架前先确认 manifest 权限是否真的必要", "权限说明要写用户收益，不要只复述 API 名称", "隐私披露要和代码行为一致"],
  },
  {
    name: "claude_skill_vibe-writing",
    label: "写作流程",
    title: "把写作过程拆成可复用工作流",
    summary: "围绕选题、结构、改写和风格控制，把写作任务交给 Agent 稳定执行。",
    trigger: "安装 Skill",
    scene: "写作工作流。",
    output: "Skill zip",
    source: "独立开源仓库",
    url: "https://github.com/nevertoday/claude_skill_vibe-writing",
    colorName: "中灰",
    color: "#777771",
    pain: "写作任务如果只靠一句提示词，风格、结构和修改标准都不稳定；每次都要重新解释一遍需求。",
    highlights: ["把写作拆成可复用流程", "控制选题、结构、改写和风格", "适合把个人写作方法沉淀成 Agent 可执行的规范"],
    usage: ["安装 Skill", "给出写作目标、读者和素材", "让 Agent 按流程完成选题、成稿、改写或风格统一"],
    tips: ["先定义读者和发布场景，再让 Agent 写", "不要一次要求又写又改又排版，分阶段更稳定", "把你满意的文章样例作为风格参考"],
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
      title: "做一个浏览器里的实用工具",
      summary: repo.description || "把高频操作搬进浏览器，减少重复步骤。",
      format: "Chrome 工具",
      intent: "做浏览器工具。",
      colorName: "墨黑",
      color: "#111111",
    };
  }

  if (haystack.includes("skill") || haystack.includes("agent")) {
    return {
      kind: "开源 Skill",
      title: "把一段工作流交给 Agent 执行",
      summary: repo.description || "把常见任务拆成可复用步骤，让 Agent 按流程稳定产出。",
      format: "工作流模块",
      intent: "复用工作流。",
      colorName: "铁灰",
      color: "#3F3F3C",
    };
  }

  if (haystack.includes("color") || haystack.includes("image") || haystack.includes("layout")) {
    return {
      kind: "视觉资料",
      title: "整理可复用的视觉参考",
      summary: repo.description || "把颜色、图片或版式资料沉淀成可直接查阅的素材。",
      format: "素材仓库",
      intent: "做视觉参考。",
      colorName: palette.name,
      color: palette.color,
    };
  }

  if (language === "html" || haystack.includes("homepage")) {
    return {
      kind: "网页入口",
      title: "打开就能使用的静态网页",
      summary: repo.description || "轻量网页入口，适合快速查看内容或演示结果。",
      format: "静态页面",
      intent: "打开就能看。",
      colorName: palette.name,
      color: palette.color,
    };
  }

  return {
    kind: "开源项目",
    title: repo.description || "公开一个可复用的代码项目",
    summary: repo.language ? `用 ${repo.language} 做的公开项目。` : "公开代码和项目实现，方便查看、复用或二次开发。",
    format: repo.language || "代码仓库",
    intent: "公开代码。",
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
    .filter((repo) => !hiddenProjectNames.has(repo.name))
    .filter((repo) => !/-privacy$/i.test(repo.name) && !/privacy-policy/i.test(repo.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

function setTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  const nextMode = normalized === "dark" ? "light" : "dark";
  const nextModeLabel = nextMode === "dark" ? "暗色" : "淡色";
  document.documentElement.dataset.theme = normalized;
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

function setStatus(message, type = "default") {
  const status = document.querySelector("[data-repo-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
}

function createSkillCard(skill, index) {
  return `
    <article class="skill-card" style="--card-delay: ${80 + index * 52}ms">
      <div class="skill-index">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <b>${escapeHtml(skill.label)}</b>
      </div>
      <div class="skill-heading">
        <p>${escapeHtml(skill.name)}</p>
        <h3>${escapeHtml(skill.title)}</h3>
        <span>${escapeHtml(skill.summary)}</span>
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
        <div class="skill-actions">
          <button type="button" data-skill-detail="${escapeHtml(skill.name)}">了解详情</button>
          <a href="${escapeHtml(skill.url)}" target="_blank" rel="noopener noreferrer">查看源码</a>
        </div>
      </div>
    </article>
  `;
}

function createListMarkup(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function createSkillDetailMarkup(skill) {
  return `
    <div class="skill-modal-heading">
      <p class="eyebrow">${escapeHtml(skill.label)}</p>
      <h3 id="skill-modal-title">${escapeHtml(skill.title)}</h3>
      <p>${escapeHtml(skill.summary)}</p>
    </div>
    <div class="skill-modal-grid">
      <section>
        <h4>解决的痛点</h4>
        <p>${escapeHtml(skill.pain)}</p>
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
        <dd>${escapeHtml(skill.trigger)}</dd>
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
  const { repo, profile, topics, homepage } = view;
  const safeName = escapeHtml(repo.name);
  const projectTitle = escapeHtml(profile.title || profile.intent || repo.description || repo.name);
  const projectSummary = escapeHtml(profile.summary || repo.description || profile.format || "公开代码项目。");
  const htmlUrl = escapeHtml(repo.html_url);
  const action = getProjectAction(view);
  const actionUrl = escapeHtml(action.url);
  const actionLabel = escapeHtml(action.label);
  const glyph = escapeHtml(getProjectGlyph(repo));
  const topicMarkup = topics.length
    ? topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")
    : "";

  return `
    <article class="project-card" style="--card-delay: ${90 + visibleIndex * 48}ms">
      <div class="project-card-top">
        <div class="app-icon" aria-hidden="true">${glyph}</div>
        <div class="project-title">
          <p>${escapeHtml(profile.kind)}</p>
          <span>${safeName}</span>
        </div>
        <a class="project-get" href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>
      </div>
      <div class="project-copy">
        <h3 class="project-intent">${projectTitle}</h3>
        <p class="project-summary">${projectSummary}</p>
      </div>
      <div class="project-tags">
        <span>${escapeHtml(profile.format)}</span>
        ${repo.language ? `<span>${escapeHtml(repo.language)}</span>` : ""}
        ${topicMarkup}
      </div>
      <div class="project-footer">
        <span>${repo.stargazers_count ?? 0} stars</span>
        <span>${repo.forks_count ?? 0} forks</span>
        <span>${formatDate(repo.pushed_at)}</span>
        ${homepage ? `<a href="${htmlUrl}" target="_blank" rel="noopener noreferrer">源码</a>` : ""}
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
    setStatus(`${repos.length} 个可用`, "ready");
  }
}

function renderAll() {
  renderProjects();
}

function initPlanProgress() {
  document.querySelectorAll("[data-plan-progress]").forEach((item) => {
    const total = Number(item.dataset.total) || 0;
    const done = Math.min(Math.max(Number(item.dataset.done) || 0, 0), total);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const title = item.querySelector("h4")?.textContent?.trim() || "计划";
    const count = item.querySelector("[data-progress-count]");
    const percentLabel = item.querySelector("[data-progress-percent]");

    item.style.setProperty("--progress", `${percent}%`);
    item.setAttribute("aria-label", `${title}，已完成 ${done} / ${total} 套，完成 ${percent}%`);
    if (count) count.textContent = `${done}/${total} 套`;
    if (percentLabel) percentLabel.textContent = `完成 ${percent}%`;
  });
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
    setStatus("显示本地项目。", "warning");
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
      setStatus("GitHub 暂时不可用。", "warning");
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
  initMotion();
  renderSkills();
  initSkillModal();
  initPlanProgress();
  loadSnapshotRepos().then(refreshReposFromGithub);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
