import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

for (const path of ['public/folio.html', 'public/folio/index.html']) {
  test(`${path}: live edits reuse handwriting assets and unchanged inline editors`, () => {
    const dom=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:text.length})});w.requestAnimationFrame=()=>1;
      const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
      w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then('))+`window.api={layoutAndRender,get state(){return state}};`);
      // The harness evaluates only the app's startup script; supply the one late-defined helper the render calls.
      w.applyPageToolDOM=()=>{};
      const a=w.api,drug=a.state.drugs.find(d=>d.id===a.state.selected);
      for(const key of Object.keys(drug.fields))drug.fields[key]='A short note';
      a.layoutAndRender();
      assert.ok(w.document.querySelector('#preview svg'),'the live preview is rendered');
      const asset=w.document.querySelector('[data-folio-preview-assets] symbol');
      assert.ok(asset,'handwriting assets live outside the changing preview');
      assert.equal(w.document.querySelectorAll('#preview image').length,0,'no image payload is rebuilt per edit');
      const action=w.document.querySelector('.inline-editor[data-field="action"]');
      const active=w.document.querySelector('.inline-editor[data-field="drug"]');
      const svgRoot=w.document.querySelector('#preview svg');
      a.layoutAndRender();
      assert.equal(w.document.querySelector('.inline-editor[data-field="action"]'),action);
      drug.fields.drug='A short edit';a.layoutAndRender();
      assert.equal(w.document.querySelector('#preview svg'),svgRoot,'the live SVG root remains mounted');
      assert.equal(w.document.querySelector('.inline-editor[data-field="drug"]'),active,'typing keeps the same editable element');
      assert.equal(w.document.querySelector('[data-folio-preview-assets] symbol'),asset);
      assert.equal(w.document.querySelector('.inline-editor[data-field="action"]'),action,'unaffected section retains its DOM');
      // Typing must not tear down printed strokes it did not change (that forced a full layout per key).
      const card=key=>w.document.querySelector(`#preview .section-card[data-section="${key}"]`);
      const untouched=card('action'),editedBefore=card('drug').outerHTML;
      drug.fields.drug='A short edit, more';a.layoutAndRender();
      assert.equal(card('action'),untouched,'unchanged printed section keeps its SVG nodes');
      assert.notEqual(card('drug').outerHTML,editedBefore,'the edited section is updated');
      for(const use of w.document.querySelectorAll('#preview use'))assert.ok(w.document.getElementById(use.getAttribute('href').slice(1)));
    } finally {w.close();}
  });
  test(`${path}: local editor opens while handwriting images are still loading`, () => {
    const dom = new JSDOM(readFileSync(path, 'utf8'), { runScripts: 'outside-only', url: 'http://localhost' });
    const w=dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: text => ({ width: text.length }) });
      w.requestAnimationFrame = () => 1;
      const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
      w.eval(script);
      assert.equal(w.document.documentElement.dataset.ready,'true');
      assert.equal(w.document.documentElement.dataset.handwritingReady,undefined);
      assert.ok(w.document.querySelector('#preview svg'));
      assert.ok(w.document.querySelector('#drug-list').children.length>0);
    } finally {w.close();}
  });
  test(`${path}: preview embeds only the glyphs it uses and reuses unchanged pagination`, () => {
    const dom = new JSDOM(readFileSync(path, 'utf8'), { runScripts: 'outside-only', url: 'http://localhost' });
    const w = dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: text => ({ width: text.length }) });
      w.requestAnimationFrame = () => 1;
      const script = [...w.document.scripts].find(s => s.textContent.includes('function pageSVG')).textContent;
      w.eval(script.slice(0, script.lastIndexOf('prepareGlyphColors().then(')) + `
        window.api={pageSVG,layoutAndRender,get state(){return state},get pages(){return pages}};`);
      const a = w.api;
      a.state.mode = 'free'; a.state.free.text = 'aaa';
      a.layoutAndRender();
      const svg = a.pageSVG(a.pages[0], 0, 1);
      const parsed = new w.DOMParser().parseFromString(svg, 'image/svg+xml');
      const uses = [...parsed.querySelectorAll('use')];
      assert.equal(uses.length, 3);
      const refs = uses.map(u => u.getAttribute('href'));
      assert.equal(new Set(refs).size, 3, 'repeated letters use different handwriting variants');
      assert.ok(parsed.querySelectorAll('symbol').length <= 3, 'only the variants of lowercase a in ink are needed');
      for (const ref of refs) assert.ok(parsed.getElementById(ref.slice(1)), 'every variant has its own symbol');
      assert.equal(a.pageSVG(a.pages[0], 0, 1), svg, 'variation is deterministic across renders');
      const page = a.pages[0];
      a.layoutAndRender();
      assert.equal(a.pages[0], page, 'unchanged records reuse their calculated pages');
      a.state.free.text = 'bbb'; a.layoutAndRender();
      assert.notEqual(a.pages[0], page, 'editing text invalidates pagination');
      assert.ok(a.pages[0].raw.includes('bbb'));
    } finally { w.close(); }
  });
  test(`${path}: handwriting variation is subtle, deterministic and never repeats a letter exactly`, () => {
    const dom = new JSDOM(readFileSync(path, 'utf8'), { runScripts: 'outside-only', url: 'http://localhost' });
    const w = dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: text => ({ width: text.length }) });
      w.requestAnimationFrame = () => 1;
      const script = [...w.document.scripts].find(s => s.textContent.includes('function pageSVG')).textContent;
      w.eval(script.slice(0, script.lastIndexOf('prepareGlyphColors().then(')) + `window.api={inkVariation,handLine,GLYPH_VARIANTS};`);
      const { inkVariation } = w.api, key = p => JSON.stringify(p);
      const word = inkVariation('available'), a = [0, 4].map(i => word[i]);
      assert.notEqual(key(a[0]), key(a[1]), 'the two a characters in available differ');
      assert.equal(key(inkVariation('available')), key(word), 'same text gives the same variation');
      assert.deepEqual(inkVariation('avail').map(key), word.slice(0, 5).map(key), 'typing at the end keeps earlier letters unchanged');
      const run = inkVariation('aaaaaaaa eeeeee llll the the the');
      for (const c of ['a', 'e', 'l']) {
        const same = run.filter((_, i) => 'aaaaaaaa eeeeee llll the the the'[i] === c);
        for (let i = 1; i < same.length; i++) {
          assert.notEqual(same[i].v, same[i - 1].v, `consecutive ${c} use different variants`);
          assert.notEqual(key(same[i]), key(same[i - 1]));
        }
      }
      for (const p of run.filter(Boolean)) {
        assert.ok(Math.abs(p.rot) <= 4.5, 'rotation stays within a few degrees');
        assert.ok(p.sx > .92 && p.sx < 1.08 && p.sy > .92 && p.sy < 1.08, 'scale stays close to 1');
        assert.ok(Math.abs(p.dy) < .15 && Math.abs(p.dx) < .2 && p.op > .8, 'baseline, spacing and pressure stay subtle');
        assert.ok(p.v >= 0 && p.v < w.api.GLYPH_VARIANTS);
      }
    } finally { w.close(); }
  });
}
