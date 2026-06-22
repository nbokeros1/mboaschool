"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import {
  ArrowLeft,
  GraduationCap,
  Bell,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

const POST_TYPES = [
  { value: "announcement", label: "Annonce" },
  { value: "homework", label: "Devoir" },
  { value: "event", label: "Événement" },
  { value: "reminder", label: "Rappel" },
];

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const { school } = useSchool();

  const [classe, setClasse] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "announcement" });

  useEffect(() => {
    load();
  }, [classId]);

  async function load() {
    setLoading(true);

    const { data: classData } = await supabase
      .from("classes")
      .select("*")
      .eq("id", classId)
      .single();

    const { data: postsData } = await supabase
      .from("school_announcements")
      .select("*")
      .eq("establishment_id", classData?.establishment_id ?? "")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (classData) setClasse(classData);
    if (postsData) setPosts(postsData);
    setLoading(false);
  }

  async function createPost(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!classe) return;
    setSaving(true);
    const { error } = await supabase.from("school_announcements").insert({
      establishment_id: classe.establishment_id,
      class_id: classId,
      type: form.type,
      title: form.title,
      content: form.content,
    });
    setSaving(false);
    if (!error) {
      setForm({ title: "", content: "", type: "announcement" });
      setShowForm(false);
      load();
    }
  }

  async function deletePost(id: string) {
    await supabase.from("school_announcements").delete().eq("id", id);
    load();
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-5 w-24 bg-slate-200 rounded" />
        <div className="h-24 bg-white border border-[#ebebeb] rounded-2xl" />
        <div className="h-48 bg-white border border-[#ebebeb] rounded-2xl" />
      </div>
    );
  }

  if (!classe) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-3">Classe introuvable.</p>
        <Link href="/dashboard/ecole/classes" className="text-sm text-emerald-700 font-semibold">
          ← Retour aux classes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">

      {/* Back */}
      <Link
        href="/dashboard/ecole/classes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0a0a0a] transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Classes
      </Link>

      {/* Class header */}
      <div className="bg-[#0a0f0d] text-white rounded-2xl p-6 mb-6">
        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
          {classe.level}
        </span>
        <h1 className="text-3xl font-black mt-2 mb-1 flex items-center gap-3">
          <GraduationCap size={26} />
          {classe.name}
        </h1>
        <p className="text-slate-400 text-sm">
          {classe.teacher_name ? `Enseignant : ${classe.teacher_name}` : "Aucun enseignant assigné"}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Publications", value: posts.length, icon: Bell },
          { label: "Élèves", value: "—", icon: GraduationCap },
          { label: "Classe", value: classe.level ?? "—", icon: AlertCircle },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-[#ebebeb] rounded-xl p-4">
              <Icon size={15} className="text-slate-400 mb-2" />
              <p className="text-2xl font-black text-[#0a0a0a]">{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Publish button */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-sm text-[#0a0a0a]">Publications de la classe</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Annuler" : "Publier"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createPost} className="bg-white border border-[#ebebeb] rounded-2xl p-5 mb-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0a0a0a] transition-colors"
              >
                {POST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titre de la publication"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Message pour les parents et élèves…"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Plus size={15} />}
            Publier
          </button>
        </form>
      )}

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="bg-white border border-[#ebebeb] rounded-2xl py-14 text-center">
          <Bell size={28} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm text-slate-400">Aucune publication pour cette classe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="group bg-white border border-[#ebebeb] rounded-2xl p-5 hover:border-[#ccc] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5">
                    {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <h3 className="font-bold text-[#0a0a0a] mb-1.5">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.content}</p>
                </div>
                <button
                  onClick={() => deletePost(p.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-slate-300 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
