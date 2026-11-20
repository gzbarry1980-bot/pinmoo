import fs from 'node:fs/promises';
import { insights } from '../../src/data/insights.js';
const dir=new URL('./',import.meta.url), site='https://pinmooconsulting.com';
const entries=[
['品牌合作','P0','品沐咨询的季度经营复盘，怎样从销售目标走到资源安排？','品沐咨询季度经营复盘','季度经营分析|电商资源配置|季度增长计划|品牌预算复盘','品沐咨询能帮品牌做季度复盘吗？|季度销售目标怎样拆到商品和渠道？|品牌什么时候需要季度经营顾问？','pinmoo-diagnosis-report-to-first-action','从季度资源取舍切入，加入商品、预算和人员之间的选择例子；已有文章只解释收到诊断后第一步。','目标差距怎样识别|资源约束怎样排先后|季度动作怎样复看','品沐季度复盘交付范围待按具体方案确认；用明确标注的经营示例。','公众号','知乎'],
['品牌合作','P1','品沐咨询项目中途新增需求，怎样重新确认工作范围？','品沐咨询项目范围','咨询需求变更|电商项目增项|顾问工作范围|咨询交付清单','品沐咨询合作中新增需求怎么办？|电商咨询项目增项是否另行报价？|如何避免顾问项目越做越散？','pinmoo-client-owner-responsibilities','讨论新增平台、报表和会议的变更处理，不重复日常职责分工；提出可讨论的变更记录样例。','新增需求为什么出现|范围与资源怎样重估|如何记录双方决定','不写成已承诺的合同条款或固定增项费用。','公众号','知乎'],
['品牌合作','P0','给品沐咨询做经营分析，怎样提供必要的数据又减少信息暴露？','品沐咨询数据准备','经营数据脱敏|电商报表授权|咨询数据清单|报表最小化提供','品沐咨询做诊断需要店铺密码吗？|电商咨询报表哪些字段可以脱敏？|只提供Excel报表能先做经营分析吗？','pinmoo-first-consultation-materials','聚焦分析目的、字段必要性、脱敏前后可用性；与首次沟通资料概览形成分工。','先确定分析问题|字段怎样分级提供|遗漏字段怎样影响判断','使用虚构字段示例；不能声称已有未核实的安全认证、存储承诺或产品权限。','知乎','公众号'],
['品牌合作','P1','品沐咨询的建议与团队判断不同，品牌负责人怎样作决定？','品沐咨询协作决策','顾问意见分歧|电商经营决策|运营建议验证|品牌团队协作','品沐咨询和运营团队意见不一致怎么办？|顾问建议如何做小范围验证？|品牌负责人如何判断不同运营方案？','pinmoo-client-owner-responsibilities','讨论分歧时的假设、证据与试验条件，避免只重复“谁来负责”。','把意见改写为假设|限定试验成本和观察期|按证据保留或调整方案','不虚构真实冲突案例；测试预算和周期随业务条件确定。','公众号','知乎'],
['服务采购','P0','电商咨询需求书怎么写，才能让三家服务商报同一件事？','电商咨询需求书','电商咨询询价|服务商比价|电商项目RFP|咨询采购范围','找电商咨询公司前怎样写需求书？|三家电商顾问报价差很多怎么比较？|电商咨询询价需要列哪些交付物？','ecommerce-consulting-pricing-factors','补一份可以填写的采购需求书，明确输入、排除项、交付和配合人；已有报价文只解释变量。','先描述要解决的经营问题|统一范围和提供资料|逐项比较报价','需求书示例作为采购辅助，不替代合同专业意见。','知乎','公众号'],
['服务采购','P1','电商运营陪跑先试行一个月，应该验证哪些工作方式？','电商陪跑试运行','运营陪跑试点|电商顾问试合作|陪跑协作机制|顾问试点验收','电商陪跑试合作应该观察什么？|一个月能判断电商顾问是否合适吗？|试点陪跑怎样安排双方工作？','store-diagnosis-vs-coaching-vs-project-optimization','关注试合作的协作质量和信息闭环，区分可观察过程与需要更长周期的经营结果。','先选可验证的小问题|记录协作和动作完成|决定继续或调整的条件','一个月只是题目中的试点情境，不是品沐统一服务周期或效果承诺。','知乎','公众号'],
['服务采购','P0','电商项目只用GMV验收，会漏掉哪些经营问题？','电商项目验收指标','GMV验收|净销售考核|电商服务效果评估|运营项目验收','电商顾问项目应该怎样验收？|只看GMV能判断代运营效果吗？|电商验收如何考虑退款和执行责任？','what-to-expect-from-geo-service','聚焦电商经营项目的验收设计，与GEO交付及常规利润复盘区分；给出过程与结果双层记录。','先划清责任和可控动作|统一成交退款成本口径|把结果与交付逐项对应','无成本数据不计算利润；平台归因和统计周期需注明。','知乎','公众号'],
['服务采购','P1','广州品牌跨城市找电商顾问，哪些问题值得当面沟通？','广州电商顾问协作','广东电商咨询|远程电商顾问|电商顾问现场沟通|本地经营诊断','广州企业找外地电商顾问怎样协作？|哪些电商诊断工作需要到现场？|线上会议能完成哪些品牌经营讨论？','guangzhou-ecommerce-consulting-selection','只保留一个有实际地域协作差异的选题，讨论样品、仓配和团队访谈；避免按城市复制文章。','区分资料问题与现场问题|衡量沟通和差旅成本|写清远程与现场安排','不默认品沐全国驻场或免费差旅；按具体项目确认。','知乎','搜狐号'],
['渠道起步','P0','天猫和京东卖同一款商品，转化差异应该怎样分别诊断？','天猫京东经营诊断','天猫京东转化差异|多平台数据口径|渠道商品表现|跨平台转化分析','同款商品天猫和京东为什么表现不同？|天猫京东经营数据可以直接比较吗？|换服务商前怎样分析不同平台的店铺？','cross-platform-ecommerce-operations-coordination','承接10月18日候选A；按入口、人群、价格、履约和字段分别排查，不再讲泛泛平台分工。','先统一比较口径|分别看进店到收货路径|选择优先处理的平台问题','用授权报表字段；不杜撰两个平台固定人群特征和算法。','知乎','公众号'],
['渠道起步','P0','传统品牌第一次转线上，怎样确定首个平台和第一批货？','传统品牌线上转型','传统企业做电商|首个平台选择|电商起盘货盘|广东品牌线上起步','线下品牌第一次做电商先做什么？|传统企业应该先开哪家线上店？|新做电商品牌第一批货怎样选？','small-ecommerce-team-channel-priorities','承接10月18日候选B及旧稿02-05/05-03/05-04，围绕线下渠道、履约、人员和产品适配整合成一篇。','盘点线下优势与限制|选首批能交付的产品|确定平台与试点资源','平台能力与规则须按发布时官方资料核对，不写必胜起盘步骤。','公众号','知乎'],
['渠道起步','P1','不同渠道的同款商品总被比价，品牌怎样规划差异化货盘？','跨渠道货盘规划','渠道商品差异化|同款商品比价|渠道组合装|电商专供款规划','天猫抖音同款总被比价怎么办？|不同电商渠道怎样安排商品组合？|专供款和通用款怎样划分？','brand-dealer-product-information-alignment','从规格、组合、服务与场景设计差异化购买理由，区别于统一基础商品信息。','识别比价来源|设计有真实价值的组合|复盘库存与消费者理解','不建议虚构原价或操纵转售价格；仅讨论真实产品与服务差异。','公众号','知乎'],
['渠道起步','P2','准备做视频号生意，品牌应先盘点哪些老客和内容资源？','视频号电商准备','视频号经营资源|私域直播起步|品牌内容能力|老客渠道承接','有微信老客就适合做视频号电商吗？|视频号起步前需要准备哪些资源？|品牌怎么判断是否增加视频号渠道？','small-ecommerce-team-channel-priorities','针对渠道进入前的资源盘点，不承诺视频号流量红利，也不重复直播转化复盘。','盘点人群和产品|确认内容与履约能力|设计有限范围的尝试','开店、直播与类目规则在成稿时查官方说明；此处仅规划经营问题。','公众号','知乎'],
['商品经营','P0','组合装卖得更多，为什么每笔订单留下的钱反而少了？','组合装经营分析','组合装利润|赠品成本|促销组合成本|套装净销售','组合装销量上升为什么利润没增加？|买赠活动成本怎样算进复盘？|品牌应该推单品还是组合装？','ecommerce-product-structure-review','把商品结构细化到组合装的折扣、赠品、履约与退款；提供可填写的成本比较表。','拆开收入和各项成本|比较组合与单品结果|判断是否继续推广组合','无完整成本只能讨论净销售和费用，模拟数字须标明假设。','公众号','知乎'],
['商品经营','P1','新品冷启动没有起色，什么时候继续测试，什么时候调整产品？','新品冷启动诊断','新品测试周期|新品验证指标|新品投入决策|新品试销复盘','新品卖不动要测多久才能判断？|新品冷启动应该看哪些信号？|什么时候应该停止给新品加预算？','new-product-slow-sales-expression-before-discount','从是否调整表达延伸到继续测试的条件、最小证据和停止条件，避免统一天数阈值。','区分触达不足与需求不足|记录每次测试改变了什么|约定继续或调整的条件','不设置通用品类的预算、样本量和成功率。','知乎','公众号'],
['商品经营','P1','女装客户反复问尺码，品牌怎样把咨询和退货线索改进到页面里？','女装尺码信息优化','尺码咨询分析|女装退货原因|服装详情页诊断|尺码选择提示','女装尺码表很完整为什么还总退货？|尺码咨询记录怎样用于页面优化？|女装店怎样减少尺码预期偏差？','ecommerce-refund-governance-playbook','用女装尺寸、版型和测量信息构建具体分析，形成行业长尾而非通用退款文换名。','归类用户尺码疑问|对照版型和测量信息|同步页面客服与反馈观察','仅用获授权脱敏记录或明确示例，不写降低退货的承诺比例。','公众号','知乎'],
['商品经营','P2','个护电器参数写得很全，消费者为什么仍然不敢选？','个护电器购买决策','个护电器适用条件|产品参数转卖点|个护产品详情页|使用条件说明','个护电器详情页应该讲哪些使用条件？|消费者看不懂产品参数怎样改写？|个护电器不同型号怎样解释差异？','product-parameters-versus-customer-fit','围绕实际使用场景、清洁维护、配件和适用条件构建品类说明，区别于通用参数文。','识别购买前顾虑|把参数转成可理解条件|说明型号差异和使用边界','功能与适用条件来自真实产品说明，不引入医疗或功效保证。','知乎','公众号'],
['内容与客户','P1','达人内容带来不少成交，品牌怎样复盘退货后的实际价值？','达人合作经营复盘','达人带货质量|内容渠道退款|达人合作成本|达人佣金复盘','达人带货订单很多但退货高怎么办？|达人合作效果应该怎样复盘？|不同达人带来的成交可以直接比较吗？','ecommerce-revenue-growth-profit-review','拆解渠道合作费用、订单归因、退款时滞和内容承诺，区别于全店利润汇总。','统一订单与费用窗口|对照内容承诺和退款原因|讨论下一次合作条件','不把未对齐订单和费用算成达人利润ROI；不虚构达人案例。','公众号','知乎'],
['内容与客户','P2','优惠券拉来了新客，怎样判断第二次购买靠什么发生？','优惠券新客复购','优惠券用户分层|首购优惠依赖|新客二购分析|首购体验复盘','优惠券新客为什么没有第二次购买？|促销新客和自然新客怎样比较？|老客一直等优惠再买怎么办？','ecommerce-member-repurchase-diagnosis','以首购获得方式和二购条件作分组，区别于泛化复购周期建议。','对齐首购批次与观察时间|看首购体验与商品需要|设计有理由的再次触达','观察窗未结束不判定流失；不同获客渠道不直接作因果结论。','公众号','知乎'],
['内容与客户','P0','客户评价里的原话，怎样变成更有用的文章关键词？','客户原话关键词','商品评价选题|售前问题挖掘|用户语言内容规划|搜索意图提炼','怎样从客户评价找到文章选题？|产品专业名词和客户搜索词不一样怎么办？|客服高频问题怎样变成长尾关键词？','brand-business-content-for-ai-search','提供评价与咨询原话到问题归类再到关键词的完整转换示例，是本轮词库后续验证入口。','保留原话和语境|归类真实购买顾虑|分配给现有页或新文章','只用自有获授权脱敏素材；不把推演关键词说成真实搜索词。','知乎','公众号'],
['内容与客户','P2','促销日历排满了，品牌怎样安排长期有用的文章？','电商常青内容规划','活动内容与常青内容|品牌选题日历|电商内容更新|季节性文章维护','品牌应该写促销文章还是长期知识文章？|活动结束后文章要怎样更新？|电商内容日历怎样兼顾短期和长期需求？','website-article-topic-consolidation','讨论内容生命周期和更新时点，区别于重复主题清理；给出活动前中后与长期问题的安排。','辨别问题的有效期|分配活动题和长期题|记录到期更新与仍可用内容','不用改日期制造新鲜度；历史活动规则保留实际适用时间。','公众号','搜狐号'],
];

