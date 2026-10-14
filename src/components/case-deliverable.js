import { caseDeliverables } from '../data/case-deliverables.js';
import { escapeMarkup } from './consulting-upgrade.js';

export function caseDeliverableMarkup(slug, en = false) {
  const item = caseDeliverables[slug];
  if (!item) return '';
  const rows = en ? item.rowsEn : item.rows;
  const headers = en ? ['Deliverable', 'What it records', 'What to check'] : ['交付材料', '记录什么', '怎样核对'];
  return `<section class="case-deliverable-example" aria-labelledby="case-deliverable-title"><p class="section-eyebrow">${en ? 'DELIVERABLE OUTLINE' : '交付结构示意'}</p><h2 id="case-deliverable-title">${en ? 'What would the working material look like?' : '交付材料里，会具体记录什么？'}</h2><p>${en ? 'An outline based on the published working approach, not the client\'s original file. It contains no client data or measured results.' : '依据已公开工作方向整理的结构示意，并非客户原始交付文件，不包含客户数据或效果数字。'}</p><div class="insight-table-wrap" tabindex="0" role="region" aria-label="${en ? 'Deliverable outline table' : '交付结构对照表'}"><table><thead><tr>${headers.map(x => `<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${escapeMarkup(row[0])}</th>${row.slice(1).map(x => `<td>${escapeMarkup(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><h3>${en ? 'Before the next phase' : '进入下一阶段前，先确认什么？'}</h3><p>${escapeMarkup(en ? item.nextEn : item.next)}</p></section>`;
}
