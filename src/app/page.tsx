"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Phone,
  School,
  GraduationCap,
  Baby,
  Building2,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Scale,
  Navigation,
  Heart,
  Menu,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const LocalSchoolMap = dynamic(() => import("@/components/LocalSchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <span className="text-xs text-slate-400 font-medium">Chargement de la carte…</span>
    </div>
  ),
});

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80",
];

const DEFAULT_CENTER = { lat: 4.0511, lng: 9.7679 }; // Douala

// ─── Data & Types ────────────────────────────────────────────────────────────

const categories = [
  {
    key: "garderie",
    label: "Garderie",
    icon: Baby,
    subcategories: ["Crèche", "Prématernelle", "Maternelle"],
  },
  {
    key: "primaire",
    label: "Primaire",
    icon: School,
    subcategories: ["Public", "Privé", "Confessionnel", "Bilingue"],
  },
  {
    key: "secondaire",
    label: "Secondaire",
    icon: Building2,
    subcategories: ["Lycée public", "Collège privé", "Technique", "Bilingue"],
  },
  {
    key: "superieur",
    label: "Supérieur",
    icon: GraduationCap,
    subcategories: ["Université", "Grande école", "Institut supérieur"],
  },
  {
    key: "autres",
    label: "Formations",
    icon: Wrench,
    subcategories: ["Santé", "Auto-école", "Couture", "Coiffure", "Hôtellerie", "Informatique", "Langues"],
  },
];

type School = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  city: string;
  quartier: string;
  phone: string;
  fees: number;
  registration: number;
  verified: boolean;
  isClaimed: boolean;
  onlinePayment: boolean;
  isFeatured: boolean;
  image: string | null;
  couleurPrimaire: string | null;
  couleurSecondaire: string | null;
  emojiLogo: string | null;
  infrastructure: string[];
  lat: number | null;
  lng: number | null;
};

const INFRA_LABELS: Record<string, string> = {
  library: "Bibliothèque",
  laboratory: "Laboratoire",
  computer_room: "Salle informatique",
  sports_field: "Terrain de sport",
  canteen: "Cantine",
  transport: "Transport",
  wifi: "Wi-Fi",
  boarding: "Internat",
  security: "Sécurité",
  infirmary: "Infirmerie",
};

function transformSchool(raw: any): School {
  const infra = raw.infrastructures?.[0] ?? {};
  const fee = raw.fees?.[0] ?? {};
  const infrastructure = Object.entries(infra as Record<string, unknown>)
    .filter(([key, val]) => val === true && key in INFRA_LABELS)
    .map(([key]) => INFRA_LABELS[key]);

  const firstSchoolImage: string | null = raw.school_images?.[0]?.url ?? null;
  const image: string | null = firstSchoolImage ?? raw.cover_image_url ?? null;

  return {
    id: raw.id,
    name: raw.name,
    category: raw.main_category ?? "",
    subcategory: raw.sub_category ?? "",
    city: raw.city ?? "",
    quartier: raw.quartier ?? raw.neighborhood ?? "",
    phone: raw.phone ?? "",
    fees: fee.tuition_fee ?? 0,
    registration: fee.registration_fee ?? 0,
    verified: raw.is_verified ?? false,
    isClaimed: raw.is_claimed ?? true,
    onlinePayment: raw.accepts_online_payment ?? false,
    isFeatured: raw.is_featured ?? false,
    image,
    couleurPrimaire: raw.couleur_primaire ?? null,
    couleurSecondaire: raw.couleur_secondaire ?? null,
    emojiLogo: raw.emoji_logo ?? null,
    infrastructure,
    lat: raw.latitude ?? null,
    lng: raw.longitude ?? null,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <div className="relative w-9 h-9 flex items-center justify-center">
        <div className="absolute inset-0 flex">
          <span className="flex-1 bg-emerald-600 rounded-l-lg" />
          <span className="flex-1 bg-red-500" />
          <span className="flex-1 bg-yellow-400 rounded-r-lg" />
        </div>
        <School size={18} className="relative z-10 text-white" />
      </div>
      <span className={`text-2xl font-black tracking-tight ${light ? "text-white" : "text-[#0a0a0a]"}`}>
        Écoles<span className="text-emerald-500">237</span>
      </span>
    </Link>
  );
}

