-- ============================================================================
-- Écoles237 Pro — Comptes Enseignants (Phase 2)
-- ============================================================================
-- IMPORTANT : ALTER TYPE ADD VALUE ne peut pas être utilisé dans la même
-- transaction que son utilisation. En Supabase SQL Editor, exécuter ce
-- fichier entier en une seule fois — l'éditeur utilise l'autocommit et
-- chaque statement est dans sa propre transaction.
-- ============================================================================

-- 1. Nouveau rôle dans l'enum (doit passer avant toute utilisation)
alter type user_role add value if not exists 'teacher';

-- 2. Colonne pour tracer l'envoi de l'invitation
alter table enseignants
  add column if not exists invite_envoyee_le timestamptz;

-- 3. Policies RLS supplémentaires sur enseignants
--    (la policy directeur "enseignants_scope" reste intacte)

-- Un enseignant peut lire SA PROPRE ligne une fois son compte lié
drop policy if exists enseignants_self_read on enseignants;
create policy enseignants_self_read on enseignants
  for select
  using (user_id = auth.uid());

-- 4. Policies RLS sur pointages
--    (la policy directeur "pointages_scope" reste intacte)

-- Un enseignant peut lire ses propres pointages
drop policy if exists pointages_self_read on pointages;
create policy pointages_self_read on pointages
  for select
  using (
    enseignant_id in (
      select id from enseignants where user_id = auth.uid()
    )
  );

-- 5. Mise à jour du trigger handle_new_user
--    Lit raw_user_meta_data->>'role' pour affecter le rôle 'teacher'
--    aux comptes créés via invitation enseignant.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role user_role;
begin
  -- Si le metadata contient role='teacher', on l'affecte ; sinon 'parent'
  v_role := case
    when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'::user_role
    else 'parent'::user_role
  end;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    v_role
  );
  return new;
end;
$$;

-- 6. Mise à jour de calculer_heures_enseignant
--    Autorise l'appel par le directeur (via établissement) OU par
--    l'enseignant lui-même (via user_id = auth.uid()).
create or replace function calculer_heures_enseignant(
  p_enseignant_id uuid,
  p_date_debut    date,
  p_date_fin      date
)
returns numeric
language sql
security definer
stable
as $$
  select coalesce(
    sum(
      extract(epoch from (d.horodatage - a.horodatage)) / 3600.0
    ),
    0
  )
  from pointages a
  inner join lateral (
    select horodatage
    from   pointages d2
    where  d2.enseignant_id    = a.enseignant_id
      and  d2.etablissement_id = a.etablissement_id
      and  d2.type             = 'depart'
      and  d2.horodatage::date = a.horodatage::date
      and  d2.horodatage       > a.horodatage
    order  by d2.horodatage
    limit  1
  ) d on true
  where  a.enseignant_id    = p_enseignant_id
    and  (
      -- Directeur : accès via son établissement
      a.etablissement_id = current_establishment_id()
      -- Enseignant : accès à ses propres données
      or exists (
        select 1 from enseignants e
        where  e.id      = p_enseignant_id
          and  e.user_id = auth.uid()
      )
    )
    and  a.type             = 'arrivee'
    and  a.horodatage::date between p_date_debut and p_date_fin;
$$;

-- 7. Grants
grant select on table public.enseignants to authenticated;
grant select on table public.pointages   to authenticated;
grant execute on function calculer_heures_enseignant(uuid, date, date) to authenticated;
