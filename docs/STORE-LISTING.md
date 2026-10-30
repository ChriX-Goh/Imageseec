# Chrome Web Store copy draft

This is release copy for the Chrome Web Store. The detailed descriptions are prepared in `release/listing/` for all 11 package locales. The package provides each locale's title and short summary; the dashboard uses these when that language is selected.

## English title

Imageseec

## English short description

View webpage images with gallery navigation, zoom, free panning and thumbnail previews.

## English full description

See the image. Stay in your browser.

Built for people who enjoy the viewing habits of Photoshop and ACDSee: hold to magnify, pan directly, adjust zoom precisely and move quickly through images. Imageseec brings that desktop-inspired approach to webpage images, with its own browser controls.

Imageseec opens webpage images in a focused, page-filling viewer. Right-click a picture or use Ctrl + left-click to get started.

Choose from 11 interface languages, or let Imageseec follow your browser language.

- Browse nearby images with your wheel, arrow keys or edge buttons.
- Zoom with Alt + wheel and make one-percentage-point adjustments with Shift + wheel.
- Hold the left mouse button to magnify temporarily, then release to return.
- Alt-drag to pan freely, including beyond image edges.
- Hover the percentage for a compact vertical zoom ruler, or click it to cycle through current zoom, fit page and 100%.
- Lock a zoom percentage while switching pictures.
- Move to the bottom edge for nearby thumbnail previews.
- Adjust preloading and preview counts independently. Settings save immediately.

The initial image keeps its aspect ratio, fits the available page area and is never enlarged beyond its original size. An optional fullscreen button hides browser chrome when you choose.

No account is required by Imageseec. It has no analytics or developer-operated backend. Settings stay in local browser storage. Images and preloads are requested from their existing website image hosts.

Gallery discovery depends on images already loaded by the webpage. Compatibility varies by site; canvas images, CSS backgrounds and galleries spanning multiple pages may not work. Chrome restricts extensions on internal browser pages and the Chrome Web Store.

Imageseec is independent and is not affiliated with or endorsed by the makers of Photoshop or ACDSee. It is not a plugin for those applications. Product names belong to their respective owners.

## 简体中文商店文案

### 商店标题

Imageseec

### 简短说明

查看网页图片，支持相邻切图、缩放、自由拖拽和缩略图预览。

### 详细介绍

### 商店标题

Imageseec

### 简短说明

查看网页图片，支持相邻切图、缩放、自由拖拽和缩略图预览。

### 详细介绍

为熟悉 Photoshop、ACDSee 看图操作习惯的用户设计：临时放大、直接拖拽、精细缩放、快速切图，把桌面看图的操作思路带进浏览器。Imageseec 有自己的快捷键设计，不代表完全复刻这两款软件。

Imageseec 将网页图片放进简洁的浏览器看图界面。右键打开，或 Ctrl＋左键直达；使用滚轮和方向键切图，Alt＋滚轮缩放，Shift＋滚轮微调。

按住左键临时放大，松开恢复；Alt＋左键自由拖拽。悬停倍率按钮展开竖向刻度尺，锁定倍率后可连续浏览不同尺寸的图片。移到下边缘显示相邻缩略图，预缓存和预览数量可以独立设置。

默认保持比例并适合页面，小图不会在初次打开时被放大。Imageseec 不要求账号，不含统计服务；设置保存在本机，图片请求发往原网站图片服务器。相邻图识别依赖网页已经加载的内容，兼容情况因网站而异。

Imageseec 为独立项目，与 Photoshop、ACDSee 的厂商没有隶属、合作或认可关系，也不是安装到这两款软件中的插件。相关产品名称属于各自权利人。

## Single purpose

Allow users to view webpage images in an interactive image viewer and navigate related images already present in the same document.

## Permission justifications

| Permission | Review explanation |
| --- | --- |
| contextMenus | Adds an image-only context-menu action that explicitly opens the chosen image. |
| activeTab | Grants temporary document access following the image context-menu action where Chrome permits it, including sites outside persistent host grants. |
| scripting | Injects packaged viewer modules into the tab and frame from which the user opened an image. |
| storage | Stores user preferences locally and keeps short-lived single-image fallback sessions in extension session storage. |
| HTTP/HTTPS hosts | Runs the lightweight Ctrl-click listener on matching webpages. Gallery discovery and image preloading begin only after the user opens a viewer. All-site coverage is necessary for the requested anywhere-on-webpages shortcut. |

Remote executable code: **No**. All extension code is packaged. Website image responses are image content, not executable extension code.

Data disclosures must be completed against the final audited package, consistently with `PRIVACY.md`. Do not automatically equate local webpage processing with an absence of all data access. Explain local image-URL processing and the requests to original image hosts accurately.

## Screenshot storyboard

1. Full viewer on generated or author-owned imagery: page-filling view and original dimensions.
2. Expanded vertical zoom ruler and zoom lock, with a high-zoom image.
3. Bottom thumbnail strip and navigation on a synthetic album.
4. Settings panel with immediate-save controls.

Use only synthetic or properly licensed assets. Do not use private galleries, account menus, signed image URLs, personal browser tabs or unredacted profile details. Supply fresh screenshots from the final localized build.
