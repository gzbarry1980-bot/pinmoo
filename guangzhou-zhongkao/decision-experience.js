// Parent-facing summaries use the existing model; no separate admission rules.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function primaryOutcome(analysis){
 if(analysis.mode==='replay')return analysis.admitted?.schoolName||'尚未形成确定结果';
 if(analysis.dataInsufficient||!analysis.usableYears?.length)return '资料不足，暂不能判断';
 return analysis.outcomes?.[0]?.slot?.schoolName||'未被当前所填志愿录取';
}
export function confirmAdjustment(beforePlan,nextPlan,beforeScore,nextScore,beforeAnalysis,nextAnalysis){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='adjustment-preview';dialog.setAttribute('aria-label','确认建议调整');
  const changes=nextPlan.filter(r=>r.schoolId!==beforePlan.find(old=>old.key===r.key)?.schoolId);
  dialog.innerHTML=`<h2>先看调整，再决定采用</h2><p>合理度 ${beforeScore} → ${nextScore}分 · 共调整${changes.length}个位置</p><p>主要情景：${esc(primaryOutcome(beforeAnalysis))} → ${esc(primaryOutcome(nextAnalysis))}</p><ol>${changes.map(r=>`<li>第${r.batch}批第${r.position}志愿<br><span>${esc(beforePlan.find(old=>old.key===r.key)?.schoolName||'未填')} → <strong>${esc(r.schoolName||'清空')}</strong></span></li>`).join('')}</ol><p class="note">使用当前条件与同一模型重新模拟，仅供参考；请确认这些学校都愿意就读。</p><div class="toolbar"><button class="button-secondary" type="button" data-cancel>保留原方案</button><button class="button-primary" type="button" data-adopt>采用并重新评估</button></div>`;
  const finish=value=>{dialog.close();dialog.remove();resolve(value);};
  dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-adopt]').onclick=()=>finish(true);dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').focus();
 });
}
export function decisionRisks(profile,analysis,score){
 const risks=[];
 if(analysis.policyContext?.structuralChange)risks.push('2027起科目分值调整：当前仍参考2026及以前成绩分布，机会尚未经新政策录取结果校准。');
 for(const row of analysis.slotResults||[])if(['ineligible','no-data'].includes(row.state))risks.push(`第${row.batch}批第${row.position}志愿 · ${row.schoolName}：${row.reason}`);
 if(profile.referenceGrade==='unknown')risks.push('参考科目等级未确认：当前结果以符合报考要求为前提。');
 risks.push(...(score.suggestions||[]));
 if(analysis.mode==='forecast'&&(analysis.dataInsufficient||!analysis.usableYears?.length))risks.unshift('没有可用的完整历史情景，不能把缺资料理解为一定落选。');
 if(analysis.slotResults?.some(r=>r.confidence==='低'))risks.push('部分学校资料较少或变化较大，采用前请查看历史依据。');
 return [...new Set(risks)];
}
export function renderPlanPreview(profile,plan){
 const form=document.getElementById('volunteerForm');if(!form)return;
 let box=document.getElementById('publicPlanPreview');
 if(!box){box=document.createElement('aside');box.id='publicPlanPreview';box.className='decision-card';form.querySelector('.panel-heading').after(box);}
 const selected=plan.filter(r=>r.schoolId);box.hidden=!selected.length;
 box.innerHTML=`<strong>草案已生成 · ${selected.length}个志愿</strong><p>先核对学校，再确认评估。以下展示前3个位置。</p><ol>${selected.slice(0,3).map(r=>`<li>第${r.batch}批第${r.position}志愿 · <a href="/schools/detail/?id=${encodeURIComponent(r.schoolId)}">${esc(r.schoolName)}</a></li>`).join('')}</ol><small>${esc(profile.scoreLow)}—${esc(profile.scoreHigh)}分 · ${esc(profile.admissionDistrict)} · 学校与顺序可继续修改</small>`;
}
export function renderDecisionSummary(profile,plan,analysis,score,dataset,simulate){
 const section=document.getElementById('analysis');if(!section)return;
 let box=document.getElementById('decisionSummary');
 if(!box){box=document.createElement('section');box.id='decisionSummary';box.className='decision-card';box.setAttribute('aria-label','简版分析');section.querySelector('.panel-heading').after(box);}
 const risks=decisionRisks(profile,analysis,score),selected=plan.filter(r=>r.schoolId),first=selected[0];
 const row=analysis.slotResults?.find(r=>r.key===first?.key);
 const evidence=row?.historicalEvidence;
 const example=row?.reason|| (evidence?.firstChoiceOnlyRate>=50?'这所学校近年多次在第一志愿录满；分数达线，也要结合梯度与所填位置判断。':'录取要同时看分数梯度、志愿位置和当年的招生条件，不能只比较最低分。');
 const lack=analysis.mode==='forecast'&&(analysis.dataInsufficient||!analysis.usableYears?.length);
 const critical=(analysis.slotResults||[]).filter(r=>['ineligible','no-data'].includes(r.state));
 box.innerHTML=`<span class="note">简版分析 · ${esc(profile.targetYear)}年 · ${esc(profile.scoreLow)}—${esc(profile.scoreHigh)}分</span><h3>${lack?'资料不足，需要补充核查':esc(score.label)}</h3><ul class="decision-risks">${risks.slice(0,2).map(t=>`<li>${esc(t)}</li>`).join('')||'<li>未发现明显结构问题；仍需核对当年报考资格、费用与住宿。</li>'}</ul>${critical.length>2?`<details><summary>查看全部资格与资料问题（${critical.length}项）</summary><ul>${critical.map(r=>`<li>第${r.batch}批第${r.position}志愿 · ${esc(r.schoolName)}：${esc(r.reason)}</li>`).join('')}</ul></details>`:''}<details><summary>看一条完整解释</summary><p>${first?`第${first.batch}批第${first.position}志愿 · ${esc(first.schoolName)}：`:''}${esc(example)}</p></details><div class="toolbar"><button type="button" class="button-secondary" data-decision-back>返回调整志愿</button><button type="button" class="button-primary" data-decision-unlock>解锁完整分析</button></div><small>完整分析包含方案合理度、可能去向、逐校依据与调整建议。仅供参考。</small>`;
 box.querySelector('[data-decision-back]').onclick=()=>{document.dispatchEvent(new CustomEvent('zk-workflow-navigate',{detail:{step:'plan'}}));window.ZhongkaoNavigation?.scrollTo('#volunteerForm');};
 const unlock=box.querySelector('[data-decision-unlock]');unlock.onclick=()=>window.ZhongkaoAccess?.showPaywall();
 const sync=()=>{const entitled=window.ZhongkaoAccess?.isEntitled();unlock.hidden=Boolean(entitled);box.querySelector('small').hidden=Boolean(entitled);};sync();
 if(!box.dataset.accessSubscribed){box.dataset.accessSubscribed='true';window.ZhongkaoAccess?.onChange(()=>{const b=document.querySelector('[data-decision-unlock]');if(b)b.hidden=window.ZhongkaoAccess.isEntitled();});}
 let scenarios=document.getElementById('scoreScenarios');
 if(!scenarios){scenarios=document.createElement('details');scenarios.id='scoreScenarios';scenarios.className='workflow-disclosure';scenarios.dataset.gate='chance';const more=section.querySelector('#analysisMore');if(more)more.prepend(scenarios);else section.append(scenarios);}
 scenarios.hidden=analysis.mode!=='forecast';scenarios.innerHTML='<summary>发挥变化，会去哪些学校？</summary><p class="note">固定同一份志愿，分别按估分下限、正常发挥和上限模拟。</p><button class="button-secondary" type="button">比较三种发挥</button><div class="scenario-results" role="status"></div>';
 scenarios.querySelector('button').onclick=async(event)=>{
  if(window.ZhongkaoAccess&&!window.ZhongkaoAccess.guard())return;
  const button=event.currentTarget;button.disabled=true;button.textContent='正在比较…';
  try{
   await new Promise(resolve=>requestAnimationFrame(resolve));
   const rows=[['发挥不理想',profile.scoreLow],['正常发挥',profile.score],['发挥较好',profile.scoreHigh]].map(([label,value])=>{
    const fixed={...profile,score:Number(value),scoreLow:Number(value),scoreHigh:Number(value)};
    const result=simulate(fixed,plan,dataset,20261013,4000);
    return `<article><strong>${esc(label)} · ${value}分</strong><p>主要情景：${esc(primaryOutcome(result))}</p><small>${result.usableYears?.length?`当前志愿未录取的模拟比例：${result.noneProbability}%`:'历史资料不足，暂不显示比例'}</small></article>`;
   });
   scenarios.querySelector('.scenario-results').innerHTML=rows.join('')+'<p class="note">历史情景模拟，非真实录取概率；开启额外波动时，每种发挥还会叠加该设置。</p>';
  }catch{scenarios.querySelector('.scenario-results').textContent='暂时无法比较，请重试。';}
  finally{button.disabled=false;button.textContent='重新比较';}
 };
}
