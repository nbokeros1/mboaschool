import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: etablissement } = await supabase
    .from("establishments")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!etablissement?.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { titre, contenu, canal, departement_disciplinaire } = body as {
    titre?: string;
    contenu?: string;
    canal?: string;
    departement_disciplinaire?: string;
  };

  if (!titre?.trim() || !contenu?.trim()) {
    return NextResponse.json({ error: "Titre et contenu sont requis" }, { status: 400 });
  }
  if (!canal || !["global", "departement"].includes(canal)) {
    return NextResponse.json({ error: "Canal invalide — doit être 'global' ou 'departement'" }, { status: 400 });
  }
  if (canal === "departement" && !departement_disciplinaire?.trim()) {
    return NextResponse.json(
      { error: "Le département disciplinaire est requis pour un message ciblé" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("messages").insert({
    etablissement_id:          etablissement.id,
    auteur_id:                 user.id,
    canal,
    departement_disciplinaire: canal === "departement" ? departement_disciplinaire!.trim() : null,
    titre:                     titre.trim(),
    contenu:                   contenu.trim(),
  });

  if (error) {
    return NextResponse.json({ error: `Échec d'enregistrement : ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
