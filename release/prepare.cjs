// Prepare store artwork and plain text descriptions from the authored sources.
// Development only: npm install --no-save --package-lock=false sharp
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const here = __dirname;
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const doc = fs.readFileSync(path.join(root, 'docs/STORE-LISTING.md'), 'utf8');
const section = title => doc.split(`## ${title}\n`)[1].split('\n## ')[0].trim();
const english = [section('English title'), section('English short description'), section('English full description')];
for (const locale of fs.readdirSync(path.join(root, '_locales'))) {
  const messages = JSON.parse(fs.readFileSync(path.join(root, '_locales', locale, 'messages.json'), 'utf8'));
  write(path.join(here,`listing/${locale}-title.txt`), 'Imageseec\n');
  write(path.join(here,`listing/${locale}-summary.txt`), messages.extDescription.message + '\n');
}
write(path.join(here,'listing/en-title.txt'), english[0] + '\n');
write(path.join(here,'listing/en-summary.txt'), english[1] + '\n');
write(path.join(here,'listing/en-description.txt'), english[2] + '\n');
write(path.join(here,'listing/zh_CN-description.txt'), section('简体中文商店文案').split('### 详细介绍\n')[1].trim() + '\n');
const policy = fs.readFileSync(path.join(root,'PRIVACY.md'),'utf8').replace(/^\uFEFF/,'').trim();
const content = policy.split(/\n\s*\n/).map(block => {
  if (block.startsWith('# ')) return `<h1>${escape(block.slice(2))}</h1>`;
  if (block.startsWith('## ')) return `<h2>${escape(block.slice(3))}</h2>`;
  return `<p>${escape(block).replace(/`([^`]+)`/g,'<code>$1</code>')}</p>`;
}).join('\n');
write(path.join(here,'web/privacy.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Imageseec Privacy Policy</title><meta name="description" content="How Imageseec handles local settings, webpage images and network requests."><style>body{margin:0;background:#f6f7fb;color:#242a38;font:16px/1.75 system-ui,sans-serif}main{max-width:780px;margin:auto;padding:48px 24px 72px}h1{font-size:32px;line-height:1.25}h2{font-size:21px;margin-top:34px}p{margin:16px 0}code{font-size:.88em;background:#e7ebf4;padding:2px 4px;border-radius:4px}</style></head><body><main>${content}</main></body></html>\n`);
const symbol = fs.readFileSync(path.join(here, 'artwork', 'imageseec-mark.png'));
const svg = (width,height,body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`);
(async () => {
  const assets = path.join(here, 'assets'); fs.mkdirSync(assets,{recursive:true});
  // Use the same transparent mark as the extension in all release artwork.
  await sharp(symbol).resize(128, 128).png().toFile(path.join(assets,'store-icon-128.png'));
  for (const [w,h,name] of [[440,280,'promo-small-440x280.png'],[1400,560,'promo-marquee-1400x560.png']]) {
    const size = Math.round(h*.56), x = Math.round((w-size)/2), y = Math.round((h-size)/2);
    const body = `<rect width="${w}" height="${h}" fill="#141a28"/><circle cx="${w*.18}" cy="${h*.2}" r="${h*.7}" fill="#819be8" opacity=".08"/><circle cx="${w*.9}" cy="${h*.9}" r="${h*.8}" fill="#d3deff" opacity=".04"/>`;
    const mark = await sharp(symbol).resize(size, size).png().toBuffer();
    await sharp(svg(w,h,body)).composite([{ input: mark, left: x, top: y }]).png().toFile(path.join(assets,name));
  }
  console.log('Prepared listing text, standalone privacy page, store icon and promotional artwork.');
})();
