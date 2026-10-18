// Progressive disclosure only. All original fields, outputs and handlers remain.
function fold(node,key,title){
 if(!node||node.parentElement?.dataset.compactFold===key)return node?.parentElement;
 const details=document.createElement('details');details.className='workflow-disclosure compact-details';details.dataset.compactFold=key;
 const summary=document.createElement('summary');summary.textContent=title;details.append(summary);
 node.before(details);details.append(node);return details;
}
function text(selector,value){const node=document.querySelector(selector);if(node)node.textContent=value;}
export function installMinimalWorkspace(workspace){
 if(workspace.dataset.minimalReady)return;workspace.dataset.minimalReady='true';
 document.body.classList.add('minimal-workspace');
 const advanced=document.querySelector('.advanced-profile-grid');
 advanced.prepend(document.getElementById('score').closest('label'));
 document.getElementById('score').closest('label').childNodes[0].textContent='正常发挥估分（默认取中值）';
 advanced.append(document.getElementById('notAdmittedFirstBatch').closest('label'));
 const confirmations=document.querySelector('.profile-confirmations');if(!confirmations.children.length)confirmations.hidden=true;
 const advancedSummary=document.querySelector('#advancedProfile summary');advancedSummary.innerHTML='<strong>更多条件</strong><small>学费、住宿、资格、模拟设置</small>';
 const region=document.getElementById('regionPreference');
 const regionFold=fold(region?.closest('label'),'region','区域喜好');
 if(regionFold){const picker=document.querySelector('#profileForm .region-picker');if(picker)regionFold.append(picker);document.getElementById('advancedProfile').before(regionFold);}
 fold(document.querySelector('.plan-coach'),'coach','填写检查');
 document.querySelector('#profile .panel-heading h2').textContent='考生条件';
 text('#targetPlanning > summary','目标学校');
 text('#intentPlanning > summary','选学校');
 for(const id of ['targetPlanning','intentPlanning']){const container=document.getElementById(id);if(container)container.querySelector('summary').insertAdjacentHTML('afterend','<p class="mode-condition-summary"><span class="mode-condition-values"></span> <a href="#profile" data-scroll-target="#profile">改条件</a></p>');}
 const saveOptions=document.querySelector('.workspace-save-options');saveOptions.querySelector('summary').textContent='保存、导出与打印';
 const analysis=document.getElementById('analysis');analysis.after(saveOptions);
 const heading=analysis.querySelector('.panel-heading-title h2'),oldTitle=analysis.querySelector('.panel-heading-title');analysis.querySelector('.panel-heading').prepend(heading);oldTitle.remove();
 const saveTools=saveOptions.querySelector('.toolbar');
 saveTools.append(document.getElementById('exportPlan'),document.getElementById('printPlan'));
 text('#exportPlan','导出JSON');text('#printPlan','打印PDF');text('#analysis .analysis-actions a','改志愿');
 document.querySelector('.school-search-disclosure > summary').textContent='添加学校';
 document.querySelector('#analysis .section-hint').textContent='按整份志愿模拟 · 点校名看学校';
 document.querySelector('#analysis .method-details > summary').textContent='数据与规则';
 fold(document.querySelector('#analysis .advice-section'),'advice','查看调整建议');
 const caps=document.getElementById('scoreCaps');document.querySelector('#analysis .score-overview').after(caps);
 const note=document.createElement('p');note.className='compact-result-note note';note.textContent='方案评分不是录取概率 · 仅供参考';document.querySelector('#analysis .score-overview').after(note);
 const more=document.createElement('div');more.id='analysisMore';analysis.querySelector('.method-details').before(more);
 const improvement=document.getElementById('improvementSection').closest('details');improvement.dataset.gate='score';more.append(improvement);improvement.querySelector('summary').textContent='评分明细与补强';
 const advice=analysis.querySelector('[data-compact-fold="advice"]');more.append(advice);
 let queued=false;
 const refresh=()=>{
  queued=false;
  const assumptionsFold=fold(document.getElementById('analysisAssumptions'),'assumptions','分析前提与待确认信息');
  if(assumptionsFold&&assumptionsFold.previousElementSibling!==caps)caps.after(assumptionsFold);
  const readingFold=fold(document.querySelector('#analysis .parent-reading-guide'),'reading','怎么看这份结果');
  if(readingFold&&readingFold.parentElement!==more)more.append(readingFold);
  const changesFold=fold(document.getElementById('planChangeFeedback'),'changes','本次调整');
  if(changesFold&&changesFold.parentElement!==more){changesFold.dataset.gate='score';more.append(changesFold);}
  const advice=document.querySelector('[data-compact-fold="advice"] > summary'),count=document.querySelectorAll('#adviceList > li').length;
  const title=count?`调整建议（${count}条）`:'查看调整建议';if(advice.textContent!==title)advice.textContent=title;
  const assumptions=document.querySelector('[data-compact-fold="assumptions"] > summary');
  if(assumptions){const pending=document.getElementById('referenceGrade').value==='unknown',title=pending?'参考等级待确认 · 分析前提':'分析前提与待确认信息';if(assumptions.textContent!==title)assumptions.textContent=title;}
  if(regionFold){const summary=regionFold.querySelector('summary'),title=`区域喜好 · ${region.selectedOptions[0].textContent}${region.value==='household'?`（${document.getElementById('householdDistrict').value}）`:''}`;if(summary.textContent!==title)summary.textContent=title;}
 };
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(refresh);}};
 new MutationObserver(schedule).observe(workspace,{subtree:true,childList:true});
 workspace.addEventListener('change',schedule);schedule();
}
