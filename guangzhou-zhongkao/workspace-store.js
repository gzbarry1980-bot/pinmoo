export const STORE_KEY = 'pinmoo-zk-workspace-v2';
export const LEGACY_KEY = 'pinmoo-guangzhou-zhongkao-draft-v1';
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
export function savePlan(profile,plan,{name,id,forceNew=false}={}) {
  return updateWorkspace(s=>{
    const planId=forceNew?crypto.randomUUID():(id||s.activePlanId||crypto.randomUUID());
    const previous=s.plans.find(p=>p.id===planId);
    const item={id:planId,name:name||previous?.name||`我的志愿方案 ${s.plans.length+1}`,profile,plan:structuredClone(plan),savedAt:new Date().toISOString()};
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
