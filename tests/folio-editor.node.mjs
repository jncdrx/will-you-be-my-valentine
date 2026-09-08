import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

for (const path of ['public/folio.html', 'public/folio/index.html']) {
  test(`${path}: visual editor size, spacing, presets and persistence`, () => {
    const dom = new JSDOM(readFileSync(path, 'utf8'), { runScripts:'outside-only', url:'http://localhost' });
    const w = dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext = () => ({measureText:()=>({width:10})});
      w.requestAnimationFrame = () => 1;
      const script = [...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
      w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then(')) + `
        window.api={renderSettings, changeView, setVisualSetting, applyEditorPreset, metrics, validProject, pageSVG,
          get state(){return state}, get pages(){return pages}};`);
      const a=w.api;
      a.renderSettings();
      assert.equal(w.document.querySelector('#advanced-settings').open,false);
      assert.equal(w.document.querySelector('[data-visual="letterSize"]').min,'8');
      const exact=w.document.querySelector('[data-exact="letterSize"]');
      exact.value='24';exact.dispatchEvent(new w.Event('input',{bubbles:true}));
      assert.ok(Math.abs(a.state.settings.cap-24*25.4/96)<.001);
      const small=a.metrics('A',a.state.settings.cap);
      a.setVisualSetting('letterSize',48);
      const large=a.metrics('A',a.state.settings.cap);
      assert.ok(Math.abs(large.w/small.w-2)<.001);
      assert.ok(Math.abs(large.h/small.h-2)<.001);
      assert.ok(a.state.settings.lineGap>=a.state.settings.cap*1.6);
      a.setVisualSetting('autoSpacing',false);
      a.setVisualSetting('lineGap',5);
      a.setVisualSetting('letterSize',72);
      assert.equal(a.state.settings.lineGap,5);
      const saved=a.validProject(JSON.parse(JSON.stringify(a.state)));
      assert.equal(saved.settings.autoSpacing,false);
      assert.ok(Math.abs(saved.settings.cap-72*25.4/96)<.00001);
      a.applyEditorPreset('recommended');
      assert.equal(a.state.settings.editorPreset,'recommended');
      assert.equal(a.state.settings.autoSpacing,true);
      a.applyEditorPreset('existing');
      assert.equal(a.state.settings.output,'existing');
      assert.equal(a.state.settings.lineGap,8);
      assert.ok(a.pages.length>0);
      a.setVisualSetting('letterSize',72);
      assert.equal(w.document.querySelector('#preview .loading-message'),null,'maximum size should still paginate');
      a.applyEditorPreset('recommended');a.changeView('settings');
      assert.equal(w.document.querySelectorAll('[data-guide]').length,6);
      w.document.querySelector('[data-guide="left"]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      assert.equal(a.state.settings.left,18.5);
      assert.equal(w.document.activeElement.dataset.guide,'left','keyboard focus survives preview refresh');
      a.setVisualSetting('writingLines',true);
      assert.ok(a.pageSVG(a.pages[0],0,1).includes('writing-rule'));
      assert.ok(!a.pageSVG(a.pages[0],0,1).includes('page-rulers'),'editing guides never enter exports');
      a.setVisualSetting('output','existing');
      assert.ok(!a.pageSVG(a.pages[0],0,1).includes('writing-rule'),'existing paper never prints rules');
      assert.ok(a.pageSVG(a.pages[0],0,1,true).includes('data-calibration-square="50"'));
    } finally { w.close(); }
  });
}
