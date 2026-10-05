// Shared, read-only school index. Missing data is never converted to zero.
export const DISTRICTS = ['荔湾区','越秀区','海珠区','天河区','白云区','黄埔区','番禺区','花都区','南沙区','从化区','增城区'];
export const POPULATIONS = { '户籍生':'户籍生', '随迁子女':'随迁子女', '外区生':'外区生' };
export const normalize = value => String(value || '').replace(/[\s（）()·]/g,'').toLowerCase();
const aliases = [
  ['华附','华南师范大学附属中学'], ['省实','广东实验中学'],
  ['铁一','广州市铁一中学'], ['广雅','广州市广雅中学'],
  ['执信','广州市执信中学'], ['培正','广州市培正中学'],
  ['清华附中','清华大学附属中学'], ['北师大','北京师范大学']
];
export function matchesSchool(school, query) {
  const q = normalize(query);
  if (!q) return true;
  const name = normalize(school.name);
  if (name.includes(q)) return true;
  return aliases.some(([short, full]) => q.startsWith(short) && name.includes(normalize(full)) && name.includes(q.slice(short.length)));
}
export function historyFor(data, id, filters = {}) {
  return data.admissions.filter(r => r.schoolId === id &&
    (!filters.year || r.year === Number(filters.year)) &&
    (!filters.batch || r.batch === Number(filters.batch)) &&
    (!filters.candidateType || r.candidateType === filters.candidateType))
    .sort((a,b) => b.year-a.year || a.batch-b.batch || a.candidateType.localeCompare(b.candidateType,'zh'));
}
export function latestRecord(data, id, filters = {}) {
  return historyFor(data,id,filters)[0] || null;
}
export function schoolDistrict(school) {
  const district = school.campusDistrict || school.district;
  return district && !['未核准', '未标明', '全市', '老三区'].includes(district)
    ? district : '校区区域暂未收录';
}
export function schoolLocation(school){
  const raw=school.campusAddress||'';
  const start=raw.search(/广州市|广东省|(?:越秀|荔湾|海珠|天河|白云|黄埔|番禺|花都|南沙|从化|增城)区/);
  const contactPart=start>0?raw.slice(0,start):'';
  const phones=[...new Set(contactPart.match(/(?<!\d)(?:0\d{2,3}-?\d{7,8}|1[3-9]\d{9}|\d{8})(?!\d)/g)||[])];
  return {address:start>0?raw.slice(start):raw,phones};
}
export function filterSchools(data, filters = {}) {
  const rows = data.schools.filter(s => matchesSchool(s,filters.query) &&
    (!filters.district || schoolDistrict(s) === filters.district) &&
    (!filters.ownership || s.ownership === filters.ownership) &&
    (!filters.batch || historyFor(data,s.id,{batch:filters.batch}).length) &&
    (!filters.autonomous || data.special?.autonomous?.some(r=>r.schoolId===s.id)) &&
    (!filters.talent || data.special?.specialTalent?.some(r=>r.schoolId===s.id && (r.projectSummary||'').includes(filters.talent))) &&
    (!filters.favorites || filters.favorites.includes(s.id)));
  return rows.sort((a,b)=> {
    if (filters.sort === 'district' && filters.homeDistrict) {
      const diff = Number(schoolDistrict(b)===filters.homeDistrict)-Number(schoolDistrict(a)===filters.homeDistrict);
      if(diff) return diff;
    }
    if(filters.sort === 'cutoff') {
      const av=latestRecord(data,a.id,{year:data.manifest?.latestPolicyYear,batch:filters.batch,candidateType:filters.candidateType})?.cutoffScore;
      const bv=latestRecord(data,b.id,{year:data.manifest?.latestPolicyYear,batch:filters.batch,candidateType:filters.candidateType})?.cutoffScore;
      if(av!=null || bv!=null) return (bv??-1)-(av??-1);
    }
    return a.name.localeCompare(b.name,'zh');
  });
}
let cached;
export async function loadSchoolData() {
  if (cached) return cached;
  const read = async path => {
    const r=await fetch(`/data/${path}`);
    if(!r.ok) throw new Error(`学校资料暂时读取失败（${r.status}）`);
    return r.json();
  };
  cached=Promise.all([...['schools.json','admissions.json','sources.json','manifest.json','first-batch-2026.json','autonomous-school-events-2026.json','autonomous-results.json'].map(read),read('evidence-summary.json').catch(()=>null)])
    .then(([schools,admissions,sources,manifest,special,events,autonomous,evidence])=>({schools,admissions,sources:[...sources,...(special.sources||[]),...(events.sources||[]),...(autonomous.sources||[])],manifest,special,events,autonomous,evidence}))
    .catch(error=>{cached=null;throw error;});
  return cached;
}
export function sourceURL(data,id) { return data.sources.find(s=>s.id===id)?.url || null; }
export const schoolURL = id => `/schools/detail/?id=${encodeURIComponent(id)}`;
