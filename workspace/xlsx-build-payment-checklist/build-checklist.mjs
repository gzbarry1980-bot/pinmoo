import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = 'E:/pinmoo/outputs/zhongkao-payment-readiness';
const outputPath = `${outputDir}/广州中考付费网站_用户办理清单.xlsx`;

const COLORS = {
  navy: '#0B2A4A',
  blue: '#174D7A',
  teal: '#168C83',
  paleBlue: '#EAF2F8',
  paleTeal: '#E8F6F3',
  paleAmber: '#FFF5D6',
  paleRed: '#FDECEC',
  paleGray: '#F4F6F8',
  border: '#D7DEE5',
  text: '#24313D',
  muted: '#5D6A75',
  white: '#FFFFFF',
  green: '#DCF3E7',
};

const tasks = [
  [1, '微信公众平台', 'P0', '现在', '确认公众号类型', '确认“品沐咨询”是已认证服务号，或属于微信文档列明可申请 JSAPI 支付的账号类型。', 'https://pay.wechatpay.cn/doc/v3/merchant/4015423216', '公众号类型明确，后台显示认证有效。', '只告诉我：账号类型、是否已认证。', '未开始', null, 'JSAPI 支付的首要前置条件。'],
  [2, '微信公众平台', 'P0', '现在', '完成公众号认证', '如果尚未认证，在微信公众平台提交认证；已认证则核对认证主体与微信支付商户主体。', 'https://mp.weixin.qq.com/', '认证状态为有效，主体信息可用于支付申请。', '只告诉我：已认证/待审核/主体不一致。', '未开始', null, '不要发送管理员密码。'],
  [3, '微信支付', 'P0', '现在', '申请或确认微信支付商户号', '登录微信支付商户平台；没有商户号则申请，有则确认超级管理员可正常登录。', 'https://pay.weixin.qq.com/', '取得可用商户号，商户主体审核通过。', '可填写商户号 MchID；它不是密钥。', '未开始', null, '不要发送登录验证码。'],
  [4, '微信支付', 'P0', '现在', '开通 JSAPI 支付产品', '在商户平台开通 JSAPI 支付权限；按平台要求补充经营场景和网站信息。', 'https://pay.wechatpay.cn/doc/v3/merchant/4015423216', '商户平台显示 JSAPI 支付已开通。', '只告诉我：已开通/审核中/被驳回及驳回原因。', '未开始', null, '当前优先接微信内支付。'],
  [5, '微信支付', 'P0', '现在', '绑定公众号 AppID 与商户号', '先在商户平台发起 AppID 绑定，再到微信公众平台确认授权。', 'https://pay.wechatpay.cn/doc/v3/merchant/4015423216', '商户平台与公众平台均显示绑定成功。', '可填写 AppID 与 MchID；不要提供 AppSecret。', '未开始', null, '两边都要确认。'],
  [6, '微信支付', 'P0', '现在', '配置技术负责人和安全联系人', '由商户超级管理员在商户平台设置技术负责人，确保能接收证书、风控和支付异常提醒。', 'https://pay.wechatpay.cn/doc/v3/merchant/4015423216', '技术负责人账号可登录并收到提醒。', '只告诉我：已完成。', '未开始', null, '建议不要多人共用超级管理员账号。'],
  [7, '公众号域名', 'P0', '现在', '配置网页授权域名与 JS 接口安全域名', '在公众号后台按平台要求配置 zhongkao.pinmoo.top；如需上传域名验证文件，下载后交给我部署。', 'https://mp.weixin.qq.com/', '公众号后台域名配置保存成功。', '告诉我：配置结果；如有验证文件，发文件本身，不要发账号密码。', '未开始', null, '通常不填写 https:// 和路径，以后台提示为准。'],
  [8, '微信支付', 'P0', '现在', '配置 JSAPI 支付授权目录', '商户平台配置支付授权目录：https://zhongkao.pinmoo.top/ 。', 'https://pay.wechatpay.cn/doc/v3/merchant/4015423216', '授权目录审核/保存成功。', '只告诉我：已配置。', '未开始', null, '目录必须包含末尾斜杠。'],
  [9, '微信支付安全', 'P0', '现在', '申请商户 API 证书', '在本地使用微信支付证书工具申请证书，妥善保存 apiclient_key.pem 私钥。', 'https://pay.wechatpay.cn/doc/v3/merchant/4024350132', '证书生效，已保存证书序列号和私钥备份。', '只给我证书序列号；私钥不要填表或发聊天。', '未开始', null, '之后我会给安全上传命令。'],
  [10, '微信支付安全', 'P0', '现在', '设置 APIv3 密钥', '在商户平台“账户中心 → API安全”设置 32 位 APIv3 密钥，并离线保存。', 'https://pay.wechatpay.cn/doc/v3/merchant/4024350132', 'APIv3 密钥设置成功，并有安全备份。', '只告诉我：已设置；绝不回传密钥内容。', '未开始', null, '丢失后只能重设。'],
  [11, '微信支付安全', 'P0', '现在', '申请微信支付公钥', '在商户平台申请微信支付公钥，下载 pub_key.pem，并记录公钥 ID。', 'https://pay.wechatpay.cn/doc/v3/merchant/4024350132', '公钥文件与 PUB_KEY_ID 均已保存。', '可填写 PUB_KEY_ID；公钥文件后续按安全方式上传。', '未开始', null, '微信官方当前推荐公钥方案。'],
  [12, '支付方式', 'P1', '现在', '确认站外支付方式', '建议选择“微信内 JSAPI + 电脑端 Native 二维码”；确认是否还需要手机浏览器 H5 支付。', 'https://pay.wechatpay.cn/doc/v3/merchant/4012791856', '支付方式范围确定。', '填写：JSAPI+Native，或 JSAPI+Native+H5。', '未开始', null, 'H5 支付可能增加额外域名和资质要求。'],
  [13, '阿里云短信', 'P0', '现在', '开通短信服务', '登录阿里云短信控制台，开通国内短信服务。', 'https://dysms.console.aliyun.com/overview', '控制台可进入国内消息并创建签名/模板。', '只告诉我：已开通。', '未开始', null, '验证码登录依赖此项。'],
  [14, '阿里云短信', 'P0', '现在', '提交短信资质', '按运营商实名要求提交广州品沐咨询有限公司相关资质材料。', 'https://help.aliyun.com/zh/sms/user-guide/usage-notes', '短信资质审核通过。', '告诉我：审核通过/审核中/驳回原因。', '未开始', null, '审核规则以控制台实时提示为准。'],
  [15, '阿里云短信', 'P0', '现在', '申请短信签名', '申请能明确识别主体的验证码短信签名，建议优先尝试“品沐咨询”。', 'https://help.aliyun.com/zh/sms/user-guide/create-signatures/', '签名审核通过。', '填写审核通过的 SignName。', '未开始', null, '不要使用“测试”等字样。'],
  [16, '阿里云短信', 'P0', '现在', '申请验证码模板', '创建验证码类型模板，示例：您的验证码为 ${code}，5分钟内有效，请勿泄露。以控制台变量规范为准。', 'https://help.aliyun.com/zh/sms/product-overview/product-function-node-dysms', '验证码模板审核通过。', '填写 TemplateCode；无需提供模板密钥。', '未开始', null, '签名与模板必须都审核通过。'],
  [17, '阿里云安全', 'P0', '现在', '创建最小权限 RAM 用户', '在 RAM 控制台创建仅用于发短信的子账号，并只授予必要的短信发送权限。', 'https://ram.console.aliyun.com/users', '独立 RAM 用户可调用短信服务。', '只告诉我：RAM 用户已建、AccessKey 已保存；不要填 Secret。', '未开始', null, '不要使用阿里云主账号 AccessKey。'],
  [18, '阿里云短信', 'P1', '现在', '充值并准备测试额度', '为短信服务准备少量余额，确保能发送验证码测试。', 'https://dysms.console.aliyun.com/overview', '余额可用，测试号码已准备。', '告诉我：可以开始短信联调。', '未开始', null, '先做小规模测试。'],
  [19, '公众号权益', 'P0', '现在', '确认关注权益规则', '确认关注公众号可免费使用多久；建议“关注期间有效，取消关注只撤销关注权益，已付费权益永久不受影响”。', 'https://mp.weixin.qq.com/', '规则书面确认。', '在“回传给Codex”页填写最终规则。', '未开始', null, '避免误撤销付费用户。'],
  [20, '公众号权益', 'P0', '等我通知', '配置关注/取消关注事件回调', '等我部署事件接口后，在公众号后台填写服务器 URL、Token 和 EncodingAESKey。', 'https://mp.weixin.qq.com/', '公众号后台服务器配置验证通过。', '只告诉我：验证通过；Token/AESKey 不写表、不发聊天。', '等待Codex', null, '我会先提供回调 URL 和安全配置步骤。'],
  [21, '定价与权益', 'P0', '现在', '确认 9.99 元权益定义', '确认：一次支付 9.99 元、不自动续费、账号长期使用；同时明确“长期”以本系统持续运营为边界。', 'https://zhongkao.pinmoo.top/unlock/', '权益描述最终确认。', '在“回传给Codex”页填写同意或修改意见。', '未开始', null, '避免形成无限期经营承诺歧义。'],
  [22, '售后规则', 'P0', '现在', '确定退款规则', '建议明确误购、重复支付、无法使用等场景的退款窗口和处理方式。', 'https://zhongkao.pinmoo.top/unlock/', '形成可公开展示的退款说明。', '在“回传给Codex”页填写最终规则。', '未开始', null, '支付前页面必须可查看。'],
  [23, '合规文本', 'P0', '现在', '确认隐私政策与付费协议', '确认手机号用途、保存方式、账号注销、权益恢复、免责声明及争议处理主体。', 'https://zhongkao.pinmoo.top/unlock/', '隐私政策、用户协议、付费说明可上线。', '告诉我：采用建议稿或提供修改意见。', '未开始', null, '不收集姓名、准考证或联系方式以外身份信息。'],
  [24, '客服与票据', 'P1', '现在', '确认客服与开票口径', '确认客服电话/公众号客服、服务时间，以及用户是否可以申请发票。', 'https://zhongkao.pinmoo.top/unlock/', '客服和开票说明确定。', '填写客服方式、服务时间和开票规则。', '未开始', null, '当前公开联系电话为 13600008584。'],
  [25, '上线验收', 'P0', '等我通知', '安排真实支付与退款测试', '准备一个微信测试账号和一笔 9.99 元真实支付；验收权益到账、换设备恢复、重复购买拦截和退款。', 'https://zhongkao.pinmoo.top/unlock/', '全链路测试通过且退款完成。', '告诉我可测试时间；不要提供支付密码。', '等待Codex', null, '未通过前不会启用强制付费。'],
];

