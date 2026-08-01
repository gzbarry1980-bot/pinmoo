import { BATCH_LIMITS, evaluatePlan, replayPlan, schoolFamilyKey, simulateOutcomes } from './engine.js?v=20260729b';
import { simulateOutcomesRealistic } from './realistic-sim.js?v=20260729b';

const DISCLAIMER = '本系统依据公开招生政策及历史数据进行模拟分析，所示评分、录取机会和学校建议均为统计估计，不代表官方录取结果或任何录取承诺。招生政策、计划、报考范围、成绩分布和志愿竞争每年可能变化，请以当年广州市教育局、广州市招生考试委员会办公室及中考服务平台最终公布的信息为准。名额分配、随迁子女、跨区及其他资格请向学校或招考部门核实。志愿选择由考生及监护人自行决定。本系统仅供参考。';

const $ = (selector) => document.querySelector(selector);
const navigateTo = (target, options = {}) => {
  if (window.ZhongkaoNavigation?.scrollTo(target, options)) return;
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  element?.scrollIntoView({ behavior: 'smooth', block: options.block || 'start' });
};
const storageKey = 'pinmoo-guangzhou-zhongkao-draft-v1';
const realisticPrefKey = 'pinmoo-guangzhou-zhongkao-realistic';
let useRealisticSim = false;

function loadRealisticPref() {
  try { useRealisticSim = localStorage.getItem(realisticPrefKey) === '1'; } catch { useRealisticSim = false; }
  const a = $('#realisticSim'); if (a) a.checked = useRealisticSim;
  const b = $('#realisticSimDirection'); if (b) b.checked = useRealisticSim;
}
function setRealisticSim(value) {
  useRealisticSim = value;
  try { localStorage.setItem(realisticPrefKey, value ? '1' : '0'); } catch { /* 忽略隐私模式下的写入失败 */ }
  const a = $('#realisticSim'); if (a) a.checked = value;
  const b = $('#realisticSimDirection'); if (b) b.checked = value;
}
// 模拟路由：默认走 engine.simulateOutcomes（录取判断不变），开启高保真走 realistic-sim.js
function runSimulation(profile, plan, dataset, seed, iterations) {
  return useRealisticSim
    ? simulateOutcomesRealistic(profile, plan, dataset, { seed, iterations })
    : simulateOutcomes(profile, plan, dataset, seed, iterations);
}
const districts = ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'];
const batchNames = { 2: '第二批次 · 名额分配', 3: '第三批次 · 示范性及优质高中统招', 4: '第四批次 · 普通高中及综合高中' };
const batchNotes = { 2: '资格优先：只填所在初中有名额且愿意去的学校', 3: '主战场：建议1—2个冲刺、2—3个匹配、至少1个保底', 4: '兜底层：最后2个位置放真正能接受且把握较高的学校' };

let dataset = null;
let plan = [];
let latestAnalysis = null;
let latestScore = null;
let directionDraft = null;
let directionAnalysis = null;
let directionScore = null;
let targetDraft = null;
let targetDraftProfile = null;
let targetResultData = null;
let pendingDraft = null;
const allocationCache = new Map();

function makePlan() {
  return Object.entries(BATCH_LIMITS).flatMap(([batch, count]) => Array.from({ length: count }, (_, index) => ({
    key: `b${batch}-${index + 1}`,
    batch: Number(batch),
    position: index + 1,
    schoolId: '',
    schoolName: ''
  })));
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2800);
}

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`读取失败：${url} (${response.status})`);
  return response.json();
}

async function loadCoreData() {
  const [manifest, schools, sourceSchools, admissions, bands, lines, sources] = await Promise.all([
    json('/data/manifest.json'),
    json('/data/schools.json'),
    json('/data/source-schools.json'),
    json('/data/admissions.json'),
    json('/data/score-bands.json'),
    json('/data/control-lines.json'),
    json('/data/sources.json')
  ]);
  dataset = { manifest, schools, sourceSchools, admissions, bands, lines, sources, allocations: [] };
  const dataVersionEl = $('#dataVersion');
  if (dataVersionEl) dataVersionEl.textContent = `官方数据 ${manifest.version} · ${manifest.counts.admissions.toLocaleString()}条统招记录`;
}

async function allocationsForYear(year) {
  const actualYear = Math.min(Number(year), dataset.manifest.latestPolicyYear);
  if (!allocationCache.has(actualYear)) {
    allocationCache.set(actualYear, json(`/data/allocations-${actualYear}.json`));
  }
  return allocationCache.get(actualYear);
}

function setupSelectors() {
  const districtOptions = districts.map((item) => `<option value="${item}">${item}</option>`).join('');
  const setDistrict = (id, fallback) => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = districtOptions; el.value = fallback; }
  };
  setDistrict('admissionDistrict', '天河区');
  setDistrict('householdDistrict', '天河区');
  setDistrict('schoolDistrict', '天河区');
  setDistrict('directionDistrict', '天河区');
  setDistrict('directionHouseholdDistrict', '天河区');
  setDistrict('targetAdmissionDistrict', '天河区');
  setDistrict('targetHouseholdDistrict', '天河区');
  if (document.getElementById('targetYear')) renderTargetYears();
  const sourceEl = document.getElementById('sourceSchoolId');
  if (sourceEl) sourceEl.innerHTML = '<option value="">请选择所在初中</option>' + dataset.sourceSchools
    .map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  if (document.getElementById('targetSchoolName')) refreshTargetSchoolList();
}

function renderTargetYears() {
  const targetYearEl = document.getElementById('targetYear');
  if (!targetYearEl) return;
  const modeEl = document.getElementById('mode');
  const replay = modeEl ? modeEl.value === 'replay' : false;
  const latestYear = dataset.manifest.latestPolicyYear;
  const years = replay ? dataset.manifest.years : [latestYear + 1, latestYear + 2, latestYear + 3];
  const current = Number(targetYearEl.value);
  targetYearEl.innerHTML = years.map((year) => `<option value="${year}">${year}年${replay ? '' : '（预测）'}</option>`).join('');
  targetYearEl.value = years.includes(current) ? String(current) : String(replay ? latestYear : latestYear + 1);
  document.querySelectorAll('.forecast-only').forEach((node) => { node.hidden = replay; });
  document.querySelectorAll('.replay-only').forEach((node) => { node.hidden = !replay; });
  const policyBannerEl = document.getElementById('policyBanner');
  if (policyBannerEl) {
    policyBannerEl.textContent = `${latestYear + 1}及以后尚未发布正式规则时，暂按${latestYear}年志愿结构和投档规则模拟。`;
    policyBannerEl.hidden = replay;
  }
}

function getProfile() {
  const form = new FormData($('#profileForm'));
  return {
    mode: form.get('mode'),
    targetYear: Number(form.get('targetYear')),
    score: Number(form.get('score')),
    scoreLow: Number(form.get('scoreLow') || form.get('score')),
    scoreHigh: Number(form.get('scoreHigh') || form.get('score')),
    tieRank: Number(form.get('tieRank')) || null,
    candidateType: form.get('candidateType'),
    admissionDistrict: form.get('admissionDistrict'),
    householdDistrict: form.get('householdDistrict'),
    schoolDistrict: form.get('schoolDistrict'),
    sourceSchoolId: form.get('sourceSchoolId'),
    referenceGrade: form.get('referenceGrade'),
    riskPreference: form.get('riskPreference'),
    ownershipPreference: form.get('ownershipPreference'),
    boardingPreference: form.get('boardingPreference'),
    maxAnnualFee: Number(form.get('maxAnnualFee')) || null,
    preferredDistricts: String(form.get('preferredDistricts') || '').split(/[，,]/).map((item) => item.trim()).filter(Boolean),
    excludedSchools: String(form.get('excludedSchools') || '').split(/[，,]/).map((item) => item.trim()).filter(Boolean),
    crossDistrict: $('#crossDistrict').checked,
    quotaEligible: $('#quotaEligible').checked,
    notAdmittedFirstBatch: $('#notAdmittedFirstBatch').checked
  };
}

