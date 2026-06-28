import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UP! Estudio | Maquillaje y Uñas en Bahía Blanca, Buenos Aires",
    template: "%s | UP! Estudio",
  },
  description:
    "Servicios de maquillaje social, maquillaje de novias y estética de uñas en Bahía Blanca, Buenos Aires. +7 años de experiencia. Reservá tu turno online.",
  keywords: [
    "maquillaje",
    "maquillaje social",
    "maquillaje de novias",
    "uñas",
    "semipermanente",
    "soft gel",
    "poligel",
    "estética",
    "belleza",
    "Bahía Blanca, Buenos Aires",
    " Argentina",
  ],
  authors: [{ name: "UP! Estudio" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "UP! Estudio",
    title: "UP! Estudio | Maquillaje y Uñas en Bahía Blanca, Buenos Aires",
    description:
      "Servicios de maquillaje social, maquillaje de novias y estética de uñas. +7 años de experiencia. Reservá tu turno online.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UP! Estudio | Maquillaje y Uñas en Bahía Blanca, Buenos Aires",
    description:
      "Servicios de maquillaje social, maquillaje de novias y estética de uñas. +7 años de experiencia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
