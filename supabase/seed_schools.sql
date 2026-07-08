-- ============================================================
-- seed_schools.sql — Établissements MboaSchool
-- 20 Yaoundé + 20 Douala, données réelles ou très plausibles
-- À VÉRIFIER = à confirmer avant mise en production
-- ============================================================

-- 1. Ajouter les colonnes manquantes (safe : IF NOT EXISTS)
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS is_claimed      boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS quartier        text,
  ADD COLUMN IF NOT EXISTS couleur_primaire    text,
  ADD COLUMN IF NOT EXISTS couleur_secondaire  text,
  ADD COLUMN IF NOT EXISTS emoji_logo      text;

-- Les colonnes latitude, longitude et phone existent déjà dans le schéma initial.

-- 2. Mettre is_claimed = true pour les écoles qui ont déjà un owner
UPDATE establishments SET is_claimed = true WHERE owner_id IS NOT NULL;

-- ============================================================
-- YAOUNDÉ — 20 établissements
-- ============================================================

INSERT INTO establishments (
  name, slug, city, region, department,
  quartier, address, phone,
  main_category, sub_category, description,
  latitude, longitude,
  couleur_primaire, couleur_secondaire, emoji_logo,
  is_claimed, is_verified, is_featured,
  accepts_online_payment, subscription_plan
) VALUES

-- ── GARDERIE / CRÈCHE ─────────────────────────────────────────────
(
  'Crèche-Garderie Les Bambins',
  'creche-les-bambins-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Bastos', 'Rue Bastos, près de l''ambassade, Yaoundé', '+237 699 112 233', -- À VÉRIFIER
  'garderie', 'Crèche',
  'Crèche et garderie accueillant les enfants de 0 à 3 ans dans un cadre sécurisé à Bastos.',
  3.8872, 11.5218,
  '#FF9800', '#FFF3E0', '👶',
  false, false, false, false, 'free'
),
(
  'Garderie-Maternelle Sainte-Anne',
  'garderie-sainte-anne-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Biyem-Assi', 'Carrefour Biyem-Assi, Yaoundé', '+237 699 112 244', -- À VÉRIFIER
  'garderie', 'Garderie-Maternelle',
  'Établissement confessionnel catholique accueillant les tout-petits de 2 à 5 ans.',
  3.8382, 11.4928,
  '#4CAF50', '#E8F5E9', '🌟',
  false, false, false, false, 'free'
),

-- ── PRIMAIRE PUBLIC ────────────────────────────────────────────────
(
  'École Publique de Melen',
  'ecole-publique-melen-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Melen', 'Quartier Melen, Yaoundé', '+237 222 200 300', -- À VÉRIFIER
  'primaire', 'Primaire public',
  'École primaire publique bilingue du quartier Melen, rattachée à l''Inspection d''Arrondissement.',
  3.8528, 11.5058,
  '#1565C0', '#E3F2FD', '🏫',
  false, false, false, false, 'free'
),
(
  'École Publique de Mokolo',
  'ecole-publique-mokolo-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Mokolo', 'Marché de Mokolo, Yaoundé', '+237 222 200 301', -- À VÉRIFIER
  'primaire', 'Primaire public',
  'École primaire publique dans le quartier populaire de Mokolo.',
  3.8762, 11.5135,
  '#1565C0', '#E3F2FD', '🏫',
  false, false, false, false, 'free'
),

-- ── PRIMAIRE PRIVÉ LAÏC ────────────────────────────────────────────
(
  'Complexe Scolaire La Victoire',
  'complexe-la-victoire-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Nlongkak', 'Nlongkak, derrière l''Hôtel des Députés, Yaoundé', '+237 699 113 300', -- À VÉRIFIER
  'primaire', 'Primaire privé laïc',
  'Complexe scolaire privé laïc proposant de la maternelle au CM2 avec un encadrement renforcé.',
  3.8718, 11.5142,
  '#E91E63', '#FCE4EC', '🏆',
  false, false, false, false, 'free'
),