function setWorkspaceMode(mode, shouldScroll = false) {
  // 重构为独立页面后，每个页面只含自己的功能区块（HTML 已默认显示），
  // 不再需要整页切换显隐。此函数仅用于首页控制 landing 显隐；
  // 子页面不含 landing / 各 workspace 区块，调用时无副作用。
  const landing = $('#landing');
  if (landing) landing.hidden = mode !== 'home';
  if (shouldScroll && mode !== 'home') {
    const target = { direction: $('#directionWorkspace'), target: $('#targetWorkspace'), verify: $('#verifyWorkspace') }[mode];
    if (target && !target.hidden) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getDirectionProfile() {
  const low = Number($('#directionLow').value);
  const high = Number($('#directionHigh').value);
  const district = $('#directionDistrict').value;
  const householdDistrict = $('#directionHouseholdDistrict').value;
  return {
    mode: 'forecast',
    targetYear: dataset.manifest.latestPolicyYear + 1,
    score: Math.round((low + high) / 2),
    scoreLow: low,
    scoreHigh: high,
    tieRank: null,
    candidateType: $('#directionCandidateType').value,
    admissionDistrict: district,
    householdDistrict,
    schoolDistrict: district,
    sourceSchoolId: '',
    referenceGrade: 'C',
    riskPreference: $('#directionRisk').value,
    ownershipPreference: $('#directionOwnership').value,
    boardingPreference: '不限',
    maxAnnualFee: null,
    preferredDistricts: [householdDistrict],
    excludedSchools: [],
    crossDistrict: false,
    quotaEligible: false,
    notAdmittedFirstBatch: true
  };
}

function directionScopeEligible(profile, record) {
  if (record.scope === '全市') return true;
  if (record.scope === '老三区') return ['荔湾区', '越秀区', '海珠区'].includes(profile.admissionDistrict);
  if (record.scope?.includes(profile.admissionDistrict)) return true;
  return record.candidateType === '外区生';
}

function directionPattern(risk, batch) {
  if (risk === '稳健') return batch === 3 ? ['冲刺', '匹配', '匹配', '保底', '保底', '保底'] : ['匹配', '保底', '保底', '保底', '保底', '保底'];
  if (risk === '进取') return batch === 3 ? ['冲刺', '冲刺', '冲刺', '匹配', '匹配', '保底'] : ['冲刺', '匹配', '匹配', '保底', '保底', '保底'];
  return batch === 3 ? ['冲刺', '冲刺', '匹配', '匹配', '保底', '保底'] : ['匹配', '匹配', '保底', '保底', '保底', '保底'];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
}

function isSchoolSelected(selected, source) {
  if (!source?.schoolId) return false;
  return selected.has(`id:${source.schoolId}`) || selected.has(`family:${schoolFamilyKey(source.schoolName)}`);
}

function addSelectedSchool(selected, source) {
  if (!source?.schoolId) return;
  selected.add(`id:${source.schoolId}`);
  selected.add(`family:${schoolFamilyKey(source.schoolName)}`);
}

function selectedSchools(sources) {
  const selected = new Set();
  sources.filter((source) => source?.schoolId).forEach((source) => addSelectedSchool(selected, source));
  return selected;
}

function directionTierCounts(rows, field) {
  const counts = { 冲刺: 0, 匹配: 0, 保底: 0 };
  rows.forEach((row) => {
    const tier = row[field];
    if (Object.hasOwn(counts, tier)) counts[tier] += 1;
  });
  return counts;
}

function directionTierText(counts) {
  return `${counts.冲刺}冲 ${counts.匹配}稳 ${counts.保底}保`;
}

function directionCandidates(batch, profile, strictPreferences = false) {
  let records = uniqueSchools(recordsForBatch(batch, profile.targetYear, profile))
    .filter((record) => directionScopeEligible(profile, record));
  if (profile.ownershipPreference === '公办') records = records.filter((record) => record.ownership === '公办');
  if (strictPreferences) {
    records = records.filter((record) => !profile.excludedSchools.some((name) => record.schoolName.includes(name)));
    records = records.filter((record) => {
      const school = schoolPreferences(record.schoolId);
      if (profile.maxAnnualFee && Number.isFinite(school.annualFee) && school.annualFee > profile.maxAnnualFee) return false;
      if (profile.boardingPreference === '需要住宿' && school.boarding === false) return false;
      return true;
    });
    records.sort((a, b) => {
      const aSchool = schoolPreferences(a.schoolId);
      const bSchool = schoolPreferences(b.schoolId);
      const aPreferred = profile.preferredDistricts.includes(aSchool.campusDistrict || aSchool.district) ? 1 : 0;
      const bPreferred = profile.preferredDistricts.includes(bSchool.campusDistrict || bSchool.district) ? 1 : 0;
      return bPreferred - aPreferred || (b.cutoffScore || 0) - (a.cutoffScore || 0);
    });
  }
  return records;
}

function chooseDirectionSchool(records, tier, position, profile, selected) {
  const chanceTarget = tier === '冲刺' ? 30 : tier === '匹配' ? 60 : 84;
  const scoreTarget = tier === '冲刺' ? profile.scoreHigh + 8 : tier === '匹配' ? profile.score : profile.scoreLow - 20;
  const admissionRanks = new Map([...records].sort((a, b) => b.cutoffScore - a.cutoffScore || a.schoolName.localeCompare(b.schoolName, 'zh-CN')).map((record, index) => [record.schoolId, index + 1]));
  const candidates = records
    .filter((record) => !isSchoolSelected(selected, record))
    .sort((a, b) => Math.abs(a.cutoffScore - scoreTarget) - Math.abs(b.cutoffScore - scoreTarget))
    .slice(0, 70)
    .map((record, index) => {
      const slot = { key: `direction-screen-${record.batch}-${position}-${index}`, batch: record.batch, position, schoolId: record.schoolId, schoolName: record.schoolName };
      const screening = runSimulation(profile, [slot], dataset, 20260722 + record.batch * 100 + position, 600).slotResults[0];
      const metric = schoolMetric(record);
      const school = schoolPreferences(record.schoolId);
      const admissionRank = admissionRanks.get(record.schoolId) || records.length;
      const campusDistrict = school.campusDistrict || null;
      const sameHouseholdDistrict = campusDistrict === profile.householdDistrict;
      const rank = admissionRank * 0.5 + Math.abs(screening.chance - chanceTarget) * 0.15 + metric.volatility * 0.16 + (screening.yearsWithData < 3 ? 12 : 0) - (sameHouseholdDistrict ? 20 : 0);
      return { record, screening, rank, admissionRank, admissionTotal: records.length, schoolDistrict: campusDistrict, sameHouseholdDistrict };
    });
  const preferred = candidates.filter((item) => item.screening.tier === tier).sort((a, b) => a.rank - b.rank);
  return preferred[0] || candidates.sort((a, b) => a.rank - b.rank)[0] || null;
}

function buildDirectionDraft(profile, { strictPreferences = false } = {}) {
  const draft = makePlan();
  const selected = new Set();
  for (const batch of [3, 4]) {
    const records = directionCandidates(batch, profile, strictPreferences);
    const pattern = directionPattern(profile.riskPreference, batch);
    const slots = draft.filter((slot) => slot.batch === batch);
    pattern.forEach((tier, index) => {
      const choice = chooseDirectionSchool(records, tier, index + 1, profile, selected);
      if (!choice) return;
      const { record, screening, admissionRank, admissionTotal, schoolDistrict, sameHouseholdDistrict } = choice;
      addSelectedSchool(selected, record);
      Object.assign(slots[index], {
        schoolId: record.schoolId,
        schoolName: record.schoolName,
        directionTier: tier,
        latestCutoff: record.cutoffScore,
        latestTieRank: record.cutoffTieRank,
        lastVolunteerNo: record.lastVolunteerNo,
        volatility: schoolMetric(record).volatility,
        screeningChance: screening.chance,
        screeningInterval: screening.interval,
        screeningTier: screening.tier,
        screeningConfidence: screening.confidence,
        screeningYearsWithData: screening.yearsWithData,
        admissionRank,
        admissionTotal,
        schoolDistrict,
        sameHouseholdDistrict
      }, schoolPreferences(record.schoolId));
    });
  }
  return draft;
}

function renderDirectionResult(profile) {
  const configuredCounts = directionTierCounts(directionAnalysis.slotResults, 'directionTier');
  const singleSchoolCounts = directionTierCounts(directionAnalysis.slotResults, 'screeningTier');
  const hasTierDeviation = ['冲刺', '匹配', '保底'].some((tier) => configuredCounts[tier] !== singleSchoolCounts[tier]);
  const likely = directionAnalysis.outcomes.find((row) => row.key !== 'none');
  const usableYears = directionAnalysis.usableYears?.join('、') || '现有可用年份';
  updateDirectionRiskSwitch(profile.riskPreference);
  $('#directionTitle').textContent = `${profile.scoreLow}—${profile.scoreHigh}分 · ${profile.riskPreference}方向草案`;
  $('#directionSummary').textContent = `按中心估分${profile.score}分，以${dataset.manifest.latestPolicyYear}年规则和${usableYears}年可比历史情景生成。缺少完整批次或分数段的年份不再直接按落选处理；学校缺年时按同校最近年份位次折算并降低置信度。${useRealisticSim ? '已开启波动压力测试，额外加入发挥偏差、年际难度和压线不确定性。' : '当前使用标准历史情景。'}自动方案按学校体系去重，不重复推荐同一学校的其他校区或项目；最终去向按整组志愿顺序计算。${hasTierDeviation ? '个别学校的单校实测档位与策略目标不同，已在学校行中标注。' : ''}`;
  $('#directionStats').innerHTML = `
    <div class="direction-stat"><span>估分中心</span><strong>${profile.score}分</strong><small>模拟同时考虑${profile.scoreLow}—${profile.scoreHigh}分波动</small></div>
    <div class="direction-stat"><span>志愿配置</span><strong>${directionTierText(configuredCounts)}</strong><small>${profile.riskPreference}策略 · 按单校模拟把握安排</small></div>
    <div class="direction-stat"><span>方案合理度</span><strong>${directionScore.total}分</strong><small>${directionScore.label} · 不按中考总分高低直接加减分</small></div>
    <div class="direction-stat"><span>方案去向分布</span><strong>${directionAnalysis.noneProbability}%未录取风险</strong><small>最可能去向：${likely?.slot?.schoolName || '暂不明确'}</small></div>`;
  $('#directionGroups').innerHTML = [3, 4].map((batch) => {
    const rows = directionAnalysis.slotResults.filter((row) => row.batch === batch).sort((a, b) => a.position - b.position);
    return `<section class="direction-group"><div class="direction-group-head"><strong>第${batch}批方向</strong><small>${batch === 3 ? '优先安排目标学校，再逐步降低风险' : '重点补足真正愿意就读的保底学校'}</small></div>${rows.map((row) => {
      const singleInterval = Array.isArray(row.screeningInterval) ? row.screeningInterval : row.interval;
      const singleTier = row.screeningTier || row.directionTier || row.tier;
      const targetTier = row.directionTier || singleTier;
      const tierLabel = targetTier === singleTier ? `配置${targetTier}` : `目标${targetTier} · 实测${singleTier}`;
      const singleConfidence = row.screeningConfidence || row.confidence;
      return `<div class="direction-school"><span class="direction-position">第${row.position}志愿</span><div><strong>${row.schoolName}${row.sameHouseholdDistrict ? '<em class="same-district-badge">户籍同区</em>' : ''}</strong><small>${row.schoolDistrict || '区域待核'} · 录取门槛第${row.admissionRank}/${row.admissionTotal} · 最新${row.latestCutoff}分${row.lastVolunteerNo ? ` · 往年第${row.lastVolunteerNo}志愿完成` : ''}</small></div><div class="direction-chance"><b>单校 ${singleInterval[0]}%—${singleInterval[1]}%</b><span>${tierLabel} · ${singleConfidence}置信度</span><em>最终去向 ${row.outcomeProbability ?? 0}%</em></div></div>`;
    }).join('')}</section>`;
  }).join('');
  $('#directionResult').hidden = false;
  navigateTo($('#directionResult'));
  window.ZhongkaoAccess?.applyContentGating();
}

function updateDirectionRiskSwitch(activeRisk) {
  document.querySelectorAll('[data-direction-risk]').forEach((button) => {
    const isActive = button.dataset.directionRisk === activeRisk;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

async function switchDirectionRisk(riskPreference) {
  if (!riskPreference || $('#directionRisk').value === riskPreference) {
    updateDirectionRiskSwitch(riskPreference);
    return;
  }
  const buttons = [...document.querySelectorAll('[data-direction-risk]')];
  $('#directionRisk').value = riskPreference;
  buttons.forEach((button) => { button.classList.add('is-loading'); button.disabled = true; });
  try {
    await generateDirection();
  } finally {
    buttons.forEach((button) => { button.classList.remove('is-loading'); button.disabled = false; });
  }
}

async function generateDirection(event) {
  event?.preventDefault();
  const profile = getDirectionProfile();
  if (!Number.isFinite(profile.scoreLow) || !Number.isFinite(profile.scoreHigh) || profile.scoreLow < 0 || profile.scoreHigh > 810 || profile.scoreLow > profile.scoreHigh) {
    return toast('估分区间应满足：0 ≤ 下限 ≤ 上限 ≤ 810。');
  }
  const generateButton = $('#generateDirection');
  generateButton.classList.add('is-loading');
  generateButton.disabled = true;
  generateButton.textContent = '正在生成…';
  try {
    dataset.allocations = [];
    directionDraft = buildDirectionDraft(profile);
    if (directionDraft.filter((slot) => slot.schoolId).length < 8) throw new Error('当前条件下可核验学校不足，请放宽学校性质或区域条件');
    directionAnalysis = runSimulation(profile, directionDraft, dataset, 20260722, 10000);
    directionScore = evaluatePlan(profile, directionDraft, directionAnalysis);
    renderDirectionResult(profile);
  } catch (error) {
    console.error(error);
    toast(`生成失败：${error.message}`);
  } finally {
    generateButton.classList.remove('is-loading');
    generateButton.disabled = false;
    generateButton.textContent = '生成我的填报方向';
  }
}

async function adoptDirection() {
  if (!directionDraft) return toast('请先生成填报方向。');
  const profile = getDirectionProfile();
  if (!document.getElementById('verifyWorkspace')) {
    localStorage.setItem(storageKey, JSON.stringify({
      profile,
      plan: directionDraft,
      savedAt: new Date().toISOString(),
      source: 'direction'
    }));
    window.location.href = '../verify/?draft=direction#volunteerForm';
    return;
  }
  setProfile(profile);
  plan = directionDraft.map((slot) => ({ ...slot }));
  if (directionAnalysis) {
    latestAnalysis = directionAnalysis;
    latestScore = directionScore;
  } else {
    latestAnalysis = null;
    latestScore = null;
  }
  renderBatchForms();
  await refreshBatchOptions();
  setWorkspaceMode('verify', true);
  navigateTo($('#volunteerForm'));
  toast('方向草案已带入求证版，点“分析当前方案”即可计算完整机会。');
}

function getTargetProfile() {
  const currentText = $('#targetCurrentScore').value.trim();
  const currentScore = currentText === '' ? null : Number(currentText);
  return {
    mode: 'forecast',
    targetYear: dataset.manifest.latestPolicyYear + 1,
    score: currentScore || 700,
    scoreLow: currentScore ? Math.max(0, currentScore - 5) : 695,
    scoreHigh: currentScore ? Math.min(810, currentScore + 5) : 705,
    currentScore,
    tieRank: null,
    candidateType: $('#targetCandidateType').value,
    admissionDistrict: $('#targetAdmissionDistrict').value,
    householdDistrict: $('#targetHouseholdDistrict').value,
    schoolDistrict: $('#targetAdmissionDistrict').value,
    sourceSchoolId: '',
    referenceGrade: 'C',
    riskPreference: '均衡',
    ownershipPreference: '不限',
    boardingPreference: '不限',
    maxAnnualFee: null,
    preferredDistricts: [$('#targetHouseholdDistrict').value],
    excludedSchools: [],
    crossDistrict: false,
    quotaEligible: false,
    notAdmittedFirstBatch: true
  };
}

function targetEligibleRecords(profile = getTargetProfile()) {
  const bySchool = new Map();
  for (const batch of [3, 4]) {
    const rows = uniqueSchools(recordsForBatch(batch, profile.targetYear, profile))
      .filter((record) => directionScopeEligible(profile, record));
    for (const row of rows) {
      if (!bySchool.has(row.schoolId) || row.batch < bySchool.get(row.schoolId).batch) bySchool.set(row.schoolId, row);
    }
  }
  return [...bySchool.values()].sort((a, b) => b.cutoffScore - a.cutoffScore || a.schoolName.localeCompare(b.schoolName, 'zh-CN'));
}

function refreshTargetSchoolList() {
  if (!dataset) return;
  const nameEl = document.getElementById('targetSchoolName');
  if (!nameEl) return;
  const current = nameEl.value.trim();
  const records = targetEligibleRecords();
  const listEl = document.getElementById('targetSchoolList');
  if (listEl) listEl.innerHTML = records.map((record) => {
    const school = schoolPreferences(record.schoolId);
    return `<option value="${record.schoolName}">${school.campusDistrict || '校址待核'} · 第${record.batch}批 · 2026线${record.cutoffScore}分</option>`;
  }).join('');
  if (current && !records.some((record) => record.schoolName === current)) nameEl.value = '';
  const resultEl = document.getElementById('targetResult');
  if (resultEl) resultEl.hidden = true;
  targetResultData = null;
  targetDraft = null;
}

function selectedTargetRecord(profile) {
  const name = $('#targetSchoolName').value.trim();
  const records = targetEligibleRecords(profile);
  const exact = records.find((record) => record.schoolName === name);
  if (exact) return exact;
  const partial = records.filter((record) => record.schoolName.includes(name));
  return name && partial.length === 1 ? partial[0] : null;
}

function targetHistoryRows(record, profile) {
  const preferredType = profile.candidateType === '户籍生' ? '户籍生' : '随迁子女';
  const rows = dataset.admissions.filter((item) => item.schoolId === record.schoolId && item.batch === record.batch && item.candidateType === preferredType);
  const byYear = new Map();
  for (const row of rows) {
    if (!byYear.has(row.year) || row.cutoffScore > byYear.get(row.year).cutoffScore) byYear.set(row.year, row);
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year);
}

function targetChanceAtScore(profile, record, score, iterations = 800) {
  const position = 1;
  const slot = { key: `target-${record.schoolId}`, batch: record.batch, position, schoolId: record.schoolId, schoolName: record.schoolName };
  const scoreProfile = {
    ...profile,
    score,
    scoreLow: Math.max(0, score - 5),
    scoreHigh: Math.min(810, score + 5)
  };
  return runSimulation(scoreProfile, [slot], dataset, 20260817, iterations).slotResults[0];
}

function scoreForTargetChance(profile, record, targetChance, chanceCache) {
  let low = Math.max(300, record.cutoffScore - 100);
  let high = 810;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (!chanceCache.has(middle)) chanceCache.set(middle, targetChanceAtScore(profile, record, middle, 350));
    const result = chanceCache.get(middle);
    if (result.chance >= targetChance) high = middle;
    else low = middle + 1;
  }
  return low;
}

function targetVolunteerPosition(history) {
  const positions = history.map((row) => row.lastVolunteerNo).filter(Number.isFinite).sort((a, b) => a - b);
  if (!positions.length) return 1;
  if (positions.includes(1)) return 1;
  return Math.min(3, Math.max(1, Math.round(positions[Math.floor((positions.length - 1) / 2)])));
}

function targetSupportSchools(batch, profile, targetRecord, desiredCutoff, maximumCutoff, selected, count = 2) {
  return uniqueSchools(recordsForBatch(batch, profile.targetYear, profile))
    .filter((record) => directionScopeEligible(profile, record))
    .filter((record) => record.schoolId !== targetRecord.schoolId && !isSchoolSelected(selected, record))
    .filter((record) => record.cutoffScore <= maximumCutoff)
    .map((record) => {
      const school = schoolPreferences(record.schoolId);
      const sameDistrict = school.campusDistrict === profile.householdDistrict;
      return { record, school, rank: Math.abs(record.cutoffScore - desiredCutoff) - (sameDistrict ? 12 : 0) + schoolMetric(record).volatility * 0.08 };
    })
    .sort((a, b) => a.rank - b.rank || b.record.cutoffScore - a.record.cutoffScore)
    .slice(0, count)
    .map(({ record, school }) => ({ ...record, ...school }));
}

function buildTargetDraft(profile, data) {
  const generationProfile = {
    ...profile,
    score: data.matchScore,
    scoreLow: data.reachScore,
    scoreHigh: data.safeScore,
    riskPreference: '均衡',
    ownershipPreference: '不限'
  };
  const supportProfile = profile.currentScore
    ? {
        ...generationProfile,
        score: profile.currentScore,
        scoreLow: Math.max(0, profile.currentScore - 5),
        scoreHigh: Math.min(810, profile.currentScore + 5)
      }
    : generationProfile;
  const generated = buildDirectionDraft(supportProfile);
  const draft = makePlan();
  const selected = new Set();
  const asChoice = (record) => {
    const eligible = uniqueSchools(recordsForBatch(record.batch, profile.targetYear, profile));
    const admissionRank = eligible.findIndex((row) => row.schoolId === record.schoolId) + 1;
    const preferences = schoolPreferences(record.schoolId);
    return {
      schoolId: record.schoolId,
      schoolName: record.schoolName,
      directionTier: record.directionTier || (record.cutoffScore >= data.record.cutoffScore - 8 ? '冲刺' : record.cutoffScore >= data.record.cutoffScore - 25 ? '匹配' : '保底'),
      latestCutoff: record.cutoffScore,
      latestTieRank: record.cutoffTieRank,
      lastVolunteerNo: record.lastVolunteerNo,
      admissionRank,
      admissionTotal: eligible.length,
      schoolDistrict: preferences.campusDistrict,
      sameHouseholdDistrict: preferences.campusDistrict === profile.householdDistrict,
      screeningChance: record.screeningChance,
      screeningInterval: record.screeningInterval,
      screeningTier: record.screeningTier,
      screeningConfidence: record.screeningConfidence,
      screeningYearsWithData: record.screeningYearsWithData,
      ...preferences
    };
  };
  const uniquePool = (records) => [...new Map(records.filter(Boolean).map((record) => [record.schoolId, record])).values()];
  const generatedRecordsForBatch = (batch) => generated
    .filter((slot) => slot.batch === batch && slot.schoolId)
    .map((slot) => {
      const record = recordsForBatch(batch, profile.targetYear, profile).find((item) => item.schoolId === slot.schoolId);
      return record ? { ...record, ...slot, cutoffScore: slot.latestCutoff ?? record.cutoffScore } : null;
    })
    .filter(Boolean);

  for (const batch of [3, 4]) {
    const arranged = Array(6).fill(null);
    const eligible = uniqueSchools(recordsForBatch(batch, profile.targetYear, profile)).filter((record) => directionScopeEligible(profile, record));
    let pool = [];
    if (batch === data.record.batch) {
      const higher = eligible.filter((record) => record.cutoffScore > data.record.cutoffScore).sort((a, b) => a.cutoffScore - b.cutoffScore);
      for (let index = 0; index < data.position - 1; index += 1) {
        const choice = higher[index];
        if (choice) {
          arranged[index] = asChoice(choice);
          addSelectedSchool(selected, choice);
        }
      }
      arranged[data.position - 1] = asChoice(data.record);
      addSelectedSchool(selected, data.record);
      const generatedRows = generatedRecordsForBatch(batch);
      const recommended = [...data.matchSchools, ...data.safetySchools].sort((a, b) => b.cutoffScore - a.cutoffScore);
      const fallbackMaximum = recommended.length ? Math.min(...recommended.map((record) => record.cutoffScore)) : data.record.cutoffScore - 1;
      const lowerFallback = eligible
        .filter((record) => record.schoolId !== data.record.schoolId && record.cutoffScore <= fallbackMaximum)
        .sort((a, b) => b.cutoffScore - a.cutoffScore);
      pool = uniquePool([...generatedRows, ...recommended, ...lowerFallback]);
    } else if (data.record.batch === 3 && batch === 4) {
      const generatedRows = generatedRecordsForBatch(4);
      const backupMaximum = profile.currentScore || data.reachScore;
      pool = uniquePool([...generatedRows, ...data.fourthSchools, ...eligible])
        .filter((record) => record.cutoffScore <= backupMaximum);
    } else {
      const generatedRows = generatedRecordsForBatch(batch);
      pool = uniquePool([...generatedRows, ...eligible]);
    }
    for (let index = 0; index < arranged.length; index += 1) {
      if (arranged[index]) continue;
      const next = pool.find((record) => !isSchoolSelected(selected, record));
      if (!next) continue;
      addSelectedSchool(selected, next);
      pool.splice(pool.indexOf(next), 1);
      arranged[index] = asChoice(next);
    }
    const slots = draft.filter((slot) => slot.batch === batch);
    arranged.forEach((choice, index) => { if (choice) Object.assign(slots[index], choice); });
  }
  targetDraftProfile = profile.currentScore
    ? { ...profile, score: profile.currentScore, scoreLow: Math.max(0, profile.currentScore - 5), scoreHigh: Math.min(810, profile.currentScore + 5) }
    : generationProfile;
  return draft;
}

function renderTargetResult(profile, data) {
  const { record, history, reachScore, matchScore, safeScore, currentMetric, position, matchSchools, safetySchools, fourthSchools } = data;
  const school = schoolPreferences(record.schoolId);
  const currentText = profile.currentScore
    ? `当前估分${profile.currentScore}分，目标校模拟机会${currentMetric.interval[0]}%—${currentMetric.interval[1]}%`
    : '未填写当前估分，暂不判断个人分差';
  $('#targetTitle').textContent = `${record.schoolName} · 建议冲刺分${reachScore}分起`;
  $('#targetSummary').textContent = `${school.campusDistrict || '校址待核'} · 第${record.batch}批；依据${history.length}年同口径录取记录倒推。${currentText}。`;
  $('#targetStats').innerHTML = `
    <div class="direction-stat"><span>2026录取线</span><strong>${record.cutoffScore}分</strong><small>${record.lastVolunteerNo ? `末位第${record.lastVolunteerNo}志愿` : '末位志愿序号未提供'} · 门槛为事后结果</small></div>
    <div class="direction-stat"><span>建议冲刺起步</span><strong>${reachScore}分</strong><small>约35%机会水平，可尝试但风险较高</small></div>
    <div class="direction-stat"><span>匹配目标</span><strong>${matchScore}分</strong><small>约60%机会水平，建议作为主要备考目标</small></div>
    <div class="direction-stat"><span>稳妥目标</span><strong>${safeScore}分</strong><small>约75%机会水平，仍不代表保证录取</small></div>`;
  $('#targetHistory').innerHTML = history.map((row) => `<div class="target-history-row"><b>${row.year}</b><span>${row.lastVolunteerNo ? `第${row.lastVolunteerNo}志愿完成` : '志愿序号未提供'}${row.cutoffTieRank ? ` · 同分序号${row.cutoffTieRank}` : ''}</span><strong>${row.cutoffScore}分</strong></div>`).join('') || '<div class="target-history-row"><span>同口径历史记录不足</span></div>';
  const matchNames = matchSchools.map((item) => item.schoolName).join('、') || '暂未找到同口径匹配学校';
  const safetyNames = safetySchools.map((item) => item.schoolName).join('、') || '请在求证版继续补充可接受学校';
  const fourthNames = fourthSchools.map((item) => item.schoolName).join('、') || '请结合收费、住宿继续筛选第四批学校';
  const gapAdvice = !profile.currentScore
    ? `补充当前估分后，可进一步判断距离${reachScore}分冲刺线还有多少差距。`
    : profile.currentScore < reachScore
      ? `当前估分距离冲刺起步分约${reachScore - profile.currentScore}分，目标校应作为高风险冲刺，同时必须补足匹配和保底。`
      : profile.currentScore < matchScore
        ? `当前估分已进入冲刺区间，距离匹配目标约${matchScore - profile.currentScore}分，建议继续提高稳定发挥分。`
        : `当前估分已达到匹配目标；仍需保留完整保底，避免当年竞争升温。`;
  $('#targetAdvice').innerHTML = [
    `把${record.schoolName}放在第${record.batch}批第${position}志愿；往年末位志愿序号显示，放得更后可能失去同梯度内的志愿优先。`,
    `第${record.batch}批后续志愿可优先比较：${matchNames}。这些学校的最新录取门槛略低，用来承接目标校落选风险。`,
    `同批最后两个志愿建议从${safetyNames}中选择真正愿意就读的学校，不能只看分数低。`,
    `${record.batch === 3 ? `第四批继续保留${fourthNames}等可接受学校，防止第三批全部落选。` : `目标学校已在第四批，前面志愿与目标校之间应保持清晰分差，并确认收费、住宿及招生范围。`}`,
    gapAdvice
  ].map((item) => `<li>${item}</li>`).join('');
  $('#targetResult').hidden = false;
  navigateTo($('#targetResult'));
}

async function analyzeTarget(event) {
  event?.preventDefault();
  const profile = getTargetProfile();
  if (profile.currentScore !== null && (!Number.isFinite(profile.currentScore) || profile.currentScore < 0 || profile.currentScore > 810)) return toast('当前估分应在0—810分之间。');
  const record = selectedTargetRecord(profile);
  if (!record) return toast('请从候选列表中选择一所符合当前升学区域和考生类别的目标学校。');
  $('#analyzeTarget').disabled = true;
  $('#analyzeTarget').textContent = '正在倒推分值…';
  try {
    const history = targetHistoryRows(record, profile);
    const chanceCache = new Map();
    const reachScore = scoreForTargetChance(profile, record, 35, chanceCache);
    const matchScore = Math.max(reachScore, scoreForTargetChance(profile, record, 60, chanceCache));
    const safeScore = Math.max(matchScore, scoreForTargetChance(profile, record, 75, chanceCache));
    const matchMetric = targetChanceAtScore(profile, record, matchScore, 1200);
    const currentMetric = profile.currentScore ? targetChanceAtScore(profile, record, profile.currentScore, 1200) : null;
    const position = targetVolunteerPosition(history);
    const selected = selectedSchools([record]);
    const matchSchools = targetSupportSchools(record.batch, profile, record, record.cutoffScore - 15, record.cutoffScore - 4, selected, 2);
    matchSchools.forEach((item) => addSelectedSchool(selected, item));
    const safetySchools = targetSupportSchools(record.batch, profile, record, record.cutoffScore - 38, record.cutoffScore - 18, selected, 2);
    safetySchools.forEach((item) => addSelectedSchool(selected, item));
    const fourthSchools = record.batch === 3 ? targetSupportSchools(4, profile, record, reachScore - 55, reachScore, selected, 3) : [];
    targetResultData = { record, history, reachScore, matchScore, safeScore, matchMetric, currentMetric, position, matchSchools, safetySchools, fourthSchools };
    targetDraft = null;
    targetDraftProfile = null;
    renderTargetResult(profile, targetResultData);
  } catch (error) {
    console.error(error);
    toast(`目标学校分析失败：${error.message}`);
  } finally {
    $('#analyzeTarget').disabled = false;
    $('#analyzeTarget').textContent = '分析目标学校';
  }
}

async function adoptTarget() {
  if (!targetResultData) return toast('请先完成目标学校分析。');
  targetDraft = buildTargetDraft(getTargetProfile(), targetResultData);
  if (!targetDraft || !targetDraftProfile) return toast('目标学校草案生成失败，请重新分析。');
  if (!document.getElementById('verifyWorkspace')) {
    localStorage.setItem(storageKey, JSON.stringify({
      profile: targetDraftProfile,
      plan: targetDraft,
      savedAt: new Date().toISOString(),
      source: 'target'
    }));
    window.location.href = '../verify/?draft=target#volunteerForm';
    return;
  }
  setProfile(targetDraftProfile);
  plan = targetDraft.map((slot) => ({ ...slot }));
  latestAnalysis = null;
  latestScore = null;
  renderBatchForms();
  await refreshBatchOptions();
  setWorkspaceMode('verify', true);
  navigateTo($('#volunteerForm'));
  toast('目标学校与配套志愿已带入求证版，点“分析当前方案”即可计算整张表的机会。');
}

function setProfile(profile = {}) {
  for (const [key, value] of Object.entries(profile)) {
    const field = document.getElementById(key);
    if (!field) continue;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value ?? '';
  }
  renderTargetYears();
  const targetYearEl = $('#targetYear');
  if (profile.targetYear && targetYearEl) targetYearEl.value = String(profile.targetYear);
  syncQuotaInterface();
}

function syncQuotaInterface({ clearWhenDisabled = false } = {}) {
  const quotaEl = document.getElementById('quotaEligible');
  if (!quotaEl) return;
  const enabled = quotaEl.checked;
  const detailsEl = document.getElementById('quotaDetails');
  if (detailsEl) detailsEl.hidden = !enabled;
  const schoolBatchEl = document.getElementById('schoolBatch');
  if (schoolBatchEl) {
    const batchOption = schoolBatchEl.querySelector('option[value="2"]');
    if (batchOption) batchOption.disabled = !enabled;
    if (!enabled && schoolBatchEl.value === '2') schoolBatchEl.value = '3';
  }
  if (!enabled && clearWhenDisabled) {
    const sourceEl = document.getElementById('sourceSchoolId');
    if (sourceEl) sourceEl.value = '';
    plan.filter((slot) => slot.batch === 2).forEach((slot) => {
      slot.schoolId = '';
      slot.schoolName = '';
    });
  }
}

function saveDraft() {
  localStorage.setItem(storageKey, JSON.stringify({ profile: getProfile(), plan, savedAt: new Date().toISOString() }));
}

function batchHasGap(batch) {
  const rows = plan.filter((slot) => slot.batch === batch).sort((a, b) => a.position - b.position);
  let foundEmpty = false;
  for (const row of rows) {
    if (!row.schoolId) foundEmpty = true;
    else if (foundEmpty) return true;
  }
  return false;
}

function updateWorkflowGuide(profile = getProfile()) {
  if (!$('#workflowHint')) return;
  const selectedCount = plan.filter((slot) => slot.schoolId).length;
  const batch3Filled = plan.filter((slot) => slot.batch === 3 && slot.schoolId).length;
  const batch4Filled = plan.filter((slot) => slot.batch === 4 && slot.schoolId).length;
  const rangeReady = profile.mode !== 'forecast' || (profile.scoreLow <= profile.score && profile.score <= profile.scoreHigh);
  const profileReady = Number.isFinite(profile.score) && profile.score >= 0 && profile.score <= 810 && Boolean(profile.admissionDistrict) && rangeReady;
  const planReady = selectedCount > 0 && ![2, 3, 4].some((batch) => batchHasGap(batch));
  const activeStep = !profileReady ? 'profile' : !selectedCount ? 'school' : !latestScore ? 'plan' : 'analysis';
  const states = {
    profile: { done: profileReady, text: profileReady ? '必要信息已完成' : '待填写' },
    school: { done: selectedCount > 0, text: selectedCount ? `已选${selectedCount}所` : '待选择' },
    plan: { done: planReady, text: selectedCount ? `${batch3Filled}个第三批 · ${batch4Filled}个第四批` : '待填写' },
    analysis: { done: Boolean(latestScore), text: latestScore ? `${latestScore.total}分 · ${latestScore.label}` : '待分析' }
  };
  const stateIds = { profile: '#flowProfileState', school: '#flowSchoolState', plan: '#flowPlanState', analysis: '#flowAnalysisState' };
  Object.entries(states).forEach(([key, state]) => {
    const button = document.querySelector(`[data-flow-step="${key}"]`);
    button?.classList.toggle('done', state.done);
    button?.classList.toggle('active', key === activeStep);
    const label = $(stateIds[key]);
    if (label) label.textContent = state.text;
  });
  const next = {
    profile: { target: '#profile', label: '下一步：填写考生信息', hint: '先填写必要的分数和区域信息，其他资格与偏好可以按需展开。' },
    school: { target: '#schoolExplorer', label: '下一步：选择学校', hint: '必要信息已完成。下一步先选愿意就读的学校，系统会自动放进对应批次的首个空位。' },
    plan: { target: '#volunteerForm', label: '下一步：排列志愿', hint: '已有学校进入志愿表。请确认顺序连续，并补足真正愿意就读的保底学校。' },
    analysis: { target: '#analysis', label: '下一步：查看分析与建议', hint: latestScore ? `当前方案${latestScore.total}分。重点查看未录取风险、逐志愿机会和一键补强建议。` : '完成分析后，可查看逐志愿机会、未录取风险和一键补强建议。' }
  }[activeStep];
  $('#workflowHint').textContent = next.hint;
  $('#guideStart').dataset.nextTarget = next.target;
  $('#guideStart').textContent = next.label;
}

function updateCoach() {
  if (!dataset || !$('#coachProgress')) return;
  const profile = getProfile();
  const quotaActive = profile.quotaEligible && profile.candidateType === '户籍生';
  const relevant = plan.filter((slot) => quotaActive || slot.batch !== 2);
  const filled = relevant.filter((slot) => slot.schoolId).length;
  const batch3Filled = plan.filter((slot) => slot.batch === 3 && slot.schoolId).length;
  const batch4Filled = plan.filter((slot) => slot.batch === 4 && slot.schoolId).length;
  const noGaps = ![2, 3, 4].some((batch) => batchHasGap(batch));
  const profileReady = Number.isFinite(profile.score) && profile.score >= 0 && profile.score <= 810 && Boolean(profile.admissionDistrict);
  const quotaReady = !quotaActive || Boolean(profile.sourceSchoolId);
  const checks = [
    { label: '考生信息', done: profileReady },
    { label: quotaActive ? '名额资格与初中' : '第二批不参与', done: quotaReady },
    { label: `第三批 ${batch3Filled}/6`, done: batch3Filled >= 4, warn: batch3Filled > 0 },
    { label: `第四批 ${batch4Filled}/6`, done: batch4Filled >= 3, warn: batch4Filled > 0 },
    { label: '无中间空档', done: noGaps },
    ...(latestScore ? [{ label: `已分析 ${latestScore.total}分`, done: latestScore.total >= 70, warn: true }] : [])
  ];
  $('#coachProgress').textContent = `已填写 ${filled}/${relevant.length} 个可用志愿`;
  $('#coachChecklist').innerHTML = checks.map((item) => `<span class="coach-check ${item.done ? 'done' : item.warn ? 'warn' : ''}">${item.done ? '✓ ' : ''}${item.label}</span>`).join('');
  if (!profileReady) $('#coachHint').textContent = '先把分数和升学区域填完整，学校范围才会准确。';
  else if (quotaActive && !profile.sourceSchoolId) $('#coachHint').textContent = '你勾选了名额分配资格，请先选择所在初中，再填写第二批。';
  else if (!filled) $('#coachHint').textContent = '建议先从第三批筛选：最想去的放前面，再逐步加入匹配和保底学校。';
  else if (!noGaps) $('#coachHint').textContent = '志愿中间有空档，请连续填写，避免浪费前面的志愿位置。';
  else if (batch4Filled < 2) $('#coachHint').textContent = '第四批保底还不完整，建议至少加入2所真正愿意就读的学校。';
  else if (!latestScore) $('#coachHint').textContent = '已有可分析方案。点击“帮我检查”，查看机会区间和具体调整位置。';
  else $('#coachHint').textContent = `当前方案评为“${latestScore.label}”，请按下方具体建议继续调整。`;
  const selectedCount = plan.filter((slot) => slot.schoolId).length;
  $('#coachAnalyze').disabled = selectedCount === 0;
  $('#analyzePlan').disabled = selectedCount === 0;
  const analyzeTopBtn = $('#analyzeTop'); if (analyzeTopBtn) analyzeTopBtn.textContent = selectedCount ? `分析当前方案（${selectedCount}）` : '从考生信息开始';
  $('#selectedCount').textContent = selectedCount ? `已选 ${selectedCount} 所` : '尚未选择学校';
  const batch2Card = document.querySelector('[data-batch-card="2"]');
  if (batch2Card && profile.quotaEligible && profile.sourceSchoolId) batch2Card.open = true;
  if (batch2Card && !profile.quotaEligible && !plan.some((slot) => slot.batch === 2 && slot.schoolId)) batch2Card.open = false;
  updateWorkflowGuide(profile);
}

function prepareDraftRestore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const validPlan = Array.isArray(saved?.plan) && saved.plan.length === 15;
    pendingDraft = validPlan && saved.plan.some((slot) => slot.schoolId) ? saved : null;
  } catch {
    localStorage.removeItem(storageKey);
    pendingDraft = null;
  }
}

async function restoreDraft() {
  if (!pendingDraft) return toast('当前没有可恢复的志愿草稿。');
  setProfile(pendingDraft.profile);
  plan = pendingDraft.plan.map((slot) => ({ ...slot }));
  pendingDraft = null;
  renderBatchForms();
  await refreshBatchOptions();
  toast('已恢复上次主动保存的志愿草稿。');
}

function recordsForBatch(batch, year, profile) {
  const actualYear = Math.min(year, dataset.manifest.latestPolicyYear);
  if (batch === 2) {
    return dataset.allocations.filter((row) => row.year === actualYear && row.sourceSchoolId === profile.sourceSchoolId);
  }
  const type = profile.candidateType === '户籍生' ? '户籍生' : '随迁子女';
  const preferred = dataset.admissions.filter((row) => row.year === actualYear && row.batch === batch && row.candidateType === type);
  return preferred.length ? preferred : dataset.admissions.filter((row) => row.year === actualYear && row.batch === batch && row.candidateType === '户籍生');
}

function uniqueSchools(records) {
  const rows = new Map();
  for (const record of records) {
    if (!rows.has(record.schoolId) || (record.cutoffScore || 0) > (rows.get(record.schoolId).cutoffScore || 0)) rows.set(record.schoolId, record);
  }
  return [...rows.values()].sort((a, b) => (b.cutoffScore || 0) - (a.cutoffScore || 0) || a.schoolName.localeCompare(b.schoolName, 'zh-CN'));
}

function schoolPreferences(schoolId) {
  const school = dataset.schools.find((item) => item.id === schoolId);
  return school ? {
    district: school.district,
    campusDistrict: school.campusDistrict,
    campusAddress: school.campusAddress,
    ownership: school.ownership,
    boarding: school.boarding,
    annualFee: school.annualFee
  } : { district: null, campusDistrict: null, campusAddress: null, ownership: null, boarding: null, annualFee: null };
}

async function refreshBatchOptions() {
  const profile = getProfile();
  dataset.allocations = profile.quotaEligible && profile.sourceSchoolId ? await allocationsForYear(profile.targetYear) : [];
  for (const select of document.querySelectorAll('.school-select')) {
    const batch = Number(select.dataset.batch);
    const slot = plan.find((item) => item.key === select.dataset.key);
    const schools = uniqueSchools(recordsForBatch(batch, profile.targetYear, profile))
      .filter((record) => !profile.excludedSchools.some((name) => record.schoolName.includes(name)));
    const options = schools.map((record) => `<option value="${record.schoolId}" data-name="${record.schoolName}">${record.schoolName} · ${record.cutoffScore}分</option>`).join('');
    select.innerHTML = `<option value="">请选择学校</option>${options}`;
    select.value = schools.some((record) => record.schoolId === slot.schoolId) ? slot.schoolId : '';
    if (select.value) Object.assign(slot, schoolPreferences(slot.schoolId));
    if (!select.value && slot.schoolId) {
      slot.schoolId = '';
      slot.schoolName = '';
    }
  }
  updateSlotMeta();
  renderSchoolTable();
  updateCoach();
}

function renderBatchForms() {
  const profile = getProfile();
  const batches = profile.quotaEligible ? [2, 3, 4] : [3, 4];
  $('#batchForms').innerHTML = batches.map((batch) => {
    const rows = plan.filter((slot) => slot.batch === batch).map((slot) => `
      <div class="volunteer-row" draggable="true" data-key="${slot.key}" data-batch="${batch}">
        <div class="volunteer-label"><span class="drag-handle" aria-hidden="true">⋮⋮</span>第${slot.position}志愿</div>
        <select class="school-select" data-key="${slot.key}" data-batch="${batch}" aria-label="${batchNames[batch]}第${slot.position}志愿"><option value="">请选择学校</option></select>
        <span class="slot-meta" data-meta="${slot.key}">等待选择</span>
        <div class="row-actions">
          <button type="button" data-move="up" data-key="${slot.key}" aria-label="上移">↑</button>
          <button type="button" data-move="down" data-key="${slot.key}" aria-label="下移">↓</button>
          <button type="button" data-remove="${slot.key}" aria-label="清空">×</button>
        </div>
      </div>`).join('');
    if (batch === 2) {
      const hasSelection = plan.some((slot) => slot.batch === 2 && slot.schoolId);
      const open = hasSelection || (profile.quotaEligible && profile.sourceSchoolId);
      return `<details class="batch-card batch-card-optional" data-batch-card="2" ${open ? 'open' : ''}><summary class="batch-head"><strong>${batchNames[batch]}</strong><span>${profile.quotaEligible ? batchNotes[batch] : '可选：确认有资格后再展开填写，不影响先完成第三、第四批'}</span></summary><div class="batch-body">${rows}</div></details>`;
    }
    return `<section class="batch-card"><div class="batch-head"><strong>${batchNames[batch]}</strong><span>${batchNotes[batch]}</span></div>${rows}</section>`;
  }).join('');
  bindPlanRows();
}

function moveSlot(key, direction) {
  const slot = plan.find((item) => item.key === key);
  const target = plan.find((item) => item.batch === slot.batch && item.position === slot.position + direction);
  if (!target) return;
  [slot.schoolId, target.schoolId] = [target.schoolId, slot.schoolId];
  [slot.schoolName, target.schoolName] = [target.schoolName, slot.schoolName];
  refreshBatchOptions();
  saveDraft();
}

function bindPlanRows() {
  document.querySelectorAll('.school-select').forEach((select) => select.addEventListener('change', () => {
    const slot = plan.find((item) => item.key === select.dataset.key);
    if (select.value && plan.some((item) => item.key !== slot.key && item.schoolId === select.value)) {
      select.value = slot.schoolId || '';
      toast('该学校已在志愿表中，不能重复填写。');
      return;
    }
    slot.schoolId = select.value;
    slot.schoolName = select.selectedOptions[0]?.dataset.name || select.selectedOptions[0]?.textContent.split(' · ')[0] || '';
    Object.assign(slot, schoolPreferences(slot.schoolId));
    latestScore = null;
    latestAnalysis = null;
    updateSlotMeta();
    updateCoach();
    saveDraft();
  }));
  document.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => moveSlot(button.dataset.key, button.dataset.move === 'up' ? -1 : 1)));
  document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
    const slot = plan.find((item) => item.key === button.dataset.remove);
    slot.schoolId = '';
    slot.schoolName = '';
    refreshBatchOptions();
    saveDraft();
  }));
  let dragged = null;
  document.querySelectorAll('.volunteer-row').forEach((row) => {
    row.addEventListener('dragstart', () => { dragged = row.dataset.key; row.classList.add('dragging'); });
    row.addEventListener('dragend', () => { dragged = null; row.classList.remove('dragging'); });
    row.addEventListener('dragover', (event) => event.preventDefault());
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      const from = plan.find((item) => item.key === dragged);
      const to = plan.find((item) => item.key === row.dataset.key);
      if (!from || !to || from.batch !== to.batch) return;
      [from.schoolId, to.schoolId] = [to.schoolId, from.schoolId];
      [from.schoolName, to.schoolName] = [to.schoolName, from.schoolName];
      refreshBatchOptions();
      saveDraft();
    });
  });
}

