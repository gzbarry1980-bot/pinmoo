import {initShell,escapeHTML,disclaimer} from '../site-shell.js?v=20261013-school';
import {renderResourceLibrary} from '../resource-library.js?v=20261012-resources';
initShell();
const main=document.getElementById('main');
try{await renderResourceLibrary(main);}catch(error){main.innerHTML=`<div class="empty-state"><h1>资料入口暂时无法读取</h1><p>${escapeHTML(error.message)}</p><button id="retryResources" class="button-secondary">重新加载</button></div>`;document.getElementById('retryResources').onclick=()=>location.reload();}
main.insertAdjacentHTML('beforeend',`<section class="disclaimer"><strong>免责声明</strong><p>${disclaimer}</p></section>`);
