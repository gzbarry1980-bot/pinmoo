import assert from 'node:assert/strict';
import test from 'node:test';
import { copyText } from '../src/components/copy-text.js';

function fakeDocument(result, throws = false) {
  const state = { removed: false, focused: false, selected: false };
  return { state, doc: {
    activeElement: { focus: options => { state.focused = options.preventScroll; } },
    body: { appendChild: () => {} },
    createElement: () => ({ style: {}, setAttribute() {}, select() { state.selected = true; }, remove() { state.removed = true; } }),
    execCommand: () => { if (throws) throw new Error('Unavailable'); return result; }
  } };
}
test('modern clipboard succeeds without fallback', async () => {
  let actual;
  assert.equal(await copyText('message', { clipboard: { writeText: async text => { actual = text; } }, document: null }), true);
  assert.equal(actual, 'message');
});
for (const [label, result, throws] of [['fallback success', true, false], ['fallback rejected', false, false], ['fallback throws', false, true]]) {
  test(label + ' restores focus and removes its temporary input', async () => {
    const { doc, state } = fakeDocument(result, throws);
    const copied = await copyText('message', { document: doc, clipboard: { writeText: async () => { throw new Error('Denied'); } } });
    assert.equal(copied, result);
    assert.deepEqual(state, { removed: true, focused: true, selected: true });
  });
}
test('unsupported copy is reported as failure', async () => {
  assert.equal(await copyText('message', { document: {}, clipboard: null }), false);
});
