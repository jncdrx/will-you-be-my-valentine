"""Replace the folio's embedded drug data with the entries from `midterm drug index.pdf`.

Rewrites the sample-drugs, project-data and pdf-source-data blocks of public/folio.html
(and its identical copy public/folio/index.html). Handwriting glyphs and page settings are kept.
"""
import json, re, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = Path(r'C:\Users\User\Downloads\midterm drug index.pdf')
PDF_NAME = 'midterm drug index.pdf'
TODAY = '2026-10-07'

SECTIONS = {
    'SMOOTH MUSCLE DRUGS': 'Smooth muscle drugs',
    'CARDIOVASCULAR MEDICATION': 'Cardiovascular medication',
    'ENDOCRINE GLANDS': 'Endocrine glands',
}
FIELD_KEYS = {
    'drug': 'drug',
    'mode of action': 'action',
    'dosage and size available': 'dosage',
    'dosage/size': 'dosage',
    'indication': 'indication',
    'contraindication': 'contraindication',
    'adverse reaction': 'adverse',
    'side effects': 'effects',
    'special notes': 'notes',
}
FIELD_RE = re.compile(r'^\s*(?:\d+\.\s+)?(Drug|Mode of action|Dosage and size available|Dosage/Size|Indication|'
                      r'Contraindication|Adverse reaction|Side effects|Special notes):\s*(.*)$', re.I)
NUM_RE = re.compile(r'^\s*\d+\.\s+(\S.*)$')

raw = subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', str(PDF), '-'], capture_output=True, check=True).stdout.decode('utf-8')
raw = unicodedata.normalize('NFKC', raw)  # PDF uses ligature glyphs (e.g. U+FB02) the handwriting can't draw
pages = raw.split('\f')

# Flatten to (page, line) so every entry can cite its PDF page.
lines = [(i + 1, ln.rstrip()) for i, pg in enumerate(pages) for ln in pg.split('\n')]

entries, cur, section = [], None, 'Gastrointestinal'


def start(name, page, heading):
    global cur
    cur = {'heading': heading, 'name': name, 'group': section, 'pages': {page}, 'fields': {}, 'last': None}
    entries.append(cur)


for idx, (page, ln) in enumerate(lines):
    s = ln.strip()
    if not s:
        continue
    if s in SECTIONS:
        section, cur = SECTIONS[s], None
        continue
    fm = FIELD_RE.match(ln)
    if fm:
        key = FIELD_KEYS[fm.group(1).lower()]
        if cur is None:
            continue
        cur['fields'][key] = fm.group(2).strip()
        cur['last'] = key
        cur['pages'].add(page)
        continue
    nm = NUM_RE.match(ln)
    if nm:
        # Numbered line that is not a field label = new entry heading (sections 2-4).
        start(nm.group(1).strip(), page, nm.group(1).strip())
        continue
    # Gastrointestinal section: bare name line directly before "1. Drug:".
    nxt = next((l for _, l in lines[idx + 1: idx + 4] if l.strip()), '')
    if re.match(r'^\s*1\.\s+Drug:', nxt):
        start(s, page, s)
        continue
    if cur is not None and cur['last']:
        prev = cur['fields'][cur['last']]
        cur['fields'][cur['last']] = prev + ('' if prev.endswith('-') else ' ') + s
        cur['pages'].add(page)
    # else: intro / page furniture


def clean(v):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', v)).strip()


