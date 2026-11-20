import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, '../../guangzhou-zhongkao/engine.js');
const targetPath = resolve(here, '../../guangzhou-zhongkao/miniprogram/services/engine.js');
const source = await readFile(sourcePath, 'utf8');
const names = [...source.matchAll(/^export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)].map((match) => match[1]);
if (!names.length) throw new Error('未找到可导出的中考引擎函数');
const commonjs = source.replace(/^export\s+(?=(?:const|function)\b)/gm, '')
  + `\n\n// Generated from guangzhou-zhongkao/engine.js. Do not edit by hand.\nmodule.exports = { ${names.join(', ')} };\n`;
await writeFile(targetPath, commonjs, 'utf8');
console.log(`Generated ${targetPath} (${names.length} exports)`);
