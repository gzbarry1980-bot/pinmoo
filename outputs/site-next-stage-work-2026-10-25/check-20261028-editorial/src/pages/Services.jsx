import { PageHero } from '../components/PageHero.jsx';
import { servicesContent } from '../components/consulting-upgrade.js';
import { SharedMarkup } from '../components/SharedMarkup.jsx';

export function Services() {
  return <><PageHero title="品牌电商增长咨询服务" subtitle="经营诊断、商品转化、投放复盘与品牌发现。从一个具体问题开始，确定适合的工作范围。" /><SharedMarkup html={servicesContent()} /></>;
}
