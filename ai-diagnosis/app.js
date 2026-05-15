const storageKey = 'pinmoo-ai-diagnosis-history-v3';
const draftKey = 'pinmoo-ai-diagnosis-draft-v3';

const fieldIds = [
  'storeName', 'industry', 'reportType', 'period', 'compareType', 'dataSource',
  'sales', 'prevSales', 'visitors', 'prevVisitors', 'conversion', 'aov', 'refundRate', 'roi',
  'productCount', 'activeProductCount', 'topSkuShare', 'serviceRate',
  'searchShare', 'recommendShare', 'contentShare', 'paidShare', 'privateShare', 'notes'
];

const benchmarks = {
  default: { conversion: 3.2, refund: 5, roi: 3, activeRate: 68, service: 90, privateShare: 10, topSkuMax: 55 },
  '美妆个护': { conversion: 3.5, refund: 5, roi: 3.2, activeRate: 70, service: 92, privateShare: 12, topSkuMax: 55 },
  '服装鞋包': { conversion: 2.6, refund: 10, roi: 2.6, activeRate: 62, service: 88, privateShare: 8, topSkuMax: 50 },
  '食品茶饮': { conversion: 3.8, refund: 4, roi: 3.4, activeRate: 72, service: 90, privateShare: 14, topSkuMax: 58 },
  '母婴营养': { conversion: 3.0, refund: 4.5, roi: 3.2, activeRate: 66, service: 94, privateShare: 12, topSkuMax: 52 },
  '产业带工厂': { conversion: 2.8, refund: 6, roi: 2.8, activeRate: 58, service: 86, privateShare: 8, topSkuMax: 62 }
};

const samples = [
  {
    storeName: '某美妆旗舰店',
    industry: '美妆个护',
    platform: '天猫',
    reportType: '月报',
    period: '2026-04-15 至 2026-05-14',
    compareType: '上一个周期',
    dataSource: '示例数据',
    sales: 285670,
    prevSales: 312456,
    visitors: 186543,
    prevVisitors: 210234,
    conversion: 2.35,
    aov: 156.8,
    refundRate: 4.21,
    roi: 2.85,
    productCount: 86,
    activeProductCount: 54,
    topSkuShare: 41.8,
    serviceRate: 86.5,
    searchShare: 34,
    recommendShare: 18,
    contentShare: 21,
    paidShare: 19,
    privateShare: 8,
    notes: '近30天投放预算缩减，访客下滑明显；爆款 SKU 评价里多次提到色差和发货慢。'
  },
  {
    storeName: '某茶叶品牌店',
    industry: '食品茶饮',
    platform: '抖音',
    reportType: '月报',
    period: '2026-04-15 至 2026-05-14',
    compareType: '上一个周期',
    dataSource: '示例数据',
    sales: 418920,
    prevSales: 351400,
    visitors: 148300,
    prevVisitors: 126800,
    conversion: 3.12,
    aov: 238,
    refundRate: 2.18,
    roi: 3.7,
    productCount: 42,
    activeProductCount: 31,
    topSkuShare: 58.4,
    serviceRate: 92.2,
    searchShare: 19,
    recommendShare: 25,
    contentShare: 33,
    paidShare: 15,
    privateShare: 8,
    notes: '直播间成交提升，但商品分层不清晰，礼盒款和自饮款承接路径混在一起。'
  },
  {
    storeName: '某服饰集合店',
    industry: '服装鞋包',
    platform: '小红书',
    reportType: '月报',
    period: '2026-04-15 至 2026-05-14',
    compareType: '上一个周期',
    dataSource: '示例数据',
    sales: 168240,
    prevSales: 221600,
    visitors: 94600,
    prevVisitors: 121900,
    conversion: 1.42,
    aov: 189,
    refundRate: 12.4,
    roi: 1.62,
    productCount: 126,
    activeProductCount: 52,
    topSkuShare: 67.2,
    serviceRate: 73.6,
    searchShare: 22,
    recommendShare: 18,
    contentShare: 37,
    paidShare: 18,
    privateShare: 5,
    notes: '内容互动还可以，但进店转化弱；尺码、面料和适穿人群表达不足，退货集中在两个新款。'
  }
];

let selectedPlatform = '天猫';
let history = loadJson(storageKey, []);
let latestDiagnosis = null;
let importedDetails = null;

const $ = (selector) => document.querySelector(selector);

function readNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function yuan(value) {
  return '¥ ' + Math.round(readNumber(value)).toLocaleString('zh-CN');
}

function percent(value, digits = 2) {
  return readNumber(value).toFixed(digits) + '%';
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveHistory() {
  localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 200)));
}

function getBenchmark(industry) {
  return benchmarks[industry] || benchmarks.default;
}

function getFormData() {
  const data = {};
  fieldIds.forEach((id) => {
    data[id] = $('#' + id).value;
  });
  data.platform = selectedPlatform;
  [
    'sales', 'prevSales', 'visitors', 'prevVisitors', 'conversion', 'aov', 'refundRate', 'roi',
    'productCount', 'activeProductCount', 'topSkuShare', 'serviceRate',
    'searchShare', 'recommendShare', 'contentShare', 'paidShare', 'privateShare'
  ].forEach((id) => {
    data[id] = readNumber(data[id]);
  });
  data.activeProductRate = data.productCount ? clamp((data.activeProductCount / data.productCount) * 100) : 0;
  data.orderCount = data.aov ? Math.round(data.sales / data.aov) : 0;
  data.channelTotal = data.searchShare + data.recommendShare + data.contentShare + data.paidShare + data.privateShare;
  data.importedDetails = importedDetails;
  return data;
}

function getReportName(diagnosis) {
  const type = diagnosis?.data?.reportType || '诊断';
  return `店铺经营${type}`;
}

function setFormData(data) {
  importedDetails = data.importedDetails || null;
  fieldIds.forEach((id) => {
    if (data[id] !== undefined && $('#' + id)) $('#' + id).value = data[id];
  });
  selectedPlatform = data.platform || '天猫';
  document.querySelectorAll('#platformTabs button').forEach((button) => {
    button.classList.toggle('selected', button.dataset.platform === selectedPlatform);
  });
}

function trend(current, previous, inverse = false) {
  if (!previous) return { value: 0, label: '无对比', className: 'delta-flat' };
  const value = ((current - previous) / previous) * 100;
  const good = inverse ? value <= 0 : value >= 0;
  return {
    value,
    label: (value >= 0 ? '+' : '') + value.toFixed(2) + '%',
    className: Math.abs(value) < 0.01 ? 'delta-flat' : good ? 'delta-up' : 'delta-down'
  };
}

function scoreClass(score) {
  if (score >= 78) return 'good';
  if (score >= 60) return 'warn';
  return 'risk';
}

