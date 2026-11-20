// School reference deployment: overlay only explicitly approved files,
// verify every preserved file, atomically switch, and roll back on health failure.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const build=path.join(root,'dist/zhongkao');
const version='ui-20261015-member-school-references';
const evidence=path.join(root,'guangzhou-zhongkao/docs/member-school-integration-20261014/online-release-20261015');
const deployRoot='/var/www/zhongkao.pinmoo.top';
const origin='https://zhongkao.pinmooconsulting.com';
const host='root@8.138.23.88';
const key='C:/Users/Administrator/.ssh/pinmoo_aliyun_deploy';
const sshArgs=['-i',key,'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10',host];
const files=['experience.js','experience.css','school-service.js','school-reference-view.js','data/school-references.json',
 'admissions/index.html','plans/index.html','plans/compare/index.html','my/index.html','schools/index.html','schools/detail/index.html','schools/compare/index.html'];
const prune=[];
const dependencies=['engine.js','realistic-sim.js','workspace-store.js','school-service.js','parent-copy.js','form-layout.js',
 'region-preference.js','access-gate.js','access-config.json','unlock/unlock.js','unlock/unlock.css','unlock/validation.js','quota/quota.js'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const run=(exe,args,input)=>{
 const r=spawnSync(exe,args,{cwd:root,input,encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024});
 if(r.error||r.status!==0)throw new Error((r.stderr||r.stdout||r.error?.message||exe+' failed').trim());
 return r.stdout.trim();
};
const remote=code=>JSON.parse(run('ssh',[...sshArgs,'python3 -'],code));
fs.mkdirSync(evidence,{recursive:true});
const preflight=remote(`import pathlib,hashlib,json,subprocess
root=pathlib.Path('${deployRoot}')
base=(root/'current').resolve(strict=True)
assert base.parent==root/'releases', 'Current release is outside the expected directory'
hashes={str(p.relative_to(base)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(base.rglob('*')) if p.is_file()}
curl=['curl','--fail','--silent','--show-error','--max-time','20','--resolve','zhongkao.pinmooconsulting.com:443:127.0.0.1']
access=subprocess.check_output(curl+['${origin}/api/access/config'])
print(json.dumps({'base':str(base),'releaseExists':(root/'releases'/'${version}').exists(),'hashes':hashes,'accessConfigHash':hashlib.sha256(access).hexdigest(),'unlockHTML':(base/'unlock/index.html').read_text()}))
`);
if(preflight.releaseExists)throw new Error('Release already exists; never overwrite an existing version');
const wanted=Object.fromEntries(files.map(file=>[file,hash(fs.readFileSync(path.join(build,file)))]));
for(const file of [...dependencies,...Object.keys(preflight.hashes).filter(f=>f.startsWith('data/'))].filter(f=>!files.includes(f)&&!prune.includes(f))){
 if(hash(fs.readFileSync(path.join(build,file)))!==preflight.hashes[file])throw new Error('Protected dependency differs: '+file);
}
const protectedHashes=Object.fromEntries(Object.entries(preflight.hashes).filter(([file])=>!files.includes(file)&&!prune.includes(file)&&file!=='ui-release.json'));
const report={version,at:new Date().toISOString(),base:preflight.base,files:wanted,protectedHashes,accessConfigHash:preflight.accessConfigHash};
fs.writeFileSync(path.join(evidence,'preflight.json'),JSON.stringify(report,null,2));
console.log('Preflight passed: '+files.length+' approved files; '+Object.keys(protectedHashes).length+' preserved files');
if(!process.argv.includes('--publish'))process.exit(0);

const stage=fs.mkdtempSync(path.join(evidence,'stage-'));
for(const file of files){const dest=path.join(stage,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(build,file),dest);}
const metadata={version,previous:path.posix.basename(preflight.base),uiFiles:files.length,protectedFiles:Object.keys(protectedHashes).length};
fs.writeFileSync(path.join(stage,'ui-release.json'),JSON.stringify(metadata));
const archive=path.join(evidence,version+'.tgz');
run('tar',['-czf',archive,'-C',stage,...files,'ui-release.json']);
const remoteArchive='/tmp/pinmoo-'+version+'.tgz';
run('scp',['-i',key,'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes',archive,host+':'+remoteArchive]);
const payload={...report,prune,remoteArchive,archiveHash:hash(fs.readFileSync(archive)),origin,deployRoot,metadata};
const receipt=remote(`import pathlib,hashlib,json,subprocess,shutil,tarfile,os,time,datetime,zoneinfo
p=json.loads(${JSON.stringify(JSON.stringify(payload))})
root=pathlib.Path(p['deployRoot']);base=pathlib.Path(p['base']);current=root/'current';release=root/'releases'/p['version']
assert current.resolve()==base, 'Current release changed since preflight'
assert not release.exists(), 'Release already exists'
assert release.parent==root/'releases' and release.resolve().is_relative_to((root/'releases').resolve())
archive=pathlib.Path(p['remoteArchive'])
assert archive.parent==pathlib.Path('/tmp') and hashlib.sha256(archive.read_bytes()).hexdigest()==p['archiveHash']
with tarfile.open(archive,'r:gz') as tar:
 members=tar.getmembers();expected=set(p['files'])|{'ui-release.json'}
 assert set(m.name for m in members)==expected and all(m.isfile() for m in members), 'Unexpected archive entries'
 for m in members: assert not pathlib.PurePosixPath(m.name).is_absolute() and '..' not in pathlib.PurePosixPath(m.name).parts
subprocess.run(['nginx','-t'],check=True,capture_output=True)
shutil.copytree(base,release,symlinks=True)
with tarfile.open(archive,'r:gz') as tar:
 for member in tar.getmembers():
  dest=release/member.name
  assert dest.resolve().is_relative_to(release.resolve()) and not dest.is_symlink(), 'Unsafe overlay target'
  dest.parent.mkdir(parents=True,exist_ok=True)
  with tar.extractfile(member) as src, dest.open('wb') as out: shutil.copyfileobj(src,out)
  dest.chmod(0o644)
for name in p['prune']:
 dest=release/name
 assert dest.resolve().is_relative_to(release.resolve()) and not dest.is_symlink(), 'Unsafe public artifact target'
 if dest.exists():
  assert dest.is_file(), 'Only explicit public artifact files may be removed'
  dest.unlink()
for name,expected in p['protectedHashes'].items(): assert hashlib.sha256((release/name).read_bytes()).hexdigest()==expected, 'Preserved file changed: '+name
for name,expected in p['files'].items(): assert hashlib.sha256((release/name).read_bytes()).hexdigest()==expected, 'UI file changed: '+name
curl=['curl','--fail','--silent','--show-error','--max-time','20','--resolve','zhongkao.pinmooconsulting.com:443:127.0.0.1']
switched=False
try:
 next_link=root/('current.next.'+p['version']);assert not next_link.exists() and not next_link.is_symlink()
 next_link.symlink_to(release);os.replace(next_link,current);switched=True
 for name,expected in p['files'].items():
  served=subprocess.check_output(curl+[p['origin']+'/'+name+'?release='+p['version']])
  assert hashlib.sha256(served).hexdigest()==expected, 'Served UI mismatch: '+name
  time.sleep(0.25)
 health=[]
 for route in ['/','/verify/','/schools/','/special/?mode=talent','/special/?mode=autonomous','/quota/','/my/','/unlock/']:
  body=subprocess.check_output(curl+[p['origin']+route]);assert len(body)>500
  if route=='/': assert '你想先做什么？' in body.decode() and '本系统仅供参考' in body.decode()
  health.append({'route':route,'bytes':len(body)});time.sleep(0.25)
 for name in p['prune']:
  status=subprocess.check_output(['curl','--silent','--output','/dev/null','--write-out','%{http_code}','--max-time','20','--resolve','zhongkao.pinmooconsulting.com:443:127.0.0.1',p['origin']+'/'+name]).decode()
  assert status in ['404','410'], 'Public artifact still served: '+name
 config=subprocess.check_output(curl+[p['origin']+'/api/access/config'])
 assert hashlib.sha256(config).hexdigest()==p['accessConfigHash'], 'Access config changed'
 stamp=datetime.datetime.now(zoneinfo.ZoneInfo('Asia/Shanghai')).isoformat()
 metadata=p['metadata']|{'published_at':stamp};(release/'ui-release.json').write_text(json.dumps(metadata))
 print(json.dumps({'status':'deployed','version':p['version'],'previous':str(base),'current':str(release),'verifiedUIFiles':len(p['files']),'protectedFiles':len(p['protectedHashes']),'removedPublicArtifacts':p['prune'],'accessConfigUnchanged':True,'health':health,'published_at':stamp}))
except Exception:
 if switched:
  rollback=root/('current.rollback.'+p['version']);assert not rollback.exists() and not rollback.is_symlink()
  rollback.symlink_to(base);os.replace(rollback,current)
 raise
`);
fs.writeFileSync(path.join(evidence,'release-receipt.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt,null,2));
