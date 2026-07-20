// lib/timetable/build-creneaux.ts
//
// Transforme les contraintes de l'établissement (amplitude, pause déjeuner,
// récréations, durée de créneau) en une grille concrète de créneaux horaires.
// Cette grille est stable : elle ne change que si le directeur modifie les
// contraintes de l'établissement, pas à chaque génération d'emploi du temps.

import type { ContraintesEtablissement, JourSemaine } from "./types";

interface CreneauAConstruire {
  jour_semaine: JourSemaine;
  heure_debut: string;
  heure_fin: string;
  type: "cours" | "recreation" | "pause_dejeuner";
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Construit la liste des créneaux (cours + récréations + pause déjeuner)
 * pour un jour donné, à partir des contraintes. Les créneaux de type
 * 'recreation' et 'pause_dejeuner' sont inclus pour que l'affichage en
 * grille montre les coupures — le moteur de génération, lui, ignore ces
 * créneaux (il ne travaille que sur type === 'cours').
 */
export function construireCreneauxJour(
  jour: JourSemaine,
  contraintes: ContraintesEtablissement
): CreneauAConstruire[] {
  const debut = toMinutes(contraintes.heure_debut_amplitude);
  const fin = toMinutes(contraintes.heure_fin_amplitude);
  const duree = contraintes.duree_creneau_minutes;

  // Fenêtres bloquées (pause déjeuner + récréations), triées par heure de début
  const blocages: { debut: number; fin: number; type: "recreation" | "pause_dejeuner" }[] = [];
  if (contraintes.pause_dejeuner_debut && contraintes.pause_dejeuner_fin) {
    blocages.push({
      debut: toMinutes(contraintes.pause_dejeuner_debut),
      fin: toMinutes(contraintes.pause_dejeuner_fin),
      type: "pause_dejeuner",
    });
  }
  for (const r of contraintes.recreations) {
    blocages.push({ debut: toMinutes(r.debut), fin: toMinutes(r.fin), type: "recreation" });
  }
  blocages.sort((a, b) => a.debut - b.debut);

  const creneaux: CreneauAConstruire[] = [];
  let curseur = debut;

  while (curseur + duree <= fin) {
    const blocageChevauchant = blocages.find(
      (b) => curseur < b.fin && curseur + duree > b.debut
    );

    if (blocageChevauchant) {
      const dejaInsere = creneaux.some(
        (c) => c.type === blocageChevauchant.type && toMinutes(c.heure_debut) === blocageChevauchant.debut
      );
      if (!dejaInsere) {
        creneaux.push({
          jour_semaine: jour,
          heure_debut: toHHMM(blocageChevauchant.debut),
          heure_fin: toHHMM(blocageChevauchant.fin),
          type: blocageChevauchant.type,
        });
      }
      curseur = blocageChevauchant.fin;
      continue;
    }

    creneaux.push({
      jour_semaine: jour,
      heure_debut: toHHMM(curseur),
      heure_fin: toHHMM(curseur + duree),
      type: "cours",
    });
    curseur += duree;
  }

  return creneaux;
}

export function construireGrilleComplete(
  contraintes: ContraintesEtablissement
): CreneauAConstruire[] {
  return contraintes.jours_semaine.flatMap((jour) =>
    construireCreneauxJour(jour, contraintes)
  );
}
