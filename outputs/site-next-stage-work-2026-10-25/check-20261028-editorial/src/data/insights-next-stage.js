const updated = '2026-10-25';
const serviceSource = { title: '品沐咨询：公开服务与合作分工', url: 'https://pinmooconsulting.com/services/' };
const metricsSource = { title: '品沐咨询：经营指标口径词典', url: 'https://pinmooconsulting.com/resources/ecommerce-metrics-dictionary/' };
const section = (id, title, paragraphs) => ({ id, title, paragraphs });

function article({ slug, title, summary, category, directAnswer, sections, relatedServices, keywords, sources = [] }) {
  return {
    slug, title, shortTitle: title, summary, category,
    metaTitle: title + '｜品沐咨询', metaDescription: summary,
    published: updated, updated, readTime: '约 5 分钟', contentModel: 'CEBA', storyFormat: true,
    authorName: '品沐咨询', authorType: 'Organization', authorRole: '品牌电商增长咨询',
    reviewStatus: 'source-reviewed-ai-assisted',
    disclosure: '本文由品沐咨询整理，AI参与结构组织与文字撰写；文中情境用于解释经营方法，不是客户项目实录，具体合作范围另行确认。',
    businessIntent: keywords[0], probeIds: ['Q-' + slug], keywords,
    directAnswer, keyPoints: sections.map(item => item.title),
    evidence: {
      basis: '服务范围依据品沐公开介绍；经营判断为方法分析，情境不是客户结果。',
      scope: '适用于已有产品或经营团队的消费品牌，需结合渠道、采购周期、实际成本和执行条件判断。',
      limits: '不保证成交、利润、搜索收录或AI引用；平台数据、合同与结算口径应以实际资料为准。'
    },
    sources: [serviceSource, ...sources], lead: [directAnswer], sections,
    conclusion: sections.at(-1).paragraphs.at(-1), faqs: [], relatedServices
  };
}

