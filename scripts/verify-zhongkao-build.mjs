import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'dist', 'zhongkao');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (file) => fs.readFile(path.join(appDir, file), 'utf8').catch(() => '');

const [index, verifyIndex, mainApp, navigation, styles, specialIndex, specialApp, unlockIndex, unlockApp, serialManagerIndex, privacyIndex, firstBatchText, manifestText, schoolsText, admissionsText, robots, sitemap] = await Promise.all([
  read('index.html'), read('verify/index.html'), read('app.js'), read('navigation.js'), read('styles.css'), read('special/index.html'), read('special/app.js'), read('unlock/index.html'), read('unlock/unlock.js'), read('serial-key/index.html'), read('privacy/index.html'), read('data/first-batch-2026.json'), read('data/manifest.json'), read('data/schools.json'), read('data/admissions.json'), read('robots.txt'), read('sitemap.xml')
]);
expect(serialManagerIndex.includes('noindex, nofollow, noarchive, nosnippet'), 'serial manager must not be indexed');
expect(privacyIndex.includes('隐私说明') && privacyIndex.includes('本系统不要求填写姓名'), 'privacy notice is incomplete');
expect(robots.includes('Disallow: /serial-key/'), 'robots must disallow the serial manager');
expect(index.includes('class="quick-return"') && specialIndex.includes('class="quick-return"') && unlockIndex.includes('class="quick-return"'), 'three pages must expose quick return controls');
expect(navigation.includes('scrollHistory') && navigation.includes('data-smart-back') && navigation.includes('sameOriginReferrer'), 'safe return navigation is incomplete');
expect(navigation.includes('window.location.assign(homeReturn.href)') && !navigation.includes('homeReturn && !document.body.classList.contains(\'zhongkao-home\') && sameOriginReferrer()'), '助手首页仍可能被浏览历史劫持');
expect(verifyIndex.includes('id="schoolDetailDialog"') && mainApp.includes('openSchoolDetail'), '预计录取去向缺少学校详情入口');
expect(index.includes('https://zhongkao.pinmooconsulting.com/'), 'canonical 或 og:url 不是 zhongkao.pinmooconsulting.com');
expect(index.includes('本系统仅供参考'), '页面缺少完整免责声明');
expect(index.includes('./app.js'), '页面缺少应用脚本');
expect(styles.includes('[hidden] { display: none !important; }'), '隐藏字段缺少全局样式保护');
expect(index.includes('./special/'), '主页面缺少第一批次资格查询入口');
expect(specialIndex.includes('https://zhongkao.pinmooconsulting.com/special/'), '资格查询页 canonical 不正确');
expect(index.includes('href="./unlock/"') && specialIndex.includes('href="../unlock/"'), '全站顶栏缺少账户与解锁入口');
expect(unlockIndex.includes('id="serialForm"') && unlockIndex.includes('每个序列号最多绑定两台设备'), '解锁页缺少序列号和两设备规则说明');
expect(unlockIndex.includes('本系统仅供参考') && !unlockIndex.includes('本机测试') && !unlockIndex.includes('testUnlock'), '解锁页仍暴露本机测试或缺少免责声明');
expect(unlockApp.includes('/api/access/serial/redeem') && !unlockApp.includes('testUnlock'), '账户页未接入真实序列号验证接口');
expect(specialIndex.includes('本系统仅供参考'), '资格查询页缺少完整免责声明');
expect(specialIndex.includes('./app.js') && specialApp.includes('first-batch-2026.json'), '资格查询应用入口或数据契约缺失');
expect(specialIndex.includes('id="talentProject"') && specialApp.includes("'足球'"), '特长生页面缺少按项目归类的学校筛选入口');
expect(specialApp.includes('talentResults'), '特长生学校卡片缺少官方结果展示');
expect(robots.includes('Sitemap: https://zhongkao.pinmooconsulting.com/sitemap.xml'), 'robots sitemap 不正确');
expect(sitemap.includes('<loc>https://zhongkao.pinmooconsulting.com/</loc>'), 'sitemap URL 不正确');
expect(sitemap.includes('<loc>https://zhongkao.pinmooconsulting.com/special/</loc>'), 'sitemap 缺少资格查询页');

try {
  const firstBatch = JSON.parse(firstBatchText);
  expect(firstBatch.year === 2026, '第一批次数据年度不是2026');
  expect(firstBatch.counts.generalHighSchoolTalentEntries >= 110, '普通高中特长生学校／项目记录不足');
  expect(firstBatch.counts.talentResultEntries >= 375, '2026第一批特长生录取结果记录不足');
  expect(firstBatch.counts.autonomousSchools === 56, '自主招生学校应为56所');
  expect(firstBatch.talentResults.length >= 375, '2026第一批特长生录取结果数据不完整');
  expect(firstBatch.talentResults.filter((row) => Number.isFinite(row.compositeScore)).length >= 300, '特长生末位合成成绩有效记录不足');
  expect(firstBatch.talentResults.every((row) => row.sourceId === 'official-2026-first-batch-result'), '特长生录取结果来源标识不一致');
  expect(firstBatch.specialTalent.every((row) => row.scoreReference?.display), '特长生学校缺少文化分参考');
  expect(firstBatch.autonomous.every((row) => row.prospectusUrl?.startsWith('https://gzzk.gz.gov.cn/attachment/')), '存在缺少官方简章的自主招生学校');
  expect(new Set(firstBatch.specialTalent.map((row) => row.id)).size === firstBatch.specialTalent.length, '特长生记录主键不唯一');
} catch {
  failures.push('first-batch-2026.json 不是有效JSON');
}

let manifest = null;
try { manifest = JSON.parse(manifestText); } catch { failures.push('manifest.json 不是有效JSON'); }
if (manifest) {
  expect(manifest.years.join(',') === '2021,2022,2023,2024,2025,2026', '历史年度覆盖不完整');
  expect(manifest.counts.allocations > 20000, '第二批名额分配记录不足');
  expect(manifest.counts.admissions > 1500, '第三、第四批录取记录不足');
  expect(manifest.counts.schoolLocations >= 250, '2026 school location records are incomplete');
}

try {
  const schools = JSON.parse(schoolsText);
  const admissions = JSON.parse(admissionsText);
  const schoolById = new Map(schools.map((school) => [school.id, school]));
  const currentSchoolIds = new Set(admissions.filter((row) => row.year === 2026).map((row) => row.schoolId));
  const missingLocations = [...currentSchoolIds].filter((schoolId) => !schoolById.get(schoolId)?.campusDistrict);
  expect(missingLocations.length === 0, `2026 current schools missing verified campus districts: ${missingLocations.length}`);
} catch {
  failures.push('school location validation files are not valid JSON');
}

for (const file of ['app.js', 'engine.js', 'navigation.js', 'styles.css', 'favicon.svg', 'assets/og-cover.png', 'assets/previews/direction-result.webp', 'assets/previews/target-result.webp', 'assets/previews/analysis-score.webp', 'special/index.html', 'special/app.js', 'special/special.css', 'unlock/index.html', 'unlock/unlock.js', 'unlock/unlock.css', 'data/first-batch-2026.json', 'data/schools.json', 'data/admissions.json', 'data/allocations-2026.json']) {
  const stat = await fs.stat(path.join(appDir, file)).catch(() => null);
  expect(Boolean(stat?.isFile()), `缺少 ${file}`);
}

if (failures.length) {
  console.error(`中考助手构建检查失败，共${failures.length}项：`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`中考助手构建检查通过：${manifest.version}，${manifest.counts.allocations}条名额分配记录。`);
