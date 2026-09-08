import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
for(const path of ['public/folio.html','public/folio/index.html'])test(`${path}: page geometry stays physical and exports without shrink`,()=>{
 const dom=new JSDOM(readFileSync(path,'utf8'),{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
 try{
 w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
 const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
 w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then('))+`window.api={pageGeometry,setPageLayout,pagePreset,pageWarnings,sectionBox,setSectionBox,layoutAndRender,cachedRecordPages,pageSVG,validProject,preparePrint,get state(){return state}};`);
 const a=w.api,drug=a.state.drugs[0];a.layoutAndRender();const p=a.cachedRecordPages(drug)[0],paper=JSON.stringify(a.state.settings),base=a.pageGeometry(p);
 a.setPageLayout(p,{sx:2,sy:2,x:12,y:9});let g=a.pageGeometry(p);
 assert.equal(g.width,base.baseWidth*2);assert.equal(g.height,base.baseHeight*2);assert.equal(JSON.stringify(a.state.settings),paper);
 assert.ok(a.pageWarnings(p).length);const svg=a.pageSVG(p,0,1);assert.match(svg,/width="148mm" height="210mm"/);assert.match(svg,/class="printed-content" transform="[^"]*scale\(2 2\)/);
 const restored=a.validProject(JSON.parse(JSON.stringify(a.state)));assert.equal(restored.drugs[0].pageLayouts['1'].sx,2);
 assert.equal(a.pageGeometry({...p,part:2}).sx,1);
 a.pagePreset(p,'fit');g=a.pageGeometry(p);assert.ok(g.width<=g.availableWidth+.001&&g.height<=g.availableHeight+.001);
 a.pagePreset(p,'fill');g=a.pageGeometry(p);assert.ok(g.width>=g.availableWidth-.001&&g.height>=g.availableHeight-.001);
 const stableFrame=a.pageSVG(p,0,1).match(/class="printed-content" transform="([^"]*)/)[1];
 const b=p.blocks[0],box=a.sectionBox(p,b);a.setSectionBox(p,b,{width:box.baseWidth*2,x:-5});assert.equal(a.sectionBox(p,b).width,box.baseWidth*2);assert.equal(a.sectionBox(p,b).x,-5);
 assert.equal(a.pageSVG(p,0,1).match(/class="printed-content" transform="([^"]*)/)[1],stableFrame,'moving a section does not move its neighbors through the page transform');
 a.setPageLayout(p,{gap:4,top:3,bottom:4,left:5,right:6});assert.equal(a.pageGeometry(p).margins.left,5);
 a.state.scope='selected';a.state.selected=drug.id;a.layoutAndRender(true);a.preparePrint();
 assert.equal(w.document.querySelector('#print-root .printed-content').getAttribute('transform'),w.document.querySelector('#preview .printed-content').getAttribute('transform'));
 assert.equal(w.document.querySelector('#print-root .section-resize-overlay'),null);
 const change=(id,v)=>{const el=w.document.getElementById(id);el.value=v;el.dispatchEvent(new w.Event('change'));};
 change('content-scale',150);assert.equal(a.pageGeometry(p).sx,1.5);assert.equal(a.pageGeometry(p).sy,1.5);
 change('content-width',180);assert.ok(Math.abs(a.pageGeometry(p).width-180)<.001);assert.equal(a.pageGeometry(p).sy,1.5);
 change('content-height',170);assert.ok(Math.abs(a.pageGeometry(p).height-170)<.001);
 change('content-x',-8);assert.equal(a.pageGeometry(p).x,-8);assert.equal(w.document.querySelector('#print-layout-warning').hidden,false);
 change('content-preset','actual');assert.equal(a.pageGeometry(p).sx,1);
 w.document.querySelector('#preview [data-section]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 const beforeBody=w.document.querySelector('#preview [data-section] [data-alignment]').outerHTML;
 change('resize-header-width',80);change('resize-header-height',10);
 assert.equal(w.document.querySelector('#preview [data-section] [data-alignment]').outerHTML,beforeBody,'header resizing leaves body unchanged');
 assert.notEqual(w.document.querySelector('#preview .section-header').getAttribute('transform'),'');
 const moved=a.sectionBox(p,b).x;w.document.querySelector('[data-move-section]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(a.sectionBox(p,b).x,moved+1);
 change('resize-y',30);assert.equal(a.sectionBox(p,b).y,30);
 const savedHeader=a.validProject(JSON.parse(JSON.stringify(a.state))).drugs[0].sectionLayouts['1'][b.key];assert.ok(savedHeader.headerSx>0&&savedHeader.headerSy>0);
 a.preparePrint();assert.equal(w.document.querySelector('#print-root .section-header').getAttribute('transform'),w.document.querySelector('#preview .section-header').getAttribute('transform'));
 assert.equal(w.document.querySelector('#print-root .print-safe-guide'),null);
 w.document.querySelector('#real-size-preview').click();assert.equal(a.state.settings.zoom,'100');

 }finally{w.close()}
});
