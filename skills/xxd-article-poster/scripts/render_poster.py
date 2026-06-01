#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from typing import Any
from urllib.parse import urlparse


RATIOS = {
    "3:4": (1440, 1920),
    "4:5": (1440, 1800),
    "9:16": (1080, 1920),
    "1:1": (1440, 1440),
    "16:9": (1920, 1080),
    "4:3": (1600, 1200),
}

DEFAULT_PALETTE = {
    "background": "#F7F3EA",
    "ink": "#121212",
    "muted": "#5B5B5B",
    "panel": "#FFFFFF",
    "panel2": "#EAF3F2",
    "accent": "#E94F37",
    "accent2": "#116D6E",
}


def esc(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)


def text_len(value: str) -> int:
    cjk = len(re.findall(r"[\u4e00-\u9fff]", value))
    other = len(re.sub(r"[\u4e00-\u9fff\s]", "", value))
    return cjk + max(1, other // 2)


def trim(value: Any, limit: int, warnings: list[str], field: str) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if text_len(text) <= limit:
        return text
    result = ""
    score = 0
    for char in text:
        score += 1 if re.match(r"[\u4e00-\u9fff]", char) else (0 if char.isspace() else 0.5)
        if score > limit:
            break
        result += char
    warnings.append(f"Trimmed over-budget field: {field}")
    return result.rstrip("，,。.;；:： ") + "..."


def slugify(value: str, fallback: str) -> str:
    ascii_slug = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return (ascii_slug[:48] or fallback).strip("-")


def find_chrome() -> str | None:
    candidates = [
        "google-chrome",
        "chromium",
        "chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    for candidate in candidates:
        if "/" in candidate:
            if Path(candidate).exists():
                return candidate
        else:
            found = shutil.which(candidate)
            if found:
                return found
    return None


def source_to_uri(src: str) -> str:
    if not src:
        return ""
    parsed = urlparse(src)
    if parsed.scheme in {"http", "https", "data", "file"}:
        return src
    path = Path(src).expanduser()
    if path.exists():
        return path.resolve().as_uri()
    return src


def normalize_sections(poster: dict[str, Any], warnings: list[str]) -> list[dict[str, Any]]:
    raw_sections = poster.get("sections") or []
    if isinstance(raw_sections, dict):
        raw_sections = [{"heading": key, "bullets": value} for key, value in raw_sections.items()]
    sections: list[dict[str, Any]] = []
    for idx, section in enumerate(raw_sections[:4], start=1):
        if isinstance(section, str):
            heading = f"要点 {idx}"
            bullets = [section]
        else:
            heading = section.get("heading") or section.get("title") or f"要点 {idx}"
            bullets = section.get("bullets") or section.get("items") or section.get("body") or []
            if isinstance(bullets, str):
                bullets = [bullets]
        sections.append(
            {
                "heading": trim(heading, 14, warnings, f"sections[{idx}].heading"),
                "bullets": [trim(bullet, 42, warnings, f"sections[{idx}].bullets") for bullet in list(bullets)[:3]],
            }
        )
        if len(list(bullets)) > 3:
            warnings.append(f"Dropped extra bullets in section {idx}")
    if len(raw_sections) > 4:
        warnings.append("Dropped extra sections beyond 4; split into multiple posters if needed.")
    return sections


def normalize_visuals(poster: dict[str, Any], warnings: list[str]) -> list[dict[str, str]]:
    visuals = poster.get("visuals") or poster.get("images") or []
    result: list[dict[str, str]] = []
    for idx, visual in enumerate(visuals[:4], start=1):
        if isinstance(visual, str):
            src = visual
            caption = ""
        else:
            src = visual.get("src") or visual.get("url") or visual.get("path") or ""
            caption = visual.get("caption") or visual.get("alt") or ""
        if src:
            result.append({"src": source_to_uri(src), "caption": trim(caption, 20, warnings, f"visuals[{idx}].caption")})
    if len(visuals) > 4:
        warnings.append("Dropped extra visuals beyond 4.")
    return result


def font_sizes(title: str, core: str, ratio: str) -> dict[str, int]:
    landscape = ratio in {"16:9", "4:3"}
    title_score = text_len(title)
    core_score = text_len(core)
    if landscape:
        title_size = 92 if title_score < 18 else 76 if title_score < 30 else 62
        core_size = 50 if core_score < 36 else 42
    else:
        title_size = 122 if title_score < 14 else 104 if title_score < 24 else 84 if title_score < 36 else 68
        core_size = 66 if core_score < 32 else 54 if core_score < 52 else 46
    return {"title": title_size, "core": core_size}


def render_html(poster: dict[str, Any], ratio: str, index: int, total: int, warnings: list[str]) -> str:
    width, height = RATIOS[ratio]
    palette = {**DEFAULT_PALETTE, **(poster.get("palette") or {})}
    title = trim(poster.get("title") or "一图读懂", 36, warnings, "title")
    kicker = trim(poster.get("kicker") or ("xxd-article-poster" if total == 1 else f"{index:02d}/{total:02d}"), 20, warnings, "kicker")
    subtitle = trim(poster.get("subtitle") or "", 62, warnings, "subtitle")
    core = trim(poster.get("core") or poster.get("summary") or "请补充这张海报的核心判断。", 58, warnings, "core")
    quote = trim(poster.get("quote") or poster.get("memory_line") or "", 58, warnings, "quote")
    source_note = trim(poster.get("source_note") or poster.get("source") or "", 48, warnings, "source_note")
    sections = normalize_sections(poster, warnings)
    visuals = normalize_visuals(poster, warnings)
    sizes = font_sizes(title, core, ratio)
    landscape = ratio in {"16:9", "4:3"}
    root_class = "landscape" if landscape else "portrait"

    section_html = "\n".join(
        f"""
        <section class="block">
          <div class="block-index">{idx:02d}</div>
          <h2>{esc(section["heading"])}</h2>
          <ul>{''.join(f'<li>{esc(bullet)}</li>' for bullet in section["bullets"])}</ul>
        </section>
        """
        for idx, section in enumerate(sections, start=1)
    )
    if not section_html:
        section_html = """
        <section class="block">
          <div class="block-index">01</div>
          <h2>核心信息</h2>
          <ul><li>请在 JSON 中加入 sections，让海报可读性更强。</li></ul>
        </section>
        """

    visual_html = ""
    if visuals:
        visual_html = '<aside class="visuals">' + "".join(
            f"""
            <figure>
              <img src="{esc(visual["src"])}" alt="{esc(visual["caption"])}">
              {f'<figcaption>{esc(visual["caption"])}</figcaption>' if visual["caption"] else ''}
            </figure>
            """
            for visual in visuals
        ) + "</aside>"

    quote_html = f'<div class="quote">{esc(quote)}</div>' if quote else ""
    subtitle_html = f'<p class="subtitle">{esc(subtitle)}</p>' if subtitle else ""
    source_html = f'<footer>{esc(source_note)}</footer>' if source_note else "<footer>30-45 秒快速理解版</footer>"

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width={width}, initial-scale=1">
  <title>{esc(title)}</title>
  <style>
    :root {{
      --bg: {palette["background"]};
      --ink: {palette["ink"]};
      --muted: {palette["muted"]};
      --panel: {palette["panel"]};
      --panel2: {palette["panel2"]};
      --accent: {palette["accent"]};
      --accent2: {palette["accent2"]};
      --title-size: {sizes["title"]}px;
      --core-size: {sizes["core"]}px;
    }}
    html, body {{
      width: {width}px;
      height: {height}px;
      margin: 0;
      background: #d9d9d9;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
      color: var(--ink);
    }}
    .poster {{
      width: {width}px;
      height: {height}px;
      padding: {70 if landscape else 88}px;
      overflow: hidden;
      background:
        linear-gradient(135deg, rgba(233,79,55,.16), rgba(17,109,110,.08) 38%, transparent 62%),
        radial-gradient(circle at 88% 8%, rgba(17,109,110,.16), transparent 25%),
        var(--bg);
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: {32 if landscape else 44}px;
    }}
    .kicker {{
      display: flex;
      align-items: center;
      gap: 18px;
      color: var(--accent2);
      font-size: {24 if landscape else 28}px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }}
    .kicker::before {{
      content: "";
      width: 86px;
      height: 10px;
      background: var(--accent);
      border-radius: 99px;
      display: inline-block;
    }}
    .hero {{
      display: grid;
      grid-template-columns: {"1.05fr .95fr" if landscape else "1fr"};
      gap: {44 if landscape else 28}px;
      align-items: end;
    }}
    h1 {{
      margin: 0;
      max-width: {760 if landscape else 1180}px;
      font-size: var(--title-size);
      line-height: .96;
      font-weight: 950;
      letter-spacing: 0;
    }}
    .subtitle {{
      margin: {22 if landscape else 28}px 0 0;
      max-width: {700 if landscape else 1040}px;
      color: var(--muted);
      font-size: {30 if landscape else 34}px;
      line-height: 1.42;
      font-weight: 600;
    }}
    .core {{
      border-left: {14 if landscape else 18}px solid var(--accent);
      padding: {22 if landscape else 30}px {28 if landscape else 34}px;
      background: rgba(255,255,255,.72);
      box-shadow: inset 0 0 0 2px rgba(18,18,18,.08);
      font-size: var(--core-size);
      line-height: 1.12;
      font-weight: 900;
    }}
    .content {{
      min-height: 0;
      display: grid;
      grid-template-columns: {"1.25fr .75fr" if visuals and not landscape else "1fr"};
      gap: {28 if landscape else 30}px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: {"repeat(2, minmax(0, 1fr))" if not landscape else "repeat(4, minmax(0, 1fr))"};
      gap: {24 if landscape else 28}px;
      min-height: 0;
    }}
    .block {{
      position: relative;
      min-width: 0;
      padding: {28 if landscape else 34}px;
      border-radius: {22 if landscape else 28}px;
      background: var(--panel);
      box-shadow: inset 0 0 0 2px rgba(18,18,18,.06);
    }}
    .block:nth-child(even) {{ background: var(--panel2); }}
    .block-index {{
      color: var(--accent);
      font-size: {28 if landscape else 34}px;
      font-weight: 950;
      line-height: 1;
      margin-bottom: {16 if landscape else 20}px;
    }}
    h2 {{
      margin: 0 0 {16 if landscape else 18}px;
      font-size: {30 if landscape else 38}px;
      line-height: 1.12;
      font-weight: 900;
    }}
    ul {{
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: {11 if landscape else 14}px;
    }}
    li {{
      position: relative;
      padding-left: {22 if landscape else 28}px;
      font-size: {24 if landscape else 31}px;
      line-height: 1.36;
      font-weight: 650;
      color: #252525;
    }}
    li::before {{
      content: "";
      position: absolute;
      left: 0;
      top: .62em;
      width: {8 if landscape else 10}px;
      height: {8 if landscape else 10}px;
      border-radius: 50%;
      background: var(--accent2);
    }}
    .visuals {{
      display: grid;
      grid-template-columns: {"repeat(2, 1fr)" if landscape else "1fr"};
      gap: 20px;
      min-height: 0;
    }}
    figure {{
      margin: 0;
      min-height: 0;
      border-radius: 28px;
      overflow: hidden;
      background: #111;
      position: relative;
    }}
    img {{
      width: 100%;
      height: 100%;
      min-height: {200 if landscape else 260}px;
      object-fit: cover;
      display: block;
    }}
    figcaption {{
      position: absolute;
      left: 16px;
      right: 16px;
      bottom: 16px;
      padding: 10px 14px;
      border-radius: 14px;
      background: rgba(0,0,0,.58);
      color: white;
      font-size: {18 if landscape else 22}px;
      line-height: 1.25;
      font-weight: 700;
    }}
    .bottom {{
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 26px;
      align-items: end;
      border-top: 3px solid rgba(18,18,18,.16);
      padding-top: {20 if landscape else 24}px;
    }}
    .quote {{
      color: var(--accent2);
      font-size: {30 if landscape else 38}px;
      line-height: 1.16;
      font-weight: 950;
    }}
    footer {{
      color: var(--muted);
      font-size: {20 if landscape else 24}px;
      line-height: 1.25;
      font-weight: 700;
      text-align: right;
      max-width: 520px;
    }}
  </style>
</head>
<body>
  <main class="poster {root_class}">
    <div class="kicker">{esc(kicker)}</div>
    <section class="hero">
      <div>
        <h1>{esc(title)}</h1>
        {subtitle_html}
      </div>
      <div class="core">{esc(core)}</div>
    </section>
    <section class="content">
      <div class="grid">{section_html}</div>
      {visual_html}
    </section>
    <section class="bottom">
      {quote_html}
      {source_html}
    </section>
  </main>
</body>
</html>
"""


def coerce_posters(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict) and isinstance(data.get("posters"), list):
        return [item for item in data["posters"] if isinstance(item, dict)]
    if isinstance(data, dict):
        return [data]
    raise ValueError("Poster JSON must be an object, a list, or an object with a posters array.")


def output_base(output: str, multiple: bool, title: str, index: int, stamp: str) -> Path:
    target = Path(output or "~/Desktop").expanduser()
    suffix = target.suffix.lower()
    slug = slugify(title, f"poster-{index:02d}")
    if multiple:
        folder = target.parent / target.stem if suffix else target / f"xxd-article-poster-{stamp}"
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"{index:02d}-{slug}"
    if suffix in {".png", ".html"}:
        target.parent.mkdir(parents=True, exist_ok=True)
        return target.with_suffix("")
    target.mkdir(parents=True, exist_ok=True)
    return target / f"xxd-article-poster-{stamp}-{slug}"


def capture_png(chrome: str, html_path: Path, png_path: Path, width: int, height: int) -> tuple[bool, str]:
    command = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        f"--window-size={width},{height}",
        "--virtual-time-budget=1000",
        f"--screenshot={png_path}",
        html_path.resolve().as_uri(),
    ]
    proc = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
    if proc.returncode != 0:
        return False, (proc.stderr or proc.stdout).strip()
    return True, ""


def main() -> int:
    parser = argparse.ArgumentParser(description="Render article poster JSON to HTML and PNG.")
    parser.add_argument("input", help="Poster JSON file.")
    parser.add_argument("--output", default=str(Path.home() / "Desktop"), help="Output directory or file. Defaults to ~/Desktop.")
    parser.add_argument("--ratio", default="3:4", choices=sorted(RATIOS))
    parser.add_argument("--html-only", action="store_true", help="Do not capture PNG.")
    args = parser.parse_args()

    input_path = Path(args.input).expanduser()
    data = json.loads(input_path.read_text(encoding="utf-8"))
    posters = coerce_posters(data)
    if not posters:
        raise SystemExit("No poster objects found.")

    width, height = RATIOS[args.ratio]
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    chrome = None if args.html_only else find_chrome()
    outputs: list[dict[str, Any]] = []
    all_warnings: list[str] = []

    for index, poster in enumerate(posters, start=1):
        warnings: list[str] = []
        title = str(poster.get("title") or f"Poster {index}")
        base = output_base(args.output, len(posters) > 1, title, index, stamp)
        html_path = base.with_suffix(".html")
        png_path = base.with_suffix(".png")
        html_path.write_text(render_html(poster, args.ratio, index, len(posters), warnings), encoding="utf-8")
        png_status = "skipped"
        png_error = ""
        if not args.html_only:
            if chrome:
                ok, png_error = capture_png(chrome, html_path, png_path, width, height)
                png_status = "created" if ok else "failed"
            else:
                png_status = "chrome-not-found"
                png_error = "Chrome/Chromium not found. Set CHROME_BIN or install Chrome."
        outputs.append(
            {
                "index": index,
                "title": title,
                "html": str(html_path),
                "png": str(png_path) if png_path.exists() else "",
                "png_status": png_status,
                "png_error": png_error,
                "warnings": warnings,
            }
        )
        all_warnings.extend(warnings)

    manifest_dir = Path(outputs[0]["html"]).parent
    manifest = {
        "created_at": dt.datetime.now().isoformat(timespec="seconds"),
        "ratio": args.ratio,
        "size": {"width": width, "height": height},
        "outputs": outputs,
        "warnings": all_warnings,
    }
    manifest_path = manifest_dir / "render_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"manifest: {manifest_path}")
    for item in outputs:
        print(f"html: {item['html']}")
        print(f"png_status: {item['png_status']}")
        if item["png"]:
            print(f"png: {item['png']}")
        if item["png_error"]:
            print(f"png_error: {item['png_error']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
