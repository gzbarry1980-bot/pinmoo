import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'E:/pinmoo/outputs/zhongkao-videos-20260724/scenes';
const base = 'https://zhongkao.pinmoo.top/';
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 540, height: 960 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
  colorScheme: 'light'
});
const page = await context.newPage();

async function shot(name, target = null) {
  if (target) {
    await page.locator(target).scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
  }
  await page.screenshot({ path: `${output}/${name}.png` });
}

await page.goto(base, { waitUntil: 'networkidle' });
await shot('01-home');

await page.locator('#directionTab').click();
await shot('02-three-modes', '.workspace-switch');
await shot('03-direction-form', '#directionForm');
await page.selectOption('#directionDistrict', { label: '天河区' });
await page.selectOption('#directionHouseholdDistrict', { label: '天河区' });
await page.locator('#generateDirection').click();
await page.locator('#directionResult').waitFor({ state: 'visible' });
await shot('04-direction-result', '#directionResult');
await shot('05-direction-schools', '#directionGroups');
await page.locator('[data-direction-risk="稳健"]').click();
await page.waitForTimeout(500);
await shot('06-risk-switch', '#directionResult');

await page.locator('#targetTab').click();
await page.locator('#targetSchoolName').fill('广州市培正中学');
await page.locator('#targetCurrentScore').fill('630');
await page.selectOption('#targetAdmissionDistrict', { label: '越秀区' });
await page.selectOption('#targetHouseholdDistrict', { label: '越秀区' });
await shot('07-target-form', '#targetForm');
await page.locator('#analyzeTarget').click();
await page.locator('#targetResult').waitFor({ state: 'visible' });
await shot('08-target-result', '#targetResult');

await page.locator('#directionTab').click();
await page.locator('#adoptDirection').click();
await page.locator('#profile').waitFor({ state: 'visible' });
await shot('09-profile', '#profile');
await shot('10-school-explorer', '#schoolExplorer');
await shot('11-volunteer-plan', '#volunteerForm');
await page.locator('#analyzePlan').click();
await page.locator('#analysis').waitFor({ state: 'visible' });
await shot('12-analysis-score', '#analysis');
await shot('13-improvements', '#improvementSection');

await page.goto(`${base}special/`, { waitUntil: 'networkidle' });
await shot('14-special-home');
await page.waitForFunction(() => [...document.querySelector('#talentProject').options].some((option) => option.value === '足球'));
await page.selectOption('#talentProject', '足球');
await page.locator('#viewMatchedSchools').click();
await page.waitForTimeout(700);
await shot('15-football-schools', '#schoolTitle');

await browser.close();
console.log(`Captured 15 real-site scenes in ${output}`);
