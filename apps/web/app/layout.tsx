import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "N'djar | Plataforma agrícola Quinara/Buba",
  description:
    "Overview público do MVP N'djar para dados agrícolas, apoio técnico e piloto Sul em Quinara/Buba.",
  applicationName: "N'djar",
  keywords: [
    "N'djar",
    "agricultura",
    "Guiné-Bissau",
    "Quinara",
    "Buba",
    "pH do solo",
    "Médico Agrícola",
  ],
  openGraph: {
    title: "N'djar",
    description:
      "MVP agrícola para dados locais, consultas técnicas e operação do piloto Quinara/Buba.",
    locale: "pt_PT",
    siteName: "N'djar",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
