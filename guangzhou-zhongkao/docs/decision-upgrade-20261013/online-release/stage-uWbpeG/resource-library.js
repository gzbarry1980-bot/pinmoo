// External references never enter admission calculations or grant membership.
export const RESOURCE_CATEGORIES=['全部','选学校','填志愿','备考','其他方向','综合'];
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resourceURL(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&['khs1y.xetslk.com','app0vjwwvpz3722.h5.xiaoecloud.com','app0vjwwvpz3722.h5.xet.pomoho.com'].includes(url.hostname)?url.href:null;}catch{return null;}
}
export function filterResources(records,{category='全部',query=''}={}){
 const text=String(query).trim().toLowerCase();
 return records.filter(record=>resourceURL(record.url)&&(category==='全部'||record.category===category)&&(!text||`${record.title} ${record.description} ${record.category}`.toLowerCase().includes(text)));
}
let cached;
export function loadResources(){
 if(!cached)cached=fetch('/data/member-resources.json').then(response=>{if(!response.ok)throw new Error('资料入口暂时无法读取');return response.json();}).then(data=>{if(data.schemaVersion!==1||!Array.isArray(data.records))throw new Error('资料格式不正确');return data;}).catch(error=>{cached=null;throw error;});
 return cached;
}
const link=(record,label=record.title)=>`<a class="button-secondary" href="${escape(resourceURL(record.url))}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
export async function installSchoolReferences(school){
 const overview=document.getElementById('overview');if(!overview||document.getElementById('schoolMemberReferences'))return;
 try{
  const data=await loadResources();
  const matched=data.records.filter(record=>record.schoolIds?.includes(school.id)&&resourceURL(record.url));
  const general=['member-school-profiles','member-signing','member-policy'].map(id=>data.records.find(record=>record.id===id)).filter(record=>record&&resourceURL(record.url));
  const section=document.createElement('aside');section.id='schoolMemberReferences';section.className='school-reference-panel';
  section.innerHTML=`<strong>更多学校参考</strong><p class="note">${matched.length?'本校相关资料，需原站会员权限。':'先打开学校目录，再查找这所学校；需原站会员权限。'}</p><div class="toolbar">${(matched.length?matched:general).map(record=>link(record,record.id==='member-school-profiles'?'学校介绍目录':record.title)).join('')}<a class="compact-link" href="/resources/?category=${encodeURIComponent('选学校')}">全部资料 →</a></div>`;
  overview.append(section);
 }catch{/* Optional references must never block the official school profile. */}
}
export async function renderResourceLibrary(main){
 const data=await loadResources(),params=new URLSearchParams(location.search);
 const initial=RESOURCE_CATEGORIES.includes(params.get('category'))?params.get('category'):'全部';
 main.innerHTML=`<header class="page-hero"><a class="compact-link" href="/">← 返回首页</a><h1>中考资料库</h1><p>选学校、填志愿、备考，按需查资料。</p><span class="chip">外部会员资料</span></header><section class="resource-controls" aria-label="资料筛选"><form id="resourceSearch" class="hero-search"><label class="sr-only" for="resourceQuery">搜索资料</label><input id="resourceQuery" type="search" placeholder="搜学校介绍、政策、试卷…" value="${escape(params.get('q')||'')}"><button class="button-primary" type="submit">搜索</button></form><div class="resource-categories" role="group" aria-label="资料分类">${RESOURCE_CATEGORIES.map(category=>`<button class="button-secondary" type="button" data-resource-category="${escape(category)}" aria-pressed="${category===initial}">${escape(category)}</button>`).join('')}</div><p id="resourceCount" class="note" role="status"></p></section><section id="resourceGrid" class="resource-grid" aria-label="资料入口"></section><details class="method-details resource-access-note"><summary>使用前看这里</summary><p>${escape(data.notice)}</p><p>此处收录资料入口，不代表已取得各篇文章的转载授权。会员资料正文尚未逐篇整理到系统；历史签约或成绩不代表当年录取承诺，也不参与录取机会计算。</p></details>`;
 let category=initial;
 const render=()=>{
  const query=document.getElementById('resourceQuery').value,records=filterResources(data.records,{category,query});
  document.getElementById('resourceCount').textContent=`${records.length}项资料 · 在原平台打开`;
  document.getElementById('resourceGrid').innerHTML=records.map(record=>`<a class="resource-card" href="${escape(resourceURL(record.url))}" target="_blank" rel="noopener noreferrer"><span class="chip">${escape(record.category)}</span><strong>${escape(record.title)}</strong><p>${escape(record.description)}</p><span class="resource-open">打开资料 ↗</span></a>`).join('')||'<p class="empty-state">没有找到，换个关键词试试。</p>';
  main.querySelectorAll('[data-resource-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.resourceCategory===category)));
  const url=new URL(location.href);url.searchParams.delete('category');url.searchParams.delete('q');if(category!=='全部')url.searchParams.set('category',category);if(query.trim())url.searchParams.set('q',query.trim());history.replaceState(null,'',url.pathname+url.search);
 };
 main.querySelectorAll('[data-resource-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.resourceCategory;render();}));
 document.getElementById('resourceSearch').addEventListener('submit',event=>{event.preventDefault();render();});document.getElementById('resourceQuery').addEventListener('input',render);render();
}
