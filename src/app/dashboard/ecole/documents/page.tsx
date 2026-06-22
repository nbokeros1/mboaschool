"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { FileText, Plus, Trash2, Upload, X, Download } from "lucide-react";

const BUCKET = "school-documents";
const MAX_MB = 10;

const DOC_TYPES = [
  { value: "fiche",       label: "Fiche de renseignements" },
  { value: "inscription", label: "Fiche d'inscription" },
  { value: "fournitures", label: "Liste des fournitures" },
  { value: "reglement",   label: "Règlement intérieur" },
  { value: "calendrier",  label: "Calendrier scolaire" },
  { value: "autre",       label: "Autre document" },
];

export default function DocumentsPage() {
  const { school, loading: schoolLoading } = useSchool();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("fiche");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!school) return;
    load();
  }, [school]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("school_documents")
      .select("*")
      .eq("establishment_id", school!.id)
      .order("created_at", { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_MB} Mo).`);
      return;
    }
    setError("");
    setFile(picked);
    if (!name) setName(picked.name.replace(/\.[^/.]+$/, ""));
  }

  async function upload(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!file || !school) return;
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${school.id}/${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (storageError) {
      setError(storageError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    const { error: dbError } = await supabase.from("school_documents").insert({
      establishment_id: school.id,
      name: name.trim() || file.name,
      type,
      url: publicUrl,
      storage_path: path,
    });

    setUploading(false);
    if (dbError) { setError(dbError.message); return; }

    cancelForm();
    load();
  }

  async function deleteDoc(doc: any) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    await supabase.from("school_documents").delete().eq("id", doc.id);
    load();
  }

  function cancelForm() {
    setShowForm(false);
    setFile(null);
    setName("");
    setType("fiche");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (schoolLoading) return <Skeleton />;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Documents</h1>
        </div>
        <button
          onClick={() => (showForm ? cancelForm() : setShowForm(true))}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Annuler" : "Ajouter un document"}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={upload} className="bg-white border border-[#ebebeb] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Nouveau document</h2>
          <div className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Type de document
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0a0a0a] transition-colors"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nom affiché
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Liste de fournitures 2025-2026"
                className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Fichier (PDF, Word — max {MAX_MB} Mo)
              </label>
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-[#e0e0e0] rounded-xl p-6 text-center cursor-pointer hover:border-[#aaa] transition-colors"
              >
                {file ? (
                  <p className="text-sm font-semibold text-[#0a0a0a]">{file.name}</p>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">Cliquez pour choisir un fichier</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <button
            type="submit"
            disabled={!file || uploading}
            className="mt-5 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Upload size={15} />}
            {uploading ? "Envoi en cours…" : "Publier le document"}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white border border-[#ebebeb] rounded-2xl py-16 text-center">
          <FileText size={28} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-semibold text-slate-400">Aucun document publié</p>
          <p className="text-xs text-slate-300 mt-1">Les documents apparaîtront sur votre fiche publique</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const typeLabel = DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type;
            return (
              <div
                key={doc.id}
                className="group bg-white border border-[#ebebeb] rounded-2xl p-4 flex items-center gap-4 hover:border-[#ccc] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#ebebeb] flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0a0a0a] truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{typeLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => deleteDoc(doc)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-28 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-48 bg-slate-200 rounded-xl" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-white border border-[#ebebeb] rounded-2xl" />
      ))}
    </div>
  );
}
