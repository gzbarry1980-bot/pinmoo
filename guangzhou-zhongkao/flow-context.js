import {readWorkspace} from './workspace-store.js';

export function safeReturnPath(value,origin=location.origin){
  if(!value)return null;
  try{const u=new URL(value,origin);return u.origin===origin&&/^\/(schools|verify|plans|my)\//.test(u.pathname)?u.pathname+u.search+u.hash:null;}catch{return null;}
}
export function planPath(id,step='plan'){
  const p=new URLSearchParams({step});if(id)p.set('plan',id);else p.set('resume','1');return '/verify/?'+p;
}
export function currentProfile(params=new URLSearchParams(location.search),ws=readWorkspace()){
  if(params.has('plan'))return ws.plans.find(p=>p.id===params.get('plan'))?.profile||null;
  return ws.plans.find(p=>p.id===ws.activePlanId)?.profile||ws.profile||null;
}
export function installFlowContext(){
  if(document.body.dataset.flowContext)return;document.body.dataset.flowContext='true';
  const key=()=>`zk-return-scroll:${location.pathname}${location.search}`;
  document.addEventListener('click',event=>{
    const a=event.target.closest('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    let u;try{u=new URL(a.href);}catch{return;}if(u.origin!==location.origin)return;
    try{sessionStorage.setItem(key(),String(scrollY));}catch{}
    if(!['/schools/detail/','/schools/compare/'].includes(u.pathname))return;
    const p=new URLSearchParams(location.search),ws=readWorkspace(),id=p.has('plan')?p.get('plan'):ws.activePlanId;
    if(id&&!u.searchParams.has('plan'))u.searchParams.set('plan',id);
    const category=p.get('candidateType');if(['auto','户籍生','随迁子女','外区生'].includes(category)&&!u.searchParams.has('candidateType'))u.searchParams.set('candidateType',category);
    if(!u.searchParams.has('returnTo'))u.searchParams.set('returnTo',location.pathname+location.search+location.hash);
    if(location.pathname==='/verify/')u.searchParams.set('from',document.getElementById('analysis')?.hidden===false?'analysis':'plan');
    a.href=u.pathname+u.search+u.hash;
  },true);
  addEventListener('pageshow',restore);
  function restore(){if(location.hash)return;try{const y=Number(sessionStorage.getItem(key()));if(y>0)requestAnimationFrame(()=>scrollTo(0,y));}catch{}}
  restore();
}
