import { homePage, insightCardMarkup } from '../components/consulting-upgrade.js';
import { SharedMarkup } from '../components/SharedMarkup.jsx';
import { getInsightBySlug } from '../data/insights.js';

export function Home() {
  const selected = ['store-traffic-no-conversion-diagnosis', 'ecommerce-weekly-report-review-framework', 'geo-seo-paid-media-coordination'];
  const cards = selected.map(getInsightBySlug).filter(Boolean).map(insightCardMarkup).join('');
  return <SharedMarkup html={homePage(false, cards)} />;
}
