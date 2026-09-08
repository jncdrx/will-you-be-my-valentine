import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: independent section resizing survives reload and print`,()=>{
 const dom=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
 try{
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
  const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
  w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then('))+`window.api={sectionBox,setSectionBox,resetSectionLayout,resizeFromHandle,layoutAndRender,cachedRecordPages,pageSVG,validProject,preparePrint,get state(){return state}};`);
  const a=w.api,[drug,other]=a.state.drugs;a.layoutAndRender();
  const pages=a.cachedRecordPages(drug),p=pages[0],b=p.blocks[0],neighbor=p.blocks[1];
  const original=a.sectionBox(p,b),adjacent=JSON.stringify(a.sectionBox(p,neighbor)),otherSVG=a.pageSVG(a.cachedRecordPages(other)[0],0,1);
  a.setSectionBox(p,b,{width:original.width*.7,height:original.height*.7});
  assert.ok(Math.abs(a.sectionBox(p,b).width-original.width*.7)<.001);
  assert.equal(JSON.stringify(a.sectionBox(p,neighbor)),adjacent);
  assert.equal(a.pageSVG(a.cachedRecordPages(other)[0],0,1),otherSVG);
  const second={...p,part:2};assert.equal(a.sectionBox(second,b).width,original.width);
  const saved=a.validProject(JSON.parse(JSON.stringify(a.state))).drugs[0];
  assert.equal(saved.sectionLayouts['1'][b.key].sx,.7);
  a.state.scope='all';a.preparePrint();
  const printed=w.document.querySelector(`#print-root [data-drug-id="${drug.id}"][data-section="${b.key}"]`);
  assert.match(printed.getAttribute('transform'),/scale\(0.7 0.7\)/);
  assert.equal(w.document.querySelector('#print-root .section-resize-handle'),null);
  a.setSectionBox(p,b,{width:1e6,height:1e6,x:-100,y:-100});
  const enlarged=a.sectionBox(p,b);assert.equal(enlarged.x,-100);assert.equal(enlarged.y,-100);
  assert.ok(enlarged.width>a.state.settings.width);assert.ok(enlarged.height>neighbor.top,'enlargement is no longer constrained to adjacent sections');
  a.setSectionBox(second,b,{width:original.width*.5});
  a.resetSectionLayout(p,b.key);assert.equal(a.sectionBox(p,b).width,original.width);
  assert.ok(a.sectionBox(second,b).width<original.width);
  a.resetSectionLayout(second);assert.equal(a.sectionBox(second,b).width,original.width);
  a.state.scope='selected';a.state.selected=drug.id;a.layoutAndRender(true);
  const preview=w.document.querySelector('#preview');
  preview.querySelector('[data-section]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  assert.equal(preview.querySelectorAll('[data-resize-handle]').length,8);
  assert.equal(w.document.querySelector('#section-resize-controls').hidden,false);
  const width=w.document.querySelector('#resize-width');width.value=original.width*.6;width.dispatchEvent(new w.Event('change'));
  assert.ok(Math.abs(a.sectionBox(p,b).width-original.width*.6)<.001);
  const lock=w.document.querySelector('#resize-lock');lock.checked=true;lock.dispatchEvent(new w.Event('change'));
  const beforeLocked=a.sectionBox(p,b);width.value=beforeLocked.width*.8;width.dispatchEvent(new w.Event('change'));
  const afterLocked=a.sectionBox(p,b);assert.ok(Math.abs(afterLocked.height/beforeLocked.height-.8)<.001);
  const corner=a.resizeFromHandle(afterLocked,'se',5,0);assert.ok(Math.abs(corner.width/corner.height-afterLocked.width/afterLocked.height)<.001);
  const beforeKey=afterLocked.width;preview.querySelector('[data-resize-handle="e"]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  assert.ok(a.sectionBox(p,b).width<beforeKey);
  // Pointer geometry is stubbed in DOM tests; exercise the actual capture/drag/cancel handlers.
  const svg=preview.querySelector('svg');svg.getScreenCTM=()=>({inverse:()=>({})});svg.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y}}});
  preview.setPointerCapture=()=>{};preview.hasPointerCapture=()=>false;
  const beforeDrag=a.sectionBox(p,b).width;
  preview.querySelector('[data-resize-handle="e"]').dispatchEvent(new w.MouseEvent('pointerdown',{button:0,clientX:50,clientY:50,bubbles:true}));
  preview.dispatchEvent(new w.MouseEvent('pointermove',{clientX:45,clientY:50,bubbles:true}));
  assert.ok(a.sectionBox(p,b).width<beforeDrag);
  w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(a.sectionBox(p,b).width,beforeDrag);
  w.document.querySelector('#resize-reset').click();assert.equal(a.sectionBox(p,b).width,original.width);
 }finally{w.close()}
});
