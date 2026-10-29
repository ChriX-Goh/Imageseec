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
write(path.join(here,'listing/en-title.txt'), english[0] + '\n');
write(path.join(here,'listing/en-summary.txt'), english[1] + '\n');
write(path.join(here,'listing/en-description.txt'), english[2] + '\n');
write(path.join(here,'listing/zh_CN-title.txt'), 'Imageseec — 网页图片查看器\n');
write(path.join(here,'listing/zh_CN-summary.txt'), '为熟悉桌面看图习惯的用户设计，支持快速切图、临时放大、自由拖拽和缩略图预览。\n');
write(path.join(here,'listing/zh_CN-description.txt'), section('简体中文介绍草稿') + '\n');
const policy = fs.readFileSync(path.join(root,'PRIVACY.md'),'utf8').replace(/^\uFEFF/,'').trim();
const content = policy.split(/\n\s*\n/).map(block => {
  if (block.startsWith('# ')) return `<h1>${escape(block.slice(2))}</h1>`;
  if (block.startsWith('## ')) return `<h2>${escape(block.slice(3))}</h2>`;
  return `<p>${escape(block).replace(/`([^`]+)`/g,'<code>$1</code>')}</p>`;
}).join('\n');
write(path.join(here,'web/privacy.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Imageseec Privacy Policy</title><meta name="description" content="How Imageseec handles local settings, webpage images and network requests."><style>body{margin:0;background:#f6f7fb;color:#242a38;font:16px/1.75 system-ui,sans-serif}main{max-width:780px;margin:auto;padding:48px 24px 72px}h1{font-size:32px;line-height:1.25}h2{font-size:21px;margin-top:34px}p{margin:16px 0}code{font-size:.88em;background:#e7ebf4;padding:2px 4px;border-radius:4px}</style></head><body><main>${content}</main></body></html>\n`);
const symbol = '<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#d4defe"/><stop offset="1" stop-color="#879deb"/></linearGradient></defs><rect x="4" y="4" width="120" height="120" rx="30" fill="#1d2333"/><rect x="24" y="24" width="80" height="80" rx="24" fill="none" stroke="url(#g)" stroke-width="7"/><circle cx="64" cy="64" r="20" fill="none" stroke="url(#g)" stroke-width="7"/><circle cx="90" cy="39" r="4" fill="#e1e7ff"/>';
const svg = (width,height,body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`);
(async () => {
  const assets = path.join(here, 'assets'); fs.mkdirSync(assets,{recursive:true});
  // 96px artwork with 16px transparent outer padding for the store icon.
  await sharp(svg(128,128,`<g transform="translate(16 16) scale(.75)">${symbol}</g>`)).png().toFile(path.join(assets,'store-icon-128.png'));
  for (const [w,h,name] of [[440,280,'promo-small-440x280.png'],[1400,560,'promo-marquee-1400x560.png']]) {
    const size = h*.56, x = (w-size)/2, y=(h-size)/2;
    const body = `<rect width="${w}" height="${h}" fill="#141a28"/><circle cx="${w*.18}" cy="${h*.2}" r="${h*.7}" fill="#819be8" opacity=".08"/><circle cx="${w*.9}" cy="${h*.9}" r="${h*.8}" fill="#d3deff" opacity=".04"/><g transform="translate(${x} ${y}) scale(${size/128})">${symbol}</g>`;
    await sharp(svg(w,h,body)).png().toFile(path.join(assets,name));
  }
  console.log('Prepared listing text, standalone privacy page, store icon and promotional artwork.');
})();
