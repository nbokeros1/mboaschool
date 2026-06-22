"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchool } from "@/lib/useSchool";
import { ImageIcon, Plus, Trash2, Upload, X } from "lucide-react";

const BUCKET = "school-images";
const MAX_MB = 5;

export default function GaleriePage() {
  const { school, loading: schoolLoading } = useSchool();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
      .from("school_images")
      .select("*")
      .eq("establishment_id", school!.id)
      .order("created_at", { ascending: false });
    if (data) setImages(data);
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
    setPreview(URL.createObjectURL(picked));
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

    const { error: dbError } = await supabase.from("school_images").insert({
      establishment_id: school.id,
      url: publicUrl,
      storage_path: path,
      caption: caption.trim() || null,
    });

    setUploading(false);
    if (dbError) { setError(dbError.message); return; }

    setFile(null);
    setCaption("");
    setPreview(null);
    setShowForm(false);
    if (inputRef.current) inputRef.current.value = "";
    load();
  }

  async function deleteImage(img: any) {
    await supabase.storage.from(BUCKET).remove([img.storage_path]);
    await supabase.from("school_images").delete().eq("id", img.id);
    load();
  }

  function cancelForm() {
    setShowForm(false);
    setFile(null);
    setCaption("");
    setPreview(null);
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
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Galerie</h1>
        </div>
        <button
          onClick={() => (showForm ? cancelForm() : setShowForm(true))}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Annuler" : "Ajouter une photo"}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={upload} className="bg-white border border-[#ebebeb] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Nouvelle photo</h2>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-[#e0e0e0] rounded-xl p-8 text-center cursor-pointer hover:border-[#aaa] transition-colors mb-4"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Cliquez pour choisir une image</p>
                <p className="text-[11px] text-slate-300 mt-1">JPG, PNG, WEBP — max {MAX_MB} Mo</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Légende (optionnel)
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex : Salle de classe principale, Cantine…"
              className="w-full border border-[#ddd] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Upload size={15} />}
            {uploading ? "Envoi en cours…" : "Publier la photo"}
          </button>
        </form>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white border border-[#ebebeb] rounded-2xl py-16 text-center">
          <ImageIcon size={28} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-semibold text-slate-400">Aucune photo publiée</p>
          <p className="text-xs text-slate-300 mt-1">Les photos apparaîtront sur votre fiche publique</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative bg-white border border-[#ebebeb] rounded-2xl overflow-hidden">
              <img
                src={img.url}
                alt={img.caption ?? "Photo"}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 truncate">{img.caption || "—"}</p>
                <button
                  onClick={() => deleteImage(img)}
                  className="shrink-0 text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
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
          <div className="h-8 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-44 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[4/3] bg-white border border-[#ebebeb] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
