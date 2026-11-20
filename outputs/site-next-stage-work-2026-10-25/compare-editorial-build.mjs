import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const previous = new URL('./accepted-build/', import.meta.url);
const current = new URL('./check-20261028-editorial/dist/', import.meta.url);
async function files(root, relative = '') {
  const entries = await fs.readdir(new URL(relative, root), { withFileTypes: true });
  const result = [];
  for (const item of entries) {
    const name = path.posix.join(relative, item.name);
    if (item.isDirectory()) result.push(...await files(root, name + '/'));
    else if (item.isFile()) result.push(name);
  }
  return result;
}
const hash = data => createHash('sha256').update(data).digest('hex');
const before = new Set(await files(previous));
const after = new Set(await files(current));
const changed = [], added = [], removed = [];
for (const file of after) {
  if (!before.has(file)) added.push(file);
  else if (hash(await fs.readFile(new URL(file, previous))) !== hash(await fs.readFile(new URL(file, current)))) changed.push(file);
}
for (const file of before) if (!after.has(file)) removed.push(file);
console.log(JSON.stringify({ changed, added, removed }, null, 2));
