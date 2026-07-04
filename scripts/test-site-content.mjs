import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptJs = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const projectsStart = indexHtml.indexOf('<section id="projects"');
const skillsStart = indexHtml.indexOf('<section id="skills"');
const projectsMarkup = indexHtml.slice(projectsStart, skillsStart);
const assetVersion = "20260704-extension-icons";
const chromeExtensionIcons = [
  "tampermonkey-scripts.jpg",
  "xposter.jpg",
  "obsidian-todo-sync.jpg",
  "image-crop-tool.jpg",
  "flomo-quick-post.jpg",
  "wechat-article-publisher-extension.jpg",
  "wechat-image-replacer.jpg",
  "doubao-cache-cleaner.svg",
  "ocr-image-text-recognition.jpg",
  "wechat-tag-tool.jpg",
  "wechat-cover-generator.jpg",
  "transparent-element-screenshot.jpg",
  "bookmark-line-indicator.jpg",
];

assert.match(
  indexHtml,
  /<a\s+href="#chrome-extensions">谷歌插件<\/a>/,
  "primary navigation should include a 谷歌插件 category"
);

assert.ok(projectsStart >= 0 && skillsStart > projectsStart, "projects section should exist before skills");

assert.doesNotMatch(
  indexHtml,
  /<section\s+id="chrome-extensions"[^>]*>/,
  "chrome extensions should not be a standalone page section"
);

assert.match(
  projectsMarkup,
  /id="chrome-extensions"/,
  "projects section should include a chrome extensions category anchor"
);

assert.match(
  projectsMarkup,
  /data-chrome-extension-grid/,
  "projects section should include a chrome extensions render target"
);

assert.match(
  projectsMarkup,
  /data-github-project-grid/,
  "projects section should include a GitHub projects render target"
);

assert.match(
  scriptJs,
  /function\s+renderChromeExtensions\s*\(/,
  "script should render chrome extensions separately"
);

assert.match(
  scriptJs,
  /class="project-store-state"/,
  "chrome extension cards should include store status metadata"
);

assert.match(
  scriptJs,
  /isChromeExtension\s+\?\s+"project-card is-chrome-extension"/,
  "chrome extension cards should have a dedicated class for presentation"
);

for (const iconName of chromeExtensionIcons) {
  const iconPath = `assets/icons/chrome-extensions/${iconName}`;
  const escapedIconPath = iconPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(scriptJs, new RegExp(escapedIconPath), `${iconPath} should be mapped in script.js`);
  assert.ok(existsSync(new URL(`../${iconPath}`, import.meta.url)), `${iconPath} should exist`);
}

assert.match(
  indexHtml,
  new RegExp(`styles\\.css\\?v=${assetVersion}`),
  "stylesheet URL should be cache-busted for the extension icon change"
);

assert.match(
  indexHtml,
  new RegExp(`script\\.js\\?v=${assetVersion}`),
  "script URL should be cache-busted for the extension icon change"
);
