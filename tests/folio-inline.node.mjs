import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

for (const path of ['public/folio.html', 'public/folio/index.html']) {
  test(`${path}: inline edits preserve source text, selection, settings and printable state`, () => {
    const dom = new JSDOM(readFileSync(path, 'utf8'), { runScripts: 'outside-only', url: 'http://localhost' });
    const w = dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: text => ({ width: text.length }) });
      w.requestAnimationFrame = () => 1;
      const script = [...w.document.scripts].find(s => s.textContent.includes('function pageSVG')).textContent;
      w.eval(script.slice(0, script.lastIndexOf('prepareGlyphColors().then(')) + `
        window.api={layoutAndRender,preparePrint,sectionRows,renderEditor,selectRecord,
          get session(){return inlineSession},
          get state(){return state},get pages(){return pages},get index(){return pageIndex}};`);
      const a = w.api, d = a.state.drugs.find(d => d.id === a.state.selected);
      const other = a.state.drugs.find(x => x !== d), untouched = JSON.stringify(other);
      for (const key of Object.keys(d.fields)) d.fields[key] = 'Alpha beta';
      a.renderEditor();a.layoutAndRender();
      function editor(key) { return w.document.querySelector(`.inline-editor[data-field="${key}"]`); }
      function select(key, start, end=start) {
        const el=editor(key);assert.ok(el, `${key} is editable on the page`);el.focus();
        const chars=[...el.querySelectorAll('[data-offset]')];
        const point=n=>{const c=chars.find(c=>Number(c.dataset.offset)===n);if(c)return [c.firstChild,0];const last=chars.at(-1);return [last.firstChild,last.textContent.length];};
        const [sn,so]=point(start),[en,eo]=point(end);
        w.getSelection().setBaseAndExtent(sn,so,en,eo);return el;
      }
      function input(el,type,data=null) { el.dispatchEvent(new w.InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:type,data})); }
      const size=a.state.settings.cap, spacing=a.state.settings.lineGap;
      for(const key of Object.keys(d.fields)){
        input(select(key,0,5),'insertText','Edited');assert.equal(d.fields[key],'Edited beta',`${key} saves inline edits`);
        input(editor(key),'historyUndo');assert.equal(d.fields[key],'Alpha beta');
      }
      editor('drug').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      assert.equal(w.document.querySelector('#section-color-modal').hidden,true,'body clicks must not open a popup');
      input(select('drug',6,10),'insertText','changed');
      assert.equal(d.fields.drug,'Alpha changed');
      assert.equal(w.document.querySelector('#field-drug').value,'Alpha changed');
      assert.equal(w.getSelection().focusNode.parentElement.dataset.offset,'12','caret stays after the insertion');
      input(editor('drug'),'insertParagraph');
      input(editor('drug'),'insertText','Next line');
      assert.equal(d.fields.drug,'Alpha changed\nNext line');
      input(editor('drug'),'historyUndo');
      assert.equal(d.fields.drug,'Alpha changed\n');
      input(editor('drug'),'historyRedo');
      assert.equal(d.fields.drug,'Alpha changed\nNext line');
      input(select('action',0,10),'insertFromPaste','<b>plain</b>\r\n5 mg');
      assert.equal(d.fields.action,'<b>plain</b>\n5 mg');
      assert.equal(editor('action').querySelector('b'),null);
      assert.equal(a.state.settings.cap,size);assert.equal(a.state.settings.lineGap,spacing);
      w.dispatchEvent(new w.Event('beforeunload'));
      const saved=Object.values(w.localStorage).map(value=>{try{return JSON.parse(value)}catch{return null}}).find(value=>value?.format==='folio-notebook');
      assert.equal(saved.drugs.find(record=>record.id===d.id).fields.drug,'Alpha changed\nNext line','reload storage contains the current inline text');
      a.preparePrint();
      assert.ok([...w.document.querySelectorAll('#print-root .handline')].some(el=>el.dataset.text==='Next line'));
      assert.equal(w.document.querySelector('#print-root [contenteditable]'),null);
      a.selectRecord(other.id);a.selectRecord(d.id);
      assert.equal(d.fields.drug,'Alpha changed\nNext line');assert.equal(JSON.stringify(other),untouched);
      input(select('drug',0,d.fields.drug.length),'deleteContentBackward');
      assert.equal(d.fields.drug,'');
      assert.ok(editor('drug'),'empty sections remain editable');
      input(editor('drug'),'insertText','word '.repeat(1000));
      let el=editor('drug');el.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',ctrlKey:true,bubbles:true,cancelable:true}));
      el.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
      const first=a.session.focus;
      el.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
      assert.ok(a.session.focus>first,'ArrowDown must advance at soft-wrap boundaries');
      el.dispatchEvent(new w.KeyboardEvent('keydown',{key:'a',ctrlKey:true,bubbles:true,cancelable:true}));
      const range=w.getSelection().getRangeAt(0);
      const event=new w.InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:'Replaced all pages'});
      event.getTargetRanges=()=>[range];el.dispatchEvent(event);
      assert.equal(d.fields.drug,'Replaced all pages','native target ranges must not truncate a selection spanning pages');
      el=editor('drug');el.focus();
      const node=el.querySelector('[data-offset="4"]').firstChild;w.getSelection().setBaseAndExtent(node,0,node,0);
      a.layoutAndRender();
      assert.equal(w.document.activeElement.dataset.field,'drug','preview refresh retains editing focus');
      input(editor('drug'),'insertText','!');
      assert.equal(d.fields.drug,'Repl!aced all pages','preview refresh retains clicked cursor position');
      el=editor('drug');el.textContent='Native input';
      w.getSelection().setBaseAndExtent(el.firstChild,6,el.firstChild,6);
      el.dispatchEvent(new w.InputEvent('input',{bubbles:true,inputType:'insertText',data:'input'}));
      assert.equal(d.fields.drug,'Native input','non-cancelable browser edits synchronize to state');
      input(editor('drug'),'insertText','!');assert.equal(d.fields.drug,'Native! input');
      el=editor('drug');el.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));
      el.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true,data:'漢字'}));
      assert.equal(d.fields.drug,'Native!漢字 input','composition commits once at the selection');
      el.dispatchEvent(new w.InputEvent('input',{bubbles:true,inputType:'insertCompositionText',data:'漢字'}));
      assert.equal(d.fields.drug,'Native!漢字 input','detached composition events cannot duplicate edits');
      input(select('drug',0,d.fields.drug.length),'insertText','A\tB');
      el=editor('drug');const tab=el.querySelector('[data-offset="1"]').firstChild;tab.textContent+='X';
      w.getSelection().setBaseAndExtent(tab,2,tab,2);el.dispatchEvent(new w.InputEvent('input',{bubbles:true,inputType:'insertText',data:'X'}));
      assert.equal(d.fields.drug,'A\tXB','native edits cannot replace existing tabs with spaces');
      el=select('drug',0,1);el.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));
      a.layoutAndRender();assert.equal(editor('drug'),el,'background refresh cannot replace an active composition');
      el.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true,data:''}));
      assert.equal(d.fields.drug,'A\tXB','cancelled composition preserves selected text');
    } finally { w.close(); }
  });

  test(`${path}: all section continuations retain offsets and grow within page borders`, () => {
    const dom = new JSDOM(readFileSync(path,'utf8'), {runScripts:'outside-only',url:'http://localhost'});
    const w=dom.window;
    try {
      w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length})});w.requestAnimationFrame=()=>1;
      const script=[...w.document.scripts].find(s=>s.textContent.includes('function pageSVG')).textContent;
      w.eval(script.slice(0,script.lastIndexOf('prepareGlyphColors().then('))+`window.api={layoutAndRender,sectionRows,metrics,get state(){return state},get pages(){return pages}};`);
      const a=w.api,d=a.state.drugs.find(d=>d.id===a.state.selected);
      const text='  A  B\n- Take 5 mg\n\nTabs\there.\n';
      const rows=a.sectionRows(text,'notes',12);
      for (const row of rows) assert.equal(typeof row.start,'number','wrapped rows carry source offsets');
      assert.equal(rows.map(r=>text.slice(r.start,r.end)+(r.newline?'\n':'')).join(''),text,'whitespace, bullets and newlines survive wrapping');
      for (const key of Object.keys(d.fields)) d.fields[key]='One';
      d.fields.notes=Array.from({length:100},(_,i)=>`Line ${i}`).join('\n');a.layoutAndRender();
      assert.ok(a.pages.length>1);
      const blocks=a.pages.flatMap(p=>p.blocks);
      assert.deepEqual([...new Set(blocks.map(b=>b.key))],['drug','action','dosage','indication','contraindication','adverse','effects','notes']);
      for(const b of blocks) assert.ok(b.bottom<=a.state.settings.height-a.state.settings.bottom+.01);
      const noteRows=blocks.filter(b=>b.key==='notes').flatMap(b=>b.rows);
      assert.equal(noteRows[0].start,0);assert.equal(noteRows.at(-1).end,d.fields.notes.length);
      a.state.settings.cap=72*25.4/96;a.state.settings.lineGap=5;a.state.settings.autoSpacing=false;
      for(const key of Object.keys(d.fields))d.fields[key]='Agqy '.repeat(15);
      a.layoutAndRender();
      for(const p of a.pages)for(const b of p.blocks)for(const [i,row] of b.rows.entries()){
        const baseline=b.y+(b.headLines.length+i)*(b.gap||5),cap=row.cap;
        let x=a.state.settings.left+3.5+row.indent;
        for(const c of row.text){const m=a.metrics(c,cap);
          if(m.h){assert.ok(baseline+m.y>=b.top,'large letters stay below the section top');assert.ok(baseline+m.y+m.h<=b.bottom+.001,'descenders stay inside the section bottom');assert.ok(x+m.w<=a.state.settings.width-a.state.settings.right,'glyphs stay inside the right border');}
          x+=m.advance;
        }
      }
      assert.equal(a.state.settings.cap,72*25.4/96,'layout never shrinks the chosen letter size');
      assert.equal(a.state.settings.lineGap,5,'layout does not overwrite spacing controls');
    } finally { w.close(); }
  });
}
