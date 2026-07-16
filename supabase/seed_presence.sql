-- ============================================================================
-- Données de test — Module Présence (Phase 1)
-- ============================================================================
-- À exécuter dans l'éditeur SQL Supabase APRÈS la migration 0002_presence.sql
-- et APRÈS avoir créé au moins 2-3 enseignants via la route d'emploi du temps.
--
-- Remplace les UUIDs ci-dessous par les vrais IDs de tes enseignants de test.
-- Tu peux les récupérer avec : SELECT id, nom, prenom FROM enseignants LIMIT 10;

-- Exemple : attribue des codes et taux horaires à 3 enseignants
-- (remplace les UUIDs par les vrais)

/*
UPDATE enseignants
SET code_pointage = '1234', taux_horaire = 5000, type_contrat = 'CDI'
WHERE id = 'UUID_ENSEIGNANT_1';

UPDATE enseignants
SET code_pointage = '5678', taux_horaire = 3500, type_contrat = 'CDD'
WHERE id = 'UUID_ENSEIGNANT_2';

UPDATE enseignants
SET code_pointage = '9999'
WHERE id = 'UUID_ENSEIGNANT_3';
*/

-- Exemple de pointages simulés pour tester le calcul de salaire
-- (remplace les UUIDs et l'etablissement_id)

/*
INSERT INTO pointages (etablissement_id, enseignant_id, type, horodatage, photo_path) VALUES
  ('UUID_ETABLISSEMENT', 'UUID_ENSEIGNANT_1', 'arrivee', NOW() - INTERVAL '1 day 9 hours', 'test/placeholder.jpg'),
  ('UUID_ETABLISSEMENT', 'UUID_ENSEIGNANT_1', 'depart',  NOW() - INTERVAL '1 day 3 hours', 'test/placeholder.jpg'),
  ('UUID_ETABLISSEMENT', 'UUID_ENSEIGNANT_1', 'arrivee', NOW() - INTERVAL '2 days 9 hours', 'test/placeholder.jpg'),
  ('UUID_ETABLISSEMENT', 'UUID_ENSEIGNANT_1', 'depart',  NOW() - INTERVAL '2 days 2 hours', 'test/placeholder.jpg');
*/
