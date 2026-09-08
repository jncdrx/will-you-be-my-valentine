import { supabase, isSupabaseConfigured } from '../lib/supabase';

const channel = 'folio-sync-v1';
const reply = (message: Record<string, unknown>) => window.parent.postMessage({ channel, ...message }, location.origin);
const identity = (owner: string | null) => reply({ type: 'identity', owner });

// Credentials stay in the SDK. Only the same-origin parent receives notebook data.
if (window.parent !== window && isSupabaseConfigured()) {
  supabase.auth.onAuthStateChange((_event, session) => identity(session?.user.id || null));
  void supabase.auth.getSession().then(({ data }) => identity(data.session?.user.id || null)).catch(() => identity(null));
  window.addEventListener('message', async event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.channel !== channel) return;
    const { id, op, owner, key, args } = event.data;
    if (typeof id !== 'string' || typeof key !== 'string' || key.length > 200 || !['load', 'save'].includes(op)) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== owner) throw Error('Sign in to this account to sync');
      if (op === 'load') {
        const { data, error } = await supabase.from('folio_notebooks')
          .select('project,revision,mutation_id').eq('user_id', session.user.id).eq('project_key', key)
          .setHeader('Authorization', `Bearer ${session.access_token}`)
          .abortSignal(controller.signal).maybeSingle();
        if (error) throw error;
        reply({ id, result: data });
      } else {
        if (!args || args.project?.format !== 'folio-notebook' || args.project?.version !== 1 ||
            !Number.isSafeInteger(args.revision) || args.revision < 0 ||
            !/^[a-f0-9-]{36}$/i.test(args.mutation_id) || JSON.stringify(args.project).length > 15 * 1024 * 1024) {
          throw Error('Invalid notebook');
        }
        const { data, error } = await supabase.rpc('save_folio_notebook', {
          p_key: key, p_project: args.project, p_revision: args.revision, p_mutation: args.mutation_id,
        }).setHeader('Authorization', `Bearer ${session.access_token}`).abortSignal(controller.signal);
        if (error) throw error;
        reply({ id, result: data });
      }
    } catch { reply({ id, error: 'Sync unavailable. Your local notebook is retained.' }); }
    finally { clearTimeout(timeout); }
  });
} else if (window.parent !== window) identity(null);
