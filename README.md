# xiaoxiaodong

小小东的 GitHub 公开项目主页。

这个仓库是一个纯静态站点，用来快速展示 `nevertoday` 在 GitHub 上公开的项目，并简单介绍小小东。页面会优先读取仓库里的 `repos.json` 快照，保证 GitHub Pages 上稳定展示；如果 GitHub 公共 API 可用，再用实时仓库数据刷新。

## 主页

```text
https://nevertoday.github.io/xiaoxiaodong/
```

## 内容

- `index.html`：主页结构
- `styles.css`：页面样式
- `script.js`：项目搜索、仓库数据渲染和 GitHub API 刷新
- `repos.json`：公开项目快照
- `assets/`：Logo、图标和视觉素材
- `skills/xxd-article-poster/`：小小东文章海报 Skill

## 本地预览

这是纯静态项目，可以直接打开 `index.html`，也可以启动本地服务：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 更新项目快照

如果本机已经登录 GitHub CLI，可以用下面的命令查看最新公开仓库，再同步更新 `repos.json`：

```bash
gh api 'users/nevertoday/repos?sort=pushed&per_page=50'
```

## License

MIT
