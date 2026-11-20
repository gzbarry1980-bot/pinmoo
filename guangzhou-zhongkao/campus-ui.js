// Presentation layer only. Existing controls, data, rule engine and access checks remain authoritative.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name,extra='')=>`<img class="campus-icon ${extra}" src="/assets/icons/${name}.svg" width="24" height="24" alt="" aria-hidden="true">`;
const setText=(node,text)=>{if(node&&node.textContent!==text)node.textContent=text;};

function enhanceHome(){
 const hero=document.querySelector('.launch-hero,.batch-home-hero');if(!hero||hero.dataset.campusReady)return;
 hero.dataset.campusReady='true';hero.className='launch-hero campus-home-hero';
 hero.innerHTML=`<div class="launch-copy"><span class="campus-kicker">广州中考 · 志愿规划</span><h1>把分数，<br>变成清晰的选择</h1><p>先有方向，再排志愿。</p><a class="button-primary campus-start" href="/verify/?new=1">按分数生成志愿${icon('arrow-right')}</a><small>第三、第四批普通高中志愿 · 仅供参考</small></div><figure class="launch-art"><img src="/assets/campus-guide-20261025.webp" alt="通用广州校园氛围插画，非真实学校照片" width="1440" height="640" fetchpriority="high"></figure>`;
 const search=document.querySelector('.home-school-search');
 if(search){
  search.classList.add('campus-search');
  search.querySelector('h2').innerHTML=icon('magnifying-glass')+'查学校';
  if(!search.querySelector('.campus-target-link'))search.insertAdjacentHTML('beforeend',`<a class="campus-target-link" href="/verify/?new=1&amp;start=target#targetPlanning"><span class="campus-task-icon">${icon('target')}</span><span><strong>有目标学校？</strong><small>看看需要冲到多少分</small></span>${icon('arrow-right')}</a>`);
  hero.after(search);
 }
 if(!document.querySelector('.campus-process')){
  const process=document.createElement('ol');process.className='campus-process';process.setAttribute('aria-label','三步完成志愿规划');
  process.innerHTML=[['clipboard-text','填条件'],['list-numbers','排志愿'],['chart-bar','看评估']].map(([name,label],i)=>`<li>${icon(name)}<span><small>0${i+1}</small><strong>${label}</strong></span></li>`).join('');
  (search||hero).after(process);
 }
 const batches=document.querySelector('.batch-entry-grid');
 if(batches){batches.classList.add('campus-paths');batches.querySelector('.batch-entry-main')?.setAttribute('hidden','');if(!document.getElementById('campusPathsTitle'))batches.insertAdjacentHTML('beforebegin','<h2 id="campusPathsTitle" class="campus-section-title">其他升学路径</h2>');}
}

function enhanceNavigation(){
 const names=['house','magnifying-glass','clipboard-text','user-circle'];
 document.querySelectorAll('.mobile-nav a').forEach((a,i)=>{if(!a.querySelector('.campus-icon'))a.insertAdjacentHTML('afterbegin',icon(names[i]||'house'));});
}

function groupProfile(){
 const workspace=document.getElementById('verifyWorkspace'),grid=document.querySelector('#profileForm .profile-essentials');
 if(!workspace?.dataset.minimalReady||!grid||grid.dataset.campusGrouped)return;
 grid.dataset.campusGrouped='true';grid.classList.add('campus-profile-groups');grid.classList.remove('profile-grid');
 const groups=[['估分范围',['scoreLow','scoreHigh']],['报考条件',['candidateType','admissionDistrict','householdDistrict']]];
 for(const [title,ids] of groups){
  const fields=ids.map(id=>document.getElementById(id)?.closest('label')).filter(el=>el&&grid.contains(el));if(!fields.length)continue;
  const group=document.createElement('fieldset');group.className='campus-field-group';group.innerHTML=`<legend>${esc(title)}</legend><div class="profile-grid"></div>`;
  grid.append(group);fields.forEach(field=>group.querySelector('.profile-grid').append(field));
 }
 const profile=document.querySelector('#profile .panel-heading h2');setText(profile,'先填分数，再选条件');
}

