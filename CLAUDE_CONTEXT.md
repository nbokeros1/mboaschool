# CLAUDE_CONTEXT — MboaSchool

> Ce fichier est à coller en début de conversation avec Claude (claude.ai)
> avant de poser toute question sur ce projet.
> Il remplace le briefing verbal — lis-le une fois, garde-le ouvert.

---

## C'est quoi ce projet

MboaSchool est un annuaire scolaire pour le Cameroun — anciennement Écoles237.
Le point de départ : trouver une école à Douala ou Yaoundé se fait encore
par bouche-à-oreille ou en se déplaçant. MboaSchool construit d'abord un
annuaire gratuit et ouvert à tous, puis propose aux établissements trois
niveaux de services payants.

Le lancement cible Douala et Yaoundé. Il n'y a pas encore de vraies écoles
en production, mais la base technique est fonctionnelle — annuaire, recherche,
géolocalisation, fiche publique avec carrousel photo, dashboard école de base.

**Fondateur :** Eddy Nwaha (enwaha22@gmail.com)
**Développeur sprint :** Helon
**Référent technique IA :** Claude (Anthropic) — c'est moi

---

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | Next.js 15, App Router, TypeScript, Tailwind CSS |
| Base de données | Supabase (PostgreSQL + Auth) |
| Hébergement | À confirmer (Railway / Netlify / Vercel) |

---

## Ce qui fonctionne déjà

Ne pas retoucher ces parties sans raison documentée — elles sont stables.

- Annuaire public : recherche, filtres, géolocalisation
- Fiche publique d'une école avec carrousel photo en tête de page
- Dashboard école de base : candidatures, galerie, frais, infrastructure
- Flux d'inscription (création de compte école)

---

## Faille de sécurité — PRIORITÉ ABSOLUE

**Avant tout autre développement**, corriger ceci :

`/dashboard/admin` est accessible à n'importe quel utilisateur connecté.
Il n'y a aucune vérification de rôle. Un enseignant lambda peut accéder
à l'espace d'administration de la plateforme.

**Correction attendue :**
Ajouter un middleware Next.js qui vérifie que le compte connecté a le
rôle admin avant d'autoriser l'accès à toute route sous `/dashboard/admin`.
Tester avec un compte ordinaire — l'accès doit être refusé avec une
redirection vers la page d'accueil ou une page 403.

Cette correction se fait le lundi matin. Rien d'autre ne démarre avant.

---

## Modèle commercial — trois offres

Les trois offres sont indépendantes dans le schéma de données.
Ne pas les imbriquer en cascade.

**Offre 1 — Autonome (gratuite)**
L'école gère elle-même sa page. Les parents soumettent des pré-inscriptions
avec un code de suivi automatique. Pas de paiement en ligne — l'école
encaisse par ses propres moyens (Orange Money, MTN MoMo, espèces) et
marque manuellement la pré-inscription comme payée.
Commission MboaSchool : 2% par inscription confirmée.

**Offre 2 — Gérée**
L'équipe MboaSchool gère la page de l'école à sa place.
Accès admin complet avec journal des modifications.
Tarif : forfait annuel + petit pourcentage (montants à définir).

**Offre 3 — Pro (module de gestion interne)**
Emplois du temps générés par IA, pointage, calcul des salaires,
gestion des absences, espace enseignant, messagerie, bulletins.
Indépendant des deux offres ci-dessus — activable même sur l'offre gratuite.

---

## Colonnes à ajouter sur la table `establishments`

Ces colonnes n'existent pas encore. À créer via SQL Editor Supabase
en début de sprint :

```sql
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'autonome'
    CHECK (plan_type IN ('autonome', 'gere', 'pro')),
  ADD COLUMN IF NOT EXISTS module_pro_actif BOOLEAN NOT NULL DEFAULT false;
```

---

## Table `pre_inscriptions` — à créer

```sql
CREATE TABLE IF NOT EXISTS pre_inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  enfant_prenom TEXT NOT NULL,
  enfant_nom TEXT NOT NULL,
  niveau_souhaite TEXT NOT NULL,
  contact_parent TEXT NOT NULL,
  message TEXT,
  code_suivi TEXT UNIQUE NOT NULL DEFAULT 'MBS-' || upper(substring(gen_random_uuid()::text, 1, 6)),
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'confirmee', 'annulee')),
  confirme_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Structure organisationnelle des écoles

Point important pour le module Pro (Phase 4) — à anticiper dans
le schéma sans construire l'interface maintenant :

Une école peut avoir plusieurs sections (maternelle, primaire, secondaire
général, secondaire technique), chacune avec son propre responsable.
Les classes se rattachent à une section.

Table à prévoir : `sections` avec `ecole_id`, `nom`, `responsable_id`, `type`.

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| Parent / public | Annuaire, fiche école, formulaire de pré-inscription |
| École (autonome) | Dashboard de sa propre page |
| Équipe MboaSchool (offre gérée) | Admin complet sur les écoles gérées |
| Admin plateforme | Vue globale, vérification, gestion des comptes |
| Directeur / censeur de section | Module Pro — limité à sa section |
| Enseignant | Module Pro — espace personnel |

---

## Ce qui est hors sprint (après la beta)

Ne pas commencer ces sujets avant la fin des deux semaines :

- Module Pro complet (emplois du temps, pointage, salaires, bulletins)
- Offre Gérée avec accès admin équipe MboaSchool
- Journal des modifications (traçabilité)
- Paiement en ligne (Orange Money, MTN MoMo)
- Volet institutionnel public (IPR / IPD)
- Extension nationale hors Douala / Yaoundé

---

## Feuille de route sprint (2 semaines)

**Semaine 1 — Sécurité et fondations**
- Lun : corriger la faille admin
- Mar : ajouter les colonnes is_claimed, plan_type, module_pro_actif
- Mer : bouton "Revendiquer cette page" + import 20-30 écoles test
- Jeu : dashboard conditionnel selon plan_type
- Ven : tests et stabilisation, demo Eddy

**Semaine 2 — Pré-inscription et beta**
- Lun : créer la table pre_inscriptions avec code de suivi
- Mar : formulaire parent sur la fiche publique
- Mer : onglet pré-inscriptions dans le dashboard école
- Jeu : tableau commissions dans l'admin
- Ven : import 50 écoles, flux complet, rapport beta

---

## Règles de travail avec Claude

1. **Diagnostiquer avant de corriger.** Cause exacte d'abord — fichier et ligne.
   Si Claude Code propose une correction sans avoir montré le code
   problématique, demander le diagnostic d'abord.

2. **La faille admin passe avant tout.** Ne pas démarrer autre chose
   tant que ce n'est pas testé et confirmé.

3. **Toute modification de schéma Supabase passe par SQL Editor.**
   Documenter dans le repo (fichier `schema-changes.md` ou équivalent).

4. **Un prompt, une tâche.** Claude Code traite mieux une chose à la fois.

5. **Pull avant de pousser.** Eddy travaille aussi sur ce repo.
   Toujours synchroniser avant de démarrer.

6. **Ne pas toucher à ce qui fonctionne** (annuaire, recherche, fiche publique,
   dashboard de base) sans raison documentée et accord d'Eddy.

---

## Contact

- **Eddy (superviseur) :** enwaha22@gmail.com
- **Points de synchronisation :** fin de journée vendredi (demo hebdo)
- **Questions d'architecture :** poser à Claude via claude.ai en collant ce fichier