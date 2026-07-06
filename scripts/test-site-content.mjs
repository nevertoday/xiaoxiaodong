import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptJs = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const stylesCss = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const communityStart = indexHtml.indexOf('<section id="community"');
const promptLibraryStart = indexHtml.indexOf('<section id="prompt-library"');
const contactStart = indexHtml.indexOf('<section id="contact"');
const communityMarkup = indexHtml.slice(communityStart, promptLibraryStart);
const promptLibraryMarkup = indexHtml.slice(promptLibraryStart, contactStart);
const projectsStart = indexHtml.indexOf('<section id="projects"');
const skillsStart = indexHtml.indexOf('<section id="skills"');
const projectsMarkup = indexHtml.slice(projectsStart, skillsStart);
const footerStart = indexHtml.indexOf('<footer class="site-footer">');
const footerEnd = indexHtml.indexOf("</footer>", footerStart);
const footerMarkup = indexHtml.slice(footerStart, footerEnd);
const assetVersion = "20260706-prompt-library-section-v1";
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

assert.match(
  indexHtml,
  /<a\s+href="#prompt-library">提示词库<\/a>/,
  "primary navigation should include a 提示词库 category"
);

assert.ok(
  communityStart >= 0 && promptLibraryStart > communityStart && contactStart > promptLibraryStart,
  "community, prompt library, and contact sections should be separate and ordered"
);

assert.match(
  communityMarkup,
  /<h2>知识星球<\/h2>/,
  "community section should be the knowledge planet section"
);

assert.match(
  communityMarkup,
  /扫码加入星球[\s\S]*星球会员也可以解锁成员提示词库/,
  "knowledge planet section should explain that planet members unlock the prompt library"
);

assert.match(
  communityMarkup,
  /扫码加入知识星球/,
  "community section should keep the knowledge planet QR entry"
);

assert.doesNotMatch(
  communityMarkup,
  /<h2>成员提示词库<\/h2>|prompt-library-entry|699 元\/年/,
  "prompt library should not be merged into the knowledge planet section"
);

assert.match(
  promptLibraryMarkup,
  /<section id="prompt-library" class="prompt-library-section"/,
  "prompt library should be a standalone page section"
);

assert.match(
  promptLibraryMarkup,
  /<h2>成员提示词库<\/h2>/,
  "prompt library section should have its own heading"
);

assert.match(
  promptLibraryMarkup,
  /成员提示词库是同一付费体系下的独立服务栏目，单独开通 699 元\/年/,
  "prompt library service should state the standalone annual price"
);

assert.match(
  promptLibraryMarkup,
  /prompt-library-count[\s\S]*data-style-count[\s\S]*套提示词风格/,
  "prompt library section should show the style count"
);

assert.match(
  stylesCss,
  /#prompt-library\s*{[^}]*order:\s*3/s,
  "prompt library should have its own section order between community and contact"
);

assert.doesNotMatch(
  scriptJs,
  /initCommunityTabs|data-community-tab|data-community-panel/,
  "script should not contain obsolete community tab behavior"
);

assert.match(
  stylesCss,
  /main > \.prompt-library-section,[\s\S]*?display:\s*grid\s*!important/s,
  "prompt library section should have standalone section styling"
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
  stylesCss,
  /main #chrome-extensions \.project-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  "chrome extensions should stay in the existing single-column project list layout"
);

assert.doesNotMatch(
  stylesCss,
  /main #chrome-extensions \.project-grid\s*{[^}]*repeat\(2,/s,
  "chrome extensions should not render multiple cards in one row"
);

assert.match(
  stylesCss,
  /main #chrome-extensions \.project-card\.is-chrome-extension \.app-icon\s*{[^}]*object-fit:\s*cover/s,
  "chrome extension icons should fill their icon area"
);

assert.match(
  indexHtml,
  /class="footer-logo-outline"/,
  "footer should use the outlined brand mark variant"
);

assert.doesNotMatch(
  indexHtml,
  /class="footer-mark"|class="footer-line-mark"|data-footer-color|footer-spectrum|footer-copy-toast/,
  "footer should not include the old header-style mark, custom line mark, or color-copy controls"
);

assert.ok(footerStart >= 0 && footerEnd > footerStart, "footer should exist");

assert.equal(
  (footerMarkup.match(/<(?:(?:div)|nav)\s+class="footer-(?:brand|links|meta)"/g) || []).length,
  3,
  "footer should have at most three direct information sections"
);

assert.match(
  stylesCss,
  /\.site-footer::before\s*{[^}]*content:\s*none\s*!important/s,
  "footer should not draw a duplicate top rule"
);

assert.match(
  stylesCss,
  /\.site-footer,[\s\S]*?padding-inline:\s*var\(--chrome-edge\)\s*!important/s,
  "footer should align to the same horizontal edge as the header"
);

assert.match(
  stylesCss,
  /\.site-footer \.footer-brand\s*{[^}]*display:\s*grid\s*!important[^}]*grid-template-columns:\s*auto minmax\(0,\s*max-content\)\s*!important[^}]*justify-self:\s*start\s*!important/s,
  "desktop footer brand should use a compact logo/text lockup at the header logo edge"
);

assert.match(
  stylesCss,
  /\.site-footer \.footer-note\s*{[^}]*grid-area:\s*auto\s*!important/s,
  "footer note should not keep the old footer grid area inside the brand lockup"
);

assert.match(
  stylesCss,
  /@media \(max-width:\s*960px\)[\s\S]*?\.site-footer[\s\S]*?text-align:\s*center\s*!important/s,
  "narrow footer layout should center its content"
);

assert.match(
  stylesCss,
  /@media \(max-width:\s*960px\)[\s\S]*?\.site-footer \.footer-brand\s*{[^}]*justify-self:\s*center\s*!important[^}]*justify-content:\s*center\s*!important/s,
  "narrow footer brand lockup should be centered as one unit"
);

assert.match(
  stylesCss,
  /@media \(max-width:\s*960px\)[\s\S]*?\.site-footer \.footer-links,[\s\S]*?\.site-footer \.footer-meta[\s\S]*?justify-content:\s*center\s*!important/s,
  "narrow footer links and metadata should be centered"
);

assert.match(
  stylesCss,
  /main #chrome-extensions \.project-card\.is-chrome-extension \.app-icon\s*{[^}]*border-radius:\s*16px\s*!important/s,
  "chrome extension icons should have app-like rounded corners"
);

assert.match(
  indexHtml,
  /href="#chrome-extensions">谷歌插件/,
  "footer should keep a direct Chrome extension navigation link"
);

assert.match(
  scriptJs,
  /class="skill-modal-content" tabindex="-1"/,
  "skill modal should render a dedicated scrollable content region"
);

assert.match(
  stylesCss,
  /\.skill-modal-panel,[\s\S]*?overflow:\s*hidden\s*!important/s,
  "skill modal panel should keep the title bar fixed while content scrolls"
);

assert.match(
  stylesCss,
  /\.skill-modal-content\s*{[\s\S]*?overflow:\s*auto\s*!important/s,
  "skill modal body content should scroll independently"
);

assert.doesNotMatch(
  scriptJs,
  /initFooterSpectrum|data-footer-color|footerColorPalette|execCommand\("copy"\)/,
  "footer color-copy JavaScript should be removed"
);

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
