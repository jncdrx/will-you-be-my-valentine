import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: section formatting stays with its drug in preview, reload and print`,()=>{
 const dom=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
 try{
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
  const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
  w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then('))+`window.api={setSectionFormat,sectionTypography,alignedSectionLine,layoutAndRender,cachedRecordPages,pageSVG,validProject,openSectionColorModal,preparePrint,get state(){return state}};`);
  const a=w.api,[drug,other]=a.state.drugs,settings=JSON.stringify(a.state.settings);
  a.layoutAndRender();const before=a.cachedRecordPages(other),otherSVG=a.pageSVG(before[0],0,before.length);
  a.setSectionFormat(drug,'action',{sizePx:24,align:'center'});
  assert.equal(JSON.stringify(a.state.settings),settings);
  assert.equal(other.sectionFormats,undefined);
  assert.equal(a.cachedRecordPages(other),before,'other drug keeps cached layout');
  assert.equal(a.pageSVG(before[0],0,before.length),otherSVG);
  assert.equal(a.sectionTypography(drug,'drug').cap,a.state.settings.cap);
  const pages=a.cachedRecordPages(drug),block=pages.flatMap(p=>p.blocks).find(b=>b.key==='action');
  assert.ok(Math.abs(block.rows[0].cap-24*25.4/96)<.001);
  const svg=a.pageSVG(pages.find(p=>p.blocks.includes(block)),0,pages.length);
  assert.ok(svg.includes('data-alignment="center"'));
  const parse=text=>new w.DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${text}</svg>`,'image/svg+xml');
  const row={text:'A B C',paragraphEnd:false};
  const positions=['left','center','right'].map(align=>Number(parse(a.alignedSectionLine(row,10,20,3,80,align)).querySelector('use').getAttribute('x')));
  assert.equal(positions[0],10);assert.ok(positions[1]>10);assert.ok(positions[2]>positions[1]);
  assert.ok(Number(parse(a.alignedSectionLine(row,10,20,3,80,'justify')).querySelector('[data-extra-space]').getAttribute('data-extra-space'))>0);
  assert.equal(parse(a.alignedSectionLine({...row,paragraphEnd:true},10,20,3,80,'justify')).querySelector('[data-extra-space]').getAttribute('data-extra-space'),'0');
  assert.equal(a.validProject(JSON.parse(JSON.stringify(a.state))).drugs[0].sectionFormats.action.sizePx,24);
  a.openSectionColorModal('action',null,drug);
  assert.equal(w.document.querySelector('.scm-header').nextElementSibling.id,'section-text-controls');
  const text=w.document.querySelector('#section-direct-text');text.value='Edited only this section';text.dispatchEvent(new w.Event('input'));
  assert.equal(drug.fields.action,'Edited only this section');assert.notEqual(other.fields.action,drug.fields.action);
  a.setSectionFormat(drug,'action',{sizePx:72,align:'justify'});
  assert.ok(a.cachedRecordPages(drug).length>0);
  a.state.scope='all';a.preparePrint();
  assert.ok(w.document.querySelector('#print-root [data-drug-id="'+drug.id+'"] [data-alignment="justify"]'));
  assert.ok(!w.document.querySelector('#print-root [data-drug-id="'+other.id+'"] [data-alignment="justify"]'));
 }finally{w.close()}
});