function tierForSlot(batch, position) {
  const row = latestAnalysis?.slotResults?.find((r) => r.batch === batch && r.position === position);
  return row?.tier || null;
}

function updateSlotMeta() {
  const profile = getProfile();
  for (const slot of plan) {
    const meta = document.querySelector(`[data-meta="${slot.key}"]`);
    if (!meta) continue;
    const record = recordsForBatch(slot.batch, profile.targetYear, profile).find((row) => row.schoolId === slot.schoolId);
    if (!record) { meta.textContent = slot.schoolId ? '当前口径暂无数据' : '等待选择'; continue; }
    const difference = record.cutoffScore - profile.score;
    const preliminary = difference > 5 ? '分差偏冲' : difference >= -15 ? '分差接近' : '分差偏稳';
    const orderRisk = record.lastVolunteerNo && slot.position > record.lastVolunteerNo ? ` · 往年第${record.lastVolunteerNo}志愿完成` : '';
    const tier = tierForSlot(slot.batch, slot.position);
    const tierClass = tier === '冲刺' ? 'tier-reach' : tier === '匹配' ? 'tier-match' : tier === '保底' ? 'tier-safe' : '';
    meta.innerHTML = (tier ? `<span class="tier-tag ${tierClass}">${tier}</span>` : '') + `${record.cutoffScore}分 · ${preliminary}${orderRisk}`;
  }
}

