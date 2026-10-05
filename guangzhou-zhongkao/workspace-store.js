export const STORE_KEY = 'pinmoo-zk-workspace-v2';
export const LEGACY_KEY = 'pinmoo-guangzhou-zhongkao-draft-v1';
const PROFILE_FIELDS=['mode','targetYear','score','scoreLow','scoreHigh','tieRank','candidateType','admissionDistrict','householdDistrict','schoolDistrict','sourceSchoolId','referenceGrade','riskPreference','ownershipPreference','boardingPreference','maxAnnualFee','preferredDistricts','regionPreference','excludedSchools','crossDistrict','quotaEligible','notAdmittedFirstBatch'];
export function parseAnonymousPlan(raw,schools){
  if(!raw?.profile||!Array.isArray(raw.plan)||raw.plan.length!==15)throw new Error('请导入15志愿结构的匿名JSON文件');
  const profile=Object.fromEntries(PROFILE_FIELDS.filter(k=>k in raw.profile).map(k=>[k,raw.profile[k]]));
  if(!['forecast','replay'].includes(profile.mode)||!Number.isInteger(profile.targetYear)||profile.targetYear<2021||profile.targetYear>2100)throw new Error('分析模式或目标年度无效');
  if(['score','scoreLow','scoreHigh'].some(k=>!Number.isFinite(profile[k])||profile[k]<0||profile[k]>810))throw new Error('估分必须在0—810之间');
  if(profile.scoreLow>profile.score||profile.score>profile.scoreHigh)throw new Error('估分应满足下限 ≤ 中心 ≤ 上限');
  if(!['户籍生','随迁子女'].includes(profile.candidateType))throw new Error('考生口径无效');
  for(const key of ['preferredDistricts','excludedSchools'])if(profile[key]!=null&&(!Array.isArray(profile[key])||profile[key].some(v=>typeof v!=='string')))throw new Error('偏好列表格式无效');
  if(profile.regionPreference!=null&&!['household','custom','none'].includes(profile.regionPreference))throw new Error('区域偏好无效');
  const expected=[...Array(3)].map((_,i)=>`b2-${i+1}`).concat([...Array(6)].map((_,i)=>`b3-${i+1}`),[...Array(6)].map((_,i)=>`b4-${i+1}`));
  if(new Set(raw.plan.map(r=>r.key)).size!==15||raw.plan.some(r=>!expected.includes(r.key)||r.key!==`b${r.batch}-${r.position}`||r.schoolId&&!schools.some(s=>s.id===r.schoolId)))throw new Error('志愿位置或学校标识无效');
  const plan=raw.plan.map(r=>({key:r.key,batch:r.batch,position:r.position,schoolId:r.schoolId||'',schoolName:schools.find(s=>s.id===r.schoolId)?.name||''}));
  return {profile,plan};
}
const empty = () => ({version:2, profile:null, favorites:[], compare:[], recent:[], plans:[], activePlanId:null});
export function readWorkspace(storage=localStorage) {
  try {
    const raw=JSON.parse(storage.getItem(STORE_KEY)||'null');
    if(!raw || raw.version!==2) return empty();
    return {...empty(),...raw, favorites:Array.isArray(raw.favorites)?raw.favorites:[], compare:Array.isArray(raw.compare)?raw.compare.slice(0,4):[],plans:Array.isArray(raw.plans)?raw.plans:[]};
  } catch { return empty(); }
}
export function updateWorkspace(change, storage=localStorage) {
  const state=readWorkspace(storage);
  change(state);
  // Storage failures propagate: callers must not report a successful save.
  storage.setItem(STORE_KEY,JSON.stringify(state));
  if(typeof window!=='undefined') window.dispatchEvent(new CustomEvent('zk-workspace-change'));
  return state;
}
export function toggleFavorite(id) {
  return updateWorkspace(s=>{s.favorites=s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id];});
}
export function toggleCompare(id) {
  return updateWorkspace(s=>{
    if(s.compare.includes(id)) s.compare=s.compare.filter(x=>x!==id);
    else { if(s.compare.length>=4) throw new Error('最多同时对比4个学校/校区，请先移除一所。'); s.compare.push(id); }
  });
}
export function savePlan(profile,plan,{name,id,forceNew=false,preserveResult=false}={}) {
  return updateWorkspace(s=>{
    const planId=forceNew?crypto.randomUUID():(id||s.activePlanId||crypto.randomUUID());
    const previous=s.plans.find(p=>p.id===planId);
    const item={id:planId,name:name||previous?.name||`我的志愿方案 ${s.plans.length+1}`,profile,plan:structuredClone(plan),savedAt:new Date().toISOString()};
    if(preserveResult&&previous?.result&&JSON.stringify(previous.profile)===JSON.stringify(profile)&&JSON.stringify(previous.plan)===JSON.stringify(plan))item.result=previous.result;
    s.plans=s.plans.filter(p=>p.id!==planId); s.plans.unshift(item);
    s.activePlanId=planId; s.profile=profile;
  });
}
export function activatePlan(id) {
  const s=readWorkspace(); const item=s.plans.find(p=>p.id===id);
  if(!item) throw new Error('这份方案已不存在。');
  localStorage.setItem(LEGACY_KEY,JSON.stringify(item));
  updateWorkspace(v=>{v.activePlanId=id;v.profile=item.profile;});
  return item;
}
export function migrateDraft() {
  if(readWorkspace().plans.length) return;
  try { const draft=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');
    if(draft?.profile && Array.isArray(draft.plan) && draft.plan.some(r=>r.schoolId)) savePlan(draft.profile,draft.plan,{name:'此前保存的方案'});
  } catch { /* Invalid legacy drafts are ignored, never deleted. */ }
}
