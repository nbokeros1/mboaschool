import { redirect } from "next/navigation";
import { AlertTriangle, Globe, BookOpen, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function MonEspacePage({
  searchParams,
}: {
  searchParams: Promise<{ debut?: string; fin?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/connexion");

  // L'enseignant retrouve sa propre fiche via user_id (RLS : enseignants_self_read)
  const { data: enseignant } = await supabase
    .from("enseignants")
    .select("id, nom, prenom, taux_horaire")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!enseignant) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Aucune fiche enseignant liée à ce compte.{" "}
        <a href="/auth/connexion" className="text-emerald-700 underline">Se reconnecter</a>
      </div>
    );
  }

  // Plage par défaut : semaine courante
  const today = new Date();
  const defaultFin = today.toISOString().slice(0, 10);
  const lundi = new Date(today);
  lundi.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const defaultDebut = lundi.toISOString().slice(0, 10);

  const debut = params.debut ?? defaultDebut;
  const fin = params.fin ?? defaultFin;

  // Heures totales via la fonction SQL (supporte maintenant l'accès enseignant)
  const { data: totalHeures } = await supabase.rpc("calculer_heures_enseignant", {
    p_enseignant_id: enseignant.id,
    p_date_debut: debut,
    p_date_fin: fin,
  });

  // Heures du mois courant (pour comparaison)
  const debutMois = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const { data: heuresMois } = await supabase.rpc("calculer_heures_enseignant", {
    p_enseignant_id: enseignant.id,
    p_date_debut: debutMois,
    p_date_fin: defaultFin,
  });

  // Pointages de la période — RLS : pointages_self_read
  const { data: pointages } = await supabase
    .from("pointages")
    .select("id, type, horodatage, photo_path")
    .eq("enseignant_id", enseignant.id)
    .gte("horodatage", `${debut}T00:00:00`)
    .lte("horodatage", `${fin}T23:59:59`)
    .order("horodatage", { ascending: true });

  // Messages visibles pour cet enseignant (RLS filtre global + département)
  const { data: messages } = await supabase
    .from("messages")
    .select("id, canal, departement_disciplinaire, titre, contenu, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  // URLs signées pour les miniatures
  const signedUrls: (string | null)[] = await Promise.all(
    (pointages ?? []).map((p) =>
      supabase.storage
        .from("pointages-photos")
        .createSignedUrl(p.photo_path, 3600)
        .then((r) => r.data?.signedUrl ?? null)
        .catch(() => null)
    )
  );

  // Détection des jours incomplets (arrivée sans départ)
  const byDate = new Map<string, { arrivees: string[]; departs: string[] }>();
  for (const p of pointages ?? []) {
    const date = p.horodatage.slice(0, 10);
    const entry = byDate.get(date) ?? { arrivees: [], departs: [] };
    if (p.type === "arrivee") entry.arrivees.push(p.horodatage);
    else entry.departs.push(p.horodatage);
    byDate.set(date, entry);
  }
  const incompleteDays = new Set<string>();
  for (const [date, { arrivees, departs }] of Array.from(byDate.entries())) {
    for (const a of arrivees) {
      if (!departs.some((d) => d > a)) { incompleteDays.add(date); break; }
    }
  }

  const heures = Number(totalHeures ?? 0);
  const heuresMoisVal = Number(heuresMois ?? 0);
  const salaireSemaine = enseignant.taux_horaire && heures > 0
    ? Math.round(heures * enseignant.taux_horaire) : null;
  const salaireMois = enseignant.taux_horaire && heuresMoisVal > 0
    ? Math.round(heuresMoisVal * enseignant.taux_horaire) : null;

  function formatH(h: number) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}h${mm.toString().padStart(2, "0")}`;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Mon espace présence
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {enseignant.prenom} {enseignant.nom}
        </p>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Cette semaine</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{formatH(heures)}</p>
          {salaireSemaine !== null && (
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {salaireSemaine.toLocaleString("fr-FR")} FCFA
            </p>
          )}
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Ce mois</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{formatH(heuresMoisVal)}</p>
          {salaireMois !== null && (
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {salaireMois.toLocaleString("fr-FR")} FCFA
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Pointages</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{pointages?.length ?? 0}</p>
        </div>
        {enseignant.taux_horaire && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Taux horaire</p>
            <p className="text-xl font-black text-gray-900 tracking-tight">
              {Number(enseignant.taux_horaire).toLocaleString("fr-FR")}
              <span className="text-sm font-medium text-gray-400"> FCFA</span>
            </p>
          </div>
        )}
      </div>

      {/* Filtre période */}
      <form method="GET" className="flex flex-wrap gap-2 mb-5 items-center">
        <span className="text-sm text-gray-500 font-medium">Période :</span>
        <input
          type="date"
          name="debut"
          defaultValue={debut}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="text-gray-400 text-sm">→</span>
        <input
          type="date"
          name="fin"
          defaultValue={fin}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-[#007A3D] text-white text-sm font-medium"
        >
          Appliquer
        </button>
      </form>

      {/* Avertissement jours incomplets */}
      {incompleteDays.size > 0 && (
        <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              {incompleteDays.size} arrivée(s) sans départ correspondant :
            </span>{" "}
            {Array.from(incompleteDays)
              .sort()
              .map((d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }))
              .join(", ")}
            . Ces heures ne sont pas comptabilisées. Signalez l'oubli au directeur.
          </div>
        </div>
      )}

      {/* Tableau des pointages */}
      {!pointages?.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Aucun pointage sur cette période.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 text-xs font-semibold tracking-widest uppercase text-gray-400">Date</th>
                <th className="text-left p-3 text-xs font-semibold tracking-widest uppercase text-gray-400">Heure</th>
                <th className="text-left p-3 text-xs font-semibold tracking-widest uppercase text-gray-400">Type</th>
                <th className="text-left p-3 text-xs font-semibold tracking-widest uppercase text-gray-400">Photo</th>
              </tr>
            </thead>
            <tbody>
              {pointages.map((p, idx) => {
                const date = p.horodatage.slice(0, 10);
                const incomplete = incompleteDays.has(date) && p.type === "arrivee";
                const d = new Date(p.horodatage);
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-100 last:border-0 ${
                      incomplete ? "bg-amber-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-3">
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                        {incomplete && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                        {d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-gray-900">
                      {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          p.type === "arrivee"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.type === "arrivee" ? "bg-emerald-500" : "bg-orange-500"}`} />
                        {p.type === "arrivee" ? "Arrivée" : "Départ"}
                      </span>
                    </td>
                    <td className="p-3">
                      {signedUrls[idx] ? (
                        <a href={signedUrls[idx]!} target="_blank" rel="noreferrer">
                          <img
                            src={signedUrls[idx]!}
                            alt="Photo"
                            className="w-12 h-10 object-cover rounded-md border border-gray-200 hover:scale-110 transition-transform"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Section Messages ── */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400">
            Messages de la direction
          </h2>
        </div>

        {!messages?.length ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            Aucun message reçu pour l&apos;instant.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <article
                key={m.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  {m.canal === "global" ? (
                    <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-bold shrink-0">
                      <Globe size={10} />
                      Global
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-violet-100 text-violet-700 px-2.5 py-0.5 text-xs font-bold shrink-0">
                      <BookOpen size={10} className="shrink-0" />
                      {m.departement_disciplinaire}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{m.titre}</p>
                      <time className="text-xs text-gray-400 shrink-0">
                        {new Date(m.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {m.contenu}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
