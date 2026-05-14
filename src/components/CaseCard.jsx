import { Icon } from './Icon.jsx';

export function CaseCard({ item, featured = false }) {
  const href = '/cases/' + item.slug + '/';
  return (
    <article className={'case-card ' + (featured ? 'case-card-featured' : '')}>
      <a className="case-image" href={href} aria-label={'查看' + item.title}>
        <img src={item.image} alt={item.industry + '项目经验示意图'} loading="lazy" />
      </a>
      <div className="case-card-body">
        <div className="tag-row">
          <span>{item.industry}</span>
          <span>{item.platform}</span>
        </div>
        <h3><a href={href}>{item.title}</a></h3>
        <p>{item.summary}</p>
        <a className="outline-link" href={href}>查看详情 <Icon name="ArrowRight" size={16} /></a>
      </div>
    </article>
  );
}