-- ── PRIMAIRE CONFESSIONNEL ─────────────────────────────────────────
(
  'École Catholique Sainte-Marie',
  'ecole-catholique-sainte-marie-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Mvog-Ada', 'Quartier Mvog-Ada, Yaoundé', '+237 222 231 150', -- À VÉRIFIER
  'primaire', 'Primaire confessionnel',
  'École catholique fondée par les Missions de Paris, connue pour sa rigueur académique.',
  3.8614, 11.5228,
  '#1B5E20', '#E8F5E9', '✝️',
  false, false, false, false, 'free'
),
(
  'École Protestante de Yaoundé',
  'ecole-protestante-yaounde-nsam',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Nsam', 'Nsam-Efoulan, Yaoundé', '+237 222 231 160', -- À VÉRIFIER
  'primaire', 'Primaire confessionnel',
  'École primaire protestante réputée, gérée par l''Église Évangélique du Cameroun.',
  3.8435, 11.5295,
  '#4A148C', '#EDE7F6', '✝️',
  false, false, false, false, 'free'
),

-- ── COLLÈGE / LYCÉE PUBLIC ─────────────────────────────────────────
(
  'Lycée Général Leclerc',
  'lycee-general-leclerc-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Centre-ville', 'Avenue Monseigneur Vogt, Yaoundé', '+237 222 231 055',
  'secondaire', 'Lycée public',
  'L''un des lycées publics les plus prestigieux du Cameroun, fondé en 1952. Excellents résultats au baccalauréat.',
  3.8668, 11.5174,
  '#1A237E', '#E8EAF6', '🏛️',
  false, false, false, false, 'free'
),
(
  'Lycée Bilingue de Yaoundé',
  'lycee-bilingue-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Omnisports', 'Quartier Omnisports, Yaoundé', '+237 222 200 100', -- À VÉRIFIER
  'secondaire', 'Lycée public bilingue',
  'Lycée public bilingue (français-anglais) de référence dans la capitale.',
  3.8851, 11.5018,
  '#006064', '#E0F7FA', '🇨🇲',
  false, false, false, false, 'free'
),

-- ── COLLÈGE / LYCÉE PRIVÉ ─────────────────────────────────────────
(
  'Collège de la Retraite',
  'college-la-retraite-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Biyem-Assi', 'Biyem-Assi, route de Mendong, Yaoundé', '+237 222 311 020',
  'secondaire', 'Collège privé confessionnel',
  'Collège catholique fondé par les Frères des Écoles Chrétiennes, réputé pour la discipline et les résultats.',
  3.8398, 11.4912,
  '#B71C1C', '#FFEBEE', '✝️',
  false, false, false, false, 'free'
),
(
  'Collège Vogt',
  'college-vogt-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Tsinga', 'Rue Mgr Vogt, Tsinga, Yaoundé', '+237 222 231 060',
  'secondaire', 'Collège privé confessionnel',
  'Collège jésuite fondé en 1948, l''un des établissements secondaires les plus réputés du Cameroun.',
  3.8812, 11.5068,
  '#004D40', '#E0F2F1', '✝️',
  false, false, false, false, 'free'
),

-- ── LYCÉE TECHNIQUE ────────────────────────────────────────────────
(
  'Lycée Technique de Nkolbisson',
  'lycee-technique-nkolbisson-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Nkolbisson', 'Route de Nkolbisson, Yaoundé', '+237 222 234 040', -- À VÉRIFIER
  'secondaire', 'Lycée technique',
  'Lycée technique public spécialisé dans les filières industrielles, agricoles et tertiaires.',
  3.8628, 11.4718,
  '#E65100', '#FFF3E0', '🔧',
  false, false, false, false, 'free'
),

