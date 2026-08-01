import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { loadConfig } from './config.mjs';

const config = loadConfig();
const backupDir = path.resolve(process.env.ZHONGKAO_BACKUP_DIR || '/var/backups/zhongkao-access');
const retentionDays = Number.parseInt(process.env.ZHONGKAO_BACKUP_RETENTION_DAYS || '30', 10);
const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
const target = path.join(backupDir, `access-${stamp}.sqlite`);
const temporary = `${target}.tmp`;

if (!Number.isInteger(retentionDays) || retentionDays < 7 || retentionDays > 365) {
  throw new Error('ZHONGKAO_BACKUP_RETENTION_DAYS must be between 7 and 365');
}

fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
fs.chmodSync(backupDir, 0o700);
fs.rmSync(temporary, { force: true });

const db = new DatabaseSync(config.dbPath);
try {
  db.exec('PRAGMA busy_timeout = 10000;');
  db.exec(`VACUUM INTO '${temporary.replaceAll("'", "''")}';`);
} finally {
  db.close();
}

fs.renameSync(temporary, target);
fs.chmodSync(target, 0o600);

const cutoff = Date.now() - retentionDays * 86400_000;
for (const entry of fs.readdirSync(backupDir, { withFileTypes: true })) {
  if (!entry.isFile() || !/^access-\d{8}\.sqlite$/.test(entry.name)) continue;
  const filename = path.join(backupDir, entry.name);
  if (fs.statSync(filename).mtimeMs < cutoff) fs.rmSync(filename, { force: true });
}

console.log(`zhongkao access backup complete: ${path.basename(target)}`);
