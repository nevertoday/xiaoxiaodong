const INDEX_PATH = new URL("../index.html", import.meta.url);
const MEMBER_STYLE_COUNT = 5567;

function formatCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`Invalid style count: ${value}`);
  }
  return String(Math.round(count));
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

const count = formatCount(MEMBER_STYLE_COUNT);
await updateIndex(count);
