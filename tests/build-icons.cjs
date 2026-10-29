const path = require('node:path');
const fs = require('node:fs/promises');
// Optional development dependency: npm install --no-save --package-lock=false sharp
const sharp = require('sharp');
(async () => {
  const directory = path.resolve(__dirname, '../icons'); await fs.mkdir(directory, { recursive: true });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#d4defe"/><stop offset="1" stop-color="#879deb"/></linearGradient></defs><rect x="4" y="4" width="120" height="120" rx="30" fill="#1d2333"/><rect x="24" y="24" width="80" height="80" rx="24" fill="none" stroke="url(#g)" stroke-width="7"/><circle cx="64" cy="64" r="20" fill="none" stroke="url(#g)" stroke-width="7"/><circle cx="90" cy="39" r="4" fill="#e1e7ff"/></svg>';
  for (const size of [16, 48, 128]) await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(directory, `${size}.png`));
  console.log('Generated extension icons');
})();
