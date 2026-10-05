"""Read-only reconciliation of screenshot OCR. Never overwrites official records."""
from pathlib import Path
import json,re,difflib
from PIL import Image
import numpy as np
root=Path('E:/pinmoo/guangzhou-zhongkao')
research=root/'research/wecom-source-20261005'
manifest=json.loads((research/'capture-manifest.json').read_text())
admissions=json.loads((root/'data/admissions.json').read_text())
def compact(text):return re.sub(r'[\s（）()·]','',text).replace('中字','中学').replace('三云','白云')
def short(name):
    s=compact(name).replace('华南师范大学附属中学','华附').replace('广东实验中学','省实').replace('广州大学附属中学','广附').replace('广东广雅中学','广雅').replace('广州市','').replace('广东','').replace('广州','').replace('校本部','本部').replace('执信路校区','越秀')
    s=re.sub(r'第([一二三四五六七八九十]+)中学',r'\1中',s).replace('校区','').replace('中学','').replace('学校','')
    return s
columns=[(121,241),(241,361),(361,433),(433,505),(505,577),(577,649),(649,721),(721,793),(793,865),(865,937),(937,1009),(1009,1081)]
def borders(img,a,b):
    pixels=np.asarray(img.convert('RGB'))
    dark=(pixels[:,:,0]<100)&(pixels[:,:,1]<100)&(pixels[:,:,2]<100)
    ys=np.where(dark[:,a+3:b-3].mean(axis=1)>.85)[0]
    groups=[]
    for y in ys:
        if y<419 or y>1047:continue
        if not groups or y>groups[-1][-1]+1:groups.append([int(y)])
        else:groups[-1].append(int(y))
    return [sum(g)/len(g) for g in groups]
def cell(words,x1,x2,y1,y2):
    items=[w for w in words if x1+2<=w['x']+w['width']/2<x2-2 and y1+1<w['y']+w['height']/2<y2-1]
    return ''.join(w['text'] for w in sorted(items,key=lambda w:(round(w['y']/10),w['x'])))
raw=[]
for capture in manifest['sheets'][0]['captures']:
    if capture['horizontal']:continue
    image=Image.open(research/capture['file'])
    ocr=json.loads((research/'ocr'/f"{Path(capture['file']).stem}.json").read_text(encoding='utf-8-sig'))
    words=[w for line in ocr['lines'] for w in line['words']]
    boundaries=[borders(image,*c) for c in columns]
    for a,b in zip(boundaries[2],boundaries[2][1:]):
        if b-a<15 or a<420 or b>1046:continue
        middle=(a+b)/2
        values=[]
        for c,(x1,x2) in enumerate(columns):
            edges=boundaries[c]
            lower=max((y for y in edges if y<=middle),default=420)
            upper=min((y for y in edges if y>middle),default=1047)
            values.append(cell(words,x1,x2,lower,upper))
        population=values[2]
        candidate='随迁子女' if '非' in population else '外区生' if '外' in population else '户籍生' if ('户' in population or '区' in population) else None
        if not candidate:continue
        for offset,year in [(3,2026),(6,2025),(9,2024)]:
            number=lambda value:int(value) if re.fullmatch(r'\d{3}',value) else None
            cutoff=number(values[offset]);last=number(values[offset+2])
            if not cutoff or not 300<=cutoff<=810:continue
            vol=int(values[offset+1]) if re.fullmatch('[1-6]',values[offset+1]) else None
            raw.append({'schoolLabel':values[0],'districtLabel':values[1],'candidateType':candidate,'year':year,'batch':3,'cutoffScore':cutoff,'lastVolunteerNo':vol,'lastCandidateScore':last,'screenshot':capture['file'],'y':middle})
records=[];seen=set()
for r in raw:
    key=(r['schoolLabel'],r['candidateType'],r['year'],r['cutoffScore'],r['lastCandidateScore'])
    if key not in seen:seen.add(key);records.append(r)
results=[]
for r in records:
    pool=[a for a in admissions if a['year']==r['year'] and a['batch']==3 and a['candidateType']==r['candidateType'] and a['ownership']=='公办']
    label=short(r['schoolLabel'])
    ranked=sorted([(difflib.SequenceMatcher(None,label,short(a['schoolName'])).ratio(),a) for a in pool if label and short(a['schoolName'])],key=lambda x:x[0],reverse=True)
    match=None;method=None
    if ranked and ranked[0][0]>=.8 and (len(ranked)<2 or ranked[0][0]>ranked[1][0]):match=ranked[0][1];method='name'
    if match is None:
        exact=[a for a in pool if label and short(a['schoolName']) and a['cutoffScore']==r['cutoffScore'] and a['lastCandidateScore']==r['lastCandidateScore'] and difflib.SequenceMatcher(None,label,short(a['schoolName'])).ratio()>=.5]
        if len(exact)==1:match=exact[0];method='name-and-two-scores'
    compared={}
    if match:
        for field in ['cutoffScore','lastCandidateScore','lastVolunteerNo']:
            if r[field] is not None:compared[field]={'reference':r[field],'official':match[field],'equal':r[field]==match[field]}
    results.append({**r,'schoolId':match['schoolId'] if match else None,'schoolName':match['schoolName'] if match else None,'matchMethod':method,'status':'unmatched' if not match else 'consistent' if all(v['equal'] for v in compared.values()) else 'review_required','compared':compared,'officialSourceId':match['sourceId'] if match else None})
summary={'parserVersion':'wecom-ocr-reconcile-1.0','sourceSheet':'近4年第三批户籍生录取分数线','extractedRecords':len(results),'consistent':sum(r['status']=='consistent' for r in results),'reviewRequired':sum(r['status']=='review_required' for r in results),'unmatched':sum(r['status']=='unmatched' for r in results),'policy':'No OCR values overwrite official data. Inferred score-band table is excluded from the admission model. Full third-party source remains private.','records':results}
(research/'reconciliation-admissions.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='records'},ensure_ascii=False))