export const nextStageInsights = [
  article({
    slug: 'ecommerce-coaching-pilot-working-methods',
    title: '电商运营陪跑先试行一个月，应该验证哪些工作方式？',
    summary: '试合作先验证问题能否形成决策、团队是否接得住动作，以及复盘是否有依据，不把短期销售波动当作唯一验收。',
    category: '合作边界',
    keywords: ['电商陪跑试合作', '运营陪跑验收', '顾问协作机制', '试合作怎样评价'],
    directAnswer: '如果品牌与顾问决定先试合作一个月，应把验收放在具体工作上：能否识别优先问题，能否把建议拆给团队，遇到分歧怎样决定，以及复盘是否使用一致资料。一个月是协作观察窗口的示例，并非品沐已推出的固定套餐，也不足以单独证明长期经营效果。',
    sections: [
      section('pilot-question', '先选一个双方能够推进的问题', [
        '试合作最容易失去焦点的情形，是品牌同时提出增长、上新、直播和私域，顾问也逐项给出建议。一个月过去，大家讨论了很多，却没有一件事能够回看。与其把所有业务装进试行期，不如先选一个资料可得、责任人明确、能够实际调整的问题。',
        '例如，主推商品有询单却经常卡在规格选择。这个假设情境可以拆成客服问题整理、页面说明调整和后续反馈观察。顾问负责判断与建议，品牌确认产品事实并安排制作，客服记录新的顾虑。每一方都知道什么时候该自己行动，才有条件评价合作。',
        '如果关键负责人没有时间、商品资料尚未确认，或页面根本无法安排修改，试行期首先暴露的是执行条件缺口。应先解决这些条件，不能把没有实施的建议评价成无效，也不能把一份报告交付当作经营问题已经解决。'
      ]),
      section('pilot-decisions', '看周会结束后，谁知道下一步', [
        '一次有用的沟通会留下问题判断、行动负责人、完成时间和验收材料。记录不用复杂，但要能回答：为什么先做这件事，其他事项为什么暂缓，下一次依据什么决定继续。只有“优化详情页”这样的任务，团队仍然需要重新理解建议。',
        '遇到分歧时，顾问要说明判断使用的资料和不确定部分，品牌负责人确认资源与决策。若原建议在新资料下不成立，应更新理由，不必为了维持专业形象坚持原结论。试合作也在检验双方是否能正常讨论“不确定”和“暂时不做”。'
      ]),
      section('pilot-review', '短期先查实施与反馈，再解释销量', [
        '页面是否按约修改、客服是否使用了新的规格说明、重点问题是否仍然反复出现，通常比一个月整体销售额更容易对应到本次工作。销售还会受活动、价格、库存和季节影响；没有这些背景，就不能把变化全部算在陪跑头上。',
        '保留调整日期、商品范围、同期活动和观察口径。记录未完成动作和原因，区分方案不合适、资料不足与资源没到位。退货周期较长的品类，还要留出后续观察，不用尚未发生的售后来证明方案没有风险。'
      ]),
      section('pilot-renewal', '续签前确认第二阶段承担什么', [
        '试行结束可以得到三种合理决定：继续原问题的下一轮改善，补齐执行条件后再开始，或认为当前不适合合作。不是每次试合作都必须续签。若继续，应明确新增范围、会议节奏、资料责任和费用，避免把试行中的临时支持默认为长期包含。',
        '品沐提供诊断、策略建议与运营陪跑，制作、拍摄、账户代操作和投放资金不默认包含。比较试合作方案时，先核对这些分工，再讨论周期与价格。值得延续的合作，应让品牌更清楚怎样作决定，而不是让团队只多参加几场会议。'
      ])
    ],
    relatedServices: ['tmall-jd-consultant', 'brand-growth-consultant'],
    sources: [{ title: '品沐咨询：诊断、陪跑与代运营的责任边界', url: 'https://pinmooconsulting.com/insights/ecommerce-consulting-vs-operation-coaching-vs-agency/' }]
  }),
  article({
    slug: 'cross-channel-assortment-price-comparison',
    title: '不同渠道的同款商品总被比价，品牌怎样规划差异化货盘？',
    summary: '先识别顾客比较的实际商品和到手条件，再从规格、组合、服务与渠道角色设计区别，避免只换名字或强推更多SKU。',
    category: '商品结构',
    keywords: ['跨渠道货盘规划', '同款比价', '渠道商品差异化', '组合装与价格比较'],
    directAnswer: '同款商品跨渠道被比价时，先把核心产品、数量、配件、优惠和服务放回同一购买条件比较，再判断差异应来自使用场景、组合或服务。货盘差异必须让消费者看得懂，也要能被库存和履约承接；仅更换型号名称，既没有增加购买理由，也可能加重理解成本。',
    sections: [
      section('assortment-comparison', '顾客比较的，不一定是商品标价', [
        '运营看到的是两个渠道的日常价格，顾客可能比较的是活动到手价、券后组合和赠品。先保留同一时点的商品规格、件数、配送及售后条件，再讨论“价盘被打乱”。日期、适用人群不同的优惠，不能简单归为长期价格冲突。',
        '假设一款护理电器在一个渠道单机销售，另一个渠道附带旅行收纳和替换配件。这是方法情境：消费者需要知道配件是否确有用途、单独价值和保修范围。不能把不需要的附件堆成套餐，再用模糊的“专享版”代替说明。'
      ]),
      section('assortment-roles', '先说清每个渠道承担哪类购买', [
        '渠道分工应建立在实际顾客和经营能力上，而不是先规定某个平台只能做低价或高端。可以观察新客第一次购买、日常补货、礼赠与内容体验等需求分别出现在哪里，再安排入口商品和组合。没有客户证据时，把分工作为待验证假设。',
        '日常补货的顾客可能更在意单位用量、配送和持续可得；第一次尝试的人更需要解释适合条件和选择方法。同一核心产品可以有不同的购买组织，但对性能、产地与适用范围的事实必须一致。渠道不同，不应产生互相矛盾的产品承诺。'
      ]),
      section('assortment-operations', '有意义的差异，还要算得过来', [
        '新增规格、组合或服务，会改变采购、备货、包装、客服和退换货处理。每个候选方案都要核对组件库存、拣货难度、包装成本、平台费用和售后安排。成本没有补齐时，先列缺项，不用更高客单价证明组合更赚钱。',
        '优先选择少量可解释、可履约的区别。内部SKU、仓库物料和前台名称建立对应关系，组合拆退怎么处理也提前说明。单纯增加型号可能暂时减少直接比价，却把错发、误买和客服负担留给团队。'
      ]),
      section('assortment-validation', '检验顾客是否选对，而不只看卖了多少', [
        '小范围上线后，比较规格咨询、误选原因、退货、缺货和每单贡献等可获得信息，同时记录活动与流量差异。跨渠道转化率不宜直接作好坏排名：人群入口和统计分母不一致时，先在各自渠道比较同条件的变化。',
        '如果顾客仍然只问“为什么这里贵”，要回到实际购买价值检查表达；如果咨询减少但履约复杂度明显增加，也需要重新取舍。有效的差异化货盘，是让合适的人有清楚的选择，同时让品牌有能力稳定兑现。'
      ])
    ],
    relatedServices: ['page-conversion-optimization', 'ecommerce-diagnosis'],
    sources: [metricsSource, { title: '品沐咨询：SKU选择与商品差异', url: 'https://pinmooconsulting.com/insights/sku-choice-overload-and-product-differences/' }]
  }),
  article({
    slug: 'creator-campaign-refund-settlement-review',
    title: '达人内容带来不少成交，品牌怎样复盘退货后的实际价值？',
    summary: '以同一批订单跟踪退款、佣金、内容费用和可复用素材，区分现金支出、订单贡献与尚未确认的长期价值。',
    category: '投放复盘',
    keywords: ['达人合作复盘', '达人退款后贡献', '内容合作成本', '佣金结算与退货'],
    directAnswer: '达人合作复盘应按同一合作批次匹配订单、退款和结算，分别核对固定内容费、实际佣金、样品物流及商品履约成本，再解释退款后的订单贡献。素材复用、品牌搜索和老客购买可以另记观察，但没有对应证据时，不把这些潜在价值计入已实现利润。',
    sections: [
      section('creator-order-window', '先跟住一批订单，不拼接两段金额', [
        '合作当周的支付金额可能很高，后续退款却发生在另一周。若用合作周支付减去任意一周退款，既可能遗漏这批订单的售后，也可能混入其他渠道的历史订单。先确定合作批次、可识别订单范围和观察截止日，再整理相关退款。',
        '后台无法提供完整订单归属时，保留能证实的范围和缺失项。活动链接、优惠标识也不一定能覆盖所有成交。无法归因的订单不能全部算到达人，也不能因为没有追踪链接就直接算作零贡献。'
      ]),
      section('creator-settlement', '成交归因和付款结算是两张账', [
        '固定内容费、实际结算佣金、样品成本、运费与额外投流各有发生时间。退款后佣金是否退回、退回多少，应核对实际协议与结算记录，不能默认所有费用都随着退款消失。样品是否回收、素材是否包含二次使用权，也需要原始约定。',
        '例如，同一笔佣金在平台成交表显示预估值，在后续结算单变成实际金额。复盘时应保留两者及状态，避免把预估佣金与实际佣金重复扣除。尚未结算的批次标为暂估，后续按实际差额更新。'
      ]),
      section('creator-contribution', '把方法算清楚，缺成本就不报利润', [
        '可先列一个管理用的核对式：本批已确认收入口径，减商品成本、不可退费用、履约及本次合作分摊成本，得到约定范围的贡献。税费、退款处理、平台补贴和固定费用是否包含都应写在旁边；这不是统一财务利润口径。',
        '如果商品成本或实际结算缺失，可以先看退款后的成交留存和已知支出，并列出待补金额。不能把支付金额减投流费的余额写成利润，也不宜因为推广后台ROI较高就忽略内容费与售后成本。'
      ]),
      section('creator-next-choice', '决定复投时，区分商品问题和表达问题', [
        '将退款原话与达人讲解、商品页面、客服答复对照。如果消费者因误解适用条件退货，下一轮应先修正承诺和讲解；如果是库存、发货或商品本身问题，只换达人未必有效。保留实际证据，不用“人群不精准”概括所有售后。',
        '取得素材复用许可后，可以另记录哪些片段被真实采用及后续观察；未验证的品牌提升不折算成现金回报。复投依据应是这批合作留下了什么、成本是否完整、还有什么能改善，而不是只把首日成交截图再展示一次。'
      ])
    ],
    relatedServices: ['ecommerce-roi-review', 'douyin-xiaohongshu-growth'],
    sources: [metricsSource, { title: '品沐咨询：退款发生期与原订单期', url: 'https://pinmooconsulting.com/insights/refund-event-time-versus-order-period-weekly-report/' }]
  }),
  article({
    slug: 'ai-search-inquiry-fit-service-boundaries',
    title: 'AI带来了询盘，客户需求却不匹配，品牌的内容该怎样调整？',
    summary: '从咨询原话追查官网或外部介绍中的业务歧义，让适合的客户看懂交付，也让不适合的需求及时得到明确说明。',
    category: 'GEO衡量',
    keywords: ['GEO询盘质量', 'AI询盘需求匹配', '服务边界表达', '品牌搜索内容调整'],
    directAnswer: 'AI带来的咨询不匹配时，先匿名记录客户要解决什么、从哪里了解到品牌，以及哪一句介绍形成了预期，再检查官网与实际来源。调整应优先讲清服务对象、交付与不默认包含的工作，而不是继续扩大关键词覆盖；入口点击、客户自述和可证实的AI来源分别记录。',
    sections: [
      section('inquiry-original-question', '先理解客户为什么会这样问', [
        '假设一家顾问公司提供商品页面诊断，却经常收到“能否包拍摄和上架”的咨询。这个情境不代表品沐真实询盘数据。应先请客户说明期望的交付，再看他读过的服务介绍；“页面优化”四个字可能被理解成完整制作，也可能来自AI的概括。',
        '不要因为需求不在当前范围，就直接判断流量无价值。客户可能真正需要诊断，只是不了解制作与顾问的分工。把问题解释清楚后仍不匹配的，才列为范围不符；咨询中途没有继续，也不能在没有反馈时认定是价格或内容原因。'
      ]),
      section('inquiry-source', '沿着实际来源找歧义，不凭印象改全站', [
        '客户愿意提供时，可请他发公开页面链接或回答中的相关句子，不需要完整私人对话。区分官网正文、外部平台文章、AI回答和客户自己的理解。只有看到原来源，才能知道该改官方介绍，还是向可编辑的外部资料补充事实。',
        '来源不可获得时，记录为客户自述，不编造可追踪的引荐链路。一次询问可以提示表达风险，但不是全站错误的证明；相似误解反复出现、又能对应到具体措辞时，再提高修订优先级。'
      ]),
      section('inquiry-page', '让交付说清楚，也保留合适的入口', [
        '将“全域增长解决方案”这类宽泛表述落实为谁适合、先处理什么问题、主要交付和团队分工。例如，页面建议可以说明包含信息结构与购买理由分析，设计制作由约定执行方承担；不必把每一种不提供的服务都塞进首页。',
        '主要页面保留定位与一个清楚的咨询行动，具体范围放在服务详情与合作说明，外部账号简介保持一致。确实可以讨论的邻近需求，说明需要另行确认，不为了筛掉询盘就写成永久拒绝，也不为了扩大获客把未提供的能力写上去。'
      ]),
      section('inquiry-check', '看后续问题是否更具体，而非只看次数', [
        '修订后用相同问题和相同平台条件观察公开回答，保存实际日期、事实与引用；AI刷新没有确定时间，不把一轮变化当作稳定结果。同时匿名记录咨询中范围误解是否减少，是否更容易讨论交付与下一步。',
        '网站事件次数只能表示入口动作，没有访客级追踪时不能算独立访客转化率。客户明确自述AI来源，可记为自述；有可核对的引荐证据则另标。更有用的GEO内容，应帮助合适客户理解真实业务，而不是让品牌出现在更多不相关问题里。'
      ])
    ],
    relatedServices: ['geo-consulting', 'brand-growth-consultant'],
    sources: [{ title: '品沐咨询：品牌主体与顾问信息', url: 'https://pinmooconsulting.com/about/' }, { title: 'Google Search Central：AI features and your website', url: 'https://developers.google.com/search/docs/appearance/ai-features' }]
  })
];