let picker,activeSelect,returnFocus;
function openPicker(select,trigger){
 if(window.ZhongkaoAccess&&!window.ZhongkaoAccess.guard())return;
 if(!picker){
  picker=document.createElement('dialog');picker.id='campusSchoolPicker';picker.className='campus-school-picker';picker.setAttribute('aria-labelledby','campusPickerTitle');
  picker.innerHTML='<header><div><small id="campusPickerPosition"></small><h2 id="campusPickerTitle">选择学校</h2></div><button type="button" class="button-secondary" data-picker-close>关闭</button></header><label class="campus-picker-search">搜索学校<input id="campusPickerSearch" type="search" placeholder="输入校名或校区关键字" autocomplete="off"></label><p id="campusPickerCount" class="note" role="status"></p><div id="campusPickerOptions" class="campus-picker-options"></div><p class="note">沿用当前条件下的学校列表；资格与志愿顺序仍需评估确认。</p>';
  document.body.append(picker);
  picker.querySelector('[data-picker-close]').onclick=()=>picker.close();
  picker.querySelector('input').addEventListener('input',renderPicker);
  picker.querySelector('#campusPickerOptions').addEventListener('click',event=>{
   const choice=event.target.closest('[data-picker-school]');if(!choice||choice.disabled||!activeSelect?.isConnected)return;
   activeSelect.value=choice.dataset.pickerSchool;activeSelect.dispatchEvent(new Event('change',{bubbles:true}));picker.close();
  });
  picker.addEventListener('click',event=>{if(event.target===picker){const r=picker.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)picker.close();}});
  picker.addEventListener('close',()=>{returnFocus?.focus({preventScroll:true});activeSelect=null;});
 }
 activeSelect=select;returnFocus=trigger;
 const row=select.closest('.volunteer-row');setText(picker.querySelector('#campusPickerPosition'),`第${row.dataset.batch}批 · 第${select.dataset.key.split('-')[1]}志愿`);
 picker.querySelector('input').value='';renderPicker();picker.showModal();picker.querySelector('input').focus();
}
function renderPicker(){
 if(!activeSelect)return;
 const term=picker.querySelector('input').value.trim().toLocaleLowerCase(),selected=new Set([...document.querySelectorAll('.school-select')].filter(s=>s!==activeSelect).map(s=>s.value).filter(Boolean));
 const options=[...activeSelect.options].filter(o=>o.value&&o.textContent.toLocaleLowerCase().includes(term));
 setText(picker.querySelector('#campusPickerCount'),`${options.length}所学校可查看${options.length>80?' · 先显示80所，请输入关键字缩小范围':''}`);
 picker.querySelector('#campusPickerOptions').innerHTML=options.slice(0,80).map(o=>`<button type="button" data-picker-school="${esc(o.value)}" ${o.disabled||selected.has(o.value)?'disabled':''} ${o.value===activeSelect.value?'aria-current="true"':''}><span><strong>${esc(o.dataset.name||o.textContent.split(' · ')[0])}</strong><small>${esc(selected.has(o.value)?'已在其他志愿中':o.textContent.split(' · ').slice(1).join(' · ')||'参考资料待核对')}</small></span><span>${o.value===activeSelect.value?'当前选择':selected.has(o.value)?'已选':'选择'}</span></button>`).join('')||'<p class="empty-state">没有匹配的学校，请更换关键字。</p>';
}