const handoff = [
  ['公众号类型', '', '例如：已认证服务号', '可填写'],
  ['公众号认证状态', '', '已认证 / 待审核 / 主体不一致', '可填写'],
  ['公众号 AppID', '', 'wx 开头；不要填写 AppSecret', '可填写'],
  ['微信支付商户号 MchID', '', '数字商户号', '可填写'],
  ['JSAPI 支付状态', '', '已开通 / 审核中 / 驳回', '可填写'],
  ['AppID 与 MchID 绑定状态', '', '两边均确认成功', '可填写'],
  ['商户 API 证书序列号', '', '只填序列号，不填私钥', '可填写'],
  ['微信支付公钥 ID', '', 'PUB_KEY_ID_...', '可填写'],
  ['支付方式选择', '', '建议：JSAPI + Native', '可填写'],
  ['短信资质状态', '', '通过 / 审核中 / 驳回原因', '可填写'],
  ['短信签名 SignName', '', '例如：品沐咨询', '可填写'],
  ['短信模板 TemplateCode', '', '审核通过的模板 CODE', '可填写'],
  ['RAM 用户与 AccessKey', '', '只填“已创建并安全保存”，不要填 Secret', '仅填状态'],
  ['关注权益规则', '', '建议：关注期间有效，取消关注撤销 follow 权益', '可填写'],
  ['9.99 元权益描述', '', '确认或提出修改', '可填写'],
  ['退款规则', '', '填写最终决定', '可填写'],
  ['客服方式与服务时间', '', '电话/公众号客服/时间', '可填写'],
  ['开票规则', '', '支持/不支持及申请方式', '可填写'],
  ['预计可联调日期', null, '填写方便进行支付测试的日期', '可填写'],
];

