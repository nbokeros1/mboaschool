"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { GraduationCap, Plus, Trash2, ArrowRight, X } from "lucide-react";

export default function ClassesPage() {
  const { school, loading: schoolLoading } = useSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", level: "", teacher_name: "" });

  useEffect(() => {
    if (!school) return;
    load(school.id);
  }, [school]);

  async function load(schoolId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("establishment_id", schoolId)
      .order("created_at", { ascending: false });
    if (data) setClasses(data);
    setLoading(false);
  }

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    const { error } = await supabase.from("classes").insert({
      establishment_id: school.id,
      name: form.name,
      level: form.level,
      teacher_name: form.teacher_name || null,
    });
    setSaving(false);
    if (!error) {
      setForm({ name: "", level: "", teacher_name: "" });
      setShowForm(false);
      load(school.id);
    }
  }

  async function deleteClass(id: string) {
    if (!school) return;
    await supabase.from("classes").delete().eq("id", id);
    load(school.id);
  }

  if (schoolLoading) return <PageSkeleton />;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Classes</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Annuler" : "Nouvelle classe"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={createClass}
          className="bg-white border border-[#ebebeb] rounded-2xl p-6 mb-6"
        >
          <h2 className="font-bold text-sm mb-4">Informations de la classe</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nom</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex. CM2 A"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Niveau</label>
              <input
                required
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="ex. Primaire"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Enseignant</label>
              <input
                value={form.teacher_name}
                onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                placeholder="Nom de l'enseignant"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
            Créer la classe
          </button>
        </form>
      )}

      {/* Classes grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white border border-[#ebebeb] rounded-2xl py-16 text-center">
          <GraduationCap size={32} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-semibold text-slate-400">Aucune classe créée</p>
          <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouvelle classe" pour commencer.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="group bg-white border border-[#ebebeb] rounded-2xl p-5 hover:border-[#ccc] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  {c.level}
                </span>
                <button
                  onClick={() => deleteClass(c.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <h3 className="text-xl font-black text-[#0a0a0a] mb-1">{c.name}</h3>
              <p className="text-xs text-slate-400 mb-5">
                {c.teacher_name ? `Prof. ${c.teacher_name}` : "Enseignant non assigné"}
              </p>

              <Link
                href={`/dashboard/ecole/classes/${c.id}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-600 transition-colors group/link"
              >
                Ouvrir la classe
                <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-36 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-36 bg-white border border-[#ebebeb] rounded-2xl" />)}
      </div>
    </div>
  );
}
