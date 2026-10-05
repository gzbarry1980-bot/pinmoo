from pathlib import Path
import json,re
root=Path('E:/pinmoo/guangzhou-zhongkao/research/wecom-source-20261005')
manifest=json.loads((root/'capture-manifest.json').read_text(encoding='utf-8'))
report=[]
for sheet in manifest['sheets']:
    ranges=[]
    for capture in sheet['captures']:
        if capture['horizontal']!=0:continue
        data=json.loads((root/'ocr'/f"{Path(capture['file']).stem}.json").read_text(encoding='utf-8-sig'))
        rows=[]
        for line in data['lines']:
            for word in line['words']:
                value=re.sub(r'\s+','',word['text'])
                if word['x']<44 and word['y']>195 and value.isdigit():
                    row=int(value)
                    if 3<row<=int(re.search(r'\d+',sheet['grid_extent']).group()):rows.append(row)
        if rows:ranges.append({'file':capture['file'],'min':min(rows),'max':max(rows)})
    gaps=[]
    running_end=0
    for part in ranges:
        if running_end and part['min']>running_end+2:gaps.append([running_end+1,part['min']-1])
        running_end=max(running_end,part['max'])
    report.append({'sheet':sheet['name'],'screenshot_count':len(sheet['captures']),'ocr_row_ranges':ranges,'possible_gaps':gaps,'note':'OCR row labels are approximate. Original screenshots remain authoritative; missing OCR labels do not prove missing source rows.'})
(root/'coverage-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for item in report:print(item['sheet'],item['screenshot_count'],'possible_gaps',item['possible_gaps'])
