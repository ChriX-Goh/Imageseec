const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const i18nFixture = require('./i18n-fixture.cjs');
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const hits = new Map();
const server = http.createServer((req, res) => {
  res.setHeader('Permissions-Policy', 'fullscreen=()');
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/tests/i18n-fixture.js') {
    res.setHeader('Content-Type', 'text/javascript'); res.setHeader('Cache-Control', 'no-store');
    res.end(i18nFixture.script(u.searchParams.get('locale') || 'en')); return;
  }
  if (u.pathname === '/stats') {
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(Object.fromEntries(hits))); return;
  }
  if (u.pathname.startsWith('/image/') || u.pathname.startsWith('/full/')) {
    hits.set(u.pathname, (hits.get(u.pathname) || 0) + 1);
    const n = parseInt(u.pathname.split('/').at(-1)) || 1;
    if (n === 98) { res.writeHead(404); res.end(); return; }
    const small = n === 2, portrait = n === 3;
    const w = small ? 320 : portrait ? 900 : 1920, h = small ? 200 : portrait ? 1600 : 1080;
    const palette = [['#1e3549', '#d9ae89', '#466579', '#263c43'], ['#4b3e51', '#e2bba2', '#997d8c', '#514f70'], ['#32433d', '#bdc79b', '#748b66', '#394c46'], ['#4b4242', '#f1caa2', '#ab806d', '#644a50']][(n - 1) % 4];
    res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'max-age=3600');
    const image = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1920 1080"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="${palette[2]}"/><stop offset="1" stop-color="${palette[0]}"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h1920v1080H0z"/><circle cx="${1200 + (n % 3) * 130}" cy="350" r="105" fill="#ffe4bc" opacity=".85"/><path fill="${palette[2]}" d="M0 650 180 430 360 585 620 270 940 650 1250 480 1510 650 1760 390 1920 610V1080H0z"/><path fill="${palette[3]}" d="M0 730 320 610 590 730 880 540 1200 730 1570 580 1920 700V1080H0z"/><path fill="url(#water)" d="M0 800Q400 740 960 805T1920 780V1080H0z"/><path stroke="#f1d4b2" stroke-width="3" opacity=".3" d="M1070 850h250m-310 34h380m-340 40h300m-420 54h520"/><text x="80" y="100" font-family="system-ui" fill="#ffffffa0" font-size="24" letter-spacing="6">IMAGE LENS / ${String(n).padStart(2, '0')}</text></svg>`;
    const send = () => res.end(image);
    if (n === 97) setTimeout(send, 1400); else send();
    return;
  }
  const file = path.resolve(root, `.${decodeURIComponent(u.pathname === '/' ? '/tests/demo.html' : u.pathname)}`);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
    if (u.pathname === '/options.html' && u.searchParams.has('fixture')) data = Buffer.from(data.toString().replace('<script src="i18n.js">', '<script src="tests/demo-setup.js"></script><script src="i18n.js">'));
    if (path.extname(file) === '.html') {
      const script = `<script src="/tests/i18n-fixture.js?locale=${encodeURIComponent(u.searchParams.get('locale') || 'en')}"></script>`;
      data = Buffer.from(data.toString().replace(/(<script src="(?:\/tests\/|tests\/)?demo-setup\.js"><\/script>)/, `$1${script}`));
    }
    res.end(data);
  });
});
server.listen(18766, '127.0.0.1', () => console.log('Image Lens development fixture: http://127.0.0.1:18766'));
