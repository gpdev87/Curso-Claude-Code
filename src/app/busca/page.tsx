import type { Metadata } from "next";
import { PosterCard } from "@/components/PosterCard";
import { searchMovies } from "@/lib/tmdb/search";

export const metadata: Metadata = { title: "Buscar filme" };

export default async function SearchPage({ searchParams }: PageProps<"/busca">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const results = await searchMovies(query);

  return (
    <div className="px-4 pt-24 md:px-12 md:pt-28">
      <form action="/busca" method="get" role="search" className="relative max-w-2xl">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-apagado"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Nome do filme"
          aria-label="Buscar filme"
          autoFocus
          className="w-full rounded-lg border border-white/15 bg-poltrona py-3.5 pl-13 pr-4 text-lg outline-none placeholder:text-apagado focus:border-projetor"
        />
      </form>

      {!query && <p className="mt-4 text-sm text-apagado">Digite o nome e aperte Enter para ver onde assistir.</p>}

      {query && results.length === 0 && (
        <p className="mt-8 text-apagado">
          Nenhum filme encontrado para &quot;{query}&quot;. Confira a grafia ou tente o título original.
        </p>
      )}

      {results.length > 0 && (
        <>
          <h1 className="mt-10 font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
            Resultados para “{query}”
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 [&>a]:w-auto">
            {results.map((movie) => (
              <PosterCard key={movie.id} movie={movie} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
