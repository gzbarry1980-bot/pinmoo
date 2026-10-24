import { insights, insightClusters } from './insights.js';

export const readingPaths = {
  'pinmoo-quarterly-review-resource-decisions': ['pinmoo-diagnosis-report-to-first-action', 'ecommerce-weekly-report-review-framework', 'ecommerce-project-acceptance-beyond-gmv'],
  'pinmoo-diagnosis-data-minimization': ['pinmoo-first-consultation-materials', 'business-advisor-data-diagnosis-checklist', 'ecommerce-consulting-procurement-brief'],
  'ecommerce-consulting-procurement-brief': ['ecommerce-consulting-pricing-factors', 'ecommerce-consulting-vs-operation-coaching-vs-agency', 'ecommerce-project-acceptance-beyond-gmv'],
  'ecommerce-project-acceptance-beyond-gmv': ['ecommerce-revenue-growth-profit-review', 'ecommerce-consulting-procurement-brief', 'paid-traffic-roi-quality-review'],
  'tmall-jd-same-product-conversion-diagnosis': ['cross-platform-ecommerce-operations-coordination', 'store-traffic-no-conversion-diagnosis', 'business-advisor-data-diagnosis-checklist'],
  'traditional-brand-first-ecommerce-channel-products': ['small-ecommerce-team-channel-priorities', 'sku-choice-overload-and-product-differences', 'guangzhou-ecommerce-consulting-selection'],
  'product-bundle-contribution-cost-review': ['ecommerce-product-structure-review', 'ecommerce-revenue-growth-profit-review', 'ecommerce-refund-governance-playbook'],
  'customer-language-to-article-keywords': ['brand-business-content-for-ai-search', 'sku-choice-overload-and-product-differences', 'product-parameters-versus-customer-fit'],
  'what-is-pinmoo-consulting': ['pinmoo-consulting-services', 'pinmoo-quarterly-review-resource-decisions', 'pinmoo-diagnosis-data-minimization'],
  'ecommerce-consulting-pricing-factors': ['ecommerce-consulting-procurement-brief', 'consulting-price-without-design-production', 'ecommerce-project-acceptance-beyond-gmv'],
  'guangzhou-ecommerce-consulting-selection': ['ecommerce-consulting-procurement-brief', 'traditional-brand-first-ecommerce-channel-products', 'ecommerce-consulting-vs-operation-coaching-vs-agency'],
  'ecommerce-consulting-vs-operation-coaching-vs-agency': ['ecommerce-consulting-procurement-brief', 'pinmoo-client-owner-responsibilities', 'store-diagnosis-vs-coaching-vs-project-optimization'],
  'sku-choice-overload-and-product-differences': ['customer-language-to-article-keywords', 'product-bundle-contribution-cost-review', 'product-parameters-versus-customer-fit'],
  'ecommerce-weekly-report-review-framework': ['business-advisor-data-diagnosis-checklist', 'refund-event-time-versus-order-period-weekly-report', 'paid-traffic-roi-quality-review'],
  'ecommerce-revenue-growth-profit-review': ['paid-traffic-roi-quality-review', 'refund-event-time-versus-order-period-weekly-report', 'ecommerce-weekly-report-review-framework'],
  'paid-traffic-roi-quality-review': ['paid-media-pause-and-organic-orders-observation', 'ecommerce-revenue-growth-profit-review', 'store-traffic-no-conversion-diagnosis'],
  'ecommerce-refund-governance-playbook': ['hero-image-expectation-and-after-sales', 'refund-event-time-versus-order-period-weekly-report', 'ecommerce-customer-service-conversion-review'],
  'refund-event-time-versus-order-period-weekly-report': ['ecommerce-weekly-report-review-framework', 'ecommerce-refund-governance-playbook', 'ecommerce-revenue-growth-profit-review'],
  'hero-image-expectation-and-after-sales': ['ecommerce-refund-governance-playbook', 'customer-service-product-knowledge-support', 'store-traffic-no-conversion-diagnosis'],
  'livestream-viewers-no-orders-diagnosis': ['livestream-established-product-purchase-reasons', 'store-traffic-no-conversion-diagnosis', 'ecommerce-customer-service-conversion-review'],
  'business-advisor-data-diagnosis-checklist': ['ecommerce-weekly-report-review-framework', 'ai-ecommerce-weekly-report-vs-manual-report', 'paid-traffic-roi-quality-review'],
  'store-traffic-no-conversion-diagnosis': ['hero-image-expectation-and-after-sales', 'ecommerce-customer-service-conversion-review', 'livestream-viewers-no-orders-diagnosis'],
  'geo-seo-paid-media-coordination': ['is-your-brand-ready-for-geo', 'geo-30-60-90-day-acceptance', 'paid-traffic-roi-quality-review'],
  'consulting-price-without-design-production': ['ecommerce-consulting-pricing-factors', 'store-diagnosis-vs-coaching-vs-project-optimization', 'how-to-evaluate-ecommerce-consultant'],
  'choose-geo-consulting-provider': ['geo-pricing-scope-and-budget', 'geo-30-60-90-day-acceptance', 'anonymous-ecommerce-case-study-evidence'],
  'tea-brand-geo-content-and-ecommerce-diagnosis': ['xinhui-chenpi-ecommerce-entity-and-content', 'brand-story-to-product-selection', 'geo-seo-paid-media-coordination'],
  'xinhui-chenpi-ecommerce-entity-and-content': ['tea-brand-geo-content-and-ecommerce-diagnosis', 'brand-story-to-product-selection', 'geo-seo-paid-media-coordination']
};

export function relatedInsights(article, articles = insights) {
  const selected = (readingPaths[article.slug] || []).map(slug => articles.find(item => item.slug === slug)).filter(Boolean);
  const cluster = insightClusters.find(item => item.categories.includes(article.category));
  const candidates = articles.filter(item => item.slug !== article.slug && !selected.some(picked => picked.slug === item.slug))
    .map(item => ({ item, score: (item.category === article.category ? 4 : 0) +
      (cluster?.categories.includes(item.category) ? 2 : 0) +
      item.relatedServices.filter(service => article.relatedServices.includes(service)).length * 3 }))
    .filter(entry => entry.score > 0).sort((a, b) => b.score - a.score);
  return [...selected, ...candidates.map(entry => entry.item)].slice(0, 3);
}
