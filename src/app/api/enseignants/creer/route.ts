import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: etablissement } = await supabase
    .from("establishments")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!etablissement?.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const { nom, prenom, email, taux_horaire, type_contrat } = body as {
    nom?: string; prenom?: string; email?: string;
    taux_horaire?: number; type_contrat?: string;
  };

  if (!nom?.trim() || !prenom?.trim()) {
    return NextResponse.json({ error: "Nom et prénom sont requis" }, { status: 400 });
  }

  // Génère un code_pointage à 4 chiffres unique pour cet établissement
  const { data: existingCodes } = await supabase
    .from("enseignants")
    .select("code_pointage")
    .eq("etablissement_id", etablissement.id)
    .not("code_pointage", "is", null);

  const used = new Set((existingCodes ?? []).map((e) => e.code_pointage));
  let code = "";
  for (let i = 0; i < 200; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000).toString();
    if (!used.has(candidate)) { code = candidate; break; }
  }
  if (!code) {
    return NextResponse.json({ error: "Impossible de générer un code unique (établissement complet)" }, { status: 500 });
  }

  const { data: enseignant, error } = await supabase
    .from("enseignants")
    .insert({
      etablissement_id: etablissement.id,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email?.trim() || null,
      taux_horaire: taux_horaire ?? null,
      type_contrat: type_contrat?.trim() || null,
      code_pointage: code,
    })
    .select("id, nom, prenom, code_pointage")
    .single();

  if (error) {
    return NextResponse.json({ error: `Échec de création : ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enseignant });
}
