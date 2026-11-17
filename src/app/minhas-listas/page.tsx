import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MyListGrid } from "@/components/MyListGrid";
import { parseListTab } from "@/lib/list-tab";
import { listMarks } from "@/lib/marks";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Minhas listas" };

export default async function MinhasListasPage({ searchParams }: PageProps<"/minhas-listas">) {
  await connection();
  if (!(await getCurrentUser())) redirect("/entrar?next=" + encodeURIComponent("/minhas-listas"));

  const tab = parseListTab((await searchParams).lista);
  const marks = await listMarks();
  const quero = marks.filter((m) => m.status === "quero");
  const visto = marks.filter((m) => m.status === "visto");

  const tabs = [
    { key: "quero", label: `Quero assistir (${quero.length})`, href: "/minhas-listas" },
    { key: "visto", label: `Já assisti (${visto.length})`, href: "/minhas-listas?lista=visto" },
  ] as const;

  return (
    <div className="px-4 pt-24 md:px-12 md:pt-28">
      <h1 className="font-display text-4xl font-black uppercase tracking-tight md:text-5xl">Minhas listas</h1>

      <nav aria-label="Listas" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={tab === t.key ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              tab === t.key
                ? "border-projetor bg-projetor text-sala"
                : "border-white/20 text-texto hover:border-projetor hover:text-projetor"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <MyListGrid marks={tab === "quero" ? quero : visto} tab={tab} />
      </div>
    </div>
  );
}
