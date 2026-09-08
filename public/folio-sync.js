/* Loaded after the local editor. Exported HTML embeds this runtime for offline use. */
function installFolioSync() {
  const scope = window;
  const uuid = () => scope.crypto.randomUUID();
  class FolioSync {
    constructor(options) {
      Object.assign(this, options);
      this.version = 0;
      this.changed = false;
      this.dead = false;
      this.busy = false;
      const saved = this.storage.getItem(this.key);
      this.doc = saved ? JSON.parse(saved) : { project: options.initial, dirty: options.dirty,
        revision: null, mutation: uuid(), attempted: null };
      this.diskMutation = saved ? this.doc.mutation : null;
      this.recoveryKey = this.key + ':recovery:' + uuid();
      if (!this.doc || typeof this.doc.dirty !== 'boolean' || !this.doc.project ||
          !(this.doc.revision === null || Number.isSafeInteger(this.doc.revision))) throw Error('Invalid local notebook');
      if (saved) this.apply(this.doc.project);
    }
    touch() {
      this.version++;
      this.changed = true;
      this.doc.dirty = true;
      this.status('local');
    }
    persist() {
      try {
        const disk = JSON.parse(this.storage.getItem(this.key) || 'null');
        if (disk?.dirty && disk.mutation !== this.diskMutation) {
          // A second tab has unsynced work. Keep both drafts instead of overwriting it.
          this.storage.setItem(this.recoveryKey, JSON.stringify(this.doc));
          this.conflict = { ...disk, local: true };
          this.status('conflict'); return false;
        }
        this.storage.setItem(this.key, JSON.stringify(this.doc));
        this.diskMutation = this.doc.mutation;
        return true;
      }
      catch { this.status('storage-error'); return false; }
    }
    flush() {
      if (this.dead) return false;
      if (this.changed) {
        this.doc.project = JSON.parse(JSON.stringify(this.read()));
        this.doc.mutation = uuid();
        this.changed = false;
      }
      return this.persist();
    }
    async sync() {
      if (this.dead || this.busy) return;
      this.busy = true;
      try {
        if (!this.flush()) return;
        this.status('syncing');
        const version = this.version;
        const remote = await this.request('load');
        if (this.dead) return;
        // Recover a successful upload whose response was lost, including after reload.
        if (remote && remote.mutation_id === this.doc.attempted) {
          this.doc.revision = remote.revision;
          if (this.doc.mutation === this.doc.attempted && !this.changed) this.doc.dirty = false;
          this.doc.attempted = null;
        }
        if (this.doc.dirty || this.version !== version) {
          if ((remote?.revision || 0) !== (this.doc.revision || 0)) {
            this.conflict = remote; this.flush(); this.status('conflict'); return;
          }
          if (!this.flush()) return;
          const sent = { project: this.doc.project, revision: remote?.revision || 0, mutation_id: this.doc.mutation };
          this.doc.attempted = sent.mutation_id;
          if (!this.persist()) return;
          const result = await this.request('save', sent);
          if (this.dead) return;
          if (result.status !== 'saved') {
            this.conflict = result; this.status('conflict'); return;
          }
          this.doc.revision = result.revision;
          this.doc.attempted = null;
          if (!this.changed && this.doc.mutation === sent.mutation_id) this.doc.dirty = false;
        } else if (remote && remote.revision !== this.doc.revision) {
          if (this.canApply && !this.canApply()) { this.status('pending'); return; }
          this.apply(remote.project);
          this.doc.project = JSON.parse(JSON.stringify(this.read()));
          this.doc.revision = remote.revision;
        } else if (!remote) this.doc.revision = 0;
        this.conflict = null;
        if (this.flush()) this.status(this.doc.dirty ? 'pending' : 'synced');
      } catch { if (!this.dead) this.status('pending'); }
      finally { this.busy = false; }
    }
    async resolve(choice) {
      if (!this.conflict || this.dead || this.busy) return;
      // Preserve a recovery copy before an explicit conflict decision.
      try { this.storage.setItem(this.key + ':recovery:' + uuid(), JSON.stringify(this.read())); }
      catch { this.status('storage-error'); return; }
      if (choice === 'remote') {
        this.apply(this.conflict.project);
        this.doc.project = JSON.parse(JSON.stringify(this.read()));
        this.doc.dirty = false; this.changed = false;
      } else {
        this.touch();
      }
      this.doc.revision = this.conflict.revision;
      if (this.conflict.local) this.diskMutation = this.conflict.mutation;
      this.doc.attempted = null;
      this.conflict = null;
      if (this.flush()) await this.sync();
    }
    destroy() { this.flush(); this.dead = true; }
  }
  scope.FolioSync = FolioSync;
  scope.FolioSyncSource = '(' + installFolioSync.toString() + ')();';
  const host = scope.folioHost;
  if (!host || !/^https?:$/.test(scope.location.protocol)) return;
  const script = scope.document.querySelector('script[data-folio-sync]');
  const runtimeURL = new URL(script.src || scope.location.href);
  runtimeURL.pathname = runtimeURL.pathname.replace(/\/folio\/folio-sync\.js$/, '/folio-sync.js');
  const bridgeURL = new URL('folio-sync.html', runtimeURL);
  const frame = scope.document.createElement('iframe');
  frame.hidden = true; frame.title = 'Notebook background sync'; frame.dataset.folioBridge = '';
  let client, owner, retryTimer, delay = 1500;
  const pending = new Map();
  const request = (op, args) => new Promise((resolve, reject) => {
    const id = uuid();
    const timer = setTimeout(() => { pending.delete(id); reject(Error('Sync timed out')); }, 15000);
    pending.set(id, { resolve, reject, timer });
    frame.contentWindow.postMessage({ channel: 'folio-sync-v1', id, op, args, owner, key: host.key }, scope.location.origin);
  });
  const labels = { local: 'Saving on this device…', syncing: 'Saved here · syncing…', pending: 'Saved here · sync pending',
    synced: 'Saved here · synced online', conflict: 'Two copies need review', 'storage-error': 'Storage full · export a backup' };
  const schedule = (ms = 1200) => {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (scope.navigator.onLine === false) { status('pending'); return; }
      if (scope.navigator.locks) scope.navigator.locks.request('folio-sync:' + host.key + ':' + owner, () => client?.sync());
      else void client?.sync();
    }, ms);
  };
  const status = kind => {
    host.status(labels[kind] || kind);
    const actions = scope.document.getElementById('sync-conflict');
    if (actions) actions.hidden = kind !== 'conflict';
    if (kind === 'conflict') renderRecovery();
    if (kind === 'pending') { schedule(delay); delay = Math.min(delay * 2, 60000); }
    if (kind === 'synced') { delay = 1500; schedule(30000); }
  };
  host.touch = () => { client?.touch(); };
  host.persist = () => {
    if (!client) return false;
    if (client.flush()) { host.status('Saved on this device'); schedule(); }
    return true;
  };
  scope.addEventListener('message', event => {
    if (event.origin !== scope.location.origin || event.source !== frame.contentWindow || event.data?.channel !== 'folio-sync-v1') return;
    const message = event.data;
    if (message.type === 'identity') {
      const next = message.owner || null;
      if (owner === next) return;
      const previous = owner;
      client?.destroy(); client = null; clearTimeout(retryTimer);
      owner = next;
      for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(Error('Account changed')); }
      pending.clear();
      try {
        if (previous) host.apply(host.guest());
        if (!owner) { host.status('Saved here · sign in to sync'); return; }
        const key = host.key + ':account:' + owner;
        const claimed = scope.localStorage.getItem(host.key + ':claimed');
        const initial = !claimed ? host.read() : host.defaults();
        client = new FolioSync({ storage: scope.localStorage, key, initial, dirty: !claimed && host.hasLocal(),
          read: host.read, apply: host.apply, canApply: () => !host.editing(), status, request });
        // Never migrate another account's local draft into a new account.
        if (!scope.localStorage.getItem(key)) host.apply(initial);
        if (!client.flush()) return;
        scope.localStorage.setItem(host.key + ':claimed', owner);
        renderRecovery();
        schedule(0);
      } catch { host.status('Local copy unreadable · export a backup'); }
    } else {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id); clearTimeout(entry.timer);
      if (message.error) entry.reject(Error(message.error)); else entry.resolve(message.result);
    }
  });
  scope.addEventListener('online', () => schedule(0));
  scope.addEventListener('offline', () => { if(client) status('pending'); });
  scope.addEventListener('pagehide', () => client?.flush());
  scope.document.addEventListener('visibilitychange', () => {
    if (scope.document.hidden) client?.flush(); else if(client) schedule(0);
  });
  // Other tabs must not silently replace this tab's edits; cloud revision checks arbitrate writes.
  scope.addEventListener('storage', event => {
    if (client && event.key === client.key) schedule(0);
  });
  const actions = scope.document.createElement('div');
  actions.id = 'sync-conflict'; actions.hidden = true; actions.setAttribute('role', 'group');
  actions.setAttribute('aria-label', 'Choose which notebook copy to keep');
  for (const [choice, label] of [['local', 'Keep this device'], ['remote', 'Use other copy']]) {
    const button = scope.document.createElement('button'); button.textContent = label;
    button.onclick = () => void client?.resolve(choice); actions.append(button);
  }
  const backup = scope.document.createElement('button'); backup.textContent = 'Download other copy';
  backup.onclick = () => { if(client?.conflict?.project) host.backup(client.conflict.project); };
  actions.append(backup);
  scope.document.getElementById('save-status').after(actions);
  const recovery = scope.document.createElement('details'); recovery.id = 'sync-recovery'; recovery.hidden = true;
  actions.after(recovery);
  function renderRecovery() {
    recovery.replaceChildren(); recovery.hidden = true;
    if (!owner) return;
    const summary = scope.document.createElement('summary'); summary.textContent = 'Recovery copies'; recovery.append(summary);
    const prefix = host.key + ':account:' + owner + ':recovery:';
    for (let i = 0; i < scope.localStorage.length; i++) {
      const key = scope.localStorage.key(i); if (!key.startsWith(prefix)) continue;
      try {
        const saved = JSON.parse(scope.localStorage.getItem(key)), project = saved.project || saved;
        const button = scope.document.createElement('button');
        button.textContent = 'Download ' + (project.title || 'recovered notebook');
        button.onclick = () => host.backup(project); recovery.append(button); recovery.hidden = false;
      } catch { /* Leave unreadable recovery entries intact. */ }
    }
  }
  frame.src = bridgeURL.href;
  scope.document.body.append(frame);
}
installFolioSync();
