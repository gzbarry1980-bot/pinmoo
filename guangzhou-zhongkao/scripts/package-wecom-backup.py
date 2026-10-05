from pathlib import Path
import json, zipfile, hashlib
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
root=Path('E:/pinmoo/guangzhou-zhongkao/research/wecom-source-20261005')
manifest=json.loads((root/'capture-manifest.json').read_text(encoding='utf-8'))
pdf=root/'full-screenshot-backup.pdf'
c=canvas.Canvas(str(pdf),pagesize=(960,540))
c.setTitle('WeCom spreadsheet screenshot backup - 2026-10-05')
count=0
for index,sheet in enumerate(manifest['sheets'],1):
    first=True
    for capture in sheet['captures']:
        img=root/capture['file']
        if hashlib.sha256(img.read_bytes()).hexdigest()!=capture['sha256']:
            raise ValueError(f'Screenshot checksum mismatch: {img}')
        with Image.open(img) as im: width,height=im.size
        c.setPageSize((width/2,height/2))
        c.drawImage(ImageReader(str(img)),0,0,width=width/2,height=height/2)
        if first:
            bookmark=f'sheet{index}'
            c.bookmarkPage(bookmark)
            c.addOutlineEntry(f'Sheet {index}',bookmark,level=0)
            first=False
        c.showPage();count+=1
c.save()
assert len(manifest['sheets'])==8, 'Incomplete sheet inventory'
zip_path=root/'wecom-full-backup-20261005.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
    for file in [root/'capture-manifest.json',root/'coverage-check.json',root/'ocr-full-unverified.md',root/'access-audit.md',pdf]:
        if file.exists():z.write(file,file.name)
    for sheet in manifest['sheets']:
        for capture in sheet['captures']:
            f=root/capture['file'];z.write(f,capture['file'])
            ocr=root/'ocr'/f'{f.stem}.json'
            if ocr.exists():z.write(ocr,f'ocr/{ocr.name}')
print(json.dumps({'sheets':len(manifest['sheets']),'pages':count,'pdf':str(pdf),'zip':str(zip_path),'zip_bytes':zip_path.stat().st_size},ensure_ascii=False))
