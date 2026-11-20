import fs from 'node:fs/promises';
import { insights } from '../src/data/insights.js';

const slugs = [
  'ecommerce-weekly-report-review-framework', 'ecommerce-revenue-growth-profit-review',
  'paid-traffic-roi-quality-review', 'ecommerce-refund-governance-playbook',
  'refund-event-time-versus-order-period-weekly-report', 'hero-image-expectation-and-after-sales',
  'livestream-viewers-no-orders-diagnosis', 'business-advisor-data-diagnosis-checklist',
  'store-traffic-no-conversion-diagnosis', 'consulting-price-without-design-production',
  'geo-seo-paid-media-coordination', 'choose-geo-consulting-provider',
  'is-your-brand-ready-for-geo', 'geo-pricing-scope-and-budget',
  'geo-30-60-90-day-acceptance', 'ecommerce-customer-service-conversion-review',
  'tea-brand-geo-content-and-ecommerce-diagnosis', 'xinhui-chenpi-ecommerce-entity-and-content'
];
const unbranded = slugs.map(slug => insights.find(item => item.slug === slug));
if (unbranded.some(item => !item)) throw new Error('A probe article is missing');
const branded = insights.filter(item => item.category === '品牌认知').slice(0, 6);
const questions = [...unbranded.map(item => ({ ...item, group: 'category' })), ...branded.map(item => ({ ...item, group: 'brand' }))].map(item => ({
  id: 'Q-' + item.slug, question: item.title, group: item.group,
  articleUrl: 'https://pinmooconsulting.com/insights/' + item.slug + '/', existingBindings: item.probeIds
}));
const output = 'outputs/site-upgrade-2026-10-13';
await fs.mkdir(output, { recursive: true });
await fs.writeFile(output + '/geo-probes.json', JSON.stringify({ preparedOn: '2026-10-13', status: 'questions_prepared_not_measured', questions }, null, 2));
const columns = ['probe_id', 'group', 'question', 'platform', 'repeat', 'tested_at', 'mode', 'status', 'brand_mentioned', 'facts_checked', 'facts_correct', 'citation_urls', 'answer_evidence', 'notes'];
const rows = questions.flatMap(question => ['Doubao', 'DeepSeek', 'Yuanbao'].flatMap(platform => [1, 2].map(repeat => [question.id, question.group, question.question, platform, repeat, '', '', 'NOT_COLLECTED', '', '', '', '', '', ''])));
const cell = value => '"' + String(value).replaceAll('"', '""') + '"';
await fs.writeFile(output + '/geo-baseline.csv', '\uFEFF' + [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n');
console.log(`${questions.length} fixed questions, ${rows.length} pending observation rows; no AI results asserted.`);
