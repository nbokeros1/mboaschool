"use client";

import { useRouter } from "next/navigation";

interface EtablissementOption {
  /** ID de la ligne enseignants (pas de establishments) */
  enseignantId: string;
  nomEtablissement: string;
}

interface Props {
  etablissements: EtablissementOption[];
  selectedEnseignantId: string;
  debut: string;
  fin: string;
}

export function SelecteurEtablissement({
  etablissements,
  selectedEnseignantId,
  debut,
  fin,
}: Props) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams({ eid: e.target.value, debut, fin });
    router.push(`/enseignant/mon-espace?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-[#ebebeb] bg-white px-4 py-3">
      <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
        Établissement
      </span>
      <select
        value={selectedEnseignantId}
        onChange={onChange}
        className="flex-1 min-w-[200px] rounded-lg border border-slate-200 bg-[#f9f7f2] px-3 py-2 text-sm font-semibold text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {etablissements.map((e) => (
          <option key={e.enseignantId} value={e.enseignantId}>
            {e.nomEtablissement}
          </option>
        ))}
      </select>
    </div>
  );
}