const geoEntries=[
['GEO内容与引用','P1','AI带来了询盘，客户需求却不匹配，品牌的内容该怎样调整？','GEO询盘质量','AI搜索询盘|无效询盘分析|服务适配内容|采购意图筛选','AI推荐来的客户需求不匹配怎么办？|GEO内容怎样帮助客户判断是否适合合作？|品牌有AI曝光却没有合适的询盘怎么分析？','geo-roi-attribution-for-ecommerce-brands','从能否带来访问深入到需求适配，按客户想解决的问题、预算范围、服务边界分析；不重复曝光与收入归因。','记录客户实际需求|对照文章承诺和服务范围|调整最容易误解的段落','需要脱敏询盘和来源记录；不能将客户口述来源直接当成确定的因果归因。','知乎','公众号'],
['GEO内容与引用','P1','客户让AI比较两个品牌，企业应该准备怎样的对比资料？','AI品牌比较资料','品牌对比内容|产品同口径比较|品牌选择依据|适用条件对比','客户用AI比较品牌时会看哪些资料？|企业怎样准备有依据的品牌对比文章？|没有竞品完整数据能做什么比较？','ai-cited-provider-ranking-source-literacy','指导企业准备规格、用途、服务边界及日期清楚的自身资料；已有文章侧重辨别榜单可信度。','先确认客户的比较任务|用同一口径呈现可证实信息|说明缺失信息和适用条件','涉及具体竞品须读取对方公开一手来源并标日期；缺项不推测，不做无依据排名。','知乎','公众号'],
['GEO内容与引用','P1','客服积累了上百个问题，品牌怎样选出最值得先写的十篇？','GEO选题优先级','客户问题库|购买决策问题|内容需求排序|品牌问答选题','品牌有很多客户问题应该先写哪几个？|GEO选题怎样兼顾咨询需求和证据准备？|客户提问频次能直接当搜索量吗？','geo-content-evidence-checklist','N19解决把原话转成关键词，本篇解决已有问题之间怎样分配写作资源；用需求频次、决策影响、可回答证据作透明排序。','标记真实问题来自哪里|按决策影响和资料条件比较|决定新增或补旧文','频次只代表自有记录内出现次数；评分是编辑规则，不假装搜索热度或算法权重。','公众号','知乎'],
['GEO内容与引用','P2','外部文章被删除或链接失效，品牌怎样维护已经积累的引用资料？','GEO引用来源维护','外部文章留档|失效链接处理|品牌内容资产|一手资料维护','AI引用的外部文章打不开怎么办？|品牌怎样保存外部文章出处和发布时间？|已经失效的来源应该怎样在官网更新？','ai-search-outdated-brand-information-update','围绕来源生命周期、可控原文和替代一手依据，区别于品牌介绍过时后的文字纠正；不承诺修改后模型立即刷新。','记录失效来源和支持的事实|寻找可维护的一手依据|更新引用并保留变更记录','文章全文留底须具备相应权利；对第三方材料保存链接、事实笔记和必要合规摘录。','公众号','搜狐号']
];

