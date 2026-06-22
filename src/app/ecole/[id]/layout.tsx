import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from("establishments")
    .select("name, city, main_category, description")
    .eq("id", params.id)
    .single();

  if (!data) {
    return {
      title: "École introuvable — Écoles237",
      description: "Cet établissement n'existe pas sur Écoles237.",
    };
  }

  const title = `${data.name} — ${data.city} | Écoles237`;
  const description = data.description
    ? data.description.slice(0, 155)
    : `Découvrez ${data.name}, établissement ${data.main_category} à ${data.city}. Préinscription en ligne sur Écoles237.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_CM",
      siteName: "Écoles237",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