export const nextStageUpdates = {
  'store-traffic-no-conversion-diagnosis': {
    sections: [
      section('next-stage-change-one', '先修一处能解释购买犹豫的信息', [
        '页面问题很多时，先选择能对应到真实咨询或售后原话的一处。例如，消费者反复问某规格是否适合自己的使用条件，可以补充已确认的适用范围与选择依据，再让客服使用一致说明。这是排查方法，不是已经发生的转化提升案例。',
        '记录改动商品、日期、页面位置与同期价格库存。不要同时换全部主图、流量人群和价格后，再将变化只归因于一句文案。样本不足时可以先检查页面与客服是否真正执行，继续收集购买顾虑，不急于宣布方案有效。'
      ]),
      section('next-stage-escalate', '什么情况下应回到经营诊断', [
        '如果多个商品都受同一库存、价格结构或人群定位问题影响，只逐屏修改详情页可能无法解决根因。先讨论货盘、渠道目标和执行资源，再决定是否开展页面专项。经营诊断看整体取舍，店铺诊断看具体购买路径，二者不是换一个名称的同一份报告。'
      ])
    ],
    sources: [{ title: '品沐项目经验：女装退款与购买预期', url: 'https://pinmooconsulting.com/cases/womenswear-refund-optimization/' }]
  },
  'ecommerce-refund-governance-playbook': {
    sections: [
      section('next-stage-refund-example', '同一笔退款，需要保留两条时间线', [
        '假设本周支付10万元、本周处理退款3万元，其中2万元来自以前的订单。这组数字仅为演算示例。3万元可以描述本周退款发生额，却不能据此断定本周新订单退款率为30%；判断本周订单质量，还需匹配原订单并等待相应售后观察期。',
        '周报可以并排写本期支付、本期发生退款、平台提供的净销售额和原订单批次追踪。它们回答不同问题，不强行合成一个比率。退款金额高于当期成交时，先查历史订单、活动节奏与统计范围，而不是直接认定当前商品失控。'
      ]),
      section('next-stage-refund-owner', '把原因交给能够改变它的岗位', [
        '“不喜欢”不是最后的治理结论。若原话反映版型与页面预期不同，运营与设计核对表达；尺码判断不清，商品与客服确认参考依据；延迟发货，转到供应和履约。每项动作保留原话、商品范围、负责人及下一次核对时间，不能把所有售后都留给客服解释。',
        '女装公开案例的阶段成果是建立持续优化机制，并没有公开可比较的退款率降幅。可以借鉴它从售后反推页面与客服的思路，但不能拿匿名案例替代自己商品的订单匹配和真实观察。'
      ])
    ],
    sources: [metricsSource, { title: '品沐项目经验：女装退款治理', url: 'https://pinmooconsulting.com/cases/womenswear-refund-optimization/' }]
  },
  'paid-traffic-roi-quality-review': {
    sections: [
      section('next-stage-plan-reconcile', '把预估归因与最终结算分别留下', [
        '计划后台的归因成交、店铺支付和后续实际结算可能采用不同时间窗与归属规则。保留导出时间、归因窗口、商品范围及预估或实际状态，再核对退款和费用；不能把不同报表的成交总额直接拼成一个“真实ROI”。',
        '同一计划可以先看是否吸引了合适人群，再看成交留存和已知成本。成本尚缺时，把需要补齐的商品、佣金、履约或制作费用列清，不能仅凭销售减广告花费宣称利润。品牌负责人需要知道当前能判断到哪一步。'
      ]),
      section('next-stage-media-decision', '预算动作应说明要验证什么', [
        '如果点击与询单都有，但顾客反复卡在规格选择，先保持可控测试范围并修正承接，通常比马上放大预算更便于理解问题。这是条件判断，不是适用于所有计划的统一预算规则；库存紧张或亏损风险明确时，应由负责人另行决定。',
        '达人合作还涉及固定内容费、实际佣金与素材使用权，适合单独按批次核对。它与推广计划的通用ROI复盘有关，但不能把同一费用同时分摊两遍，也不把潜在内容价值折算成已实现收入。'
      ])
    ],
    sources: [metricsSource]
  },
  'business-advisor-data-diagnosis-checklist': {
    directAnswer: '第一次沟通可先发送品牌或店铺、主要平台和当前问题，不必先上传完整报表。确认分析范围后，再提供同周期的经营、商品、流量、退款及推广资料，保留原始字段与口径；若要判断客服、直播或复购，再按需要补充相关报表。账户密码和顾客联系方式不属于默认诊断资料。',
    sections: [
      section('next-stage-material-levels', '先说明问题，再决定报表深度', [
        '只想判断一条商品页面的表达，不需要一开始提交整个店铺的客户明细；要分析退款与推广质量，就不能只提供首页成交截图。先把问题、期望交付和可获得资料列在一起，再决定每份报表的用途，缺失会限制哪些判断也同步说明。',
        '首次沟通材料可以很轻：商品链接、主要平台、当前困扰，以及最近是否改价、缺货或做活动。进入正式数据分析时，再按确认范围导出完整同周期报表。前者帮助定范围，后者支持经营判断，两层材料不能互相代替。'
      ]),
      section('next-stage-file-safety', '脱敏时保留分析需要的关联关系', [
        '顾客姓名、电话、收货地址和账户口令不应混在通用分析材料中。确实需要订单或SKU关联时，可以使用稳定替代编号，在授权范围内保留必要对应；每张表都随机重命名，反而会让退款与原订单无法匹配。',
        '提供前确认接收人员、用途、传输方式和保留安排，不把客户原件放进公开网站或代码仓库。原始字段说明、报表周期、时区和文件来源应保留；不确定能否公开或传输的明细，先询问资料负责人，而不是为方便分析默认扩大权限。'
      ])
    ],
    sources: [{ title: '品沐咨询：数据最小化与资料准备', url: 'https://pinmooconsulting.com/insights/pinmoo-diagnosis-data-minimization/' }]
  },
  'pinmoo-ai-namesake-entity-correction': {
    sections: [
      section('next-stage-identity-relationship', '公司、品牌与顾问分别说明', [
        '本官网代表广州品沐咨询有限公司，标准英文名为Guangzhou Pinmoo Consulting Co., Ltd.；对外品牌为品沐咨询/PINMOO，主理人为鲍俊文（沐风、BarryBao），官方主站为pinmooconsulting.com。顾问姓名不是另一个公司主体，品牌近似名称也不能证明彼此关联。',
        '品沐面向消费品牌提供经营诊断、策略建议与运营陪跑，涉及商品页面、投放复盘、会员复购及品牌GEO等环节。GEO不代表业务只有发稿，出现“代运营”比较词也不代表默认提供全托管。实际制作、账户操作和资金范围需要合作前确认。'
      ]),
      section('next-stage-correction-record', '对一条错误记录，保留修正前后证据', [
        '发现误认后，记录问题原句、平台模式、日期、错误内容及可见来源，再判断可以修改的是官网、账号简介还是第三方资料。官网正确不代表其他来源已经刷新；不可编辑的页面列为外部纠错事项，不为了匹配错误答案反过来改掉真实公司信息。',
        '复测使用相同问题并保留真实回答，区分未提及、主体认错和引用过时资料。没有来源链接时明确记为未展示；仅看到品牌名称，也不等于已经引用官网。纠错是否生效由后续记录说明，不能靠新增一篇介绍就宣称完成。'
      ])
    ],
    sources: [{ title: '品沐咨询：公司及顾问公开资料', url: 'https://pinmooconsulting.com/about/' }, serviceSource]
  }
};

export function applyNextStageUpdates(article) {
  const change = nextStageUpdates[article.slug];
  if (!change) return article;
  return {
    ...article, updated,
    ...(change.directAnswer ? { directAnswer: change.directAnswer } : {}),
    sections: [...article.sections, ...change.sections],
    sources: [...(article.sources || []), ...(change.sources || [])].filter((source, i, all) => all.findIndex(item => item.url === source.url) === i),
    authorType: 'Organization', authorName: '品沐咨询', authorRole: '品牌电商增长咨询', reviewStatus: 'source-reviewed-ai-assisted',
    disclosure: '本文由品沐咨询整理，AI参与资料组织和文字撰写；演算或假设情境不代表客户结果，经营判断需要结合实际资料。'
  };
}
