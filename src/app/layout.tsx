import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OdontoCloud — Plataforma Odontológica Profissional",
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