-- ── ÉCOLE FRANÇAISE / INTERNATIONALE ──────────────────────────────
(
  'École Française André Malraux',
  'ecole-francaise-andre-malraux-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Bastos', 'Rue 1.820, Bastos, Yaoundé', '+237 222 204 027',
  'secondaire', 'École française internationale',
  'École homologuée par l''AEFE, accueillant les enfants francophones de maternelle au lycée.',
  3.8875, 11.5205,
  '#002395', '#FFFFFF', '🇫🇷',
  false, false, false, false, 'free'
),

-- ── UNIVERSITÉ PUBLIQUE ────────────────────────────────────────────
(
  'Université de Yaoundé I',
  'universite-yaounde-1',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Ngoa-Ekélé', 'BP 337, Boulevard du 20 Mai, Ngoa-Ekélé, Yaoundé', '+237 222 231 491',
  'superieur', 'Université publique',
  'Principale université publique du Cameroun, fondée en 1962. Faculties de sciences, lettres, droit, médecine.',
  3.8617, 11.5063,
  '#006400', '#F1F8E9', '🎓',
  false, false, false, false, 'free'
),
(
  'Université de Yaoundé II – Soa',
  'universite-yaounde-2-soa',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Soa', 'Route de Soa, Soa-Centre, Yaoundé', '+237 222 237 300', -- À VÉRIFIER
  'superieur', 'Université publique',
  'Deuxième université publique de la capitale, spécialisée en sciences sociales, droit et économie.',
  3.9270, 11.5510,
  '#1A237E', '#E8EAF6', '🎓',
  false, false, false, false, 'free'
),

-- ── ÉCOLE SUPÉRIEURE PRIVÉE ────────────────────────────────────────
(
  'Université Catholique d''Afrique Centrale (UCAC)',
  'ucac-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Melen', 'Hauts de Nkomkana, BP 11628, Yaoundé', '+237 222 310 451',
  'superieur', 'École supérieure privée confessionnelle',
  'Université catholique de référence en Afrique centrale, fondée en 1991 par les évêques d''Afrique centrale.',
  3.8548, 11.5081,
  '#7B1FA2', '#F3E5F5', '✝️',
  false, false, false, false, 'free'
),
(
  'Institut Universitaire du Golfe de Guinée (IUG)',
  'iug-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Bastos', 'Bastos, Yaoundé', '+237 222 209 595', -- À VÉRIFIER
  'superieur', 'École supérieure privée',
  'Institut privé proposant des formations en gestion, informatique, communication et droit.',
  3.8890, 11.5230,
  '#1565C0', '#E3F2FD', '🎓',
  false, false, false, false, 'free'
),

-- ── AUTO-ÉCOLE ─────────────────────────────────────────────────────
(
  'Auto-École La Route Sûre',
  'auto-ecole-la-route-sure-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Centre-ville', 'Plateau Atemengue, Yaoundé', '+237 699 223 344', -- À VÉRIFIER
  'autres', 'Auto-école',
  'Auto-école agréée proposant des formations au permis B, moto et poids lourds.',
  3.8663, 11.5171,
  '#FF5722', '#FBE9E7', '🚗',
  false, false, false, false, 'free'
),

-- ── CENTRE DE FORMATION ────────────────────────────────────────────
(
  'Centre de Formation en Couture et Mode de Yaoundé',
  'cfcm-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Ekoudou', 'Quartier Ekoudou, Yaoundé', '+237 699 334 455', -- À VÉRIFIER
  'autres', 'Centre de formation',
  'Formation professionnelle en couture, stylisme et modélisme. Stages de 3 à 12 mois.',
  3.8591, 11.5217,
  '#E91E63', '#FCE4EC', '🧵',
  false, false, false, false, 'free'
),
(
  'Centre Informatique et Bureautique de Yaoundé (CIBY)',
  'ciby-yaounde',
  'Yaoundé', 'Centre', 'Mfoundi',
  'Nsam', 'Quartier Nsam, Yaoundé', '+237 699 445 566', -- À VÉRIFIER
  'autres', 'Centre de formation',
  'Formations en bureautique, réseaux, maintenance informatique et développement web. Agréé FEICOM.',
  3.8432, 11.5298,
  '#0288D1', '#E1F5FE', '💻',
  false, false, false, false, 'free'
);


