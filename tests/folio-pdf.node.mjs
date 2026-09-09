import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: Save project respects the preview scope`,async()=>{
 const dom=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
 try{
  w.Blob=Blob;w.TextEncoder=TextEncoder;
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
  const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
  w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then(')).replace("'use strict';",'')+`window.api={projectPDFPages,pdfDocument,mockExports(fail=false){window.saved??=[];window.rendered??=[];prepareGlyphColors=async()=>{};pdfPageImage=async(xml)=>{if(fail)throw Error('test rendering failure');window.rendered.push(xml);return {bytes:new Uint8Array([255,216,255,217]),width:1748,height:2480}};downloadBlob=(blob,name)=>window.saved.push({blob,name});},get state(){return state}};`);
  const a=w.api;a.state.drugs=a.state.drugs.slice(0,2);a.state.scope='selected';a.state.mode='drugs';
  a.state.selected=a.state.drugs[0].id;a.state.free.text='My extra notes';
  const pages=a.projectPDFPages();
  assert.ok(pages.length>0);assert.ok(pages.every(p=>p.drug===a.state.drugs[0]));
  assert.ok(!pages.some(p=>p.raw.join(' ').includes('My extra notes')));
  a.state.scope='all';assert.ok(a.projectPDFPages().some(p=>p.drug===a.state.drugs[1]));a.state.scope='selected';
  assert.equal(a.state.scope,'selected');assert.equal(a.state.mode,'drugs');
  const pdf=a.pdfDocument(148,210),jpeg=new Uint8Array([255,216,255,217]);
  pdf.addPage(jpeg,1748,2480);pdf.addPage(jpeg,1748,2480);
  const blob=pdf.finish(),bytes=Buffer.from(await blob.arrayBuffer()),text=bytes.toString('latin1');
  assert.equal(blob.type,'application/pdf');assert.ok(text.startsWith('%PDF-1.4'));assert.match(text,/\/Count 2/);
  assert.match(text,/\/MediaBox \[0 0 419\.5276 595\.2756\]/);
  const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(text.slice(xref,xref+4),'xref');
  for(const match of text.matchAll(/(\d{10}) 00000 n/g)){const offset=Number(match[1]);assert.match(text.slice(offset),/^\d+ 0 obj/);}
  assert.ok(w.document.getElementById('export-pdf'));assert.ok(w.document.getElementById('export-json'));
  a.mockExports();
  const button=w.document.getElementById('export-pdf');
  await button.onclick();
  assert.equal(w.saved.length,1);assert.equal(w.saved[0].name,'folio-project.pdf');
  assert.equal(w.rendered.length,pages.length);
  assert.ok(w.rendered.every(svg=>svg.includes('printed-content')&&!svg.includes('contenteditable')));
  assert.equal(button.disabled,false);assert.match(button.textContent,/Save project/);
  assert.equal(a.state.scope,'selected');assert.equal(a.state.mode,'drugs');
  a.mockExports(true);
  await button.onclick();assert.equal(w.saved.length,1,'failed export must not download a partial PDF');
  assert.equal(button.disabled,false);assert.match(w.document.getElementById('toast').textContent,/test rendering failure/);
  w.document.getElementById('export-json').click();assert.equal(w.saved[1].name,'folio-project.json');
 }finally{w.close();}
});
