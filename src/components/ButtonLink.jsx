import { Icon } from './Icon.jsx';

export function ButtonLink({ href = '/contact/', children, variant = 'primary', className = '', icon = true }) {
  const classes = 'btn btn-' + variant + ' ' + className;
  return (
    <a className={classes} href={href}>
      <span>{children}</span>
      {icon && <Icon name="ArrowRight" size={18} />}
    </a>
  );
}
