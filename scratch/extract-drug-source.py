import json, re, unicodedata
from pathlib import Path
import pymupdf

OUT = Path(__file__).parent
doc = pymupdf.open(r'C:\Users\User\Downloads\DRUGS INDEX.pdf')
headers = {'Mode of Action :', 'Dosage & Sizes :', 'Indication', 'Contradiction', 'Adverse Reaction', 'Side Effects', 'Side Effects.', 'Special note:'}
records=[]
for num,page in enumerate(doc,1):
    if 'Dosage & Sizes' not in page.get_text(): continue
    fields={k:[] for k in ['title','classification','action','forms','indication','contraindication','adverse','effects','notes','unassigned']}
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            spans=[s for s in line['spans'] if s.get('alpha',255)>0]
            if not spans: continue
            text=''.join(s['text'] for s in spans).strip()
            x=min(s['bbox'][0] for s in spans); y=min(s['bbox'][1] for s in spans)
            if not text or text in headers or text in ['JJ','-']: continue
            text=re.sub(r'JJ$', '',text).strip()
            if not text: continue
            if num==105 and 368<x<370: key='contraindication'
            elif y<58:
                key='title' if max(s['size'] for s in spans)>19 else 'classification'
            elif y<103 and x<455: key='action'
            elif x>=460: key='effects' if y>=255 else 'adverse'
            elif y>=307: key='notes'
            elif y>=130 and x<170: key='forms'
            elif y>=123 and 170<=x<315: key='indication'
            elif y>=128 and 315<=x<460: key='contraindication'
            else: key='unassigned'
            fields[key].append(text)
    records.append({'page':num,**{k:'\n'.join(v) for k,v in fields.items()}})
(OUT/'drug-source-extracted.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print('Records:',len(records))
for r in records:
    print(r['page'],r['title'].replace('\n',' / '), '| CLASS:',r['classification'], '| FORMS:',r['forms'].replace('\n',' '))
    if r['unassigned']: print('UNASSIGNED:',r['unassigned'])
    for k in ['title','classification','action','forms','indication','contraindication','adverse','effects','notes']:
        if not r[k]: print('MISSING:',k)
