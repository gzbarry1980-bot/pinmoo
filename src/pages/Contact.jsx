import { PageHero } from '../components/PageHero.jsx';
import { contactContent } from '../components/consulting-upgrade.js';
import { SharedMarkup } from '../components/SharedMarkup.jsx';

export function Contact() {
  return <><PageHero title="聊聊你的品牌，和当前最想解决的问题。" subtitle="店铺增长、商品转化、投放、复购或GEO，都可以从一个具体问题开始。" compact /><SharedMarkup html={contactContent()} /></>;
}