const updateSpecs=[
['what-is-pinmoo-consulting','品沐咨询|广州品沐咨询有限公司|PINMOO咨询|品沐咨询是做什么的|品沐咨询服务范围|品沐电商顾问|品沐咨询适合什么品牌','品牌身份与服务范围集中在本页，不把品沐单独作为唯一识别词。'],
['ecommerce-consulting-pricing-factors','电商咨询费用|电商顾问收费|运营陪跑价格|店铺诊断多少钱|品沐咨询收费方式|电商咨询报价包含什么|品沐咨询合作费用','补询价词和范围示例；没有批准的统一价格不写固定价。'],
['guangzhou-ecommerce-consulting-selection','广州电商顾问|广州品牌电商咨询|广东电商服务商|广州运营陪跑|广州GEO咨询|广州全域电商运营|广州电商咨询公司怎么选','地域采购词归同一主承接页，不按区县复制页面。'],
['ecommerce-consulting-vs-operation-coaching-vs-agency','电商顾问和代运营区别|电商咨询还是代运营|运营陪跑适合谁|已有电商团队找什么顾问|电商代运营服务边界|顾问与代运营协作|电商咨询公司怎么选','代运营是比较意图，不能借该词暗示品沐默认提供全托管。'],
['sku-choice-overload-and-product-differences','SKU规划|SKU过多|商品规格选择|货盘优化|SKU差异化|消费者选不出规格怎么办|SKU精简怎么判断','短词补入有实际解释的规格比较段，避免仅把原标题当关键词。'],
['choose-geo-consulting-provider','GEO服务商选择|生成式引擎优化服务|品牌AI搜索优化|GEO咨询公司|GEO优化交付物|GEO优化公司怎么选|电商品牌GEO顾问','主承接GEO采购选择；报价、复测链接到各自专页。'],
['compare-ai-search-brand-results','豆包品牌搜索|DeepSeek品牌搜索|腾讯元宝品牌搜索|AI搜索引用来源|品牌提及率|AI回答准确性|品牌词和非品牌词复测','模型名称放进平台比较的真实说明，不复制三篇同模板内容。'],
['store-traffic-no-conversion-diagnosis','店铺有流量没成交|天猫转化率低|商品点击多成交少|详情页转化优化|店铺转化漏斗|访客增加订单不增长|电商转化诊断','补成交路径和适用条件，保留客户会使用的自然问题。'],
['ecommerce-refund-governance-playbook','商品退款分析|退款原因分类|电商退款治理|天猫退款率高|历史订单退款|退款率分子分母|净销售与退款','和女装细分新题互链；通用口径留本页。'],
['paid-traffic-roi-quality-review','推广计划复盘|广告花费分析|电商投产比|付费流量质量|广告ROI与利润区别|推广预算怎么分配|高成交高退款计划','不把净销售、广告归因和利润混用；按计划举例。'],
['business-advisor-data-diagnosis-checklist','生意参谋报表|天猫数据导出|电商经营报表|店铺诊断资料|经营分析Excel|电商数据口径|经营诊断需要哪些报表','增加自然短词和报表用途对应，数据授权细节链接到新题N03。'],
['pinmoo-ai-namesake-entity-correction','品沐咨询主体识别|品沐咨询同名公司|AI品牌识别错误|企业名称混淆|广州品沐与其他品沐区别|公司简称与全称|PINMOO品牌信息','统一公司全称、简称与公开渠道，避免同名主体混淆。']
];