const codexTasks = [
  [1, '短信验证码适配器', '等待用户前置', '接入阿里云 SendSms、发送回执和生产限流。'],
  [2, '微信 OAuth 与 OpenID', '等待用户前置', '完成公众号网页授权，获得 JSAPI 下单所需 OpenID。'],
  [3, 'JSAPI 与 Native 支付', '等待用户前置', '实现微信内调起支付和电脑端二维码支付。'],
  [4, '支付回调与幂等入账', '等待用户前置', '完成验签、AES-GCM 解密、金额/商户核验和重复通知处理。'],
  [5, '订单查询、关单与退款', '等待用户前置', '不能只依赖回调；补齐主动查单和退款流程。'],
  [6, '公众号关注权益', '等待用户前置', '接入 subscribe/unsubscribe 事件，只撤销 follow 来源权益。'],
  [7, '协议与隐私页面', '等待用户确认', '根据用户确认内容制作隐私政策、付费协议和退款说明。'],
  [8, '加密备份与恢复', '待实施', '上线权益数据库自动备份、保留周期和恢复演练。'],
  [9, '真实支付验收', '等待用户前置', '完成 9.99 元支付、权益恢复、重复购买与退款测试。'],
  [10, '启用强制付费', '等待最终批准', '全部验收后才把 preview 切换为 enforce。'],
];