function schoolMetric(record) {
  const rows = [...dataset.admissions, ...dataset.allocations].filter((item) => item.schoolId === record.schoolId && item.batch === record.batch && item.candidateType === record.candidateType);
  const scores = rows.map((item) => item.cutoffScore);
  const mean = scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length);
  const variance = scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, scores.length);
  return { years: new Set(rows.map((item) => item.year)).size, volatility: Math.round(Math.sqrt(variance)) };
}

function renderSchoolTable() {
  if (!dataset) return;
  const profile = getProfile();
  const batch = Number($('#schoolBatch').value);
  const search = $('#schoolSearch').value.trim().toLowerCase();
  const ownership = $('#schoolOwnership').value;
  const scopeFilter = $('#schoolScope').value;
  let records = uniqueSchools(recordsForBatch(batch, profile.targetYear, profile));
  records = records.filter((row) => !search || row.schoolName.toLowerCase().includes(search));
  records = records.filter((row) => ownership === '不限' || row.ownership === ownership);
  records = records.filter((row) => scopeFilter === '不限' || (scopeFilter === '全市' ? row.scope === '全市' : row.scope !== '全市'));
  records = records.filter((row) => !profile.excludedSchools.some((name) => row.schoolName.includes(name)));
  const selectedCount = plan.filter((slot) => slot.schoolId).length;
  $('#schoolCount').textContent = `${records.length}所可查询`;
  $('#schoolTableBody').innerHTML = records.slice(0, 120).map((record) => {
    const metric = schoolMetric(record);
    const selectedSlot = plan.find((slot) => slot.schoolId === record.schoolId);
    const buttonLabel = selectedSlot ? `已在第${selectedSlot.batch}批第${selectedSlot.position}志愿` : `加入第${batch}批`;
    return `<tr><td><strong>${record.schoolName}</strong></td><td>${record.ownership} · ${record.scope}</td><td>${record.cutoffScore}分</td><td>${metric.volatility}分</td><td>${metric.years}年</td><td><button class="add-school" data-add-school="${record.schoolId}" data-name="${record.schoolName}" data-batch="${batch}" type="button" ${selectedSlot ? 'disabled' : ''}>${buttonLabel}</button></td></tr>`;
  }).join('') || '<tr><td colspan="6">当前筛选条件下暂无学校；第二批请先选择所在初中。</td></tr>';
  document.querySelectorAll('[data-add-school]').forEach((button) => button.addEventListener('click', () => addSchoolToPlan(Number(button.dataset.batch), button.dataset.addSchool, button.dataset.name)));
}