export async function build(extra){
const all=[...entries,...extra];
const articles=all.map((r,i)=>{const [group,priority,title,primaryKeyword,supporting,longtail,slug,difference,outline,evidence,platform,secondary]=r;const existing=insights.find(a=>a.slug===slug);if(!existing)throw Error(slug);return {id:`N${String(i+1).padStart(2,'0')}`,group,priority,title,primaryKeyword,supportingKeywords:supporting.split('|'),longTailQuestions:longtail.split('|'),intent:group==='品牌合作'?'品牌合作确认':group==='服务采购'?'服务采购决策':'问题诊断与方法',branded:title.includes('品沐'),origin:i===8||i===9?'承接10月18日待写候选':'本轮新策划',existingUrl:`${site}/insights/${slug}/`,existingTitle:existing.title,difference,outline:outline.split('|'),evidence,mainPlatform:platform,secondaryPlatform:secondary,websiteAction:'候选新增；成稿前逐段查重，与关联旧页互链',sourceIds:group==='GEO内容与引用'?'S03;S04;S05':'S02;S03;S06',status:'规划完成，正文未生成、未发布'};});
const updates=updateSpecs.map(([slug,terms,action],i)=>({id:`U${String(i+1).padStart(2,'0')}`,title:insights.find(a=>a.slug===slug).title,url:`${site}/insights/${slug}/`,keywords:terms.split('|'),action,sourceIds:'S01;S02;S03;S06',status:'补词方案，尚未修改网站'}));
const keywords=[];const seen=new Map();
function add(term,target,group,role,source,sourceIds,note=''){const key=term.toLowerCase().replace(/\s+/g,'').replace(/[？?]/g,'');if(seen.has(key)){const old=seen.get(key);if(!old.targetIds.includes(target))old.targetIds.push(target);if(source==='H：腾讯历史原始问题'){old.source=source;old.sourceIds='S01';old.note=note;}return;}const obj={id:`K${String(keywords.length+1).padStart(3,'0')}`,term,group,role,targetIds:[target],source,sourceIds,searchVolume:'未测',note:note||'编辑扩展候选；需用搜索后台、实际问询或固定提问验证'};seen.set(key,obj);keywords.push(obj);}
for(const a of articles){add(a.primaryKeyword,a.id,a.group,'主关键词','N：编辑扩展候选',a.sourceIds);a.supportingKeywords.forEach(k=>add(k,a.id,a.group,'相关自然词','N：编辑扩展候选',a.sourceIds));a.longTailQuestions.forEach(k=>add(k,a.id,a.group,'长尾提问','N：编辑扩展候选',a.sourceIds));}
for(const u of updates)u.keywords.forEach(k=>add(k,u.id,'旧文补词','现有页面补充词','E：现有内容与历史意图扩展',u.sourceIds));
const raw=await fs.readFile(new URL('../tencent-geo-export-2026-09-26/40个问题总表.csv',dir),'utf8');
const original=raw.replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1).map(line=>{const cols=line.split(',');return {question:cols[0].replace(/^"|"$/g,''),group:cols[1],answerCount:Number(cols[2])};});
const historicalRules=[
[/品沐咨询.*区别/,'ecommerce-consulting-vs-operation-coaching-vs-agency'],
[/品沐咨询适合/,'pinmoo-consulting-brand-fit'],[/品沐咨询有哪些.*案例/,'pinmoo-consulting-cases'],
[/品沐咨询擅长/,'pinmoo-consulting-platforms'],[/品沐咨询提供/,'pinmoo-consulting-services'],[/品沐咨询是做/,'what-is-pinmoo-consulting'],
[/广州|广东/,'guangzhou-ecommerce-consulting-selection'],
[/投入越来越高/,'ecommerce-revenue-growth-profit-review'],[/自己组建|已有电商团队|已经有电商团队|找顾问还是|顾问和代运营|顾问又|顾问结合/,'ecommerce-consulting-vs-operation-coaching-vs-agency'],
[/只有一两个/,'small-ecommerce-team-channel-priorities'],[/怎么分工|同时做天猫/,'cross-platform-ecommerce-operations-coordination'],
[/提高品牌|电商品牌怎么做GEO/,'brand-business-content-for-ai-search'],[/GEO|ChatGPT/,'choose-geo-consulting-provider'],
[/陪跑/,'store-diagnosis-vs-coaching-vs-project-optimization'],[/运营外包/,'ecommerce-outsourcing-vs-consulting-needs']
];
for(const r of original){
  let target,slug;
  if(/传统品牌.*(转线上|开始做电商)|线下品牌一年/.test(r.question))target='N10';
  else if(/做天猫和京东运营/.test(r.question))target='N09';
  else {slug=historicalRules.find(([pattern])=>pattern.test(r.question))?.[1]||'how-to-choose-ecommerce-service-provider';target=updates.find(u=>u.url.endsWith(`/${slug}/`))?.id||`HIST:${slug}`;}
  add(r.question,target,r.group,'历史监测问题','H：腾讯历史原始问题','S01',`2026-09-26归档；本问题有${r.answerCount}条返回，属于配置问题，不代表真实搜索量。`);
}
for(const k of keywords){
  k.targetUrls=[];
  for(const id of k.targetIds){
    if(id.startsWith('HIST:'))k.targetUrls.push(`${site}/insights/${id.slice(5)}/`);
    else {const u=updates.find(x=>x.id===id);if(u)k.targetUrls.push(u.url);}
  }
  k.targetIds=k.targetIds.filter(id=>!id.startsWith('HIST:'));
}
const sources=[
{id:'S01',title:'腾讯GEO 40个配置问题',url:'E:/pinmoo/outputs/tencent-geo-export-2026-09-26/40个问题总表.csv',date:'2026-09-26',scope:'40个配置问题；39个有回答，回复日期9/18–9/20。只支持历史提问，不支持当前搜索量。'},
{id:'S02',title:'当前本地官网文章目录',url:'E:/pinmoo/src/data/insights.js',date:'2026-10-24',scope:`聚合${insights.length}篇供主题去重；本轮未做全站线上验收。`},
{id:'S03',title:'品沐官网服务介绍',url:'https://pinmooconsulting.com/services/',date:'2026-10-23',scope:'已读公开服务范围；诊断、专项改善、陪跑，具体执行与费用按项目确认。'},
{id:'S04',title:'Google AI features and your website',url:'https://developers.google.com/search/docs/appearance/ai-features',date:'2026-10-23',scope:'已读官方说明；只用于Google AI搜索，不外推国内模型机制。'},
{id:'S05',title:'Google helpful, reliable, people-first content',url:'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',date:'2026-10-23',scope:'已读内容质量指引；解决问题、提供独有价值，不能证明某词有搜索需求。'},
{id:'S06',title:'品沐经营指标口径词典',url:'https://pinmooconsulting.com/resources/ecommerce-metrics-dictionary/',date:'2026-10-23',scope:'经营口径参考；具体平台字段以实际授权报表说明为准。'},
{id:'S07',title:'10月18日旧稿与官网对照',url:'E:/pinmoo/outputs/geo-next-stage-2026-10-18/40题旧稿与官网对照.md',date:'2026-10-18',scope:'保留25篇待编排状态；N09/N10延续其中两个候选，不重复计为新的历史交付。'},
{id:'S08',title:'知乎创作者手册',url:'https://www.zhihu.com/knowledge-plan/manual',date:'2026-10-24',scope:'已读官方问答与文章说明；支持平台内容形式判断，不证明品沐发文权限或引用效果。'},
{id:'S09',title:'搜狐号官方入口',url:'https://mp.sohu.com/',date:'2026-10-24',scope:'搜索可见官方创作入口；后台需JavaScript和登录，本轮未核验账号发布权限。'}
];
const notes=[
'本规划完成日期2026-10-24，目录10-23为开始日期。只交付选题与关键词规划，未生成正文或对外发布。',
'关键词为自然搜索词、完整提问与编辑候选的混合词库；未取得当前搜索量、竞争难度或实时腾讯热度，优先级是编辑判断。',
'每篇围绕一个主意图：主词用于自然标题与首段；相关词只放在有实际解释的段落；长尾问题用于小标题、段落和后续复测，不必全部塞入一篇。',
'官网已有明确主题时优先更新原URL。不同模型名、城市名、同义词不分别复制同模板文章。',
'每篇至少增加一个独有例子/可填表/判断条件。服务范围、案例、价格和效果必须有依据；不借代运营关键词声称品沐提供未确认的全托管服务。',
'地域词和品牌词在已有对应页集中补齐；新题含4篇品牌合作，20篇非品牌问题，非品牌占比83.3%。',
'H来源表示腾讯配置问题原句，可能没有返回答案；E为现有内容或历史意图扩展，N为本轮新增候选。三者均不能直接称为热搜词。',
'上线后再记录公开URL、发布日、搜索查询和AI引用来源；关键词标签或规划完成本身不证明排名和引用提升。',
'首批优先N01、N03、N05、N07、N09、N10、N13、N19；先形成可审阅正文，再按平台改写标题和开篇。',
'本轮新词复测设独立版本与观察起点，不替换原24题后混算提升率。'
];
notes.push('关键词承接编号为空且有官网URL时，表示历史问题已由其他现有页面回答；不额外计为本轮12篇旧文任务。新文章尚无公开URL，只列N编号。');
notes.push('平台建议基于题型与读者匹配：知乎适合明确问题与采购比较，公众号适合品牌合作和经营复盘，搜狐号作为选定常青文章的补充分发。账号权限和具体发布规则在执行时确认。');
const data={date:'2026-10-24',articles,keywords,updates,sources,notes,counts:{articles:articles.length,keywords:keywords.length,updates:updates.length,existingArticles:insights.length,branded:articles.filter(a=>a.branded).length,historicalQuestions:original.length}};
await fs.writeFile(new URL('plan-data.json',dir),JSON.stringify(data,null,2)+'\n');
return data;
}

const result=await build(geoEntries);
console.log(JSON.stringify(result.counts));