function enhancePlan(){
 for(const row of document.querySelectorAll('.volunteer-row')){
  const select=row.querySelector('.school-select');if(!select)continue;
  let choice=row.querySelector('.campus-school-choice');
  if(!choice){
   const position=select.dataset.key.split('-')[1];
   row.querySelector('.volunteer-label').innerHTML=`<b>${esc(position)}</b><span>志愿</span>`;
   choice=document.createElement('div');choice.className='campus-school-choice';choice.innerHTML='<div><strong class="campus-school-name"></strong><small class="campus-choice-hint"></small></div><button type="button" class="button-secondary campus-change-school"></button>';
   select.before(choice);choice.append(select);select.classList.add('campus-native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
   choice.querySelector('button').onclick=()=>openPicker(select,choice.querySelector('button'));
   row.querySelector('[data-move="up"]').textContent='上移';row.querySelector('[data-move="down"]').textContent='下移';row.querySelector('[data-remove]').textContent='清空';
  }
  const selected=select.selectedOptions[0];setText(choice.querySelector('.campus-school-name'),select.value?(selected?.dataset.name||selected?.textContent.split(' · ')[0]||'所选学校'):'还未选择学校');
  setText(choice.querySelector('.campus-choice-hint'),select.value?'':'从当前条件的学校中选择');
  const button=choice.querySelector('button');setText(button,select.value?'更换学校':'选择学校');button.setAttribute('aria-label',`第${row.dataset.batch}批第${select.dataset.key.split('-')[1]}志愿，${select.value?'更换学校':'选择学校'}`);
  row.classList.toggle('campus-row-filled',Boolean(select.value));
  const rows=[...row.closest('.batch-card').querySelectorAll('.volunteer-row')],index=rows.indexOf(row);
  row.querySelector('[data-move="up"]').disabled=index===0;row.querySelector('[data-move="down"]').disabled=index===rows.length-1;
 }
 for(const card of document.querySelectorAll('.batch-card')){
  const head=card.querySelector('.batch-head');if(!head)continue;let count=head.querySelector('.campus-batch-count');if(!count){count=document.createElement('span');count.className='campus-batch-count';head.append(count);}
  const selects=[...card.querySelectorAll('.school-select')];setText(count,`已填 ${selects.filter(s=>s.value).length}/${selects.length}`);
 }
}

function enhanceSchools(){
 for(const card of document.querySelectorAll('.library-card')){
  if(card.dataset.campusReady)continue;card.dataset.campusReady='true';
  const main=card.querySelector('.school-card-main');if(!main)continue;
  const content=document.createElement('div');content.className='campus-school-content';while(main.firstChild)content.append(main.firstChild);card.prepend(content);
  main.classList.add('button-primary');main.innerHTML='查看学校'+icon('arrow-right');
  const actions=card.querySelector('.card-actions');if(actions)actions.prepend(main);else card.append(main);
 }
 for(const header of document.querySelectorAll('.detail-head')){if(!header.querySelector('.campus-school-mark'))header.insertAdjacentHTML('afterbegin',`<span class="campus-school-mark">${icon('buildings')}</span>`);}
 const contextualBack=[...document.querySelectorAll('main>a')].find(a=>a.textContent.trim()==='返回刚才的位置');
 if(contextualBack){const duplicate=document.getElementById('returnSchoolContext');if(duplicate)duplicate.hidden=true;const list=document.getElementById('returnToSchools');if(list)list.hidden=true;}
 const detailHeading=document.querySelector('.detail-head .eyebrow');setText(detailHeading,'学校档案');
 const targetButton=document.querySelector('.detail-head .button-primary');setText(targetButton,'分析目标分');
 const table=document.getElementById('historyTable');if(!table)return;
 let trend=document.getElementById('campusHistoryTrend');if(!trend){trend=document.createElement('section');trend.id='campusHistoryTrend';trend.className='campus-history-trend';trend.setAttribute('aria-label','同口径历年录取门槛');table.before(trend);}
 const groups=new Map();for(const tr of table.querySelectorAll('tbody tr')){const cells=tr.querySelectorAll('td');if(cells.length<3)continue;const year=Number(cells[0].textContent),score=Number(cells[2].textContent),key=cells[1].textContent.trim();if(!Number.isFinite(year)||!Number.isFinite(score)||score<0||score>810)continue;const rows=groups.get(key)||[];rows.push({year,score});groups.set(key,rows);}
 const candidate=[...groups].find(([,rows])=>rows.length>=2),key=JSON.stringify(candidate||null);if(trend.dataset.rows===key)return;trend.dataset.rows=key;trend.hidden=!candidate;if(!candidate){trend.replaceChildren();return;}
 const [label,rows]=candidate;trend.innerHTML=`<header><strong>同口径门槛年表</strong><small>${esc(label)}</small></header><div>${rows.sort((a,b)=>b.year-a.year).slice(0,6).map(r=>`<label><span>${r.year}</span><meter min="0" max="810" value="${r.score}" aria-label="${r.year}年最低录取分${r.score}"></meter><strong>${r.score}分</strong></label>`).join('')}</div><p class="note">仅展示已收录年份；不同批次、考生类别与校区不混合。</p>`;
}

function enhanceResult(){
 const score=document.getElementById('scoreRing');if(score){score.setAttribute('aria-label','方案合理度，满分100分，不是录取概率');if(!score.querySelector('.campus-score-denominator'))score.querySelector('strong')?.insertAdjacentHTML('afterend','<small class="campus-score-denominator">/ 100</small>');}
 const note=document.querySelector('.compact-result-note');setText(note,'评价填法，不是录取概率 · 仅供参考');
 const summary=document.querySelector('#decisionSummary>span.note');if(summary&&window.ZhongkaoAccess?.isEntitled())setText(summary,summary.textContent.replace('简版分析','方案评估'));
 for(const row of document.querySelectorAll('#outcomeList .outcome-row')){
  const value=Number(row.querySelector('b')?.textContent.replace('%',''));if(!row.querySelector('b')?.textContent.includes('%')||!Number.isFinite(value))continue;
  let bar=row.querySelector('progress');if(!bar){bar=document.createElement('progress');bar.className='campus-outcome-progress';bar.max=100;row.append(bar);}bar.value=value;bar.setAttribute('aria-label',`该去向占本次模拟情景${value}%`);
 }
}

function install(){
 if(location.pathname.includes('/serial-key/'))return;
 document.body.classList.add('campus-ui');
 const css=document.createElement('link');css.rel='stylesheet';css.href='/campus-ui.css?v=20261025-campus-r1';css.dataset.campusUiStyle='';document.head.append(css);
 let queued=false;const refresh=()=>{queued=false;enhanceHome();enhanceNavigation();groupProfile();enhancePlan();enhanceSchools();enhanceResult();};
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(refresh);}};
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ui-ready','data-workflow-step']});
 document.addEventListener('change',schedule);document.addEventListener('zk-workspace-change',schedule);schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
