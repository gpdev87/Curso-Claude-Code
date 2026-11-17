import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { signOut } from "@/app/entrar/actions";
import { siteUrl } from "@/lib/site";
import { getCurrentUser } from "@/lib/supabase/server";
import "./globals.css";

const shoulders = Big_Shoulders({ variable: "--font-shoulders", subsets: ["latin"] });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "CineCasa", template: "%s · CineCasa" },
  description: "O que tem de bom nos seus streamings hoje.",
};

export const viewport: Viewport = { themeColor: "#0c0d11" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="pt-BR" className={`${shoulders.variable} ${instrument.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader userEmail={user?.email ?? null} signOutAction={signOut} />
        <main className="w-full flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
