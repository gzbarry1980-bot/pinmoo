import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const downloads = 'C:/Users/Administrator/Downloads';
const logoSource = path.join(downloads, 'pinmoo品沐咨询 logo.png');
const casesSource = path.join(downloads, 'ChatGPT Image 2026年5月12日 20_56_41 (3).png');
const assetsDir = path.join(root, 'public/assets');
const casesDir = path.join(assetsDir, 'cases');
await fs.mkdir(casesDir, { recursive: true });

async function loadUPNG() {
  const pakoCode = await (await fetch('https://unpkg.com/pako@2.1.0/dist/pako.min.js')).text();
  const pakoModule = { exports: {} };
  const pakoWindow = {};
  const pako = new Function('module', 'exports', 'window', pakoCode + '; return Object.keys(module.exports).length ? module.exports : window.pako;')(pakoModule, pakoModule.exports, pakoWindow);
  const response = await fetch('https://unpkg.com/upng-js@2.1.0/UPNG.js');
  const code = await response.text();
  const mod = { exports: {} };
  const win = { pako };
  return new Function('module', 'exports', 'window', 'pako', code + '; return Object.keys(module.exports).length ? module.exports : window.UPNG;')(mod, mod.exports, win, pako);
}

const UPNG = await loadUPNG();

async function decodePng(file) {
  const fileBuffer = await fs.readFile(file);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  const decoded = UPNG.decode(arrayBuffer);
  const rgba = new Uint8Array(UPNG.toRGBA8(decoded)[0]);
  return { width: decoded.width, height: decoded.height, data: rgba };
}

function encodePng(data, width, height) {
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return Buffer.from(UPNG.encode([buffer], width, height, 0));
}

function trimTransparent(image, padding) {
  let minX = image.width, minY = image.height, maxX = -1, maxY = -1;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const a = image.data[(y * image.width + x) * 4 + 3];
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return image;
  const width = maxX - minX + 1 + padding * 2;
  const height = maxY - minY + 1 + padding * 2;
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height - padding * 2; y++) {
    for (let x = 0; x < width - padding * 2; x++) {
      const src = ((minY + y) * image.width + minX + x) * 4;
      const dst = ((y + padding) * width + x + padding) * 4;
      out[dst] = image.data[src];
      out[dst + 1] = image.data[src + 1];
      out[dst + 2] = image.data[src + 2];
      out[dst + 3] = image.data[src + 3];
    }
  }
  return { width, height, data: out };
}

function resize(image, width, height) {
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(image.height - 1, Math.floor(y * image.height / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(image.width - 1, Math.floor(x * image.width / width));
      const src = (sy * image.width + sx) * 4;
      const dst = (y * width + x) * 4;
      out[dst] = image.data[src];
      out[dst + 1] = image.data[src + 1];
      out[dst + 2] = image.data[src + 2];
      out[dst + 3] = image.data[src + 3];
    }
  }
  return { width, height, data: out };
}

function crop(image, box) {
  const out = new Uint8Array(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const src = ((box.top + y) * image.width + box.left + x) * 4;
      const dst = (y * box.width + x) * 4;
      out[dst] = image.data[src];
      out[dst + 1] = image.data[src + 1];
      out[dst + 2] = image.data[src + 2];
      out[dst + 3] = image.data[src + 3];
    }
  }
  return { width: box.width, height: box.height, data: out };
}

function flatten(image, bg) {
  const out = new Uint8Array(image.width * image.height * 4);
  for (let i = 0; i < image.data.length; i += 4) {
    const a = image.data[i + 3] / 255;
    out[i] = Math.round(image.data[i] * a + bg[0] * (1 - a));
    out[i + 1] = Math.round(image.data[i + 1] * a + bg[1] * (1 - a));
    out[i + 2] = Math.round(image.data[i + 2] * a + bg[2] * (1 - a));
    out[i + 3] = 255;
  }
  return { width: image.width, height: image.height, data: out };
}

