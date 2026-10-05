import './site-shell.js';
import {simplifyVisibleCopy} from './parent-copy.js';
try{const r=await fetch('/data/manifest.json');if(!r.ok)throw new Error();const d=await r.json();document.getElementById('homeDataStatus').textContent=`政策口径 ${d.latestPolicyYear}年 · ${d.counts.admissions.toLocaleString()}条第三/第四批录取记录 · 数据版本 ${d.version}。部分历史年份缺失，详见覆盖说明。`;}catch{document.getElementById('homeDataStatus').textContent='数据版本暂时无法读取；请稍后刷新。';}
simplifyVisibleCopy(document.getElementById('homeDataStatus'));
