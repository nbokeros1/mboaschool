-- ============================================================================
-- Écoles237 — Forfait Pro + enseignant multi-établissement
-- ============================================================================

-- 1. Colonne forfait sur establishments
--    subscription_plan ('free'/'premium') reste intact pour l'affichage public.
--    forfait contrôle l'accès aux fonctionnalités Pro.
alter table establishments
  add column if not exists forfait text not null default 'gratuit'
  check (forfait in ('gratuit', 'gere', 'pro'));

-- 2. Mise à jour de calculer_heures_enseignant
--    Ajout d'un 4e paramètre optionnel p_etablissement_id.
--    - Quand fourni : filtre les pointages sur cet établissement précis
--      (cas enseignant multi-établissement qui choisit un établissement).
--    - Quand null : comportement historique (directeur via current_establishment_id()
--      ou enseignant mono-établissement).
--    La version 3-param est supprimée pour éviter l'ambiguïté de résolution.

drop function if exists calculer_heures_enseignant(uuid, date, date);

create or replace function calculer_heures_enseignant(
  p_enseignant_id    uuid,
  p_date_debut       date,
  p_date_fin         date,
  p_etablissement_id uuid default null
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
      -- Filtre explicite par établissement (enseignant multi-étab)
      (
        p_etablissement_id is not null
        and a.etablissement_id = p_etablissement_id
        and (
          p_etablissement_id = current_establishment_id()
          or exists (
            select 1 from enseignants e
            where  e.id      = p_enseignant_id
              and  e.user_id = auth.uid()
          )
        )
      )
      -- Comportement historique : directeur (sans filtre explicite)
      or (p_etablissement_id is null and a.etablissement_id = current_establishment_id())
      -- Comportement historique : enseignant mono-établissement
      or (
        p_etablissement_id is null
        and exists (
          select 1 from enseignants e
          where  e.id      = p_enseignant_id
            and  e.user_id = auth.uid()
        )
      )
    )
    and  a.type             = 'arrivee'
    and  a.horodatage::date between p_date_debut and p_date_fin;
$$;

grant execute on function calculer_heures_enseignant(uuid, date, date, uuid) to authenticated;
