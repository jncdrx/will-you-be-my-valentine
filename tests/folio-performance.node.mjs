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
      const a=w.api,drug=a.state.drugs.find(d=>d.id===a.state.selected);
      for(const key of Object.keys(drug.fields))drug.fields[key]='A short note';
      a.layoutAndRender();
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
      assert.equal(parsed.querySelectorAll('symbol').length, 1, 'only lowercase a in ink is needed');
      assert.equal(parsed.querySelectorAll('use').length, 3);
      const page = a.pages[0];
      a.layoutAndRender();
      assert.equal(a.pages[0], page, 'unchanged records reuse their calculated pages');
      a.state.free.text = 'bbb'; a.layoutAndRender();
      assert.notEqual(a.pages[0], page, 'editing text invalidates pagination');
      assert.ok(a.pages[0].raw.includes('bbb'));
    } finally { w.close(); }
  });
}
