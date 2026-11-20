import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredAssets = [
  'public/assets/logo-pinmoo-clean.png',
  'public/assets/logo-pinmoo-clean.webp',
  'public/assets/logo-pinmoo-original.png',
  'public/assets/og-pinmoo.png',
  'public/assets/about-brand.svg'
];

const missing = [];
for (const filename of requiredAssets) {
  const stat = await fs.stat(path.join(root, filename)).catch(() => null);
  if (!stat?.isFile()) missing.push(filename);
}

if (missing.length) {
  console.error('缺少已生成的官网图片：');
  missing.forEach((filename) => console.error(`- ${filename}`));
  console.error('请使用可信的本地图像工具重新生成，并在提交前人工复核。');
  process.exit(1);
}

console.log('官网图片已就绪。此命令不再下载或执行第三方远程代码。');
