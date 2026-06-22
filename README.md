# Écoles237 MVP

Starter MVP Next.js + Supabase pour une plateforme camerounaise de recherche, comparaison et préinscription scolaire.

## Fonctions incluses dans cette première version

- Page d’accueil premium Écoles237
- Logo Écoles237 avec vert/rouge/jaune
- Carrousel publicitaire avec images temporaires
- Catégories : Garderie, Primaire, Secondaire, Supérieur, Autres formations
- Recherche par établissement, ville, quartier, formation
- Géolocalisation simulée liée à la recherche
- Rayon de recherche : 2 km, 5 km, 10 km, 20 km
- Écoles sponsorisées
- Volet comparaison de 2 ou 3 établissements
- Espace privé établissement prévu dans l’interface
- Footer détaillé
- Schéma Supabase complet

## Installation locale

```bash
npm install
npm run dev
```

Ouvrir : http://localhost:3000

## Configuration Supabase

1. Créer un projet Supabase.
2. Copier `.env.example` vers `.env.local`.
3. Remplir :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Aller dans Supabase > SQL Editor.
5. Coller et exécuter `supabase/schema.sql`.

## Prochaine étape technique

- Connecter les cartes établissements à la table `establishments`
- Créer la page `/etablissements/[slug]`
- Créer `/dashboard/ecole`
- Ajouter Supabase Auth
- Ajouter upload PDF/images via Supabase Storage
- Ajouter formulaire de préinscription
- Ajouter paiement simulé OM/MoMo

## Note stratégique

Le revenu principal vient des établissements : pages premium, bannières sponsorisées, visibilité dans les résultats, gestion des fiches et préinscriptions.