-- ============================================================
-- DOUALA — 20 établissements
-- ============================================================

INSERT INTO establishments (
  name, slug, city, region, department,
  quartier, address, phone,
  main_category, sub_category, description,
  latitude, longitude,
  couleur_primaire, couleur_secondaire, emoji_logo,
  is_claimed, is_verified, is_featured,
  accepts_online_payment, subscription_plan
) VALUES

-- ── GARDERIE / CRÈCHE ─────────────────────────────────────────────
(
  'Crèche Les Petits Princes',
  'creche-les-petits-princes-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonapriso', 'Rue Pau, Bonapriso, Douala', '+237 699 500 011', -- À VÉRIFIER
  'garderie', 'Crèche',
  'Crèche moderne accueillant les nourrissons et jeunes enfants dans un environnement sécurisé à Bonapriso.',
  4.0522, 9.7038,
  '#FF9800', '#FFF3E0', '👶',
  false, false, false, false, 'free'
),
(
  'Garderie Bilingue Les Étoiles',
  'garderie-les-etoiles-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonamoussadi', 'Bonamoussadi Centre, Douala', '+237 699 500 022', -- À VÉRIFIER
  'garderie', 'Garderie bilingue',
  'Garderie bilingue français-anglais pour les enfants de 18 mois à 4 ans.',
  4.0748, 9.7408,
  '#8E24AA', '#F3E5F5', '⭐',
  false, false, false, false, 'free'
),

-- ── PRIMAIRE PUBLIC ────────────────────────────────────────────────
(
  'École Publique de Bonanjo',
  'ecole-publique-bonanjo-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonanjo', 'Plateau Joss, Bonanjo, Douala', '+237 233 420 100', -- À VÉRIFIER
  'primaire', 'Primaire public',
  'École primaire publique du quartier administratif de Bonanjo.',
  4.0442, 9.6958,
  '#1565C0', '#E3F2FD', '🏫',
  false, false, false, false, 'free'
),
(
  'École Publique de New Bell',
  'ecole-publique-new-bell-douala',
  'Douala', 'Littoral', 'Wouri',
  'New Bell', 'Carrefour New Bell, Douala', '+237 233 420 101', -- À VÉRIFIER
  'primaire', 'Primaire public',
  'École primaire publique au cœur du quartier populaire de New Bell.',
  4.0498, 9.7242,
  '#1565C0', '#E3F2FD', '🏫',
  false, false, false, false, 'free'
),

-- ── PRIMAIRE PRIVÉ LAÏC ────────────────────────────────────────────
(
  'Complexe Scolaire La Liberté',
  'complexe-la-liberte-douala',
  'Douala', 'Littoral', 'Wouri',
  'Akwa', 'Boulevard de la Liberté, Akwa, Douala', '+237 699 501 100', -- À VÉRIFIER
  'primaire', 'Primaire privé laïc',
  'Complexe scolaire privé proposant des cursus de maternelle au CM2 avec encadrement personnalisé.',
  4.0552, 9.7018,
  '#F44336', '#FFEBEE', '📚',
  false, false, false, false, 'free'
),

-- ── PRIMAIRE CONFESSIONNEL ─────────────────────────────────────────
(
  'École Catholique Saint-Michel',
  'ecole-catholique-saint-michel-douala',
  'Douala', 'Littoral', 'Wouri',
  'Deido', 'Quartier Deido, Douala', '+237 233 412 080', -- À VÉRIFIER
  'primaire', 'Primaire confessionnel',
  'École catholique fondée par les Spiritains, avec une solide tradition d''excellence académique.',
  4.0628, 9.7118,
  '#1B5E20', '#E8F5E9', '✝️',
  false, false, false, false, 'free'
),
(
  'École Protestante Centrale de Douala',
  'ecole-protestante-centrale-douala',
  'Douala', 'Littoral', 'Wouri',
  'Akwa Nord', 'Akwa Nord, Douala', '+237 233 423 150', -- À VÉRIFIER
  'primaire', 'Primaire confessionnel',
  'École protestante historique de Douala, gérée par l''Église Presbytérienne Camerounaise.',
  4.0598, 9.7062,
  '#4A148C', '#EDE7F6', '✝️',
  false, false, false, false, 'free'
),