function styleTitle(sheet, range, title, subtitle) {
  sheet.getRange(range).merge();
  const [start, end] = range.split(':');
  const startColumn = start.match(/[A-Z]+/)[0];
  const endColumn = end.match(/[A-Z]+/)[0];
  sheet.getRange(start).values = [[title]];
  sheet.getRange(range).format = {
    fill: COLORS.navy,
    font: { color: COLORS.white, bold: true, size: 18 },
    verticalAlignment: 'center',
    horizontalAlignment: 'left',
  };
  const row = Number(start.match(/\d+/)[0]);
  sheet.getRange(`${startColumn}${row}:${endColumn}${row}`).format.rowHeight = 34;
  sheet.getRange(`${startColumn}${row + 1}:${endColumn}${row + 1}`).merge();
  sheet.getRange(`${startColumn}${row + 1}`).values = [[subtitle]];
  sheet.getRange(`${startColumn}${row + 1}:${endColumn}${row + 1}`).format = {
    fill: COLORS.paleBlue,
    font: { color: COLORS.muted, italic: true, size: 10 },
    verticalAlignment: 'center',
  };
  sheet.getRange(`${startColumn}${row + 1}:${endColumn}${row + 1}`).format.rowHeight = 30;
}

function styleHeader(range) {
  range.format = {
    fill: COLORS.blue,
    font: { color: COLORS.white, bold: true, size: 10 },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    wrapText: true,
    borders: { preset: 'outside', style: 'thin', color: COLORS.border },
  };
}

const workbook = Workbook.create();
const start = workbook.worksheets.add('开始这里');
const checklist = workbook.worksheets.add('办理清单');
const handoffSheet = workbook.worksheets.add('回传给Codex');
const codexSheet = workbook.worksheets.add('Codex后续');

for (const sheet of [start, checklist, handoffSheet, codexSheet]) sheet.showGridLines = false;

// 开始这里
start.getRange('A1:H2').merge();
start.getRange('A1').values = [['广州中考付费网站｜用户办理清单']];
start.getRange('A1:H2').format = { fill: COLORS.navy, font: { color: COLORS.white, bold: true, size: 20 }, verticalAlignment: 'center' };
start.getRange('A3:H3').merge();
start.getRange('A3').values = [['使用方式：从“办理清单”按序完成；状态改为“已完成”；再把“回传给Codex”页发回来或告诉我非敏感结果。']];
start.getRange('A3:H3').format = { fill: COLORS.paleBlue, font: { color: COLORS.text, size: 11 }, wrapText: true, verticalAlignment: 'center' };

