# Poster JSON Schema

`scripts/render_poster.py` accepts either one poster object or an object with a `posters` array.

## Single Poster

```json
{
  "title": "主标题",
  "kicker": "可选短标签",
  "subtitle": "可选副标题，用来补充语境",
  "core": "一眼要记住的核心判断",
  "sections": [
    {
      "heading": "信息组标题",
      "bullets": ["短要点一", "短要点二"]
    }
  ],
  "quote": "可选金句或记忆线",
  "source_note": "可选来源说明",
  "visuals": [
    {
      "src": "/absolute/path/to/image.png",
      "caption": "可选图片说明"
    }
  ],
  "palette": {
    "background": "#F7F3EA",
    "ink": "#121212",
    "muted": "#5B5B5B",
    "panel": "#FFFFFF",
    "panel2": "#EAF3F2",
    "accent": "#E94F37",
    "accent2": "#116D6E"
  }
}
```

## Multiple Posters

```json
{
  "posters": [
    {
      "title": "第一张",
      "core": "核心判断",
      "sections": []
    },
    {
      "title": "第二张",
      "core": "核心判断",
      "sections": []
    }
  ]
}
```

## Field Guidance

- `title`: required. Keep short and forceful.
- `core`: required. This is the biggest message after the title.
- `sections`: 3-4 groups work best. Each group should carry a distinct cognitive role.
- `bullets`: 1-3 short bullets per group.
- `quote`: optional final memory line. Do not duplicate `core`.
- `visuals`: optional. Use for user-provided images, evidence screenshots, diagrams, or source images that materially improve understanding.
- `palette`: optional. Omit for the default editorial palette; override only when the topic demands it.

The renderer trims over-budget text and records warnings in `render_manifest.json`. Treat warnings as a signal to rewrite the spec, not as a finished result.
