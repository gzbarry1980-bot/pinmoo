from pathlib import Path
import sys

sys.path.insert(0, r"E:\pinmoo\workspace\vendor-docxqa")
import mammoth

src = Path(r"E:\pinmoo\outputs\zhongkao\广州中考志愿模拟助手-系统详细介绍.docx")
dst = Path(r"E:\pinmoo\workspace\zhongkao-docx-qa.html")

with src.open("rb") as f:
    result = mammoth.convert_to_html(f)

css = """
@page { size: Letter; margin: 0.78in 0.88in 0.72in; }
* { box-sizing: border-box; }
body { font-family: 'Microsoft YaHei', Arial, sans-serif; color: #263849; font-size: 10.5pt; line-height: 1.35; margin: 0; }
h1 { color: #123b66; font-size: 17pt; margin: 13pt 0 7pt; border-bottom: 1.5pt solid #2e74b5; padding-bottom: 5pt; break-after: avoid; }
h2 { color: #2e74b5; font-size: 13pt; margin: 10pt 0 5pt; break-after: avoid; }
h3 { color: #123b66; font-size: 11.5pt; margin: 7pt 0 3pt; break-after: avoid; }
p { margin: 0 0 6pt; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 8pt; padding-left: 0.5in; }
li { margin-bottom: 4pt; }
table { width: 100%; border-collapse: collapse; margin: 7pt 0 10pt; font-size: 9.2pt; break-inside: auto; }
tr { break-inside: avoid; }
td, th { border: 0.75pt solid #cbd5df; padding: 5pt 6pt; vertical-align: middle; }
thead tr, table tr:first-child { background: #123b66; color: white; font-weight: 700; }
table tr:nth-child(odd):not(:first-child) { background: #f5f8fb; }
a { color: #2e74b5; }
strong { color: #123b66; }
"""
html = f"<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><style>{css}</style></head><body>{result.value}</body></html>"
dst.write_text(html, encoding="utf-8")
print(dst)
for msg in result.messages:
    print(msg)
