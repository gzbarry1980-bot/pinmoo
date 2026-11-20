import { PageHero } from '../components/PageHero.jsx';
import { aboutContent } from '../components/consulting-upgrade.js';
import { SharedMarkup } from '../components/SharedMarkup.jsx';

export function About() {
  return <><PageHero title="认识品沐，认识与你一起做判断的顾问。" subtitle="面向消费品牌，把经营问题拆清楚，把关键动作推进到团队的日常工作。" /><SharedMarkup html={aboutContent()} /></>;
}