-- ── COLLÈGE / LYCÉE PUBLIC ─────────────────────────────────────────
(
  'Lycée de New Bell',
  'lycee-de-new-bell-douala',
  'Douala', 'Littoral', 'Wouri',
  'New Bell', 'Quartier New Bell, Douala', '+237 233 408 055',
  'secondaire', 'Lycée public',
  'Lycée public de référence à Douala, proposant les filières A, C, D et techniques.',
  4.0480, 9.7278,
  '#0D47A1', '#E3F2FD', '🏛️',
  false, false, false, false, 'free'
),
(
  'Lycée Bilingue de Deido',
  'lycee-bilingue-deido-douala',
  'Douala', 'Littoral', 'Wouri',
  'Deido', 'Quartier Deido, Douala', '+237 233 412 100', -- À VÉRIFIER
  'secondaire', 'Lycée public bilingue',
  'Lycée public bilingue desservant le quartier Deido et ses environs.',
  4.0632, 9.7108,
  '#006064', '#E0F7FA', '🇨🇲',
  false, false, false, false, 'free'
),

-- ── COLLÈGE / LYCÉE PRIVÉ ─────────────────────────────────────────
(
  'Collège Libermann',
  'college-libermann-douala',
  'Douala', 'Littoral', 'Wouri',
  'Akwa', 'Rue Gallieni, Akwa, Douala', '+237 233 423 005',
  'secondaire', 'Collège privé confessionnel',
  'Collège catholique fondé par les Pères du Saint-Esprit (Spiritains), l''un des plus réputés de Douala depuis 1945.',
  4.0558, 9.7008,
  '#4A148C', '#EDE7F6', '✝️',
  false, false, false, false, 'free'
),
(
  'Complexe Scolaire Bilingue Les Palmiers',
  'complexe-les-palmiers-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonapriso', 'Rue des Palmiers, Bonapriso, Douala', '+237 699 502 200', -- À VÉRIFIER
  'secondaire', 'Collège privé laïc',
  'Complexe scolaire bilingue privé du secondaire avec un encadrement de qualité.',
  4.0530, 9.7052,
  '#33691E', '#F1F8E9', '🌴',
  false, false, false, false, 'free'
),

-- ── LYCÉE TECHNIQUE ────────────────────────────────────────────────
(
  'Lycée Technique de Bassa',
  'lycee-technique-bassa-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bassa', 'Zone Industrielle de Bassa, Douala', '+237 233 468 040',
  'secondaire', 'Lycée technique industriel',
  'Lycée technique public formant aux métiers de l''industrie : mécanique, électrotechnique, bâtiment.',
  4.0378, 9.7638,
  '#BF360C', '#FBE9E7', '⚙️',
  false, false, false, false, 'free'
),

-- ── ÉCOLE FRANÇAISE / INTERNATIONALE ──────────────────────────────
(
  'École Française de Douala – Pierre Loti',
  'ecole-francaise-pierre-loti-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonapriso', 'Rue Pierre Loti, Bonapriso, Douala', '+237 233 430 620',
  'primaire', 'École française internationale',
  'École homologuée AEFE accueillant les élèves francophones de la maternelle au CM2.',
  4.0512, 9.7042,
  '#002395', '#FFFFFF', '🇫🇷',
  false, false, false, false, 'free'
),

