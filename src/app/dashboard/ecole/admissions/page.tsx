"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import {
  ClipboardList,
  Search,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Phone,
  Mail,
  GraduationCap,
  MessageSquare,
  School,
  ChevronDown,
} from "lucide-react";

const STATUSES = [
  { value: "all",       label: "Toutes",     cls: "" },
  { value: "pending",   label: "En attente", cls: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "reviewing", label: "En cours",   cls: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "accepted",  label: "Acceptée",   cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "rejected",  label: "Refusée",    cls: "text-red-700 bg-red-50 border-red-200" },
];

function statusConfig(status: string) {
  return STATUSES.find((s) => s.value === status) ?? { label: status, cls: "text-slate-600 bg-slate-50 border-slate-200" };
}

export default function AdmissionsPage() {
  const { school, loading: schoolLoading } = useSchool();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!school) return;
    load();
  }, [school]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("establishment_id", school!.id)
      .order("created_at", { ascending: false });
    if (data) setApps(data);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    await supabase.from("applications").update({ status }).eq("id", id);
    setUpdating(false);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }));
  }

  async function saveNote(id: string) {
    setUpdating(true);
    await supabase.from("applications").update({ notes: note }).eq("id", id);
    setUpdating(false);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, notes: note } : a)));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, notes: note }));
  }

  function openDetail(app: any) {
    setSelected(app);
    setNote(app.notes ?? "");
  }

  const filtered = apps.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      const name = (a.full_student_name ?? `${a.student_first_name} ${a.student_last_name}`).toLowerCase();
      const parent = (a.parent_name ?? "").toLowerCase();
      if (!name.includes(q) && !parent.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    pending:   apps.filter((a) => a.status === "pending").length,
    reviewing: apps.filter((a) => a.status === "reviewing").length,
    accepted:  apps.filter((a) => a.status === "accepted").length,
    rejected:  apps.filter((a) => a.status === "rejected").length,
  };

  if (schoolLoading) return <Skeleton />;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
        <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Admissions</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",      value: apps.length,       icon: ClipboardList, color: "text-slate-500" },
          { label: "En attente", value: counts.pending,    icon: Clock,         color: "text-yellow-500" },
          { label: "Acceptées",  value: counts.accepted,   icon: CheckCircle2,  color: "text-emerald-500" },
          { label: "Refusées",   value: counts.rejected,   icon: XCircle,       color: "text-red-500" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-[#ebebeb] rounded-xl p-4">
              <Icon size={15} className={`${s.color} mb-2`} />
              <p className="text-2xl font-black text-[#0a0a0a]">{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#ebebeb] rounded-xl px-4 py-2.5 flex-1 focus-within:border-[#aaa] transition-colors">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par élève ou parent…"
            className="bg-transparent outline-none text-sm flex-1 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={13} className="text-slate-400 hover:text-slate-700" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                filter === s.value
                  ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                  : "bg-white text-slate-500 border-[#e5e5e5] hover:border-[#aaa]"
              }`}
            >
              {s.label}
              {s.value !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {counts[s.value as keyof typeof counts] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ebebeb]">
          <p className="text-sm font-semibold">
            {loading ? "Chargement…" : (
              <><span className="text-emerald-600">{filtered.length}</span> dossier{filtered.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-[#f5f5f5]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-50 rounded w-1/4" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={28} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Aucun dossier trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f5f5]">
            {filtered.map((app) => {
              const name = app.full_student_name
                ?? `${app.student_first_name ?? ""} ${app.student_last_name ?? ""}`.trim()
                ?? "—";
              const s = statusConfig(app.status);
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => openDetail(app)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#0a0a0a] truncate">{name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {app.parent_name ?? "—"} · {app.desired_level ?? "Niveau non précisé"} ·{" "}
                      {new Date(app.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>
                    {s.label}
                  </span>
                  <Eye size={14} className="text-slate-300 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/30" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#ebebeb] shrink-0">
              <h2 className="font-black text-lg text-[#0a0a0a]">Dossier</h2>
              <button onClick={() => setSelected(null)}>
                <X size={20} className="text-slate-400 hover:text-[#0a0a0a]" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">

              {/* Status badge + changer */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Statut</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.filter((s) => s.value !== "all").map((s) => (
                    <button
                      key={s.value}
                      disabled={updating}
                      onClick={() => updateStatus(selected.id, s.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        selected.status === s.value
                          ? `${s.cls} ring-2 ring-offset-1 ring-current`
                          : "bg-white text-slate-400 border-[#e5e5e5] hover:border-[#aaa]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Élève */}
              <Section title="Informations de l'élève" icon={GraduationCap}>
                <Row label="Nom complet" value={selected.full_student_name ?? `${selected.student_first_name ?? ""} ${selected.student_last_name ?? ""}`.trim()} />
                <Row label="Âge" value={selected.student_age ? `${selected.student_age} ans` : "—"} />
                <Row label="Niveau souhaité" value={selected.desired_level ?? "—"} />
                <Row label="Ancienne école" value={selected.previous_school ?? "—"} />
              </Section>

              {/* Parent */}
              <Section title="Informations du parent" icon={School}>
                <Row label="Nom" value={selected.parent_name ?? "—"} />
                {selected.parent_phone && (
                  <a
                    href={`tel:${selected.parent_phone}`}
                    className="flex items-center gap-2 py-2 text-sm text-emerald-700 font-semibold hover:underline"
                  >
                    <Phone size={13} /> {selected.parent_phone}
                  </a>
                )}
                {selected.parent_email && (
                  <a
                    href={`mailto:${selected.parent_email}`}
                    className="flex items-center gap-2 py-2 text-sm text-emerald-700 font-semibold hover:underline"
                  >
                    <Mail size={13} /> {selected.parent_email}
                  </a>
                )}
              </Section>

              {/* Message du parent */}
              {selected.message && (
                <Section title="Message du parent" icon={MessageSquare}>
                  <p className="text-sm text-slate-600 leading-relaxed">{selected.message}</p>
                </Section>
              )}

              {/* Notes internes */}
              <Section title="Notes internes" icon={MessageSquare}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Notes visibles uniquement par votre équipe…"
                  className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
                />
                <button
                  onClick={() => saveNote(selected.id)}
                  disabled={updating}
                  className="mt-2 text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  {updating ? "Sauvegarde…" : "Sauvegarder la note"}
                </button>
              </Section>

              {/* Meta */}
              <p className="text-[11px] text-slate-400">
                Dossier reçu le {new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Icon size={11} /> {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#f5f5f5] last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-[#0a0a0a] text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-5xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="h-8 w-36 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white border border-[#ebebeb] rounded-xl" />)}
      </div>
      <div className="h-10 bg-white border border-[#ebebeb] rounded-xl" />
      <div className="bg-white border border-[#ebebeb] rounded-2xl">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 border-b border-[#f5f5f5] last:border-0" />)}
      </div>
    </div>
  );
}
