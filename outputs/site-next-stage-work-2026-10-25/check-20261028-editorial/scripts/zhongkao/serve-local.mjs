import path from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
process.argv[2]=path.join(projectRoot,'guangzhou-zhongkao');
process.env.PORT||='5174';
process.env.ZK_ACCESS_PROXY_ORIGIN||='https://zhongkao.pinmooconsulting.com';
await import('../serve.mjs');
