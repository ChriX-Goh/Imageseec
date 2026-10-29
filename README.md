# Imageseec

A Chrome Manifest V3 image viewer with page-filling viewing, adjacent-image navigation, temporary magnification, free panning and a compact zoom ruler.

Designed around the desktop viewing habits familiar to Photoshop and ACDSee users: temporary magnification, precise zoom, direct panning and quick image browsing, brought to the browser. Imageseec uses its own controls and does not reproduce every shortcut from either application.

The UI supports English, Simplified Chinese (China), Traditional Chinese (Taiwan), Japanese, Korean, German, French, Spanish, Russian, Ukrainian and Polish. It follows Chrome's UI language and falls back to English for unsupported languages. See [localization](docs/LOCALIZATION.md). The project is licensed under [MIT](LICENSE).

## Install for development

1. Download or clone this repository to a permanent directory.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Select **Load unpacked** and choose the directory containing `manifest.json`.
4. Right-click a webpage image and choose **Open with Imageseec**, or use **Ctrl + left-click**.

No build step, desktop helper or background server is required. Keep the unpacked directory in place. To apply a local update, reload the extension and refresh the webpages where you want to use its shortcut. Existing settings remain in local Chrome storage.

## Controls

| Action | Control |
| --- | --- |
| Previous / next image | Wheel up / down; left / right arrow; edge buttons |
| Zoom | Alt + wheel; + / - |
| Fine zoom | Shift + wheel, one percentage point per step |
| Temporary magnification | Hold left mouse button; release to restore |
| Free pan | Alt + left-button drag; release to keep the position |
| Zoom presets | Click the percentage: current zoom, fit page, 100%, current zoom |
| Zoom ruler | Hover the percentage; click a tick, drag, or scroll |
| Keep zoom across images | Toggle the zoom lock |
| Thumbnail strip | Move to the bottom edge; move away to hide |
| Fit without enlarging | 0 |
| First / last image | Home / End |
| Browser fullscreen | F or fullscreen button |
| Close | Esc, close button, or optional double-click |

The initial view preserves aspect ratio, fits the webpage viewport and never enlarges beyond the original image size. Manual fit-page mode can enlarge small images. The default view leaves the browser tabs and address bar visible; browser fullscreen is requested only through F or the fullscreen button.

Settings save immediately. Defaults: 15% zoom steps, 200% temporary magnification, two full-resolution images cached on each side, and three preview thumbnails on each side. Cache and preview counts are independent. Temporary magnification restores the previous position; Alt-drag preserves it. Both allow panning beyond image edges.

## Gallery compatibility

Imageseec discovers images already present in the page using common gallery, list, grid and repeated-card structures. It reads image links, responsive `srcset` / `picture`, lazy-loading attributes and explicitly supplied full-image addresses. DOM order is used unless a complete, unambiguous standard ARIA sequence is available. This is heuristic compatibility, not a guarantee for every webpage or future layout change.

Infinite-scroll content must first be loaded by the website. CSS backgrounds, canvas images, closed shadow roots and cross-page galleries are not fully supported. Some restricted pages cannot host a viewer; a single-image tab is used as a fallback when possible. Expired or protected image URLs may fail.

## Permissions and privacy

- `contextMenus`: the image context-menu action.
- `activeTab`: access after an explicit context-menu action, where Chrome permits it.
- `scripting`: inject the full viewer on demand into the selected frame.
- `storage`: local settings and temporary single-image fallback sessions.
- HTTP/HTTPS host access: run the lightweight Ctrl-click entry point on matching webpages and inject the viewer after an explicit image action.

There is no developer-operated backend, analytics or remote executable code. Viewing and preloading request images from their existing hosts. Image hosts may receive ordinary network information, including IP addresses and browser-controlled request headers. See [PRIVACY.md](PRIVACY.md) for the complete data-flow description.

Chrome internal pages and the Chrome Web Store restrict extension injection. Local-file viewing depends on Chrome's separate file-access setting; automatic all-site entry is limited to HTTP/HTTPS.

Imageseec is an independent project, not affiliated with or endorsed by the makers of Photoshop or ACDSee. It is a browser extension, not an integration for those applications. Product names belong to their respective owners.