start.getRange('A5:B5').merge();
start.getRange('C5:D5').merge();
start.getRange('E5:F5').merge();
start.getRange('G5:H5').merge();
start.getRange('A5').values = [['全部事项']];
start.getRange('C5').values = [['已完成']];
start.getRange('E5').values = [['待办理']];
start.getRange('G5').values = [['完成率']];
start.getRange('A6:B7').merge();
start.getRange('C6:D7').merge();
start.getRange('E6:F7').merge();
start.getRange('G6:H7').merge();
start.getRange('A6').formulas = [[`=COUNTA('办理清单'!$A$6:$A$${tasks.length + 5})`]];
start.getRange('C6').formulas = [[`=COUNTIF('办理清单'!$J$6:$J$${tasks.length + 5},"已完成")`]];
start.getRange('E6').formulas = [[`=A6-C6`]];
start.getRange('G6').formulas = [[`=IF(A6=0,0,C6/A6)`]];
start.getRange('G6:H7').format.numberFormat = '0%';
start.getRange('A5:H5').format = { fill: COLORS.blue, font: { color: COLORS.white, bold: true }, horizontalAlignment: 'center' };
start.getRange('A6:H7').format = { fill: COLORS.paleTeal, font: { color: COLORS.navy, bold: true, size: 18 }, horizontalAlignment: 'center', verticalAlignment: 'center', borders: { preset: 'all', style: 'thin', color: COLORS.border } };

start.getRange('A9:H9').merge();
start.getRange('A9').values = [['三条安全红线']];
start.getRange('A9:H9').format = { fill: COLORS.navy, font: { color: COLORS.white, bold: true, size: 12 } };
const safetyRows = [
  ['1', '绝不在本表、聊天、邮件或 Git 仓库填写：商户私钥、APIv3 密钥、AppSecret、AccessKey Secret、公众号 Token、EncodingAESKey。'],
  ['2', '密钥准备好后只告诉我“已准备”；我会给你安全上传或服务器录入命令。'],
  ['3', '真实支付验收通过前，网站继续保持 preview，不会误扣款，也不会突然锁住现有工具。'],
];
start.getRange('A10:H12').values = safetyRows.map(([no, text]) => [no, text, null, null, null, null, null, null]);
for (let row = 10; row <= 12; row++) start.getRange(`B${row}:H${row}`).merge();
start.getRange('A10:H12').format = { fill: COLORS.paleAmber, font: { color: COLORS.text, size: 11 }, wrapText: true, verticalAlignment: 'center', borders: { insideHorizontal: { style: 'thin', color: COLORS.border }, outside: { style: 'thin', color: COLORS.border } } };
start.getRange('A10:A12').format = { font: { bold: true, color: '#9A6500' }, horizontalAlignment: 'center', verticalAlignment: 'center' };

start.getRange('A14:H14').merge();
start.getRange('A14').values = [['建议顺序']];
start.getRange('A14:H14').format = { fill: COLORS.teal, font: { color: COLORS.white, bold: true, size: 12 } };
const sequence = [
  ['第1步', '先完成公众号认证、商户号、JSAPI 权限和 AppID 绑定。'],
  ['第2步', '再准备微信证书/APIv3、公钥，以及阿里云短信资质、签名和模板。'],
  ['第3步', '确认权益、退款、隐私和客服规则；把非敏感结果填到“回传给Codex”。'],
  ['第4步', '我接入并测试；你最后安排一笔 9.99 元真实支付和退款验收。'],
];
start.getRange('A15:H18').values = sequence.map(([step, text]) => [step, text, null, null, null, null, null, null]);
for (let row = 15; row <= 18; row++) start.getRange(`B${row}:H${row}`).merge();
start.getRange('A15:H18').format = { fill: COLORS.paleGray, font: { color: COLORS.text, size: 11 }, wrapText: true, verticalAlignment: 'center', borders: { insideHorizontal: { style: 'thin', color: COLORS.border } } };
start.getRange('A15:A18').format = { font: { bold: true, color: COLORS.teal }, horizontalAlignment: 'center' };
start.getRange('A1:H18').format.font.name = 'Microsoft YaHei';
start.getRange('A1:A18').format.columnWidth = 13;
start.getRange('B1:H18').format.columnWidth = 16;
start.getRange('A1:H2').format.rowHeight = 32;
start.getRange('A3:H3').format.rowHeight = 32;
start.getRange('A10:H18').format.rowHeight = 30;
start.freezePanes.freezeRows(3);

