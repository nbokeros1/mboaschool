"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2, Check } from "lucide-react";

type Volume = { id: string; niveau: string; heures_semaine: number };
type Matiere = {
  id: string; nom: string; departement_disciplinaire: string;
  couleur: string; volumes: Volume[];
};

const INPUT = "w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors bg-white";
const LABEL = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export function GestionMatieres({
  initialMatieres,
  niveaux,
  departementsExistants,
  etablissementId,
}: {
  initialMatieres: Matiere[];
  niveaux: string[];
  departementsExistants: string[];
  etablissementId: string;
}) {
  const [matieres, setMatieres] = useState<Matiere[]>(initialMatieres);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulaire nouvelle matière
  const [newForm, setNewForm] = useState({ nom: "", departement: "", couleur: "#007A3D" });
  const [addingMatiere, setAddingMatiere] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Formulaire nouveau volume (par matière)
  const [volumeForms, setVolumeForms] = useState<Record<string, { niveau: string; heures: string }>>({});
  const [addingVolume, setAddingVolume] = useState<string | null>(null);

  // Confirmation de suppression
  const [deletingMatiere, setDeletingMatiere] = useState<string | null>(null);
  const [deletingVolume, setDeletingVolume] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function addMatiere(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.nom.trim() || !newForm.departement.trim()) return;
    setAddingMatiere(true);
    setAddError(null);

    const { data, error } = await supabase
      .from("matieres")
      .insert({
        etablissement_id: etablissementId,
        nom: newForm.nom.trim(),
        departement_disciplinaire: newForm.departement.trim(),
        couleur: newForm.couleur,
      })
      .select("id, nom, departement_disciplinaire, couleur")
      .single();

    setAddingMatiere(false);
    if (error) { setAddError(error.message); return; }
    if (data) {
      setMatieres((prev) => [...prev, { ...data, volumes: [] }]);
      setNewForm({ nom: "", departement: "", couleur: "#007A3D" });
      setShowAddForm(false);
    }
  }

  async function deleteMatiere(id: string) {
    setDeletingMatiere(id);
    await supabase.from("matieres").delete().eq("id", id);
    setMatieres((prev) => prev.filter((m) => m.id !== id));
    setDeletingMatiere(null);
  }

  async function addVolume(matiereId: string) {
    const vf = volumeForms[matiereId];
    if (!vf?.niveau || !vf?.heures || Number(vf.heures) < 1) return;
    setAddingVolume(matiereId);

    const { data, error } = await supabase
      .from("matieres_volume_horaire")
      .upsert(
        { matiere_id: matiereId, niveau: vf.niveau.trim(), heures_semaine: Number(vf.heures) },
        { onConflict: "matiere_id,niveau" }
      )
      .select("id, niveau, heures_semaine")
      .single();

    setAddingVolume(null);
    if (error || !data) return;

    setMatieres((prev) =>
      prev.map((m) => {
        if (m.id !== matiereId) return m;
        const existing = m.volumes.find((v) => v.niveau === data.niveau);
        const volumes = existing
          ? m.volumes.map((v) => (v.niveau === data.niveau ? data : v))
          : [...m.volumes, data];
        return { ...m, volumes };
      })
    );
    setVolumeForms((prev) => ({ ...prev, [matiereId]: { niveau: "", heures: "" } }));
  }

  async function deleteVolume(matiereId: string, volumeId: string) {
    setDeletingVolume(volumeId);
    await supabase.from("matieres_volume_horaire").delete().eq("id", volumeId);
    setMatieres((prev) =>
      prev.map((m) =>
        m.id !== matiereId ? m : { ...m, volumes: m.volumes.filter((v) => v.id !== volumeId) }
      )
    );
    setDeletingVolume(null);
  }

  // Grouper par département
  const parDept = new Map<string, Matiere[]>();
  for (const m of matieres) {
    const list = parDept.get(m.departement_disciplinaire) ?? [];
    list.push(m);
    parDept.set(m.departement_disciplinaire, list);
  }

  const datalistId = "depts-list";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Formulaire ajout matière */}
      {showAddForm ? (
        <form onSubmit={addMatiere} className="bg-white border border-[#ebebeb] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm text-[#0a0a0a]">Nouvelle matière</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Nom de la matière *</label>
              <input
                required
                value={newForm.nom}
                onChange={(e) => setNewForm({ ...newForm, nom: e.target.value })}
                placeholder="ex. Mathématiques"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Département disciplinaire *</label>
              <input
                required
                list={datalistId}
                value={newForm.departement}
                onChange={(e) => setNewForm({ ...newForm, departement: e.target.value })}
                placeholder="ex. Sciences exactes"
                className={INPUT}
              />
              <datalist id={datalistId}>
                {departementsExistants.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className={LABEL}>Couleur d&apos;affichage</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newForm.couleur}
                onChange={(e) => setNewForm({ ...newForm, couleur: e.target.value })}
                className="w-10 h-10 rounded-lg border border-[#ddd] cursor-pointer p-0.5"
              />
              <span className="text-sm text-slate-500 font-mono">{newForm.couleur}</span>
              <div className="flex gap-1.5 ml-2">
                {["#007A3D","#2563eb","#dc2626","#d97706","#7c3aed","#0891b2","#be185d"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewForm({ ...newForm, couleur: c })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: newForm.couleur === c ? "#0a0a0a" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {addError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {addError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={addingMatiere}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {addingMatiere ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          <Plus size={15} />
          Nouvelle matière
        </button>
      )}

      {/* Liste des matières groupées par département */}
      {matieres.length === 0 && !showAddForm ? (
        <div className="bg-white border border-[#ebebeb] rounded-2xl py-16 text-center">
          <p className="text-sm font-semibold text-slate-400">Aucune matière définie</p>
          <p className="text-xs text-slate-400 mt-1">
            Ajoutez vos premières matières pour pouvoir générer un emploi du temps.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(parDept.entries()).map(([dept, ms]) => (
            <div key={dept}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                {dept}
              </p>
              <div className="space-y-2">
                {ms.map((m) => {
                  const isExpanded = expanded.has(m.id);
                  const vf = volumeForms[m.id] ?? { niveau: "", heures: "" };

                  return (
                    <div key={m.id} className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden hover:border-[#ccc] transition-colors">
                      {/* En-tête de la matière */}
                      <div
                        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                        onClick={() => toggleExpand(m.id)}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: m.couleur }}
                        />
                        <span className="font-bold text-sm text-[#0a0a0a] flex-1">{m.nom}</span>
                        <span className="text-xs text-slate-400">
                          {m.volumes.length} volume{m.volumes.length !== 1 ? "s" : ""}
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={15} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={15} className="text-slate-400" />
                        )}
                        <button
                          onClick={(ev) => { ev.stopPropagation(); deleteMatiere(m.id); }}
                          disabled={deletingMatiere === m.id}
                          className="ml-1 text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Supprimer la matière"
                        >
                          {deletingMatiere === m.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>

                      {/* Volumes horaires (expandable) */}
                      {isExpanded && (
                        <div className="border-t border-[#f5f5f5] px-5 py-4 bg-[#fafafa] space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Volumes horaires par niveau
                          </p>

                          {m.volumes.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {m.volumes.map((v) => (
                                <div
                                  key={v.id}
                                  className="flex items-center gap-2 bg-white border border-[#ebebeb] rounded-lg px-3 py-1.5 text-sm"
                                >
                                  <span className="font-semibold text-[#0a0a0a]">{v.niveau}</span>
                                  <span className="text-slate-400">→</span>
                                  <span className="font-bold text-emerald-700">{v.heures_semaine}h/sem</span>
                                  <button
                                    onClick={() => deleteVolume(m.id, v.id)}
                                    disabled={deletingVolume === v.id}
                                    className="text-slate-300 hover:text-red-400 transition-colors ml-1"
                                  >
                                    {deletingVolume === v.id ? (
                                      <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={11} />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic mb-2">
                              Aucun volume défini — le générateur ignorera cette matière pour toutes les classes.
                            </p>
                          )}

                          {/* Ajout d'un volume */}
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className={LABEL + " !mb-1"}>Niveau</label>
                              {niveaux.length > 0 ? (
                                <select
                                  value={vf.niveau}
                                  onChange={(e) =>
                                    setVolumeForms((prev) => ({
                                      ...prev,
                                      [m.id]: { ...vf, niveau: e.target.value },
                                    }))
                                  }
                                  className={INPUT}
                                >
                                  <option value="">— Choisir —</option>
                                  {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                              ) : (
                                <input
                                  value={vf.niveau}
                                  onChange={(e) =>
                                    setVolumeForms((prev) => ({
                                      ...prev,
                                      [m.id]: { ...vf, niveau: e.target.value },
                                    }))
                                  }
                                  placeholder="ex. 6ème"
                                  className={INPUT}
                                />
                              )}
                            </div>
                            <div className="w-28">
                              <label className={LABEL + " !mb-1"}>H/semaine</label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={vf.heures}
                                onChange={(e) =>
                                  setVolumeForms((prev) => ({
                                    ...prev,
                                    [m.id]: { ...vf, heures: e.target.value },
                                  }))
                                }
                                placeholder="4"
                                className={INPUT}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => addVolume(m.id)}
                              disabled={addingVolume === m.id || !vf.niveau || !vf.heures}
                              className="flex items-center gap-1.5 bg-[#0a0a0a] text-white px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-40 shrink-0"
                            >
                              {addingVolume === m.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              OK
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
