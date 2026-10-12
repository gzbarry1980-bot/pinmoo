// 仅对本次返工改动的 6 个文件做缓存破坏版本号滚动（→ 20261012）。
// 不触碰 navigation.js / access-gate.js / home.js / unlock.js 等未改动文件。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const NEWV = '20261012';
const targets = [
  'experience.css',
  'motion-theme.css',
  'ui-redesign-20261011.css',
  'typography.css',
  'experience.js',
  'app.js',
];

const skipDirs = new Set(['.workbuddy', 'node_modules', 'docs', 'qa', '.git']);
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!skipDirs.has(e.name)) walk(p); }
    else if (/\.(html|js)$/.test(e.name)) files.push(p);
  }
}
walk(base);

let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const orig = s;
  for (const t of targets) {
    const re = new RegExp(t.replace(/[.\-]/g, '\\$&') + '\\?v=[^"\'\\s>]+', 'g');
    s = s.replace(re, `${t}?v=${NEWV}`);
  }
  if (s !== orig) { fs.writeFileSync(f, s); changed++; console.log('bumped', path.relative(base, f)); }
}
console.log('files changed:', changed);
