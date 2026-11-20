export async function copyText(text, options = {}) {
  const doc = options.document || globalThis.document;
  const clipboard = Object.hasOwn(options, 'clipboard') ? options.clipboard : globalThis.navigator?.clipboard;
  try {
    if (clipboard?.writeText) {
      await clipboard.writeText(text);
      return true;
    }
  } catch { /* Try a user-initiated local copy before showing manual instructions. */ }
  if (!doc?.execCommand) return false;
  const previous = doc.activeElement;
  const input = doc.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  try {
    doc.body.appendChild(input);
    input.select();
    return doc.execCommand('copy') === true;
  } catch {
    return false;
  } finally {
    input.remove();
    previous?.focus?.({ preventScroll: true });
  }
}
