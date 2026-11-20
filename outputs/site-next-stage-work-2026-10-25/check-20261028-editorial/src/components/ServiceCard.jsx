import { Icon } from './Icon.jsx';

export function ServiceCard({ service, compact = false }) {
  const classes = 'service-card ' + (compact ? 'service-card-compact' : '');
  return (
    <article className={classes}>
      <div className="card-icon"><Icon name={service.icon} size={28} /></div>
      <h3>{service.title}</h3>
      <p>{service.short}</p>
      <a href={service.id === 'geo-consulting' ? '/services/geo-consulting/' : '/contact/'} className="text-link">{service.id === 'geo-consulting' ? '了解品牌 GEO 服务' : '了解咨询方案'} <Icon name="ArrowRight" size={16} /></a>
    </article>
  );
}
