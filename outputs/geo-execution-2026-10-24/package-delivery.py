from pathlib import Path
import zipfile,json,hashlib
ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parent.parent
names=['执行结果与发布说明.md','执行与发布台账.json','逐篇发布清单.csv','全计划执行进度.csv','五篇旧文优化记录.md','首批8篇平台文章合订本.md']
files=[ROOT/n for n in names]
for folder in ['官网完整稿','平台发布稿','平台Word','配套工具']:
    files.extend(sorted((ROOT/folder).glob('*')))
manifest=[{'file':str(p.relative_to(ROOT)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(ROOT/'交付文件清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=ROOT/'品沐首批8篇文章与发布资料-2026-10-24.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for p in [*files,ROOT/'交付文件清单.json']:z.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(out) as z:
    if z.testzip():raise RuntimeError('Invalid archive')
    assert len([n for n in z.namelist() if n.endswith('.docx')])==8
source=ROOT/'官网源码留底-2026-10-24.zip'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as z:
    for rel in ['src/data/insights-keyword-batch.js','src/data/insights.js','src/data/reading-paths.js']:z.write(PROJECT/rel,rel)
receipt={'date':'2026-10-24','archive':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'files':len(files)+1,'wordFiles':8,'sourceArchive':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()}
(ROOT/'复核记录'/'交付包检查.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,ensure_ascii=True))
