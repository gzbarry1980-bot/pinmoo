import './site-shell.js?v=20261013-school';
import {simplifyVisibleCopy} from './parent-copy.js?v=20261018-policy';
import {latestAdmissionYear} from './policy-context.js';
try{const r=await fetch('/data/manifest.json');if(!r.ok)throw new Error();const d=await r.json();document.getElementById('homeDataStatus').textContent=`已收录2027—2029改革政策 · 录取数据截至${latestAdmissionYear(d)}年 · ${d.counts.admissions.toLocaleString()}条第三/第四批记录。年度细则与计划待核对。`;}catch{document.getElementById('homeDataStatus').textContent='数据版本暂时无法读取；请稍后刷新。';}
simplifyVisibleCopy(document.getElementById('homeDataStatus'));
