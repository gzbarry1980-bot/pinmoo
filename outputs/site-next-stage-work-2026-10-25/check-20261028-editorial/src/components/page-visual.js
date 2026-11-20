export function pageVisual(path = '/') {
  const section = path.replace(/^\/(en|zh)(?=\/|$)/, '').split('/').filter(Boolean)[0];
  const key = ['cases', 'insights', 'about', 'contact'].includes(section) ? section : 'services';
  return `/assets/visuals/brand-${key}.webp?v=people-20260918`;
}
