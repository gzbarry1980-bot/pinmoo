import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'guangzhou-zhongkao');
const target = path.join(root, 'dist', 'zhongkao');
const publicDirectories=new Set(['assets','data','direction','target','verify','special','quota','unlock','serial-key','privacy','schools','plans','my','admissions']);
const publicExtensions=new Set(['.html','.js','.css','.json','.xml','.txt','.svg','.png','.webp','.jpg','.jpeg','.gif','.ico','.woff','.woff2']);

const sourceStat = await fs.stat(source).catch(() => null);
if (!sourceStat?.isDirectory()) {
  throw new Error(`Missing Guangzhou Zhongkao source directory: ${source}`);
}

await fs.rm(target, { recursive: true, force: true });
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.cp(source, target, { recursive: true, force: true, filter: async input => {
  const relative=path.relative(source,input);
  if(!relative)return true;
  const parts=relative.split(path.sep);
  if(parts.some(part=>part.startsWith('.')))return false;
  const stat=await fs.stat(input);
  if(stat.isDirectory())return publicDirectories.has(parts[0]);
  if(parts.length>1&&!publicDirectories.has(parts[0]))return false;
  if(relative===path.join('assets','campus-editorial-20261005.png'))return false; // Keep the full-resolution original local, serve WebP.
  return publicExtensions.has(path.extname(input).toLowerCase());
} });

console.log(`Built Guangzhou Zhongkao site to ${path.relative(root, target)}`);
