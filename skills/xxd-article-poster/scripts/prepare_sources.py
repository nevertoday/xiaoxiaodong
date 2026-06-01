#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import tempfile
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


TEXT_EXTS = {".txt", ".md", ".markdown", ".html", ".htm", ".rst", ".csv", ".json"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".tiff"}
SKIP_DIRS = {".git", ".hg", ".svn", "node_modules", "dist", "build", ".next", ".nuxt", "__pycache__"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "canvas", "form", "button", "nav", "header", "footer", "aside"}
BLOCK_TAGS = {"p", "br", "li", "blockquote", "h1", "h2", "h3", "h4", "section", "article", "main", "div", "tr"}


class TextHTMLParser(HTMLParser):
    def __init__(self, base_url: str | None = None) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.skip_depth = 0
        self.in_title = False
        self.title_parts: list[str] = []
        self.parts: list[str] = []
        self.images: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attr = {k.lower(): v or "" for k, v in attrs}
        if tag in SKIP_TAGS:
            self.skip_depth += 1
            return
        if tag == "title":
            self.in_title = True
        if tag == "img":
            src = attr.get("src") or attr.get("data-src") or attr.get("data-original") or ""
            if src:
                self.images.append(
                    {
                        "src": urljoin(self.base_url, src) if self.base_url else src,
                        "alt": html.unescape(attr.get("alt", "")).strip(),
                    }
                )
        if tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
            return
        if tag == "title":
            self.in_title = False
        if tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        text = re.sub(r"\s+", " ", data).strip()
        if not text:
            return
        if self.in_title:
            self.title_parts.append(text)
        else:
            self.parts.append(text + " ")

    @property
    def title(self) -> str:
        return " ".join(self.title_parts).strip()

    @property
    def text(self) -> str:
        text = "".join(self.parts)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        return html.unescape(text).strip()


def is_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def read_limited(path: Path, max_chars: int) -> tuple[str, bool]:
    data = path.read_text(encoding="utf-8", errors="replace")
    truncated = len(data) > max_chars
    return data[:max_chars], truncated


def parse_html(raw: str, base_url: str | None = None) -> tuple[str, str, list[dict[str, str]]]:
    parser = TextHTMLParser(base_url)
    parser.feed(raw)
    return parser.title, parser.text, parser.images


def markdown_images(raw: str, base_path: Path) -> list[dict[str, str]]:
    images: list[dict[str, str]] = []
    for match in re.finditer(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)", raw):
        alt = match.group(1).strip()
        src = match.group(2).strip().strip("<>")
        parsed = urlparse(src)
        if parsed.scheme in {"http", "https", "data"}:
            resolved = src
        else:
            candidate = (base_path.parent / src).expanduser()
            resolved = str(candidate.resolve()) if candidate.exists() else src
        images.append({"src": resolved, "alt": alt})
    return images


def collect_url(url: str, max_chars: int, timeout: int) -> dict[str, Any]:
    item: dict[str, Any] = {
        "kind": "url",
        "location": url,
        "title": url,
        "text": "",
        "images": [],
        "warnings": [],
    }
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 xxd-article-poster/1.0"})
        with urlopen(req, timeout=timeout) as response:
            content_type = response.headers.get("content-type", "")
            body = response.read()
    except Exception as exc:  # noqa: BLE001
        item["warnings"].append(f"URL fetch failed: {exc}")
        item["needs_browser"] = True
        return item

    if content_type.startswith("image/"):
        item["kind"] = "image-url"
        item["images"] = [{"src": url, "alt": ""}]
        return item

    charset = "utf-8"
    match = re.search(r"charset=([\w.-]+)", content_type)
    if match:
        charset = match.group(1)
    raw = body.decode(charset, errors="replace")

    if "html" in content_type or re.search(r"<html|<article|<body", raw, re.I):
        title, text, images = parse_html(raw, url)
        item["title"] = title or url
        item["text"] = text[:max_chars]
        item["images"] = images[:40]
        if len(text) > max_chars:
            item["truncated"] = True
        if len(text) < 500:
            item["warnings"].append("Static extraction found little text; browser fallback may be needed.")
            item["needs_browser"] = True
    else:
        item["text"] = raw[:max_chars]
        if len(raw) > max_chars:
            item["truncated"] = True
    return item


def collect_file(path: Path, max_chars: int) -> dict[str, Any]:
    suffix = path.suffix.lower()
    item: dict[str, Any] = {
        "kind": "file",
        "location": str(path),
        "title": path.name,
        "text": "",
        "images": [],
        "warnings": [],
    }
    if suffix in IMAGE_EXTS:
        item["kind"] = "image-file"
        item["images"] = [{"src": str(path.resolve()), "alt": path.name}]
        return item
    if suffix not in TEXT_EXTS:
        item["warnings"].append(f"Unsupported file type: {suffix or '(none)'}")
        return item

    raw, truncated = read_limited(path, max_chars)
    if suffix in {".html", ".htm"}:
        title, text, images = parse_html(raw, path.resolve().as_uri())
        item["title"] = title or path.name
        item["text"] = text[:max_chars]
        item["images"] = images[:40]
    elif suffix in {".md", ".markdown"}:
        item["text"] = raw
        item["images"] = markdown_images(raw, path)[:40]
    else:
        item["text"] = raw
    if truncated:
        item["truncated"] = True
    return item


