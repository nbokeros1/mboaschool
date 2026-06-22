"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, School, User, Baby, Send, CheckCircle2 } from "lucide-react";

const EMPTY_FORM = {
  establishment_id: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  student_first_name: "",
  student_last_name: "",
  student_age: "",
  desired_level: "",
  previous_school: "",
  message: "",
};

function PreinscriptionForm() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("ecole") ?? "";

  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, establishment_id: preselectedId });

  useEffect(() => {
    supabase
      .from("establishments")
      .select("id, name, city")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data) setSchools(data);
      });
  }, []);

  function handleChange(e: { target: { name: string; value: string } }) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("applications").insert({
      establishment_id: form.establishment_id,
      parent_name: form.parent_name,
      parent_phone: form.parent_phone,
      parent_email: form.parent_email || null,
      student_first_name: form.student_first_name,
      student_last_name: form.student_last_name,
      full_student_name: `${form.student_first_name} ${form.student_last_name}`,
      student_age: form.student_age ? Number(form.student_age) : null,
      desired_level: form.desired_level,
      previous_school: form.previous_school || null,
      message: form.message || null,
      status: "pending",
    });
    setLoading(false);
    if (!error) {
      setSuccess(true);
      setForm({ ...EMPTY_FORM, establishment_id: preselectedId });
    }
  }

  const selectedSchool = schools.find((s) => s.id === form.establishment_id);

  if (success) {
    return (
      <div className="min-h-screen bg-[#f9f7f2] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-[#0a0a0a] mb-2">Demande envoyée</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Votre dossier de préinscription a bien été reçu.
            L'établissement va traiter la demande et vous contactera prochainement.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-[#0a0a0a] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Nouvelle préinscription
            </button>
            <Link
              href="/"
              className="w-full border border-[#ddd] text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:border-[#aaa] transition-colors text-center"
            >
              Retour à l'annuaire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f2]">

      {/* Header */}
      <div className="bg-[#0a0f0d] text-white">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
          <Link
            href={selectedSchool ? `/ecole/${form.establishment_id}` : "/"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft size={15} />
            {selectedSchool ? selectedSchool.name : "Annuaire"}
          </Link>
          <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 mb-2">
            Préinscription
          </p>
          <h1 className="text-4xl font-black tracking-tight">
            {selectedSchool
              ? `Inscrire un enfant à ${selectedSchool.name}`
              : "Inscrire un enfant"}
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-xl">
            Remplissez ce formulaire pour créer un dossier de préinscription.
            L'établissement pourra traiter la demande directement depuis son tableau de bord.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* School */}
          <Section icon={School} title="Établissement souhaité">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                École
              </label>
              <select
                name="establishment_id"
                value={form.establishment_id}
                onChange={handleChange}
                required
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0a0a0a] transition-colors"
              >
                <option value="">— Choisir un établissement —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.city}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {/* Parent */}
          <Section icon={User} title="Informations du parent">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom complet" name="parent_name" value={form.parent_name} onChange={handleChange} required />
              <Field label="Téléphone" name="parent_phone" value={form.parent_phone} onChange={handleChange} required placeholder="+237 6XX XXX XXX" />
              <Field label="Email" name="parent_email" type="email" value={form.parent_email} onChange={handleChange} placeholder="Optionnel" />
            </div>
          </Section>

          {/* Student */}
          <Section icon={Baby} title="Informations de l'enfant">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Prénom" name="student_first_name" value={form.student_first_name} onChange={handleChange} required />
              <Field label="Nom" name="student_last_name" value={form.student_last_name} onChange={handleChange} required />
              <Field label="Âge" name="student_age" type="number" value={form.student_age} onChange={handleChange} />
              <Field label="Classe / niveau souhaité" name="desired_level" value={form.desired_level} onChange={handleChange} required placeholder="Ex : CP, 6ème, Terminale…" />
              <Field label="Ancienne école" name="previous_school" value={form.previous_school} onChange={handleChange} placeholder="Optionnel" />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Message complémentaire
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                placeholder="Besoins particuliers, questions, informations à préciser…"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
              />
            </div>
          </Section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={15} />}
            {loading ? "Envoi en cours…" : "Envoyer la préinscription"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Gratuit · Sans engagement · L'école vous contactera directement
          </p>
        </form>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
      <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Icon size={15} className="text-slate-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label, name, value, onChange, type = "text", required = false, placeholder = "",
}: {
  label: string; name: string; value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder-slate-400"
      />
    </div>
  );
}

export default function PreinscriptionPage() {
  return (
    <Suspense>
      <PreinscriptionForm />
    </Suspense>
  );
}
