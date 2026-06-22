"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { Bell, Plus, Trash2, X, AlertCircle } from "lucide-react";

export default function AnnoncesPage() {
  const { school, loading: schoolLoading } = useSchool();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", is_important: false });

  useEffect(() => {
    if (!school) return;
    load(school.id);
  }, [school]);

  async function load(schoolId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("school_announcements")
      .select("*")
      .eq("establishment_id", schoolId)
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  }

  async function create(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    const { error } = await supabase.from("school_announcements").insert({
      establishment_id: school.id,
      title: form.title,
      content: form.content,
      is_important: form.is_important,
    });
    setSaving(false);
    if (!error) {
      setForm({ title: "", content: "", is_important: false });
      setShowForm(false);
      load(school.id);
    }
  }

  async function remove(id: string) {
    if (!school) return;
    await supabase.from("school_announcements").delete().eq("id", id);
    load(school.id);
  }

  if (schoolLoading) return <PageSkeleton />;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Annonces</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Annuler" : "Nouvelle annonce"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={create} className="bg-white border border-[#ebebeb] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Nouvelle annonce</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Réunion parents-professeurs, journée portes ouvertes…"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contenu</label>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                placeholder="Détails de l'annonce…"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${form.is_important ? "bg-red-500 border-red-500" : "border-[#ddd]"}`}
                onClick={() => setForm({ ...form, is_important: !form.is_important })}
              >
                {form.is_important && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <span className="text-sm font-medium text-slate-600">Marquer comme important</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
            Publier
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-[#ebebeb] rounded-2xl py-16 text-center">
          <Bell size={28} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-semibold text-slate-400">Aucune annonce publiée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`group bg-white border rounded-2xl p-5 transition-colors hover:border-[#ccc] ${a.is_important ? "border-red-200" : "border-[#ebebeb]"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {a.is_important && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <AlertCircle size={9} /> Important
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0a0a0a] mb-1.5">{a.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{a.content}</p>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-slate-300 hover:text-red-500 transition-all p-1.5"
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

function PageSkeleton() {
  return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-28 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-40 bg-slate-200 rounded-xl" />
      </div>
      {[1,2,3].map(i => <div key={i} className="h-28 bg-white border border-[#ebebeb] rounded-2xl" />)}
    </div>
  );
}
