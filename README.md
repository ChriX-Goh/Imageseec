# Imageseec

Current development build: **2.0 b9** (Chrome version `2.0.0.9`). See the [build record](docs/BUILDS.md) and [verification status](docs/STATUS.zh-CN.md). Store submission requires the owner's final acceptance of the exact build.

A Chrome Manifest V3 image viewer with single-image browsing, side-by-side comparison, an adaptive masonry overview, temporary magnification, free panning and a compact zoom ruler.

Designed around the desktop viewing habits familiar to Photoshop and ACDSee users: temporary magnification, precise zoom, direct panning and quick image browsing, brought to the browser. Imageseec uses its own controls and does not reproduce every shortcut from either application.

The UI supports English, Simplified Chinese (China), Traditional Chinese (Taiwan), Japanese, Korean, German, French, Spanish, Russian, Ukrainian and Polish. It follows Chrome's UI language by default, or you can choose a language in the settings; unsupported browser languages use English. See [localization](docs/LOCALIZATION.md). The project is licensed under [MIT](LICENSE).

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
| Compare two images | Split-view icon; the clicked image is on the left and the next image is on the right |
| Move through comparisons | Choose one-image or two-image steps in settings; the default advances two images |
| Hold one comparison pane | Hover a pane and select its lock icon; only the other pane then changes |
| Resize comparison panes | Drag the divider; double-click it to reset to equal widths |
| Browse the image group | G opens an overview with equal-width columns and aspect-ratio-aware thumbnails by default |
| Horizontal overview | Select Horizontal browsing for equal-height rows and sideways scrolling by default |
| Alignment and spacing | Choose automatic, vertical or horizontal alignment; set gaps from 0–48 px (default 12 px) |
| Overview thumbnail cache | Automatic silently preloads one visual band before and two after; moving toward the beginning expands the before buffer to two bands. Each side can use an independent custom count |
| Choose image mode | 1 selects single-image view; 2 selects comparison; in overview, use the focused or central thumbnail |
| Return from an overview selection | Press G or click the overview button |
| Leave the viewer | Esc or the close button exits immediately to the current source image or the overview's center image. Double-clicking in single or split view also exits when enabled |
| Clean overview | Hide thumbnail borders and captions in settings |
| Change thumbnail size | Use the overview ruler or Alt + wheel (Shift + wheel for 1% steps); click the percentage to reset to 100% |
| Thumbnail strip | Move to the bottom edge; move away to hide |
| Fit without enlarging | 0 |
| First / last image | Home / End |
| Browser fullscreen | F or fullscreen button |
| Close | Esc or the close button exits every mode and returns to the current image on the page |

The initial view preserves aspect ratio, fits the webpage viewport and never enlarges beyond the original image size. Manual fit-page mode can enlarge small images. The default view leaves the browser tabs and address bar visible; browser fullscreen is requested only through F or the fullscreen button.

Settings save immediately. Defaults include 15% zoom steps, 200% temporary magnification, two full-resolution images cached on each side, three preview thumbnails on each side, a 33% minimum pane width and two-image comparison steps. Custom overview cache counts are independent on each side and separate from full-resolution image caching. Temporary magnification restores the previous position; Alt-drag preserves it. Both allow panning beyond image edges.

## Gallery compatibility

Imageseec discovers images using common gallery, list, grid and repeated-card structures. It reads `img`, responsive `srcset` / `picture`, common lazy source attributes, explicitly supplied full-image addresses and CSS backgrounds within the same detected group. It watches relevant DOM changes and can scroll the source group behind the viewer when the overview needs more thumbnails; the page and nested scroll positions are restored after each scan. DOM order is used unless a complete, unambiguous standard ARIA sequence is available. Discovery remains heuristic and does not guarantee compatibility with every webpage or future layout change.

Canvas images, closed shadow roots and cross-page galleries are not supported by the generic DOM reader. A virtualized gallery may discard old items while scrolling, and protected image URLs may fail. Some restricted pages cannot host a viewer; a single-image tab is used as a fallback when possible.

## Permissions and privacy

- `contextMenus`: the image context-menu action.
- `activeTab`: access after an explicit context-menu action, where Chrome permits it.
- `scripting`: inject the full viewer on demand into the selected frame.
- `storage`: local settings and temporary single-image fallback sessions.
- HTTP/HTTPS host access: run the lightweight Ctrl-click entry point on matching webpages and inject the viewer after an explicit image action.

There is no developer-operated backend, analytics or remote executable code. Viewing and preloading request images from their existing hosts. Image hosts may receive ordinary network information, including IP addresses and browser-controlled request headers. See [PRIVACY.md](PRIVACY.md) for the complete data-flow description.

Chrome internal pages and the Chrome Web Store restrict extension injection. Local-file viewing depends on Chrome's separate file-access setting; automatic all-site entry is limited to HTTP/HTTPS.

Imageseec is an independent project, not affiliated with or endorsed by the makers of Photoshop or ACDSee. It is a browser extension, not an integration for those applications. Product names belong to their respective owners.
