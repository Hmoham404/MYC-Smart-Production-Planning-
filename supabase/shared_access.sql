-- Accès partagé sans connexion : toute personne possédant la clé publiable
-- et l'URL du projet peut lire et modifier ce document. Ne pas y placer de
-- données que vous souhaitez réserver à des utilisateurs identifiés.
-- Exécuter après schema.sql dans le SQL Editor du même projet Supabase.
drop policy if exists myc_shared_read on public.myc_workspace;
drop policy if exists myc_shared_insert on public.myc_workspace;
drop policy if exists myc_shared_update on public.myc_workspace;
create policy myc_shared_read on public.myc_workspace for select to anon using (id = 'main');
create policy myc_shared_insert on public.myc_workspace for insert to anon with check (id = 'main');
create policy myc_shared_update on public.myc_workspace for update to anon using (id = 'main') with check (id = 'main');
