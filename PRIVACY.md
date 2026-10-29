# Imageseec Privacy Policy

Last updated: October 30, 2026.

Imageseec is an image-viewing Chrome extension. It has no developer-operated server and does not send webpage content, images, browsing history or settings to its developer. It includes no analytics, advertising or tracking SDKs and executes no remotely hosted JavaScript.

## Information processed locally

When you open an image, Imageseec reads image URLs, dimensions, captions and relevant gallery structure from the current document. It uses these values in memory to display the image and identify nearby images. It does not enumerate your browsing history, read passwords, or access private website APIs.

Your preferences are saved in `chrome.storage.local`, within the browser profile. Imageseec does not use `chrome.storage.sync` to synchronize them. You can restore defaults in settings; uninstalling the extension removes its extension storage according to Chrome's normal behavior.

If a webpage cannot host the viewer, a random, temporary session identifier points to the selected image URL and a fallback notice in `chrome.storage.session`. That record is removed when the fallback viewer consumes it. An unopened record can remain until Chrome clears the extension session storage, such as at browser restart. Image URLs can contain website-generated authorization parameters; these remain within local extension/session memory and are not included in project files or sent to the developer.

## Image network requests

Displaying images and preloading nearby images makes requests to the image hosts supplied by the webpage. Those hosts receive ordinary browser network information such as your IP address and browser-controlled headers. Chrome and the host determine whether cookies, referrer information, authorization and HTTP caching apply. Imageseec does not add a developer tracking identifier to these requests.

Image memory-cache references are released when they leave the configured neighborhood or when the viewer closes. This does not clear Chrome's own HTTP cache, which follows Chrome settings and the image host's response headers.

## Site access

The lightweight Ctrl-click listener runs on matching HTTP/HTTPS webpages so you can explicitly open a picture without first using the context menu. It does not start gallery scanning or preload pictures until you open the viewer. You can disable the shortcut in settings and manage or revoke site access in Chrome. Restricted browser pages remain restricted.

## Sharing and changes

The developer does not sell, transfer or receive the information processed by the extension. The website and image host retain their own privacy practices. If Imageseec's data handling changes, this policy must be updated alongside the extension.

For privacy questions, use the support contact shown on the extension's Chrome Web Store listing. Do not include private image links, signed URLs, credentials or personal screenshots in public reports.
