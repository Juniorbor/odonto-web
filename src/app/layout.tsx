import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toaster";

const inter = localFont({
  src: "../fonts/inter-var.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Odontoweb — Plataforma Odontológica Profissional",
  description:
    "Plataforma completa de gestão odontológica: pacientes, anamnese, odontograma, radiografias, IA, produção, financeiro e relatórios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-text">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
