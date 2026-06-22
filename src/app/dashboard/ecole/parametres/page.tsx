"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { Save, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["garderie", "primaire", "secondaire", "superieur", "autres"];

export default function ParametresPage() {
  const { school, loading: schoolLoading } = useSchool();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    neighborhood: "",
    phone: "",
    email: "",
    whatsapp: "",
    website: "",
    description: "",
    main_category: "",
    address: "",
  });

  useEffect(() => {
    if (!school) return;
    setForm({
      name:          school.name ?? "",
      city:          school.city ?? "",
      neighborhood:  school.neighborhood ?? "",
      phone:         school.phone ?? "",
      email:         school.email ?? "",
      whatsapp:      school.whatsapp ?? "",
      website:       school.website ?? "",
      description:   school.description ?? "",
      main_category: school.main_category ?? "",
      address:       school.address ?? "",
    });
  }, [school]);

  async function save(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    await supabase
      .from("establishments")
      .update(form)
      .eq("id", school.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (schoolLoading) return <Skeleton />;
  if (!school) return null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Paramètres</h1>
        </div>
        <Link
          href={`/ecole/${school.id}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 border border-[#ddd] px-3 py-2 rounded-xl hover:border-[#aaa] transition-colors"
        >
          <ExternalLink size={12} />
          Voir la fiche
        </Link>
      </div>

      <form onSubmit={save} className="space-y-5">

        {/* Infos principales */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h2 className="font-bold text-sm mb-5">Informations principales</h2>
          <div className="space-y-4">
            <Field label="Nom de l'établissement" required>
              <input
                required
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Catégorie">
                <select
                  value={form.main_category}
                  onChange={(e) => field("main_category", e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ville">
                <input
                  value={form.city}
                  onChange={(e) => field("city", e.target.value)}
                  placeholder="Yaoundé, Douala…"
                />
              </Field>

              <Field label="Quartier">
                <input
                  value={form.neighborhood}
                  onChange={(e) => field("neighborhood", e.target.value)}
                  placeholder="Bastos, Bonamoussadi…"
                />
              </Field>

              <Field label="Adresse">
                <input
                  value={form.address}
                  onChange={(e) => field("address", e.target.value)}
                  placeholder="Rue, numéro…"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
                rows={4}
                placeholder="Présentation de l'établissement, valeurs, pédagogie…"
              />
            </Field>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h2 className="font-bold text-sm mb-5">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Téléphone principal">
              <input
                value={form.phone}
                onChange={(e) => field("phone", e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            </Field>

            <Field label="WhatsApp">
              <input
                value={form.whatsapp}
                onChange={(e) => field("whatsapp", e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
                placeholder="contact@monecole.cm"
              />
            </Field>

            <Field label="Site web">
              <input
                value={form.website}
                onChange={(e) => field("website", e.target.value)}
                placeholder="https://monecole.cm"
              />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
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
              <CheckCircle2 size={15} />
              Modifications sauvegardées
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="[&_input]:w-full [&_input]:border [&_input]:border-[#ddd] [&_input]:rounded-xl [&_input]:px-4 [&_input]:py-2.5 [&_input]:text-sm [&_input]:bg-white [&_input]:placeholder-slate-400 [&_input]:focus:outline-none [&_input]:focus:border-[#0a0a0a] [&_input]:transition-colors [&_select]:w-full [&_select]:border [&_select]:border-[#ddd] [&_select]:rounded-xl [&_select]:px-4 [&_select]:py-2.5 [&_select]:text-sm [&_select]:bg-white [&_select]:focus:outline-none [&_select]:focus:border-[#0a0a0a] [&_select]:transition-colors [&_textarea]:w-full [&_textarea]:border [&_textarea]:border-[#ddd] [&_textarea]:rounded-xl [&_textarea]:px-4 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:bg-white [&_textarea]:placeholder-slate-400 [&_textarea]:focus:outline-none [&_textarea]:focus:border-[#0a0a0a] [&_textarea]:transition-colors [&_textarea]:resize-none">
        {children}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-2xl space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="h-8 w-36 bg-slate-200 rounded" />
      </div>
      <div className="bg-white border border-[#ebebeb] rounded-2xl h-64" />
      <div className="bg-white border border-[#ebebeb] rounded-2xl h-40" />
    </div>
  );
}
