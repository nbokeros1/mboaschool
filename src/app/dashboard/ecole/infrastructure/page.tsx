"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { Save, CheckCircle2, BookOpen, FlaskConical, Monitor, Dumbbell, Utensils, BedDouble, Bus, ShieldCheck, Wifi, HeartPulse } from "lucide-react";

const INFRA_FIELDS = [
  { key: "library",       label: "Bibliothèque",       icon: BookOpen },
  { key: "laboratory",    label: "Laboratoire",        icon: FlaskConical },
  { key: "computer_room", label: "Salle informatique", icon: Monitor },
  { key: "sports_field",  label: "Terrain de sport",   icon: Dumbbell },
  { key: "canteen",       label: "Cantine scolaire",   icon: Utensils },
  { key: "boarding",      label: "Internat",           icon: BedDouble },
  { key: "transport",     label: "Transport scolaire", icon: Bus },
  { key: "security",      label: "Sécurité",           icon: ShieldCheck },
  { key: "wifi",          label: "Connexion Wi-Fi",    icon: Wifi },
  { key: "infirmary",     label: "Infirmerie",         icon: HeartPulse },
];

type InfraForm = Record<string, boolean>;

export default function InfrastructurePage() {
  const { school, loading: schoolLoading } = useSchool();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<InfraForm>(() =>
    Object.fromEntries(INFRA_FIELDS.map((f) => [f.key, false]))
  );

  useEffect(() => {
    if (!school) return;
    supabase
      .from("infrastructures")
      .select("*")
      .eq("establishment_id", school.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setForm(Object.fromEntries(
            INFRA_FIELDS.map((f) => [f.key, Boolean(data[f.key])])
          ));
        }
      });
  }, [school]);

  function toggle(key: string) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function save(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!school) return;
    setSaving(true);

    if (existingId) {
      await supabase.from("infrastructures").update(form).eq("id", existingId);
    } else {
      const { data } = await supabase.from("infrastructures")
        .insert({ establishment_id: school.id, ...form })
        .select("id")
        .single();
      if (data) setExistingId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (schoolLoading) return <Skeleton />;

  const checked = Object.values(form).filter(Boolean).length;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
        <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Infrastructures</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cochez les équipements disponibles dans votre établissement.
          {checked > 0 && <span className="text-emerald-600 font-semibold"> {checked} sélectionné{checked > 1 ? "s" : ""}.</span>}
        </p>
      </div>

      <form onSubmit={save} className="bg-white border border-[#ebebeb] rounded-2xl p-6">
        <div className="grid sm:grid-cols-2 gap-3">
          {INFRA_FIELDS.map(({ key, label, icon: Icon }) => {
            const active = form[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  active
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-[#e5e5e5] text-slate-500 hover:border-[#aaa]"
                }`}
              >
                <Icon size={16} className={active ? "text-emerald-600" : "text-slate-300"} />
                <span className="text-sm font-semibold">{label}</span>
                {active && <CheckCircle2 size={13} className="ml-auto text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>

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
        <div className="h-8 w-44 bg-slate-200 rounded" />
      </div>
      <div className="bg-white border border-[#ebebeb] rounded-2xl h-72" />
    </div>
  );
}
