// POST /api/enseignants/[id]/inviter
// Réservé au propriétaire de l'établissement.
// Envoie une invitation Supabase par email à l'enseignant, avec role='teacher'
// dans les métadonnées — le trigger handle_new_user l'utilisera pour créer
// le profil avec le bon rôle.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: enseignantId } = await params;

  // Vérification de la session directeur
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

  // Récupération de l'enseignant (vérifie qu'il appartient à cet établissement)
  const { data: enseignant } = await supabase
    .from("enseignants")
    .select("id, nom, prenom, email, user_id")
    .eq("id", enseignantId)
    .eq("etablissement_id", etablissement.id)
    .single();

  if (!enseignant) {
    return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 });
  }
  if (!enseignant.email) {
    return NextResponse.json(
      { error: "Cet enseignant n'a pas d'email renseigné — ajoutez-en un avant d'inviter" },
      { status: 400 }
    );
  }
  if (enseignant.user_id) {
    return NextResponse.json(
      { error: "Cet enseignant a déjà un compte actif" },
      { status: 409 }
    );
  }

  // Envoi de l'invitation via service role
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(enseignant.email, {
    data: { role: "teacher" },
    redirectTo: `${origin}/auth/callback`,
  });

  if (inviteError) {
    // L'utilisateur existe déjà dans auth.users (invitation déjà envoyée ou compte existant)
    if (inviteError.message?.includes("already been registered")) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email — l'enseignant peut se connecter directement" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: `Échec de l'invitation : ${inviteError.message}` },
      { status: 500 }
    );
  }

  // Enregistrement de la date d'envoi
  await supabase
    .from("enseignants")
    .update({ invite_envoyee_le: new Date().toISOString() })
    .eq("id", enseignantId);

  return NextResponse.json({
    ok: true,
    message: `Invitation envoyée à ${enseignant.prenom} ${enseignant.nom} (${enseignant.email})`,
  });
}