// 办理清单
styleTitle(checklist, 'A1:L1', '你需要完成的事项', '状态列可下拉选择。优先处理 P0；“等我通知”的两项暂时不要配置。');
const checklistHeaders = ['序号', '类别', '优先级', '何时做', '事项', '你要做什么', '官方入口 / 网址', '完成标准', '完成后告诉我的信息', '状态', '完成日期', '备注'];
checklist.getRange('A5:L5').values = [checklistHeaders];
styleHeader(checklist.getRange('A5:L5'));
checklist.getRange(`A6:L${tasks.length + 5}`).values = tasks;
checklist.getRange(`A6:L${tasks.length + 5}`).format = { font: { color: COLORS.text, size: 9, name: 'Microsoft YaHei' }, verticalAlignment: 'top', wrapText: true, borders: { insideHorizontal: { style: 'thin', color: COLORS.border } } };
checklist.getRange(`A6:D${tasks.length + 5}`).format.horizontalAlignment = 'center';
checklist.getRange(`J6:K${tasks.length + 5}`).format.horizontalAlignment = 'center';
checklist.getRange(`K6:K${tasks.length + 5}`).format.numberFormat = 'yyyy-mm-dd';
checklist.getRange(`J6:J${tasks.length + 5}`).dataValidation = { rule: { type: 'list', values: ['未开始', '办理中', '待审核', '已完成', '等待Codex', '不适用'] } };
checklist.getRange(`C6:C${tasks.length + 5}`).dataValidation = { rule: { type: 'list', values: ['P0', 'P1', 'P2'] } };
checklist.getRange(`A6:L${tasks.length + 5}`).conditionalFormats.addCustom('=$J6="已完成"', { fill: COLORS.green, font: { color: '#176B45' } });
checklist.getRange(`A6:L${tasks.length + 5}`).conditionalFormats.addCustom('=$J6="等待Codex"', { fill: COLORS.paleBlue, font: { color: COLORS.blue } });
checklist.getRange(`A6:L${tasks.length + 5}`).conditionalFormats.addCustom('=$J6="待审核"', { fill: COLORS.paleAmber, font: { color: '#8A6200' } });
checklist.getRange(`A6:L${tasks.length + 5}`).conditionalFormats.addCustom('=$C6="P0"', { font: { bold: true } });
const checklistTable = checklist.tables.add(`A5:L${tasks.length + 5}`, true, 'PaymentReadinessTasks');
checklistTable.style = 'TableStyleMedium2';
checklistTable.showBandedColumns = false;
checklistTable.showFilterButton = true;
checklist.freezePanes.freezeRows(5);
const checklistWidths = [6, 13, 8, 10, 24, 42, 45, 30, 32, 12, 13, 27];
checklistWidths.forEach((width, index) => checklist.getRangeByIndexes(0, index, tasks.length + 5, 1).format.columnWidth = width);
checklist.getRange('A1:L1').format.rowHeight = 34;
checklist.getRange('A2:L2').format.rowHeight = 30;
checklist.getRange('A5:L5').format.rowHeight = 35;
checklist.getRange(`A6:L${tasks.length + 5}`).format.rowHeight = 68;

