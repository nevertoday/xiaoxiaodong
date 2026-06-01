# xiaoxiaodong

小小东的 GitHub 项目入口。这个仓库会逐步整理和发布小小东相关的页面、素材与 Skills。

当前仓库先放置一个静态主页，用来介绍“小小东”知识星球的定位：围绕 AI 图片任务、提示词、审美判断与交付流程，把真实需求拆成可以执行、可以讨论、可以继续修改的第一版。

## 当前内容

- `index.html`：主页结构与页面文案
- `styles.css`：页面样式
- `script.js`：复制链接、提示反馈等轻量交互
- `assets/`：Logo、二维码、图标与品牌视觉素材

## 后续规划

这个仓库后续会继续加入 Skills。建议新增内容时按主题分目录管理，例如：

```text
skills/
  prompt-writing/
  image-direction/
  workflow-checklists/
```

每个 Skill 建议至少包含：

- `README.md`：说明用途、适用场景和使用方式
- 示例输入与输出
- 可复用模板或检查清单

## 本地预览

这是一个纯静态项目，可以直接打开 `index.html` 预览，也可以在本地启动一个简单静态服务：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 许可

暂未选择开源许可证。未经许可，请勿直接复制、发布或商用本仓库中的品牌素材与页面内容。