function addSchoolToPlan(batch, schoolId, schoolName) {
  if (plan.some((slot) => slot.schoolId === schoolId)) return toast('该学校已在志愿表中，不能重复填写。');
  const target = plan.find((slot) => slot.batch === batch && !slot.schoolId);
  if (!target) return toast(`第${batch}批志愿已填满，请先清空一个位置。`);
  target.schoolId = schoolId;
  target.schoolName = schoolName;
  Object.assign(target, schoolPreferences(schoolId));
  latestScore = null;
  latestAnalysis = null;
  refreshBatchOptions();
  saveDraft();
  toast(`已加入第${batch}批第${target.position}志愿：${schoolName}`);
}

function renderSelectedPreview() {
  const rows = plan.map((slot) => `
    <li class="preview-slot ${slot.schoolId ? 'preview-slot--filled' : 'preview-slot--empty'}">
      <span class="preview-slot-key">第${slot.batch}批 · ${slot.position}</span>
      <span class="preview-slot-name">${slot.schoolName || '未填报'}</span>
    </li>`).join('');
  $('#selectedPreview').innerHTML = `<ol class="preview-list">${rows}</ol>`;
}

function toggleSelectedPreview() {
  const panel = $('#selectedPreview');
  if (panel.hidden) {
    renderSelectedPreview();
    panel.hidden = false;
    $('#viewPlan').setAttribute('aria-expanded', 'true');
  } else {
    panel.hidden = true;
    $('#viewPlan').setAttribute('aria-expanded', 'false');
  }
}

async function allAllocations() {
  const rows = await Promise.all(dataset.manifest.years.map((year) => allocationsForYear(year)));
  return rows.flat();
}

function validateProfile(profile) {
  const failures = [];
  if (profile.score < 0 || profile.score > 810) failures.push('中心分值须在0—810分之间');
  if (profile.mode === 'forecast' && (profile.scoreLow > profile.score || profile.scoreHigh < profile.score)) failures.push('估分应满足：下限 ≤ 中心分值 ≤ 上限');
  if (!profile.notAdmittedFirstBatch) failures.push('本工具只能在“未被第一批录取”的前提下模拟第二至第四批');
  return failures;
}

function alternativeSuggestion(profile, scoreResult) {
  if (profile.mode !== 'forecast' || scoreResult.tierCounts.保底 > 0) return null;
  const selected = selectedSchools(plan);
  for (const batch of [4, 3]) {
    const candidates = recordsForBatch(batch, profile.targetYear, profile)
      .filter((row) => !isSchoolSelected(selected, row) && row.cutoffScore <= profile.score - 20)
      .sort((a, b) => b.cutoffScore - a.cutoffScore);
    if (candidates.length) return `可优先核查并考虑将“${candidates[0].schoolName}”（最新同口径最低分${candidates[0].cutoffScore}分）放入第${batch}批后段作为保底候选；加入前请再次核实招生范围和收费。`;
  }
  return null;
}

