import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const { chromium } = createRequire(import.meta.url)('C:/Users/Administrator/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const root = 'E:/pinmoo/guangzhou-zhongkao/research/wecom-source-20261005';
await fs.mkdir(`${root}/screenshots`, {recursive:true});
const browser = await chromium.connectOverCDP('http://127.0.0.1:9227');
const page = browser.contexts()[0].pages().find(p=>p.url().includes('doc.weixin.qq.com'));
await page.setViewportSize({width:1920,height:1080});
const names=['近4年第三批户籍生录取分数线','第四批次公办录取分数线','公费班及国际方向录取分数线','广州高中近三年出口成绩统计','24-26一分一段表','2026名额分配最低控制线','2026年名额分配录取分数','2026自主招生录取分数'];
const manifest=process.env.WECOM_SHEET ? JSON.parse(await fs.readFile(`${root}/capture-manifest.json`,'utf8')) : {source:page.url(),captured_at:new Date().toISOString(),method:'User-authorized normal visible UI screenshots; no export or hidden data APIs',sheets:[]};
for(let s=0;s<names.length;s++){
  if(process.env.WECOM_SHEET && Number(process.env.WECOM_SHEET)!==s+1)continue;
  await page.setViewportSize({width:1920,height:s===6?2400:1080});
  await page.getByText(names[s],{exact:true}).last().click();
  await page.waitForTimeout(200);
  const filter=page.locator('#toolbar-button-filter').last();
  const wasFiltered=await filter.getAttribute('aria-pressed')==='true';
  if(wasFiltered){await page.mouse.click(800,98);await page.waitForTimeout(180);}
  const extent=['Z294','Z200','Z200','Z200','Z357','Z200','Z7283','Z200'][s];
  const sheet={name:names[s],grid_extent:extent,view_filter_temporarily_disabled:wasFiltered,captures:[]};
  // Ctrl+End reports the visible grid's end, including unused cells. Capture all of it.
  for(let horizontal=0;horizontal<(s===6?1:2);horizontal++){
    await page.mouse.move(1100,750);await page.mouse.wheel(-9999999,-9999999);await page.waitForTimeout(180);
    if(horizontal){await page.mouse.move(1600,700);await page.mouse.wheel(12000,0);await page.waitForTimeout(150);}
    let previous='',same=0;
    for(let frame=0;frame<200;frame++){
      await page.waitForTimeout(140);
      const buffer=await page.screenshot();
      const hash=crypto.createHash('sha256').update(buffer).digest('hex');
      if(hash===previous){if(++same>=2)break;}else same=0;
      previous=hash;
      const file=`screenshots/s${String(s+1).padStart(2,'0')}-h${horizontal}-p${String(frame).padStart(3,'0')}.png`;
      await fs.writeFile(`${root}/${file}`,buffer);
      sheet.captures.push({file,sha256:hash,horizontal,frame});
      await page.mouse.move(1100,750);await page.mouse.wheel(0,s===6?1900:500);
    }
  }
  const old=manifest.sheets.findIndex(x=>x.name===sheet.name);
  if(old>=0)manifest.sheets[old]=sheet;else manifest.sheets.push(sheet);
  await fs.writeFile(`${root}/capture-manifest.json`,JSON.stringify(manifest,null,2));
  console.log(`${s+1}/8 ${names[s]} ${extent}: ${sheet.captures.length} screenshots`);
  if(wasFiltered){await page.mouse.click(800,98);await page.waitForTimeout(150);}
}
await browser.close();
