import { matchesSchool } from './school-service.js';
import { readWorkspace } from './workspace-store.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='zk-intent-schools-v1';

// Every candidate order uses the same seed and scenario count through simulate.
export function buildIntentDraft({ selections, records, emptyPlan, simulate, strategy='balanced', supplements=[] }) {
  const draft=emptyPlan.map(s=>({...s}));
  const preferred=new Map(selections.map((s,i)=>[s.id,{...s,rank:i}]));
  const rejected=[];
  for(const choice of selections){
    const available=records.filter(r=>r.schoolId===choice.id).sort((a,b)=>a.batch-b.batch);
    const record=available.find(r=>draft.some(s=>s.batch===r.batch&&!s.schoolId));
    if(!record){rejected.push(choice.id);continue;}
    const slot=draft.find(s=>s.batch===record.batch&&!s.schoolId);
    Object.assign(slot,{schoolId:record.schoolId,schoolName:record.schoolName});
  }
  if(rejected.length)return {rejected};
  for(const batch of [3,4]){
    const slots=draft.filter(s=>s.batch===batch&&s.schoolId);
    const ordered=slots.map(s=>({schoolId:s.schoolId,schoolName:s.schoolName})).sort((a,b)=>Number(preferred.get(b.schoolId)?.priority)-Number(preferred.get(a.schoolId)?.priority));
    slots.forEach((s,i)=>Object.assign(s,ordered[i]));
  }
  const used=new Set(draft.filter(s=>s.schoolId).map(s=>s.schoolId));
  for(const extra of supplements){
    if(!extra.schoolId||used.has(extra.schoolId)||extra.batch===2)continue;
    const slot=draft.find(s=>s.batch===extra.batch&&!s.schoolId);
    if(slot){Object.assign(slot,{schoolId:extra.schoolId,schoolName:extra.schoolName});used.add(extra.schoolId);}
  }
  const utility=slot=>{const p=preferred.get(slot.schoolId);return p?(p.priority?5:2)+(selections.length-p.rank)/selections.length:0.5;};
  const cache=new Map();
  const evaluate=slots=>{
    const key=slots.map(s=>s.schoolId||'').join('|');if(cache.has(key))return cache.get(key);
    const result=simulate(slots);
    const value=(result.outcomes||[]).reduce((sum,o)=>sum+(o.slot?o.probability*utility(o.slot):0),0);
    const penalty=strategy==='safe'?4:1.5;
    const metric=value-penalty*result.noneProbability;
    const output={result,metric};cache.set(key,output);return output;
  };
  const before=evaluate(draft);
  let best=before;
  if(strategy!=='priority'){
    // Bounded pairwise search compares complete plans, including earlier-batch stopping.
    for(let pass=0;pass<3;pass++){
      let swap=null,score=best;
      for(const batch of [3,4]){
        const slots=draft.map((s,i)=>s.batch===batch&&s.schoolId?i:-1).filter(i=>i>=0);
        for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
          const a=slots[i],b=slots[j],candidate=draft.map(s=>({...s}));
          const fields=['schoolId','schoolName'];for(const f of fields)[candidate[a][f],candidate[b][f]]=[candidate[b][f],candidate[a][f]];
          const test=evaluate(candidate);if(test.metric>score.metric+0.01){score=test;swap=candidate;}
        }
      }
      if(!swap)break;draft.splice(0,draft.length,...swap);best=score;
    }
  }
  const reasons=draft.filter(s=>s.schoolId&&s.batch!==2).map(slot=>{
    const row=best.result.slotResults?.find(r=>r.key===slot.key);
    const record=records.find(r=>r.schoolId===slot.schoolId&&r.batch===slot.batch);
    const p=preferred.get(slot.schoolId);
    return {batch:slot.batch,position:slot.position,schoolId:slot.schoolId,schoolName:slot.schoolName,
      text:[p?(p.priority?'优先想去的学校':'你选择的意向学校'):'经你允许补充的学校',
        strategy==='priority'?'保留同批次内的意向顺序':'结合整份方案的模拟去向比较顺序',
        record?.lastVolunteerNo===1?'历史末位志愿为1，需特别留意梯度和志愿位置':null,
        row?.tier?`该志愿位置的机会参考：${row.tier}`:null].filter(Boolean).join('；')};
  });
  return {draft,before:before.result,result:best.result,reasons,rejected:[],added:draft.filter(s=>s.schoolId&&s.batch!==2&&!preferred.has(s.schoolId))};
}

