import {readWorkspace,migrateDraft} from './workspace-store.js';
import {simplifyVisibleCopy} from './parent-copy.js';
import {installFormLayout} from './form-layout.js';
import {installDynamicUI} from './dynamic-ui.js';
export const disclaimer='本系统依据公开招生政策及历史数据进行模拟分析，所示评分、录取机会和学校建议均为统计估计，不代表官方录取结果或任何录取承诺。招生政策、计划、报考范围、成绩分布和志愿竞争每年可能变化，请以当年广州市教育局、广州市招生考试委员会办公室及中考服务平台最终公布的信息为准。名额分配、随迁子女、跨区及其他资格请向学校或招考部门核实。志愿选择由考生及监护人自行决定。本系统仅供参考。';
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function notify(message){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=message;el.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),3000);}
const entries=[['/','首页'],['/schools/','查学校'],['/plans/','我的方案'],['/my/','我的']];
export function initShell(){
  if(location.pathname.includes('/serial-key/')) return;
  if(!document.querySelector('[data-experience-style]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/experience.css?v=20261005';css.dataset.experienceStyle='';document.head.append(css);}
  const path=location.pathname;
  if(!document.querySelector('[data-batch-layout]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/batch-layout.css?v=20261005b';css.dataset.batchLayout='';document.head.append(css);}
  const section=path.includes('/schools/')?'/schools/':/\/(direction|target|verify|plans)\//.test(path)?'/plans/':/\/(my|unlock)\//.test(path)?'/my/':'/';
  const links=entries.map(([url,label])=>`<a href="${url}" ${url===section?'aria-current="page"':''}>${label}</a>`).join('');
  let nav=document.querySelector('.site-nav');
  const version=document.getElementById('dataVersion');
  if(nav&&version&&nav.contains(version)){version.classList.add('note');document.querySelector('main')?.append(version);}
  if(!nav){nav=document.createElement('nav');document.body.prepend(nav);}nav.className='site-nav';nav.setAttribute('aria-label','主导航');nav.innerHTML=`<a class="brand" href="/">品沐 · 广州中考志愿助手</a><div class="nav-links">${links}<a href="https://pinmooconsulting.com/" target="_blank" rel="noreferrer">品沐咨询官网</a></div>`;
  if(!document.querySelector('.mobile-nav')){const mobile=document.createElement('nav');mobile.className='mobile-nav';mobile.setAttribute('aria-label','快捷导航');mobile.innerHTML=links;document.body.append(mobile);}
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
  simplifyVisibleCopy(document.body);
}
export function refreshContinuePlan(){const el=document.querySelector('#continuePlan');if(!el)return;const s=readWorkspace(),active=s.plans.find(p=>p.id===s.activePlanId);el.hidden=!active;if(active)el.innerHTML=`<span><small>继续本机保存的方案</small><br><strong>${escapeHTML(active.name)}</strong> · ${active.plan.filter(r=>r.schoolId).length}个志愿</span><a class="button-primary" href="/verify/?plan=${encodeURIComponent(active.id)}">继续编辑</a>`;}
initShell();
