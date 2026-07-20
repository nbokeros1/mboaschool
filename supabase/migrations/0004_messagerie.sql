-- ============================================================================
-- Écoles237 Pro — Module Messagerie Interne
-- Diffusion globale ou par département disciplinaire (directeur → enseignants)
-- ============================================================================

-- 1. Table des messages
create table if not exists messages (
  id                        uuid        primary key default gen_random_uuid(),
  etablissement_id          uuid        not null references establishments(id) on delete cascade,
  auteur_id                 uuid        not null references auth.users(id)     on delete cascade,
  canal                     text        not null check (canal in ('global', 'departement')),
  departement_disciplinaire text,
  titre                     text        not null,
  contenu                   text        not null,
  created_at                timestamptz not null default now(),

  -- canal = 'departement' exige un département non nul
  constraint messages_departement_required
    check (canal = 'global' or departement_disciplinaire is not null)
);

create index if not exists idx_messages_etablissement on messages(etablissement_id);
create index if not exists idx_messages_created_at   on messages(created_at desc);

alter table messages enable row level security;

-- 2a. Policy directeur : lecture + écriture complète sur son établissement
drop policy if exists messages_directeur on messages;
create policy messages_directeur on messages
  for all
  using  (etablissement_id = current_establishment_id())
  with check (etablissement_id = current_establishment_id());

-- 2b. Policy enseignant : lecture seule des messages qui le concernent
--   - messages globaux de son établissement
--   - messages de département dont il enseigne une matière
drop policy if exists messages_enseignant_read on messages;
create policy messages_enseignant_read on messages
  for select
  using (
    -- Doit appartenir à l'établissement de l'enseignant connecté
    etablissement_id in (
      select etablissement_id
      from   enseignants
      where  user_id = auth.uid()
    )
    and (
      -- Canal global : toujours visible
      canal = 'global'
      or
      -- Canal département : visible seulement si l'enseignant enseigne dans ce département
      (
        canal = 'departement'
        and departement_disciplinaire in (
          select distinct m.departement_disciplinaire
          from   enseignant_matieres em
          join   matieres m on m.id = em.matiere_id
          join   enseignants e    on e.id = em.enseignant_id
          where  e.user_id = auth.uid()
            and  m.departement_disciplinaire is not null
        )
      )
    )
  );

-- 3. Grant lecture aux enseignants authentifiés
grant select on table public.messages to authenticated;