def iter_directory(path: Path, max_files: int) -> list[Path]:
    files: list[Path] = []
    for child in path.rglob("*"):
        if len(files) >= max_files:
            break
        if any(part in SKIP_DIRS for part in child.parts):
            continue
        if child.is_file() and child.suffix.lower() in (TEXT_EXTS | IMAGE_EXTS):
            files.append(child)
    return files


def collect_source(value: str, max_chars: int, timeout: int, max_files: int) -> list[dict[str, Any]]:
    if is_url(value):
        return [collect_url(value, max_chars, timeout)]

    path = Path(value).expanduser()
    if path.exists() and path.is_dir():
        items = [collect_file(file_path, max_chars) for file_path in iter_directory(path, max_files)]
        if not items:
            return [
                {
                    "kind": "directory",
                    "location": str(path),
                    "title": path.name,
                    "text": "",
                    "images": [],
                    "warnings": ["No supported text or image files found."],
                }
            ]
        return items
    if path.exists() and path.is_file():
        return [collect_file(path, max_chars)]

    if "\n" in value or len(value) > 80:
        return [
            {
                "kind": "text",
                "location": "argument",
                "title": "Direct text",
                "text": value[:max_chars],
                "images": [],
                "warnings": ["Direct text was treated as source content."],
                "truncated": len(value) > max_chars,
            }
        ]

    return [
        {
            "kind": "unknown",
            "location": value,
            "title": value,
            "text": "",
            "images": [],
            "warnings": ["Input is not a URL, existing path, directory, or long text."],
        }
    ]


def write_outputs(items: list[dict[str, Any]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    md_parts = ["# xxd-article-poster Sources\n"]
    manifest_items: list[dict[str, Any]] = []
    for index, item in enumerate(items, start=1):
        text = item.get("text", "") or ""
        images = item.get("images", []) or []
        warnings = item.get("warnings", []) or []
        md_parts.append(f"\n## Source {index}: {item.get('title') or item.get('location')}\n")
        md_parts.append(f"- Kind: {item.get('kind')}\n")
        md_parts.append(f"- Location: {item.get('location')}\n")
        if item.get("truncated"):
            md_parts.append("- Note: truncated by collector\n")
        for warning in warnings:
            md_parts.append(f"- Warning: {warning}\n")
        if text:
            md_parts.append("\n")
            md_parts.append(text.strip())
            md_parts.append("\n")
        if images:
            md_parts.append("\n### Images\n")
            for image in images[:12]:
                src = image.get("src", "")
                alt = image.get("alt", "")
                md_parts.append(f"- {alt or 'image'}: {src}\n")
        manifest_items.append(
            {
                "id": index,
                "kind": item.get("kind"),
                "title": item.get("title"),
                "location": item.get("location"),
                "char_count": len(text),
                "image_count": len(images),
                "images": images,
                "warnings": warnings,
                "truncated": bool(item.get("truncated")),
                "needs_browser": bool(item.get("needs_browser")),
            }
        )

    manifest = {
        "created_at": dt.datetime.now().isoformat(timespec="seconds"),
        "source_count": len(items),
        "items": manifest_items,
    }
    (output_dir / "source_text.md").write_text("\n".join(md_parts), encoding="utf-8")
    (output_dir / "source_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect xxd-article-poster source text and images.")
    parser.add_argument("sources", nargs="*", help="URLs, files, directories, or long text arguments.")
    parser.add_argument("--stdin", action="store_true", help="Read direct source text from stdin.")
    parser.add_argument("--output", default="", help="Output directory. Defaults to a timestamped temp directory.")
    parser.add_argument("--max-chars-per-source", type=int, default=24000)
    parser.add_argument("--max-files", type=int, default=80)
    parser.add_argument("--timeout", type=int, default=15)
    args = parser.parse_args()

    sources = list(args.sources)
    if args.stdin or (not sources and not sys.stdin.isatty()):
        stdin_text = sys.stdin.read()
        if stdin_text.strip():
            sources.append(stdin_text)

    if not sources:
        parser.error("Provide at least one source, or pipe text with --stdin.")

    items: list[dict[str, Any]] = []
    for source in sources:
        items.extend(collect_source(source, args.max_chars_per_source, args.timeout, args.max_files))

    if args.output:
        output_dir = Path(args.output).expanduser()
    else:
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        output_dir = Path(tempfile.gettempdir()) / f"xxd-article-poster-sources-{stamp}"

    write_outputs(items, output_dir)
    print(f"source_text: {output_dir / 'source_text.md'}")
    print(f"manifest: {output_dir / 'source_manifest.json'}")
    browser_count = sum(1 for item in items if item.get("needs_browser"))
    if browser_count:
        print(f"browser_fallback_recommended: {browser_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
