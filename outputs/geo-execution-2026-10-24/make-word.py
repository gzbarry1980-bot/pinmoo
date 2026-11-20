from pathlib import Path
import json,re
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT=Path(__file__).resolve().parent
ledger=json.loads((ROOT/'执行与发布台账.json').read_text(encoding='utf-8'))
def title_text(s):return re.sub(r'[，。！？、：；｜|?：—]+',' ',s).strip()
def setup(doc):
    sec=doc.sections[0]
    sec.page_height=Cm(29.7);sec.page_width=Cm(21)
    sec.top_margin=sec.bottom_margin=Cm(2.05)
    sec.left_margin=sec.right_margin=Cm(2.25)
    for name in ['Normal','Title','Heading 1','Heading 2']:
        style=doc.styles[name];style.font.name='Microsoft YaHei'
        style.element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'),'微软雅黑')
        style.font.color.rgb=RGBColor(0,0,0)
        style.font.underline=False
        style.paragraph_format.widow_control=True
        ppr=style.element.get_or_add_pPr()
        for node in list(ppr.findall(qn('w:pBdr'))):ppr.remove(node)
        borders=OxmlElement('w:pBdr')
        for side in ['top','left','bottom','right','between']:
            border=OxmlElement('w:'+side);border.set(qn('w:val'),'nil');borders.append(border)
        ppr.append(borders)
    normal=doc.styles['Normal'];normal.font.size=Pt(10.5)
    normal.paragraph_format.line_spacing=1.25
    normal.paragraph_format.space_after=Pt(6)
    doc.styles['Title'].font.size=Pt(19)
    doc.styles['Title'].paragraph_format.space_after=Pt(10)
    for name in ['Heading 1','Heading 2']:
        s=doc.styles[name];s.font.size=Pt(13)
        s.paragraph_format.space_before=Pt(10);s.paragraph_format.space_after=Pt(6)
        s.paragraph_format.keep_with_next=True
    footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=footer.add_run();fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');r._r.addnext(fld)
    footer.style=doc.styles['Normal']
    doc.core_properties.author='品沐咨询'
    doc.core_properties.last_modified_by='品沐咨询 AI辅助整理'

for r in ledger['records']:
    a=r['article'];doc=Document();setup(doc)
    title=doc.add_paragraph(title_text(r['platformTitle']),style='Title')
    borders=OxmlElement('w:pBdr')
    for side in ['top','left','bottom','right','between']:
        border=OxmlElement('w:'+side);border.set(qn('w:val'),'nil');borders.append(border)
    title._p.get_or_add_pPr().append(borders)
    p=doc.add_paragraph('品沐咨询  2026年10月24日');p.paragraph_format.space_after=Pt(12)
    for text in [r['platformOpening'],*a['lead'][1:]]:doc.add_paragraph(text)
    for i,s in enumerate(a['sections']):
        doc.add_paragraph(title_text(r['platformHeaders'][i]),style='Heading 1')
        for text in s['paragraphs']:doc.add_paragraph(text)
    p=doc.add_paragraph(a['disclosure'])
    for run in p.runs:run.font.size=Pt(9)
    doc.add_paragraph('资料来源',style='Heading 1')
    for s in a['sources']:
        p=doc.add_paragraph(s['title']+'\n'+s['url'])
        p.paragraph_format.space_after=Pt(5)
        for run in p.runs:run.font.size=Pt(8)
    out=ROOT/'平台Word'/f'{r["id"]}-{a["slug"]}.docx'
    doc.save(out)
print(json.dumps({'created':len(ledger['records']),'directory':str(ROOT/'平台Word')},ensure_ascii=False))
