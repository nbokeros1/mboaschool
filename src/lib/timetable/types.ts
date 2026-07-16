// Types partagés entre le moteur de génération et les routes API / composants.

export type JourSemaine = 1 | 2 | 3 | 4 | 5 | 6; // 1 = lundi ... 6 = samedi

export interface ContraintesEtablissement {
  etablissement_id: string;
  jours_semaine: JourSemaine[];
  heure_debut_amplitude: string; // "07:30"
  heure_fin_amplitude: string; // "17:30"
  duree_creneau_minutes: number;
  pause_dejeuner_debut: string | null;
  pause_dejeuner_fin: string | null;
  recreations: { debut: string; fin: string }[];
  max_heures_consecutives_matiere: number;
  max_heures_jour_enseignant: number;
}

export interface CreneauHoraire {
  id: string;
  etablissement_id: string;
  jour_semaine: JourSemaine;
  heure_debut: string;
  heure_fin: string;
  type: "cours" | "recreation" | "pause_dejeuner";
}

export interface Classe {
  id: string;
  establishment_id: string;
  name: string;
  level: string;
}

export interface Matiere {
  id: string;
  etablissement_id: string;
  nom: string;
  departement_disciplinaire: string;
}

export interface VolumeHoraire {
  matiere_id: string;
  niveau: string;
  heures_semaine: number;
}

export interface Enseignant {
  id: string;
  etablissement_id: string;
  nom: string;
  prenom: string;
}

export interface EnseignantDisponibilite {
  enseignant_id: string;
  jour_semaine: JourSemaine;
  heure_debut: string;
  heure_fin: string;
}

// Ce que le moteur de génération reçoit en entrée
export interface GenerationInput {
  etablissementId: string;
  anneeScolaire: string;
  contraintes: ContraintesEtablissement;
  creneauxCours: CreneauHoraire[]; // uniquement les créneaux de type 'cours'
  classes: Classe[];
  matieres: Matiere[];
  volumesHoraires: VolumeHoraire[]; // volume par (matiere, niveau)
  enseignants: Enseignant[];
  enseignantMatieres: { enseignant_id: string; matiere_id: string }[];
  disponibilites: EnseignantDisponibilite[]; // vide pour un prof = dispo partout
}

// Une affectation produite par le moteur
export interface Affectation {
  classe_id: string;
  matiere_id: string;
  enseignant_id: string;
  creneau_id: string;
}

export interface GenerationResult {
  affectations: Affectation[];
  besoinsNonSatisfaits: {
    classe_id: string;
    matiere_id: string;
    heuresManquantes: number;
    raison: string;
  }[];
}
