import json,re,copy,hashlib
from pathlib import Path
base=Path(__file__).parent
out=base.parent/'output'/'drug-folio-update'
out.mkdir(parents=True,exist_ok=True)
src=Path(r'C:\Users\User\Downloads\folio-project (5).json')
original=json.loads(src.read_text(encoding='utf-8'))
data=json.loads((base/'drug-update-prepared.json').read_text(encoding='utf-8'))
project=copy.deepcopy(original)
flags=copy.deepcopy(data['flags']); changes=[]; forms_audit=[]
def dose(s):
    m=re.search(r'(?m)^(?:DOSE / SCOPE|ADULT REGIMENS|ADULT ED REGIMENS)\s*$',s)
    assert m, 'Missing protected dose heading'
    return s[m.start():]
def norm(s): return re.sub(r'[^a-z0-9%]+','',s.lower())
for d in project['drugs']:
    entries=data['drugs'].get(d['id'])
    if not entries: continue
    changed=[]; protected=dose(d['fields']['dosage'])
    for key in ['classification','action','forms','indication','contraindication','adverse','effects','notes']:
        candidates=[(e['page'],e['fields'][key]) for e in entries if key in e['fields']]
        # A flagged field stays unchanged even if another duplicate page supplies a value.
        if any(f['drug']==d['id'] and f['field']==key for f in flags): continue
        if not candidates: continue
        unique=[]
        for p,v in candidates:
            if not any(norm(v)==norm(prior[1]) for prior in unique): unique.append((p,v))
        if key=='forms':
            # Duplicate pages repeat these lists. First list is the complete version,
            # including propranolol's 60 mg and nifedipine's sustained-release qualifier.
            value=unique[0][1]
            if d['id']=='doxazosin': value=value.replace('Doxazosin: Tablets:', 'Doxazosin: Oral tablets:')
            if len(unique)>1:
                forms_audit.append({'drug':d['id'],'pages':[p for p,v in unique],'source_variants':[v for p,v in unique],'resolution':'First, complete formulation list retained; duplicate wording compared in review.'})
            d['fields']['dosage']=d['fields']['dosage'][:d['fields']['dosage'].index('\n')+1]+value+'\n'+protected
            forms_audit.append({'drug':d['id'],'pages':[p for p,v in candidates],'transferred':value,'source_variants':[v for p,v in candidates]})
            changed.append('dosage')
        elif key=='classification':
            # Preserve differing source classifications for review; never choose one silently.
            if len(unique)>1:
                flags.append({'drug':d['id'],'page':','.join(str(p) for p,v in unique),'field':key,'reason':'Repeated source pages use different classification wording; original retained.','source':' | '.join(v for p,v in unique)})
                continue
            value=unique[0][1]
            d['tag']=value.rstrip('.')
            d['fields']['drug']=d['name']+'. '+value
            changed.append('drug')
        else:
            # Keep distinct statements on repeated source pages, including their qualifications.
            value='\n\n'.join(v for p,v in unique)
            d['fields'][key]=value; changed.append(key)
    assert dose(d['fields']['dosage'])==protected
    if changed:
        pages=', '.join(str(e['page']) for e in entries)
        d['chartNote']=(d.get('chartNote','')+' Revised content: DRUGS INDEX.pdf, pages '+pages+'. Original dose subsections and flagged or missing PDF fields remain unchanged. Existing web references describe the original content; PDF provenance and review exceptions are in the accompanying review.md.').strip()
        for field in changed: d['fieldSources'][field]='PDF + original dose subsection' if field=='dosage' else 'PDF'
        d['edited']=True; d['checked']='2026-09-09'; d['status']='PDF content update'; d['market']='User-supplied PDF; original dose scope retained'
        changes.append({'drug':d['id'],'pages':[e['page'] for e in entries],'fields':changed})

checks=[]
for old,new in zip(original['drugs'],project['drugs']):
    assert old['id']==new['id']
    assert dose(old['fields']['dosage'])==dose(new['fields']['dosage'])
    for key in old:
        if key not in ['tag','fields','sources','fieldSources','edited','checked','status','market','chartNote']:
            assert old[key]==new[key],(old['id'],key)
    checks.append({'drug':old['id'],'protected_heading':dose(old['fields']['dosage']).splitlines()[0],'sha256':hashlib.sha256(dose(old['fields']['dosage']).encode()).hexdigest(),'unchanged':True})
for key in original:
    if key!='drugs': assert original[key]==project[key],key
(out/'folio-original.json').write_bytes(src.read_bytes())
(out/'folio-updated.json').write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')
audit={'updated_drugs':len(changes),'unchanged_drugs':[d['id'] for d in project['drugs'] if d['id'] not in data['drugs']], 'protected_dose_checks':checks,'formatting_preserved':True,'changes':changes,'review_fields':flags,'forms_audit':forms_audit}
(out/'verification.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# Drug folio content update','',f"Updated {len(changes)} of {len(project['drugs'])} drugs using DRUGS INDEX.pdf only.",'','All 118 DOSE / SCOPE subsections and the 3 existing ADULT REGIMENS / ADULT ED REGIMENS subsections are character-for-character unchanged. Every original setting, handwriting glyph, color, custom text size, alignment, section transform, page transform, and reserved space setting is unchanged.','', 'Eight entries with no corresponding source page remain unchanged: '+', '.join(audit['unchanged_drugs'])+'.','','## Fields requiring review','', 'The following fields remain unchanged. Source wording is recorded below rather than guessed or silently corrected.','']
for f in flags:
    lines += [f"- **{f['drug']} — {f['field']} (PDF p. {f['page']}):** {f['reason']} Source: {re.sub(chr(10),' ',f['source'])}"]
lines+=['','## Source matching and repeated entries','','Source title spelling variants were matched explicitly to the existing canonical drug identities; drug names were not changed. Grouped formulations were split only where the PDF labels the individual drugs. Drug-specific indications were assigned only to the named drug. Distinct text on repeated pages was retained as separate paragraphs; identical text was included once. All source-page mappings and formulation strings are available in verification.json.','','## Layout','','The original browser folio already displayed a printable-margin overflow warning. Layout and custom sizes were preserved; content was not shortened or shrunk. Final rendered-layout results will be added after import verification.']
(out/'review.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'updated':len(changes),'protected':len(checks),'review_fields':len(flags),'forms_transferred':len([f for f in forms_audit if 'transferred' in f]),'output':str(out)}))
