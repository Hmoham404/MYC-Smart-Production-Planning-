-- MYC Smart Production Planning
-- Exécuter dans le SQL Editor du projet Supabase après avoir choisi la politique d'accès.
-- Un document versionné protège les modifications concurrentes contre les écrasements silencieux.
create table if not exists public.myc_workspace (
  id text primary key,
  data jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint myc_workspace_id_check check (length(id) between 1 and 100),
  constraint myc_workspace_data_object check (jsonb_typeof(data) = 'object')
);

alter table public.myc_workspace enable row level security;
revoke all on public.myc_workspace from anon, authenticated;
grant select, insert, update on public.myc_workspace to anon, authenticated;

-- Aucune politique RLS par défaut : aucun accès ne sera accordé tant que la
-- politique adaptée au mode d'accès choisi n'aura pas été ajoutée.
