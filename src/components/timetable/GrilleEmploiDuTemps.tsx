"use client";

const JOURS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

interface CreneauAffiche {
  id: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  type: "cours" | "recreation" | "pause_dejeuner";
}

interface AffectationAffichee {
  creneau_id: string;
  matiere_nom: string;
  matiere_couleur?: string;
  enseignant_nom: string;
  classe_nom?: string;
}

export function GrilleEmploiDuTemps({
  creneaux,
  affectations,
  besoinsNonSatisfaits,
  showClasse = false,
}: {
  creneaux: CreneauAffiche[];
  affectations: AffectationAffichee[];
  besoinsNonSatisfaits?: { matiere_nom: string; classe_nom: string; heuresManquantes: number }[];
  showClasse?: boolean;
}) {
  const jours = Array.from(new Set(creneaux.map((c) => c.jour_semaine))).sort();
  const heures = Array.from(new Set(creneaux.map((c) => c.heure_debut))).sort();

  const affectationParCreneau = new Map<string, AffectationAffichee[]>();
  for (const a of affectations) {
    const list = affectationParCreneau.get(a.creneau_id) ?? [];
    list.push(a);
    affectationParCreneau.set(a.creneau_id, list);
  }

  const creneauParJourHeure = new Map(
    creneaux.map((c) => [`${c.jour_semaine}|${c.heure_debut}`, c])
  );

  return (
    <div className="w-full">
      {besoinsNonSatisfaits && besoinsNonSatisfaits.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium mb-1">
            {besoinsNonSatisfaits.length} créneau(x) n&apos;ont pas pu être placés automatiquement :
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {besoinsNonSatisfaits.map((b, i) => (
              <li key={i}>
                {b.classe_nom} – {b.matiere_nom} ({b.heuresManquantes}h manquante(s))
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-amber-700">
            À caser manuellement en cliquant sur une case vide ci-dessous.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 p-2 text-left w-24">
                Heure
              </th>
              {jours.map((j) => (
                <th
                  key={j}
                  className="bg-gray-50 border-b border-gray-200 p-2 text-left min-w-[150px]"
                >
                  {JOURS[j]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heures.map((heure) => (
              <tr key={heure}>
                <td className="sticky left-0 bg-white border-b border-r border-gray-200 p-2 font-medium text-gray-600">
                  {heure}
                </td>
                {jours.map((j) => {
                  const creneau = creneauParJourHeure.get(`${j}|${heure}`);
                  if (!creneau) {
                    return <td key={j} className="border-b border-gray-100 p-2" />;
                  }
                  if (creneau.type === "recreation") {
                    return (
                      <td
                        key={j}
                        className="border-b border-gray-100 p-2 bg-gray-100 text-gray-400 text-xs italic text-center"
                      >
                        Récréation
                      </td>
                    );
                  }
                  if (creneau.type === "pause_dejeuner") {
                    return (
                      <td
                        key={j}
                        className="border-b border-gray-100 p-2 bg-gray-100 text-gray-400 text-xs italic text-center"
                      >
                        Pause déjeuner
                      </td>
                    );
                  }
                  const liste = affectationParCreneau.get(creneau.id) ?? [];
                  return (
                    <td key={j} className="border-b border-gray-100 p-1 align-top">
                      {liste.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {liste.map((a, idx) => (
                            <div
                              key={idx}
                              className="rounded-md p-2"
                              style={{
                                backgroundColor: `${a.matiere_couleur ?? "#007A3D"}1A`,
                                borderLeft: `3px solid ${a.matiere_couleur ?? "#007A3D"}`,
                              }}
                            >
                              <p className="font-medium text-gray-900 text-xs">{a.matiere_nom}</p>
                              <p className="text-xs text-gray-500">{a.enseignant_nom}</p>
                              {showClasse && a.classe_nom && (
                                <p className="text-xs font-medium text-gray-400">{a.classe_nom}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          className="w-full h-full min-h-[3rem] rounded-md border border-dashed border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-500 text-xs"
                          title="Créneau libre à affecter manuellement"
                        >
                          +
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
