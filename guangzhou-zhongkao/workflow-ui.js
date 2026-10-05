// UI composition only; official admission rules stay in the existing engines.
export async function prepareUnifiedWorkspace(){
 if(!document.getElementById('verifyWorkspace'))return;
 document.body.classList.add('unified-workspace');
 const hero=document.querySelector('.page-hero');hero.innerHTML='<h1>排好普通高中志愿</h1><p>填估分生成方案，调整后查看评分与可能去向。</p>';
 const guide=document.querySelector('.workflow-guide');guide.querySelector('.workflow-guide-head').hidden=true;guide.querySelector('[data-flow-step="school"]').remove();
 const steps=guide.querySelectorAll('.workflow-steps button');['填写条件','调整志愿','查看结果'].forEach((text,i)=>{steps[i].querySelector('b').textContent=String(i+1);steps[i].querySelector('strong').textContent=text;});
 document.querySelector('#profile h2').textContent='1 · 分数与条件';
 document.querySelector('#profileForm>p.note').textContent='下限按发挥不理想估计，上限按发挥较好估计。';
 document.body.dataset.uiReady='false';
 document.getElementById('verifyWorkspace').removeAttribute('aria-labelledby');
 for(const id of ['mode','targetYear','riskPreference','realisticSim'])document.querySelector('.advanced-profile-grid').prepend(document.getElementById(id).closest('label'));
 document.querySelector('#advancedProfile summary strong').textContent='更多条件与模拟设置';document.querySelector('#advancedProfile summary small').textContent='年度、历史复盘、公民办、住宿、学费与资格';
 document.getElementById('score').closest('label').childNodes[0].textContent='正常发挥估分';
 const quota=document.getElementById('quotaEligible').closest('label'),quotaDetails=document.getElementById('quotaDetails');
 const optional=document.createElement('details');optional.className='workflow-disclosure';optional.innerHTML='<summary>第二批名额分配（按需带入）</summary><p class="note"><a href="/quota/">先到第二批查询所在初中资料 →</a></p>';optional.append(quota,quotaDetails);document.querySelector('#profileForm').append(optional);
 const actions=document.createElement('div');actions.className='generate-actions';actions.innerHTML='<div class="toolbar"><button id="generateUnified" type="button" class="primary-button">生成志愿，先排顺序</button><button id="manualUnified" type="button" class="ghost-button">我已有计划，直接填写</button></div><div class="toolbar strategy-switch" role="group" aria-label="方案偏好"><span>方案偏好</span><button type="button" data-unified-risk="进取" aria-pressed="false">进取</button><button type="button" data-unified-risk="均衡" aria-pressed="true">均衡</button><button type="button" data-unified-risk="稳健" aria-pressed="false">稳健</button></div><p id="generationStatus" class="note" role="status">生成后先确认学校与顺序，再查看评估。</p>';document.querySelector('#profile').append(actions);
 actions.querySelector('#generateUnified').disabled=true;actions.querySelectorAll('[data-unified-risk]').forEach(b=>b.disabled=true);
 const undo=document.getElementById('undoPlan');undo.className='compact-link';actions.append(undo);
 const savebar=document.querySelector('#verifyWorkspace>.savebar'),saveOptions=document.createElement('details');saveOptions.className='workflow-disclosure workspace-save-options';saveOptions.innerHTML='<summary>方案管理：保存、另存与命名</summary>';document.getElementById('volunteerForm').after(saveOptions);saveOptions.append(savebar);
 const explorer=document.getElementById('schoolExplorer'),search=document.createElement('details');search.className='workflow-disclosure school-search-disclosure';search.innerHTML='<summary>想自己挑学校？展开筛选与添加</summary>';explorer.before(search);search.append(explorer);
 const form=document.getElementById('volunteerForm');form.querySelector('h2').textContent='2 · 排列志愿';form.querySelector('.step-label').textContent='第三、第四批各6个志愿';form.querySelector('.text-link-back').textContent='查找学校';form.querySelector('.text-link-back').addEventListener('click',()=>{search.open=true;});
 document.querySelector('#analysis h2').textContent='3 · 看评分与去向';document.querySelector('#analysis .step-label').textContent='调整后可重新评估';
 const improvement=document.getElementById('improvementSection'),improveDetails=document.createElement('details');improveDetails.className='workflow-disclosure';improveDetails.innerHTML='<summary>查看评分明细与一键调整</summary>';improvement.before(improveDetails);improveDetails.append(document.getElementById('dimensionGrid'),improvement);
 const chance=document.getElementById('chanceList').parentElement,chances=document.createElement('details');chances.className='workflow-disclosure';chances.innerHTML='<summary>查看每个志愿的机会与历史依据</summary>';chance.before(chances);chances.append(chance);
 document.querySelector('.analysis-grid').prepend(document.getElementById('outcomeList').parentElement);
 let printDetails=[];window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('#verifyWorkspace details')].map(el=>[el,el.open]);printDetails.forEach(([el])=>el.open=true);});window.addEventListener('afterprint',()=>printDetails.forEach(([el,open])=>el.open=open));
 try{
  const response=await fetch('/target/');if(!response.ok)throw new Error('目标校组件暂时无法读取');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html'),target=doc.getElementById('targetWorkspace');if(!target)throw new Error('目标校组件缺失');
  const detail=document.createElement('details');detail.id='targetPlanning';detail.className='workflow-disclosure';detail.innerHTML='<summary>我有心仪学校，看看需要冲到多少分</summary>';detail.append(target);form.before(detail);
  target.querySelector('.direction-hero').hidden=true;target.querySelectorAll('#targetForm > label').forEach(label=>{if(!label.classList.contains('target-school-field'))label.hidden=true;});target.querySelector('#targetForm .direction-submit p').hidden=true;
  target.querySelector('#adoptTarget').textContent='生成包含目标校的方案';target.querySelector('#targetForm').insertAdjacentHTML('beforeend','<p class="note">沿用上方考生条件与估分。先看目标分值；生成方案时仍按当前估分评估。</p>');
 }catch(error){const note=document.createElement('p');note.className='note';note.textContent=`${error.message}，可刷新重试。`;actions.append(note);}
}
export function foldSpecialInformation(){
 document.querySelector('.special-hero h1').textContent='第一批 · 特长与自主招生';document.querySelector('.special-hero p').textContent='按特长找学校，或查目标校自主招生要求、往年成绩和开放日。';
 for(const [selector,title] of [['.rules-card','其他招生类别与批次说明'],['.source-card','查看官方资料来源']]){
  const block=document.querySelector(selector);if(!block)continue;const details=document.createElement('details');details.className='workflow-disclosure';details.innerHTML=`<summary>${title}</summary>`;block.before(details);details.append(block);
 }
 const generic=document.querySelector('#qualificationForm');if(generic){const detail=document.createElement('details');detail.className='workflow-disclosure';detail.innerHTML='<summary>通用资格条件自检（选填）</summary>';generic.before(detail);detail.append(generic);}
 document.querySelector('.rules-card')?.insertAdjacentHTML('beforeend','<p class="note">第一批还包括外语艺术类、港澳子弟班、中本贯通及部分中职类别。本系统提供普通高中特长与自主招生资料查询；其他类别请查看<a href="https://gzzk.gz.gov.cn/zkzz/" target="_blank" rel="noreferrer">官方报考指南与报名渠道</a>。</p>');
}
