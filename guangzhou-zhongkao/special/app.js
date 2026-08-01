const DATA_URL = '../data/first-batch-2026.json';
const EVENTS_URL = '../data/autonomous-school-events-2026.json';
const RESULTS_URL = '../data/autonomous-results.json';
const state = { mode: 'talent', data: null, events: null, results: null, selectedAutonomousSchoolId: null };
const $ = (selector) => document.querySelector(selector);
const navigateTo = (target, options = {}) => {
  if (window.ZhongkaoNavigation?.scrollTo(target, options)) return;
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  element?.scrollIntoView({ behavior: 'smooth', block: options.block || 'start' });
};
const PROJECT_GROUPS = [
  { label: '球类项目', items: ['足球', '男子足球', '女子足球', '篮球', '男子篮球', '女子篮球', '排球', '男子排球', '女子排球', '羽毛球', '乒乓球', '网球', '手球', '曲棍球', '棒垒球', '毽球'] },
  { label: '田径、水上与户外', items: ['田径', '游泳', '定向越野', '攀岩', '冰雪运动'] },
  { label: '综合体育', items: ['武术', '击剑', '跆拳道', '射击', '科技体育', '无线电测向', '棋类', '跳绳', '啦啦操', '健美操', '艺术体操', '体育舞蹈', '匹克球'] },
  { label: '音乐、舞蹈与美术', items: ['舞蹈', '合唱', '交响乐', '民乐', '古琴', '美术', '书法'] },
  { label: '语言与非遗', items: ['语言艺术', '粤剧', '非遗粤歌', '剪纸', '非遗广彩'] }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function setMode(mode) {
  state.mode = mode;
  const isTalent = mode === 'talent';
  $('#talentTab').classList.toggle('active', isTalent);
  $('#talentTab').setAttribute('aria-selected', String(isTalent));
  $('#autonomousTab').classList.toggle('active', !isTalent);
  $('#autonomousTab').setAttribute('aria-selected', String(!isTalent));
  $('#talentStatusField').hidden = !isTalent;
  $('#talentProjectPicker').hidden = !isTalent;
  $('#qualificationForm').classList.toggle('autonomous-mode', !isTalent);
  $('#qualificationStepLabel').textContent = isTalent ? '第一步 · 特长生资料查询' : '可选 · 自主招生条件核对';
  $('#qualificationTitle').textContent = isTalent ? '先按特长项目找对应学校' : '需要时再核对通用报考条件';
  $('#optionalCheckNote').textContent = isTalent
    ? '只想了解学校有哪些项目，可以直接往下查看；下面的通用条件自检是可选参考，不会替代专业测试、学校审核或官方资格名单。'
    : '只想了解目标学校，可以直接往下查看；下面的通用条件自检是可选参考，不会替代学校报名、资格审核、综合能力考核或官方资格名单。';
  state.selectedAutonomousSchoolId = null;
  $('#autonomousSchoolChecker').hidden = true;
  $('#autonomousCheckerForm').hidden = true;
  $('#autonomousSchoolResult').hidden = true;
  $('#schoolSearch').value = isTalent ? $('#talentProject').value : '';
  $('#districtFilter').value = '';
  $('#scopeFilter').value = '';
  $('#viewMatchedSchools').disabled = !isTalent || !$('#talentProject').value;
  $('#schoolTitle').textContent = isTalent ? '查找特长项目与对应学校' : '查看目标校开放日与往年自招成绩';
  $('#schoolStepLabel').textContent = isTalent ? '第二步 · 特长项目学校查询' : '第二、三步 · 自主招生资料查询';
  $('#schoolSearch').placeholder = isTalent ? '例如：培正、足球、民乐' : '例如：华附、执信、越秀';
  renderEligibilityPrompt();
  renderSchools();
}

function renderEligibilityPrompt() {
  const result = $('#eligibilityResult');
  result.removeAttribute('data-level');
  result.innerHTML = state.mode === 'talent'
    ? '<strong>先选特长项目，再核对“学校＋项目”</strong><p>例如只知道自己踢足球，可以先选“足球”，系统会汇总所有相关学校；最终仍须通过对应学校、对应项目的专业测试。</p>'
    : '<strong>需要时再核对通用条件</strong><p>如果只是了解目标校，可以直接查看下方开放日和往年自招成绩；若准备进一步核对，再按所选学校查看报名、审核和考核状态。</p>';
}

function assessEligibility(event) {
  event.preventDefault();
  const graduate = $('#currentGraduate').value;
  const connection = $('#guangzhouConnection').value;
  const publicEligible = $('#publicEligible').value;
  const candidateType = $('#candidateType').value;
  const result = $('#eligibilityResult');
  let level = 'pass';
  let title = '可继续核查学校条件';
  let message = '';

  if (graduate === 'no' || connection === 'no') {
    level = 'stop';
    title = '当前不符合2026通用报考条件';
    message = '自主招生要求具有广州户籍或学籍的应届初中毕业生；特长生也须先具备当年中考报名及相应项目报考条件。请向学校或招考部门核实特殊情况。';
  } else if (graduate === 'unknown' || connection === 'unknown' || candidateType === 'other') {
    level = 'pending';
    title = '基础身份条件需要先核实';
    message = '请先确认应届毕业生身份、广州户籍或学籍，以及对应考生类别，再选择学校。';
  } else if (publicEligible !== 'yes') {
    level = publicEligible === 'no' ? 'pending' : 'pending';
    title = '公办学校报考条件待核实';
    message = '大多数项目为公办普通高中。若不符合公办高中报考条件，只能继续核查民办学校及其招生简章，不能据此填报公办学校。';
  } else if (state.mode === 'talent') {
    const project = $('#talentProject').value;
    const status = $('#talentStatus').value;
    if (!project) {
      level = 'pending';
      title = '请先选择孩子的特长项目';
      message = '选择“足球”等项目后，系统会汇总所有相关学校，再逐校核对招生范围和专业测试资格。';
    } else if (status !== 'passed') {
      level = status === 'none' ? 'stop' : 'pending';
      title = status === 'none' ? '当前不能填报对应特长生志愿' : '先完成对应项目专业测试';
      message = '专业测试必须对应到具体学校和具体项目。未参加、未通过或尚未确认时，不应把该项目填入第一批特长生志愿。';
    } else {
      message = '通用条件初筛通过。请在下方找到已通过测试的对应学校和项目，再核对招生范围、录取控制要求及官方公示。';
    }
  } else {
    title = '通用条件初筛完成，下一步选择学校';
    message = '请从下方自主招生学校中选择一所，再核对这所学校的报名、资格审核和综合能力考核状态。资格只对对应学校有效。';
  }
  result.dataset.level = level;
  result.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  if (level !== 'stop') {
    const needsProject = state.mode === 'talent' && !$('#talentProject').value;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'eligibility-next';
    action.textContent = needsProject ? '先选择孩子的特长项目' : state.mode === 'autonomous' ? '继续选择自主招生学校' : '继续查看匹配学校';
    action.addEventListener('click', () => navigateTo(needsProject ? $('#talentProject') : $('#schoolTitle')));
    result.append(action);
  }
  navigateTo(result, { block: 'nearest' });
}

function uniqueDistricts() {
  const records = [...state.data.specialTalent, ...state.data.autonomous];
  return [...new Set(records.map((row) => row.district).filter((value) => value && !/未标明/.test(value)))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function talentRecords() {
  return state.data.specialTalent.filter((row) => row.pathway === '普通高中特长生');
}

function projectMatches(keyword) {
  return talentRecords().filter((row) => String(row.projectSummary).includes(keyword));
}

function projectSchoolCount(keyword) {
  return new Set(projectMatches(keyword).map((row) => row.schoolName.replace(/（足球人才培养改革试点）/g, ''))).size;
}

function populateTalentProjects() {
  const groups = PROJECT_GROUPS.map((group) => {
    const options = group.items
      .map((keyword) => ({ keyword, count: projectSchoolCount(keyword) }))
      .filter((item) => item.count > 0)
      .map((item) => `<option value="${escapeHtml(item.keyword)}">${escapeHtml(item.keyword)}（${item.count}所）</option>`)
      .join('');
    return options ? `<optgroup label="${escapeHtml(group.label)}">${options}</optgroup>` : '';
  }).join('');
  $('#talentProject').innerHTML = '<option value="">请先选择，例如：足球</option>' + groups;
}

function applyTalentProject() {
  const keyword = $('#talentProject').value;
  $('#districtFilter').value = '';
  $('#scopeFilter').value = '';
  $('#schoolSearch').value = keyword;
  $('#viewMatchedSchools').disabled = !keyword;
  if (!keyword) {
    $('#talentProjectInsight').innerHTML = '<strong>不知道学校也没关系</strong><span>先选择项目，系统会自动筛出所有相关学校。</span>';
  } else {
    const records = projectMatches(keyword);
    const schools = projectSchoolCount(keyword);
    const reformCount = records.filter((row) => row.schoolName.includes('足球人才培养改革试点')).length;
    const extra = keyword === '足球' && reformCount ? `，其中${reformCount}条为足球人才培养改革试点` : '';
    $('#talentProjectInsight').innerHTML = `<strong>${escapeHtml(keyword)}：找到${schools}所学校</strong><span>共${records.length}条学校／项目记录${escapeHtml(extra)}，可继续按区域和招生范围缩小。</span>`;
  }
  renderSchools();
}

function filteredRecords() {
  const keyword = $('#schoolSearch').value.trim().toLowerCase();
  const district = $('#districtFilter').value;
  const scope = $('#scopeFilter').value;
  const records = state.mode === 'talent'
    ? talentRecords()
    : state.data.autonomous;
  return records.filter((row) => {
    const haystack = [row.schoolName, row.projectSummary, row.district, row.scope, row.cutoff].filter(Boolean).join(' ').toLowerCase();
    if (keyword && !haystack.includes(keyword)) return false;
    if (district && row.district !== district) return false;
    if (scope === '全市' && !String(row.scope).includes('全市')) return false;
    if (scope === '本区' && String(row.scope).includes('全市')) return false;
    return true;
  });
}

function formatScoreRange(values, digits = 0) {
  const scores = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!scores.length) return null;
  const minimum = scores[0].toFixed(digits);
  const maximum = scores[scores.length - 1].toFixed(digits);
  return minimum === maximum ? minimum : `${minimum}—${maximum}`;
}

function talentResultReference(row) {
  const selectedProject = $('#talentProject').value;
  let records = (state.data.talentResults || []).filter((result) => result.schoolId === row.schoolId);
  if (selectedProject) records = records.filter((result) => result.fullProjectName.includes(selectedProject));
  const compositeRange = formatScoreRange(records.map((result) => result.compositeScore), 2);
  if (compositeRange) {
    const publishedCount = records.filter((result) => Number.isFinite(result.compositeScore)).length;
    return {
      label: '2026项目末位合成成绩（100分制）',
      value: compositeRange,
      detail: `${publishedCount}个项目有录取末位值，满分100分`,
      hasOfficialResult: true
    };
  }
  const professionalRange = formatScoreRange(records.map((result) => result.professionalTestScore), 2);
  if (professionalRange) {
    return {
      label: '2026专业测试参考',
      value: professionalRange,
      detail: '改革试点项目按官方公布的专业测试成绩展示',
      hasOfficialResult: true
    };
  }
  return {
    label: '2026项目末位合成成绩（100分制）',
    value: '暂无公布值',
    detail: records.length ? '官方结果表为空值，可能未形成末位分' : '未匹配到该校项目结果',
    hasOfficialResult: records.length > 0
  };
}

function talentCard(row) {
  const plans = row.projectPlanNumbers?.length ? row.projectPlanNumbers.join('、') : '见官方表';
  const cutoff = row.cutoffRequirements?.join('；') || '以官方表为准';
  const score = row.scoreReference || { display: '以项目规则为准', basis: '请核对学校当年招生简章' };
  const controlLineDetail = score.display === '以项目规则为准'
    ? score.basis
    : `${score.basis}，仅作报考资格核验，不是该校录取分或预测分`;
  const result = talentResultReference(row);
  const guideUrl = state.data.sources.find((source) => source.id === row.sourceId)?.url || '#';
  const resultUrl = state.data.sources.find((source) => source.id === 'official-2026-first-batch-result')?.url || '#';
  return `<article class="school-card">
    <div class="school-card-head"><div><h3>${escapeHtml(row.schoolName)}</h3><p>${escapeHtml(row.district)} · ${escapeHtml(row.ownership)}</p></div><span class="school-badge">特长生</span></div>
    <div class="school-card-body">
      <div class="fact-grid"><div class="fact"><span>招生范围</span><strong>${escapeHtml(row.scope)}</strong></div><div class="fact"><span>项目计划数</span><strong>${escapeHtml(plans)}</strong></div><div class="fact"><span>特长生总计划</span><strong>${escapeHtml(row.totalPlan ?? '见官方表')}</strong></div></div>
      <div class="score-reference-box" aria-label="文化课资格门槛与官方项目结果">
        <div><span>文化课最低控制线（资格门槛）</span><strong>${escapeHtml(score.display)}</strong><small>${escapeHtml(controlLineDetail)}</small></div>
        <div><span>${escapeHtml(result.label)}</span><strong>${escapeHtml(result.value)}</strong><small>${escapeHtml(result.detail)}</small></div>
      </div>
      <p class="score-reference-note">394分、492分等为全市统一控制线，不代表学校实际录取分。文化课达到控制线只是投档前提；体育项目通常按中考40%＋专业测试60%，艺术项目按中考50%＋专业测试50%计算合成成绩，具体以项目规则为准。</p>
      <div class="project-box"><span>招生项目</span><p>${escapeHtml(row.projectSummary)}</p></div>
      <div class="requirement-box"><span>录取控制要求</span><p>${escapeHtml(cutoff)}</p></div>
      <div class="school-links"><a class="school-link" href="${escapeHtml(guideUrl)}#page=${row.sourcePage}" target="_blank" rel="noreferrer">查看报考指南第${row.sourcePage}页 →</a>${result.hasOfficialResult ? `<a class="school-link" href="${escapeHtml(resultUrl)}" target="_blank" rel="noreferrer">查看2026第一批官方结果 →</a>` : ''}</div>
    </div>
  </article>`;
}

function formatAutonomousComposite(value) {
  return Number.isFinite(value) ? value.toFixed(4) : '—';
}

function autonomousResultReference(row) {
  const records = (state.results?.records || [])
    .filter((record) => record.schoolId === row.schoolId)
    .sort((a, b) => b.year - a.year);
  if (!records.length) {
    return `<div class="autonomous-history-box is-pending"><div><span>往年自主招生末位合成成绩</span><strong>暂未匹配到历史记录</strong><small>学校名称或校区口径可能发生变化，请以官方录取结果表为准。</small></div></div>`;
  }
  const rows = records.map((record) => {
    const source = (state.results?.sources || []).find((item) => item.id === record.sourceId);
    const sourceLink = source ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">官方结果 ↗</a>` : '';
    return `<div class="autonomous-history-row"><b>${record.year}</b><span>户籍生 <strong>${formatAutonomousComposite(record.householdCompositeScore)}</strong></span><span>非户籍生 <strong>${formatAutonomousComposite(record.nonHouseholdCompositeScore)}</strong></span>${sourceLink}</div>`;
  }).join('');
  return `<div class="autonomous-history-box" aria-label="往年自主招生末位合成成绩"><div class="autonomous-history-head"><span>往年自主招生末位合成成绩（100分制）</span><small>不是中考总分，先满足控制线和参考科目等级，再按合成成绩排序</small></div>${rows}<p>“—”表示该考生口径没有录取记录；历史门槛只用于了解竞争区间，不代表当年录取承诺。</p></div>`;
}

function autonomousCard(row) {
  const selected = row.schoolId === state.selectedAutonomousSchoolId;
  const eventRecords = state.events?.events?.filter((event) => event.schoolId === row.schoolId) || [];
  const eventSources = new Map((state.events?.sources || []).map((source) => [source.id, source]));
  const eventContent = eventRecords.length
    ? eventRecords.map((event) => {
      const source = eventSources.get(event.sourceId);
      const sourceLink = source ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">查看活动来源 →</a>` : '';
      return `<div class="school-event-item"><strong>${escapeHtml(event.type)} · ${escapeHtml(event.status)}</strong><span>${escapeHtml(event.dateDisplay)}${event.location ? ` · ${escapeHtml(event.location)}` : ''}</span><small>${escapeHtml(event.note)}</small>${sourceLink}</div>`;
    }).join('')
    : '<div class="school-event-item is-pending"><strong>暂未收录已核验的2026公开活动</strong><span>不代表学校没有开放日或校庆日；请留意学校官网、官微及2027年自主招生简章。</span></div>';
  return `<article class="school-card">
    <div class="school-card-head"><div><h3>${escapeHtml(row.schoolName)}</h3><p>${escapeHtml(row.district)} · ${escapeHtml(row.affiliation)} · ${escapeHtml(row.ownership)}</p></div><span class="school-badge">自主招生</span></div>
    <div class="school-card-body">
      <div class="fact-grid"><div class="fact"><span>招生范围</span><strong>${escapeHtml(row.scope)}</strong></div><div class="fact"><span>招生计划</span><strong>${escapeHtml(row.plan)}人</strong></div><div class="fact"><span>随迁子女上限</span><strong>${escapeHtml(row.migrantPlanCap ?? '—')}</strong></div></div>
      ${autonomousResultReference(row)}
      <div class="requirement-box"><span>录取门槛</span><p>${escapeHtml(row.cutoff)}；参考科目等级最低要求 ${escapeHtml(row.referenceGrade || '以简章为准')}。</p></div>
      <div class="project-box"><span>学校个性化资格</span><p>学科特长、创新潜质、材料要求和综合能力考核办法因校而异，必须查看该校2026官方简章。</p></div>
      <div class="school-event-box"><span>学校公开活动（仅作了解与咨询）</span>${eventContent}</div>
      <p class="admission-route-note">自主招生不在开放日办理。2026年考生报名为5月12日9:00—5月15日18:00，须通过中考服务平台完成；活动日不能替代报名、资格审核或综合能力考核。</p>
      <div class="autonomous-card-actions"><button class="select-autonomous-school" data-select-autonomous="${escapeHtml(row.schoolId)}" type="button" ${selected ? 'disabled' : ''}>${selected ? '正在核查这所学校' : '选择这所学校核查资格'}</button><a class="school-link" href="${escapeHtml(row.prospectusUrl)}" target="_blank" rel="noreferrer">查看2026官方简章 →</a></div>
    </div>
  </article>`;
}

function selectAutonomousSchool(schoolId) {
  const school = state.data.autonomous.find((row) => row.schoolId === schoolId);
  if (!school) return;
  state.selectedAutonomousSchoolId = schoolId;
  $('#autonomousCheckerTitle').textContent = school.schoolName;
  $('#autonomousCheckerMeta').textContent = `${school.district} · ${school.ownership} · 招生范围${school.scope}。请按这所学校的实际审核结果选择状态。`;
  $('#autonomousStatus').value = 'unknown';
  $('#autonomousSchoolChecker').hidden = false;
  $('#autonomousCheckerForm').hidden = false;
  $('#autonomousSchoolResult').hidden = true;
  renderSchools();
  navigateTo($('#autonomousSchoolChecker'));
}

function checkAutonomousSchoolStatus() {
  const school = state.data.autonomous.find((row) => row.schoolId === state.selectedAutonomousSchoolId);
  if (!school) return;
  const status = $('#autonomousStatus').value;
  const outcomes = {
    unknown: ['pending', '先向该校确认资格状态', '查看该校官方简章、资格审核名单或中考服务平台；不能用其他学校的审核结果代替。'],
    'not-registered': ['stop', '尚未报名该校，当前不能填报', '自主招生须先完成该校报名和资格审核。请核对当年报名时间；逾期后不能以其他学校资格替代。'],
    pending: ['pending', '等待该校资格审核结果', '审核通过并取得该校综合能力考核资格后，才能进入下一阶段。现阶段不要把“已报名”理解为“可填志愿”。'],
    assessment: ['pending', '先完成该校综合能力考核', '你已取得这所学校的考核资格，但仍需参加该校综合能力考核并以学校公示、平台状态为准。'],
    qualified: ['pass', '可把这所学校作为自主招生志愿候选', `仍须同时达到${school.cutoff || '学校录取控制线'}及参考科目等级要求；第一批自主招生只能填1所学校。`],
    failed: ['stop', '当前不能填报这所学校的自主招生志愿', '未取得该校资格或未通过该校考核时，不能使用其他学校的资格填报本校。可返回学校列表核对另一所已取得资格的学校。']
  };
  const [level, title, message] = outcomes[status];
  const result = $('#autonomousSchoolResult');
  result.dataset.level = level;
  result.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p><a href="${escapeHtml(school.prospectusUrl)}" target="_blank" rel="noreferrer">查看${escapeHtml(school.schoolName)}2026官方简章 →</a>`;
  result.hidden = false;
}

function renderSchools() {
  if (!state.data) return;
  const records = filteredRecords();
  $('#schoolSummary').textContent = state.mode === 'talent'
    ? `显示${records.length}条特长项目学校记录；先按项目了解有哪些学校，再回到第三、第四批主流程。`
    : `显示${records.length}所目标学校；每所卡片提供公开活动、2025—2026年自招合成成绩和官方简章入口。`;
  $('#schoolGrid').innerHTML = records.map((row) => state.mode === 'talent' ? talentCard(row) : autonomousCard(row)).join('');
  $('#emptyState').hidden = records.length > 0;
  document.querySelectorAll('[data-select-autonomous]').forEach((button) => button.addEventListener('click', () => selectAutonomousSchool(button.dataset.selectAutonomous)));
}

function renderSources() {
  const sources = [...new Map([...state.data.sources, ...(state.events?.sources || []), ...(state.results?.sources || [])].map((source) => [source.id || source.url, source])).values()];
  $('#sourceList').innerHTML = sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} →</a>`).join('');
}

async function initialize() {
  try {
    const [response, eventResponse, resultResponse] = await Promise.all([
      fetch(DATA_URL),
      fetch(EVENTS_URL).catch(() => null),
      fetch(RESULTS_URL).catch(() => null)
    ]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    state.events = eventResponse?.ok ? await eventResponse.json() : null;
    state.results = resultResponse?.ok ? await resultResponse.json() : null;
    $('#dataVersion').textContent = `2026官方资料 · 自主招生结果2025—2026 · ${state.data.version}`;
    $('#talentCount').textContent = `${state.data.counts.generalHighSchoolTalentEntries}条学校／项目记录`;
    $('#autonomousCount').textContent = `${state.data.counts.autonomousSchools}所学校`;
    const districtFilter = $('#districtFilter');
    districtFilter.insertAdjacentHTML('beforeend', uniqueDistricts().map((district) => `<option value="${escapeHtml(district)}">${escapeHtml(district)}</option>`).join(''));
    populateTalentProjects();
    renderSources();
    renderSchools();
  } catch (error) {
    $('#dataVersion').textContent = '数据加载失败';
    $('#schoolGrid').innerHTML = `<div class="empty-state"><strong>暂时无法读取资料</strong><p>${escapeHtml(error.message)}。请稍后刷新页面。</p></div>`;
  }
}

$('#talentTab').addEventListener('click', () => setMode('talent'));
$('#autonomousTab').addEventListener('click', () => setMode('autonomous'));
$('#qualificationForm').addEventListener('submit', assessEligibility);
$('#checkAutonomousStatus').addEventListener('click', checkAutonomousSchoolStatus);
$('#changeAutonomousSchool').addEventListener('click', () => {
  state.selectedAutonomousSchoolId = null;
  $('#autonomousSchoolChecker').hidden = true;
  $('#autonomousCheckerForm').hidden = true;
  $('#autonomousSchoolResult').hidden = true;
  renderSchools();
  navigateTo($('#schoolTitle'));
});
for (const id of ['schoolSearch', 'districtFilter', 'scopeFilter']) $(id.startsWith('#') ? id : `#${id}`).addEventListener('input', renderSchools);
$('#talentProject').addEventListener('change', applyTalentProject);
$('#viewMatchedSchools').addEventListener('click', () => navigateTo($('#schoolTitle')));
$('#schoolSearch').addEventListener('input', () => {
  if (state.mode !== 'talent' || $('#schoolSearch').value === $('#talentProject').value) return;
  $('#talentProject').value = '';
  $('#viewMatchedSchools').disabled = true;
  $('#talentProjectInsight').innerHTML = '<strong>已改用关键字搜索</strong><span>也可以回到第一步重新选择已归类的特长项目。</span>';
});
$('#clearFilters').addEventListener('click', () => { $('#schoolSearch').value = ''; $('#districtFilter').value = ''; $('#scopeFilter').value = ''; $('#talentProject').value = ''; $('#viewMatchedSchools').disabled = true; $('#talentProjectInsight').innerHTML = '<strong>不知道学校也没关系</strong><span>先选择项目，系统会自动筛出所有相关学校。</span>'; renderSchools(); });
// 支持从首页次要入口直达对应标签：?mode=autonomous 打开自主招生，默认特长生
const initialMode = new URLSearchParams(location.search).get('mode');
if (initialMode === 'autonomous') setMode('autonomous');
initialize();