-- ── UNIVERSITÉ PUBLIQUE ────────────────────────────────────────────
(
  'Université de Douala',
  'universite-de-douala',
  'Douala', 'Littoral', 'Wouri',
  'Logbaba', 'BP 2701, Logbaba, Douala', '+237 233 407 890',
  'superieur', 'Université publique',
  'Université publique créée en 1993, avec des facultés en droit, sciences économiques, sciences et lettres.',
  4.0335, 9.7528,
  '#1A237E', '#E8EAF6', '🎓',
  false, false, false, false, 'free'
),
(
  'IUT de Douala',
  'iut-de-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bassa', 'Zone Industrielle Bassa, Douala', '+237 233 468 025', -- À VÉRIFIER
  'superieur', 'Institut universitaire de technologie public',
  'Institut rattaché à l''Université de Douala, formant des techniciens supérieurs en 2 ans (DUT).',
  4.0352, 9.7582,
  '#0D47A1', '#E3F2FD', '🔬',
  false, false, false, false, 'free'
),

-- ── ÉCOLE SUPÉRIEURE PRIVÉE ────────────────────────────────────────
(
  'ISTDI – Institut Sup. de Technologie et du Design Industriel',
  'istdi-douala',
  'Douala', 'Littoral', 'Wouri',
  'Akwa', 'Rue Franqueville, Akwa, Douala', '+237 233 430 780',
  'superieur', 'École supérieure privée technique',
  'Grande école d''ingénieurs proposant des formations en génie industriel, design et nouvelles technologies.',
  4.0542, 9.6998,
  '#E65100', '#FFF3E0', '💡',
  false, false, false, false, 'free'
),
(
  'Institut Supérieur de Commerce et de Gestion (ISCG)',
  'iscg-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonamoussadi', 'Bonamoussadi, carrefour Shell, Douala', '+237 699 503 300', -- À VÉRIFIER
  'superieur', 'École supérieure privée',
  'École de commerce et de gestion formant des managers en BTS, Licence et Master.',
  4.0758, 9.7398,
  '#880E4F', '#FCE4EC', '🎓',
  false, false, false, false, 'free'
),

-- ── AUTO-ÉCOLE ─────────────────────────────────────────────────────
(
  'Auto-École Madiba',
  'auto-ecole-madiba-douala',
  'Douala', 'Littoral', 'Wouri',
  'Akwa', 'Boulevard de la Liberté, Akwa, Douala', '+237 699 504 400', -- À VÉRIFIER
  'autres', 'Auto-école',
  'Auto-école agréée proposant formations au permis B, A et permis poids lourds.',
  4.0548, 9.7022,
  '#212121', '#F5F5F5', '🚗',
  false, false, false, false, 'free'
),

-- ── CENTRE DE FORMATION ────────────────────────────────────────────
(
  'Centre de Formation en Informatique et Bureautique (CFIB)',
  'cfib-douala',
  'Douala', 'Littoral', 'Wouri',
  'Ndokotti', 'Carrefour Ndokotti, Douala', '+237 699 505 500', -- À VÉRIFIER
  'autres', 'Centre de formation',
  'Formation en bureautique, maintenance PC, réseaux et développement web. Certifications Microsoft.',
  4.0492, 9.7198,
  '#006064', '#E0F7FA', '💻',
  false, false, false, false, 'free'
),
(
  'Centre de Cuisine et d''Hôtellerie de Douala',
  'centre-cuisine-hotellerie-douala',
  'Douala', 'Littoral', 'Wouri',
  'Bonapriso', 'Rue de la Joie, Bonapriso, Douala', '+237 699 506 600', -- À VÉRIFIER
  'autres', 'Centre de formation',
  'Formation aux métiers de la restauration et de l''hôtellerie. CAP cuisine, pâtisserie, service en salle.',
  4.0518, 9.7048,
  '#F57F17', '#FFFDE7', '🍽️',
  false, false, false, false, 'free'
);


-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT main_category, city, COUNT(*) AS total
FROM establishments
GROUP BY main_category, city
ORDER BY main_category, city;
