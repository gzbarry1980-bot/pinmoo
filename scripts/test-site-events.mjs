import assert from 'node:assert/strict';
import test from 'node:test';
import { validEvent, nginxEvents, pageIds } from './event-schema.mjs';

test('only predefined events, pages and placements are accepted', () => {
  assert.ok(validEvent(new URLSearchParams({ event: 'page_view', page: 'home', placement: 'body' })));
  for (const field of ['event', 'page', 'placement']) {
    const value = new URLSearchParams({ event: 'page_view', page: 'home', placement: 'body' });
    value.set(field, 'arbitrary-private-value');
    assert.equal(validEvent(value), false);
  }
  assert.equal(validEvent(new URLSearchParams()), false);
  assert.ok(pageIds.includes('insights-geo-seo-paid-media-coordination'));
});
test('event log never references request identifiers or free text', () => {
  const format = nginxEvents().split('log_format')[1];
  for (const token of ['$remote_addr', '$request_uri', '$args', '$http_referer', '$http_user_agent', '$cookie']) assert.ok(!format.includes(token));
  assert.match(nginxEvents(), /pinmoo_event_private/);
});
