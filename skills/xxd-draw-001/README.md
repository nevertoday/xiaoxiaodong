# xxd-draw-001 · 一句话，画成一幅会动的画

把一句描述、一张照片，或「照片 + 几句修改」交给 Agent，它会画出一幅**一笔一笔自己画出来**的小画：颜色干净明亮，形状柔软有机，主角周围有成片的小笔触，过程分阶段展开。每幅作品是一个离线可开的 HTML。

作品展示：<https://nevertoday.github.io/xiaoxiaodong/draw/>

## 它怎么工作

- **画什么由命题决定**：Agent 先列出命题里的每个意象和明确要求，再自己选颜色，把每样东西按它实际的样子描述出来（形态 + 比例 + 部件）。没有预设色板，也没有现成的主体库，免得模型偷懒套模板。
- **怎么画由引擎决定**：`compose.py` 把描述编译成笔触计划，按原作的画法铺色带、长出主角、融进环境；`make_html.py` 把 p5.js、p5.brush 和画面打包进一个 HTML。
- **自带验收**：漏画意象直接拒绝生成；`capture_review.cjs` 检查节奏和重放一致性，`style_check.py` 检查彩度、脏灰、明度和笔触密度。
- **小模型也能画**：展示页里大部分作品由 gpt-6-luna 独立完成，每幅只拿到一句命题或一张照片。

## 安装

```bash
git clone https://github.com/nevertoday/xiaoxiaodong.git
cp -r xiaoxiaodong/skills/xxd-draw-001 ~/.claude/skills/     # Claude Code
# Codex：复制到 ~/.codex/skills/
```

依赖：Python 3 + Pillow；检查步骤需要 Node.js + Playwright：`npm i playwright && npx playwright install chromium`；也可以用 `PLAYWRIGHT_MODULE` 指向已有安装、`BROWSER_EXECUTABLE` 指向本机 Chrome。

## 用法

```text
$xxd-draw-001 画一幅：冬天结冰的湖面上，两只丹顶鹤在跳舞。
$xxd-draw-001 把这张照片画成作品。            ← 附上照片
$xxd-draw-001 把这张照片画成作品，天空换成黄昏，加一只白鹭。
```

批量创作（每个命题由一个独立的 Codex worker 完成，跑完自动查重）：

```bash
python3 ~/.claude/skills/xxd-draw-001/scripts/batch_run.py 命题.txt --out 输出目录 --model gpt-6-luna -j 3
```

`命题.txt` 一行一个命题；有照片的行末尾加一个 Tab 和照片路径。

## 文件

```text
SKILL.md                     给 Agent 的流程说明
references/painting-grammar.md  画法原理与自由笔触词汇
assets/                      绘画引擎（brushes / motifs / engine）+ p5.js、p5.brush
scripts/compose.py           描述 → 笔触计划
scripts/make_html.py         笔触计划 → 离线 HTML
scripts/analyze_image.py     照片 → 网格参考图 + 照片配色
scripts/capture_review.cjs   截帧、节奏与重放检查
scripts/style_check.py       终帧风格验收
scripts/batch_run.py         批量：一题一个隔离 worker
scripts/batch_diversity.py   批量查重
```

## 致谢与许可

- 画风灵感来自 Sasha 的 [Painting Loaders](https://painterly.design-tools.workers.dev/)。
- [p5.js](https://p5js.org/) 2.3.3（LGPL-2.1）、[p5.brush](https://github.com/acamposuribe/p5.brush) 2.2.2（MIT），原样内嵌，许可证见 `assets/vendor/`。
