-- Each account owns its notebooks. Revisions prevent stale devices overwriting newer work.
create table public.folio_notebooks (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null check (length(project_key) between 1 and 200),
  project jsonb not null check (
    coalesce(jsonb_typeof(project) = 'object' and project->>'format' = 'folio-notebook'
    and project->>'version' = '1' and jsonb_typeof(project->'drugs') = 'array'
    and jsonb_typeof(project->'settings') = 'object', false)
    and octet_length(project::text) <= 16777216
  ),
  revision bigint not null default 1 check (revision > 0),
  mutation_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, project_key)
);
alter table public.folio_notebooks enable row level security;
revoke all on public.folio_notebooks from anon, authenticated;
grant select, insert, update on public.folio_notebooks to authenticated;
create policy folio_owner_select on public.folio_notebooks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy folio_owner_insert on public.folio_notebooks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy folio_owner_update on public.folio_notebooks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.save_folio_notebook(p_key text, p_project jsonb, p_revision bigint, p_mutation uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  saved public.folio_notebooks%rowtype;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_revision is null or p_revision < 0 or p_mutation is null then raise exception 'Invalid revision'; end if;
  -- Serialize concurrent first inserts as well as updates for this account/key.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || ':' || p_key, 0));
  select * into saved from public.folio_notebooks where user_id = owner_id and project_key = p_key for update;
  if found then
    if saved.mutation_id = p_mutation then
      return jsonb_build_object('status', 'saved', 'revision', saved.revision, 'mutation_id', saved.mutation_id);
    end if;
    if saved.revision <> p_revision then
      return jsonb_build_object('status', 'conflict', 'revision', saved.revision, 'mutation_id', saved.mutation_id, 'project', saved.project);
    end if;
    update public.folio_notebooks set project = p_project, revision = revision + 1,
      mutation_id = p_mutation, updated_at = now()
      where user_id = owner_id and project_key = p_key returning * into saved;
  else
    if p_revision <> 0 then raise exception 'Notebook no longer exists'; end if;
    insert into public.folio_notebooks(user_id, project_key, project, mutation_id)
      values (owner_id, p_key, p_project, p_mutation) returning * into saved;
  end if;
  return jsonb_build_object('status', 'saved', 'revision', saved.revision, 'mutation_id', saved.mutation_id);
end;
$$;
revoke all on function public.save_folio_notebook(text,jsonb,bigint,uuid) from public, anon;
grant execute on function public.save_folio_notebook(text,jsonb,bigint,uuid) to authenticated;
