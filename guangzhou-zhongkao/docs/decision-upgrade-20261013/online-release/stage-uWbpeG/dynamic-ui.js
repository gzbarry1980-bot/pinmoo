import {loadSchoolData,historyFor,schoolDistrict,schoolURL} from './school-service.js';
import {readWorkspace} from './workspace-store.js';
import {installStepActions} from './workflow-ui.js?v=20261013-flow';
import {installMinimalWorkspace} from './minimal-ui.js?v=20261013-flow';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function upgradeHome(){
 const hero=document.querySelector('.batch-home-hero');if(!hero)return;
 document.body.classList.add('minimal-home');
 hero.className='launch-hero';hero.innerHTML=`<div class="launch-copy"><h1>你想先做什么？</h1><p>选一种方式，直接开始。</p><div class="home-start-options"><a class="home-start-option" href="/verify/?new=1"><strong>按分数生成</strong><span>还没选好学校</span></a><a class="home-start-option home-start-target" href="/verify/?new=1&amp;start=target#targetPlanning"><strong>目标学校</strong><span>看看需要多少分</span></a><a class="home-start-option" href="/verify/?new=1&amp;start=intent#intentPlanning"><strong>心仪学校</strong><span>帮你排顺序</span></a><a class="home-start-option" href="/verify/?new=1&amp;start=manual#volunteerForm"><strong>已有志愿</strong><span>检查填报方案</span></a></div><small>仅供参考 · 不保证录取</small></div><figure class="launch-art"><img src="/assets/family-planning-20261005.webp" alt="家长与孩子讨论升学计划的示意插画" width="1536" height="1024" fetchpriority="high"></figure>`;
 const search=document.querySelector('.home-school-search');hero.after(search);search.querySelector('h2').textContent='查学校';
 const help=document.createElement('details');help.className='editorial-section home-quick-help';help.innerHTML='<summary>第一次使用？</summary><ol><li>填分数和考生条件。</li><li>确认学校，排好顺序。</li><li>看评分、风险与建议。</li></ol>';
 document.querySelector('.batch-entry-grid')?.after(help);
}
function installWorkspace(){
 const workspace=document.getElementById('verifyWorkspace');if(!workspace||workspace.dataset.dynamicReady||document.body.dataset.uiReady!=='true')return;
 workspace.dataset.dynamicReady='true';
 const guide=workspace.querySelector('.workflow-guide');const layout=document.createElement('div');layout.className='workspace-layout';const content=document.createElement('div');content.className='workspace-content';
 for(const node of [...workspace.children])if(node!==guide)content.append(node);layout.append(content);workspace.append(layout);
 const aside=document.createElement('aside');aside.className='workspace-summary';aside.setAttribute('aria-label','当前方案条件');aside.innerHTML='<details><summary id="compactProfileLabel">当前条件</summary><dl id="liveProfileSummary"></dl></details>';layout.prepend(aside);
 const tabs=document.createElement('div');tabs.className='workspace-mode-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','选择使用方式');tabs.innerHTML='<button type="button" data-start-mode="score" aria-pressed="true">按分数</button><button type="button" data-start-mode="target" aria-pressed="false">目标学校</button><button type="button" data-start-mode="intent" aria-pressed="false">心仪学校</button><button type="button" data-start-mode="manual" aria-pressed="false">已有志愿</button>';guide.before(tabs);
 tabs.addEventListener('click',event=>{const button=event.target.closest('[data-start-mode]');if(!button)return;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const mode=button.dataset.startMode;document.body.dataset.entryMode=mode;document.querySelector('.page-hero h1').textContent={score:'生成志愿',target:'看目标校',intent:'排心仪校',manual:'评估志愿'}[mode];document.dispatchEvent(new CustomEvent('zk-workflow-navigate',{detail:{step:mode==='manual'?'plan':'profile'}}));if(mode==='target'||mode==='intent'){const target=document.getElementById(mode==='intent'?'intentPlanning':'targetPlanning');if(target){target.open=true;window.ZhongkaoNavigation?.scrollTo(target);document.getElementById(mode==='intent'?'intentSearch':'targetSchoolName')?.focus({preventScroll:true});}}else{window.ZhongkaoNavigation?.scrollTo(mode==='manual'?'#volunteerForm':'#profile');if(mode==='manual')document.getElementById('manualUnified')?.click();}});
 document.querySelector('.score-overview')?.insertAdjacentHTML('afterend','<div id="planChangeFeedback" class="change-feedback" role="status" hidden></div>');
 const start=new URLSearchParams(location.search).get('start');if(['manual','intent','target'].includes(start))tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.startMode===start)));
 document.body.dataset.entryMode=['manual','intent','target'].includes(start)?start:'score';
 installMinimalWorkspace(workspace);
 installStepActions();
 if(['manual','intent','target'].includes(start))requestAnimationFrame(()=>tabs.querySelector(`[data-start-mode="${start}"]`).click());
}
function field(id){return document.getElementById(id)?.value||'';}
let summaryKey='',beforeAdjustment=null,resultKey='';
function snapshot(){return {score:document.getElementById('totalScore')?.textContent,schools:[...document.querySelectorAll('.school-select')].map(el=>({key:el.dataset.key,id:el.value,name:el.selectedOptions[0]?.textContent}))};}
function updateWorkspace(){
 const summary=document.getElementById('liveProfileSummary');if(!summary)return;
 const schools=document.querySelectorAll('.school-select');const count=[...schools].filter(el=>el.value).length;
 const values=[`${field('scoreLow')}—${field('scoreHigh')}分`,field('candidateType'),field('admissionDistrict'),field('riskPreference'),`${count}个已填志愿`];const key=values.join('|');
 if(key!==summaryKey){summaryKey=key;summary.innerHTML=['估分范围','考生类别','升学区域','方案偏好','填写情况'].map((label,i)=>`<dt>${label}</dt><dd>${esc(values[i])}</dd>`).join('');const brief=values.slice(0,3).join(' · ');document.getElementById('compactProfileLabel').textContent=brief;document.querySelectorAll('.mode-condition-values').forEach(el=>el.textContent=brief);}
 const analysis=document.getElementById('analysis');if(!analysis||analysis.dataset.stale!=='false')return;
 const current=snapshot(),keyNow=JSON.stringify(current);if(keyNow===resultKey)return;resultKey=keyNow;
 if(beforeAdjustment){const changes=current.schools.filter(row=>beforeAdjustment.schools.find(old=>old.key===row.key)?.id!==row.id);const feedback=document.getElementById('planChangeFeedback');const previous=Number(beforeAdjustment.score),next=Number(current.score);feedback.hidden=false;feedback.innerHTML=`<strong>${Number.isFinite(previous)&&Number.isFinite(next)?`方案合理度 ${previous} → ${next}分`:'方案已完成评估'}</strong><p>${changes.length?`本次调整了${changes.length}个志愿位置。`:'本次沿用学校，重新核对当前分数与条件。'}${changes.slice(0,3).map(row=>`${esc(row.key.replace('b3-','第三批第').replace('b4-','第四批第'))}志愿：${esc(row.name||'未填')}`).join('；')}</p><p>查看下方可能去向与具体建议；机会均为统计估计。</p>`;beforeAdjustment=null;}
}
async function schoolPreview(id,trigger){
 let dialog=document.getElementById('quickSchoolPreview');if(!dialog){dialog=document.createElement('dialog');dialog.id='quickSchoolPreview';dialog.className='school-preview-dialog';dialog.setAttribute('aria-label','学校快速预览');document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-close-preview]'))dialog.close();});}
 dialog.innerHTML='<header><h2>学校资料</h2><button class="close-preview" data-close-preview aria-label="关闭学校预览">×</button></header><p>正在读取资料…</p>';dialog.showModal();
 try{const data=await loadSchoolData(),school=data.schools.find(s=>s.id===id);if(!school)throw new Error('未找到学校资料');const records=historyFor(data,id).filter(r=>r.batch===3||r.batch===4).slice(0,8);const facts=[['校址区域',schoolDistrict(school)],['学校性质',school.ownership],['住宿',school.boarding===true?'提供住宿（名额另核实）':school.boarding===false?'不提供住宿':'待核实'],['年学费',school.annualFee==null?'待核实':`${school.annualFee}元`]];
 dialog.innerHTML=`<header><div><small>学校快速预览</small><h2>${esc(school.name)}</h2></div><button class="close-preview" data-close-preview aria-label="关闭学校预览">×</button></header><p>${esc(school.category)}</p><dl class="preview-facts">${facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><h3>近期公开录取记录</h3><div class="preview-history"><table class="data-table"><thead><tr><th>年度/批次</th><th>考生口径</th><th>最低分</th></tr></thead><tbody>${records.map(r=>`<tr><td>${r.year}年第${r.batch}批</td><td>${esc(r.candidateType)}</td><td>${r.cutoffScore??'未公布'}</td></tr>`).join('')}</tbody></table></div><p class="note">不同考生类别、批次的分数不能直接混用。住宿和收费缺项请向学校核实。</p><div class="preview-actions"><a class="button-primary" data-full-school href="${schoolURL(id)}">查看完整档案与招生资料 →</a><button class="button-secondary" data-close-preview>返回当前页面</button></div>`;
 const batches=[...new Set(data.admissions.filter(r=>r.schoolId===id&&r.year===data.manifest.latestPolicyYear&&[3,4].includes(r.batch)).map(r=>r.batch))].sort();
 if(batches.length){dialog.querySelector('.preview-actions').insertAdjacentHTML('beforebegin',`<details class="workflow-disclosure"><summary>将这所学校加入志愿</summary><form class="preview-add-form"><label>批次<select name="batch">${batches.map(b=>`<option value="${b}">第${b}批</option>`).join('')}</select></label><label>志愿位置<select name="position">${[1,2,3,4,5,6].map(p=>`<option value="${p}">第${p}志愿</option>`).join('')}</select></label><button type="submit" class="button-primary">放入方案并继续编辑</button><small>资格由方案再次核查；已有学校的位置会提示确认替换。</small></form></details>`);dialog.querySelector('.preview-add-form').addEventListener('submit',event=>{event.preventDefault();const values=new FormData(event.target);location.assign(`/verify/?resume=1&school=${encodeURIComponent(id)}&batch=${values.get('batch')}&position=${values.get('position')}#volunteerForm`);});}
 }catch(error){dialog.querySelector('p').textContent=error.message;}
 dialog.addEventListener('close',()=>trigger?.focus({preventScroll:true}),{once:true});
}
export function installDynamicUI(){
 const style=document.createElement('link');style.rel='stylesheet';style.href='/motion-theme.css?v=20261013-flow';document.head.append(style);
 upgradeHome();
 const observed=new WeakSet();const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.08});
 let queued=false;const refresh=()=>{queued=false;installWorkspace();updateWorkspace();for(const el of document.querySelectorAll('.launch-copy,.launch-art,.batch-entry,.flow-cards article,.library-card'))if(!observed.has(el)){observed.add(el);el.classList.add('reveal-ready');observer.observe(el);}};
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(refresh);}};
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ui-ready','data-stale','hidden']});schedule();
 document.addEventListener('change',event=>{schedule();const row=event.target.closest('.volunteer-row');if(row){row.classList.add('updated-row');setTimeout(()=>row.classList.remove('updated-row'),1000);}});
 document.addEventListener('input',schedule);
 document.addEventListener('zk-school-preview',event=>schoolPreview(event.detail.id,event.detail.trigger));
 document.addEventListener('click',event=>{const action=event.target.closest('#generateUnified,[data-unified-risk],[data-auto-improve],#analyzePlan');if(action&&(action.id!=='analyzePlan'||!beforeAdjustment))beforeAdjustment=snapshot();},true);
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-confirm-plan]'))document.getElementById('analyzePlan')?.click();
  const link=event.target.closest('a[href]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey)return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname!=='/schools/detail/')return;
  if(location.pathname!=='/schools/detail/')try{sessionStorage.setItem('zk-school-return',JSON.stringify({url:location.pathname+location.search+location.hash,y:scrollY}));}catch{}
  // List cards go straight to the school. Links within a plan keep quick preview.
  if(url.hash||link.hasAttribute('data-full-school')||link.classList.contains('school-card-main'))return;
  event.preventDefault();schoolPreview(url.searchParams.get('id'),link);
 });
 if(location.pathname==='/schools/detail/'){
  const returnLink=()=>{if(document.getElementById('returnSchoolContext'))return;let ctx;try{ctx=JSON.parse(sessionStorage.getItem('zk-school-return'));}catch{}if(!ctx?.url||!ctx.url.startsWith('/')||ctx.url.startsWith('//')||ctx.url.startsWith('/schools/detail/'))return;document.querySelector('.detail-head')?.insertAdjacentHTML('beforebegin',`<a id="returnSchoolContext" class="button-secondary" href="${esc(ctx.url)}">← 返回${ctx.url.startsWith('/verify/')?'当前志愿方案':'上次查看的位置'}</a>`);};new MutationObserver(returnLink).observe(document.getElementById('main'),{childList:true});returnLink();
 }else{let ctx;try{ctx=JSON.parse(sessionStorage.getItem('zk-school-return'));}catch{}if(ctx?.url===location.pathname+location.search+location.hash&&ctx.y>0){let attempts=0;const restore=()=>{if(document.querySelector('.library-card')||document.body.dataset.uiReady==='true'||attempts++>25){scrollTo(0,ctx.y);}else setTimeout(restore,100);};setTimeout(restore,100);}}
}