function scoreColor(score) {
  if (score >= 78) return 'var(--green)';
  if (score >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function levelFromPriority(priority) {
  if (priority >= 82) return 'high';
  if (priority >= 58) return 'medium';
  return 'low';
}

function rankFromLevel(level) {
  return level === 'high' ? '高' : level === 'medium' ? '中' : '低';
}

function issue(issues, item) {
  const priority = Math.round(clamp(item.priority));
  const level = item.level || levelFromPriority(priority);
  issues.push({
    level,
    rank: rankFromLevel(level),
    priority,
    title: item.title,
    evidence: item.evidence,
    diagnosis: item.diagnosis,
    impactText: item.impactText,
    action: item.action,
    validation: item.validation,
    owner: item.owner || '运营',
    lever: item.lever || '经营'
  });
}

function gapDecomposition(data) {
  const prevVisitors = data.prevVisitors || data.visitors;
  const prevConversion = prevVisitors && data.prevSales && data.aov ? (data.prevSales / data.aov / prevVisitors) * 100 : data.conversion;
  const prevAov = data.prevSales && prevVisitors && prevConversion ? data.prevSales / (prevVisitors * prevConversion / 100) : data.aov;
  const trafficOnlySales = data.visitors * (prevConversion / 100) * prevAov;
  const conversionOnlySales = data.visitors * (data.conversion / 100) * prevAov;
  const salesGap = data.sales - data.prevSales;
  return {
    salesGap,
    trafficImpact: trafficOnlySales - data.prevSales,
    conversionImpact: conversionOnlySales - trafficOnlySales,
    aovImpact: data.sales - conversionOnlySales,
    prevConversion,
    prevAov
  };
}

function analyze(data) {
  const bench = getBenchmark(data.industry);
  const salesTrend = trend(data.sales, data.prevSales);
  const visitorTrend = trend(data.visitors, data.prevVisitors);
  const decomposition = gapDecomposition(data);
  const channelBalance = Math.abs(100 - data.channelTotal) <= 5 ? 100 : clamp(100 - Math.abs(100 - data.channelTotal) * 3);
  const contentBase = data.contentShare + data.recommendShare;
  const paidPressure = data.paidShare >= 28;
  const opportunity = {
    conversion: Math.max(0, data.visitors * ((bench.conversion - data.conversion) / 100) * data.aov),
    refund: Math.max(0, data.sales * ((data.refundRate - bench.refund) / 100)),
    active: Math.max(0, data.sales * ((bench.activeRate - data.activeProductRate) / 100) * 0.35),
    service: Math.max(0, data.sales * ((bench.service - data.serviceRate) / 100) * 0.18),
    private: Math.max(0, data.sales * ((bench.privateShare - data.privateShare) / 100) * 0.22)
  };

  const metricScores = [
    { key: 'sales', name: '销售增长', value: yuan(data.sales), detail: salesTrend.label, score: clamp(70 + salesTrend.value * 1.35) },
    { key: 'traffic', name: '流量质量', value: Math.round(data.visitors).toLocaleString('zh-CN'), detail: visitorTrend.label, score: clamp(70 + visitorTrend.value * 1.2) },
    { key: 'conversion', name: '转化效率', value: percent(data.conversion), detail: `行业参考 ${bench.conversion}%`, score: clamp((data.conversion / bench.conversion) * 100) },
    { key: 'profit', name: '利润风险', value: '退款 ' + percent(data.refundRate), detail: `ROI ${data.roi.toFixed(2)}`, score: clamp((100 - Math.max(0, data.refundRate - bench.refund) * 9) * 0.58 + clamp((data.roi / bench.roi) * 100) * 0.42) },
    { key: 'product', name: '货品动销', value: percent(data.activeProductRate), detail: `TOP SKU ${percent(data.topSkuShare, 1)}`, score: clamp((data.activeProductRate / bench.activeRate) * 74 + (100 - Math.max(0, data.topSkuShare - bench.topSkuMax) * 2) * 0.26) },
    { key: 'channel', name: '渠道结构', value: data.channelTotal.toFixed(1) + '%', detail: contentBase >= 35 ? '内容基础较好' : '内容基础偏弱', score: clamp(channelBalance * 0.52 + (paidPressure ? 48 : 78) * 0.2 + clamp(contentBase * 1.45) * 0.28) },
    { key: 'service', name: '客服承接', value: percent(data.serviceRate, 1), detail: `参考 ${bench.service}%`, score: clamp((data.serviceRate / bench.service) * 100) }
  ].map((item) => ({ ...item, score: Math.round(item.score) }));

  const issues = [];
  if (decomposition.salesGap < 0) {
    const biggest = [
      ['流量', decomposition.trafficImpact],
      ['转化', decomposition.conversionImpact],
      ['客单', decomposition.aovImpact]
    ].sort((a, b) => a[1] - b[1])[0];
    issue(issues, {
      title: 'GMV 下滑需要先做杠杆拆解，不应直接归因到流量',
      evidence: `本期销售较对比周期少 ${yuan(Math.abs(decomposition.salesGap))}；测算中${biggest[0]}项对缺口贡献最大。`,
      diagnosis: '平台后台通常只提示销售下降，但顾问诊断要先拆 GMV = 访客 × 转化率 × 客单价，避免把预算投到错误环节。',
      impactText: `短期缺口 ${yuan(Math.abs(decomposition.salesGap))}`,
      action: '先按渠道和 SKU 拆访客、转化率、客单价，再决定是补流量、改页面还是调商品结构。',
      validation: '导出近30天渠道/SKU明细，计算每个渠道的访客变化、成交变化和客单变化。',
      priority: 92,
      owner: '运营',
      lever: 'GMV'
    });
  }
  if (visitorTrend.value < -8 && decomposition.trafficImpact < -data.sales * 0.04) {
    issue(issues, {
      title: '流量入口衰退，需要判断是自然流量掉线还是付费缩量',
      evidence: `访客环比 ${visitorTrend.label}，按上期转化和客单测算，流量因素约影响 ${yuan(Math.abs(decomposition.trafficImpact))}。`,
      diagnosis: '如果自然搜索和推荐同时下降，说明商品权重或内容效率在掉；如果只因付费缩量，不能简单用加预算解决。',
      impactText: `流量缺口约 ${yuan(Math.abs(decomposition.trafficImpact))}`,
      action: '分搜索、推荐、活动、内容、付费五类入口做流量差异表，先找最大下滑入口。',
      validation: '看搜索词排名、推荐曝光、内容点击率、活动入口和付费消耗是否同步变化。',
      priority: 88,
      owner: '运营/投放',
      lever: '流量'
    });
  }
  if (data.conversion < bench.conversion) {
    const gap = bench.conversion - data.conversion;
    issue(issues, {
      title: '转化率低于行业参考线，页面和客服承接是优先修复项',
      evidence: `当前转化率 ${percent(data.conversion)}，低于${data.industry}参考线 ${bench.conversion}%；按当前流量和客单，转化提升到参考线约增加 ${yuan(opportunity.conversion)}。`,
      diagnosis: '这类问题不是“多做内容”能解决，核心是进店后的购买理由不足：首图、价格解释、评价证据、详情页前三屏和客服异议处理需要连起来看。',
      impactText: `转化机会约 ${yuan(opportunity.conversion)}`,
      action: '围绕核心 SKU 重做主图前3张、详情页前三屏、评价精选和客服异议话术，先跑一版 7 天对照。',
      validation: '对比核心 SKU 的点击-加购-咨询-成交链路，查看流失最大节点。',
      priority: clamp(74 + gap * 10 + opportunity.conversion / Math.max(data.sales, 1) * 20),
      owner: '内容/客服',
      lever: '转化'
    });
  }
  if (data.refundRate > bench.refund) {
    issue(issues, {
      title: '退款率高于健康线，正在吞噬真实增长',
      evidence: `当前退款率 ${percent(data.refundRate)}，高于参考线 ${bench.refund}%；按销售额估算，超额退款风险约 ${yuan(opportunity.refund)}。`,
      diagnosis: '退款不是售后单点问题，往往来自页面承诺、尺码/功效解释、物流体验和客服预期管理。继续放大流量会把损耗一起放大。',
      impactText: `利润风险约 ${yuan(opportunity.refund)}`,
      action: '建立退款原因矩阵：SKU × 原因 × 页面表达 × 客服话术 × 供应链问题，先处理 TOP3 原因。',
      validation: '拉取近30天退款原因和评价负反馈，按 SKU 聚合，看是否集中在爆款或新款。',
      priority: clamp(68 + (data.refundRate - bench.refund) * 6 + opportunity.refund / Math.max(data.sales, 1) * 24),
      owner: '售后/商品',
      lever: '利润'
    });
  }
  if (data.roi > 0 && data.roi < bench.roi) {
    issue(issues, {
      title: '投放 ROI 低于参考线，预算可能在放大低效承接',
      evidence: `当前 ROI ${data.roi.toFixed(2)}，低于参考线 ${bench.roi.toFixed(2)}；付费占比 ${percent(data.paidShare, 1)}。`,
      diagnosis: 'ROI 低不一定是投手问题，要同时检查人群、素材、关键词、落地 SKU 和页面转化。若转化也低，优先修承接再放预算。',
      impactText: '影响投放放量确定性',
      action: '把计划按 ROI、点击率、转化率、成交 SKU 分层，暂停低效消耗，保留能成交的人群和词包。',
      validation: '输出计划级报表：消耗、点击率、加购率、转化率、成交金额、退款率。',
      priority: clamp(62 + (bench.roi - data.roi) * 13 + (paidPressure ? 10 : 0)),
      owner: '投放',
      lever: '投放'
    });
  }
  if (data.activeProductRate < bench.activeRate) {
    issue(issues, {
      title: '货品动销不足，SKU 多但有效供给不够',
      evidence: `当前动销率 ${percent(data.activeProductRate)}，参考线 ${bench.activeRate}%；有成交商品 ${data.activeProductCount}/${data.productCount}。`,
      diagnosis: '低动销会稀释店铺权重和运营注意力。不是所有商品都值得优化，先做商品分层，找出引流款、利润款、潜力款和清仓款。',
      impactText: `动销改善机会约 ${yuan(opportunity.active)}`,
      action: '按销售额、访客、转化、毛利、退款率给 SKU 打标签，确定未来两周只优化核心 10-20 个 SKU。',
      validation: '导出 SKU 明细，按访客高低和转化高低做四象限。',
      priority: clamp(55 + (bench.activeRate - data.activeProductRate) * 1.1 + opportunity.active / Math.max(data.sales, 1) * 20),
      owner: '商品',
      lever: '货品'
    });
  }
  if (data.topSkuShare > bench.topSkuMax) {
    issue(issues, {
      title: '销售过度依赖单一或少数 SKU，增长稳定性不足',
      evidence: `TOP SKU 销售占比 ${percent(data.topSkuShare, 1)}，高于参考上限 ${bench.topSkuMax}%。`,
      diagnosis: '爆款集中不是坏事，但如果第二梯队没有接力，活动、库存、差评或退款都会直接冲击整店 GMV。',
      impactText: '影响活动稳定性和库存安全',
      action: '围绕爆款建立关联款、组合款和利润款，把详情页、客服和内容入口导向第二梯队商品。',
      validation: '查看 TOP5 SKU 的库存、退款、评价、流量来源和关联购买数据。',
      priority: clamp(54 + (data.topSkuShare - bench.topSkuMax) * 1.4),
      owner: '商品/内容',
      lever: '货品'
    });
  }
  if (paidPressure && data.roi < bench.roi) {
    issue(issues, {
      title: '付费依赖偏高且效率不足，容易形成“花钱有单、停投下滑”',
      evidence: `付费渠道占比 ${percent(data.paidShare, 1)}，ROI ${data.roi.toFixed(2)}，内容+推荐占比 ${percent(contentBase, 1)}。`,
      diagnosis: '这说明店铺可能缺少自然搜索、内容种草和私域复购的自循环。只靠加预算会提高经营波动。',
      impactText: '影响获客成本和利润稳定性',
      action: '降低低效付费消耗，把预算转向能沉淀搜索词、内容素材和复购人群的商品。',
      validation: '比较付费访客与自然访客的转化率、客单价、退款率和复购率。',
      priority: 70,
      owner: '投放/内容',
      lever: '渠道'
    });
  }
  if (data.serviceRate < bench.service) {
    issue(issues, {
      title: '客服承接未达标，咨询流量可能没有被充分转化',
      evidence: `客服响应达标率 ${percent(data.serviceRate, 1)}，参考线 ${bench.service}%；按销售额估算，承接改善机会约 ${yuan(opportunity.service)}。`,
      diagnosis: '客服不是成本岗位，而是转化节点。响应慢、异议处理不统一、售后安抚不足，会同时影响成交和退款。',
      impactText: `承接机会约 ${yuan(opportunity.service)}`,
      action: '沉淀高频咨询、异议处理、退货挽留、尺码/功效解释话术，并设置每日抽检。',
      validation: '抽取咨询未成交样本，标注用户问题、客服回复、是否催单、是否流失。',
      priority: clamp(56 + (bench.service - data.serviceRate) * 1.4),
      owner: '客服',
      lever: '承接'
    });
  }
  if (data.privateShare < bench.privateShare) {
    issue(issues, {
      title: '私域和老客贡献偏弱，复购资产没有被经营起来',
      evidence: `私域占比 ${percent(data.privateShare, 1)}，参考线 ${bench.privateShare}%；按当前销售估算，复购提升机会约 ${yuan(opportunity.private)}。`,
      diagnosis: '中小商家不能只依赖平台新客。私域占比低，意味着老客复购、沉默激活和会员权益还没有形成经营机制。',
      impactText: `复购机会约 ${yuan(opportunity.private)}`,
      action: '先选择高复购商品设计 7/14/30 天触达 SOP，再扩展会员权益和沉默客户激活。',
      validation: '补充新客/老客成交占比、复购周期、会员人数和沉默客户数量。',
      priority: clamp(46 + (bench.privateShare - data.privateShare) * 2.5),
      owner: '私域',
      lever: '复购'
    });
  }
  if (Math.abs(100 - data.channelTotal) > 5) {
    issue(issues, {
      title: '渠道占比合计异常，诊断数据口径需要先校准',
      evidence: `当前渠道占比合计 ${percent(data.channelTotal, 1)}，与 100% 偏差超过 5 个点。`,
      diagnosis: '数据口径不准会让后续判断失真。顾问交付前必须先统一渠道归因口径。',
      impactText: '影响诊断可信度',
      action: '统一渠道分类口径，明确搜索、推荐、内容、付费、私域是否互斥。',
      validation: '重新导出平台后台渠道来源表，核对是否存在重复归因或漏填。',
      priority: 52,
      owner: '数据',
      lever: '数据'
    });
  }
  if (!issues.length) {
    issue(issues, {
      title: '核心经营指标暂无明显短板，建议进入二级增长诊断',
      evidence: '销售、转化、退款、动销、ROI 和客服承接均未触发高风险阈值。',
      diagnosis: '当前不应继续做基础经营诊断，而应进入商品卖点、内容效率、人群结构和复购路径诊断。',
      impactText: '下一阶段增长空间',
      action: '选 3 个核心 SKU 做卖点、页面、内容和复购路径诊断。',
      validation: '补充用户评价、竞品页面、内容素材和复购数据。',
      priority: 35,
      owner: '顾问',
      lever: '增长'
    });
  }

  issues.sort((a, b) => b.priority - a.priority);

  const totalScore = Math.round(metricScores.reduce((sum, item) => sum + item.score, 0) / metricScores.length);
  const summary = createSummary(totalScore, issues, salesTrend, visitorTrend, decomposition);
  const actions = createActions(issues, data);
  const now = new Date();

  return {
    id: String(now.getTime()),
    createdAt: now.toLocaleString('zh-CN', { hour12: false }),
    data,
    metrics: metricScores,
    issues,
    actions,
    weeklySections: buildWeeklySections(data, issues),
    salesTrend,
    visitorTrend,
    decomposition,
    totalScore,
    summary
  };
}

function createSummary(score, issues, salesTrend, visitorTrend, decomposition) {
  const highCount = issues.filter((item) => item.level === 'high').length;
  if (score >= 80 && highCount === 0) {
    return {
      title: '经营状态健康，适合进入二级增长诊断',
      text: '基础经营指标较稳定，下一步应从商品卖点、内容效率、人群结构和复购路径寻找增量。'
    };
  }
  if (score >= 65) {
    return {
      title: '存在明确优化空间，需要按经营杠杆排序',
      text: `销售变化 ${salesTrend.label}，访客变化 ${visitorTrend.label}。本次诊断优先处理 ${issues[0]?.lever || '经营'} 问题，预计比平均修修补补更快看到结果。`
    };
  }
  return {
    title: '经营压力明显，需要先止损再增长',
    text: `销售缺口约 ${yuan(Math.abs(Math.min(0, decomposition.salesGap)))}，存在多个高优先级问题。建议先完成数据归因和承接修复，再考虑放大投放。`
  };
}

function createActions(issues, data) {
  const topIssues = issues.slice(0, 3);
  return [
    {
      period: '7天',
      title: '诊断校准与止损',
      tasks: [
        topIssues[0]?.validation || '校准销售、流量、转化、退款和渠道数据口径。',
        topIssues[0]?.action || '围绕最大影响项建立问题清单。',
        '输出一张“问题-证据-影响金额-责任人”表，避免只凭感觉开会。'
      ]
    },
    {
      period: '14天',
      title: '核心链路修复',
      tasks: [
        topIssues[1]?.action || '修复主图、详情页、评价、客服和投放承接链路。',
        '选择 3-5 个核心 SKU 做前后对照，跟踪访客、加购、咨询、成交、退款。',
        data.refundRate > 5 ? '把退款 TOP3 原因写入页面提醒和客服话术。' : '建立客服高频问答和异议处理模板。'
      ]
    },
    {
      period: '30天',
      title: '复盘与增长机制',
      tasks: [
        topIssues[2]?.action || '建立每周经营复盘机制。',
        '固定周报指标：销售、访客、转化、客单、退款、ROI、动销、客服承接。',
        '把本次诊断沉淀为行业模板，下一步扩展到商品卖点和内容生产诊断。'
      ]
    }
  ];
}

function renderSummary(diagnosis) {
  const score = diagnosis.totalScore;
  $('#totalScore').textContent = score;
  $('#scoreRing').style.setProperty('--score-deg', `${score * 3.6}deg`);
  $('#scoreRing').style.setProperty('--score-color', scoreColor(score));
  $('#summaryTitle').textContent = diagnosis.summary.title;
  $('#summaryText').textContent = diagnosis.summary.text;
  $('#summaryKpis').innerHTML = [
    ['订单数', diagnosis.data.orderCount.toLocaleString('zh-CN')],
    ['销售变化', diagnosis.salesTrend.label],
    ['访客变化', diagnosis.visitorTrend.label],
    ['TOP问题', diagnosis.issues[0]?.lever || '经营']
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function renderHealth(diagnosis) {
  $('#healthGrid').innerHTML = diagnosis.metrics.map((item) => `
    <article class="health-card ${scoreClass(item.score)}">
      <span>${item.name}</span>
      <strong>${item.value}</strong>
      <em>${item.detail}</em>
      <div class="score-line">
        <b>${item.score}</b>
        <span class="score-track"><i style="--score:${item.score}%;--score-color:${scoreColor(item.score)}"></i></span>
      </div>
    </article>
  `).join('');
}

function renderIssues(diagnosis) {
  $('#issueCount').textContent = `共识别 ${diagnosis.issues.length} 个问题，已按影响度排序`;
  $('#issueList').innerHTML = diagnosis.issues.map((item, index) => `
    <article class="issue-item issue-item-rich">
      <span class="issue-rank ${item.level}">${item.rank}</span>
      <div class="issue-copy">
        <strong>${index + 1}. ${item.title}</strong>
        <span class="issue-meta">${item.lever} · 优先级 ${item.priority} · ${item.owner}</span>
        <p><b>证据</b>${item.evidence}</p>
        <p><b>判断</b>${item.diagnosis}</p>
        <p><b>动作</b>${item.action}</p>
      </div>
      <small>${item.impactText}</small>
    </article>
  `).join('');
}

function renderActions(diagnosis) {
  $('#actionList').innerHTML = diagnosis.actions.map((group) => `
    <article class="action-card">
      <span>${group.period}</span>
      <strong>${group.title}</strong>
      <ul>${group.tasks.map((task) => `<li>${task}</li>`).join('')}</ul>
    </article>
  `).join('');
}

function renderReport(diagnosis) {
  const { data } = diagnosis;
  const reportName = getReportName(diagnosis);
  const weekly = diagnosis.weeklySections;
  $('#reportTime').textContent = '最近生成：' + diagnosis.createdAt;
  $('#reportPaper').innerHTML = `
    <div class="report-brand">Pinmoo AI 电商增长智能体</div>
    <h3>${reportName}</h3>
    <div class="report-meta">${data.storeName} · ${data.platform} · ${data.industry} · ${data.period} · ${data.dataSource || '数据导入'}</div>
    <div class="conclusion-box">
      <strong>核心结论：${diagnosis.summary.title}，综合健康度 ${diagnosis.totalScore} 分</strong>
      <p>${diagnosis.summary.text}</p>
    </div>

    <h4>一、店铺整体情况</h4>
    <ul>${operatingSummary(diagnosis).map((item) => `<li>${item}</li>`).join('')}</ul>
    <table class="report-table">
      <thead><tr><th>模块</th><th>状态</th><th>诊断说明</th></tr></thead>
      <tbody>
        ${moduleDiagnosis(diagnosis).map((item) => `<tr><td>${item.module}</td><td>${item.status}</td><td>${item.detail}</td></tr>`).join('')}
      </tbody>
    </table>

    <h4>二、宝贝排行</h4>
    <table class="report-table">
      <thead><tr><th>宝贝/商品</th><th>销售额</th><th>访客</th><th>订单</th><th>转化率</th><th>判断</th></tr></thead>
      <tbody>
        ${tableRows(weekly.products, [
          { render: (item) => escapeHtml(item.name || '-') },
          { render: (item) => yuan(item.sales || 0) },
          { render: (item) => Math.round(item.visitors || 0).toLocaleString('zh-CN') },
          { render: (item) => Math.round(item.orders || 0).toLocaleString('zh-CN') },
          { render: (item) => percent(item.conversion || 0) },
          { render: (item) => escapeHtml(item.note || '-') }
        ])}
      </tbody>
    </table>

    <h4>三、流量排行</h4>
    <table class="report-table">
      <thead><tr><th>流量来源</th><th>销售额</th><th>访客</th><th>转化率</th><th>判断</th></tr></thead>
      <tbody>
        ${tableRows(weekly.traffic, [
          { render: (item) => escapeHtml(item.name || '-') },
          { render: (item) => yuan(item.sales || 0) },
          { render: (item) => Math.round(item.visitors || 0).toLocaleString('zh-CN') },
          { render: (item) => percent(item.conversion || 0) },
          { render: (item) => escapeHtml(item.note || '-') }
        ])}
      </tbody>
    </table>

    <h4>四、推广情况</h4>
    <table class="report-table">
      <thead><tr><th>推广计划/渠道</th><th>花费</th><th>成交金额</th><th>ROI</th><th>点击</th><th>判断</th></tr></thead>
      <tbody>
        ${tableRows(weekly.promotion, [
          { render: (item) => escapeHtml(item.name || '-') },
          { render: (item) => yuan(item.spend || 0) },
          { render: (item) => yuan(item.sales || 0) },
          { render: (item) => item.roi ? Number(item.roi).toFixed(2) : '-' },
          { render: (item) => item.clicks ? Math.round(item.clicks).toLocaleString('zh-CN') : '-' },
          { render: (item) => escapeHtml(item.note || '-') }
        ])}
      </tbody>
    </table>

    <h4>五、活动情况</h4>
    <table class="report-table">
      <thead><tr><th>活动/动作</th><th>成交金额</th><th>访客</th><th>订单</th><th>判断/下步</th></tr></thead>
      <tbody>
        ${tableRows(weekly.activity, [
          { render: (item) => escapeHtml(item.name || '-') },
          { render: (item) => item.sales ? yuan(item.sales) : '-' },
          { render: (item) => item.visitors ? Math.round(item.visitors).toLocaleString('zh-CN') : '-' },
          { render: (item) => item.orders ? Math.round(item.orders).toLocaleString('zh-CN') : '-' },
          { render: (item) => escapeHtml(item.note || '-') }
        ])}
      </tbody>
    </table>

    <h4>六、经营杠杆拆解</h4>
    <table class="report-table">
      <thead><tr><th>项目</th><th>测算结果</th><th>顾问判断</th></tr></thead>
      <tbody>
        <tr><td>销售缺口</td><td>${yuan(diagnosis.decomposition.salesGap)}</td><td>${diagnosis.decomposition.salesGap < 0 ? '需要先定位拖累项' : '销售较对比周期增长'}</td></tr>
        <tr><td>流量影响</td><td>${yuan(diagnosis.decomposition.trafficImpact)}</td><td>按上期转化率和客单价测算</td></tr>
        <tr><td>转化影响</td><td>${yuan(diagnosis.decomposition.conversionImpact)}</td><td>按本期访客和上期客单价测算</td></tr>
        <tr><td>客单影响</td><td>${yuan(diagnosis.decomposition.aovImpact)}</td><td>用于判断商品结构和价格带变化</td></tr>
      </tbody>
    </table>

    <h4>七、经营数据评分</h4>
    <table class="report-table">
      <thead><tr><th>指标</th><th>表现</th><th>判断</th><th>评分</th></tr></thead>
      <tbody>
        ${diagnosis.metrics.map((item) => `<tr><td>${item.name}</td><td>${item.value}</td><td>${item.detail}</td><td>${item.score}</td></tr>`).join('')}
      </tbody>
    </table>

    <h4>八、关键问题与优先级</h4>
    <ol class="report-issue-list">
      ${diagnosis.issues.map((item) => `
        <li>
          <strong>[${item.rank}] ${item.title}</strong>
          <p>证据：${item.evidence}</p>
          <p>顾问判断：${item.diagnosis}</p>
          <p>下一步：${item.action}</p>
        </li>
      `).join('')}
    </ol>

    <h4>九、下周期执行计划</h4>
    <div class="report-actions-list">
      ${diagnosis.actions.map((group) => `
        <section>
          <strong>${group.period}：${group.title}</strong>
          <ul>${group.tasks.map((task) => `<li>${task}</li>`).join('')}</ul>
        </section>
      `).join('')}
    </div>

    <h4>十、需要品牌方/运营进一步确认的问题</h4>
    <ol>${confirmationQuestions(diagnosis).map((item) => `<li>${item.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>

    <h4>十一、需要补充的数据</h4>
    <ul>${missingDataTips(data).map((tip) => `<li>${tip}</li>`).join('')}</ul>

    <h4>十二、顾问备注</h4>
    <p>${escapeHtml(data.notes || '暂无补充说明。')}</p>
  `;
}

function missingDataTips(data) {
  const tips = ['分 SKU 销售、访客、转化、退款原因表', '主要渠道入口明细，包括搜索、推荐、内容、活动、付费、私域', 'TOP 商品主图、详情页、评价和客服高频问答'];
  if (data.roi <= 0) tips.push('投放消耗、成交金额、ROI 和计划维度表现');
  if (data.refundRate > 5) tips.push('售后退款明细，至少按 SKU 和退款原因归类');
  if (data.privateShare < 8) tips.push('会员、老客、沉默客户和复购周期数据');
  return tips;
}

function operatingSummary(diagnosis) {
  const { data } = diagnosis;
  const salesWord = diagnosis.salesTrend.value >= 0 ? '增长' : '下滑';
  const trafficWord = diagnosis.visitorTrend.value >= 0 ? '增长' : '下滑';
  return [
    `本期${data.reportType || '报告'}销售额 ${yuan(data.sales)}，较对比周期${salesWord} ${diagnosis.salesTrend.label}。`,
    `访客数 ${Math.round(data.visitors).toLocaleString('zh-CN')}，较对比周期${trafficWord} ${diagnosis.visitorTrend.label}；转化率 ${percent(data.conversion)}，客单价 ${yuan(data.aov)}。`,
    `退款率 ${percent(data.refundRate)}，投放 ROI ${data.roi.toFixed(2)}，商品动销率 ${percent(data.activeProductRate)}。`,
    `本期最需要优先处理的问题是：${diagnosis.issues[0]?.title || '暂无明显短板'}。`
  ];
}

function moduleDiagnosis(diagnosis) {
  const { data } = diagnosis;
  return [
    {
      module: '店铺经营',
      status: diagnosis.totalScore >= 78 ? '稳定' : diagnosis.totalScore >= 60 ? '可优化' : '承压',
      detail: diagnosis.summary.text
    },
    {
      module: '流量渠道',
      status: data.paidShare >= 28 && data.roi < 3 ? '需控费' : data.contentShare + data.recommendShare >= 35 ? '内容基础较好' : '需补内容',
      detail: `搜索 ${percent(data.searchShare, 1)}、推荐 ${percent(data.recommendShare, 1)}、内容 ${percent(data.contentShare, 1)}、付费 ${percent(data.paidShare, 1)}、私域 ${percent(data.privateShare, 1)}。`
    },
    {
      module: '商品结构',
      status: data.activeProductRate >= 68 ? '动销良好' : '动销不足',
      detail: `有成交商品 ${data.activeProductCount}/${data.productCount}，TOP SKU 销售占比 ${percent(data.topSkuShare, 1)}。`
    },
    {
      module: '客服/售后',
      status: data.refundRate > getBenchmark(data.industry).refund ? '退款风险' : data.serviceRate < getBenchmark(data.industry).service ? '承接待加强' : '基本稳定',
      detail: `客服响应达标率 ${percent(data.serviceRate, 1)}，退款率 ${percent(data.refundRate)}。`
    }
  ];
}

function confirmationQuestions(diagnosis) {
  const questions = diagnosis.issues.slice(0, 3).map((item, index) => `${index + 1}. ${item.validation}`);
  if (questions.length < 3) {
    questions.push('补充核心 SKU 的主图、详情页、评价、客服咨询和退款原因，用于做商品级归因。');
  }
  return questions.slice(0, 3);
}

function fallbackProductRanking(data) {
  const mainShare = data.topSkuShare || 0;
  const otherShare = Math.max(0, 100 - mainShare);
  return [
    { name: 'TOP 主推宝贝', sales: data.sales * mainShare / 100, visitors: data.visitors * 0.32, orders: data.orderCount * mainShare / 100, conversion: data.conversion * 1.12, note: mainShare > 60 ? '依赖偏高，需关注库存/退款/评价' : '主推贡献稳定' },
    { name: '第二梯队宝贝', sales: data.sales * otherShare * 0.55 / 100, visitors: data.visitors * 0.28, orders: data.orderCount * otherShare * 0.55 / 100, conversion: data.conversion * 0.92, note: '建议筛选可放量款' },
    { name: '长尾宝贝', sales: data.sales * otherShare * 0.45 / 100, visitors: data.visitors * 0.4, orders: data.orderCount * otherShare * 0.45 / 100, conversion: data.conversion * 0.72, note: data.activeProductRate < 65 ? '动销偏弱，需做货品分层' : '可继续观察' }
  ];
}

function fallbackTrafficRanking(data) {
  return [
    { name: '搜索流量', visitors: data.visitors * data.searchShare / 100, sales: data.sales * data.searchShare / 100, conversion: data.conversion, note: '关注搜索词与商品承接' },
    { name: '推荐流量', visitors: data.visitors * data.recommendShare / 100, sales: data.sales * data.recommendShare / 100, conversion: data.conversion * 0.86, note: '关注点击后转化' },
    { name: '内容流量', visitors: data.visitors * data.contentShare / 100, sales: data.sales * data.contentShare / 100, conversion: data.conversion * 0.78, note: '关注种草到成交链路' },
    { name: '付费流量', visitors: data.visitors * data.paidShare / 100, sales: data.sales * data.paidShare / 100, conversion: data.conversion * 0.94, note: data.roi < 3 ? 'ROI需优化' : '可保留观察' },
    { name: '私域/老客', visitors: data.visitors * data.privateShare / 100, sales: data.sales * data.privateShare / 100, conversion: data.conversion * 1.4, note: data.privateShare < 10 ? '贡献偏弱' : '承接较好' }
  ].filter((item) => item.visitors || item.sales).sort((a, b) => b.sales - a.sales);
}

function fallbackPromotionRanking(data) {
  return [
    { name: '付费推广整体', spend: data.roi ? data.sales * data.paidShare / 100 / data.roi : 0, sales: data.sales * data.paidShare / 100, roi: data.roi, clicks: 0, note: data.roi < 3 ? '需拆计划控费' : '效率可观察' },
    { name: '内容/短视频承接', spend: 0, sales: data.sales * data.contentShare / 100, roi: 0, clicks: 0, note: '需看内容播放、点击、成交明细' }
  ];
}

function fallbackActivityRanking(data) {
  return [
    { name: '平台活动/店铺活动', sales: 0, visitors: 0, orders: 0, note: '导入活动名称和活动成交后可自动排行' },
    { name: '下周期活动准备', sales: 0, visitors: 0, orders: 0, note: '建议记录报名活动、优惠券、满减、直播/内容节奏' }
  ];
}

function buildWeeklySections(data, issues) {
  const details = data.importedDetails || {};
  return {
    products: details.products?.length ? details.products : fallbackProductRanking(data),
    traffic: details.traffic?.length ? details.traffic : fallbackTrafficRanking(data),
    promotion: details.promotion?.length ? details.promotion : fallbackPromotionRanking(data),
    activity: details.activity?.length ? details.activity : fallbackActivityRanking(data),
    nextFocus: issues.slice(0, 3).map((item) => item.action)
  };
}

function tableRows(items, columns, emptyText = '暂无明细数据') {
  if (!items || !items.length) return `<tr><td colspan="${columns.length}">${emptyText}</td></tr>`;
  return items.map((item) => `<tr>${columns.map((column) => `<td>${column.render(item)}</td>`).join('')}</tr>`).join('');
}

function renderHistory() {
  const keyword = $('#historySearch').value.trim().toLowerCase();
  const rows = history.filter((item) => {
    const text = `${item.data.storeName} ${item.data.platform} ${item.data.industry} ${item.summary?.title || ''} ${item.summary?.text || ''}`.toLowerCase();
    return !keyword || text.includes(keyword);
  });

  $('#historyBody').innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td class="store-cell"><strong>${item.data.storeName}</strong><span>${item.data.industry}</span></td>
      <td>${item.data.platform}</td>
      <td>${yuan(item.data.sales)}</td>
      <td><span class="score-pill ${scoreClass(item.totalScore)}">${item.totalScore}</span></td>
      <td>${item.issues.length}</td>
      <td>${item.createdAt}</td>
      <td class="row-actions">
        <button type="button" data-load="${item.id}">查看</button>
        <button type="button" data-delete="${item.id}">删除</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7">暂无诊断历史。生成第一份报告后会自动保存在这里。</td></tr>';

  $('#quotaUsed').textContent = history.length;
  $('#quotaBar').style.width = Math.min(100, history.length / 2) + '%';
}

function setLatest(diagnosis, persist = false) {
  latestDiagnosis = diagnosis;
  renderSummary(diagnosis);
  renderHealth(diagnosis);
  renderIssues(diagnosis);
  renderActions(diagnosis);
  renderReport(diagnosis);
  if (persist) {
    history = [diagnosis, ...history.filter((item) => item.id !== diagnosis.id)].slice(0, 200);
    saveHistory();
  }
  renderHistory();
}

function reportText(diagnosis) {
  if (!diagnosis) return '';
  const reportName = getReportName(diagnosis);
  const weekly = diagnosis.weeklySections || {};
  return [
    `Pinmoo AI ${reportName}`,
    `${diagnosis.data.storeName} · ${diagnosis.data.platform} · ${diagnosis.data.industry} · ${diagnosis.data.period} · ${diagnosis.data.dataSource || '数据导入'}`,
    `综合健康度：${diagnosis.totalScore} 分`,
    `核心结论：${diagnosis.summary.title}`,
    diagnosis.summary.text,
    '',
    '一、店铺整体情况',
    ...operatingSummary(diagnosis).map((item) => `- ${item}`),
    '',
    ...moduleDiagnosis(diagnosis).map((item) => `- ${item.module}｜${item.status}：${item.detail}`),
    '',
    '二、宝贝排行',
    ...(weekly.products || []).map((item, index) => `${index + 1}. ${item.name || '-'}：销售额 ${yuan(item.sales || 0)}，访客 ${Math.round(item.visitors || 0)}，订单 ${Math.round(item.orders || 0)}，转化率 ${percent(item.conversion || 0)}，${item.note || ''}`),
    '',
    '三、流量排行',
    ...(weekly.traffic || []).map((item, index) => `${index + 1}. ${item.name || '-'}：销售额 ${yuan(item.sales || 0)}，访客 ${Math.round(item.visitors || 0)}，转化率 ${percent(item.conversion || 0)}，${item.note || ''}`),
    '',
    '四、推广情况',
    ...(weekly.promotion || []).map((item, index) => `${index + 1}. ${item.name || '-'}：花费 ${yuan(item.spend || 0)}，成交 ${yuan(item.sales || 0)}，ROI ${item.roi ? Number(item.roi).toFixed(2) : '-'}，点击 ${item.clicks ? Math.round(item.clicks) : '-'}，${item.note || ''}`),
    '',
    '五、活动情况',
    ...(weekly.activity || []).map((item, index) => `${index + 1}. ${item.name || '-'}：成交 ${item.sales ? yuan(item.sales) : '-'}，访客 ${item.visitors ? Math.round(item.visitors) : '-'}，订单 ${item.orders ? Math.round(item.orders) : '-'}，${item.note || ''}`),
    '',
    '六、经营杠杆拆解',
    `- 销售缺口：${yuan(diagnosis.decomposition.salesGap)}`,
    `- 流量影响：${yuan(diagnosis.decomposition.trafficImpact)}`,
    `- 转化影响：${yuan(diagnosis.decomposition.conversionImpact)}`,
    `- 客单影响：${yuan(diagnosis.decomposition.aovImpact)}`,
    '',
    '七、经营数据评分',
    ...diagnosis.metrics.map((item) => `- ${item.name}：${item.value}；${item.detail}；评分 ${item.score}`),
    '',
    '八、关键问题与优先级',
    ...diagnosis.issues.map((item, index) => [
      `${index + 1}. [${item.rank}] ${item.title}（优先级 ${item.priority}，责任建议：${item.owner}）`,
      `   证据：${item.evidence}`,
      `   顾问判断：${item.diagnosis}`,
      `   影响：${item.impactText}`,
      `   下一步：${item.action}`,
      `   验证：${item.validation}`
    ].join('\n')),
    '',
    '九、下周期执行计划',
    ...diagnosis.actions.flatMap((group) => [`${group.period}：${group.title}`, ...group.tasks.map((task) => `- ${task}`)]),
    '',
    '十、需要品牌方/运营进一步确认的问题',
    ...confirmationQuestions(diagnosis).map((item) => `- ${item.replace(/^\d+\.\s*/, '')}`),
    '',
    '十一、需要补充的数据',
    ...missingDataTips(diagnosis.data).map((tip) => `- ${tip}`),
    '',
    `顾问备注：${diagnosis.data.notes || '暂无'}`
  ].join('\n');
}

function exportReport() {
  if (!latestDiagnosis) return toast('请先生成诊断报告');
  downloadText(reportText(latestDiagnosis), `${latestDiagnosis.data.storeName}-${getReportName(latestDiagnosis)}.txt`);
  toast('报告文本已导出');
}

function exportHistory() {
  downloadText(JSON.stringify(history, null, 2), `pinmoo-diagnosis-history-${new Date().toISOString().slice(0, 10)}.json`);
  toast('历史记录已导出');
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyReport() {
  if (!latestDiagnosis) return toast('请先生成诊断报告');
  const text = reportText(latestDiagnosis);
  try {
    await navigator.clipboard.writeText(text);
    toast('报告内容已复制');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    toast('报告内容已复制');
  }
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] === undefined ? '' : values[index].trim();
    });
    return item;
  });
}

function normalizeKey(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[()（）%％]/g, '').toLowerCase();
}

function pick(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const target = normalizeKey(alias);
    const key = keys.find((item) => normalizeKey(item) === target);
    if (key !== undefined && row[key] !== '') return row[key];
  }
  return '';
}

function parseMetric(value) {
  if (value === null || value === undefined || value === '') return 0;
  const text = String(value).replace(/,/g, '').replace(/%/g, '').replace(/￥/g, '').replace(/¥/g, '').trim();
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toImportedRow(row) {
  const sales = parseMetric(pick(row, ['销售额', 'GMV', '成交金额', '支付金额', 'sales']));
  const visitors = parseMetric(pick(row, ['访客数', '访客', 'UV', 'visitors']));
  const aov = parseMetric(pick(row, ['客单价', 'aov']));
  const conversion = parseMetric(pick(row, ['转化率', '支付转化率', 'conversion']));
  const orders = parseMetric(pick(row, ['订单数', '支付订单数', '成交订单数', 'orders'])) ||
    (aov ? sales / aov : visitors * conversion / 100);
  const periodTag = pick(row, ['周期', '期间', '本期上期', '对比周期', 'period', 'compare']);
  const periodText = String(periodTag || '').toLowerCase();
  const bucket = periodText.includes('上期') || periodText.includes('previous') || periodText.includes('prev') ? 'previous' : 'current';
  return {
    bucket,
    date: pick(row, ['日期', '时间', 'date']),
    storeName: pick(row, ['店铺名称', '店铺', 'storeName', 'store']),
    industry: pick(row, ['行业', '所属行业', 'industry']),
    platform: pick(row, ['平台', '店铺平台', 'platform']),
    itemName: pick(row, ['宝贝名称', '商品名称', '宝贝', '商品', 'SKU', 'sku', 'itemName', 'productName']),
    trafficSource: pick(row, ['流量来源', '渠道来源', '渠道', '来源', 'trafficSource']),
    promotionName: pick(row, ['推广计划', '计划名称', '推广渠道', '推广名称', '推广单元', 'promotionName', 'campaign']),
    activityName: pick(row, ['活动名称', '平台活动', '活动', 'activityName']),
    sales,
    visitors,
    orders,
    spend: parseMetric(pick(row, ['花费', '消耗', '推广花费', 'spend', 'cost'])),
    clicks: parseMetric(pick(row, ['点击量', '点击', 'clicks'])),
    impressions: parseMetric(pick(row, ['展现量', '曝光量', 'impressions'])),
    addCarts: parseMetric(pick(row, ['加购数', '加购', '购物车数', 'addCarts'])),
    conversion,
    aov,
    refundRate: parseMetric(pick(row, ['退款率', '退货率', 'refundRate'])),
    roi: parseMetric(pick(row, ['ROI', '投放ROI', '投产比', 'roi'])),
    productCount: parseMetric(pick(row, ['商品总数', '商品数', 'productCount'])),
    activeProductCount: parseMetric(pick(row, ['有成交商品数', '动销商品数', 'activeProductCount'])),
    topSkuShare: parseMetric(pick(row, ['TOPSKU销售占比', 'TOP SKU销售占比', '爆款占比', 'topSkuShare'])),
    serviceRate: parseMetric(pick(row, ['客服响应达标率', '客服响应率', 'serviceRate'])),
    searchShare: parseMetric(pick(row, ['搜索占比', '搜索', 'searchShare'])),
    recommendShare: parseMetric(pick(row, ['推荐占比', '推荐', 'recommendShare'])),
    contentShare: parseMetric(pick(row, ['内容占比', '内容', 'contentShare'])),
    paidShare: parseMetric(pick(row, ['付费占比', '付费', 'paidShare'])),
    privateShare: parseMetric(pick(row, ['私域占比', '私域', 'privateShare']))
  };
}

function weightedAverage(rows, key, weightKey = 'sales') {
  const usable = rows.filter((row) => row[key] > 0);
  const weightTotal = usable.reduce((sum, row) => sum + Math.max(row[weightKey] || 0, 1), 0);
  if (!usable.length || !weightTotal) return 0;
  return usable.reduce((sum, row) => sum + row[key] * Math.max(row[weightKey] || 0, 1), 0) / weightTotal;
}

function dateRangeLabel(rows) {
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  if (!dates.length) return '';
  return dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} 至 ${dates[dates.length - 1]}`;
}

function aggregateRows(rows) {
  const sales = rows.reduce((sum, row) => sum + row.sales, 0);
  const visitors = rows.reduce((sum, row) => sum + row.visitors, 0);
  const orders = rows.reduce((sum, row) => sum + row.orders, 0);
  return {
    sales,
    visitors,
    orders,
    conversion: visitors ? orders / visitors * 100 : weightedAverage(rows, 'conversion', 'visitors'),
    aov: orders ? sales / orders : weightedAverage(rows, 'aov'),
    refundRate: weightedAverage(rows, 'refundRate'),
    roi: weightedAverage(rows, 'roi'),
    productCount: Math.max(...rows.map((row) => row.productCount || 0), 0),
    activeProductCount: Math.max(...rows.map((row) => row.activeProductCount || 0), 0),
    topSkuShare: weightedAverage(rows, 'topSkuShare'),
    serviceRate: weightedAverage(rows, 'serviceRate', 'visitors'),
    searchShare: weightedAverage(rows, 'searchShare'),
    recommendShare: weightedAverage(rows, 'recommendShare'),
    contentShare: weightedAverage(rows, 'contentShare'),
    paidShare: weightedAverage(rows, 'paidShare'),
    privateShare: weightedAverage(rows, 'privateShare')
  };
}

function groupRows(rows, key, limit = 8) {
  const map = new Map();
  rows.forEach((row) => {
    const name = row[key];
    if (!name) return;
    if (!map.has(name)) {
      map.set(name, { name, sales: 0, visitors: 0, orders: 0, spend: 0, clicks: 0, impressions: 0, addCarts: 0, rows: [] });
    }
    const item = map.get(name);
    item.sales += row.sales || 0;
    item.visitors += row.visitors || 0;
    item.orders += row.orders || 0;
    item.spend += row.spend || 0;
    item.clicks += row.clicks || 0;
    item.impressions += row.impressions || 0;
    item.addCarts += row.addCarts || 0;
    item.rows.push(row);
  });
  return Array.from(map.values()).map((item) => ({
    ...item,
    conversion: item.visitors ? item.orders / item.visitors * 100 : weightedAverage(item.rows, 'conversion', 'visitors'),
    roi: item.spend ? item.sales / item.spend : weightedAverage(item.rows, 'roi'),
    note: rankingNote(item, key)
  })).sort((a, b) => b.sales - a.sales).slice(0, limit);
}

function rankingNote(item, key) {
  if (key === 'promotionName') {
    if (item.spend && item.roi < 2) return 'ROI偏低，需控预算或查承接';
    if (item.spend && item.roi >= 3) return '推广效率较好，可保留观察';
    return '需结合点击和成交继续观察';
  }
  if (key === 'trafficSource') {
    if (item.conversion < 1) return '流量成交效率偏低';
    if (item.conversion >= 3) return '转化表现较好';
    return '需看来源质量和承接页面';
  }
  if (key === 'activityName') {
    return item.sales ? '记录活动成交，复盘活动承接' : '需补充活动成交数据';
  }
  if (item.conversion < 1) return '访客有但成交弱，需看页面承接';
  if (item.sales > 0 && item.conversion >= 3) return '成交表现较好，可重点维护';
  return '继续观察动销和退款表现';
}

function buildImportedDetails(rows) {
  return {
    products: groupRows(rows, 'itemName'),
    traffic: groupRows(rows, 'trafficSource'),
    promotion: groupRows(rows, 'promotionName'),
    activity: groupRows(rows, 'activityName')
  };
}

function rowsToFormData(rows, filename) {
  const mapped = rows.map(toImportedRow).filter((row) => row.sales || row.visitors || row.orders);
  if (!mapped.length) throw new Error('empty');
  const currentRows = mapped.filter((row) => row.bucket === 'current');
  const previousRows = mapped.filter((row) => row.bucket === 'previous');
  const currentSource = currentRows.length ? currentRows : mapped;
  const current = aggregateRows(currentSource);
  const previous = previousRows.length ? aggregateRows(previousRows) : { sales: 0, visitors: 0 };
  const first = mapped.find((row) => row.storeName || row.industry || row.platform) || {};
  const period = dateRangeLabel(currentSource) || '导入周期';
  const reportType = currentSource.length > 10 ? '月报' : '周报';
  return {
    storeName: first.storeName || $('#storeName').value || '未命名店铺',
    industry: first.industry || $('#industry').value || '美妆个护',
    platform: first.platform || selectedPlatform || '天猫',
    reportType,
    period,
    compareType: previousRows.length ? '上一个周期' : '不对比',
    dataSource: filename || '导入数据',
    sales: Math.round(current.sales),
    prevSales: Math.round(previous.sales || 0),
    visitors: Math.round(current.visitors),
    prevVisitors: Math.round(previous.visitors || 0),
    conversion: Number(current.conversion.toFixed(2)),
    aov: Number(current.aov.toFixed(2)),
    refundRate: Number(current.refundRate.toFixed(2)),
    roi: Number(current.roi.toFixed(2)),
    productCount: Math.round(current.productCount),
    activeProductCount: Math.round(current.activeProductCount),
    topSkuShare: Number(current.topSkuShare.toFixed(1)),
    serviceRate: Number(current.serviceRate.toFixed(1)),
    searchShare: Number(current.searchShare.toFixed(1)),
    recommendShare: Number(current.recommendShare.toFixed(1)),
    contentShare: Number(current.contentShare.toFixed(1)),
    paidShare: Number(current.paidShare.toFixed(1)),
    privateShare: Number(current.privateShare.toFixed(1)),
    importedDetails: buildImportedDetails(currentSource),
    notes: `已导入 ${mapped.length} 行经营数据，其中本期 ${currentSource.length} 行，上期 ${previousRows.length} 行。`
  };
}

async function importDataFile(file) {
  const text = await file.text();
  let rows;
  if (file.name.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    rows = Array.isArray(parsed) ? parsed : (parsed.rows || parsed.data || []);
  } else {
    rows = parseCsv(text);
  }
  const data = rowsToFormData(rows, file.name);
  setFormData(data);
  setLatest(analyze(getFormData()), true);
  $('#importStatus').textContent = `已导入 ${file.name}，自动生成${data.reportType}并写入历史。`;
  toast('数据已导入，报告已生成');
}

function downloadDataTemplate() {
  const template = [
    '周期,日期,店铺名称,平台,行业,宝贝名称,流量来源,推广计划,活动名称,销售额,访客数,订单数,转化率,客单价,退款率,ROI,花费,点击量,商品总数,有成交商品数,TOP SKU销售占比,客服响应达标率,搜索占比,推荐占比,内容占比,付费占比,私域占比',
    '上期,2026-05-01,某美妆旗舰店,天猫,美妆个护,5年陈皮100g,搜索流量,关键词推广,日常销售,42000,31000,690,2.23,60.87,4.8,2.6,1200,3600,86,50,42,84,35,19,18,20,8',
    '本期,2026-05-08,某美妆旗舰店,天猫,美妆个护,5年陈皮100g,搜索流量,关键词推广,618预热,45800,32800,770,2.35,59.48,4.2,2.9,1350,3900,86,54,41,87,34,18,21,19,8',
    '本期,2026-05-09,某美妆旗舰店,天猫,美妆个护,礼盒组合装,付费流量,万相台推广,618预热,31800,18600,390,2.10,81.54,3.8,2.4,1325,2400,86,54,41,87,34,18,21,19,8'
  ].join('\n');
  downloadText(template, 'pinmoo-week-month-report-template.csv');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function bindEvents() {
  document.querySelectorAll('#platformTabs button').forEach((button) => {
    button.addEventListener('click', () => {
      selectedPlatform = button.dataset.platform;
      document.querySelectorAll('#platformTabs button').forEach((item) => item.classList.toggle('selected', item === button));
      setLatest(analyze(getFormData()));
    });
  });

  fieldIds.forEach((id) => {
    $('#' + id).addEventListener('input', () => setLatest(analyze(getFormData())));
  });

  $('#diagnosisForm').addEventListener('submit', (event) => {
    event.preventDefault();
    setLatest(analyze(getFormData()), true);
    toast('已生成并保存诊断报告');
  });

  $('#loadSample').addEventListener('click', () => {
    const sample = samples[Math.floor(Math.random() * samples.length)];
    setFormData(sample);
    setLatest(analyze(getFormData()));
    toast('已导入示例数据');
  });

  $('#resetForm').addEventListener('click', () => {
    setFormData({ ...samples[0], storeName: '', sales: 0, prevSales: 0, visitors: 0, prevVisitors: 0, notes: '' });
    setLatest(analyze(getFormData()));
  });

  $('#saveDraft').addEventListener('click', () => {
    localStorage.setItem(draftKey, JSON.stringify(getFormData()));
    toast('草稿已保存');
  });

  $('#historySearch').addEventListener('input', renderHistory);
  $('#copyReport').addEventListener('click', copyReport);
  $('#exportReport').addEventListener('click', exportReport);
  $('#printReport').addEventListener('click', () => window.print());
  $('#exportHistory').addEventListener('click', exportHistory);
  $('#importHistory').addEventListener('click', () => $('#historyFile').click());
  $('#importData').addEventListener('click', () => $('#dataFile').click());
  $('#downloadTemplate').addEventListener('click', downloadDataTemplate);

  $('#dataFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await importDataFile(file);
    } catch {
      toast('导入失败，请检查字段名或使用模板 CSV');
    } finally {
      event.target.value = '';
    }
  });

  $('#historyFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported)) throw new Error('invalid');
      history = [...imported, ...history].slice(0, 200);
      saveHistory();
      renderHistory();
      toast('历史记录已导入');
    } catch {
      toast('导入失败，请使用导出的 JSON 文件');
    } finally {
      event.target.value = '';
    }
  });

  $('#historyBody').addEventListener('click', (event) => {
    const loadButton = event.target.closest('[data-load]');
    const deleteButton = event.target.closest('[data-delete]');
    if (loadButton) {
      const item = history.find((record) => record.id === loadButton.dataset.load);
      if (!item) return;
      setFormData(item.data);
      setLatest(item);
      document.getElementById('report').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (deleteButton) {
      history = history.filter((record) => record.id !== deleteButton.dataset.delete);
      saveHistory();
      renderHistory();
      toast('已删除该诊断记录');
    }
  });

  $('#clearHistory').addEventListener('click', () => {
    if (!history.length) return toast('暂无历史可清空');
    history = [];
    saveHistory();
    renderHistory();
    toast('诊断历史已清空');
  });
}

function init() {
  const draft = loadJson(draftKey, null);
  setFormData(draft || samples[0]);
  setLatest(analyze(getFormData()));
  renderHistory();
  bindEvents();
}

init();
