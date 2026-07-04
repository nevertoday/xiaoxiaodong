import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptJs = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(
  indexHtml,
  /<a\s+href="#chrome-extensions">谷歌插件<\/a>/,
  "primary navigation should include a 谷歌插件 category"
);

assert.match(
  indexHtml,
  /<section\s+id="chrome-extensions"[^>]*>/,
  "page should expose a chrome extensions anchor section"
);

assert.match(
  indexHtml,
  /data-chrome-extension-grid/,
  "chrome extensions section should include a render target"
);

assert.match(
  scriptJs,
  /function\s+renderChromeExtensions\s*\(/,
  "script should render chrome extensions separately"
);
