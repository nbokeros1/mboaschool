import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: "Écoles237 — Trouver et inscrire dans une école au Cameroun",
    template: "%s | Écoles237",
  },
  description:
    "Annuaire scolaire camerounais : trouvez, comparez et préinscrivez votre enfant dans les meilleures écoles de Yaoundé, Douala et partout au Cameroun.",
  keywords: ["école cameroun", "inscription scolaire", "école yaoundé", "école douala", "préinscription", "annuaire scolaire"],
  openGraph: {
    type: "website",
    locale: "fr_CM",
    siteName: "Écoles237",
    title: "Écoles237 — Trouver et inscrire dans une école au Cameroun",
    description:
      "Annuaire scolaire camerounais : trouvez, comparez et préinscrivez votre enfant dans les meilleures écoles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Écoles237",
    description: "Annuaire scolaire camerounais — Préinscription en ligne.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
