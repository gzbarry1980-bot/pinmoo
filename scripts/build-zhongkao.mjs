import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'guangzhou-zhongkao');
const target = path.join(root, 'dist', 'zhongkao');

const sourceStat = await fs.stat(source).catch(() => null);
if (!sourceStat?.isDirectory()) {
  throw new Error(`Missing Guangzhou Zhongkao source directory: ${source}`);
}

await fs.rm(target, { recursive: true, force: true });
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.cp(source, target, { recursive: true, force: true });

console.log(`Built Guangzhou Zhongkao site to ${path.relative(root, target)}`);
