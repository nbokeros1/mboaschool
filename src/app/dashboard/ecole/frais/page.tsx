"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { Save, CheckCircle2, DollarSign } from "lucide-react";

const FEE_FIELDS = [
  { key: "registration_fee", label: "Frais d'inscription",    placeholder: "25000" },
  { key: "tuition_fee",      label: "Frais de scolarité",     placeholder: "185000" },
  { key: "transport_fee",    label: "Transport scolaire",     placeholder: "30000" },
  { key: "canteen_fee",      label: "Cantine",                placeholder: "15000" },
  { key: "uniform_fee",      label: "Uniforme",               placeholder: "20000" },
  { key: "exam_fee",         label: "Examens officiels",      placeholder: "10000" },
  { key: "other_fees",       label: "Autres frais",           placeholder: "0" },
];

type FeeForm = Record<string, string>;

export default function FraisPage() {
  const { school, loading: schoolLoading } = useSchool();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeeForm>(() =>
    Object.fromEntries(FEE_FIELDS.map((f) => [f.key, ""]))
  );

  useEffect(() => {
    if (!school) return;
    supabase
      .from("fees")
      .select("*")
      .eq("establishment_id", school.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setForm(Object.fromEntries(
            FEE_FIELDS.map((f) => [f.key, data[f.key] ? String(data[f.key]) : ""])
          ));
        }
      });
  }, [school]);

  async function save(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!school) return;
    setSaving(true);

    const payload = Object.fromEntries(
      FEE_FIELDS.map((f) => [f.key, form[f.key] ? Number(form[f.key]) : 0])
    );

    if (existingId) {
      await supabase.from("fees").update(payload).eq("id", existingId);
    } else {
      const { data } = await supabase.from("fees")
        .insert({ establishment_id: school.id, ...payload })
        .select("id")
        .single();
      if (data) setExistingId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (schoolLoading) return <Skeleton />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
        <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Frais de scolarité</h1>
        <p className="text-slate-500 text-sm mt-1">Ces montants sont affichés sur votre fiche publique.</p>
      </div>

      <form onSubmit={save} className="bg-white border border-[#ebebeb] rounded-2xl p-6">
        <div className="space-y-4">
          {FEE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {f.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-[#ddd] rounded-xl pl-4 pr-16 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  FCFA
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Laissez à 0 les frais non applicables — ils ne seront pas affichés.
        </p>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#0a0a0a] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={15} />}
            Enregistrer
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
              <CheckCircle2 size={15} /> Sauvegardé
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-2xl space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="h-8 w-48 bg-slate-200 rounded" />
      </div>
      <div className="bg-white border border-[#ebebeb] rounded-2xl h-96" />
    </div>
  );
}
