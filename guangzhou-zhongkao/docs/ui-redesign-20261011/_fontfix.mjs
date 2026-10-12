import {readFileSync, writeFileSync} from 'node:fs';
const files = ['E:/pinmoo/guangzhou-zhongkao/experience.css', 'E:/pinmoo/guangzhou-zhongkao/motion-theme.css'];
for (const f of files) {
  let s = readFileSync(f, 'utf8');
  let c32 = (s.match(/font-size:\s*32px\s*!important/g) || []).length;
  let c13 = (s.match(/font-size:\s*13px\s*!important/g) || []).length;
  s = s.replace(/font-size:\s*32px\s*!important/g, 'font-size:24px!important');
  s = s.replace(/font-size:\s*13px\s*!important/g, 'font-size:14px!important');
  writeFileSync(f, s);
  console.log(`${f.split('/').pop()}: replaced 32px!important x${c32}, 13px!important x${c13}`);
}
// 同步更新 :root 令牌（仅 experience.css）
const exp = 'E:/pinmoo/guangzhou-zhongkao/experience.css';
let e = readFileSync(exp, 'utf8');
e = e.replace('--zk-font-title:32px', '--zk-font-title:24px')
     .replace('--zk-font-note:13px', '--zk-font-note:14px')
     .replace(':root{--ink', ':root{--zk-fs-title:24px;--zk-fs-body:16px;--zk-fs-note:14px;--ink');
writeFileSync(exp, e);
console.log('experience.css :root tokens updated');