async function analyze() {
  const profile = getProfile();
  const failures = validateProfile(profile);
  if (failures.length) return toast(failures.join('；'));
  if (!plan.some((slot) => slot.schoolId)) return toast('请至少填写一个学校志愿。');
  $('#analyzePlan').disabled = true;
  const analyzeTopBtn = $('#analyzeTop'); if (analyzeTopBtn) analyzeTopBtn.disabled = true;
  try {
    const hasBatch2Selection = plan.some((slot) => slot.batch === 2 && slot.schoolId);
    dataset.allocations = hasBatch2Selection
      ? (profile.mode === 'forecast' ? await allAllocations() : await allocationsForYear(profile.targetYear))
      : [];
    latestAnalysis = profile.mode === 'replay'
      ? replayPlan(profile, plan, dataset)
      : runSimulation(profile, plan, dataset, 20260722, 10000);
    latestScore = evaluatePlan(profile, plan, latestAnalysis);
    const alternative = alternativeSuggestion(profile, latestScore);
    if (alternative) latestScore.suggestions.push(alternative);
    renderAnalysis(profile, latestAnalysis, latestScore);
    updateCoach();
    updateSlotMeta();
    saveDraft();
    $('#analysis').hidden = false;
    navigateTo($('#analysis'));
    window.ZhongkaoAccess?.applyContentGating();
  } catch (error) {
    console.error(error);
    toast(`分析失败：${error.message}`);
  } finally {
    $('#analyzePlan').disabled = false;
    const analyzeTopBtn = $('#analyzeTop'); if (analyzeTopBtn) analyzeTopBtn.disabled = false;
  }
}

function renderAnalysis(profile, analysis, score) {
  $('#totalScore').textContent = score.total;
  $('#scoreLabel').textContent = score.label;
  $('#scoreRing').style.setProperty('--score', score.total);
  const labels = { validity: '资格与有效性', utilization: '槽位利用', structure: '分数与学校适配', order: '顺序与梯度', safety: '保底与偏好' };
  const maximums = { validity: 20, utilization: 15, structure: 25, order: 25, safety: 15 };
  $('#dimensionGrid').innerHTML = Object.entries(score.dimensions).map(([key, value]) => `<div class="dimension-card"><strong>${value}/${maximums[key]}</strong><span>${labels[key]}</span></div>`).join('');
  renderImprovements(score);

  if (analysis.mode === 'forecast') {
    const likely = analysis.outcomes.find((row) => row.key !== 'none');
    $('#mostLikely').textContent = likely?.slot ? `最可能去向：${likely.slot.schoolName}` : '当前方案未形成明确录取去向';
    $('#noneRisk').textContent = `未被当前普通高中志愿录取的估算风险：${analysis.noneProbability}%`;
    $('#chanceList').innerHTML = analysis.slotResults.map((row) => `
      <article class="chance-row"><div class="chance-row-head"><div><strong>第${row.batch}批第${row.position}志愿 · ${row.schoolName}</strong><small>${row.tier} · ${row.confidence}置信度 · ${row.yearsWithData}年直接同口径数据 · 最终去向${row.outcomeProbability ?? 0}%${row.notes?.length ? ` · ${row.notes.join('；')}` : ''}</small></div><span class="chance-value"><small>单校把握</small>${row.interval[0]}%—${row.interval[1]}%</span></div><div class="chance-track"><i style="--chance:${row.chance}"></i></div></article>`).join('');
    $('#outcomeList').innerHTML = analysis.outcomes.slice(0, 8).map((row) => row.slot ? `
      <button type="button" class="outcome-row school-outcome-button" data-school-detail="${escapeHtml(row.slot.schoolId)}" data-slot-key="${escapeHtml(row.slot.key)}">
        <span class="outcome-row-main"><strong>${escapeHtml(row.slot.schoolName)}</strong><small>第${row.slot.batch}批第${row.slot.position}志愿</small></span>
        <span class="outcome-row-value"><b>${row.probability}%</b><small>查看学校 ›</small></span>
      </button>` : `<div class="outcome-row"><span>未被当前志愿录取</span><b>${row.probability}%</b></div>`).join('');
  } else {
    $('#mostLikely').textContent = analysis.admitted ? `历史复盘结果：${analysis.admitted.schoolName}` : '历史复盘：当前志愿未检出可投档学校';
    $('#noneRisk').textContent = analysis.admitted ? `第${analysis.admitted.batch}批第${analysis.admitted.position}志愿达到当年公开投档条件` : '如同分序号或资格信息缺失，结果只能作条件判断。';
    const stateText = { pass: '可投档', fail: '不能投档', uncertain: '结果不确定', stopped: '后续停止', ineligible: '资格不符', 'no-data': '数据不足' };
    $('#chanceList').innerHTML = analysis.slotResults.map((row) => `<article class="chance-row"><div class="chance-row-head"><div><strong>第${row.batch}批第${row.position}志愿 · ${row.schoolName}</strong><small>${row.reason}</small></div><span class="tier-badge ${row.state === 'pass' ? 'safe' : row.state === 'uncertain' ? 'match' : 'reach'}">${stateText[row.state]}</span></div></article>`).join('');
    $('#outcomeList').innerHTML = analysis.admitted ? `
      <button type="button" class="outcome-row school-outcome-button" data-school-detail="${escapeHtml(analysis.admitted.schoolId)}" data-slot-key="${escapeHtml(analysis.admitted.key)}">
        <span class="outcome-row-main"><strong>${escapeHtml(analysis.admitted.schoolName)}</strong><small>第${analysis.admitted.batch}批第${analysis.admitted.position}志愿</small></span>
        <span class="outcome-row-value"><b>按当年数据可投档</b><small>查看学校 ›</small></span>
      </button>` : '<div class="outcome-row"><span>未形成确定录取结果</span><b>请检查提示</b></div>';
  }
  $('#adviceList').innerHTML = score.suggestions.map((item) => `<li>${item}</li>`).join('');
  const methodNotes = [
    `预测模型v${analysis.modelVersion || '1.0'}使用固定随机种子和10,000次历史情景，结果可重复。`,
    `只使用同时具备分数段、梯度线和所选批次数据的年份（${analysis.usableYears?.join('、') || '按现有数据'}），避免把整批缺失误算为落选。`,
    '分数先按官方分数段换算位次，再依次应用梯度、志愿序号和最低分规则；单校缺年时按最近同校记录的位次折算，并降低置信度、放宽区间。',
    '系统同时检查近年等位门槛跨度和末位志愿分布；门槛波动较大或经常在第一志愿完成计划的学校，会放宽机会区间并降低置信度。',
    '冲刺/匹配/保底只是机会风险标签，不是平行志愿规则；广州仍按梯度投档、同梯度志愿优先录取。',
    ...(useRealisticSim ? ['已启用波动压力测试：额外加入估分表现方差、年际难度抖动与压线不确定性。'] : [])
  ];
  $('#methodText').innerHTML = `<ul>${methodNotes.map((item) => `<li>${item}</li>`).join('')}${dataset.manifest.limitations.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function schoolRecordForYear(profile, slot, year) {
  const source = slot.batch === 2 ? dataset.allocations : dataset.admissions;
  const possible = source.filter((row) => row.year === year && row.batch === slot.batch && row.schoolId === slot.schoolId);
  if (slot.batch === 2) return possible.find((row) => row.sourceSchoolId === profile.sourceSchoolId) || null;
  const preferredType = profile.candidateType === '户籍生' ? '户籍生' : '随迁子女';
  return possible.find((row) => row.candidateType === preferredType && directionScopeEligible(profile, row))
    || possible.find((row) => row.candidateType === (profile.candidateType === '户籍生' ? '外区生' : '随迁子女'))
    || null;
}

function sourceLabel(source) {
  const kind = source?.kind || '';
  const batch = kind.match(/batch-(\d)/)?.[1];
  if (batch) return `${source.year || ''}年第${batch}批官方录取数据`;
  if (kind === 'school-directory-pdf') return `${source.year || ''}年官方报考指南`;
  return `${source?.year || ''}年广州招考官方资料`;
}

function latestThresholdRank(profile, slot, year) {
  let records = recordsForBatch(slot.batch, year, profile);
  if (slot.batch !== 2) records = records.filter((record) => directionScopeEligible(profile, record));
  const ranked = uniqueSchools(records).sort((a, b) => (b.cutoffScore || 0) - (a.cutoffScore || 0));
  const index = ranked.findIndex((record) => record.schoolId === slot.schoolId);
  return index >= 0 ? { rank: index + 1, total: ranked.length } : null;
}

function openSchoolDetail(schoolId, slotKey) {
  const dialog = $('#schoolDetailDialog');
  const content = $('#schoolDetailContent');
  const school = dataset.schools.find((item) => item.id === schoolId);
  const slot = plan.find((item) => item.key === slotKey && item.schoolId === schoolId)
    || latestAnalysis?.slotResults?.find((item) => item.schoolId === schoolId);
  if (!dialog || !content || !school || !slot) return;

  const profile = getProfile();
  const years = [...dataset.manifest.years].sort((a, b) => b - a);
  const records = years.map((year) => schoolRecordForYear(profile, slot, year)).filter(Boolean);
  const latest = records[0] || null;
  const slotResult = latestAnalysis?.slotResults?.find((row) => row.key === slot.key);
  const outcome = latestAnalysis?.outcomes?.find((row) => row.key === slot.key);
  const thresholdRank = latest ? latestThresholdRank(profile, slot, latest.year) : null;
  const cutoffs = records.map((row) => row.cutoffScore).filter(Number.isFinite);
  const fluctuation = cutoffs.length > 1 ? Math.max(...cutoffs) - Math.min(...cutoffs) : null;
  const sourceIds = new Set([
    ...records.map((row) => row.sourceId),
    ...(school.sourceIds || []),
    school.campusDistrictSourceId,
    school.annualFeeSourceId
  ].filter(Boolean));
  const sourceLinks = dataset.sources.filter((source) => sourceIds.has(source.id)).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 5);
  const boarding = school.boarding === true ? '提供住宿（仍需向学校核实名额）' : school.boarding === false ? '公开资料显示不提供住宿' : '暂无已核验公开数据';
  const fee = Number.isFinite(school.annualFee) ? `${school.annualFee.toLocaleString('zh-CN')}元/学年` : '暂无已核验公开数据';
  const chanceText = slotResult?.interval ? `${slotResult.interval[0]}%—${slotResult.interval[1]}% · ${slotResult.tier}` : latestAnalysis?.mode === 'replay' ? '按所选历史年度复盘' : '暂无模拟结果';
  const outcomeText = Number.isFinite(outcome?.probability) ? `${outcome.probability}%` : latestAnalysis?.admitted?.key === slot.key ? '历史复盘可投档' : '—';
  const rankText = thresholdRank ? `第${thresholdRank.rank}/${thresholdRank.total}` : '暂无同口径数据';

  const historyRows = records.map((record) => `
    <tr><td>${record.year}</td><td>${record.cutoffScore ?? '—'}</td><td>${record.lastVolunteerNo ?? '—'}</td><td>${record.lastCandidateScore ?? '—'}</td><td>${record.quota ?? record.planCount ?? '—'}</td><td>${record.admittedCount ?? '—'}</td></tr>`).join('');
  content.innerHTML = `
    <p class="school-detail-lead">${escapeHtml(school.name)}为${escapeHtml(school.ownership || '性质待核验')}学校，校区位于${escapeHtml(school.campusDistrict || school.district || '区域待核验')}。以下内容用于判断“是否适合报、是否愿意去”，不以学校宣传成绩代替录取数据。</p>
    <div class="school-detail-kpis">
      <div class="school-detail-kpi"><span>本方案单校把握</span><strong>${escapeHtml(chanceText)}</strong></div>
      <div class="school-detail-kpi"><span>最终预计去向</span><strong>${escapeHtml(outcomeText)}</strong></div>
      <div class="school-detail-kpi"><span>${latest?.year || '最新'}同批同口径门槛位置</span><strong>${escapeHtml(rankText)}</strong></div>
    </div>
    <p class="school-detail-note">“门槛位置”只按公开录取最低分由高到低排列，不是学校质量排名；它不能代表师资、高考出口或适合程度。</p>
    <section class="school-detail-section"><h3>家长先核对这些</h3><dl class="school-fact-list">
      <div><dt>公民办 / 类型</dt><dd>${escapeHtml(school.ownership || '待核验')} · ${escapeHtml(school.category || '待核验')}</dd></div>
      <div><dt>招生范围</dt><dd>${escapeHtml((school.admissionScopes || []).join('、') || latest?.scope || '待核验')}</dd></div>
      <div><dt>校区地址</dt><dd>${escapeHtml(school.campusAddress || '暂无已核验公开地址')}</dd></div>
      <div><dt>住宿</dt><dd>${escapeHtml(boarding)}</dd></div>
      <div><dt>学费</dt><dd>${escapeHtml(fee)}</dd></div>
      <div><dt>近年门槛波动</dt><dd>${fluctuation === null ? '同口径年份不足' : `${cutoffs.length}年最低分极差${fluctuation}分`}</dd></div>
    </dl></section>
    <section class="school-detail-section"><h3>为什么会出现在这里</h3><p class="school-detail-lead">位于第${slot.batch}批第${slot.position}志愿。${slotResult?.interval ? `模拟单校机会区间为${slotResult.interval[0]}%—${slotResult.interval[1]}%，置信度${slotResult.confidence}；最终去向概率还会受到前序志愿先录取的影响。` : '系统按所选年份的最低分、梯度及末位志愿序号复盘。'}</p></section>
    <section class="school-detail-section"><h3>同口径历年录取依据</h3>${historyRows ? `<div class="school-history-wrap"><table class="school-history"><thead><tr><th>年份</th><th>最低分</th><th>末位志愿</th><th>末位考生分</th><th>计划/名额</th><th>实际录取</th></tr></thead><tbody>${historyRows}</tbody></table></div>` : '<p class="school-detail-lead">当前考生口径下暂无可核验的历年记录。</p>'}</section>
    <section class="school-detail-section"><h3>官方来源</h3><div class="school-source-links">${sourceLinks.length ? sourceLinks.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel(source))} ↗</a>`).join('') : '<span>暂无可直接链接的来源</span>'}</div></section>
    <div class="school-detail-actions"><button type="button" class="ghost-button" data-close-school-detail>关闭</button><button type="button" class="primary-button" data-locate-slot="${escapeHtml(slot.key)}">返回该志愿调整</button></div>`;
  $('#schoolDetailTitle').textContent = school.name;
  dialog.showModal();
}

