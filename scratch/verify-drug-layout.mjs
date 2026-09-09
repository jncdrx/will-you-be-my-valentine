import fs from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const out='output/drug-folio-update';
const html=fs.readFileSync('public/folio/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost:5173/folio/index.html'}),w=dom.window;
w.Blob=Blob;w.TextEncoder=TextEncoder;w.Image=Image;w.requestAnimationFrame=()=>1;
const canvases=new WeakMap();
function canvasFor(el){let c=canvases.get(el);if(!c||c.width!==el.width||c.height!==el.height){c=createCanvas(el.width||300,el.height||150);canvases.set(el,c)}return c;}
w.HTMLCanvasElement.prototype.getContext=function(){const ctx=canvasFor(this).getContext('2d');if(!ctx._folioPatched){const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(img,...args)=>draw(img instanceof w.HTMLCanvasElement?canvasFor(img):img,...args);ctx._folioPatched=true}return ctx};
w.HTMLCanvasElement.prototype.toDataURL=function(...args){return canvasFor(this).toDataURL(...args)};
const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then(')).replace("'use strict';",'')+`window.auditApi={validProject,async load(p){state=validProject(p);await prepareGlyphColors();refreshLayoutMetrics();return state},pages(){return state.drugs.flatMap(d=>cachedRecordPages(d))},pageWarnings,pageGeometry,pageSVG};`);
const a=w.auditApi,reports={};
for(const version of ['original','updated']){
 const input=JSON.parse(fs.readFileSync(`${out}/folio-${version}.json`,'utf8'));
 const validated=await a.load(input);
 assert.deepEqual(JSON.parse(JSON.stringify(validated)),input,'Import must preserve every field, dose, and format');
 const pages=a.pages();
 reports[version]={pages:pages.length,warnings:[],counts:{}};
 for(const [i,p] of pages.entries()){
  reports[version].counts[p.drug.id]=(reports[version].counts[p.drug.id]||0)+1;
  const warnings=a.pageWarnings(p);
  if(warnings.length)reports[version].warnings.push({drug:p.drug.id,part:p.part,warnings,geometry:a.pageGeometry(p)});
  if(['pilocarpine','bethanechol','nicotine','propranolol','magnesium'].includes(p.drug.id)){
   fs.mkdirSync(`${out}/layout-${version}`,{recursive:true});
   fs.writeFileSync(`${out}/layout-${version}/${p.drug.id}-${p.part}.svg`,a.pageSVG(p,i,pages.length));
  }
 }
}
fs.writeFileSync(`${out}/layout-verification.json`,JSON.stringify(reports,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,{pages:v.pages,warnings:v.warnings.length,paperClips:v.warnings.filter(w=>w.warnings.some(s=>s.includes('outside the paper'))).length}]))));
w.close();
