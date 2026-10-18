// Historical school-life references are display-only, never candidate/model inputs.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function schoolReference(data,id){return data.references?.records?.find(r=>r.schoolId===id)||null;}
export function renderSchoolReference(record,sources=[]){
 if(!record)return '';
 const article=sources.find(s=>s.id===record.sourceId),classes=record.classes;
 const sourceLine=id=>{const s=sources.find(s=>s.id===id);if(!s)return '来源待补充';let url;try{const u=new URL(s.url);if(u.protocol==='https:')url=u.href;}catch{}return `${esc(s.title)} · 页面日期 ${esc(s.publishedAt||'未注明')}${url?` · <a href="${esc(url)}" target="_blank" rel="noreferrer">原文依据（可能需要会员登录）</a>`:''}`;};
 const b=record.boarding,fee=b.semesterFee==null?'资料未明确住宿费':`${esc(b.semesterFee)}元/学期（历史资料）`;
 const issues=[...(b.issues||[]),...(classes?.issues||[])];
 return `<section id="schoolLife" class="detail-section school-life-reference"><h2>校园、住宿与班型</h2><p class="note">已从学校介绍正文整理 · 第三方参考，非当年招生承诺</p><div class="fact-grid"><article><h3>住宿生活${b.referenceYear?` · ${esc(b.referenceYear)}年`:''}</h3><p><strong>${esc(b.rooms)}</strong></p><p>${esc(b.facilities)}</p><p>${fee}</p></article><article><h3>班型与培养${classes?` · ${esc(classes.year)}年`:''}</h3><p>${esc(record.features)}</p>${classes?`<p>${classes.totalClasses==null?'':`资料记载 ${esc(classes.totalClasses)}个班 · `}${esc(classes.summary)}</p>`:''}</article></div>${issues.length?`<div class="notice"><strong>这几项需向学校确认</strong><ul>${issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<details class="method-details"><summary>核对事项与资料依据</summary><p>${esc(record.caution)}</p><ul>${record.questions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="note">校区口径：${esc(record.campusScope)}。资料复核 ${esc(record.review?.reviewedAt||'2026-10-14')}。历史费用不代替当年收费公告，班型不等于承诺进入特色班。这些资料不参与录取机会或方案评分。</p><p class="note">${sourceLine(record.sourceId)}</p>${classes&&classes.sourceId!==record.sourceId?`<p class="note">班型依据：${sourceLine(classes.sourceId)}</p>`:''}</details></section>`;
}
