import { insights, insightClusters } from './insights.js';

export const INSIGHT_PAGE_SIZE = 12;
export function indexPath(topic = 'all', page = 1) {
  const base = topic === 'all' ? '/insights/' : '/insights/topic/' + topic + '/';
  return page === 1 ? base : base + 'page/' + page + '/';
}
export function indexArticles(topic = 'all') {
  const cluster = insightClusters.find(item => item.id === topic);
  return cluster ? insights.filter(item => cluster.categories.includes(item.category)) : insights;
}
export const insightIndexRoutes = ['all', ...insightClusters.map(item => item.id)].flatMap(topic => {
  const count = Math.ceil(indexArticles(topic).length / INSIGHT_PAGE_SIZE);
  return Array.from({ length: count }, (_, index) => ({ topic, page: index + 1, path: indexPath(topic, index + 1) }));
});

export function indexForPath(path) {
  return insightIndexRoutes.find(item => item.path.replace(/\/$/, '') === path.replace(/\/$/, ''));
}
