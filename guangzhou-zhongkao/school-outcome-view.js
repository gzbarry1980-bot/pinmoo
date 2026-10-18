const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function findSchoolOutcome(data,id){
 return data.outcomes?.records?.find(r=>r.schoolId===id)
   || data.outcomes?.aggregateRecords?.find(r=>r.schoolIds?.includes(id)) || null;
}
export function outcomeMetric(value,kind,subject){
 if(!value)return null;
 const type=kind||(/人/.test(value)?'count':/%/.test(value)?'rate':'unspecified');
 const keyClass=value.startsWith('重点班');
 const label=subject==='600'?(type==='count'?'600分以上人数':type==='rate'?'600分以上占比':'600分以上指标')
   :(keyClass?'重点班特控率':type==='count'?'特控人数':type==='rate'?'特控上线比例':'特控指标');
 return {label,value:keyClass?value.replace(/^重点班/,''):value,type};
}
export function renderOutcomeSummary(record){
 const y=record?.years?.[0];if(!y)return '';
 const metrics=[outcomeMetric(y.score600,y.score600Kind,'600'),outcomeMetric(y.specialControl,y.specialControlKind,'special')].filter(Boolean);
 return `<p class="school-outcome-summary"><strong>${esc(y.year)}高考参考${record.scopeType==='multiple_campuses'?' · 多校区合计':''}</strong><br>${metrics.map(m=>`${esc(m.label)} ${esc(m.value)}`).join(' · ')}<br><small>第三方整理 · ${esc(record.campusScope)}</small></p>`;
}
export function renderOutcomeDetails(record,sources=[]){
 if(!record)return '';
 const item=sources.find(s=>s.id===record.sourceId);let url;
 try{const u=new URL(item?.url);if(u.protocol==='https:')url=u.href;}catch{}
 const cell=(value,kind,subject)=>{const m=outcomeMetric(value,kind,subject);return m?`${esc(m.value)}<small>（${m.type==='count'?'人数':m.type==='rate'?'比例':'原口径'}）</small>`:'未提供';};
 return `<section class="detail-section" id="outcomes"><h2>高考升学表现 · 历史参考</h2><p>${esc(record.sourceSchoolLabel)} · ${esc(record.campusScope)}</p>${record.scopeType==='multiple_campuses'?'<p class="notice">这是多个校区合计，不能作为当前单校区的成绩。</p>':''}<div class="comparison-wrap"><table class="data-table"><thead><tr><th>年份</th><th>600分以上</th><th>特控指标</th></tr></thead><tbody>${record.years.map(y=>`<tr><td>${esc(y.year)}</td><td>${cell(y.score600,y.score600Kind,'600')}</td><td>${cell(y.specialControl,y.specialControlKind,'special')}</td></tr>`).join('')}</tbody></table></div><p class="note">特控指标为达到当年特殊类型招生录取控制线的人数或比例，不等于重点大学录取率。空白表示未提供，不是0。</p><details class="method-details"><summary>口径、差异与来源</summary>${record.issues?.length?`<ul>${record.issues.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}<p>已核对第三方原表转录；学校原始公告、统计分母及是否包含特殊班型尚未核实。人数、比例、重点班及多校区合计保留原口径，不能直接横向排名，也不能单独衡量学校加工能力。这些数据不参与中考机会或方案评分。</p>${item?`<p class="note">${esc(item.title)} · 资料保存 ${esc(item.capturedAt||'未注明')} · 转录核对 ${esc(item.transcriptionReviewedAt||'未注明')}</p>`:''}${url?`<a href="${esc(url)}" target="_blank" rel="noreferrer">查看原表依据（可能需要登录）</a>`:''}</details></section>`;
}
