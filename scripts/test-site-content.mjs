import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptJs = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const projectsStart = indexHtml.indexOf('<section id="projects"');
const skillsStart = indexHtml.indexOf('<section id="skills"');
const projectsMarkup = indexHtml.slice(projectsStart, skillsStart);
const assetVersion = "20260704-project-groups";

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
  indexHtml,
  new RegExp(`styles\\.css\\?v=${assetVersion}`),
  "stylesheet URL should be cache-busted for the project grouping change"
);

assert.match(
  indexHtml,
  new RegExp(`script\\.js\\?v=${assetVersion}`),
  "script URL should be cache-busted for the project grouping change"
);
