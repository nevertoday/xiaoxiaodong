---
name: xxd-draw-001
description: >-
  Paint one standalone HTML artwork that draws itself stroke by stroke, in the
  manner of the Painting Loaders originals: clean high-key colour, wet bands,
  organic forms with same-hue light and shadow, colonies of small marks, a
  staged reveal. Works from a text request, a photo, or a photo plus edits.
  The model designs the picture from the request (its own colours, every named
  thing described by its form and material); compose.py paints it. No preset
  palettes or ready-made subjects. Offline p5.brush.
---

# xxd-draw-001

把用户的文字、照片，或"照片 + 修改要求"，画成一幅会逐笔画出来的独立 HTML。

**内容和颜色来自这一次的命题**，由你来想；**画法来自原作**，由 `compose.py` 负责。这里没有现成的色板可选，也没有现成的"猫、亭子、茶壶"可选——每一样东西都要你按它实际的样子描述出来。画面要围绕命题里的意象，不要每次都画成远山、树、水、小船。

## 流程

```bash
W=$(mktemp -d "${TMPDIR:-/tmp}/xxd-draw.XXXXXX"); S=~/.claude/skills/xxd-draw-001/scripts   # 换成本 skill 实际所在目录
python3 $S/compose.py --forms      # 每种形态需要描述什么
```

### 1. 读懂命题

- `request`：用户原话，原样抄。
- `imagery`：命题里**每一个具体事物**，用原词。「两个黄鹂鸣翠柳，一行白鹭上青天」→ `["黄鹂","翠柳","白鹭","青天"]`。抽象命题写画面要表现的东西（"雨丝""初晴的光"）。
- `checklist`：每条明确要求拆成一句能在图上看出来的话：有什么、几个、什么颜色、在哪边、朝哪边、在做什么。用户没说的不写。

### 2. 想画面

先想这句命题**独有的**画面：主角是谁、在做什么、在什么时间和天气里、从哪里看、什么情绪。再决定：

- **视角** `space.view`：`eye`（平视，有天有地）/ `interior`（室内）/ `top`（俯拍桌面）/ `underwater`（水下或俯看水面）。`horizon` 是地平线高度（0–1）。
- **颜色** `colours`：从这个题材的世界和情绪里挑，任何色相都可以，hex 写：
  - `air`：天空、墙、水——画面最大的那片颜色；
  - `ground`：地面、桌面、雪地；
  - `life`：植物和结构的颜色（它的深调会成为画里的暗部）；
  - `accent`：唯一的强调色，落在主角上；
  - `light`（可选）：光的颜色，默认暖白。

  颜色要鲜明、干净，宁可饱和也不要灰褐；compose 只会把亮度和饱和度提到原作的范围，不会换掉你的色相。同一种情绪也可以有不同的颜色，别每次都用同一套。

  **不用土色和灰色**（原作 186 个颜色里一个都没有）：木头、头发、大衣、屋顶、路面这些「本来是褐色」的东西，也挑干净的颜色——焦糖、赭红、杏色、奶油黄；灰墙、灰石头写成淡紫灰、蓝灰。**暗部是深的冷色**（深绿、深靛、深紫），不是黑或深褐。compose 会把漏网的土色、灰色、黑色自动换掉，但从命题出发自己选干净的颜色，画面才有原作那种透亮。
- **光** `light.from`：光从哪里来 `[x, y]`，只决定明暗方向，**不会画任何光**。

### 3. 描述每一样东西（things）

命题里的每个意象都是一个 thing，`name` 用命题原词。按它的**构造**选一种形态（form），然后按它**实际的样子**填它的比例和部件：

| form | 适合什么 | 要想清楚的 |
| --- | --- | --- |
| `figure` | 人 | 姿势、衣服上下装和长短、发型、头上戴什么、手里拿什么 |
| `animal` | 四足动物 | 身长、腿长、脖子、头的大小（0–1），耳朵、口鼻、尾巴的样子，花纹，姿势（站/走/坐/卧/特写） |
| `bird` | 鸟 | 脖子、腿、喙的长短，身体/翅膀/胸口颜色，姿势（栖/站/飞/浮水），远处成群 |
| `fish` / `insect` | 鱼、虫 | 身体颜色、花纹、方向；翅膀宽窄 |
| `plant` | 植物 | 长法（乔木/灌木/几枝花/草/竹类/浮水/垂挂），树冠形，花的颜色和形状，果实 |
| `building` | 房屋、楼阁、塔、城墙 | 墙的宽高颜色、屋顶形状（人字/飞檐/平/穹顶）和层数、柱子、窗门、亮灯、是否横贯全画 |
| `vessel` | 杯、壶、瓶、碗、篮 | 从底到口的宽度轮廓、把手、壶嘴、盖子、材质、里面装着什么 |
| `craft` | 船 | 长度、船身颜色、帆、船舱 |
| `round` | 日、月、果、灯笼、气球 | 颜色、轮廓（圆/月牙/椭圆/梨形），是不是光源，是不是烛火 |
| `land` | 山、丘、崖、石、沙丘、路 | 形状、高度、层数、颜色、雪顶 |
| `water` | 湖海、溪流、瀑布 | 水面（静/波/溪/瀑）、范围、颜色 |
| `structure` | 桥、窗、栏杆、桌子、灯杆 | 由哪些杆件、面板、拱构成（坐标自己定） |
| `cloth` | 帘、桌布、旗、帆布 | 轮廓、颜色、褶的方向、花纹 |
| `free` | 以上都表达不了的 | 自己写笔触，见 [painting-grammar.md](references/painting-grammar.md) |

