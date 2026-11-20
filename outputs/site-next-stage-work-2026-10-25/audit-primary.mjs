import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pageIds } from '../../scripts/event-schema.mjs';

const output = new URL('./private/', import.meta.url);
const phase = process.argv[2] || 'before';
if (!['before', 'after'].includes(phase)) throw Error('Use before or after');
mkdirSync(output, { recursive: true });
const command = [
  'printf "\\n===VERSION===\\n"; cat /var/www/pinmoo-current/site-build.json',
  'printf "\\n===EVENTS===\\n"; cat /etc/nginx/conf.d/pinmoo-events-http.conf',
  'printf "\\n===LOCATION===\\n"; cat /etc/nginx/snippets/pinmoo-events-location.conf',
  'printf "\\n===ROTATION===\\n"; cat /etc/logrotate.d/pinmoo-events',
  'printf "\\n===LOGFILES===\\n"; ls -l /var/log/pinmoo-events',
  'printf "\\n===CERT===\\n"; openssl x509 -in /etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem -noout -dates',
  'printf "\\n===SOURCE===\\n"; git -C /var/www/pinmoo.top rev-parse HEAD; git -C /var/www/pinmoo.top status --porcelain'
].join('; ');
const raw = execFileSync('ssh.exe', ['-i', 'C:/Users/Administrator/.ssh/pinmoo_aliyun_deploy', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', 'root@8.138.23.88', command], { encoding: 'utf8', timeout: 30000 });
writeFileSync(new URL(`./server-${phase}.txt`, output), raw, { flag: 'wx' });
const eventConfig = raw.split('===EVENTS===\n')[1].split('===LOCATION===')[0];
const pageMap = eventConfig.split('map $arg_page $pinmoo_event_page {')[1].split('}')[0];
const remoteIds = [...pageMap.matchAll(/~\^([^$]+)\$/g)].map(match => match[1]);
const result = {
  checkedAt: new Date().toISOString(),
  version: JSON.parse(raw.split('===VERSION===\n')[1].split('===EVENTS===')[0]),
  expectedPageIds: pageIds.length,
  serverPageIds: remoteIds.length,
  missingOnServer: pageIds.filter(id => !remoteIds.includes(id)),
  obsoleteOnServer: remoteIds.filter(id => !pageIds.includes(id))
};
writeFileSync(new URL(`./event-coverage-${phase}.json`, output), JSON.stringify(result, null, 2), { flag: 'wx' });
console.log(JSON.stringify(result, null, 2));
