import { PageHero } from '../components/PageHero.jsx';
import { contactContent } from '../components/consulting-upgrade.js';
import { SharedMarkup } from '../components/SharedMarkup.jsx';

export function Contact() {
  return <><PageHero title="聊聊你的品牌。" subtitle="带着一个经营问题来聊，品牌、平台和当前问题三项即可。" compact /><SharedMarkup html={contactContent()} /></>;
}
