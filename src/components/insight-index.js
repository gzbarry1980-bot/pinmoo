import { insights, insightClusters } from '../data/insights.js';
import { indexPath, indexArticles, INSIGHT_PAGE_SIZE } from '../data/insight-index.js';
import { insightCardMarkup, resourceCards } from './consulting-upgrade.js';

export function insightIndexContent(topic = 'all', page = 1) {
  const items = indexArticles(topic);
  const cluster = insightClusters.find(item => item.id === topic);
  const count = Math.ceil(items.length / INSIGHT_PAGE_SIZE);
  const shown = items.slice((page - 1) * INSIGHT_PAGE_SIZE, page * INSIGHT_PAGE_SIZE);
  const links = ['all', ...insightClusters.map(item => item.id)].map(id => `<a href="${indexPath(id)}" data-cluster="${id}"${id === topic ? ' aria-current="page"' : ''}>${id === 'all' ? '全部' : insightClusters.find(item => item.id === id).title}</a>`).join('');
  const pagination = Array.from({ length: count }, (_, i) => `<a href="${indexPath(topic, i + 1)}"${page === i + 1 ? ' aria-current="page"' : ''} aria-label="第${i + 1}页">${i + 1}</a>`).join('');
  const searchCards = insights.map(article => {
    const category = insightClusters.find(item => item.categories.includes(article.category))?.id || 'all';
    return `<div data-search-topic="${category}">${insightCardMarkup(article)}</div>`;
  }).join('');
  return `<section class="section insights-index-section"><div class="container"><div class="insights-index-intro"><p class="section-eyebrow">PINMOO INSIGHTS</p><h2>${cluster ? cluster.title : '从一个问题，找到下一步。'}</h2><p>${cluster ? cluster.summary : '关于商品、经营和品牌发现的实用判断。选择当前问题，或搜索全部文章。'}</p><a class="text-link" href="/resources/operating-templates/">实用资料与模板 ↗</a></div><form class="insight-search" role="search"><label for="insightSearch">搜索全部文章</label><input id="insightSearch" name="q" type="search" placeholder="例如：转化、退款、GEO" autocomplete="off"><button type="button" id="insightReset" class="search-reset" hidden>清空搜索</button><output id="insightCount" aria-live="polite">${items.length} 篇文章 · 第 ${page} / ${count} 页</output></form><nav class="insight-cluster-nav" aria-label="经营洞察主题">${links}</nav><div id="insightEmpty" class="insight-empty" hidden><h2>暂时没有找到匹配文章。</h2><p>试试“退款”“投放”或“页面”。</p><button type="button" class="btn btn-secondary" data-reset-insights>清空搜索</button></div><div id="insightResults" class="insight-card-grid" data-topic="${topic}">${shown.map(insightCardMarkup).join('')}</div><template id="insightSearchCards">${searchCards}</template><nav class="insight-pagination" aria-label="文章分页">${page > 1 ? `<a href="${indexPath(topic, page - 1)}" rel="prev">上一页</a>` : ''}${pagination}${page < count ? `<a href="${indexPath(topic, page + 1)}" rel="next">下一页</a>` : ''}</nav><noscript><p>可按主题和页码浏览全部文章。</p></noscript><section class="insights-resource-preview"><h2>复盘时，可以直接用这些表。</h2><div class="practical-resource-grid">${resourceCards()}</div></section></div></section>`;
}
