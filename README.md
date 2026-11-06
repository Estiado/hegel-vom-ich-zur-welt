# 从我到世界 · Vom Ich zur Welt

一份用于黑格尔课堂讲述的七幕影像网页：首页 → Jetzt → Das Wahre → Anerkennung → Wirklichkeit → Weltseele → 尾声。

## 运行

这是无需构建的静态网站。将 `dist/` 作为网站根目录即可部署。开发时可在项目根目录运行 `python -m http.server 8000 --directory dist`，浏览器打开本地8000端口。无需 npm、CDN、外部字体或运行时 API。修改中文文案后运行 `python scripts/subset-fonts.py` 更新字体子集。

## 托管

- GitHub：`Estiado/hegel-vom-ich-zur-welt`（私有源码）。
- 已有私密演示：https://hegel-vom-ich-zur-welt.luckyfir11.chatgpt.site
- Cloudflare Pages 公开网站：https://hegel-vom-ich-zur-welt.pages.dev/
- Cloudflare Pages 配置：生产分支 `main`，框架预设“无”，构建命令留空，构建输出目录 `dist`。
- 公开访问验证：2026-11-04，首页及全部 20 个发布文件均返回 HTTP 200，内容与仓库一致；此项检查不包含浏览器中的动效视觉测试。

## 操作

- 进入每一幕后，画面自动自局部卡片缓慢扩大、边缘虚化，逐渐展开到全屏（约 5 秒，无需滚动驱动；滚离本幕时收回，再次进入会重播）。
- 右下上一幕／下一幕、顶部章节入口：快速跳转。
- 方向键、Page Up / Page Down：切换章节；Home / End：首尾跳转。
- 左下图像来源：查看画作年代、馆藏、授权与使用说明；Escape关闭。
- 右下暂停图标：切换减弱动效；自动尊重系统的减少动态效果偏好。
- 手机右上菜单：选择章节。

## 实现

`dist/index.html` 为内容与语义结构；`dist/style.css` 为排版与响应式；`dist/app.js` 为文字入场、章节展开、指针光照与演示控制。首页使用原生 WebGL：通过画面亮度估算浅层深度，配合视差、漫反射、聚光、光束与尘埃。它属于2.5D图像光照重建，不是物理光线追踪。

视频参考没有提供原网页源码或原始字体。首页背景根据参考画面生成补全，字体使用Cormorant与Noto Serif SC重新匹配；不能据此宣称已经逐帧或逐像素一致。

## 内容与素材

- 内容依据用户提供的《从我到世界》四幕讲稿；网页只保留关键词与中心判断。
- 第二幕「Das Wahre ist das Ganze／真理是全体」为增补页：取《精神现象学》序言的“花蕾—花朵—果实”比喻，兼收“歌德未读完序言”的轶事；配图为 Fantin-Latour《花果静物》（大都会博物馆 1980.3）。
- 《精神现象学》为1807年**印刷本扉页**，不是黑格尔亲笔手稿。
- 第四幕采用《拿破仑翻越阿尔卑斯山》1851年版画，作拿破仑时代的视觉入口，不冒称耶拿战役图。
- 《水边的哥特式大教堂》用于尾声；尾声主句为“密涅瓦的猫头鹰”（《法哲学原理》序言）。演示控制条位于左下角，便于讲者立于屏幕左侧授课。
- 历史图像与来源见 [docs/historical-assets.json](docs/historical-assets.json) 和 [docs/asset-research.md](docs/asset-research.md)。字体OFL许可证随文件附在 `dist/assets/fonts/`。

## 检查

`node --check dist/app.js`

`python scripts/check-site.py`（需要 Pillow 与 fontTools）：检查七幕顺序、锚点、本地依赖、图片尺寸与中文字体字符覆盖。

视觉评审和技术审计见 `docs/review.md`。浏览器检查与自动检测的覆盖范围分别记录，不将未运行的检查计为通过。

## 项目文件

- `PRODUCT.md`：本次设计上下文与确认的约束。
- `DESIGN.md`：视觉规格、动效和响应式约定。
- `references/original-draft.html`：用户原始草稿。
- `.openai/hosting.json`：当前托管项目配置；部署到其他平台时以 `dist/` 为根目录。
