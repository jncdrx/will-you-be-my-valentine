import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: spread keeps one drug together and selects either page without changing print`,()=>{
 const w=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}).window;
 try{
  w.matchMedia=()=>({matches:false});w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
  const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
  w.eval(script.replace(/^prepareGlyphColors\(\)\.then\(.*$/m,'')+`window.api={layoutAndRender,cachedRecordPages,preparePrint,updatePreview,get state(){return state},get pages(){return pages},get index(){return pageIndex},go(i){pageIndex=i;updatePreview()}};`);
  const a=w.api,drug=a.state.drugs.find(d=>a.cachedRecordPages(d).length===2);
  assert.ok(drug,'fixture has a two-page drug');a.state.selected=drug.id;a.state.scope='selected';a.layoutAndRender(true);
  a.preparePrint();const printed=w.document.getElementById('print-root').innerHTML;
  const spread=w.document.getElementById('drug-spread');assert.ok(spread,'both pages need a grouped spread');
  assert.equal(spread.querySelectorAll('.paper-shell svg').length,2,w.document.getElementById('preview').textContent);
  assert.match(spread.textContent,/Front \/ Page 1/);assert.match(spread.textContent,/Back \/ Page 2/);
  for(const use of spread.querySelectorAll('use[href]'))assert.ok(w.document.getElementById(use.getAttribute('href').slice(1)),'both pages resolve their handwriting assets');
  assert.equal(spread.querySelectorAll('.paper-shell [data-drug-id]').length>0,true);
  const companion=w.document.querySelector('#companion-preview svg');a.updatePreview();
  assert.equal(w.document.querySelector('#companion-preview svg'),companion,'unchanged companion stays mounted during active-page updates');
  w.document.getElementById('companion-page-label').click();assert.equal(a.index,1);
  assert.equal(w.document.getElementById('active-page-label').textContent,'Back / Page 2');
  assert.equal(spread.querySelectorAll('.paper-shell svg').length,2);
  a.preparePrint();assert.equal(w.document.getElementById('print-root').innerHTML,printed);
  a.state.scope='all';a.layoutAndRender(true);
  const one=a.pages.findIndex(p=>a.pages.filter(other=>other.drug===p.drug).length===1);
  if(one>=0){a.go(one);assert.equal(w.document.getElementById('companion-page').hidden,true);}
 }finally{w.close()}
});

for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: every drug's second page stays beside its first page`,()=>{
 const w=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}).window;
 try{
  w.matchMedia=()=>({matches:false});w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
  const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
  w.eval(script.replace(/^prepareGlyphColors\(\).then\(.*$/m,'')+`window.api={layoutAndRender,cachedRecordPages,updatePreview,get state(){return state},go(i){pageIndex=i;updatePreview()}};`);
  const a=w.api,records=a.state.drugs.filter(drug=>a.cachedRecordPages(drug).length>=2);
  assert.equal(records.length,121,'fixture must cover every drug');
  for(const drug of records){
   a.state.selected=drug.id;a.state.scope='selected';a.layoutAndRender(true);a.go(1);
   const spread=w.document.getElementById('drug-spread');
   assert.equal(spread.querySelectorAll('.paper-shell svg').length,2,`${drug.name} Page 2 must have a companion page`);
   assert.equal(w.document.getElementById('active-page-label').textContent,'Back / Page 2',`${drug.name} Page 2 must be labeled as the back`);
   assert.equal(w.document.getElementById('companion-page-label').textContent,'Front / Page 1',`${drug.name} Page 1 must remain beside Page 2`);
  }
 }finally{w.close()}
});
