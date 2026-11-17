import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "CineCasa", template: "%s · CineCasa" },
  description: "O que tem de bom nos seus streamings hoje.",
};

export const viewport: Viewport = { themeColor: "#0f0f0f" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold">
            🎬 CineCasa
          </Link>
          <Link href="/busca" aria-label="Buscar filme" className="text-xl">
            🔍
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
