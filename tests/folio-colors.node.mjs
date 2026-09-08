import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

for (const path of ['public/folio.html', 'public/folio/index.html']) {
  test(`${path}: section colors paint without rebuilding handwriting`, async () => {
    const html = readFileSync(path, 'utf8');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:5173' });
    const w = dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: () => ({ width: 10 }) });
      const frames = [];
      w.requestAnimationFrame = fn => { frames.push(fn); return frames.length; };
      const script = [...w.document.scripts].find(s => s.textContent.includes('function pageSVG')).textContent;
      // Boot event bindings and the real renderer; omit asynchronous image decoding.
      w.eval(script.slice(0, script.lastIndexOf('prepareGlyphColors().then(')) + `
        window.folio = { updateCurrentSectionColor, getSectionColors, pageSVG, validProject,
          get state(){return state}, openSectionColorModal,
          showPage(page){pages=[page];pageIndex=0;updatePreview()} };
      `);
      const api = w.folio;
      frames.length = 0; // Ignore the startup pane's scheduled fit.
      const keys = ['drug', 'action', 'dosage', 'indication', 'contraindication', 'adverse', 'effects', 'notes'];
      const owner = api.state.drugs.find(d => d.id === api.state.selected);
      const other = api.state.drugs.find(d => d.id !== owner.id);
      const p = { title: 'Test', part: 1, partTotal: 1, headerHeight: 10, raw: [], drug: owner,
        blocks: keys.map(key => ({ kind: 'section', key, top: 30, bottom: 50,
          y: 35, headingCap: 3, headLines: [key], rows: [] })) };
      const preview = w.document.getElementById('preview');
      preview.innerHTML = api.pageSVG(p, 0, 1);
      const svg = preview.firstElementChild;
      const drug = preview.querySelector('[data-section="drug"]');
      const action = preview.querySelector('[data-section="action"]');
      const originalAction = action.outerHTML;
      const originalQuery = w.document.querySelector.bind(w.document);
      let inputQueries = 0;
      w.document.querySelector = (...args) => { inputQueries++; return originalQuery(...args); };
      for(let i=0;i<100;i++) api.updateCurrentSectionColor(i===99?'#1267ab':'#abcdef', 'drug');
      assert.equal(inputQueries, 0, 'drag events must not query or synchronize the document before painting');
      w.document.querySelector = originalQuery;
      assert.equal(frames.length, 1, 'color drag must coalesce into one frame');
      frames.shift()();
      assert.equal(preview.firstElementChild, svg, 'preserve SVG and handwriting nodes');
      assert.equal(drug.querySelector('.card-badge-bg').getAttribute('fill'), '#1267ab');
      assert.equal(drug.querySelector('.section-title').getAttribute('fill'), '#1267ab');
      assert.equal(action.outerHTML, originalAction, 'other sections stay unchanged');
      const exported = api.pageSVG(p, 0, 1);
      assert.ok(!new w.DOMParser().parseFromString(exported, 'image/svg+xml').querySelector('parsererror'));
      assert.equal(api.validProject(JSON.parse(JSON.stringify(api.state))).drugs.find(d => d.id === owner.id).sectionColors.drug.accent, '#1267ab');
      assert.ok(exported.includes('fill="#1267ab"'));
      assert.equal(other.sectionColors?.drug, undefined, 'editing one drug must not edit another');
      assert.ok(!api.pageSVG({ ...p, drug: other }, 0, 1).includes('fill="#1267ab"'), 'export must use each page drug, not the selected drug');
      api.openSectionColorModal('drug', null, other);
      api.updateCurrentSectionColor('#442288');
      api.openSectionColorModal('drug', null, owner);
      frames.shift()();
      assert.equal(drug.querySelector('.card-badge-bg').getAttribute('fill'), '#1267ab', 'a queued update for another drug must not paint this page');
      assert.equal(api.getSectionColors('drug', other).accent, '#442288');
      for (const key of keys) {
        api.openSectionColorModal(key);
        api.updateCurrentSectionColor('#228866', key);
        frames.shift()();
        const card = preview.querySelector('[data-section="' + key + '"]');
        assert.equal(card.querySelector('.card-badge-bg').getAttribute('fill'), '#228866');
        for (const [id, selector, attr] of [
          ['scm-header-bg', '.card-header-bg', 'fill'],
          ['scm-border-color', '.card-border', 'stroke'],
          ['scm-badge-bg', '.card-badge-bg', 'fill'],
          ['scm-badge-text', '.section-number', 'fill'],
          ['scm-header-text', '.section-title', 'fill'],
        ]) {
          const input = w.document.getElementById(id);
          input.value = '#987654';
          input.dispatchEvent(new w.Event('input', { bubbles: true }));
          frames.shift()();
          assert.equal(card.querySelector(selector).getAttribute(attr), '#987654');
        }
        w.document.getElementById('scm-reset').click();
        frames.shift()();
        assert.equal(preview.firstElementChild, svg, 'reset must preserve handwriting too');
        assert.equal(card.querySelector('.card-badge-bg').getAttribute('fill'), api.getSectionColors(key).badgeBg);
        assert.equal(owner.sectionColors[key], undefined);
      }
      const swatch = w.document.querySelector('.scm-swatch-btn');
      assert.equal(w.document.querySelector('#scm-color-input').tagName, 'BUTTON', 'use the inline picker instead of a native popup');
      api.openSectionColorModal('drug');
      w.document.getElementById('scm-color-input').click();
      const field = w.document.getElementById('scm-hex');
      field.value = '#ff0000';
      field.dispatchEvent(new w.Event('input'));
      frames.shift()();
      const surface = w.document.getElementById('scm-sv');
      surface.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, cancelable: true }));
      frames.shift()();
      assert.equal(api.getSectionColors('drug').accent, '#ff1919');
      const hue = w.document.getElementById('scm-hue');
      hue.value = '120';
      hue.dispatchEvent(new w.Event('input'));
      frames.shift()();
      assert.equal(api.getSectionColors('drug').accent, '#19ff19');
      field.value = '#invalid';
      field.dispatchEvent(new w.Event('input'));
      assert.equal(field.getAttribute('aria-invalid'), 'true');
      assert.equal(api.getSectionColors('drug').accent, '#19ff19', 'invalid text must not corrupt colors');
      surface.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
      surface.setPointerCapture = () => {};
      surface.releasePointerCapture = () => {};
      const pointer = (type, x, y) => {
        const event = new w.MouseEvent(type, { clientX: x, clientY: y, button: 0, cancelable: true });
        Object.defineProperty(event, 'pointerId', { value: 1 });
        // jsdom does not dispatch PointerEvent handler properties; invoke the bound handler.
        surface['on' + type](event);
      };
      let writes = 0;
      const originalStore = w.Storage.prototype.setItem;
      w.Storage.prototype.setItem = function(...args) { writes++; return originalStore.apply(this, args); };
      pointer('pointerdown', 20, 20);
      for (let i = 0; i < 100; i++) pointer('pointermove', i, 30);
      assert.equal(frames.length, 1);
      frames.shift()();
      await new Promise(resolve => setTimeout(resolve, 700));
      assert.equal(writes, 0, 'no storage serialization during a held drag');
      pointer('pointerup', 100, 0);
      frames.shift()();
      assert.equal(api.getSectionColors('drug').accent, '#00ff00', 'pointer release must apply the final position');
      assert.equal(drug.querySelector('.card-badge-bg').getAttribute('fill'), '#00ff00');
      await new Promise(resolve => setTimeout(resolve, 500));
      assert.equal(writes, 1, 'save exactly once after releasing the drag');
      const saved = JSON.parse(w.localStorage.getItem('folio.handwritten-notebook.v5.manual-header.colored-sections'));
      assert.equal(saved.drugs.find(d => d.id === owner.id).sectionColors.drug.accent, '#00ff00');
      assert.equal(saved.drugs.find(d => d.id === other.id).sectionColors.drug.accent, '#442288');
      const legacy = JSON.parse(JSON.stringify(api.state));
      delete legacy.drugs.find(d => d.id === owner.id).sectionColors;
      legacy.settings.sectionColors = { drug: { accent: '#aa3344' } };
      const migrated = api.validProject(legacy);
      assert.equal(migrated.drugs.find(d => d.id === owner.id).sectionColors.drug.accent, '#aa3344');
      assert.equal(migrated.drugs.find(d => d.id === other.id).sectionColors.drug.accent, '#442288');
      assert.equal(migrated.settings.sectionColors, undefined);
      api.showPage({ ...p, drug: other });
      api.openSectionColorModal('drug');
      assert.ok(w.document.getElementById('scm-title').textContent.includes(other.name), 'picker targets the displayed drug even when another drug is selected');
      api.updateCurrentSectionColor('#aa6600');
      api.showPage(p);
      assert.equal(w.document.getElementById('section-color-modal').hidden, true, 'close the old picker when navigating to another drug');
      while (frames.length) frames.shift()();
      assert.equal(preview.querySelector('[data-section="drug"] .card-badge-bg').getAttribute('fill'), '#00ff00', 'navigation must not leak a queued color to the new page');
      assert.equal(api.getSectionColors('drug', other).accent, '#aa6600');
      assert.notEqual(w.getComputedStyle(swatch).backgroundColor, 'rgba(0, 0, 0, 0)');
      assert.ok(!html.includes('all:unset!important'), 'palette reset must not override its color');
    } finally { w.close(); }
  });
}
