import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:\/)/, '$1')), '..');
const route = process.argv[2] || '/';
function createFakeNode() {
  return {
    innerHTML: '', hidden: false, style: {}, dataset: {},
    classList: { toggle(){}, add(){}, remove(){}, contains(){ return false; } },
    addEventListener(){}, setAttribute(){}, getAttribute(){ return null; },
    querySelector(){ return createFakeNode(); }, querySelectorAll(){ return []; }, closest(){ return createFakeNode(); }
  };
}
const rootNode = createFakeNode();
globalThis.document = {
  body: createFakeNode(),
  getElementById(id) { return id === 'root' ? rootNode : createFakeNode(); },
  querySelector() { return createFakeNode(); },
  querySelectorAll() { return []; }
};
globalThis.window = {
  location: { pathname: route, hostname: 'pinmooconsulting.com' },
  addEventListener(){},
  scrollY: 0,
  setTimeout,
  performance: globalThis.performance
};
globalThis.IntersectionObserver = class { constructor(){} observe(){} unobserve(){} disconnect(){} };
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 16);
await import(pathToFileURL(path.join(root, 'src/static-main.js')).href + '?route=' + encodeURIComponent(route));
process.stdout.write(rootNode.innerHTML);
