import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: selected PDF and gesture-safe iPad saving`,async()=>{
 const w=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'https://localhost'}).window;
 try{
  w.Blob=Blob;w.TextEncoder=TextEncoder;
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
  w.HTMLDialogElement.prototype.close=function(){this.open=false};
  w.URL.createObjectURL=()=> 'blob:pdf-test';w.URL.revokeObjectURL=()=>{};
  const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
  w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then(')).replace("'use strict';",'')+`window.api={pageSVG,setCalibration(value){calibration=value},get state(){return state},get pages(){return pages}};`);
  assert.ok(w.document.getElementById('save-print-pdf'),'print dialog needs a direct PDF action');
  w.api.state.drugs=w.api.state.drugs.slice(0,2);w.api.state.scope='selected';
  w.eval(`window.rendered=[];window.shared=[];prepareGlyphColors=async()=>{};
   pdfPageImage=async xml=>{window.rendered.push(xml);return {bytes:new Uint8Array([255,216,255,217]),width:1748,height:2480}};
   navigator.canShare=()=>true;navigator.share=async data=>window.shared.push(data);`);
  await w.document.getElementById('save-print-pdf').onclick();
  assert.equal(w.rendered.length,w.api.pages.length);
  assert.equal(w.rendered[0],w.api.pageSVG(w.api.pages[0],0,w.api.pages.length,false,'pdf-0'),'PDF uses the unmodified print renderer');
  assert.ok(w.api.pages.every(p=>p.drug===w.api.state.drugs.find(d=>d.id===w.api.state.selected)));
  assert.ok(w.rendered.every(svg=>svg.includes('printed-content')&&!svg.includes('contenteditable')));
  assert.equal(w.shared.length,0,'generation must not consume an expired share gesture');
  assert.equal(w.document.getElementById('pdf-ready-dialog').open,true);
  await w.document.getElementById('share-ready-pdf').onclick();
  assert.equal(w.shared.length,1);assert.equal(w.shared[0].files[0].type,'application/pdf');
  assert.equal(w.shared[0].files[0].name,'folio-notes.pdf');
  w.navigator.share=async()=>{throw Object.assign(Error('cancel'),{name:'AbortError'})};
  await w.document.getElementById('share-ready-pdf').onclick();
  assert.equal(w.document.getElementById('share-ready-pdf').disabled,false);
  assert.equal(w.document.getElementById('open-ready-pdf').href,'blob:pdf-test');
  w.navigator.canShare=()=>false;
  await w.document.getElementById('save-print-pdf').onclick();
  assert.equal(w.document.getElementById('share-ready-pdf').hidden,true);
  w.rendered.length=0;w.api.state.scope='all';
  await w.document.getElementById('save-print-pdf').onclick();
  assert.ok(w.api.pages.some(p=>p.drug===w.api.state.drugs[1]));
  assert.equal(w.rendered.length,w.api.pages.length);
  w.rendered.length=0;w.api.setCalibration(true);
  await w.document.getElementById('save-print-pdf').onclick();
  assert.equal(w.rendered.length,1);assert.ok(w.rendered[0].includes('PRINT CALIBRATION'));
  assert.equal(w.document.getElementById('open-ready-pdf').href,'blob:pdf-test');
 }finally{w.close()}
});
