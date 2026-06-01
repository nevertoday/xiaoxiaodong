---
name: xxd-article-poster
description: Use when the user invokes `/xxd-article-poster` or `$xxd-article-poster`, or asks to turn long articles, selected clipboard text, one or more URLs, Markdown/text/HTML files, directories, and image-heavy source folders into one or more 30-45 second readable poster images. Use when the user asks to convert long text, web articles, documents, paths, folders, screenshots, or `clipboard` content into a digestible visual summary, information poster, editorial card, or shareable image; especially for prompts about "45 秒看懂", "长文转图片", "网页转海报", "文档转图片", "一图读懂", or Apple/Takahashi-style poster compression.
---

# xxd-article-poster

## Outcome

Produce a shareable raster poster image that lets a phone reader grasp the source material in 30-45 seconds. Use the agent's native image generation capability as the default output path. Do not render HTML or template screenshots unless the user explicitly asks for HTML, or native image generation is unavailable.

Default final image output goes to `~/Desktop`; use the user's requested output path when provided. Native image generators may save originals in their own generated-images directory; if a requested/default path is needed, copy the PNG there and leave the original in place. If producing multiple images, create a containing folder with clear file names.

## Fast Workflow

1. Identify input mode:
   - Direct long text or `{clipboard}` content: use it as the source body.
   - Local file or directory: run `scripts/prepare_sources.py` to consolidate text and image references.
   - Binary documents such as PDF/DOCX: use the existing `pdf` or `docx` skill to extract text first, then feed the extracted text or generated Markdown into this workflow.
   - URL list: batch with `scripts/prepare_sources.py` first. If extraction is thin, blocked, login-gated, or image-critical, use the `web-access` skill and browser fallback only for the failed URLs.
   - Image-only inputs: inspect the images with available vision/OCR tools when possible, then include the image meaning or key visual evidence in the poster spec.
2. Read `references/compression-guide.md` before distilling source content.
3. Distill the source into a compact native image-generation prompt, not a poster JSON spec. Include:
   - ratio and canvas intent, usually vertical 3:4 or 4:5 for phone reading;
   - exact poster text budget: title, subtitle/core sentence, 3-4 grouped points, optional source note;
   - visual direction, hierarchy, color palette, and "no watermark / no QR / no HTML screenshot";
   - any source images or visual evidence that materially improves comprehension.
4. Generate the poster with the built-in/native image generation tool available in the current agent environment. In Codex, use the native image generation capability directly.
5. Verify the generated raster image exists or is visible, then visually inspect it. If text is too dense, split into multiple posters or reduce copy before regenerating.

## Source Collection

Use the collector for files, directories, URLs, and mixed inputs:

```bash
python3 skills/xxd-article-poster/scripts/prepare_sources.py SOURCE... --output /tmp/xxd-article-poster-sources
```

Useful forms:

```bash
# Direct text through stdin
pbpaste | python3 skills/xxd-article-poster/scripts/prepare_sources.py --stdin

# Mixed local and web sources
python3 skills/xxd-article-poster/scripts/prepare_sources.py article.md https://example.com/post ./notes
```

The collector writes `source_text.md` and `source_manifest.json`. Use the manifest warnings to decide whether browser extraction is needed.

For URLs, optimize browser use:
- Try the static collector first for ordinary article/blog/docs pages.
- Use `web-access` for dynamic, login-gated, anti-crawler, social, newsletter, or image-heavy pages.
- For many URLs, process all static successes first and only open browser tabs for the failures.

## Poster Planning

Read `references/compression-guide.md` when creating the content plan. Preserve the user's poster prompt as the governing design brief:
- Do not copy source text line by line.
- Extract core value, central claim, key knowledge points, and memorable bright spots.
- Order information by human comprehension flow.
- Fit a 30-45 second mobile reading budget.
- Use oversized type or strong emphasis for the main point.
- Avoid unrelated text, generic filler, signatures, watermarks, or process labels.

Use one poster when the distilled message fits comfortably. Create multiple posters when:
- Sources are unrelated.
- One image cannot hold the core point plus necessary evidence at readable size.
- The user provided many articles and expects each to remain distinguishable.

## Native Image Generation

Default behavior:
- Use native image generation for the final poster. The deliverable is a PNG or other raster image, not an HTML page.
- Do not create `poster.json`.
- Do not call `scripts/render_poster.py`.
- Do not create HTML as an implementation detail.
- Do not describe the result as a web page, screenshot, or template render.

Use a prompt shaped like this:

```text
Create a vertical 3:4 Chinese editorial information poster for phone reading.
Source topic: ...
Main title: ...
Core sentence: ...
Sections: ...
Visual style: ...
Constraints: readable Chinese text, no watermark, no QR code, no HTML/browser screenshot.
```

When the generator returns a file in a generated-images directory and the user expected `~/Desktop`, copy the chosen PNG to `~/Desktop` with a clear filename. Leave the original generated file in place.

## HTML Fallback Only

The legacy renderer is a fallback, not the normal workflow. Use `scripts/render_poster.py` and `references/poster-json-schema.md` only when:
- the user explicitly asks for HTML, editable HTML, or deterministic browser rendering;
- native image generation is unavailable in the current environment;
- exact text fidelity is more important than visual generation and the user accepts the HTML-rendered PNG tradeoff.

If fallback is used, say so in the final response and name the reason. Otherwise, avoid HTML artifacts entirely.

## Quality Gate

Before final response, verify:
- A native raster image was generated, unless fallback was explicitly required.
- Default or requested output path was honored.
- Multiple posters are wrapped in a folder.
- Main title is readable at phone preview size.
- No section is a wall of small text.
- The poster answers "what should the reader understand and remember?" within 30-45 seconds.
- No HTML files, browser screenshots, or template artifacts were created unless fallback was explicitly required.
- Any skipped or browser-fallback source is named in the response.

## Resources

- `scripts/prepare_sources.py`: consolidate text and image references from direct text, URLs, files, and folders.
- `references/compression-guide.md`: distillation, cognition order, and mobile reading budget.
- `scripts/render_poster.py`: legacy HTML fallback only; do not use for the default workflow.
- `references/poster-json-schema.md`: legacy fallback schema only.
- `assets/poster-template.html`: legacy fallback template only.