// 回传给 Codex
styleTitle(handoffSheet, 'A1:D1', '完成后回传给 Codex 的信息', '这里只填写非敏感结果。标记为密钥、Secret、私钥的内容一律不要写入 Excel 或聊天。');
handoffSheet.getRange('A5:D5').values = [['信息项', '你的填写', '填写说明', '安全级别']];
styleHeader(handoffSheet.getRange('A5:D5'));
handoffSheet.getRange(`A6:D${handoff.length + 5}`).values = handoff;
handoffSheet.getRange(`A6:D${handoff.length + 5}`).format = { font: { color: COLORS.text, size: 10, name: 'Microsoft YaHei' }, verticalAlignment: 'center', wrapText: true, borders: { insideHorizontal: { style: 'thin', color: COLORS.border } } };
handoffSheet.getRange(`B6:B${handoff.length + 5}`).format = { fill: '#FFFBEA', font: { color: COLORS.navy, size: 10, name: 'Microsoft YaHei' }, wrapText: true, borders: { preset: 'outside', style: 'thin', color: '#E3C965' } };
handoffSheet.getRange(`D6:D${handoff.length + 5}`).format.horizontalAlignment = 'center';
handoffSheet.getRange('A27:D29').merge(false);
handoffSheet.getRange('A27').values = [['严禁填写：AppSecret、商户私钥、APIv3 密钥、AccessKey Secret、支付密码、公众号 Token、EncodingAESKey。准备好后只写“已安全保存”。']];
handoffSheet.getRange('A27:D29').format = { fill: COLORS.paleRed, font: { color: '#9A2626', bold: true, size: 11 }, wrapText: true, verticalAlignment: 'center', horizontalAlignment: 'center', borders: { preset: 'outside', style: 'medium', color: '#D95C5C' } };
handoffSheet.getRange('A1:D29').format.font.name = 'Microsoft YaHei';
[22, 34, 48, 14].forEach((width, index) => handoffSheet.getRangeByIndexes(0, index, 29, 1).format.columnWidth = width);
handoffSheet.getRange('A5:D5').format.rowHeight = 32;
handoffSheet.getRange(`A6:D${handoff.length + 5}`).format.rowHeight = 38;
handoffSheet.getRange('A27:D29').format.rowHeight = 28;
handoffSheet.freezePanes.freezeRows(5);

// Codex 后续
styleTitle(codexSheet, 'A1:D1', '你完成前置后，我继续实施的事项', '这些技术事项由我处理，你不需要自己写代码；完成顺序以支付和短信资质到位为前提。');
codexSheet.getRange('A5:D5').values = [['序号', '技术事项', '当前状态', '我会完成什么']];
styleHeader(codexSheet.getRange('A5:D5'));
codexSheet.getRange(`A6:D${codexTasks.length + 5}`).values = codexTasks;
codexSheet.getRange(`A6:D${codexTasks.length + 5}`).format = { font: { color: COLORS.text, size: 10, name: 'Microsoft YaHei' }, verticalAlignment: 'center', wrapText: true, borders: { insideHorizontal: { style: 'thin', color: COLORS.border } } };
codexSheet.getRange(`A6:A${codexTasks.length + 5}`).format.horizontalAlignment = 'center';
codexSheet.getRange(`C6:C${codexTasks.length + 5}`).format = { fill: COLORS.paleAmber, font: { color: '#8A6200', bold: true }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true };
codexSheet.getRange('A1:D15').format.font.name = 'Microsoft YaHei';
[8, 28, 18, 58].forEach((width, index) => codexSheet.getRangeByIndexes(0, index, 15, 1).format.columnWidth = width);
codexSheet.getRange('A5:D5').format.rowHeight = 32;
codexSheet.getRange(`A6:D${codexTasks.length + 5}`).format.rowHeight = 46;
codexSheet.freezePanes.freezeRows(5);

await fs.mkdir(outputDir, { recursive: true });

const inspect = await workbook.inspect({
  kind: 'table',
  range: `办理清单!A1:L${tasks.length + 5}`,
  include: 'values,formulas',
  tableMaxRows: 8,
  tableMaxCols: 12,
  maxChars: 7000,
});
console.log(inspect.ndjson);

const errorScan = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
});
console.log(errorScan.ndjson);

for (const [sheetName, range] of [
  ['开始这里', 'A1:H18'],
  ['办理清单', `A1:L${tasks.length + 5}`],
  ['回传给Codex', 'A1:D29'],
  ['Codex后续', 'A1:D15'],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(`${outputDir}/preview-${sheetName}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
