import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KNOROOMS — Gestión Académica Multi-Tenant para Colegios de RD",
  description:
    "Plataforma SaaS multi-tenant de gestión académica e institucional para centros educativos de la República Dominicana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