slugs, drugs, report, source_pages = set(), [], [], []
for e in entries:
    heading = e['heading']
    alias = ''
    m = re.match(r'^(.*?)\s*\(listed as "([^"]+)"\)\s*$', heading)
    if m:
        heading, alias = m.group(1), m.group(2)
    name = heading
    f = {k: clean(v) for k, v in e['fields'].items()}
    f.setdefault('drug', heading)
    fields = {k: f.get(k, '') for k in ['drug', 'action', 'dosage', 'indication', 'contraindication', 'adverse', 'effects', 'notes']}
    missing = [k for k, v in fields.items() if not v]
    assert not missing, (heading, missing)
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    while slug in slugs:
        slug += '-2'
    slugs.add(slug)
    pg = sorted(e['pages'])
    field_pages = {k: pg for k in ['drug', 'action', 'indication', 'contraindication', 'adverse', 'effects', 'notes', 'forms']}
    pdf_source = {'file': PDF_NAME, 'pages': pg, 'grouped': False, 'issues': [], 'fieldPages': field_pages,
                  'heldFields': [], 'missing': False, 'sourceHeadings': [e['heading']], 'updatedFields': list(fields)}
    drugs.append({
        'id': slug, 'name': name, 'tag': e['group'], 'checked': TODAY, 'edited': True,
        'fields': fields, 'sources': [], 'fieldSources': {k: 'PDF' for k in fields},
        'groups': [e['group']], 'status': 'PDF matched',
        'market': 'Study transcription from the supplied PDF; not independently clinically verified.',
        'aliases': alias, 'chartNote': 'PDF page ' + ', '.join(map(str, pg)) + '.',
        'sectionColors': {}, 'sectionFormats': {}, 'sectionLayouts': {}, 'pageLayouts': {},
        'preservedDoseScope': '', 'pdfSource': pdf_source,
    })
    report.append({'id': slug, 'name': name, **pdf_source})
    source_pages.append({'id': slug, 'page': pg[0], 'name': e['heading'], 'classification': e['group'],
                         **{k: v for k, v in fields.items() if k != 'drug'}, 'forms': fields['dosage']})

print('non-ASCII:', sorted({c for d in drugs for v in d['fields'].values() for c in v if ord(c) > 127}))
print(len(drugs), 'entries;', {g: sum(1 for d in drugs if d['groups'][0] == g) for g in dict.fromkeys(d['groups'][0] for d in drugs)})

html_path = ROOT / 'public' / 'folio.html'
html = html_path.read_text(encoding='utf-8')


def block(i):
    return re.search(r'(<script id="%s" type="application/json">)(.*?)(</script>)' % i, html, re.S)


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


project = json.loads(block('project-data').group(2))
project['drugs'] = drugs
project['selected'] = drugs[0]['id']
project['library'] = {'query': '', 'group': '', 'sort': 'chart', 'review': 'all'}
project['portableId'] = 'midterm-drug-index-20261007'  # new local-storage key: old saved copies stay out

def sub(i, payload):
    global html
    m = block(i)
    html = html[:m.start(2)] + payload + html[m.end(2):]

sub('sample-drugs', dump(drugs))
sub('project-data', dump(project))
sub('pdf-source-data', dump({'file': PDF_NAME, 'totalPages': len(pages) - (1 if pages[-1].strip() == '' else 0),
                             'sourcePages': source_pages, 'report': report}))

# Source-review dialog: key source text by entry (many drugs share a page) and drop old-PDF wording.
old = "`DRUGS INDEX(1).pdf · ${m.pages.length===1?'page':'pages'} ${m.pages.join(', ')}. Dose / Scope comes from your original folio, not this PDF.`"
new = "`${PDF_SOURCE.file} · ${m.pages.length===1?'page':'pages'} ${m.pages.join(', ')}.`"
assert old in html
html = html.replace(old, new)
old = "PDF_SOURCE.sourcePages.find(p=>p.page===n)"
assert html.count(old) == 1
html = html.replace(old, "PDF_SOURCE.sourcePages.find(p=>p.page===n&&(!p.id||p.id===record.id))")
# Dosage text now has no protected DOSE / SCOPE tail, so only add the legacy heading when one exists.
old = "return 'FORMS / STRENGTHS\\n'+String(forms).replace(/\\s+$/,'')+(tail?'\\n'+tail:'');"
assert old in html
html = html.replace(old, "return (tail?'FORMS / STRENGTHS\\n':'')+String(forms).replace(/\\s+$/,'')+(tail?'\\n'+tail:'');")
# Category accents for the new sections (same palette as the old chart columns).
old = " 'autonomic':'#aa285d',"
assert old in html
html = html.replace(old, old + "\n 'gastrointestinal':'#286444','smooth muscle drugs':'#795035','cardiovascular medication':'#efaa32','endocrine glands':'#7041a0',")

html_path.write_text(html, encoding='utf-8')
(ROOT / 'public' / 'folio' / 'index.html').write_text(html, encoding='utf-8')
print('written', len(html))
