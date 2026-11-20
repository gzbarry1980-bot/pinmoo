import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = new URL('./', import.meta.url);
const kit = new URL('./deploy-kit/', root);
await fs.mkdir(kit, { recursive: true });
for (const [source, target] of [
  ['outputs/site-next-stage-work-2026-10-25/publish-reviewed.sh', 'publish-reviewed.sh'],
  ['scripts/publish-primary-release.sh', 'scripts/publish-primary-release.sh'],
  ['deploy/nginx/pinmoo-events-location.conf', 'deploy/nginx/pinmoo-events-location.conf'],
  ['deploy/pinmoo-events.logrotate', 'deploy/pinmoo-events.logrotate'],
  ['outputs/site-next-stage-work-2026-10-25/private/primary-next.conf', 'primary-next.conf']
]) {
  const destination = new URL(target, kit);
  await fs.mkdir(path.dirname(destination.pathname.replace(/^\/(\w:)/, '$1')), { recursive: true });
  await fs.writeFile(destination, (await fs.readFile(source, 'utf8')).replace(/\r\n/g, '\n'));
}
await fs.copyFile(new URL('./release.tar.gz', root), new URL('./release.tar.gz', kit));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const version = JSON.parse(await fs.readFile('dist/site-build.json', 'utf8'));
const record = { preparedAt: new Date().toISOString(), build: version, packageHash: hash(await fs.readFile(new URL('./release.tar.gz', root))), previousConfigHash: hash(await fs.readFile(new URL('./private/primary-before.conf', root))), targetConfigHash: hash(await fs.readFile(new URL('./primary-next.conf', kit))) };
await fs.writeFile(new URL('./release-manifest.json', root), JSON.stringify(record, null, 2));
console.log(JSON.stringify(record, null, 2));
