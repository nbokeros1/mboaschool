-- ============================================================================
-- Écoles237 Pro � Module Emplois du temps
-- ============================================================================
-- MAPPING R�EL CONFIRM� (audit du repo ecoles237-mvp) :
--   - Table `etablissements` -> en r�alit� `establishments` (owner_id -> auth.uid())
--   - Table `classes` -> existe d�j�, on ajoute juste `niveau` si absent
--   - Table `enseignants` -> N'EXISTE PAS, cr��e ci-dessous
-- ============================================================================

alter table classes add column if not exists niveau text;

-- Table enseignants : n'existait pas dans le sch�ma actuel, cr��e ici.
create table if not exists enseignants (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references establishments(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists idx_enseignants_etablissement on enseignants(etablissement_id);

-- ----------------------------------------------------------------------------
-- 1. Mati�res et d�partement disciplinaire
-- ----------------------------------------------------------------------------
create table if not exists matieres (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references establishments(id) on delete cascade,
  nom text not null,
  departement_disciplinaire text not null, -- ex: 'Sciences', 'Lettres', 'Langues'
  couleur text default '#007A3D', -- pour l'affichage en grille
  created_at timestamptz not null default now()
);
create index if not exists idx_matieres_etablissement on matieres(etablissement_id);

-- Volume horaire hebdomadaire d'une mati�re, par niveau (ex: Maths / 6e = 4h)
create table if not exists matieres_volume_horaire (
  id uuid primary key default gen_random_uuid(),
  matiere_id uuid not null references matieres(id) on delete cascade,
  niveau text not null,
  heures_semaine int not null check (heures_semaine > 0),
  unique (matiere_id, niveau)
);

-- ----------------------------------------------------------------------------
-- 2. Rattachement enseignant <-> mati�res qu'il peut enseigner
-- ----------------------------------------------------------------------------
create table if not exists enseignant_matieres (
  enseignant_id uuid not null references enseignants(id) on delete cascade,
  matiere_id uuid not null references matieres(id) on delete cascade,
  primary key (enseignant_id, matiere_id)
);

-- Disponibilit�s hebdomadaires r�currentes d'un enseignant.
-- Si un enseignant n'a AUCUNE ligne ici, il est consid�r� disponible sur
-- toute l'amplitude horaire de l'�tablissement (comportement par d�faut).
create table if not exists enseignant_disponibilites (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references enseignants(id) on delete cascade,
  jour_semaine smallint not null check (jour_semaine between 1 and 6), -- 1=lundi .. 6=samedi
  heure_debut time not null,
  heure_fin time not null,
  check (heure_fin > heure_debut)
);

-- ----------------------------------------------------------------------------
-- 3. Contraintes de l'�tablissement (une ligne par �tablissement)
-- ----------------------------------------------------------------------------
create table if not exists contraintes_etablissement (
  etablissement_id uuid primary key references establishments(id) on delete cascade,
  jours_semaine smallint[] not null default '{1,2,3,4,5}', -- 1=lundi..6=samedi
  heure_debut_amplitude time not null default '07:30',
  heure_fin_amplitude time not null default '17:30',
  duree_creneau_minutes int not null default 60,
  pause_dejeuner_debut time default '12:00',
  pause_dejeuner_fin time default '14:00',
  recreations jsonb not null default '[{"debut":"09:30","fin":"10:00"},{"debut":"15:30","fin":"16:00"}]',
  max_heures_consecutives_matiere int not null default 2,
  max_heures_jour_enseignant int not null default 6,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Cr�neaux horaires � la grille de base g�n�r�e depuis les contraintes
-- ----------------------------------------------------------------------------
create table if not exists creneaux_horaires (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references establishments(id) on delete cascade,
  jour_semaine smallint not null check (jour_semaine between 1 and 6),
  heure_debut time not null,
  heure_fin time not null,
  type text not null default 'cours' check (type in ('cours', 'recreation', 'pause_dejeuner')),
  unique (etablissement_id, jour_semaine, heure_debut)
);
create index if not exists idx_creneaux_etablissement on creneaux_horaires(etablissement_id);

-- ----------------------------------------------------------------------------
-- 5. Emplois du temps � les affectations g�n�r�es
-- ----------------------------------------------------------------------------
create table if not exists emplois_du_temps (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references establishments(id) on delete cascade,
  annee_scolaire text not null, -- ex: '2026-2027'
  classe_id uuid not null references classes(id) on delete cascade,
  matiere_id uuid not null references matieres(id) on delete cascade,
  enseignant_id uuid not null references enseignants(id) on delete cascade,
  creneau_id uuid not null references creneaux_horaires(id) on delete cascade,
  statut text not null default 'genere' check (statut in ('genere', 'modifie', 'valide')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classe_id, creneau_id, annee_scolaire),      -- une classe = un seul cours par cr�neau
  unique (enseignant_id, creneau_id, annee_scolaire)   -- un enseignant = une seule classe par cr�neau
);
create index if not exists idx_edt_etablissement on emplois_du_temps(etablissement_id, annee_scolaire);
create index if not exists idx_edt_classe on emplois_du_temps(classe_id);
create index if not exists idx_edt_enseignant on emplois_du_temps(enseignant_id);

-- ============================================================================
-- RLS � chaque �tablissement ne voit que ses propres donn�es
-- ============================================================================
alter table matieres enable row level security;
alter table matieres_volume_horaire enable row level security;
alter table enseignant_matieres enable row level security;
alter table enseignant_disponibilites enable row level security;
alter table contraintes_etablissement enable row level security;
alter table creneaux_horaires enable row level security;
alter table emplois_du_temps enable row level security;

-- ----------------------------------------------------------------------------
-- Fonction unique de r�solution "quel �tablissement pour l'utilisateur connect�"
-- ----------------------------------------------------------------------------
-- Confirm� par l'audit de schema.sql : establishments a une colonne owner_id
-- qui r�f�rence directement auth.uid() (voir policy "Owners can update own
-- establishments"). Pas besoin de passer par profiles.
create or replace function current_establishment_id()
returns uuid
language sql
security definer
stable
as $$
  select id from establishments where owner_id = auth.uid();
$$;

-- matieres : acc�s direct par etablissement_id
drop policy if exists matieres_scope on matieres;
create policy matieres_scope on matieres
  for all using (etablissement_id = current_establishment_id());

-- matieres_volume_horaire : acc�s via la mati�re parente
drop policy if exists mvh_scope on matieres_volume_horaire;
create policy mvh_scope on matieres_volume_horaire
  for all using (
    matiere_id in (select id from matieres where etablissement_id = current_establishment_id())
  );

-- enseignant_matieres : acc�s via l'enseignant parent
drop policy if exists em_scope on enseignant_matieres;
create policy em_scope on enseignant_matieres
  for all using (
    enseignant_id in (select id from enseignants where etablissement_id = current_establishment_id())
  );

-- enseignant_disponibilites : acc�s via l'enseignant parent
drop policy if exists ed_scope on enseignant_disponibilites;
create policy ed_scope on enseignant_disponibilites
  for all using (
    enseignant_id in (select id from enseignants where etablissement_id = current_establishment_id())
  );

drop policy if exists contraintes_scope on contraintes_etablissement;
create policy contraintes_scope on contraintes_etablissement
  for all using (etablissement_id = current_establishment_id());

drop policy if exists creneaux_scope on creneaux_horaires;
create policy creneaux_scope on creneaux_horaires
  for all using (etablissement_id = current_establishment_id());

drop policy if exists edt_scope on emplois_du_temps;
create policy edt_scope on emplois_du_temps
  for all using (etablissement_id = current_establishment_id());

-- enseignants : acc�s direct par etablissement_id (table nouvellement cr��e)
drop policy if exists enseignants_scope on enseignants;
alter table enseignants enable row level security;
create policy enseignants_scope on enseignants
  for all using (etablissement_id = current_establishment_id());