function locateVolunteerSlot(key) {
  const row = document.querySelector(`.volunteer-row[data-key="${CSS.escape(key)}"]`);
  if (!row) return;
  row.closest('details')?.setAttribute('open', '');
  $('#schoolDetailDialog')?.close();
  navigateTo(row, { block: 'center' });
  row.querySelector('select')?.focus({ preventScroll: true });
}

function clearSchoolAssignment(slot) {
  Object.keys(slot).forEach((key) => {
    if (!['key', 'batch', 'position'].includes(key)) delete slot[key];
  });
  slot.schoolId = '';
  slot.schoolName = '';
}

function copySchoolAssignment(target, source) {
  const identity = { key: target.key, batch: target.batch, position: target.position };
  clearSchoolAssignment(target);
  const assignment = Object.fromEntries(Object.entries(source || {}).filter(([key]) => !['key', 'batch', 'position'].includes(key)));
  Object.assign(target, assignment, identity);
}

function autoPreferenceEligible(source, profile, requirePreferredDistrict = true) {
  if (!source?.schoolId) return false;
  if (profile.excludedSchools.some((name) => source.schoolName?.includes(name))) return false;
  const school = { ...schoolPreferences(source.schoolId), ...source };
  if (profile.ownershipPreference === '公办' && school.ownership !== '公办') return false;
  if (profile.maxAnnualFee && Number.isFinite(school.annualFee) && school.annualFee > profile.maxAnnualFee) return false;
  if (profile.boardingPreference === '需要住宿' && school.boarding === false) return false;
  if (requirePreferredDistrict && profile.preferredDistricts.length && !profile.preferredDistricts.includes(school.campusDistrict || school.district)) return false;
  return true;
}

function recordAsAssignment(record) {
  return record ? {
    schoolId: record.schoolId,
    schoolName: record.schoolName,
    latestCutoff: record.cutoffScore,
    latestTieRank: record.cutoffTieRank,
    lastVolunteerNo: record.lastVolunteerNo,
    ...schoolPreferences(record.schoolId)
  } : null;
}

function autoSourcesForBatch(batch, profile, autoDraft, requirePreferredDistrict = false) {
  const generated = autoDraft.filter((slot) => slot.batch === batch && slot.schoolId && autoPreferenceEligible(slot, profile, requirePreferredDistrict));
  let records = uniqueSchools(recordsForBatch(batch, profile.targetYear, profile));
  if (batch !== 2) records = records.filter((record) => directionScopeEligible(profile, record));
  const fallback = records.map(recordAsAssignment).filter((source) => autoPreferenceEligible(source, profile, requirePreferredDistrict));
  const seen = new Set();
  return [...generated, ...fallback].filter((source) => source.schoolId && !seen.has(source.schoolId) && seen.add(source.schoolId));
}

function compactBatch(batch) {
  const slots = plan.filter((slot) => slot.batch === batch).sort((a, b) => a.position - b.position);
  const assignments = slots.filter((slot) => slot.schoolId).map((slot) => ({ ...slot }));
  slots.forEach(clearSchoolAssignment);
  assignments.forEach((assignment, index) => copySchoolAssignment(slots[index], assignment));
}

async function autoImprovePlan(key) {
  const improvement = latestScore?.improvements?.find((item) => item.key === key);
  if (!improvement || !latestAnalysis) return toast('请先重新分析当前方案。');
  const profile = getProfile();
  if (profile.mode !== 'forecast' && ['structure', 'order', 'safety'].includes(key)) return toast('该项需要切换到“未来预测”模式后才能自动选择。');
  const buttons = [...document.querySelectorAll('[data-auto-improve]')];
  buttons.forEach((button) => { button.classList.add('is-loading'); button.disabled = true; button.textContent = '正在补强…'; });
  const beforePlan = plan.map((slot) => ({ ...slot }));
  const before = new Map(plan.map((slot) => [slot.key, slot.schoolId]));
  const previousTotal = latestScore.total;
  const previousDimension = latestScore.dimensions[key];
  const previousCapCount = latestScore.caps?.length || 0;
  try {
    if (profile.quotaEligible && profile.sourceSchoolId) dataset.allocations = await allocationsForYear(profile.targetYear);
    const autoDraft = profile.mode === 'forecast' ? buildDirectionDraft(profile, { strictPreferences: true }) : makePlan();
    const invalidKeys = new Set(latestAnalysis.slotResults.filter((row) => ['ineligible', 'no-data'].includes(row.state)).map((row) => `b${row.batch}-${row.position}`));

    if (key === 'validity') {
      const selected = selectedSchools(plan.filter((slot) => slot.schoolId && !invalidKeys.has(slot.key)));
      for (const slot of plan.filter((item) => invalidKeys.has(item.key))) {
        const source = autoSourcesForBatch(slot.batch, profile, autoDraft).find((item) => !isSchoolSelected(selected, item));
        if (source) {
          copySchoolAssignment(slot, source);
          addSelectedSchool(selected, source);
        } else clearSchoolAssignment(slot);
      }
      const seen = new Set();
      plan.forEach((slot) => {
        if (!slot.schoolId) return;
        if (seen.has(slot.schoolId)) clearSchoolAssignment(slot);
        else seen.add(slot.schoolId);
      });
      [2, 3, 4].forEach(compactBatch);
    }

    if (key === 'utilization') {
      const quotaActive = profile.quotaEligible && profile.candidateType === '户籍生';
      const selected = selectedSchools(plan.filter((slot) => slot.schoolId));
      const missing = plan.filter((slot) => !slot.schoolId && (quotaActive || slot.batch !== 2));
      for (const slot of missing) {
        const sources = autoSourcesForBatch(slot.batch, profile, autoDraft);
        const source = sources.find((item) => item.position === slot.position && !isSchoolSelected(selected, item)) || sources.find((item) => !isSchoolSelected(selected, item));
        if (!source) continue;
        copySchoolAssignment(slot, source);
        addSelectedSchool(selected, source);
      }
    }

    if (key === 'structure') {
      const rows = latestAnalysis.slotResults.filter((row) => row.chance !== undefined);
      const keepKeys = new Set();
      for (const batch of [3, 4]) {
        const pattern = directionPattern(profile.riskPreference, batch);
        plan.filter((slot) => slot.batch === batch).forEach((slot) => {
          const row = rows.find((item) => item.batch === batch && item.position === slot.position);
          if (slot.schoolId && row?.tier === pattern[slot.position - 1] && autoPreferenceEligible(slot, profile)) keepKeys.add(slot.key);
        });
      }
      const selected = selectedSchools(plan.filter((slot) => slot.batch === 2 || keepKeys.has(slot.key)));
      for (const batch of [3, 4]) {
        const pattern = directionPattern(profile.riskPreference, batch);
        const sources = autoSourcesForBatch(batch, profile, autoDraft);
        for (const slot of plan.filter((item) => item.batch === batch && !keepKeys.has(item.key))) {
          const desired = pattern[slot.position - 1];
          const source = sources.find((item) => item.directionTier === desired && !isSchoolSelected(selected, item)) || sources.find((item) => !isSchoolSelected(selected, item));
          if (!source) continue;
          copySchoolAssignment(slot, source);
          addSelectedSchool(selected, source);
        }
      }
    }

    if (key === 'order') {
      for (const batch of [2, 3, 4]) {
        const slots = plan.filter((slot) => slot.batch === batch).sort((a, b) => a.position - b.position);
        const assignments = slots.filter((slot) => slot.schoolId).map((slot) => ({
          source: { ...slot },
          chance: latestAnalysis.slotResults.find((row) => row.batch === batch && row.position === slot.position)?.chance ?? 100
        })).sort((a, b) => a.chance - b.chance);
        slots.forEach(clearSchoolAssignment);
        assignments.forEach((item, index) => copySchoolAssignment(slots[index], item.source));
      }
    }

    if (key === 'safety') {
      const rows = latestAnalysis.slotResults.filter((row) => row.chance !== undefined);
      const replaceKeys = new Set(plan.filter((slot) => slot.schoolId && !autoPreferenceEligible(slot, profile)).map((slot) => slot.key));
      const safeReplacementKeys = new Set();
      const safeTarget = profile.riskPreference === '进取' ? 1 : 2;
      const safeRows = rows.filter((row) => row.tier === '保底' && !replaceKeys.has(`b${row.batch}-${row.position}`));
      if (safeRows.length < safeTarget) {
        const needed = safeTarget - safeRows.length;
        plan.filter((slot) => [3, 4].includes(slot.batch)).sort((a, b) => b.batch - a.batch || b.position - a.position)
          .filter((slot) => rows.find((row) => row.batch === slot.batch && row.position === slot.position)?.tier !== '保底')
          .slice(0, needed).forEach((slot) => { replaceKeys.add(slot.key); safeReplacementKeys.add(slot.key); });
      }
      const selected = selectedSchools(plan.filter((slot) => slot.schoolId && !replaceKeys.has(slot.key)));
      for (const slot of plan.filter((item) => replaceKeys.has(item.key))) {
        const sources = autoSourcesForBatch(slot.batch, profile, autoDraft, true);
        const currentTier = rows.find((row) => row.batch === slot.batch && row.position === slot.position)?.tier;
        const desiredTier = safeReplacementKeys.has(slot.key) ? '保底' : currentTier;
        const source = sources.find((item) => item.directionTier === desiredTier && !isSchoolSelected(selected, item)) || sources.find((item) => !isSchoolSelected(selected, item));
        if (!source) continue;
        copySchoolAssignment(slot, source);
        addSelectedSchool(selected, source);
      }
    }

    const changed = plan.filter((slot) => before.get(slot.key) !== slot.schoolId);
    if (!changed.length) return toast('当前限制下暂无可自动替换的合资格学校，请检查偏好或资格信息。');
    latestScore = null;
    latestAnalysis = null;
    renderBatchForms();
    await refreshBatchOptions();
    saveDraft();
    await analyze();
    if (!latestScore) throw new Error('重新分析未返回评分');
    const targetImproved = latestScore.dimensions[key] > previousDimension || (latestScore.caps?.length || 0) < previousCapCount;
    if (latestScore.total < previousTotal || (latestScore.total === previousTotal && !targetImproved)) {
      plan = beforePlan.map((slot) => ({ ...slot }));
      latestScore = null;
      latestAnalysis = null;
      renderBatchForms();
      await refreshBatchOptions();
      saveDraft();
      await analyze();
      toast('本次自动替换未能提高总分，系统已恢复原方案；当前限制下建议保留现有选择。');
      return;
    }
    const summary = changed.slice(0, 3).map((slot) => `第${slot.batch}批第${slot.position}志愿`).join('、');
    toast(`系统已自动调整${changed.length}个位置（${summary}${changed.length > 3 ? '等' : ''}），评分已更新。`);
  } catch (error) {
    console.error(error);
    toast(`自动补强失败：${error.message}`);
  } finally {
    document.querySelectorAll('[data-auto-improve]').forEach((button) => { button.classList.remove('is-loading'); button.disabled = false; button.textContent = '系统自动补强'; });
  }
}

