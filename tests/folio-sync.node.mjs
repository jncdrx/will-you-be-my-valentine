import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { JSDOM } from 'jsdom';

function setup(saved, remote = null) {
  const disk = new Map(saved || []);
  const scope = { crypto: { randomUUID } };
  const context = vm.createContext({ window: scope, setTimeout, clearTimeout, console });
  if (existsSync('public/folio-sync.js')) vm.runInContext(readFileSync('public/folio-sync.js', 'utf8'), context);
  assert.equal(typeof scope.FolioSync, 'function', 'durable local-first sync is installed');
  let project = { text: 'initial' }, online = remote, fail = false, hold;
  const storage = { getItem: k => disk.get(k) || null, setItem: (k,v) => disk.set(k,v) };
  const status = [];
  const client = new scope.FolioSync({ storage, key: 'account:a', initial: project, dirty: false,
    read: () => project, apply: p => { project = p; }, status: s => status.push(s),
    request: async (op, args) => {
      if (fail) throw Error('offline');
      if (op === 'load') { if(hold) await hold; return online; }
      if ((online?.revision || 0) !== args.revision) return { status: 'conflict', ...online };
      online = { project: args.project, revision: args.revision + 1, mutation_id: args.mutation_id };
      return { status: 'saved', ...online };
    } });
  return { client, disk, status, set text(v) { project={text:v};client.touch(); }, get project(){return project},
    get remote(){return online}, set remote(v){online=v}, set fail(v){fail=v}, set hold(v){hold=v}, storage };
}

test('offline edits persist before upload and resume after reload', async () => {
  const a=setup();a.text='offline draft';a.fail=true;a.client.flush();await a.client.sync();
  assert.equal(JSON.parse(a.disk.get('account:a')).project.text,'offline draft');
  assert.equal(JSON.parse(a.disk.get('account:a')).dirty,true);
  const b=setup(a.disk);await b.client.sync();
  assert.equal(b.remote.project.text,'offline draft');
  assert.equal(JSON.parse(b.disk.get('account:a')).dirty,false);
});

test('a delayed cloud read cannot replace an edit made while it was running', async () => {
  const a=setup(undefined,{project:{text:'online'},revision:4,mutation_id:'remote'});
  let release;a.hold=new Promise(r=>release=r);const sync=a.client.sync();
  a.text='new local';release();await sync;
  assert.equal(a.project.text,'new local');assert.ok(a.status.includes('conflict'));
});

test('conflicting cloud changes require a choice and keep the local draft', async () => {
  const a=setup(undefined,{project:{text:'remote'},revision:2,mutation_id:'other'});
  a.text='mine';await a.client.sync();
  assert.equal(a.remote.project.text,'remote');assert.equal(a.project.text,'mine');
  await a.client.resolve('local');
  assert.equal(a.remote.project.text,'mine');assert.equal(a.remote.revision,3);
});

test('edits during upload stay queued and a lost acknowledgement is recovered', async () => {
  const a=setup();a.text='first';
  const original=a.client.request;
  a.client.request=async(op,args)=>{
    const result=await original(op,args);
    if(op==='save'){a.text='second';a.client.flush();throw Error('lost response');}return result;
  };
  await a.client.sync();
  assert.equal(a.remote.project.text,'first');
  a.client.request=original;await a.client.sync();
  assert.equal(a.remote.project.text,'second');
  assert.equal(JSON.parse(a.disk.get('account:a')).dirty,false);
});

test('storage failure prevents a false saved status and an unprotected upload', async () => {
  const a=setup();a.storage.setItem=()=>{throw Error('quota')};a.text='important';
  await a.client.sync();assert.equal(a.remote,null);assert.ok(a.status.includes('storage-error'));
});

test('destroying a client ignores stale cloud results from a previous account', async () => {
  const a=setup(undefined,{project:{text:'old account'},revision:1,mutation_id:'remote'});
  let release;a.hold=new Promise(r=>release=r);const pending=a.client.sync();
  a.client.destroy();release();await pending;
  assert.equal(a.project.text,'initial');
});

test('a second tab cannot overwrite another tab’s unsynced draft', () => {
  const a=setup();a.client.flush();
  const b=setup(a.disk);
  // Share the storage backend while retaining each independent in-memory document.
  b.storage.getItem=a.storage.getItem;b.storage.setItem=a.storage.setItem;
  a.text='tab one';a.client.flush();
  b.text='tab two';assert.equal(b.client.flush(),false);
  assert.equal(JSON.parse(a.disk.get('account:a')).project.text,'tab one');
  assert.ok([...a.disk.entries()].some(([k,v])=>k.includes(':recovery:')&&JSON.parse(v).project.text==='tab two'));
  assert.ok(b.status.includes('conflict'));
});

test('cloud refresh waits until the user leaves the editor', async () => {
  const a=setup(undefined,{project:{text:'remote'},revision:2,mutation_id:'other'});
  a.client.canApply=()=>false;await a.client.sync();
  assert.equal(a.project.text,'initial');
  a.client.canApply=()=>true;await a.client.sync();
  assert.equal(a.project.text,'remote');
});

test('host integration isolates accounts, accepts only its bridge, and embeds an offline runtime', () => {
  const dom=new JSDOM('<span id="save-status"></span><script data-folio-sync src="./folio-sync.js"></script>',
    {url:'https://example.test/app/folio/index.html',runScripts:'outside-only'});
  const w=dom.window;
  try {
    let project={title:'Guest draft'};
    const guest=()=>({title:'Guest draft'});
    w.folioHost={key:'folio-test',read:()=>project,apply:p=>{project=p},defaults:()=>({title:'Default'}),
      guest,hasLocal:()=>true,status:()=>{},editing:()=>false,backup:()=>{}};
    w.eval(readFileSync('public/folio-sync.js','utf8'));
    const frame=w.document.querySelector('[data-folio-bridge]');
    assert.equal(frame.src,'https://example.test/app/folio-sync.html');
    const identity=(owner,origin='https://example.test',source=frame.contentWindow)=>w.dispatchEvent(new w.MessageEvent('message',
      {origin,source,data:{channel:'folio-sync-v1',type:'identity',owner}}));
    identity('attacker','https://elsewhere.test');
    assert.equal(w.localStorage.getItem('folio-test:claimed'),null);
    identity('alice');
    project={title:'Alice edits'};w.folioHost.touch();w.folioHost.persist();
    assert.equal(JSON.parse(w.localStorage.getItem('folio-test:account:alice')).project.title,'Alice edits');
    identity('bob');
    assert.equal(project.title,'Default','Alice’s draft is never migrated into Bob’s account');
    assert.equal(JSON.parse(w.localStorage.getItem('folio-test:account:alice')).project.title,'Alice edits');
    identity(null);assert.equal(project.title,'Guest draft');
    const offline=new JSDOM('',{url:'file:///tmp/notebook.html',runScripts:'outside-only'});
    try {offline.window.eval(w.FolioSyncSource);assert.equal(typeof offline.window.FolioSync,'function');
      assert.equal(offline.window.document.querySelector('iframe'),null);} finally {offline.window.close();}
  } finally {w.close();}
});
