import {readWorkspace,migrateDraft} from './workspace-store.js';
import {simplifyVisibleCopy} from './parent-copy.js';
import {installFormLayout} from './form-layout.js';
import {installDynamicUI} from './dynamic-ui.js?v=20261012-minimal';
export const disclaimer='本系统依据公开招生政策及历史数据进行模拟分析，所示评分、录取机会和学校建议均为统计估计，不代表官方录取结果或任何录取承诺。招生政策、计划、报考范围、成绩分布和志愿竞争每年可能变化，请以当年广州市教育局、广州市招生考试委员会办公室及中考服务平台最终公布的信息为准。名额分配、随迁子女、跨区及其他资格请向学校或招考部门核实。志愿选择由考生及监护人自行决定。本系统仅供参考。';

// 检测当前是否运行在微信小程序 web-view 内。
// 优先读 URL 参数 zk_inmini（由小程序 embed.js 注入，最可靠），再退化到 wx 对象探测。
export function isMiniProgram() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('zk_inmini') === '1') return true;
  } catch (_) {}
  try {
    if (window.__wxjs_environment === 'miniprogram') return true;
  } catch (_) {}
  try {
    if (typeof wx !== 'undefined' && wx && wx.miniProgram && typeof wx.miniProgram.navigateTo === 'function') return true;
  } catch (_) {}
  return false;
}

// 当确认在小程序内时，给当前页面所有同域相对链接自动追加 zk_inmini=1，
// 防止用户在 web-view 里点击导航后跳转到丢失环境标记的新页面。
function ensureZkInminiLinks() {
  if (!isMiniProgram()) return;
  document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    try {
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return;
      if (url.searchParams.get('zk_inmini') === '1') return;
      url.searchParams.set('zk_inmini', '1');
      a.setAttribute('href', url.pathname + url.search + url.hash);
    } catch (_) {}
  });
}
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function notify(message){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=message;el.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),3000);}
const entries=[['/','首页'],['/schools/','查学校'],['/plans/','我的方案'],['/my/','我的']];
function loadSiteStyle(file,marker){
  let css=[...document.querySelectorAll('link[rel="stylesheet"]')].find(link=>new URL(link.href,location.href).pathname===`/${file}`);
  if(!css){css=document.createElement('link');css.rel='stylesheet';}
  css.href=`/${file}?v=20261012-minimal`;css.dataset[marker]='';document.head.append(css);
}
export function initShell(){
  if(location.pathname.includes('/serial-key/')) return;
  if(document.body.dataset.shellReady==='true')return;
  loadSiteStyle('experience.css','experienceStyle');
  loadSiteStyle('ui-redesign-20261011.css','uiRedesignStyle');
  const path=location.pathname;
  loadSiteStyle('batch-layout.css','batchLayout');
  const section=path.includes('/schools/')?'/schools/':/\/(direction|target|verify|plans)\//.test(path)?'/plans/':/\/(my|unlock)\//.test(path)?'/my/':'/';
  const inMini=isMiniProgram();
  document.body.dataset.inMini=String(inMini);
  const appendMini=(url)=>{if(!inMini||url.startsWith('http')||url.includes('zk_inmini=1'))return url;return url+(url.includes('?')?'&':'?')+'zk_inmini=1';};
  const links=entries.map(([url,label])=>`<a href="${appendMini(url)}" ${url===section?'aria-current="page"':''}>${label}</a>`).join('');
  let nav=document.querySelector('.site-nav');
  const version=document.getElementById('dataVersion');
  if(nav&&version&&nav.contains(version)){version.classList.add('note');document.querySelector('main')?.append(version);}
  if(!nav){nav=document.createElement('nav');document.body.prepend(nav);}nav.className='site-nav';nav.setAttribute('aria-label','主导航');nav.innerHTML=`<a class="brand" href="${appendMini('/')}">品沐 · 广州中考志愿助手</a><div class="nav-links">${links}<a href="https://pinmooconsulting.com/" target="_blank" rel="noreferrer">品沐咨询官网</a></div>`;
  // 小程序已有原生 tabBar，不要再注入 H5 内嵌 mobile-nav，避免底部出现两行菜单。
  if(!inMini&&!document.querySelector('.mobile-nav')){const mobile=document.createElement('nav');mobile.className='mobile-nav';mobile.setAttribute('aria-label','快捷导航');mobile.innerHTML=links;document.body.append(mobile);}
  document.querySelector('.mode-nav')?.remove();
  document.querySelectorAll('.quick-return').forEach(el=>el.hidden=true);
  if(/\/(special|quota|verify|direction|target)\//.test(path)&&!document.querySelector('.batch-breadcrumb')){
    const label=path.includes('/special/')?'第一批 · 特长与自主招生':path.includes('/quota/')?'第二批 · 名额分配':'第三、第四批 · 普通高中志愿';
    const crumb=document.createElement('nav');crumb.className='batch-breadcrumb';crumb.setAttribute('aria-label','页面位置');crumb.innerHTML=`<a href="/">← 返回首页</a><span>${label}</span>`;document.querySelector('main')?.prepend(crumb);
  }
  // Direction and target already have a descriptive heading in their working form.
  if(/\/(direction|target)\//.test(path)) document.querySelector('.page-hero')?.remove();
  if(!document.querySelector('.disclaimer')) document.querySelector('main')?.insertAdjacentHTML('beforeend',`<section class="disclaimer"><strong>免责声明</strong><p>${disclaimer}</p></section>`);
  if(!document.querySelector('footer'))document.body.insertAdjacentHTML('beforeend','<footer><span>广州中考志愿模拟助手 · 由品沐提供</span><span><a href="/privacy/">隐私说明</a> · <a href="/unlock/">序列号与解锁状态</a> · <a href="https://gzzk.gz.gov.cn/zkzz/" target="_blank" rel="noreferrer">广州招考官方入口</a></span></footer>');
  try{migrateDraft();}catch{notify('本机存储不可用，收藏和方案可能无法保存。');}
  document.querySelectorAll('[data-school-search]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const q=new FormData(form).get('q');location.assign(`/schools/?q=${encodeURIComponent(q||'')}`);}));
  refreshContinuePlan();
  installFormLayout();
  installDynamicUI();
  loadSiteStyle('minimal-ui.css','minimalUiStyle');
  loadSiteStyle('typography.css','typographyStyle');
  // 小程序内所有同域链接追加 zk_inmini=1，确保跳转后环境判定不失效；同时已在上文屏蔽 mobile-nav。
  ensureZkInminiLinks();
  simplifyVisibleCopy(document.body);
  document.body.dataset.shellReady='true';
}
export function refreshContinuePlan(){const el=document.querySelector('#continuePlan');if(!el)return;const s=readWorkspace(),active=s.plans.find(p=>p.id===s.activePlanId);el.hidden=!active;if(active)el.innerHTML=`<span><small>继续本机保存的方案</small><br><strong>${escapeHTML(active.name)}</strong> · ${active.plan.filter(r=>r.schoolId).length}个志愿</span><a class="button-primary" href="/verify/?plan=${encodeURIComponent(active.id)}">继续编辑</a>`;}
initShell();
