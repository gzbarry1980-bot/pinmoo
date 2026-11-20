from pathlib import Path
import json,importlib.util,re
import pypdfium2 as pdfium
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parent
render=ROOT/'复核记录'/'word-render'
pages=[]
for pdf in sorted(render.glob('*.pdf')):
    doc=pdfium.PdfDocument(str(pdf))
    for n,page in enumerate(doc):
        dest=render/f'{pdf.stem}-page-{n+1}.png'
        bitmap=page.render(scale=1.25);bitmap.to_pil().save(dest)
        textpage=page.get_textpage();text=textpage.get_text_range()
        blocks=[textpage.get_rect(i) for i in range(textpage.count_rects())]
        pages.append({'doc':pdf.stem,'page':n+1,'png':str(dest),'characters':len(text),'withinPage':all(x0>=0 and y0>=0 and x1<=page.get_width()+1 and y1<=page.get_height()+1 for x0,y0,x1,y1 in blocks)})
        textpage.close();bitmap.close();page.close()
    doc.close()
for part in range(0,len(pages),4):
    chunk=pages[part:part+4];thumbs=[]
    for p in chunk:
        im=Image.open(p['png']).convert('RGB');im.thumbnail((595,842))
        tile=Image.new('RGB',(615,875),'#E7EAEE');tile.paste(im,((615-im.width)//2,25))
        ImageDraw.Draw(tile).text((12,5),p['doc'].split('-')[0]+' / page '+str(p['page']),fill='black')
        thumbs.append(tile)
    board=Image.new('RGB',(1230,1750),'white')
    for i,im in enumerate(thumbs):board.paste(im,((i%2)*615,(i//2)*875))
    board.save(render/f'contact-sheet-{part//4+1}.png')

skill=Path('E:/codex/.codex/skills/geo-content-strategy/scripts/score_geo_content.py')
spec=importlib.util.spec_from_file_location('score_geo',skill);score=importlib.util.module_from_spec(spec);spec.loader.exec_module(score)
scores={p.name:score.score(p.read_text(encoding='utf-8')) for p in sorted((ROOT/'官网完整稿').glob('*.md'))}
receipt={'documents':len(set(p['doc'] for p in pages)),'pages':len(pages),'pagesWithinBounds':all(p['withinPage'] for p in pages),'pages':pages,
 'rendering':'Packaged render_docx.py attempted; missing LibreOffice on PATH. Installed WPS 12 COM exported each DOCX to PDF; bundled pypdfium2 rendered every page to PNG. No PDF-only substitute for DOCX was delivered.',
 'geoHeuristic':scores,'scoreUse':'Formatting heuristic only. No FAQ or fabricated data added to improve scores; original narrative format follows user request. No human approval or independent review is asserted.'}
(ROOT/'复核记录'/'文档及内容检查.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'documents':receipt['documents'],'pageCount':len(pages),'bounds':receipt['pagesWithinBounds'],'sheets':(len(pages)+3)//4,'scores':{k:v['score'] for k,v in scores.items()}},ensure_ascii=True))
