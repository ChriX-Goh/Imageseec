const path = require('node:path');
const fs = require('node:fs/promises');
// Optional development dependency: npm install --no-save --package-lock=false sharp
const sharp = require('sharp');
(async () => {
  const directory = path.resolve(__dirname, '../icons'); await fs.mkdir(directory, { recursive: true });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#d4defe"/><stop offset="1" stop-color="#879deb"/></linearGradient></defs><rect x="4" y="4" width="120" height="120" rx="30" fill="#1d2333"/><g fill="none" stroke="url(#g)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M44 27H27v17 M84 27h17v17 M101 84v17H84 M44 101H27V84"/><circle cx="64" cy="64" r="22"/><path d="M64 34v7 M64 87v7 M34 64h7 M87 64h7"/></g><circle cx="64" cy="64" r="7" fill="#e1e7ff"/></svg>';
  for (const size of [16, 48, 128]) await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(directory, `${size}.png`));
  console.log('Generated extension icons');
})();