function composite(base, overlay, left, top) {
  for (let y = 0; y < overlay.height; y++) {
    for (let x = 0; x < overlay.width; x++) {
      const bx = left + x;
      const by = top + y;
      if (bx < 0 || by < 0 || bx >= base.width || by >= base.height) continue;
      const src = (y * overlay.width + x) * 4;
      const dst = (by * base.width + bx) * 4;
      const a = overlay.data[src + 3] / 255;
      base.data[dst] = Math.round(overlay.data[src] * a + base.data[dst] * (1 - a));
      base.data[dst + 1] = Math.round(overlay.data[src + 1] * a + base.data[dst + 1] * (1 - a));
      base.data[dst + 2] = Math.round(overlay.data[src + 2] * a + base.data[dst + 2] * (1 - a));
      base.data[dst + 3] = 255;
    }
  }
}

await fs.copyFile(logoSource, path.join(assetsDir, 'logo-pinmoo-original.png'));
const logo = await decodePng(logoSource);
for (let i = 0; i < logo.data.length; i += 4) {
  const r = logo.data[i];
  const g = logo.data[i + 1];
  const b = logo.data[i + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max > 218 && max - min < 18) logo.data[i + 3] = 0;
}
const cleanLogo = trimTransparent(logo, 16);
await fs.writeFile(path.join(assetsDir, 'logo-pinmoo-clean.png'), encodePng(cleanLogo.data, cleanLogo.width, cleanLogo.height));
await fs.writeFile(path.join(assetsDir, 'logo-pinmoo-white.png'), encodePng(flatten(cleanLogo, [255,255,255]).data, cleanLogo.width, cleanLogo.height));

const og = { width: 1200, height: 630, data: new Uint8Array(1200 * 630 * 4).fill(255) };
const ogLogo = resize(cleanLogo, 760, Math.round(760 * cleanLogo.height / cleanLogo.width));
composite(og, ogLogo, Math.round((1200 - ogLogo.width) / 2), 210);
await fs.writeFile(path.join(assetsDir, 'og-pinmoo.png'), encodePng(og.data, og.width, og.height));

const aboutSvg = '<svg width="960" height="600" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="b" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#eaf2ff"/></linearGradient><linearGradient id="line" x1="0" x2="1"><stop stop-color="#1E3A5F"/><stop offset="1" stop-color="#7B3FF2"/></linearGradient></defs><rect width="960" height="600" fill="url(#b)"/><rect x="90" y="112" width="780" height="376" rx="28" fill="#fff" stroke="#d9e3f3"/><path d="M128 408 C230 360 308 420 422 374 C548 322 660 248 820 272" fill="none" stroke="url(#line)" stroke-width="10" stroke-linecap="round"/><circle cx="830" cy="270" r="13" fill="#FF6B35"/><rect x="138" y="332" width="164" height="86" rx="18" fill="#edf4ff"/><rect x="330" y="292" width="164" height="126" rx="18" fill="#f0fff6"/><rect x="522" y="240" width="164" height="178" rx="18" fill="#fff3ec"/><text x="480" y="215" text-anchor="middle" fill="#1E3A5F" font-size="42" font-family="Arial, sans-serif" font-weight="700">PINMOO 品沐咨询</text><text x="220" y="384" text-anchor="middle" fill="#124BD8" font-size="26" font-family="Arial" font-weight="700">诊断</text><text x="412" y="360" text-anchor="middle" fill="#22A761" font-size="26" font-family="Arial" font-weight="700">陪跑</text><text x="604" y="330" text-anchor="middle" fill="#FF6B35" font-size="26" font-family="Arial" font-weight="700">复盘</text></svg>';
await fs.writeFile(path.join(assetsDir, 'about-brand.svg'), aboutSvg, 'utf8');

const casesImage = await decodePng(casesSource);
const crops = [
  ['womenswear-refund-optimization', { left: 134, top: 333, width: 142, height: 185 }],
  ['personal-care-device-positioning', { left: 619, top: 333, width: 137, height: 185 }],
  ['tea-brand-platform-synergy', { left: 1080, top: 333, width: 139, height: 185 }],
  ['children-nutrition-compliance', { left: 134, top: 544, width: 142, height: 185 }],
  ['traditional-enterprise-ecommerce-launch', { left: 619, top: 544, width: 137, height: 185 }],
  ['wine-store-diagnosis', { left: 1080, top: 544, width: 139, height: 185 }]
];
for (const item of crops) {
  const cropped = crop(casesImage, item[1]);
  const resized = resize(cropped, 900, 620);
  await fs.writeFile(path.join(casesDir, item[0] + '.png'), encodePng(resized.data, resized.width, resized.height));
}
console.log('Assets prepared');