function renderImprovements(score) {
  const gap = Math.max(0, 100 - score.total);
  $('#scoreGap').textContent = gap ? `距100分还差${gap}分` : '当前100分';
  $('#improvementTitle').textContent = gap ? '点击对应项目，系统直接选校或重排并自动更新' : '当前方案结构已达到模型满分';
  $('#scoreCaps').innerHTML = (score.caps || []).map((cap) => `<div class="score-cap"><b>${cap.limit}分封顶</b><span>${cap.reason}：${cap.action}</span></div>`).join('');
  if (!score.improvements?.length) {
    $('#improvementList').innerHTML = '<div class="improvement-complete"><b>已无结构性扣分项</b><span>仍请逐校核实当年招生范围、收费、住宿及最新政策。</span></div>';
    return;
  }
  $('#improvementList').innerHTML = score.improvements.map((item, index) => `
    <article class="improvement-card">
      <div class="improvement-rank">${index + 1}</div>
      <div class="improvement-copy"><div><strong>${item.label}</strong><span>${item.current}/${item.maximum}分</span></div><p>${item.action || '按该维度提示调整后重新分析。'}</p></div>
      <div class="improvement-points"><b>最高+${item.points}分</b><button type="button" data-auto-improve="${item.key}">系统自动补强</button></div>
    </article>`).join('');
}

function exportPlan() {
  const payload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    privacy: '不包含姓名、准考证或联系方式',
    dataVersion: dataset.manifest.version,
    profile: getProfile(),
    plan,
    analysis: latestAnalysis,
    score: latestScore,
    disclaimer: DISCLAIMER
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `广州中考志愿模拟-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importPlanFile(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed.profile || !Array.isArray(parsed.plan) || parsed.plan.length !== 15) throw new Error('不是有效的15志愿匿名方案文件');
  setProfile(parsed.profile);
  plan = parsed.plan;
  renderBatchForms();
  await refreshBatchOptions();
  saveDraft();
  toast('方案已导入。');
}

function renderSources() {
  const coverage = Object.entries(dataset.manifest.coverage).map(([year, row]) => `<tr><td>${year}</td><td>${row.batch2.toLocaleString()}</td><td>${row.batch3.toLocaleString()}</td><td>${row.batch4.toLocaleString()}</td><td>${row.scoreBands}</td></tr>`).join('');
  $('#sourceContent').innerHTML = `
    <p>数据版本：<strong>${dataset.manifest.version}</strong>，生成于 ${new Date(dataset.manifest.generatedAt).toLocaleString('zh-CN')}。</p>
    <table><thead><tr><th>年度</th><th>第二批</th><th>第三批</th><th>第四批</th><th>分数段</th></tr></thead><tbody>${coverage}</tbody></table>
    <h3>官方来源</h3>${dataset.sources.map((source) => `<div class="source-row"><a href="${source.url}" target="_blank" rel="noreferrer">${source.title}</a><small>${source.sha256 ? `SHA-256 ${source.sha256.slice(0, 16)}…` : '政策或索引入口'}</small></div>`).join('')}
    <h3>已知局限</h3><ul>${dataset.manifest.limitations.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function loadSample() {
  setProfile({ mode: 'forecast', targetYear: dataset.manifest.latestPolicyYear + 1, score: 710, scoreLow: 700, scoreHigh: 720, candidateType: '户籍生', admissionDistrict: '天河区', referenceGrade: 'C', riskPreference: '均衡', ownershipPreference: '不限', quotaEligible: false, notAdmittedFirstBatch: true });
  plan = makePlan();
  const names = ['华南师范大学附属中学（石牌校区）', '广州市第二中学', '广州市第六中学（海珠校区）', '广东华侨中学', '广州市第十六中学（水荫校区）', '广州市天河中学'];
  const slots = plan.filter((slot) => slot.batch === 3);
  names.forEach((name, index) => {
    const school = dataset.schools.find((item) => item.name === name);
    if (school) Object.assign(slots[index], { schoolId: school.id, schoolName: school.name }, schoolPreferences(school.id));
  });
  renderBatchForms();
  refreshBatchOptions();
  saveDraft();
  toast('已载入710分均衡策略示例，可继续修改。');
}

function handleAnalyzeTop() {
  if (plan.some((slot) => slot.schoolId)) return analyze();
  setWorkspaceMode('verify', true);
  navigateTo($('#profile'));
  $('#score').focus({ preventScroll: true });
  toast('先确认分数和升学区域，再选择学校进入志愿表。');
}

function bindEvents() {
  loadRealisticPref();
  const dirSim = $('#realisticSimDirection');
  if (dirSim) dirSim.addEventListener('change', async () => {
    setRealisticSim(dirSim.checked);
    if (directionDraft) await generateDirection();
    toast(dirSim.checked ? '波动压力测试已开启，结果已按额外不确定性重新计算。' : '已恢复标准历史情景模拟。');
  });
  $('#landingDirection')?.addEventListener('click', () => setWorkspaceMode('direction', true));
  $('#landingTarget')?.addEventListener('click', () => setWorkspaceMode('target', true));
  $('#landingVerify')?.addEventListener('click', () => setWorkspaceMode('verify', true));
  const homeLink = $('#homeLink'); if (homeLink) homeLink.addEventListener('click', (e) => { e.preventDefault(); setWorkspaceMode('home'); });
  // 首页保留同页回到首屏；独立子页面必须遵循真实链接返回助手首页。
  const homeReturn = $('#homeReturn');
  if (homeReturn && $('#landing')) homeReturn.addEventListener('click', (e) => { e.preventDefault(); setWorkspaceMode('home'); });
  $('#directionForm')?.addEventListener('submit', generateDirection);
  $('#adoptDirection')?.addEventListener('click', adoptDirection);
  document.querySelectorAll('[data-direction-risk]').forEach((button) => button.addEventListener('click', () => switchDirectionRisk(button.dataset.directionRisk)));
  $('#targetForm')?.addEventListener('submit', analyzeTarget);
  $('#adoptTarget')?.addEventListener('click', adoptTarget);
  $('#improvementList')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-auto-improve]');
    if (!button) return;
    autoImprovePlan(button.dataset.autoImprove);
  });
  $('#outcomeList')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-school-detail]');
    if (button) openSchoolDetail(button.dataset.schoolDetail, button.dataset.slotKey);
  });
  $('#closeSchoolDetail')?.addEventListener('click', () => $('#schoolDetailDialog')?.close());
  $('#schoolDetailContent')?.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-school-detail]')) $('#schoolDetailDialog')?.close();
    const locate = event.target.closest('[data-locate-slot]');
    if (locate) locateVolunteerSlot(locate.dataset.locateSlot);
  });
  ['targetCandidateType', 'targetAdmissionDistrict', 'targetHouseholdDistrict'].forEach((id) => { const el = document.getElementById(id); if (el) el.addEventListener('change', refreshTargetSchoolList); });
  $('#targetSchoolName')?.addEventListener('input', () => { $('#targetResult').hidden = true; targetDraft = null; targetResultData = null; });
  $('#targetCurrentScore')?.addEventListener('input', () => { $('#targetResult').hidden = true; targetDraft = null; targetResultData = null; });
  $('#mode')?.addEventListener('change', async () => { renderTargetYears(); await refreshBatchOptions(); saveDraft(); });
  $('#profileForm')?.addEventListener('change', async (event) => {
    latestScore = null;
    latestAnalysis = null;
    if (event.target.id === 'quotaEligible') {
      syncQuotaInterface({ clearWhenDisabled: true });
      renderBatchForms();
      toast(event.target.checked ? '第二批已启用，请选择所在初中。' : '已取消第二批，并清空第二批志愿。');
    }
    if (['targetYear', 'candidateType', 'sourceSchoolId', 'admissionDistrict', 'householdDistrict', 'schoolDistrict', 'crossDistrict', 'quotaEligible', 'excludedSchools'].includes(event.target.id)) await refreshBatchOptions();
    if (event.target.id === 'realisticSim') {
      setRealisticSim(event.target.checked);
      toast(event.target.checked ? '波动压力测试已开启，将重新计算临界学校机会。' : '已恢复标准历史情景模拟。');
    }
    if ((event.target.id === 'riskPreference' || event.target.id === 'realisticSim') && plan.some((slot) => slot.schoolId)) await analyze();
    updateSlotMeta();
    updateCoach();
    saveDraft();
  });
  $('#profileForm')?.addEventListener('input', () => { latestScore = null; latestAnalysis = null; updateSlotMeta(); updateCoach(); saveDraft(); });
  ['schoolSearch', 'schoolBatch', 'schoolOwnership', 'schoolScope'].forEach((id) => { const el = document.getElementById(id); if (el) el.addEventListener(id === 'schoolSearch' ? 'input' : 'change', renderSchoolTable); });
  $('#analyzePlan')?.addEventListener('click', analyze);
  // 顶部“分析当前方案”入口已移除（功能由 landing 进入求证版 + 内部分析按钮承担）
  $('#coachAnalyze')?.addEventListener('click', analyze);
  $('#viewPlan')?.addEventListener('click', toggleSelectedPreview);
  $('#clearPlan')?.addEventListener('click', () => { plan = makePlan(); renderBatchForms(); refreshBatchOptions(); saveDraft(); toast('志愿表已清空。'); });
  $('#loadSample')?.addEventListener('click', loadSample);
  $('#restoreDraft')?.addEventListener('click', restoreDraft);
  $('#exportPlan')?.addEventListener('click', exportPlan);
  $('#printPlan')?.addEventListener('click', () => window.print());
  $('#importPlan')?.addEventListener('click', () => $('#importFile').click());
  $('#importFile')?.addEventListener('change', async (event) => {
    try { if (event.target.files[0]) await importPlanFile(event.target.files[0]); }
    catch (error) { toast(`导入失败：${error.message}`); }
    event.target.value = '';
  });
  const showSourcesBtn = $('#showSources');
  if (showSourcesBtn) showSourcesBtn.addEventListener('click', () => { renderSources(); $('#sourceDialog').showModal(); });
  $('#closeSources')?.addEventListener('click', () => $('#sourceDialog').close());
  $('#guideStart')?.addEventListener('click', () => {
    let target = document.querySelector($('#guideStart').dataset.nextTarget || '#profile');
    if (!target || target.hidden) target = $('#volunteerForm');
    navigateTo(target);
    if (target.id === 'profile') $('#score').focus({ preventScroll: true });
  });
  document.querySelectorAll('[data-guide-target]').forEach((button) => button.addEventListener('click', () => {
    let target = document.querySelector(button.dataset.guideTarget);
    if (button.dataset.guideTarget === '#analysis' && target.hidden) {
      target = $('#volunteerForm');
      toast('先填写至少一个志愿并点击分析，系统才会生成机会和建议。');
    }
    navigateTo(target);
  }));
}

async function init() {
  try {
    plan = makePlan();
    await loadCoreData();
    setupSelectors();
    syncQuotaInterface();
    prepareDraftRestore();
    bindEvents();
    if (window.ZhongkaoAccess) {
      const syncLock = (s) => document.body.classList.toggle('is-locked', !s.entitled);
      window.ZhongkaoAccess.onChange(syncLock);
      syncLock(window.ZhongkaoAccess.getState());
    }
    // 重构为独立页面：每个页面只含自己的功能区块，HTML 已默认显示，无需整页切换显隐。
    // 仅求证版页面需要初始化志愿表与学校表（依赖 verifyWorkspace 内元素）。
    const isVerify = !!document.getElementById('verifyWorkspace');
    if (isVerify) {
      renderBatchForms();
      const transferSource = new URLSearchParams(window.location.search).get('draft');
      // 从方向版或目标学校版进入时自动恢复刚生成的草案；普通访问仍由家长决定是否恢复旧草稿。
      if (pendingDraft && ['direction', 'target'].includes(transferSource)) {
        setWorkspaceMode('verify');
        await restoreDraft();
      } else {
        setWorkspaceMode(pendingDraft ? 'verify' : 'home');
      }
    } else {
      // 首页及其他独立页：pendingDraft 只服务于求证版，首页必须始终显示三大模块入口，
      // 不能因 localStorage 残留草稿而把 #landing 隐藏（否则会只剩扩展查询工具/功能概览）。
      setWorkspaceMode('home');
    }
    // 同页锚点深链（如 /verify/#volunteerForm）：元素已显示则平滑滚动到位
    const deepHash = location.hash;
    if (deepHash && deepHash !== '#main') {
      const deepId = deepHash.slice(1);
      const targetEl = document.getElementById(deepId);
      if (targetEl && !targetEl.hidden) {
        setTimeout(() => window.ZhongkaoNavigation?.scrollTo(targetEl), 60);
      }
    }
    if (isVerify) await refreshBatchOptions();
    // 兜底：确保付费闸门打码已应用（access-gate 解析完成后会再触发，这里保证初次渲染即生效）
    window.ZhongkaoAccess?.applyContentGating?.();
  } catch (error) {
    console.error(error);
    $('#main').insertAdjacentHTML('afterbegin', `<div class="error-box">官方数据加载失败：${error.message}。请稍后刷新重试。</div>`);
    const dataVersionErr = $('#dataVersion');
    if (dataVersionErr) dataVersionErr.textContent = '数据加载失败';
  }
}

window.setWorkspaceMode = setWorkspaceMode;

init();