function Money({ value }: { value: number }) {
  return <>{value.toLocaleString("fr-FR")} FCFA</>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState("5");
  const [compare, setCompare] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((i) => (i + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("establishments")
        .select(`
          id, name, main_category, sub_category,
          city, quartier, neighborhood, phone,
          cover_image_url, is_verified, is_claimed,
          accepts_online_payment, is_featured,
          couleur_primaire, couleur_secondaire, emoji_logo,
          latitude, longitude,
          fees(registration_fee, tuition_fee),
          infrastructures(library, laboratory, computer_room, sports_field, canteen, transport, wifi, boarding, security, infirmary),
          school_images(url)
        `)
        .order("is_featured", { ascending: false });
      if (data) setSchools(data.map(transformSchool));
      setLoading(false);
    }
    load();
  }, []);

  function handleLocationToggle() {
    if (useLocation) { setUseLocation(false); setUserLocation(null); return; }
    if (!navigator.geolocation) { alert("Géolocalisation non supportée."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setUseLocation(true); },
      () => alert("Position indisponible.")
    );
  }

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [prev[1], prev[2], id].filter(Boolean);
      return [...prev, id];
    });
  }

  const cities = useMemo(
    () => ["all", ...Array.from(new Set(schools.map((s) => s.city)))],
    [schools]
  );

  const mapCenter = userLocation ?? DEFAULT_CENTER;

  const nearbySchools = useMemo(() => {
    const withCoords = schools.filter((s): s is School & { lat: number; lng: number } => s.lat != null && s.lng != null);
    if (!userLocation) return withCoords.slice(0, 12);
    return withCoords
      .filter((s) => haversineKm(userLocation.lat, userLocation.lng, s.lat, s.lng) <= Number(radius))
      .slice(0, 30);
  }, [schools, userLocation, radius]);

  const filtered = schools.filter((s) => {
    if (activeCategory !== "all" && s.category !== activeCategory) return false;
    if (activeSubcategory !== "all" && s.subcategory.toLowerCase() !== activeSubcategory.toLowerCase()) return false;
    if (city !== "all" && s.city !== city) return false;
    if (useLocation && userLocation) {
      if (!s.lat || !s.lng) return false;
      if (haversineKm(userLocation.lat, userLocation.lng, s.lat, s.lng) > Number(radius)) return false;
    }
    if (query) {
      const t = `${s.name} ${s.city} ${s.quartier} ${s.category} ${s.subcategory}`.toLowerCase();
      if (!t.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const compareSchools = schools.filter((s) => compare.includes(s.id)).slice(0, 3);
  const activeCatObj = categories.find((c) => c.key === activeCategory);

  return (
    <div className="min-h-screen bg-[#f9f7f2] text-[#0a0a0a]">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-[#ebebeb]">
        <div className="max-w-screen-xl mx-auto px-5 h-[60px] flex items-center gap-6">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            <button
              onClick={() => { setActiveCategory("all"); setActiveSubcategory("all"); }}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeCategory === "all" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-[#0a0a0a]"}`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <div key={cat.key} className="relative group">
                <Link
                  href={`/categorie/${cat.key}`}
                  className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 text-slate-500 hover:text-[#0a0a0a]"
                >
                  {cat.label}
                  <ChevronDown size={13} className="opacity-50" />
                </Link>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="bg-white border border-[#ebebeb] rounded-xl shadow-lg py-1.5 min-w-[180px]">
                    <Link
                      href={`/categorie/${cat.key}`}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      Tout voir <ChevronRight size={12} />
                    </Link>
                    <div className="border-t border-[#f5f5f5] my-1" />
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        href={`/categorie/${cat.key}?sous=${encodeURIComponent(sub)}`}
                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 block"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Link href="/auth/connexion" className="text-sm font-semibold text-slate-600 hover:text-[#0a0a0a] transition-colors">
              Connexion
            </Link>
            <Link href="/auth/inscription" className="bg-[#0a0a0a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
              Inscrire mon école
            </Link>
          </div>

          <button className="lg:hidden ml-auto p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#ebebeb] bg-white px-5 py-4 space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={`/categorie/${cat.key}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between"
              >
                {cat.label}
                <ChevronRight size={14} className="text-slate-300" />
              </Link>
            ))}
            <div className="pt-3 border-t border-[#ebebeb] flex flex-col gap-2 mt-2">
              <Link href="/auth/connexion" className="px-3 py-2.5 text-sm font-semibold">Connexion</Link>
              <Link href="/auth/inscription" className="bg-[#0a0a0a] text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center">Inscrire mon école</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative pt-[60px] pb-40 bg-[linear-gradient(165deg,#03130d_0%,#0a3d28_25%,#0f9d68_65%,#37ac80_71%,#5fbc97_77%,#87cbaf_83%,#b0dbc7_89%,#d8eade_95%,#f9f7f2_100%)] text-white overflow-hidden">
        <div className="relative max-w-screen-xl mx-auto px-5 grid lg:grid-cols-[0.9fr_1.4fr] items-center gap-10 py-16 lg:py-20">

          <div className="py-20 lg:py-0">
            <div className="flex items-center gap-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="ml-2 text-sm font-semibold tracking-[0.15em] uppercase text-slate-300">
                Plateforme éducative · Cameroun
              </span>
            </div>

            <p className="text-slate-400 text-base lg:text-lg max-w-[420px] mb-8 leading-relaxed mt-6">
              Comparez les établissements, consultez les frais et les infrastructures, et postulez en ligne en quelques minutes.
            </p>

            {/* Local search card with map */}
            <div className="bg-white text-[#0a0a0a] rounded-2xl p-4 max-w-[500px] shadow-xl">
              {/* Category quick filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => { setActiveCategory("all"); setActiveSubcategory("all"); }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 ${activeCategory === "all" ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                >
                  Tout voir
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); setActiveSubcategory("all"); }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 ${activeCategory === cat.key ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-3 focus-within:border-emerald-400 transition-colors">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder-slate-400"
                  placeholder="Nom, ville, niveau, type d'établissement…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-700">
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="rounded-xl overflow-hidden h-[200px] mb-3 border border-slate-200">
                <LocalSchoolMap
                  center={mapCenter}
                  userLocation={userLocation}
                  radiusKm={Number(radius)}
                  schools={nearbySchools}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLocationToggle}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${useLocation ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Navigation size={13} />
                  {useLocation ? "Position active" : "Écoles autour de moi"}
                </button>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-semibold bg-white focus:outline-none max-w-[110px]"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c === "all" ? "Toutes les villes" : c}</option>
                  ))}
                </select>
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="2">2 km</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-8">
              <div>
                <p className="text-2xl font-black">{schools.length || "—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">Établissements</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-black">{cities.length - 1 || "—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">Villes</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-black">Gratuit</p>
                <p className="text-xs text-slate-500 mt-0.5">Pour les parents</p>
              </div>
            </div>
          </div>

          {/* Hero image carousel — landscape card */}
          <div className="hidden lg:block relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl">
            {HERO_IMAGES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroSlide ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#03130d]/80 via-transparent to-transparent" />

            {/* Carousel dots */}
            <div className="absolute top-5 right-5 flex gap-1.5 z-10">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === heroSlide ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>

            {/* Floating card */}
            <div className="absolute bottom-5 left-5 right-5 bg-white text-[#0a0a0a] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Pour votre école</p>
                <p className="font-black text-base leading-tight">Votre page visible dans tout le Cameroun.</p>
              </div>
              <Link
                href="/auth/inscription"
                className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600 transition-colors"
              >
                Inscrire
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-5 py-12">

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => { setActiveCategory("all"); setActiveSubcategory("all"); }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all shrink-0 ${activeCategory === "all" ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "border-[#ddd] text-slate-600 hover:border-[#aaa]"}`}
          >
            Tout voir
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setActiveSubcategory("all"); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all shrink-0 ${activeCategory === cat.key ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "border-[#ddd] text-slate-600 hover:border-[#aaa]"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sub-categories when a category is active */}
        {activeCatObj && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveSubcategory("all")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${activeSubcategory === "all" ? "bg-emerald-600 text-white border-emerald-600" : "border-[#ddd] text-slate-500 hover:border-slate-400"}`}
            >
              Tous
            </button>
            {activeCatObj.subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${activeSubcategory === sub ? "bg-emerald-600 text-white border-emerald-600" : "border-[#ddd] text-slate-500 hover:border-slate-400"}`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Filters row */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${filtersOpen ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "border-[#ddd] hover:border-[#aaa]"}`}
          >
            <SlidersHorizontal size={15} />
            Filtres
          </button>

          {city !== "all" && (
            <span className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-200">
              {city}
              <button onClick={() => setCity("all")}><X size={13} /></button>
            </span>
          )}

          {useLocation && (
            <span className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-200">
              À moins de {radius} km
              <button onClick={() => { setUseLocation(false); setUserLocation(null); }}><X size={13} /></button>
            </span>
          )}

          <span className="ml-auto text-sm text-slate-400 font-medium">
            {loading ? "Chargement…" : <><span className="text-[#0a0a0a] font-bold">{filtered.length}</span> résultat{filtered.length !== 1 ? "s" : ""}</>}
          </span>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-5 mb-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ville</label>
              <select
                className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#aaa]"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c === "all" ? "Toutes les villes" : c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rayon de recherche</label>
              <select
                className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#aaa]"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              >
                <option value="2">2 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleLocationToggle}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${useLocation ? "bg-emerald-600 text-white border-emerald-600" : "border-[#ddd] hover:border-[#aaa]"}`}
              >
                <Navigation size={15} />
                {useLocation ? "Position active" : "Utiliser ma position"}
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setCity("all"); setUseLocation(false); setUserLocation(null); setActiveCategory("all"); setActiveSubcategory("all"); setQuery(""); }}
                className="w-full px-4 py-2.5 rounded-lg border border-[#ddd] text-sm font-semibold text-slate-500 hover:border-[#aaa] transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          <div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">

              {/* Skeletons */}
              {loading && [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-[#ebebeb] animate-pulse">
                  <div className="h-48 bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-9 bg-slate-100 rounded-lg mt-4" />
                  </div>
                </div>
              ))}

              {/* School cards */}
              {!loading && filtered.map((school) => {
                const dist = userLocation && school.lat && school.lng
                  ? haversineKm(userLocation.lat, userLocation.lng, school.lat, school.lng)
                  : null;
                const inCompare = compare.includes(school.id);

                return (
                  <div
                    key={school.id}
                    className="group bg-white rounded-xl overflow-hidden border border-[#ebebeb] hover:border-[#ccc] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Image / Fallback */}
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      {school.image ? (
                        <img
                          src={school.image}
                          alt={school.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : school.couleurPrimaire && school.couleurSecondaire ? (
                        <div
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                          style={{ background: `linear-gradient(135deg, ${school.couleurPrimaire}, ${school.couleurSecondaire})` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <span className="text-5xl">{school.emojiLogo ?? "🏫"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                      {/* Emoji badge top-left (quand pas sponsorisé) */}
                      {school.emojiLogo && !school.isFeatured && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-base leading-none px-2 py-1 rounded-xl">
                          {school.emojiLogo}
                        </span>
                      )}

                      {school.isFeatured && (
                        <span className="absolute top-3 left-3 bg-yellow-400 text-[#0a0a0a] text-[11px] font-black px-2.5 py-1 rounded-full tracking-wide">
                          SPONSORISÉ
                        </span>
                      )}

                      <div className="absolute top-3 right-3 flex gap-1.5">
                        <button
                          onClick={(e) => { e.preventDefault(); toggleCompare(school.id); }}
                          className={`backdrop-blur-sm rounded-full p-1.5 transition-colors ${inCompare ? "bg-emerald-600 text-white" : "bg-white/90 text-slate-600 hover:text-emerald-600"}`}
                        >
                          <Scale size={13} />
                        </button>
                        <button className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 text-slate-600 hover:text-red-500 transition-colors">
                          <Heart size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
                          {school.category}{school.subcategory ? ` · ${school.subcategory}` : ""}
                        </span>
                        {school.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={9} /> Vérifiée
                          </span>
                        )}
                        {!school.isClaimed && (
                          <span className="text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
                            Non revendiquée
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-[15px] leading-snug text-[#0a0a0a] mb-1.5 line-clamp-2">
                        {school.name}
                      </h3>

                      <p className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <MapPin size={11} />
                        {school.quartier ? `${school.quartier}, ` : ""}{school.city}
                        {dist !== null && (
                          <span className="ml-1 text-emerald-600 font-semibold">· {dist.toFixed(1)} km</span>
                        )}
                      </p>

                      {school.phone ? (
                        <a
                          href={`tel:${school.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 transition-colors mb-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={11} />
                          {school.phone}
                        </a>
                      ) : (
                        <div className="mb-3" />
                      )}

                      {school.fees > 0 && (
                        <p className="text-xs text-slate-500 mb-3">
                          À partir de <span className="font-bold text-[#0a0a0a]"><Money value={school.fees} /></span>/an
                        </p>
                      )}

                      {school.infrastructure.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {school.infrastructure.slice(0, 3).map((item) => (
                            <span key={item} className="text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                              {item}
                            </span>
                          ))}
                          {school.infrastructure.length > 3 && (
                            <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                              +{school.infrastructure.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {school.isClaimed ? (
                        <Link
                          href={`/ecole/${school.id}`}
                          className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-600 transition-colors group/link"
                        >
                          Voir la fiche
                          <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      ) : (
                        <Link
                          href={`/auth/inscription?ecole=${school.id}`}
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0a0a0a] transition-colors group/link"
                        >
                          Revendiquer cette page
                          <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <div className="sm:col-span-2 xl:col-span-3 py-20 text-center">
                  <p className="text-4xl mb-4">🏫</p>
                  <h3 className="text-xl font-bold mb-2">Aucun résultat</h3>
                  <p className="text-slate-500 text-sm">Modifiez vos filtres ou élargissez votre recherche.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar compare */}
          <aside className="hidden lg:block sticky top-[80px]">
            <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#ebebeb]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Comparaison</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${compareSchools.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {compareSchools.length}/3
                  </span>
                </div>
              </div>

              <div className="p-4">
                {compareSchools.length === 0 ? (
                  <div className="text-center py-6">
                    <Scale size={28} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cliquez sur <Scale size={11} className="inline" /> sur une carte pour comparer jusqu'à 3 écoles.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {compareSchools.map((school) => (
                      <div key={school.id} className="border border-[#ebebeb] rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-sm leading-snug">{school.name}</p>
                          <button onClick={() => toggleCompare(school.id)} className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5">
                            <X size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{school.city}{school.subcategory ? ` · ${school.subcategory}` : ""}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-slate-400 mb-0.5">Inscription</p>
                            <p className="font-bold text-[11px]">
                              {school.registration > 0 ? <Money value={school.registration} /> : "—"}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-slate-400 mb-0.5">Scolarité</p>
                            <p className="font-bold text-[11px]">
                              {school.fees > 0 ? <Money value={school.fees} /> : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {compareSchools.length >= 2 && (
                      <button className="w-full bg-[#0a0a0a] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
                        Comparer côte à côte
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTA card */}
            <div className="mt-4 bg-[#0a0f0d] text-white rounded-2xl p-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3">
                Vous gérez une école ?
              </p>
              <p className="font-bold text-base leading-snug mb-4">
                Inscrivez votre établissement et recevez des demandes de parents.
              </p>
              <Link
                href="/auth/inscription"
                className="flex items-center justify-center gap-2 bg-yellow-400 text-[#0a0a0a] px-4 py-2.5 rounded-xl text-sm font-black hover:bg-yellow-300 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* ── CTA SECTION ────────────────────────────────────────────── */}
      <section className="bg-[#0a0f0d] text-white">
        <div className="max-w-screen-xl mx-auto px-5 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-emerald-400 mb-4">
              Pour les établissements
            </p>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-6">
              Votre école visible<br />dans tout le Cameroun.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
              Créez votre page, publiez vos tarifs, votre galerie et recevez des demandes de préinscription directement depuis la plateforme.
            </p>
            <Link
              href="/auth/inscription"
              className="inline-flex items-center gap-2 bg-yellow-400 text-[#0a0a0a] px-6 py-3.5 rounded-xl font-black text-sm hover:bg-yellow-300 transition-colors"
            >
              Inscrire mon établissement
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Page dédiée", desc: "Photos, tarifs, documents, annonces" },
              { title: "Pré-inscriptions", desc: "Recevez et gérez les dossiers en ligne" },
              { title: "Vérification", desc: "Badge officiel pour rassurer les parents" },
              { title: "Statistiques", desc: "Suivez vos vues et vos candidatures" },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mb-4" />
                <p className="font-bold text-sm mb-1">{item.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-[#070a08] text-white border-t border-white/5">
        <div className="max-w-screen-xl mx-auto px-5 py-14 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Logo light />
            <p className="text-slate-500 text-sm mt-4 leading-relaxed max-w-[220px]">
              La plateforme camerounaise pour trouver et comparer les établissements éducatifs.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">Navigation</p>
            <div className="space-y-2.5">
              {["Accueil", "Recherche", "Comparer"].map((l) => (
                <p key={l} className="text-sm text-slate-400 hover:text-white cursor-pointer transition-colors">{l}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">Catégories</p>
            <div className="space-y-2.5">
              {categories.map((cat) => (
                <p key={cat.key} className="text-sm text-slate-400 hover:text-white cursor-pointer transition-colors">{cat.label}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">Écoles</p>
            <div className="space-y-2.5">
              {["Inscrire mon établissement", "Pack premium", "Dashboard"].map((l) => (
                <p key={l} className="text-sm text-slate-400 hover:text-white cursor-pointer transition-colors">{l}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 max-w-screen-xl mx-auto px-5 py-5 flex justify-between items-center text-xs text-slate-600">
          <span>© 2025 Écoles237. Tous droits réservés.</span>
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-600" />
          </div>
        </div>
      </footer>
    </div>
  );
}
