import json,re,unicodedata
from pathlib import Path
base=Path(__file__).parent
rows=json.loads((base/'drug-source-extracted.json').read_text(encoding='utf-8'))
mapping={}
def assign(start,names):
    for p,ids in enumerate(names.split('|'),start): mapping[p]=ids.split(',')
assign(2,'bethanechol|pilocarpine|muscarine|nicotine|varenicline|succinylcholine|edrophonium|neostigmine|pyridostigmine|physostigmine|parathion|malathion|sarin,tabun|rivastigmine|galantamine|donepezil')
assign(19,'atropine|darifenacin,fesoterodine,solifenacin,tolterodine|pirenzepine,telenzepine|aclidinium|ipratropium|tiotropium|umeclidinium|hexamethonium|trimethaphan|mecamylamine|pralidoxime|rocuronium|atracurium|mivacurium|pancuronium|tubocurarine|dextromethorphan|vecuronium')
assign(38,'epinephrine|norepinephrine|dopamine|dobutamine|isoproterenol|phenylephrine|albuterol|metaproterenol|terbutaline|salmeterol,formoterol,indacaterol,vilanterol,olodaterol|amphetamine|methamphetamine|ephedrine|cocaine|tyramine')
assign(54,'phentolamine|phenoxybenzamine|prazosin|doxazosin,terazosin|tamsulosin,silodosin|yohimbine|propranolol|timolol,betaxolol|pindolol|nadolol|atenolol|esmolol|metoprolol|nebivolol|butoxamine|labetalol|carvedilol')
assign(72,'hydrochlorothiazide|chlorthalidone|furosemide|spironolactone|clonidine|methyldopa|hexamethonium|trimethaphan|mecamylamine|reserpine|guanadrel|prazosin|doxazosin|propranolol|atenolol|labetalol|nifedipine|verapamil|hydralazine|minoxidil|sodium-nitroprusside|diazoxide|fenoldopam|aliskiren|captopril|enalapril|losartan|candesartan,irbesartan')
assign(101,'nitroglycerin|isosorbide-mononitrate,isosorbide-dinitrate|verapamil|diltiazem|nifedipine|amlodipine|nicardipine|ranolazine|ivabradine|sildenafil,tadalafil,vardenafil')
assign(112,'adenosine|potassium|magnesium')

def clean(t):
    t=unicodedata.normalize('NFKC',t).strip()
    t=re.sub(r'-\n\s*','-',t)
    t=re.sub(r'/\n\s*','/',t)
    t=re.sub(r'\s+',' ',t)
    t=t.replace('Intramuscula r','Intramuscular').replace('Hypersensitivit y','Hypersensitivity')
    t=t.replace('dihydropyridine s','dihydropyridines')
    t=t.replace('Indirect Acting forAlzheimers',"Indirect-acting agents for Alzheimer's disease").replace('Cathecholamines','Catecholamines')
    t=t.replace('starting starter packs','starter packs').replace('competitively competes','competes')
    t=t.replace('gentle tearing duct compression','gentle tear duct compression')
    t=t.replace('avoid drug tolerance loss of efficacy','avoid drug tolerance and loss of efficacy')
    t=t.replace('1 hour before meal','1 hour before a meal')
    if t.startswith('applying eye drops,'): t='When '+t
    if t: t=t[0].upper()+t[1:]
    if t and t[-1] not in '.!?': t+='.'
    return t

flags=[]
def flag(ids,p,field,reason,source):
    for id in ids: flags.append(dict(drug=id,page=p,field=field,reason=reason,source=source))
prepared={}
bad_class={28,35,61,99,101,102,108,109}
bad_action={94,98,99,108,109,112}
for r in rows:
    p=r['page']; ids=mapping[p]
    assert not r['unassigned'],r
    if p in (2,3,4):
        r['classification']='Direct-acting muscarinic agonist'
        r['title']=r['title'].split(' Direct')[0]
    for id in ids:
        fields={}
        for key in ['classification','action','forms','indication','contraindication','adverse','effects','notes']:
            raw=r[key]; value=clean(raw)
            reason=None
            if not value: reason='No corresponding source content; original retained.'
            elif key=='classification' and p in bad_class: reason='Potentially inconsistent classification in source; original retained.'
            elif key=='action' and p in bad_action: reason='Missing receptor/current notation in source; original retained.'
            elif key=='forms' and p==112: reason='Source ends mid-parenthesis after "in 2 mL or 4 mL"; original retained.'
            elif key=='forms' and p==113: reason='Ambiguous "Extended-rate" formulation wording and concentrate values require review; original retained.'
            elif key=='forms' and p==21 and id=='telenzepine': reason='Listed strengths are explicitly for Pirenzepine only; Telenzepine original retained.'
            elif key=='contraindication' and p==20: reason='Severe hepatic impairment is qualified only as "for certain agents" without identifying them; original retained.'
            elif key=='indication' and p in [47,61]: reason='Grouped indication does not identify which uses apply to each individual drug; original retained.'
            elif key=='contraindication' and p==58 and id=='tamsulosin': reason='Grouped restrictions have an agent-specific qualifier but do not fully resolve each restriction by drug; original retained.'
            elif key=='contraindication' and p==25: reason='Source equates milk proteins with lactose; ambiguous wording retained for review rather than corrected.'
            elif key=='notes' and p==110: reason='Source describes up to 36 hours as an elimination half-life while comparing durations of action; original retained pending review.'
            if reason:
                flag([id],p,key,reason,raw); continue
            if key=='forms' and len(ids)>1 and p not in [14,21]:
                chunks=[clean(t) for t in unicodedata.normalize('NFKC',raw).split('•') if t.strip()]
                assert len(chunks)==len(ids),(p,chunks)
                value=chunks[ids.index(id)]
            if key=='indication' and p==99:
                value=('Management of essential hypertension and heart failure.' if id=='candesartan' else 'Management of essential hypertension and nephropathy in type 2 diabetic patients with hypertension.')
            if key=='indication' and p==102 and id=='isosorbide-mononitrate': value='Long-term prophylaxis and management of angina pectoris.'
            if key=='indication' and p==110:
                value={'sildenafil':'Treatment of erectile dysfunction and management of pulmonary arterial hypertension.','tadalafil':'Treatment of erectile dysfunction and management of pulmonary arterial hypertension and benign prostatic hyperplasia symptoms.','vardenafil':'Treatment of erectile dysfunction.'}[id]
            fields[key]=value
        prepared.setdefault(id,[]).append({'page':p,'title':r['title'],'fields':fields})
(base/'drug-update-prepared.json').write_text(json.dumps({'drugs':prepared,'flags':flags},ensure_ascii=False,indent=2),encoding='utf-8')
print('Matched drug identities:',len(prepared),'Source pages:',len(rows),'Flagged fields:',len(flags))
