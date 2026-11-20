import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
const program = `
import json, pathlib, subprocess, urllib.parse, datetime, time
log=pathlib.Path('/var/log/pinmoo-events/events.log')
page='insights-ecommerce-coaching-pilot-working-methods'
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
offset=log.stat().st_size
def request(event='page_view', headers=None, method='GET', target=page, extra=False):
    query=urllib.parse.urlencode({'event':event,'page':target,'placement':'footer',**({'text':'ignored-test-field'} if extra else {})})
    cmd=['curl','--silent','--show-error','--max-time','15','--resolve','pinmooconsulting.com:443:127.0.0.1','-X',method,'-o','/dev/null','-w','%{http_code}']
    for name,value in (headers or {}).items(): cmd.extend(['-H',name+': '+value])
    return int(subprocess.check_output(cmd+['https://pinmooconsulting.com/_events?'+query],text=True))
normal=request(extra=True)
dnt=request(headers={'DNT':'1'})
gpc=request(headers={'Sec-GPC':'1'})
invalid=request(event='not-an-event')
post=request(method='POST')
samples={p:request(headers={'DNT':'1'},target=p) for p in ['insights-page-8','insights-topic-decision-page-3','insights-cross-channel-assortment-price-comparison','insights-creator-campaign-refund-settlement-review','insights-ai-search-inquiry-fit-service-boundaries']}
time.sleep(0.5)
with log.open() as stream:
    stream.seek(offset)
    rows=[json.loads(line) for line in stream if line.strip()]
mine=[row for row in rows if row.get('page')==page and row.get('event')=='page_view' and row.get('placement')=='footer']
result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'excludeTestWindowStart':start,'excludeTestWindowEnd':datetime.datetime.now(datetime.timezone.utc).isoformat(),'testPage':page,'testPlacement':'footer','normalStatus':normal,'dntStatus':dnt,'gpcStatus':gpc,'invalidEventStatus':invalid,'postStatus':post,'coverageSamples':samples,'matchingLogRecords':len(mine),'allowedFieldsOnly':all(set(row)=={'time','event','page','placement'} for row in rows),'testRecords':mine,'testNote':'One synthetic page_view only; exclude this page/placement/time window from business reporting. No real copy, phone or inquiry event is asserted.'}
print(json.dumps(result,ensure_ascii=False))
assert normal==dnt==gpc==204 and invalid==post==400
assert all(code==204 for code in samples.values())
assert len(mine)==1 and result['allowedFieldsOnly']
`;
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const raw = execFileSync('ssh.exe', ['-i', 'C:/Users/Administrator/.ssh/pinmoo_aliyun_deploy', '-o', 'BatchMode=yes', 'root@8.138.23.88', 'python3 -c ' + quote(program)], { encoding: 'utf8', timeout: 60000 });
const record = JSON.parse(raw);
await fs.writeFile(new URL('./private/event-native-verification.json', import.meta.url), JSON.stringify(record, null, 2), { flag: 'wx' });
console.log(JSON.stringify(record, null, 2));
