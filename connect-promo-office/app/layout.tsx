import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connect Promo — Escritório Virtual",
  description: "Escritório e histórico das operações da Connect Promo.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
