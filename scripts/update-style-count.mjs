const STATS_URL = "https://vip.xiaoxiaodong.ai/api/public-stats";
const INDEX_PATH = new URL("../index.html", import.meta.url);

function formatCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`Invalid style count: ${value}`);
  }
  return String(Math.round(count));
}

async function fetchStyleCount() {
  const response = await fetch(STATS_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Stats request failed: ${response.status}`);
  }

  const stats = await response.json();
  return formatCount(stats.styles);
}

async function updateIndex(count) {
  const { readFile, writeFile } = await import("node:fs/promises");
  const html = await readFile(INDEX_PATH, "utf8");
  const nextHtml = html.replaceAll(
    /(<(?:strong|span) data-style-count>)([\d,]+)(<\/(?:strong|span)>)/g,
    `$1${count}$3`,
  );

  if (nextHtml === html) {
    console.log(`Style count already ${count}`);
    return;
  }

  await writeFile(INDEX_PATH, nextHtml);
  console.log(`Updated style count to ${count}`);
}

const count = await fetchStyleCount();
await updateIndex(count);
