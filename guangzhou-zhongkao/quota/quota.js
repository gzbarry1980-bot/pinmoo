import {readWorkspace,updateWorkspace,savePlan,LEGACY_KEY} from '../workspace-store.js';
import {escapeHTML as e,notify} from '../site-shell.js';
import {schoolURL,matchesSchool} from '../school-service.js';
const $=id=>document.getElementById(id);let manifest,sources,quotaControls=[],allRows=[],rows=[],request=0;
const slots=[1,2,3];
const blankPlan=()=>[2,3,4].flatMap(batch=>Array.from({length:batch===2?3:6},(_,i)=>({key:`b${batch}-${i+1}`,batch,position:i+1,schoolId:'',schoolName:''})));
const getJSON=async url=>{const response=await fetch(url);if(!response.ok)throw new Error('资料加载失败，请刷新重试');return response.json();};
function schoolOptions(selected=''){return '<option value="">暂不填写</option>'+rows.map(r=>`<option value="${e(r.schoolId)}" ${r.cutoffScore==null?'disabled':''} ${r.schoolId===selected&&r.cutoffScore!=null?'selected':''}>${e(r.schoolName)} · ${r.cutoffScore==null?'当年无人录取，无分数可参考':`${r.cutoffScore}分`}</option>`).join('');}
function renderSources(){const current=$('quotaSource').value;const filtered=sources.filter(s=>matchesSchool(s,$('quotaSourceSearch').value));$('quotaSource').innerHTML='<option value="">请选择所在初中</option>'+filtered.map(s=>`<option value="${e(s.id)}">${e(s.name)}</option>`).join('');if(filtered.some(s=>s.id===current))$('quotaSource').value=current;else{$('quotaSource').value='';renderRows();}}
function remember(){try{updateWorkspace(s=>{s.quotaDraft={year:Number($('quotaYear').value),sourceSchoolId:$('quotaSource').value,selections:slots.map(i=>$('quotaSlot'+i)?.value||''),confirmed:$('quotaConfirmed').checked};});}catch{notify('本机保存失败，请检查浏览器存储。');}}
function renderRows(selections=[]){
 rows=[...new Map(allRows.filter(r=>r.sourceSchoolId===$('quotaSource').value).map(r=>[r.schoolId,r])).values()].sort((a,b)=>b.cutoffScore-a.cutoffScore);
 $('quotaCoverage').textContent=`${$('quotaYear').value}年历史录取资料：当前收录${rows.length}所高中结果，其中${rows.filter(r=>r.cutoffScore==null).length}所当年无人被录取。部分记录未公布计划数和实际录取人数；此列表不是完整的当年分配名单。`;
 $('quotaResults').innerHTML=!$('quotaSource').value?'<p>请选择考生所在初中。</p>':!rows.length?'<p>该初中在此年度暂无已收录记录；不代表没有名额。请查看官方分配计划。</p>':`<div class="quota-table-scroll"><table class="data-table"><thead><tr><th>高中/校区</th><th>计划名额</th><th>最低录取分</th><th>末位志愿</th><th>同分序号</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="${schoolURL(r.schoolId)}">${e(r.schoolName)}</a></td><td>${r.quota??'未收录'}</td><td>${r.cutoffScore??'当年无人录取'}</td><td>${r.lastVolunteerNo??'—'}</td><td>${r.cutoffTieRank??'—'}</td></tr>`).join('')}</tbody></table></div><p class="note">空白分数表示这组初中与高中当年没有考生被录取，不能当作0分或保底机会。这类记录暂不能用来生成模拟志愿；报考时仍以当年分配计划为准。<br>户籍生 · 名额分配口径 · <a href="https://gzzk.gz.gov.cn/zkzz/zkxx/lnfs/index.html" target="_blank" rel="noreferrer">官方历年录取数据</a></p>`;
 const table=$('quotaResults').querySelector('table');
 if(table&&$('quotaYear').value==='2026'){
  const heading=document.createElement('th');heading.textContent='最低控制线';table.tHead.rows[0].cells[2].before(heading);
  [...table.tBodies[0].rows].forEach((tr,i)=>{const cell=document.createElement('td'),control=quotaControls.find(r=>r.schoolId===rows[i].schoolId);cell.textContent=control?`${control.effectiveMinimum}（门槛）`:'未收录';tr.cells[2].before(cell);if(rows[i].schoolId===new URLSearchParams(location.search).get('school')){tr.style.backgroundColor='#fff4db';tr.setAttribute('data-target-school','true');}});
  const note=document.createElement('p');note.className='note';note.textContent='最低控制线仅是投档门槛，不是所在初中的录取线；请同时查看“最低录取分”和末位志愿。';$('quotaResults').prepend(note);
 }
 $('quotaSlots').innerHTML=slots.map(i=>`<label>第${i}志愿<select id="quotaSlot${i}" ${$('quotaConfirmed').checked?'':'disabled'}>${schoolOptions(selections[i-1])}</select></label>`).join('');
 slots.forEach(i=>$('quotaSlot'+i).addEventListener('change',remember));
}
async function loadYear(selections=[]){const token=++request;$('quotaResults').textContent='正在加载该年度资料…';try{const year=$('quotaYear').value,result=await getJSON(`/data/${year==='2026'?'allocation-outcomes-2026':`allocations-${year}`}.json`);if(token!==request)return;allRows=Array.isArray(result)?result:result.records;renderRows(selections);}catch(error){if(token===request){allRows=[];rows=[];$('quotaResults').textContent=error.message;}}}
function clearParticipation(){
 updateWorkspace(s=>{if(s.profile)s.profile={...s.profile,quotaEligible:false,sourceSchoolId:''};const active=s.plans.find(p=>p.id===s.activePlanId);if(active){active.profile={...active.profile,quotaEligible:false,sourceSchoolId:''};active.plan=active.plan.map(row=>row.batch===2?{key:row.key,batch:2,position:row.position,schoolId:'',schoolName:''}:row);delete active.result;localStorage.setItem(LEGACY_KEY,JSON.stringify(active));}if(s.quotaDraft)s.quotaDraft.confirmed=false;});
 sessionStorage.removeItem('zk-analysis-cache');
}
$('quotaSourceSearch').addEventListener('input',()=>{renderSources();remember();});
$('quotaSource').addEventListener('change',()=>{$('quotaConfirmed').checked=false;renderRows();remember();$('quotaSaveStatus').textContent='初中已变更，请重新确认资格后选择志愿；之前保存的方案仍保留。';});
$('quotaYear').addEventListener('change',async()=>{await loadYear();remember();});
$('quotaConfirmed').addEventListener('change',()=>{if(!$('quotaConfirmed').checked){try{clearParticipation();renderRows();$('quotaSaveStatus').textContent='已取消第二批参与，并清空当前方案中的第二批志愿。';}catch(error){notify(error.message);}}else{slots.forEach(i=>$('quotaSlot'+i).disabled=false);$('quotaSaveStatus').textContent='可选择最多3所学校；历史学校需核对当年是否有分配名额。';}remember();});
$('saveQuota').addEventListener('click',()=>{
 if(window.ZhongkaoAccess&&!window.ZhongkaoAccess.guard())return;
 if(!$('quotaConfirmed').checked)return notify('请先向学校确认资格，并勾选确认。');
 if(!$('quotaSource').value)return notify('请先选择考生所在初中。');
 const selected=slots.map(i=>$('quotaSlot'+i).value),filled=selected.filter(Boolean);if(!filled.length)return notify('请至少选择一所学校，或先跳过第二批。');
 if(new Set(filled).size!==filled.length)return notify('第二批不能重复选择同一学校。');
 if(selected.some((v,i)=>v&&selected.slice(0,i).some(x=>!x)))return notify('请从第一志愿开始连续填写。');
 const ws=readWorkspace(),active=ws.plans.find(p=>p.id===ws.activePlanId);const base=active?.profile||ws.profile||{};
 if(base.candidateType==='随迁子女')return notify('名额分配须核对户籍生资格，请先修改考生类别或咨询学校。');
 const profile={mode:'forecast',targetYear:manifest.latestPolicyYear+1,score:690,scoreLow:680,scoreHigh:700,candidateType:'户籍生',admissionDistrict:'天河区',householdDistrict:'天河区',schoolDistrict:'天河区',referenceGrade:'unknown',riskPreference:'均衡',ownershipPreference:'不限',boardingPreference:'不限',maxAnnualFee:null,preferredDistricts:[],regionPreference:'household',excludedSchools:[],crossDistrict:false,notAdmittedFirstBatch:true,...base,quotaEligible:true,sourceSchoolId:$('quotaSource').value};
 const plan=structuredClone(active?.plan||blankPlan());if(plan.some(r=>r.batch!==2&&filled.includes(r.schoolId)))return notify('所选学校已在第三或第四批方案中，请调整后再保存，避免重复。');
 for(const i of slots){const slot=plan.find(r=>r.batch===2&&r.position===i),record=rows.find(r=>r.schoolId===selected[i-1]);Object.assign(slot,{schoolId:record?.schoolId||'',schoolName:record?.schoolName||''});}
 try{savePlan(profile,plan,{name:active?.name||'名额分配与普通高中方案'});localStorage.setItem(LEGACY_KEY,JSON.stringify({profile,plan}));sessionStorage.removeItem('zk-analysis-cache');location.assign('/verify/?resume=1#volunteerForm');}catch(error){notify('保存失败：'+error.message);}
});
try{
 const loaded=await Promise.all([getJSON('/data/manifest.json'),getJSON('/data/source-schools.json'),getJSON('/data/quota-controls-2026.json')]);[manifest,sources]=loaded;quotaControls=loaded[2].records;const ws=readWorkspace(),draft=ws.quotaDraft,active=ws.plans.find(p=>p.id===ws.activePlanId);const profile=active?.profile||ws.profile;
 $('quotaYear').innerHTML=[...manifest.years].reverse().map(y=>`<option value="${y}">${y}年（历史资料）</option>`).join('');if(manifest.years.includes(draft?.year))$('quotaYear').value=draft.year;
 renderSources();$('quotaSource').value=draft?.sourceSchoolId||profile?.sourceSchoolId||'';$('quotaConfirmed').checked=draft?.confirmed??Boolean(profile?.quotaEligible);
 await loadYear(draft?.selections||slots.map(i=>active?.plan.find(r=>r.batch===2&&r.position===i)?.schoolId||''));
}catch(error){$('quotaCoverage').textContent=error.message;}
