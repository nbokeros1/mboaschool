// lib/timetable/generate.ts
//
// G�n�rateur d'emploi du temps par backtracking sous contraintes (CSP).
//
// Pourquoi pas un simple remplissage glouton ligne par ligne : un directeur
// avec 15 classes et 25 enseignants a largement assez de contraintes
// crois�es (un m�me prof de maths intervient dans 4 classes) pour qu'un
// remplissage na�f se bloque � mi-parcours sans solution. Le backtracking
// revient en arri�re quand une affectation locale rend la suite impossible.
//
// Ce n'est PAS un solveur CSP g�n�raliste optimis� (type OR-Tools) � c'est
// volontairement simple et lisible, dimensionn� pour l'�chelle d'un seul
// �tablissement (quelques dizaines de classes/profs, pas des centaines).

import type {
  Affectation,
  GenerationInput,
  GenerationResult,
  CreneauHoraire,
} from "./types";

interface BesoinRestant {
  classe_id: string;
  matiere_id: string;
  niveau: string;
  heuresRestantes: number;
}

const MAX_BACKTRACKS = 200_000; // garde-fou : au-del�, on abandonne cette branche

export function genererEmploiDuTemps(input: GenerationInput): GenerationResult {
  const {
    creneauxCours,
    classes,
    matieres,
    volumesHoraires,
    enseignants,
    enseignantMatieres,
    disponibilites,
    contraintes,
  } = input;

  const matiereById = new Map(matieres.map((m) => [m.id, m]));
  const classeById = new Map(classes.map((c) => [c.id, c]));

  const enseignantsParMatiere = new Map<string, string[]>();
  for (const em of enseignantMatieres) {
    const liste = enseignantsParMatiere.get(em.matiere_id) ?? [];
    liste.push(em.enseignant_id);
    enseignantsParMatiere.set(em.matiere_id, liste);
  }

  const disponibilitesParEnseignant = new Map<string, typeof disponibilites>();
  for (const d of disponibilites) {
    const liste = disponibilitesParEnseignant.get(d.enseignant_id) ?? [];
    liste.push(d);
    disponibilitesParEnseignant.set(d.enseignant_id, liste);
  }

  function enseignantDisponible(enseignantId: string, creneau: CreneauHoraire): boolean {
    const fenetres = disponibilitesParEnseignant.get(enseignantId);
    if (!fenetres || fenetres.length === 0) return true;
    return fenetres.some(
      (f) =>
        f.jour_semaine === creneau.jour_semaine &&
        f.heure_debut <= creneau.heure_debut &&
        f.heure_fin >= creneau.heure_fin
    );
  }

  const besoins: BesoinRestant[] = [];
  for (const classe of classes) {
    const matieresDeCeNiveau = volumesHoraires.filter((v) => v.niveau === classe.level);
    for (const v of matieresDeCeNiveau) {
      besoins.push({
        classe_id: classe.id,
        matiere_id: v.matiere_id,
        niveau: v.niveau,
        heuresRestantes: v.heures_semaine,
      });
    }
  }

  besoins.sort((a, b) => {
    const nbA = (enseignantsParMatiere.get(a.matiere_id) ?? []).length;
    const nbB = (enseignantsParMatiere.get(b.matiere_id) ?? []).length;
    return nbA - nbB;
  });

  type UniteAPlacer = { classe_id: string; matiere_id: string };
  const unites: UniteAPlacer[] = [];
  for (const b of besoins) {
    for (let i = 0; i < b.heuresRestantes; i++) {
      unites.push({ classe_id: b.classe_id, matiere_id: b.matiere_id });
    }
  }

  const creneauxTries = [...creneauxCours].sort((a, b) =>
    a.jour_semaine !== b.jour_semaine
      ? a.jour_semaine - b.jour_semaine
      : a.heure_debut.localeCompare(b.heure_debut)
  );

  const classeOccupeeSurCreneau = new Set<string>();
  const enseignantOccupeSurCreneau = new Set<string>();
  const heuresJourEnseignant = new Map<string, number>();
  const matiereConsecutivesClasse = new Map<string, number>();

  const affectations: Affectation[] = [];
  const besoinsNonSatisfaits: GenerationResult["besoinsNonSatisfaits"] = [];

  let backtracks = 0;

  function clefClasseCreneau(classeId: string, creneauId: string) {
    return `${classeId}|${creneauId}`;
  }
  function clefEnseignantCreneau(ensId: string, creneauId: string) {
    return `${ensId}|${creneauId}`;
  }
  function clefHeuresJour(ensId: string, jour: number) {
    return `${ensId}|${jour}`;
  }
  function clefConsecutif(classeId: string, matiereId: string, jour: number) {
    return `${classeId}|${matiereId}|${jour}`;
  }

  function tenterPlacerUnite(uniteIndex: number): boolean {
    if (uniteIndex >= unites.length) return true;
    if (backtracks > MAX_BACKTRACKS) return false;

    const unite = unites[uniteIndex];
    const enseignantsPossibles = enseignantsParMatiere.get(unite.matiere_id) ?? [];

    for (const creneau of creneauxTries) {
      if (classeOccupeeSurCreneau.has(clefClasseCreneau(unite.classe_id, creneau.id))) continue;

      for (const enseignantId of enseignantsPossibles) {
        if (enseignantOccupeSurCreneau.has(clefEnseignantCreneau(enseignantId, creneau.id))) continue;
        if (!enseignantDisponible(enseignantId, creneau)) continue;
        const clefHJ = clefHeuresJour(enseignantId, creneau.jour_semaine);
        const heuresJourActuel = heuresJourEnseignant.get(clefHJ) ?? 0;
        if (heuresJourActuel >= contraintes.max_heures_jour_enseignant) continue;
        const clefConsec = clefConsecutif(unite.classe_id, unite.matiere_id, creneau.jour_semaine);
        const consecActuel = matiereConsecutivesClasse.get(clefConsec) ?? 0;
        if (consecActuel >= contraintes.max_heures_consecutives_matiere) continue;

        classeOccupeeSurCreneau.add(clefClasseCreneau(unite.classe_id, creneau.id));
        enseignantOccupeSurCreneau.add(clefEnseignantCreneau(enseignantId, creneau.id));
        heuresJourEnseignant.set(clefHJ, heuresJourActuel + 1);
        matiereConsecutivesClasse.set(clefConsec, consecActuel + 1);
        affectations.push({
          classe_id: unite.classe_id,
          matiere_id: unite.matiere_id,
          enseignant_id: enseignantId,
          creneau_id: creneau.id,
        });

        if (tenterPlacerUnite(uniteIndex + 1)) return true;

        backtracks++;
        classeOccupeeSurCreneau.delete(clefClasseCreneau(unite.classe_id, creneau.id));
        enseignantOccupeSurCreneau.delete(clefEnseignantCreneau(enseignantId, creneau.id));
        heuresJourEnseignant.set(clefHJ, heuresJourActuel);
        matiereConsecutivesClasse.set(clefConsec, consecActuel);
        affectations.pop();

        if (backtracks > MAX_BACKTRACKS) return false;
      }
    }

    besoinsNonSatisfaits.push({
      classe_id: unite.classe_id,
      matiere_id: unite.matiere_id,
      heuresManquantes: 1,
      raison:
        enseignantsPossibles.length === 0
          ? "Aucun enseignant rattach� � cette mati�re"
          : "Aucun cr�neau libre compatible (conflit classe/enseignant/plafond horaire)",
    });
    return tenterPlacerUnite(uniteIndex + 1);
  }

  tenterPlacerUnite(0);

  const nonSatisfaitsFusionnes = new Map<string, GenerationResult["besoinsNonSatisfaits"][number]>();
  for (const ns of besoinsNonSatisfaits) {
    const clef = `${ns.classe_id}|${ns.matiere_id}`;
    const existant = nonSatisfaitsFusionnes.get(clef);
    if (existant) {
      existant.heuresManquantes += 1;
    } else {
      nonSatisfaitsFusionnes.set(clef, { ...ns });
    }
  }

  return {
    affectations,
    besoinsNonSatisfaits: Array.from(nonSatisfaitsFusionnes.values()),
  };
}
