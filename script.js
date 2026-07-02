const GITHUB_USER = "nevertoday";
const REPO_SNAPSHOT_URL = "repos.json";
const MEMBER_STYLE_COUNT = 5567;

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

const chromeStoreExtensions = [
  {
    name: "tampermonkey-scripts",
    displayName: "拾图",
    description: "悬停拾取网页图片，通过侧边栏批量下载原图，支持 ZIP、逐张保存和链接导出。",
    html_url: "https://github.com/nevertoday/tampermonkey-scripts",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-06-30T00:00:00+08:00",
    topics: ["chrome-extension", "image-downloader"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/apbkgpggnbpoppbfnehlnjeccnlcnkaj",
    chromeStatus: "待审核",
  },
  {
    name: "xposter",
    displayName: "xPoster",
    description: "A refined Markdown publishing console for X Articles.",
    html_url: "https://github.com/nevertoday/xposter",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 115,
    forks_count: 27,
    pushed_at: "2026-06-17T00:00:00+08:00",
    topics: ["chrome-extension", "markdown", "publishing", "x-articles"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/iimkimodgdjnnmdopeolboakhjmhfbbj",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "obsidian-todo-sync",
    displayName: "曜记 - Obsidian 待办同步",
    description: "在浏览器中管理 Obsidian 日记待办，支持双向同步、番茄钟、灵感捕获和新标签页工作台。",
    html_url: "https://chromewebstore.google.com/detail/ebnjmpnagendlekalpopgeaiimdfpffi",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-06-16T00:00:00+08:00",
    topics: ["chrome-extension", "obsidian", "todo"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/ebnjmpnagendlekalpopgeaiimdfpffi",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "image-crop-tool",
    displayName: "图片裁剪工具",
    description: "在新标签页中用参考线或自由框选裁剪本地图片，支持多图批量导出 PNG 和 ZIP。",
    html_url: "https://chromewebstore.google.com/detail/phdjhhjbapkmagifbejfabimojmjngbe",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-06-04T00:00:00+08:00",
    topics: ["chrome-extension", "image-crop"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/phdjhhjbapkmagifbejfabimojmjngbe",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "flomo-quick-post",
    displayName: "Flomo 快捷发布",
    description: "选中文字、图片或手动输入内容，一键发布到 Flomo，可附带当前页面标题与链接。",
    html_url: "https://chromewebstore.google.com/detail/bknnikaaddepgmbejkaohijglgicdeih",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-05-27T00:00:00+08:00",
    topics: ["chrome-extension", "flomo", "notes"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/bknnikaaddepgmbejkaohijglgicdeih",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "wechat-article-publisher-extension",
    displayName: "闪电发布 - 微信公众号文章发布助手",
    description: "快速批量发布文章到微信公众号草稿箱，支持模板、封面生成、图片排序和多账号管理。",
    html_url: "https://chromewebstore.google.com/detail/nmhknbkojcfmolegpbonpgeogpgpddlj",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-05-15T00:00:00+08:00",
    topics: ["chrome-extension", "wechat", "publishing"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/nmhknbkojcfmolegpbonpgeogpgpddlj",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "wechat-image-replacer",
    displayName: "微信-换图",
    description: "微信公众号编辑器图片批量替换工具，支持 Markdown 链接、小程序链接和智能排序。",
    html_url: "https://chromewebstore.google.com/detail/plgafjeigmmokgakgphfiibkjnlcnadj",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-03-14T00:00:00+08:00",
    topics: ["chrome-extension", "wechat", "images"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/plgafjeigmmokgakgphfiibkjnlcnadj",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "doubao-cache-cleaner",
    displayName: "豆包页面缓存清理",
    description: "为豆包网站添加一键缓存清理按钮，清除 Cookies、Storage、IndexedDB 和 Service Worker。",
    html_url: "https://chromewebstore.google.com/detail/fmkhdfmiojddfefpfgieaeallalpkmpl",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-03-14T00:00:00+08:00",
    topics: ["chrome-extension", "doubao", "cache"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/fmkhdfmiojddfefpfgieaeallalpkmpl",
    chromeStatus: "草稿",
  },
  {
    name: "ocr-image-text-recognition",
    displayName: "OCR 图片文字识别",
    description: "智能图片文字识别工具，支持拖拽、粘贴、URL 输入和多图批量处理。",
    html_url: "https://chromewebstore.google.com/detail/dijgngefjhfdpakpoijekfjfjjfkcaif",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-03-13T00:00:00+08:00",
    topics: ["chrome-extension", "ocr", "image"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/dijgngefjhfdpakpoijekfjfjjfkcaif",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "wechat-tag-tool",
    displayName: "微信公众号标签工具",
    description: "在微信公众号编辑页面添加智能标签栏，支持分组管理、导入导出和侧边栏编辑。",
    html_url: "https://chromewebstore.google.com/detail/kmcpaafnllfohkeffbkioghfjiapfglp",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-03-13T00:00:00+08:00",
    topics: ["chrome-extension", "wechat", "labels"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/kmcpaafnllfohkeffbkioghfjiapfglp",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "wechat-cover-generator",
    displayName: "微信封面生成器",
    description: "快速生成微信封面，自动提取公众号编辑器图片，支持多种模板布局。",
    html_url: "https://chromewebstore.google.com/detail/goofplokifggamlmlplfchbkpplidkfg",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-03-13T00:00:00+08:00",
    topics: ["chrome-extension", "wechat", "cover"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/goofplokifggamlmlplfchbkpplidkfg",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "transparent-element-screenshot",
    displayName: "闪抠",
    description: "页元素透明截图工具，支持对当前网页元素做透明背景截图与批量抠图。",
    html_url: "https://chromewebstore.google.com/detail/pligfejomcfibihagmepbmneinndioom",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-03-07T00:00:00+08:00",
    topics: ["chrome-extension", "screenshot", "image"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/pligfejomcfibihagmepbmneinndioom",
    chromeStatus: "已发布 - 公开发布",
  },
  {
    name: "bookmark-line-indicator",
    displayName: "Bookmark Line Indicator",
    description: "Shows a red line with folder path for bookmarked pages.",
    html_url: "https://chromewebstore.google.com/detail/bhephhfakmbfbdokhkmhegaoimlogalh",
    homepage: null,
    language: "JavaScript",
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2025-05-07T00:00:00+08:00",
    topics: ["chrome-extension", "bookmarks"],
    chromeStoreUrl: "https://chromewebstore.google.com/detail/bhephhfakmbfbdokhkmhegaoimlogalh",
    chromeStatus: "已发布 - 公开发布",
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
const FOOTER_SPECTRUM_STEP_COUNT = 9;

const projectPalette = [
  { name: "墨黑", color: "#111111" },
  { name: "铁灰", color: "#3F3F3F" },
  { name: "中灰", color: "#777777" },
  { name: "石灰", color: "#9A9A9A" },
  { name: "线灰", color: "#B8B8B8" },
  { name: "纸白", color: "#F7F7F7" },
];

const footerColorPalette = [
  { name: "月白", hex: "#F9F4DC" },
  { name: "佛手黄", hex: "#FED71A" },
  { name: "香叶红", hex: "#F07C82" },
  { name: "银朱", hex: "#ED5126" },
  { name: "竹绿", hex: "#1BA784" },
  { name: "美蝶绿", hex: "#12AA9C" },
  { name: "晴山蓝", hex: "#8EC3E6" },
  { name: "釉蓝", hex: "#1781B5" },
  { name: "花青", hex: "#1661AB" },
  { name: "玫瑰紫", hex: "#BA2F7B" },
  { name: "绛紫", hex: "#8B2671" },
  { name: "枣红", hex: "#7C1823" },
  { name: "赭罗", hex: "#9A8878" },
  { name: "茶褐", hex: "#5C3719" },
  { name: "玛瑙灰", hex: "#CFCCC9" },
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
    kind: "Chrome 插件",
    displayName: "xPoster",
    title: "Markdown 发布到 X Articles",
    summary: "预览标题、表格、代码块和图片，再写入 X Article 草稿",
    format: "Chrome MV3",
    intent: "把 Markdown 发到 X",
    chromeStoreUrl: "https://chromewebstore.google.com/detail/iimkimodgdjnnmdopeolboakhjmhfbbj",
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
    title: "悬停拾图，批量下载原图",
    summary: "侧边栏统一管理选图，导出链接、逐张保存或打包 ZIP",
    format: "Chrome MV3",
    intent: "批量下载图片",
    chromeStoreUrl: "https://chromewebstore.google.com/detail/apbkgpggnbpoppbfnehlnjeccnlcnkaj",
    colorName: "墨黑",
    color: "#111111",
  },
  "obsidian-todo-sync": {
    kind: "Chrome 插件",
    title: "Obsidian 待办搬进新标签页",
    summary: "本地 REST API 双向同步日记任务，带番茄钟、快捷添加和灵感捕获",
    format: "Chrome MV3",
    intent: "管理 Obsidian 待办",
    colorName: "铁灰",
    color: "#3F3F3F",
  },
  "image-crop-tool": {
    kind: "Chrome 插件",
    title: "浏览器里的批量切图工作台",
    summary: "参考线或自由框选拆图，支持多图导入、命名和 PNG/ZIP 导出",
    format: "Chrome MV3",
    intent: "裁剪图片",
    colorName: "中灰",
    color: "#777777",
  },
  "flomo-quick-post": {
    kind: "Chrome 插件",
    title: "网页摘录一键发到 Flomo",
    summary: "划词、图片 OCR、AI 处理和侧边栏速记，自动带页面标题与链接",
    format: "Chrome MV3",
    intent: "记录网页灵感",
    colorName: "墨黑",
    color: "#111111",
  },
  "wechat-article-publisher-extension": {
    kind: "Chrome 插件",
    title: "公众号文章批量进草稿箱",
    summary: "TXT 和图片文件夹批量上传，模板排版、封面生成、图片排序一体化",
    format: "Chrome MV3",
    intent: "批量发布公众号",
    colorName: "铁灰",
    color: "#3F3F3F",
  },
  "wechat-image-replacer": {
    kind: "Chrome 插件",
    title: "公众号编辑器批量替换图片",
    summary: "URL 列表按顺序替换微信图片，支持小程序链接、宽度过滤和智能排序",
    format: "Chrome MV3",
    intent: "批量换图",
    colorName: "中灰",
    color: "#777777",
  },
  "doubao-cache-cleaner": {
    kind: "Chrome 插件",
    title: "一键清理豆包页面缓存",
    summary: "清除 Cookies、Storage、IndexedDB 和 Service Worker，带安全开关与确认",
    format: "Chrome MV3",
    intent: "清理页面缓存",
    colorName: "石灰",
    color: "#9A9A9A",
  },
  "ocr-image-text-recognition": {
    kind: "Chrome 插件",
    title: "多图 OCR 识别和整理",
    summary: "拖拽、粘贴、URL 或右键导入图片，支持多 API、历史记录和结果搜索",
    format: "Chrome MV3",
    intent: "识别图片文字",
    colorName: "墨黑",
    color: "#111111",
  },
  "wechat-tag-tool": {
    kind: "Chrome 插件",
    title: "公众号标题标签栏",
    summary: "常用前缀和话术一键复制/替换，标签组本地管理、导入导出",
    format: "Chrome MV3",
    intent: "复用标题标签",
    colorName: "铁灰",
    color: "#3F3F3F",
  },
  "wechat-cover-generator": {
    kind: "Chrome 插件",
    title: "公众号封面侧边栏生成",
    summary: "自动提取编辑器图片，内置多图和镜像模板，生成 940x400 PNG",
    format: "Chrome MV3",
    intent: "生成公众号封面",
    colorName: "中灰",
    color: "#777777",
  },
  "transparent-element-screenshot": {
    kind: "Chrome 插件",
    title: "网页元素透明截图",
    summary: "对当前网页元素做透明背景截图和批量抠图",
    format: "Chrome MV3",
    intent: "透明截图",
    colorName: "墨黑",
    color: "#111111",
  },
  "bookmark-line-indicator": {
    kind: "Chrome 插件",
    title: "收藏页顶部红线提示",
    summary: "打开已收藏页面时显示细红线和文件夹路径，快速识别保存状态",
    format: "Chrome MV3",
    intent: "识别收藏页",
    colorName: "铁灰",
    color: "#3F3F3F",
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

  const nextCount = String(MEMBER_STYLE_COUNT);
  counts.forEach((count) => {
    count.textContent = nextCount;
  });
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
  const chromeStoreUrl = view.profile.chromeStoreUrl || view.repo.chromeStoreUrl;
  if (chromeStoreUrl && chromeStoreUrl.startsWith("http")) {
    return {
      label: view.repo.chromeStatus?.includes("已发布") ? "安装" : "商店页",
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

function isGithubUrl(url) {
  return /^https:\/\/github\.com\//i.test(String(url || ""));
}

function mergeProjectTopics(first = [], second = []) {
  return [...new Set([...(Array.isArray(first) ? first : []), ...(Array.isArray(second) ? second : [])])];
}

function latestDate(first, second) {
  const firstTime = new Date(first || 0).getTime();
  const secondTime = new Date(second || 0).getTime();
  return secondTime > firstTime ? second : first;
}

function mergeChromeStoreExtensions(repos) {
  const byName = new Map(repos.map((repo) => [repo.name, { ...repo }]));

  chromeStoreExtensions.forEach((extension) => {
    const current = byName.get(extension.name);
    if (!current) {
      byName.set(extension.name, { ...extension });
      return;
    }

    byName.set(extension.name, {
      ...current,
      displayName: extension.displayName || current.displayName,
      description: extension.description || current.description,
      html_url: isGithubUrl(current.html_url) ? current.html_url : extension.html_url,
      homepage: current.homepage || extension.homepage,
      language: current.language || extension.language,
      fork: current.fork ?? extension.fork ?? false,
      stargazers_count: current.stargazers_count ?? extension.stargazers_count ?? 0,
      forks_count: current.forks_count ?? extension.forks_count ?? 0,
      pushed_at: latestDate(current.pushed_at, extension.pushed_at),
      topics: mergeProjectTopics(current.topics, extension.topics),
      chromeStoreUrl: extension.chromeStoreUrl,
      chromeStatus: extension.chromeStatus,
    });
  });

  return [...byName.values()];
}

function filterDisplayRepos(repos) {
  return repos
    .filter((repo) => !repo.fork)
    .filter((repo) => !hiddenProjectNames.has(repo.name))
    .filter((repo) => !/-privacy$/i.test(repo.name) && !/privacy-policy/i.test(repo.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

function getReposSignature(repos) {
  return repos.map((repo) => `${repo.name}:${repo.pushed_at}:${repo.stargazers_count}:${repo.forks_count}:${repo.chromeStoreUrl || ""}:${repo.chromeStatus || ""}`).join("|");
}

function updateRepos(repos) {
  const filteredRepos = filterDisplayRepos(mergeChromeStoreExtensions(repos));
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
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back to the textarea path below for browsers that block Clipboard API.
  }

  const textarea = document.createElement("textarea");
  const selection = document.getSelection();
  const selectedRange = selection?.rangeCount ? selection.getRangeAt(0) : null;

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  if (selectedRange && selection) {
    selection.removeAllRanges();
    selection.addRange(selectedRange);
  }

  return copied;
}

function footerColorButtons() {
  return [...document.querySelectorAll(FOOTER_COLOR_SELECTOR)];
}

function footerCopyValue(color) {
  return `${color.name} ${color.hex}`;
}

function normalizeFooterColor(color) {
  if (!color || typeof color !== "object") return null;

  const hex = color.hex || color.color || color.value;
  if (typeof hex !== "string" || !hex.startsWith("#")) return null;

  return {
    name: color.name || color.title || color.label || hex,
    hex,
  };
}

function footerSpectrumPalette() {
  const injectedColors = Array.isArray(window.TRADITIONAL_COLOR_IMAGES)
    ? window.TRADITIONAL_COLOR_IMAGES.map(normalizeFooterColor).filter(Boolean)
    : [];

  return injectedColors.length ? injectedColors : footerColorPalette;
}

function setFooterButtonColor(button, color, index) {
  const copyValue = footerCopyValue(color);
  button.style.setProperty("--spectrum-color", color.hex);
  button.style.setProperty("--spectrum-index", String((index % FOOTER_SPECTRUM_STEP_COUNT) + 1));
  button.style.removeProperty("--spectrum-height");
  button.dataset.footerCopyValue = copyValue;
  button.title = `复制 ${copyValue}`;
  button.setAttribute("aria-label", `复制 ${color.name} 色值 ${color.hex}`);
}

function buildFooterSpectrum(buttons = footerColorButtons()) {
  if (!buttons.length) return;

  const colors = randomItems(footerSpectrumPalette(), buttons.length);
  buttons.forEach((button, index) => {
    setFooterButtonColor(button, colors[index % colors.length], index);
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
    showFooterCopyToast(`已复制：${copyValue}`);
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
  const displayName = escapeCopy(profile.displayName || repo.displayName || repo.name);
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
