-- ============================================================================
-- Écoles237 Pro — Module Présence Enseignants (Phase 1 — Mode Kiosque)
-- ============================================================================

-- 1. Colonnes supplémentaires sur enseignants
--    (code_pointage, taux_horaire, type_contrat, user_id préparé Phase 2)
alter table enseignants
  add column if not exists code_pointage text,
  add column if not exists taux_horaire  numeric,
  add column if not exists type_contrat  text,
  add column if not exists user_id       uuid references auth.users(id) on delete set null;

-- Unicité du code de pointage par établissement (on ignore les nulls)
create unique index if not exists idx_enseignants_code_pointage
  on enseignants(etablissement_id, code_pointage)
  where code_pointage is not null;

-- 2. Table des pointages
create table if not exists pointages (
  id              uuid        primary key default gen_random_uuid(),
  etablissement_id uuid       not null references establishments(id)    on delete cascade,
  enseignant_id   uuid        not null references enseignants(id)        on delete cascade,
  type            text        not null check (type in ('arrivee', 'depart')),
  horodatage      timestamptz not null default now(),
  photo_path      text        not null,
  creneau_id      uuid        references creneaux_horaires(id)           on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_pointages_etablissement on pointages(etablissement_id);
create index if not exists idx_pointages_enseignant    on pointages(enseignant_id);
create index if not exists idx_pointages_horodatage    on pointages(horodatage);

alter table pointages enable row level security;

drop policy if exists pointages_scope on pointages;
create policy pointages_scope on pointages
  for all using (etablissement_id = current_establishment_id());

-- 3. Fonction : calcule les heures travaillées d'un enseignant sur une période
--    Associe chaque "arrivee" au premier "depart" suivant le même jour.
--    Les arrivées sans départ correspondant sont ignorées dans le total
--    (elles sont signalées visuellement dans l'UI).
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
    and  a.etablissement_id = current_establishment_id()
    and  a.type             = 'arrivee'
    and  a.horodatage::date between p_date_debut and p_date_fin;
$$;

-- 4. Bucket de stockage des photos de pointage
--    Chemin des fichiers : {etablissement_id}/{enseignant_id}/{timestamp}.jpg
insert into storage.buckets (id, name, public)
values ('pointages-photos', 'pointages-photos', false)
on conflict (id) do nothing;

-- Policy storage : chaque établissement accède uniquement à son dossier
drop policy if exists "pointages_owner_access" on storage.objects;
create policy "pointages_owner_access" on storage.objects
  for all
  using (
    bucket_id = 'pointages-photos'
    and (storage.foldername(name))[1] = (current_establishment_id())::text
  )
  with check (
    bucket_id = 'pointages-photos'
    and (storage.foldername(name))[1] = (current_establishment_id())::text
  );