所有 thing 都写 `at: [x, y]`（它站立/落地的位置，0–1）、`size`（高度占画面比例），朝向用 `facing` 或 `look_at: [x, y]`。用户没提、你为了画面加的东西写 `role: "extra"`，会画小画简。具体字段用 `compose.py --forms` 查。

**同一种 form，不同的东西要填出不同的样子**：狐狸、马、猫都是 `animal`，区别全在你填的身长、腿长、耳朵、尾巴、颜色上。不要拿上一张画的参数改个名字。

### 4. 空气与光（只在命题需要时）

- `air`：命题里有才加——`rain`、`snow`、`mist`、`petals`、`stars`、`fireflies`；室内要窗光加 `sunlight`。室内的雨雪只下在窗户里（给窗户的 structure 写 `opening`）。
- **光默认不画**。只有命题里有光源才画：`round` 加 `light_source: true`（日、月、灯），有水时会自动在它正下方画断续的倒影和几个亮点；烛火用 `round` 的 `flame: true`；室内窗光用 `air: ["sunlight"]`。不要画光柱、不要在天上撒亮点、不要大团光晕。
- **天空**只用色带和软云：看得见天空时可以写 `space.clouds: 1–4`；俯拍、水下、室内没有云。不要在天上撒小点小横线。

### 5. 编译、看图、修改

```bash
python3 $S/compose.py $W/brief.json --out $W/plan.json
python3 $S/make_html.py $W/plan.json --out /用户指定目录/作品名.html
node $S/capture_review.cjs /用户指定目录/作品名.html $W/evidence --quick
python3 $S/style_check.py $W/evidence/final.png --plan $W/plan.json
```

compose 会提示：`MISSING IMAGERY`（有意象没画，**会拒绝生成**）、`MISSING ENVIRONMENT`（雪、雨、夜、阳光等没体现）、`GENERIC NAMES`（"远景""细节"这类空名字）、`SKY MARKS`（天上撒点）。看到就改 brief。

打开 `$W/evidence/final.png` 看图，逐条回答 checklist：是/否。"否"就改 brief 重来；`STYLE FAIL`、`PACING FIX` 也要改。最多改 3 轮，仍做不到的如实告诉用户。交付前去掉 `--quick` 再跑一次完整检查。

## 照片输入

```bash
python3 $S/analyze_image.py 照片 --out $W
```

打开 `$W/grid.png` 看：照片完整放在正方形里，两侧补的是照片背景色的延伸。照片里每样重要的东西都写成一个 thing，位置和大小从网格读。`$W/colours.json` 是照片自己的颜色，抄进 `colours`（用户要求改色时才改）。琐碎的东西（路人、招牌、电线）合并或省略。**默认画正方形**；用户明确要竖幅、横幅或原比例时，加 `--keep-aspect` 并把输出的 `canvas` 抄进 brief。照片 + 文字修改：先按照片描述，再按文字改，改动写进 checklist。

人物很大时（婚纱照、人像）脸只画朝向一侧的侧脸轮廓，不画眼睛嘴巴——在这种画风里五官会像面具。

## 批量创作

**必须用 `batch_run.py`**，一行一个命题（有照片的行末尾加一个 Tab 和照片路径）：

```bash
python3 $S/batch_run.py 命题.txt --out 输出目录 --model gpt-6-luna -j 3
```

每个命题由一个只看得到这句命题的 worker 单独完成；跑完自动查重（`batch_diversity.py`），构图雷同或缺意象的题列进 `redo.txt` 重做一轮。禁止写"按关键词分类 → 套固定场景"的脚本，禁止复制上一个 brief 改名字。

## 交付

只交付一份 `作品名.html`（p5、p5.brush、画面全部内嵌，离线可开）：暖纸色背景、居中 600×600 画布、画下一行步骤文字，窄屏等比缩小。