export function installIntentPlanner({dataset,getProfile,generate}){
  if(document.getElementById('intentPlanning'))return;
  const container=document.createElement('details');container.id='intentPlanning';container.className='workflow-disclosure';
  container.innerHTML=`<summary>意向学校排志愿 · 选几所学校，帮你安排顺序</summary><div class="intent-panel"><h2>先选愿意就读的学校</h2><p>沿用上方分数和考生条件。先按喜好选校、调整顺序，再生成第三、第四批草案。</p><div class="toolbar"><button type="button" class="button-secondary" id="intentFavorites">从收藏带入</button><button type="button" class="button-secondary" id="intentCompare">从学校对比带入</button></div><label>搜索学校或校区<input type="search" id="intentSearch" placeholder="例如：培正、广雅、16中"></label><div id="intentSearchResults" class="intent-search-results"></div><h3>已选意向学校 <small id="intentCount"></small></h3><p class="note">勾选“优先想去”，并按喜好上下移动；电脑也可拖动。最多12所。</p><div id="intentSelected"></div><label>排序方向<select id="intentStrategy"><option value="priority">优先意向 · 保留我的喜好顺序</option><option value="balanced" selected>兼顾风险 · 比较整份方案的去向</option><option value="safe">更稳妥 · 更重视减少当前志愿未录取风险</option></select></label><label class="intent-supplement"><input type="checkbox" id="intentSupplement">允许系统补充其他学校，填补空位</label><p class="note">默认只排列已选学校。未选保底时会指出缺口；补充学校也需要你确认是否愿意就读。</p><button type="button" class="button-primary" id="generateIntent">生成排序草案，进入第2步</button><p id="intentStatus" role="status"></p></div>`;
  document.getElementById('volunteerForm').before(container);
  let selections=[];try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))selections=saved.filter(s=>dataset.schools.some(x=>x.id===s.id)).slice(0,12).map(s=>({id:s.id,priority:!!s.priority}));}catch{}
  const schools=dataset.schools.filter(s=>dataset.admissions.some(r=>r.schoolId===s.id&&r.year===dataset.manifest.latestPolicyYear&&[3,4].includes(r.batch)));
  const school=id=>dataset.schools.find(s=>s.id===id);
  const q=s=>container.querySelector(s);
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(selections));}catch{}};
  const render=()=>{q('#intentCount').textContent=`${selections.length}/12所`;q('#intentSelected').innerHTML=selections.length?selections.map((s,i)=>`<div class="intent-selected-row" draggable="true" data-intent-id="${s.id}"><span>${i+1}</span><strong>${esc(school(s.id).name)}</strong><label><input type="checkbox" data-priority="${s.id}" ${s.priority?'checked':''}>优先想去</label><div class="toolbar"><button type="button" data-move="-1" data-id="${s.id}" aria-label="上移${esc(school(s.id).name)}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="1" data-id="${s.id}" aria-label="下移${esc(school(s.id).name)}" ${i===selections.length-1?'disabled':''}>↓</button><button type="button" data-remove="${s.id}">移除</button></div></div>`).join(''):'<p class="notice">尚未选择学校，先搜索或从收藏带入。</p>';save();search();};
  const add=id=>{if(selections.some(s=>s.id===id))return;if(selections.length>=12){q('#intentStatus').textContent='最多12所，请先移除一所。';return;}selections.push({id,priority:false});render();};
  function search(){const query=q('#intentSearch').value.trim();q('#intentSearchResults').innerHTML=query?schools.filter(s=>matchesSchool(s,query)).slice(0,12).map(s=>`<button type="button" class="button-secondary" data-add="${s.id}" ${selections.some(x=>x.id===s.id)?'disabled':''}>${esc(s.name)} ${selections.some(x=>x.id===s.id)?'已选':'＋'}</button>`).join('')||'<p>没有找到该学校最新年度第三、第四批记录。</p>':'';}
  q('#intentSearch').addEventListener('input',search);
  container.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.add)add(b.dataset.add);if(b.dataset.remove){selections=selections.filter(s=>s.id!==b.dataset.remove);render();}if(b.dataset.move){const i=selections.findIndex(s=>s.id===b.dataset.id),j=i+Number(b.dataset.move);if(j>=0&&j<selections.length){[selections[i],selections[j]]=[selections[j],selections[i]];render();}}});
  container.addEventListener('change',e=>{if(e.target.dataset.priority){selections.find(s=>s.id===e.target.dataset.priority).priority=e.target.checked;save();}});
  let dragged=null;container.addEventListener('dragstart',e=>{dragged=e.target.closest('[data-intent-id]')?.dataset.intentId;if(dragged)e.dataTransfer.setData('text/plain',dragged);});container.addEventListener('dragover',e=>{if(e.target.closest('[data-intent-id]'))e.preventDefault();});container.addEventListener('drop',e=>{const id=e.target.closest('[data-intent-id]')?.dataset.intentId;if(!id||!dragged||id===dragged)return;e.preventDefault();const from=selections.findIndex(s=>s.id===dragged),to=selections.findIndex(s=>s.id===id);selections.splice(to,0,selections.splice(from,1)[0]);render();dragged=null;});
  const importList=key=>{try{const ids=readWorkspace()[key]||[];ids.filter(id=>schools.some(s=>s.id===id)).forEach(add);q('#intentStatus').textContent=ids.length?'已带入有最新统招记录的学校，请检查选择。':'暂无学校，请先在学校库收藏或加入对比。';}catch{q('#intentStatus').textContent='暂时无法读取本机学校列表。';}};
  q('#intentFavorites').onclick=()=>importList('favorites');q('#intentCompare').onclick=()=>importList('compare');
  q('#generateIntent').onclick=async()=>{if(!selections.length){q('#intentStatus').textContent='请至少选择一所意向学校。';return;}const b=q('#generateIntent');b.disabled=true;b.textContent='正在比较排序…';q('#intentStatus').textContent='';try{await new Promise(r=>setTimeout(r,30));await generate({selections:[...selections],strategy:q('#intentStrategy').value,allowSupplement:q('#intentSupplement').checked,status:q('#intentStatus')});}catch(error){q('#intentStatus').textContent=error.message;}finally{b.disabled=false;b.textContent='重新生成排序草案';}};
  render();if(new URLSearchParams(location.search).get('start')==='intent'){container.open=true;requestAnimationFrame(()=>container.scrollIntoView({block:'start'}));}
}
