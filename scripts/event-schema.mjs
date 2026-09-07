import { routeMeta } from '../src/data/seo.js';

export const events = ['page_view', 'report_open', 'wechat_copy', 'phone_click'];
export const placements = ['body', 'header', 'hero', 'footer', 'mobile'];
export const pageIds = [...new Set(routeMeta.filter(route => !route.aiTool && !route.duplicate).map(route => route.path === '/' ? 'home' : route.path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-')))];

export function validEvent(query) {
  return events.includes(query.get('event')) && pageIds.includes(query.get('page')) && placements.includes(query.get('placement'));
}

function map(name, values) {
  return `map $arg_${name} $pinmoo_event_${name} {\n  default "";\n${values.map(value => `  ~^${value}$ "${value}";`).join('\n')}\n}\n`;
}

export function nginxEvents() {
  return '# Generated from the public route and event allowlists. No raw query or visitor identifiers are logged.\n' +
    map('event', events) + map('page', pageIds) + map('placement', placements) +
    `map "$request_method:$pinmoo_event_event:$pinmoo_event_page:$pinmoo_event_placement" $pinmoo_event_valid {\n  default 0;\n  ~^GET:[a-z_]+:[a-z0-9-]+:[a-z]+$ 1;\n}\n` +
    `map "$http_dnt:$http_sec_gpc" $pinmoo_event_private {\n  default 0;\n  ~1 1;\n}\n` +
    `map "$pinmoo_event_valid:$pinmoo_event_private" $pinmoo_event_log {\n  default 0;\n  "1:0" 1;\n}\n` +
    `log_format pinmoo_events escape=json '{"time":"$time_iso8601","event":"$pinmoo_event_event","page":"$pinmoo_event_page","placement":"$pinmoo_event_placement"}';\n`;
}
